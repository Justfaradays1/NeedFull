// WHAT: Reviews routes — create review, list reviews for a task
// WHY: Task rating and feedback

import { Router } from "express";
import { body } from "express-validator";
import { authenticate, optionalAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import * as reviews from "../controllers/reviews.controller";

const router = Router();

router.post("/", authenticate,
  body("taskId").isUUID(),
  body("revieweeId").isUUID(),
  body("rating").isInt({ min: 1, max: 5 }),
  body("comment").optional().trim().isLength({ max: 500 }),
  validate,
  reviews.createReview,
);

router.get("/task/:taskId", optionalAuth, reviews.getForTask);

export default router;
