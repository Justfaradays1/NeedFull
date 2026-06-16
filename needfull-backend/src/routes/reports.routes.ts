// WHAT: Reports routes — submit report, view my reports
// WHY: User reporting and moderation

import { Router } from "express";
import { body, query } from "express-validator";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import * as reports from "../controllers/reports.controller";

const router = Router();
router.use(authenticate);

// WHAT: Submit a new report
router.post(
  "/",
  body("reason")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Reason must be between 10 and 1000 characters"),
  body("reportedUserId")
    .optional()
    .isUUID()
    .withMessage("Invalid user ID format"),
  body("reportedTaskId")
    .optional()
    .isUUID()
    .withMessage("Invalid task ID format"),
  validate,
  reports.create as any,
);

// WHAT: Get current user's reports (paginated)
router.get(
  "/mine",
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be >= 1"),
  query("perPage")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("perPage must be between 1 and 50"),
  validate,
  reports.getMyReports as any,
);

export default router;
