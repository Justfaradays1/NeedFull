// WHAT: User preferences routes
// WHY: GET/PATCH endpoints for authenticated user preferences (theme, notifications, etc.)

import { Router } from "express";
import { body } from "express-validator";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { queryOne } from "../config/db";
import { withTransaction } from "../config/db";

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

      const prefCols: string[] = [];
      const prefVals: any[] = [];

      for (const field of PREFERENCE_FIELDS) {
        if (req.body[field] !== undefined) {
          prefCols.push(field);
          prefVals.push(req.body[field]);
        }
      }

      if (prefCols.length === 0) {
        res.status(400).json({ success: false, message: "No valid fields to update" });
        return;
      }

      const result = await withTransaction(async (client) => {
        const paramPlaceholders = prefCols.map((_, i) => `$${i + 1}`).join(", ");
        const colAssignments = prefCols.map((col) => `${col} = EXCLUDED.${col}`).join(", ");
        const allParams = [...prefVals, userId];

        const prefResult = await client.query(
          `INSERT INTO user_preferences (user_id, ${prefCols.join(", ")})
           VALUES ($${prefCols.length + 1}, ${paramPlaceholders})
           ON CONFLICT (user_id) DO UPDATE SET ${colAssignments}, updated_at = NOW()
           RETURNING ${SELECT_COLS}`,
          allParams,
        );

        // WHAT: Sync preferred_role to user's actual roles array
        // WHY: When user picks a role at registration we need to grant/revoke runner
        if (req.body.preferred_role !== undefined) {
          const role = req.body.preferred_role;
          if (role === "both") {
            await client.query(
              "UPDATE users SET roles = $1, active_role = 'poster' WHERE id = $2",
              [["poster", "runner"], userId],
            );
          } else {
            await client.query(
              "UPDATE users SET roles = $1, active_role = $2 WHERE id = $3",
              [["poster"], "poster", userId],
            );
          }
        }

        return prefResult.rows[0];
      });

      res.json({ success: true, data: result });
    } catch (error) {
      console.error("[Preferences] PATCH error:", error);
      res.status(500).json({ success: false, message: "Failed to update preferences" });
    }
  },
);

export default router;
