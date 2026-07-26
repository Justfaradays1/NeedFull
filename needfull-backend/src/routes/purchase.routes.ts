// WHAT: Purchase routes — secure escrow-based purchase and delivery endpoints
// WHY: All purchase-related API endpoints with proper auth, validation, and role guards

import { Router } from "express";
import { body, param } from "express-validator";
import multer from "multer";
import { authenticate, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import * as purchase from "../controllers/purchase.controller";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPEG, PNG, and WebP images are allowed"));
  },
});

const router = Router();

// ─── Create purchase task ──────────────────────────────────────────────────────
router.post("/",
  authenticate,
  requireRole("poster"),
  body("categoryId").isUUID(),
  body("title").trim().isLength({ min: 5, max: 200 }),
  body("description").trim().isLength({ min: 10, max: 2000 }),
  body("estimatedItemCostNaira").isFloat({ min: 1 }),
  body("runnerFeeNaira").isFloat({ min: 50 }),
  body("maxAdditionalSpendingNaira").optional().isFloat({ min: 0 }),
  body("storeName").optional().trim().isString(),
  body("deadline").optional({ values: "null" }).isISO8601().toDate(),
  body("isUrgent").optional().isBoolean().toBoolean(),
  body("locationLabel").optional().trim().isString(),
  body("lat").optional({ values: "null" }).isFloat({ min: -90, max: 90 }).toFloat(),
  body("lng").optional({ values: "null" }).isFloat({ min: -180, max: 180 }).toFloat(),
  validate,
  purchase.createPurchaseHandler,
);

// ─── Fund purchase (lock escrow) ───────────────────────────────────────────────
router.post("/:taskId/fund",
  authenticate,
  requireRole("poster"),
  param("taskId").isUUID(),
  validate,
  purchase.fundPurchaseHandler,
);

// ─── Accept purchase task (runner) ─────────────────────────────────────────────
router.post("/:taskId/accept",
  authenticate,
  requireRole("runner"),
  param("taskId").isUUID(),
  validate,
  purchase.acceptPurchaseHandler,
);

// ─── Update workflow status ────────────────────────────────────────────────────
router.patch("/:taskId/status",
  authenticate,
  requireRole("runner"),
  param("taskId").isUUID(),
  body("status").isIn(["at_store", "shopping", "receipt_uploaded", "heading_to_delivery"]),
  validate,
  purchase.updateStatusHandler,
);

// ─── Upload receipt ────────────────────────────────────────────────────────────
router.post("/:taskId/receipt",
  authenticate,
  requireRole("runner"),
  upload.single("receipt"),
  param("taskId").isUUID(),
  body("receiptAmountNaira").isFloat({ min: 1 }),
  body("notes").optional().trim().isString(),
  validate,
  purchase.uploadReceiptHandler,
);

// ─── Generate delivery OTP ─────────────────────────────────────────────────────
router.post("/:taskId/generate-otp",
  authenticate,
  requireRole("runner"),
  param("taskId").isUUID(),
  validate,
  purchase.generateOTPHandler,
);

// ─── Verify delivery OTP ──────────────────────────────────────────────────────
router.post("/:taskId/verify-otp",
  authenticate,
  requireRole("runner"),
  param("taskId").isUUID(),
  body("otp").isString().isLength({ min: 6, max: 6 }),
  validate,
  purchase.verifyOTPHandler,
);

// ─── Confirm delivery (poster) ─────────────────────────────────────────────────
router.post("/:taskId/confirm",
  authenticate,
  requireRole("poster"),
  param("taskId").isUUID(),
  validate,
  purchase.confirmDeliveryHandler,
);

// ─── Budget approval ──────────────────────────────────────────────────────────
router.post("/approvals/:approvalId/approve",
  authenticate,
  requireRole("poster"),
  param("approvalId").isUUID(),
  validate,
  purchase.approveBudgetHandler,
);

router.post("/approvals/:approvalId/reject",
  authenticate,
  requireRole("poster"),
  param("approvalId").isUUID(),
  validate,
  purchase.rejectBudgetHandler,
);

// ─── Disputes ─────────────────────────────────────────────────────────────────
router.post("/:taskId/dispute",
  authenticate,
  param("taskId").isUUID(),
  body("reason").trim().isLength({ min: 10, max: 500 }),
  body("description").optional().trim().isString(),
  validate,
  purchase.openDisputeHandler,
);

router.post("/disputes/:disputeId/evidence",
  authenticate,
  upload.single("evidence"),
  param("disputeId").isUUID(),
  body("description").optional().trim().isString(),
  validate,
  purchase.uploadDisputeEvidenceHandler,
);

// ─── Admin endpoints ──────────────────────────────────────────────────────────
router.get("/admin/stats",
  authenticate,
  requireRole("admin"),
  purchase.getEscrowStatsHandler,
);

router.get("/admin/tasks",
  authenticate,
  requireRole("admin"),
  purchase.listPurchaseTasksHandler,
);

router.get("/admin/tasks/:taskId",
  authenticate,
  requireRole("admin"),
  param("taskId").isUUID(),
  validate,
  purchase.getPurchaseDetailHandler,
);

router.post("/admin/disputes/:disputeId/resolve",
  authenticate,
  requireRole("admin"),
  param("disputeId").isUUID(),
  body("resolution").isIn(["release_to_runner", "refund_poster", "split"]),
  body("notes").optional().trim().isString(),
  validate,
  purchase.resolveDisputeHandler,
);

export default router;
