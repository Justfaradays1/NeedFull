// WHAT: Authentication routes with express-validator validation
// WHY: Validates all inputs before passing to controllers, prevents invalid data
// FUTURE: Add request logging, add rate limiting per user, add 2FA validation

import { Router } from "express";
import { body } from "express-validator";
import {
  register,
  login,
  refresh,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getMe,
} from "../controllers/authController.js";
import { googleAuth, googleCallback } from "../controllers/googleAuthController.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { authLimiter, registerLimiter } from "../middleware/rateLimiter.js";

const authRouter = Router();

// WHAT: Register new user (POST /auth/register)
// WHY: Entry point for new users
// VALIDATES: fullName (non-empty), email (valid), password (min 8), phone (optional but validated)
// RATE LIMIT: 3 per hour per IP
authRouter.post(
  "/register",
  registerLimiter,
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be 2-100 characters"),
  body("email")
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage("Invalid email address"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number"),
  body("phone")
    .optional()
    .trim()
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage("Invalid phone number format"),
  validate,
  register,
);

// WHAT: Initiate Google OAuth login (GET /auth/google)
// WHY: Redirects user to Google consent screen
authRouter.get("/google", googleAuth);

// WHAT: Google OAuth callback (GET /auth/google/callback)
// WHY: Google redirects here after user grants permission
authRouter.get("/google/callback", googleCallback);

// WHAT: Login with email and password (POST /auth/login)
// WHY: Authenticate existing user
// VALIDATES: email (valid), password (non-empty)
// RATE LIMIT: 5 per 15 minutes per IP
authRouter.post(
  "/login",
  authLimiter,
  body("email")
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage("Invalid email address"),
  body("password").notEmpty().withMessage("Password is required"),
  validate,
  login,
);

// WHAT: Refresh access token (POST /auth/refresh)
// WHY: Get new access token using refresh token
// VALIDATES: refreshToken (non-empty)
authRouter.post(
  "/refresh",
  body("refreshToken")
    .trim()
    .notEmpty()
    .withMessage("Refresh token is required")
    .isLength({ min: 20 })
    .withMessage("Invalid refresh token format"),
  validate,
  refresh,
);

// WHAT: Logout endpoint (POST /auth/logout)
// WHY: Stateless logout — client drops tokens
// REQUIRES: authenticate middleware (validates JWT)
// RETURNS: 204 No Content
authRouter.post("/logout", authenticate, logout);

// WHAT: Verify email with OTP (POST /auth/verify-email)
// WHY: Mark user email as verified after OTP submission
// VALIDATES: email (valid format), otp (6-digit code)
authRouter.post(
  "/verify-email",
  body("otp")
    .trim()
    .notEmpty()
    .withMessage("Verification OTP is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be 6 digits")
    .isNumeric()
    .withMessage("OTP must contain only numbers"),
  body("email")
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage("Invalid email address"),
  validate,
  verifyEmail,
);

// WHAT: Request password reset (POST /auth/forgot-password)
// WHY: Initiates password reset flow (always 200 to prevent enumeration)
// VALIDATES: email (valid format)
// RATE LIMIT: 5 per 15 minutes per IP (prevents spam)
authRouter.post(
  "/forgot-password",
  authLimiter,
  body("email")
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage("Invalid email address"),
  validate,
  forgotPassword,
);

// WHAT: Reset password with token (POST /auth/reset-password)
// WHY: Complete password reset after user clicks email link
// VALIDATES: token (UUID format), password (min 8, strong)
authRouter.post(
  "/reset-password",
  body("token")
    .trim()
    .notEmpty()
    .withMessage("Reset token is required")
    .isUUID()
    .withMessage("Invalid reset token format"),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number"),
  validate,
  resetPassword,
);

// WHAT: Get current user profile (GET /auth/me)
// WHY: Returns authenticated user data and wallet balance
// REQUIRES: authenticate middleware (validates JWT)
// RETURNS: { user, wallet }
authRouter.get("/me", authenticate, getMe);

export default authRouter;
