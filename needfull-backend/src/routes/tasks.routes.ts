// WHAT: Tasks routes — CRUD, lifecycle, filtering, my-posted/assigned
// WHY: Core task management endpoints

import { Router } from "express";
import { body, query, param } from "express-validator";
import multer from "multer";
import { authenticate, optionalAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import * as tasks from "../controllers/tasks.controller";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_req, file, cb) => { const allowed = ["image/jpeg", "image/png", "image/webp"]; if (allowed.includes(file.mimetype)) cb(null, true); else cb(new Error("Only JPEG, PNG, and WebP images are allowed")); } });

const router = Router();

router.get("/", optionalAuth,
  query("categoryId").optional().isUUID(),
  query("status").optional().isIn(["open", "in_progress", "completed", "cancelled"]),
  query("isUrgent").optional().isBoolean().toBoolean(),
  query("search").optional().isString().trim(),
  query("sortBy").optional().isIn(["newest", "nearest", "budget_high", "budget_low", "urgent_first"]),
  query("lat").optional().isFloat({ min: -90, max: 90 }).toFloat(),
  query("lng").optional().isFloat({ min: -180, max: 180 }).toFloat(),
  query("radiusKm").optional().isFloat({ min: 0.1 }).toFloat(),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("perPage").optional().isInt({ min: 1, max: 100 }).toInt(),
  validate,
  tasks.listTasksHandler,
);

router.post("/", authenticate, upload.single("image"),
  body("categoryId").isUUID(),
  body("title").trim().isLength({ min: 5, max: 200 }),
  body("description").trim().isLength({ min: 10, max: 2000 }),
  body("budgetNaira").isFloat({ min: 50 }),
  body("deadline").optional({ values: "null" }).isISO8601().toDate(),
  body("isUrgent").optional().isBoolean().toBoolean(),
  body("locationLabel").optional().trim().isString(),
  body("lat").optional({ values: "null" }).isFloat({ min: -90, max: 90 }).toFloat(),
  body("lng").optional({ values: "null" }).isFloat({ min: -180, max: 180 }).toFloat(),
  validate,
  tasks.createTaskHandler,
);

router.get("/me/posted", authenticate, tasks.getMyPostedTasks);
router.get("/me/assigned", authenticate, tasks.getMyAssignedTasks);

router.get("/:taskId", optionalAuth, param("taskId").isUUID(), validate, tasks.getTaskHandler);

router.patch("/:taskId", authenticate, param("taskId").isUUID(), validate, tasks.updateTaskHandler);

router.post("/:taskId/cancel", authenticate, param("taskId").isUUID(), validate, tasks.cancelTaskHandler);

router.post("/:taskId/complete", authenticate, param("taskId").isUUID(), validate, tasks.confirmCompletionHandler);

export default router;
