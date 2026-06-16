// WHAT: Request validation middleware
// WHY: Centralises validation error handling, returns consistent error format
// FUTURE: Add custom validators for phone format, password strength, etc.

import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

// WHAT: Middleware to check validation results and return 400 if invalid
// WHY: Prevents invalid data from reaching controllers
export function validate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: "Validation failed",
      details: errors.array().map((err) => ({
        field: err.type === "field" ? (err as any).path : undefined,
        message: err.msg,
      })),
    });
    return;
  }
  next();
}
