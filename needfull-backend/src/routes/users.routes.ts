// WHAT: Users routes — profile management
// WHY: RESTful endpoints for user profile CRUD and preferences

import { Router } from "express";
import { body, query } from "express-validator";
import multer from "multer";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import * as users from "../controllers/users.controller";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: (_req, file, cb) => { const allowed = ["image/jpeg", "image/png", "image/webp", "image/heic"]; if (allowed.includes(file.mimetype)) cb(null, true); else cb(new Error("Only JPEG, PNG, WebP, and HEIC images are allowed")); } });

const router = Router();
router.use(authenticate);

router.get("/me", users.getMe);

router.patch("/me",
  body("fullName").optional().trim().isLength({ min: 2, max: 100 }),
  body("bio").optional().trim().isLength({ max: 500 }),
  body("hostel").optional().trim().isLength({ max: 100 }),
  validate,
  users.updateMe,
);

router.patch("/me/avatar", upload.single("avatar"), users.updateAvatar);

router.patch("/me/location",
  body("lat").isFloat({ min: -90, max: 90 }),
  body("lng").isFloat({ min: -180, max: 180 }),
  validate,
  users.updateLocation,
);

router.patch("/me/available", users.toggleAvailable);

router.patch("/me/runner-mode",
  body("isRunner").isBoolean(),
  validate,
  users.toggleRunnerMode,
);

router.get("/nearby-runners",
  query("lat").isFloat({ min: -90, max: 90 }),
  query("lng").isFloat({ min: -180, max: 180 }),
  query("radiusMeters").optional().isFloat({ min: 100 }),
  validate,
  users.getNearbyRunners,
);

router.get("/:userId", users.getPublicProfile);

router.post("/me/verify-student", upload.single("idCard"), users.submitStudentVerification);

export default router;
