// WHAT: Categories routes — public list, admin CRUD
// WHY: Task category management

import { Router } from "express";
import { body, param } from "express-validator";
import { authenticate, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import * as categories from "../controllers/categories.controller";

const router = Router();

// WHAT: Public list — no auth required
router.get("/", categories.list);

// WHAT: Create new category [admin only]
router.post(
  "/",
  authenticate,
  requireRole("admin"),
  body("name").trim().notEmpty().withMessage("Category name is required"),
  body("icon").trim().notEmpty().withMessage("Icon is required"),
  body("description").optional().trim(),
  body("sortOrder")
    .optional()
    .isInt()
    .withMessage("sortOrder must be an integer"),
  validate,
  categories.create,
);

// WHAT: Update category [admin only]
router.patch(
  "/:id",
  authenticate,
  requireRole("admin"),
  param("id").isUUID().withMessage("Invalid category ID"),
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Category name cannot be empty"),
  body("icon").optional().trim().notEmpty().withMessage("Icon cannot be empty"),
  body("description").optional().trim(),
  body("sortOrder")
    .optional()
    .isInt()
    .withMessage("sortOrder must be an integer"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be boolean"),
  validate,
  categories.update,
);

// WHAT: Soft-delete category [admin only]
router.delete(
  "/:id",
  authenticate,
  requireRole("admin"),
  param("id").isUUID().withMessage("Invalid category ID"),
  validate,
  categories.deactivate,
);

export default router;
