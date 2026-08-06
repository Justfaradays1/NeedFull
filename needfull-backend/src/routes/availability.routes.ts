// WHAT: Availability routes — runner availability posts
// WHY: Runners publish offers; posters discover them; owners manage their own

import { Router } from "express";
import { body } from "express-validator";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import * as availability from "../controllers/availability.controller";

const router = Router();
router.use(authenticate);

router.get("/", availability.listHandler);

// WHAT: Must be registered before any /:id routes
router.get("/mine", availability.mineHandler);

router.post(
  "/",
  body("categoryId").isUUID().withMessage("Valid category is required"),
  body("note").optional().trim().isLength({ max: 200 }),
  body("maxTravelKm").optional().isFloat({ min: 1, max: 50 }),
  validate,
  availability.createHandler,
);

router.patch("/:id/deactivate", availability.deactivateHandler);

export default router;