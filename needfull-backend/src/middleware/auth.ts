import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import env from "../config/env.js";
import db from "../config/db";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        email: string;
        fullName?: string;
        roles: string[];
        activeRole: string;
        runnerStatus: string;
      };
    }
  }
}

export type AuthRequest = Request & {
  user: {
    id: string;
    role: string;
    email: string;
    fullName?: string;
    roles: string[];
    activeRole: string;
    runnerStatus: string;
  };
};

const roleCache = new Map<string, { roles: string[]; activeRole: string; runnerStatus: string; role: string }>();

function verifyToken(token: string): { id: string; role: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as Record<string, unknown>;
    return {
      id: (decoded.sub || decoded.id) as string,
      role: decoded.role as string,
      email: decoded.email as string,
    };
  } catch (error) {
    console.error("JWT verification error:", (error as Error).message);
    return null;
  }
}

async function loadRoles(userId: string) {
  const cached = roleCache.get(userId);
  if (cached) return cached;
  const result = await db.query<{ roles: string[]; active_role: string; runner_status: string; role: string }>(
    "SELECT roles, active_role, runner_status, role FROM users WHERE id = $1",
    [userId],
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  const data = {
    roles: row.roles || ["poster"],
    activeRole: row.active_role || "poster",
    runnerStatus: row.runner_status || "none",
    role: row.role || "user",
  };
  roleCache.set(userId, data);
  setTimeout(() => roleCache.delete(userId), 5000);
  return data;
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized", message: "Missing or invalid Authorization header. Format: Bearer <token>" });
      return;
    }

    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    if (!payload) {
      res.status(401).json({ error: "Unauthorized", message: "Invalid or expired token" });
      return;
    }

    loadRoles(payload.id).then((roleData) => {
      if (!roleData) {
        res.status(401).json({ error: "Unauthorized", message: "User not found" });
        return;
      }
      req.user = {
        id: payload.id,
        role: roleData.role,
        email: payload.email,
        roles: roleData.roles,
        activeRole: roleData.activeRole,
        runnerStatus: roleData.runnerStatus,
      };
      next();
    }).catch((err) => {
      console.error("Failed to load user roles:", err);
      req.user = {
        id: payload.id,
        role: payload.role,
        email: payload.email,
        roles: ["poster"],
        activeRole: "poster",
        runnerStatus: "none",
      };
      next();
    });
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ error: "Internal server error", message: "Authentication check failed" });
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      next();
      return;
    }

    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    if (payload) {
      loadRoles(payload.id).then((roleData) => {
        if (roleData) {
          req.user = {
            id: payload.id,
            role: roleData.role,
            email: payload.email,
            roles: roleData.roles,
            activeRole: roleData.activeRole,
            runnerStatus: roleData.runnerStatus,
          };
        }
        next();
      }).catch(() => next());
    } else {
      next();
    }
  } catch {
    next();
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", message: "Authentication required" });
      return;
    }
    if (req.user.role === "admin") return next();
    const userRoles: string[] = req.user.roles || ["poster"];
    const hasRole = allowedRoles.some((r) => userRoles.includes(r));
    if (!hasRole) {
      console.warn(`Access denied: user ${req.user.id} roles=${JSON.stringify(userRoles)} tried to access route requiring ${allowedRoles.join(", ")}`);
      res.status(403).json({ error: "Forbidden", message: `This action requires one of roles: ${allowedRoles.join(", ")}` });
      return;
    }
    next();
  };
}

export function requireActiveRole(...allowed: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", message: "Authentication required" });
      return;
    }
    if (req.user.role === "admin") return next();
    if (!allowed.includes(req.user.activeRole)) {
      res.status(403).json({ error: "Forbidden", message: `Switch to one of these roles: ${allowed.join(", ")}` });
      return;
    }
    next();
  };
}

export function getAuthenticatedUser(req: Request): {
  id: string;
  role: string;
  email: string;
  roles: string[];
  activeRole: string;
  runnerStatus: string;
} {
  if (!req.user) throw new Error("User not authenticated");
  return req.user;
}
