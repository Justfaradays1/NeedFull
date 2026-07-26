import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { query, withTransaction } from "../config/db.js";
import env from "../config/env.js";
import { generateToken } from "./authController.js";

const googleClient = new OAuth2Client(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  `${env.FRONTEND_URL}/api/auth/google/callback`,
);

const SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

interface PendingRegistration {
  googleId: string;
  email: string;
  name: string;
  avatar: string | null;
  expiresAt: number;
}

const pendingRegistrations = new Map<string, PendingRegistration>();

function generateState(): string {
  const state = uuidv4();
  const expires = Date.now() + 10 * 60 * 1000;
  const data = JSON.stringify({ state, expires });
  return Buffer.from(data).toString("base64url");
}

function verifyState(encoded: string): { valid: boolean } {
  try {
    const data = JSON.parse(Buffer.from(encoded, "base64url").toString());
    return { valid: data.expires > Date.now() };
  } catch {
    return { valid: false };
  }
}

export async function googleAuth(_req: Request, res: Response): Promise<void> {
  if (!env.GOOGLE_CLIENT_ID) {
    res.status(501).json({ error: "Google OAuth is not configured" });
    return;
  }

  const state = generateState();

  const authUrl = googleClient.generateAuthUrl({
    access_type: "online",
    scope: SCOPES,
    include_granted_scopes: true,
    state,
  });

  res.redirect(authUrl);
}

export async function googleCallback(req: Request, res: Response): Promise<void> {
  const { code, state } = req.query;

  const errorRedirect = (action: string, error: string) => {
    res.redirect(`${env.FRONTEND_URL}/google/success?action=${action}&error=${error}`);
  };

  if (!code || typeof code !== "string") {
    errorRedirect("complete", "google_auth_failed");
    return;
  }

  if (!state || typeof state !== "string") {
    errorRedirect("complete", "google_invalid_state");
    return;
  }

  const { valid } = verifyState(state);
  if (!valid) {
    errorRedirect("complete", "google_state_expired");
    return;
  }

  try {
    let tokens;
    try {
      const result = await googleClient.getToken({ code, redirect_uri: `${env.FRONTEND_URL}/api/auth/google/callback` });
      tokens = result.tokens;
    } catch (tokenErr: any) {
      console.error("[Google] getToken error:", tokenErr.response?.data || tokenErr.message || tokenErr);
      errorRedirect("complete", "google_auth_failed");
      return;
    }
    const idToken = tokens.id_token;
    if (!idToken) {
      console.error("[Google] Missing id_token in token response");
      errorRedirect("complete", "google_auth_failed");
      return;
    }

    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken,
        audience: env.GOOGLE_CLIENT_ID,
      });
    } catch (verifyErr: any) {
      console.error("[Google] verifyIdToken error:", verifyErr.response?.data || verifyErr.message || verifyErr);
      errorRedirect("complete", "google_auth_failed");
      return;
    }

    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.email_verified) {
      errorRedirect("complete", "google_email_not_verified");
      return;
    }

    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name || email.split("@")[0];
    const avatarUrl = payload.picture || null;

    const existingById = await query<{ id: string; email: string; role: string }>(
      "SELECT id, email, role FROM users WHERE google_id = $1", [googleId],
    );

    if (existingById.rows.length > 0) {
      const u = existingById.rows[0];
      const accessToken = generateToken({ sub: u.id, role: u.role as "user" | "admin", email: u.email }, env.JWT_ACCESS_EXPIRES_IN);
      const refreshToken = generateToken({ sub: u.id }, env.JWT_REFRESH_EXPIRES_IN);
      await query("UPDATE users SET last_seen_at = NOW() WHERE id = $1", [u.id]);
      res.redirect(
        `${env.FRONTEND_URL}/google/success?action=login&accessToken=${encodeURIComponent(accessToken)}&refreshToken=${encodeURIComponent(refreshToken)}`,
      );
      return;
    }

    const existingByEmail = await query<{ id: string; google_id: string | null }>(
      "SELECT id, google_id FROM users WHERE email = $1", [email],
    );

    if (existingByEmail.rows.length > 0) {
      const existing = existingByEmail.rows[0];
      if (!existing.google_id) {
        res.redirect(`${env.FRONTEND_URL}/google/success?action=link&email=${encodeURIComponent(email)}`);
        return;
      }
      res.redirect(`${env.FRONTEND_URL}/google/success?action=link&error=already_linked&email=${encodeURIComponent(email)}`);
      return;
    }

    // No existing account — generate registration code for onboarding
    const regCode = uuidv4();
    pendingRegistrations.set(regCode, {
      googleId,
      email,
      name,
      avatar: avatarUrl,
      expiresAt: Date.now() + 15 * 60 * 1000,
    });

    // Clean up expired entries periodically
    if (pendingRegistrations.size > 100) {
      for (const [key, val] of pendingRegistrations) {
        if (val.expiresAt < Date.now()) pendingRegistrations.delete(key);
      }
    }

    res.redirect(
      `${env.FRONTEND_URL}/google/success?action=complete&registrationCode=${regCode}&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&avatar=${encodeURIComponent(avatarUrl || "")}`,
    );
  } catch (error) {
    console.error("Google OAuth error:", error);
    errorRedirect("complete", "google_auth_failed");
  }
}

export async function completeRegistration(req: Request, res: Response): Promise<void> {
  try {
    const { registrationCode, password, phone, department, level } = req.body;

    if (!registrationCode) {
      res.status(400).json({ error: "Bad request", message: "Missing registration code" });
      return;
    }

    const pending = pendingRegistrations.get(registrationCode);
    if (!pending || pending.expiresAt < Date.now()) {
      pendingRegistrations.delete(registrationCode);
      res.status(400).json({ error: "Bad request", message: "Invalid or expired registration code. Please sign up again." });
      return;
    }

    pendingRegistrations.delete(registrationCode);

    if (!password || password.length < 8) {
      res.status(400).json({ error: "Bad request", message: "Password must be at least 8 characters" });
      return;
    }

    const existing = await query("SELECT id FROM users WHERE email = $1", [pending.email]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: "Conflict", message: "An account with this email already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    let newUser!: { id: string; email: string; role: string };
    await withTransaction(async (client) => {
      const userResult = await client.query(
        `INSERT INTO users (id, email, password_hash, full_name, avatar_url, google_id, phone, department, level, role, roles, active_role, email_verified_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
         RETURNING id, email, role`,
        [
          userId,
          pending.email,
          hashedPassword,
          pending.name,
          pending.avatar,
          pending.googleId,
          phone || "",
          department || "",
          level || "",
          "user",
          "{poster}",
          "poster",
        ],
      );
      newUser = userResult.rows[0];
    });

    const accessToken = generateToken({ sub: newUser.id, role: newUser.role as "user" | "admin", email: newUser.email }, env.JWT_ACCESS_EXPIRES_IN);
    const refreshToken = generateToken({ sub: newUser.id }, env.JWT_REFRESH_EXPIRES_IN);

    res.status(201).json({
      message: "Account created successfully",
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: pending.name,
        role: newUser.role,
        roles: ["poster"],
        activeRole: "poster",
        emailVerified: true,
      },
      tokens: { accessToken, refreshToken },
    });
  } catch (error) {
    console.error("Complete registration error:", error);
    res.status(500).json({ error: "Internal server error", message: "Registration failed. Please try again." });
  }
}

export async function completeProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { password, phone, department, level } = req.body;

    if (!password || password.length < 8) {
      res.status(400).json({ error: "Bad request", message: "Password must be at least 8 characters" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await query(
      `UPDATE users SET password_hash = $1, phone = COALESCE(NULLIF($2, ''), phone), department = COALESCE(NULLIF($3, ''), department), level = COALESCE(NULLIF($4, ''), level), updated_at = NOW()
       WHERE id = $5`,
      [hashedPassword, phone || "", department || "", level || "", userId],
    );

    res.json({ success: true, message: "Profile completed" });
  } catch (error) {
    console.error("Complete profile error:", error);
    res.status(500).json({ error: "Internal server error", message: "Failed to complete profile" });
  }
}

export async function linkGoogle(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { googleIdToken } = req.body;

    if (!googleIdToken) {
      res.status(400).json({ error: "Bad request", message: "Missing Google ID token" });
      return;
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: googleIdToken,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.sub) {
      res.status(400).json({ error: "Bad request", message: "Invalid Google token" });
      return;
    }

    const existingLink = await query("SELECT id FROM users WHERE google_id = $1", [payload.sub]);
    if (existingLink.rows.length > 0) {
      res.status(409).json({ error: "Conflict", message: "This Google account is already linked to another user" });
      return;
    }

    await query(
      "UPDATE users SET google_id = $1, avatar_url = COALESCE(NULLIF($2, ''), avatar_url), updated_at = NOW() WHERE id = $3",
      [payload.sub, payload.picture || null, userId],
    );

    res.json({ success: true, message: "Google account linked" });
  } catch (error) {
    console.error("Link Google error:", error);
    res.status(500).json({ error: "Internal server error", message: "Failed to link Google account" });
  }
}

export async function unlinkGoogle(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;

    const user = await query<{ password_hash: string }>(
      "SELECT password_hash FROM users WHERE id = $1", [userId],
    );

    if (user.rows.length === 0) {
      res.status(404).json({ error: "Not found", message: "User not found" });
      return;
    }

    if (!user.rows[0].password_hash) {
      res.status(400).json({ error: "Bad request", message: "Set a password first before unlinking Google" });
      return;
    }

    await query("UPDATE users SET google_id = NULL, updated_at = NOW() WHERE id = $1", [userId]);
    res.json({ success: true, message: "Google account unlinked" });
  } catch (error) {
    console.error("Unlink Google error:", error);
    res.status(500).json({ error: "Internal server error", message: "Failed to unlink Google account" });
  }
}
