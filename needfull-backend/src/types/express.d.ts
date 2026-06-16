import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: "student" | "admin";
        email: string;
        fullName?: string;
      };
      rawBody?: Buffer;
      bodyString?: string;
    }
  }
}
