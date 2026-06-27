// WHAT: User preferences routes
// WHY: GET/PATCH endpoints for authenticated user preferences (theme, notifications, etc.)

import { Router } from "express";
import { body } from "express-validator";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { queryOne } from "../config/db";

const router = Router();
router.use(authenticate);

const PREFERENCE_FIELDS = [
  "theme", "preferred_role", "sidebar_collapsed", "preferred_language",
  "notifications_enabled", "notification_sound", "email_notifications",
  "task_radius_km", "default_sort", "available_on_login",
] as const;

const SELECT_COLS = PREFERENCE_FIELDS.join(", ");

// GET /user/preferences — fetch current user's preferences
router.get("/preferences", async (req, res) => {
  try {
    const userId = req.user!.id;
    const result = await queryOne<any>(
      `SELECT ${SELECT_COLS} FROM user_preferences WHERE user_id = $1`,
      [userId],
    );
    res.json({ success: true, data: result });
  } catch (error: any) {
    if (error?.statusCode === 404) {
      res.json({ success: true, data: null });
      return;
    }
    console.error("[Preferences] GET error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch preferences" });
  }
});

// PATCH /user/preferences — update one or more preferences
router.patch("/preferences",
  body("theme").optional().isIn(["light", "dark", "system"]),
  body("preferred_role").optional().isIn(["poster", "runner", "both"]),
  body("sidebar_collapsed").optional().isBoolean(),
  body("preferred_language").optional().isString().isLength({ min: 2, max: 10 }),
  body("notifications_enabled").optional().isBoolean(),
  body("notification_sound").optional().isBoolean(),
  body("email_notifications").optional().isBoolean(),
  body("task_radius_km").optional().isInt({ min: 1, max: 50 }),
  body("default_sort").optional().isIn(["nearest", "newest", "budget", "urgent"]),
  body("available_on_login").optional().isBoolean(),
  validate,
  async (req, res) => {
    try {
      const userId = req.user!.id;

      const setClauses: string[] = [];
      const params: any[] = [];
      let idx = 1;

      for (const field of PREFERENCE_FIELDS) {
        if (req.body[field] !== undefined) {
          setClauses.push(`${field} = $${idx++}`);
          params.push(req.body[field]);
        }
      }

      if (setClauses.length === 0) {
        res.status(400).json({ success: false, message: "No valid fields to update" });
        return;
      }

      setClauses.push("updated_at = NOW()");
      params.push(userId);

      const result = await queryOne<any>(
        `UPDATE user_preferences SET ${setClauses.join(", ")} WHERE user_id = $${idx}
         RETURNING ${SELECT_COLS}`,
        params,
      );

      res.json({ success: true, data: result });
    } catch (error) {
      console.error("[Preferences] PATCH error:", error);
      res.status(500).json({ success: false, message: "Failed to update preferences" });
    }
  },
);

export default router;
