import { Router } from "express";
import { body, query } from "express-validator";
import multer from "multer";
import { authenticate, requireRole } from "../middleware/auth";
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

router.post("/me/avatar", upload.single("avatar"), users.updateAvatar);

router.patch("/me/location",
  body("lat").isFloat({ min: -90, max: 90 }),
  body("lng").isFloat({ min: -180, max: 180 }),
  validate,
  users.updateLocation,
);

router.patch("/me/available", users.toggleAvailable);

router.patch("/me/runner",
  body("isRunner").isBoolean(),
  validate,
  users.toggleRunnerMode,
);

// Role management
router.post("/me/switch-role",
  body("role").isString().isIn(["poster", "runner", "business"]),
  validate,
  users.switchActiveRole,
);

router.post("/me/apply-runner", users.applyForRunner);

// Protected routes
router.get("/me/verification-status", users.getVerificationStatus);
router.get("/me/trust-breakdown", users.getTrustBreakdown);

router.post("/me/verify-student", upload.single("idCard"), requireRole("poster", "runner"), users.submitStudentVerification);

router.get("/nearby-runners",
  query("lat").isFloat({ min: -90, max: 90 }),
  query("lng").isFloat({ min: -180, max: 180 }),
  query("radiusMeters").optional().isFloat({ min: 100 }),
  validate,
  users.getNearbyRunners,
);

router.get("/:userId", users.getPublicProfile);

export default router;
