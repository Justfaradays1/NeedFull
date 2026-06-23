// WHAT: Google OAuth login — redirect flow
// WHY: Lets users sign up / sign in with their Google account
// FUTURE: Add Apple OAuth, auto-upload Google profile photo

import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
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

// WHAT: Redirect user to Google consent screen
export async function googleAuth(_req: Request, res: Response): Promise<void> {
  if (!env.GOOGLE_CLIENT_ID) {
    res.status(501).json({ error: "Google OAuth is not configured" });
    return;
  }

  const authUrl = googleClient.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    include_granted_scopes: true,
  });

  res.redirect(authUrl);
}

// WHAT: Handle Google OAuth callback
export async function googleCallback(req: Request, res: Response): Promise<void> {
  const { code } = req.query;

  if (!code || typeof code !== "string") {
    res.redirect(`${env.FRONTEND_URL}/login?error=google_auth_failed`);
    return;
  }

  try {
    const { tokens } = await googleClient.getToken(code);
    const idToken = tokens.id_token;
    if (!idToken) {
      res.redirect(`${env.FRONTEND_URL}/login?error=google_auth_failed`);
      return;
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      res.redirect(`${env.FRONTEND_URL}/login?error=google_auth_failed`);
      return;
    }

    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name || email.split("@")[0];
    const avatarUrl = payload.picture || null;

    // WHAT: Find existing user by google_id or email, or create new
    let user = await query<{
      id: string; email: string; role: string;
    }>("SELECT id, email, role FROM users WHERE google_id = $1", [googleId]);

    if (user.rows.length === 0) {
      user = await query<{
        id: string; email: string; role: string;
      }>("SELECT id, email, role FROM users WHERE email = $1", [email]);
    }

    if (user.rows.length === 0) {
      // WHAT: Create new user via Google
      const hashedPassword = await bcrypt.hash(uuidv4(), 12);
      await withTransaction(async (client) => {
        const result = await client.query(
          `INSERT INTO users (id, email, password_hash, full_name, avatar_url, google_id, role, email_verified_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
           RETURNING id, email, role`,
          [uuidv4(), email, hashedPassword, name, avatarUrl, googleId, "user"],
        );
        user = result;
      });
    } else {
      // WHAT: Link google_id if not already linked
      await query(
        "UPDATE users SET google_id = $1, avatar_url = COALESCE(avatar_url, $2), email_verified_at = COALESCE(email_verified_at, NOW()) WHERE id = $3",
        [googleId, avatarUrl, user.rows[0].id],
      );
    }

    const u = user.rows[0];
    const accessToken = generateToken(
      { sub: u.id, role: u.role as "user" | "admin", email: u.email },
      env.JWT_ACCESS_EXPIRES_IN,
    );
    const refreshToken = jwt.sign(
      { sub: u.id },
      env.JWT_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions,
    );

    // WHAT: Redirect to frontend with tokens
    res.redirect(
      `${env.FRONTEND_URL}/auth/google/success?accessToken=${encodeURIComponent(accessToken)}&refreshToken=${encodeURIComponent(refreshToken)}`,
    );
  } catch (error) {
    console.error("Google OAuth error:", error);
    res.redirect(`${env.FRONTEND_URL}/login?error=google_auth_failed`);
  }
}
