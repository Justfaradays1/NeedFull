// WHAT: Authentication endpoints (register, login, refresh, logout, email verification, password reset)
// WHY: Handles user authentication lifecycle, JWT token management, email verification, and password recovery
// FUTURE: Add two-factor authentication, add social login (Google, GitHub), add passwordless email login

import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { query, queryOne, withTransaction } from "../config/db.js";
import env from "../config/env.js";
import { onTrustEvent } from "../services/trust.service.js";
import { sendEmail, verificationEmailTemplate } from "../services/email.service.js";

// WHAT: Generate JWT token with specified expiry
// WHY: Centralises token generation logic, ensures consistent format
function generateToken(
  payload: { sub: string; role?: "user" | "admin"; email?: string },
  expiresIn: string | number,
): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

// WHAT: Generate 6-digit OTP code
// WHY: Used for email verification and password reset
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// WHAT: User registration endpoint
// WHY: Creates new user account with hashed password, sends verification email, returns JWT pair
// POST /auth/register
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, fullName, phone } = req.body;

    // WHAT: Validate required fields (express-validator already validated)
    if (!email || !password || !fullName?.trim()) {
      res.status(400).json({
        error: "Bad request",
        message: "Missing required fields: email, password, fullName",
      });
      return;
    }

    // WHAT: Check if user already exists
    const existingUser = await query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    if (existingUser.rows.length > 0) {
      res.status(409).json({
        error: "Conflict",
        message: "Email already registered",
      });
      return;
    }

    // WHAT: Hash password with bcrypt cost 12 (slow, secure)
    // WHY: Cost 12 = ~0.25s on modern hardware, prevents rainbow table attacks
    const hashedPassword = await bcrypt.hash(password, 12);

    // WHAT: Create user and wallet in a transaction
    // WHY: Ensures consistency — if wallet creation fails, user creation is rolled back
    let newUser!: { id: string; email: string; role: "user" | "admin" };
    await withTransaction(async (client) => {
      // WHAT: Create user (wallet auto-created via DB trigger)
      const userResult = await client.query(
        `INSERT INTO users (id, email, password_hash, full_name, phone, role, email_verified_at)
         VALUES ($1, $2, $3, $4, $5, $6, NULL)
         RETURNING id, email, role`,
        [
          uuidv4(),
          email,
          hashedPassword,
          fullName.trim(),
          phone || null,
          "user",
        ],
      );

      newUser = userResult.rows[0];
    });

    // WHAT: Generate and send email verification OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await query(
      `INSERT INTO verification_tokens (id, user_id, token, type, expires_at, used_at)
       VALUES ($1, $2, $3, $4, $5, NULL)`,
      [uuidv4(), newUser.id, otp, "email_verification", expiresAt.toISOString()],
    );

    // WHAT: Send OTP email
    await sendEmail({
      to: email,
      subject: "Verify your NeedFull email",
      html: verificationEmailTemplate(otp, fullName),
    });

    // WHAT: Generate JWT tokens for immediate access (optional email verification)
    const accessToken = generateToken(
      { sub: newUser.id, role: newUser.role, email: newUser.email },
      env.JWT_ACCESS_EXPIRES_IN,
    );
    const refreshToken = generateToken(
      { sub: newUser.id },
      env.JWT_REFRESH_EXPIRES_IN,
    );

    res.status(201).json({
      message: "Registration successful. Verification email sent.",
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Registration failed",
    });
  }
}

// WHAT: User login endpoint
// WHY: Authenticates user, returns JWT pair, updates last seen timestamp
// POST /auth/login
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        error: "Bad request",
        message: "Missing email or password",
      });
      return;
    }

    // WHAT: Find user by email
    const userResult = await query(
      "SELECT id, email, password_hash, role FROM users WHERE email = $1",
      [email],
    );

    if (userResult.rows.length === 0) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid email or password",
      });
      return;
    }

    const user = userResult.rows[0];

    // WHAT: Compare provided password with stored hash
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid email or password",
      });
      return;
    }

    // WHAT: Update last_seen_at timestamp
    // WHY: Tracks user activity for analytics and engagement metrics
    await query("UPDATE users SET last_seen_at = NOW() WHERE id = $1", [
      user.id,
    ]);

    // WHAT: Generate JWT tokens
    const accessToken = generateToken(
      { sub: user.id, role: user.role, email: user.email },
      env.JWT_ACCESS_EXPIRES_IN,
    );
    const refreshToken = generateToken(
      { sub: user.id },
      env.JWT_REFRESH_EXPIRES_IN,
    );

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Login failed",
    });
  }
}

// WHAT: Refresh access token endpoint
// WHY: Issues new access token using valid refresh token (no password needed)
// POST /auth/refresh
export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        error: "Bad request",
        message: "Missing refreshToken",
      });
      return;
    }

    // WHAT: Verify refresh token
    let decoded: { sub: string };
    try {
      decoded = jwt.verify(refreshToken, env.JWT_SECRET) as { sub: string };
    } catch (error) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid or expired refresh token",
      });
      return;
    }

    // WHAT: Fetch user to get current role and email
    const user = await queryOne<{
      id: string;
      email: string;
      role: "user" | "admin";
    }>("SELECT id, email, role FROM users WHERE id = $1", [decoded.sub]);

    // WHAT: Issue new token pair
    const accessToken = generateToken(
      { sub: user.id, role: user.role, email: user.email },
      env.JWT_ACCESS_EXPIRES_IN,
    );
    const newRefreshToken = generateToken(
      { sub: user.id },
      env.JWT_REFRESH_EXPIRES_IN,
    );

    res.json({
      tokens: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Token refresh failed",
    });
  }
}

// WHAT: Logout endpoint
// WHY: Stateless — client drops tokens. Backend doesn't need to do anything.
// POST /auth/logout
export async function logout(_req: Request, res: Response): Promise<void> {
  // WHAT: No action needed — tokens are managed client-side
  // WHY: JWT tokens are stateless; server can't "revoke" them (they're valid until expiry)
  // FUTURE: Implement token blacklist for logout before expiry, if needed
  res.status(204).send();
}

// WHAT: Verify email endpoint
// WHY: Marks email_verified_at after user submits OTP code
// POST /auth/verify-email
export async function verifyEmail(req: Request, res: Response): Promise<void> {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({
        error: "Bad request",
        message: "Missing email or OTP",
      });
      return;
    }

    // WHAT: Find user by email
    const userResult = await query<{ id: string }>("SELECT id FROM users WHERE email = $1", [
      email,
    ]);

    if (userResult.rows.length === 0) {
      res.status(404).json({
        error: "Not found",
        message: "User not found",
      });
      return;
    }

    const userId = userResult.rows[0].id;

    // WHAT: Find valid (unused, non-expired) verification token
    const tokenResult = await query(
      `SELECT id FROM verification_tokens
       WHERE user_id = $1 AND token = $2 AND type = 'email_verification'
       AND used_at IS NULL AND expires_at > NOW()`,
      [userId, otp],
    );

    if (tokenResult.rows.length === 0) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid or expired OTP",
      });
      return;
    }

    const tokenId = tokenResult.rows[0].id;

    // WHAT: Mark token as used and update email_verified_at in transaction
    await withTransaction(async (client) => {
      await client.query(
        "UPDATE verification_tokens SET used_at = NOW() WHERE id = $1",
        [tokenId],
      );
      await client.query(
        "UPDATE users SET email_verified_at = NOW() WHERE id = $1",
        [userId],
      );
    });

    // WHAT: Fire-and-forget trust recalculation for user (email verification boost)
    // WHY: Email verification increases trust score; don't block response
    onTrustEvent(userId, "email_verified").catch(console.error);

    res.json({
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Email verification failed",
    });
  }
}

// WHAT: Forgot password endpoint
// WHY: Creates password reset token and sends email. Always returns 200 to prevent email enumeration.
// POST /auth/forgot-password
export async function forgotPassword(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { email } = req.body;

    if (!email) {
      // WHAT: Always return 200 even if email doesn't exist (prevents enumeration)
      res.status(200).json({
        message: "If an account exists, a password reset email has been sent.",
      });
      return;
    }

    // WHAT: Find user by email (silently fail if not found)
    const userResult = await query<{ id: string }>("SELECT id FROM users WHERE email = $1", [
      email,
    ]);

    if (userResult.rows.length === 0) {
      res.status(200).json({
        message: "If an account exists, a password reset email has been sent.",
      });
      return;
    }

    const userId = userResult.rows[0].id;

    // WHAT: Create reset token (valid for 1 hour)
    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await query(
      `INSERT INTO verification_tokens (id, user_id, token, type, expires_at, used_at)
       VALUES ($1, $2, $3, $4, $5, NULL)`,
      [uuidv4(), userId, resetToken, "password_reset", expiresAt.toISOString()],
    );

    // WHAT: Send password reset email
    const resetUrl = `${env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
    await sendEmail({
      to: email,
      subject: "Reset your NeedFull password",
      html: `<p>Hi,</p><p>Click the link below to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 1 hour.</p>`,
    });

    res.status(200).json({
      message: "If an account exists, a password reset email has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    // WHAT: Still return 200 to prevent enumeration even on server error
    res.status(200).json({
      message: "If an account exists, a password reset email has been sent.",
    });
  }
}

// WHAT: Reset password endpoint
// WHY: Validates reset token, updates password hash, marks token as used
// POST /auth/reset-password
export async function resetPassword(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({
        error: "Bad request",
        message: "Missing token or newPassword",
      });
      return;
    }

    // WHAT: Find valid reset token
    const tokenResult = await query(
      `SELECT user_id FROM verification_tokens
       WHERE token = $1 AND type = 'password_reset'
       AND used_at IS NULL AND expires_at > NOW()`,
      [token],
    );

    if (tokenResult.rows.length === 0) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid or expired reset token",
      });
      return;
    }

    const userId = tokenResult.rows[0].user_id;

    // WHAT: Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // WHAT: Update password and mark token as used in transaction
    await withTransaction(async (client) => {
      await client.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
        hashedPassword,
        userId,
      ]);
      await client.query(
        `UPDATE verification_tokens SET used_at = NOW() WHERE token = $1`,
        [token],
      );
    });

    res.json({
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Password reset failed",
    });
  }
}

// WHAT: Get current user profile with wallet balance
// WHY: Returns authenticated user data + real-time wallet balance
// GET /auth/me (requires authenticate middleware)
export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Not authenticated",
      });
      return;
    }

    // WHAT: Fetch user and wallet in single query
    const result = await queryOne<{
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      role: "user" | "admin";
      email_verified_at: string | null;
      wallet_id: string;
      balance_kobo: number;
      escrow_kobo: number;
      trust_score: number;
    }>(
      `SELECT 
        u.id, u.email, u.first_name, u.last_name, u.role, u.email_verified_at,
        w.id as wallet_id, w.balance_kobo, w.escrow_kobo,
        COALESCE(u.trust_score, 50) as trust_score
       FROM users u
       LEFT JOIN wallets w ON w.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id],
    );

    res.json({
      user: {
        id: result.id,
        email: result.email,
        first_name: result.first_name,
        last_name: result.last_name,
        role: result.role,
        email_verified_at: result.email_verified_at,
        trust_score: result.trust_score,
      },
      wallet: {
        id: result.wallet_id,
        balance_kobo: result.balance_kobo,
        escrow_kobo: result.escrow_kobo,
      },
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to fetch user profile",
    });
  }
}
