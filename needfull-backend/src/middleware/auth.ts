// WHAT: JWT authentication and authorization middleware
// WHY: Protects routes, enforces role-based access control, validates tokens on every request
// FUTURE: Add token refresh logic, add rate limiting on auth endpoints, add audit logging for failed attempts

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import env from "../config/env.js";

// WHAT: Extend Express Request type to include authenticated user
// WHY: TypeScript support for req.user after authentication
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: "student" | "admin";
        email: string;
        fullName?: string;
      };
    }
  }
}

// WHAT: AuthRequest type — request with guaranteed authenticated user
// WHY: Used in controllers where authentication middleware has already run
export type AuthRequest = Request & {
  user: {
    id: string;
    role: "student" | "admin";
    email: string;
    fullName?: string;
  };
};

// WHAT: Verify JWT token and extract payload
// WHY: Centralised verification logic, prevents token tampering
function verifyToken(token: string): {
  id: string;
  role: "student" | "admin";
  email: string;
} | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as Record<string, unknown>;
    return {
      id: (decoded.sub || decoded.id) as string,
      role: decoded.role as "student" | "admin",
      email: decoded.email as string,
    };
  } catch (error) {
    console.error("JWT verification error:", (error as Error).message);
    return null;
  }
}

// WHAT: Required authentication middleware
// WHY: Blocks unauthenticated requests, enforces that user is logged in
// USAGE: app.get('/profile', authenticate, handleProfile)
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    const authHeader = req.headers.authorization;

    // WHAT: Extract Bearer token from "Bearer <token>" format
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        error: "Unauthorized",
        message:
          "Missing or invalid Authorization header. Format: Bearer <token>",
      });
      return;
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix
    const user = verifyToken(token);

    if (!user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid or expired token",
      });
      return;
    }

    // WHAT: Attach decoded user to request object
    // WHY: Makes user data available to route handlers
    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Authentication check failed",
    });
  }
}

// WHAT: Optional authentication middleware
// WHY: Allows routes to work with or without authentication (e.g., public tasks with optional filtering)
// USAGE: app.get('/tasks', optionalAuth, handleGetTasks)
export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const authHeader = req.headers.authorization;

    // WHAT: If no token provided, continue without setting req.user
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      next();
      return;
    }

    const token = authHeader.slice(7);
    const user = verifyToken(token);

    // WHAT: If token is valid, attach user; if invalid, continue anyway
    if (user) {
      req.user = user;
    }

    next();
  } catch (error) {
    console.error("Optional authentication error:", error);
    // WHAT: Continue even if verification fails, route decides what to do
    next();
  }
}

// WHAT: Role-based access control middleware factory
// WHY: Ensures only users with specific roles can access protected routes
// USAGE: app.delete('/admin/users/:id', authenticate, requireRole('admin'), handleDelete)
export function requireRole(...allowedRoles: Array<"student" | "admin">) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // WHAT: Ensure user is authenticated before checking role
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
      return;
    }

    // WHAT: Check if user's role is in the allowed list
    if (!allowedRoles.includes(req.user.role)) {
      console.warn(
        `Access denied: user ${req.user.id} (${req.user.role}) tried to access admin route`,
      );
      res.status(403).json({
        error: "Forbidden",
        message: `This action requires one of roles: ${allowedRoles.join(", ")}. You have: ${req.user.role}`,
      });
      return;
    }

    next();
  };
}

// WHAT: Utility to extract user from request (used in route handlers)
// WHY: Prevents null/undefined errors when accessing user data
export function getAuthenticatedUser(req: Request): {
  id: string;
  role: "student" | "admin";
  email: string;
} {
  if (!req.user) {
    throw new Error("User not authenticated");
  }
  return req.user;
}
