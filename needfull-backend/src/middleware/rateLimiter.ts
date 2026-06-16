// WHAT: Rate limiting middleware for auth endpoints
// WHY: Prevents brute force attacks on login, forgot-password, etc.
// FUTURE: Add different rate limits per endpoint, add Redis-based distributed rate limiting

import rateLimit from "express-rate-limit";

// WHAT: General auth rate limiter (login, forgot-password)
// WHY: Prevents brute force attacks on password-related endpoints
// Allows 5 attempts per 15 minutes per IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message:
    "Too many attempts, please try again later. Wait 15 minutes before retrying.",
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for successful requests
    return req.res?.statusCode === 200 || req.res?.statusCode === 201;
  },
});

// WHAT: Strict rate limiter for registration endpoint
// WHY: Prevents account enumeration and spam
// Allows 3 registrations per 1 hour per IP
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: "Too many accounts created, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// WHAT: Moderate rate limiter for general endpoints
// WHY: Prevents API abuse
// Allows 10 requests per 15 minutes per IP
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
