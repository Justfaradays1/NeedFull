// WHAT: Admin routes — stats, user management, verifications, deposits, withdrawals, reports, tasks, transactions
// WHY: All admin dashboard endpoints with authenticate + requireRole('admin')
// FUTURE: Add bulk actions, add CSV export, add audit log

import { Router } from "express";
import { body, query, param } from "express-validator";
import { authenticate, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import * as admin from "../controllers/admin.controller";

const router = Router();
router.use(authenticate, requireRole("admin"));

// Dashboard
router.get("/stats", admin.getDashboardStats);

// Users
router.get("/users",
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("perPage").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("search").optional().isString(),
  query("role").optional().isIn(["student", "admin"]),
  query("isVerifiedStudent").optional().isIn(["true", "false"]),
  query("isBanned").optional().isIn(["true", "false"]),
  query("isRunner").optional().isIn(["true", "false"]),
  validate,
  admin.listUsers,
);
router.post("/users/:id/ban", param("id").isUUID(), validate, admin.banUser);
router.post("/users/:id/unban", param("id").isUUID(), validate, admin.unbanUser);

// Verifications
router.get("/verifications", admin.listVerifications);
router.post("/verifications/:id",
  param("id").isUUID(),
  body("action").isIn(["approve", "reject"]),
  body("note").optional().trim().isString(),
  validate,
  admin.verifyStudentId,
);

// Manual deposits
router.get("/deposits",
  query("status").optional().isIn(["pending", "confirmed", "rejected"]),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("perPage").optional().isInt({ min: 1, max: 100 }).toInt(),
  validate,
  admin.listManualTransfers,
);
router.post("/deposits/:id/confirm", param("id").isUUID(), validate, admin.confirmManualTransfer);
router.post("/deposits/:id/reject",
  param("id").isUUID(),
  body("reason").trim().isLength({ min: 1 }),
  validate,
  admin.rejectManualTransfer,
);

// Withdrawals
router.get("/withdrawals",
  query("status").optional().isIn(["pending", "processed", "failed"]),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("perPage").optional().isInt({ min: 1, max: 100 }).toInt(),
  validate,
  admin.listWithdrawals,
);
router.post("/withdrawals/:id/process", param("id").isUUID(), validate, admin.processWithdrawal);

// Reports
router.get("/reports",
  query("status").optional().isIn(["open", "resolved", "dismissed"]),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("perPage").optional().isInt({ min: 1, max: 100 }).toInt(),
  validate,
  admin.listReports,
);
router.post("/reports/:id/resolve",
  param("id").isUUID(),
  body("status").isIn(["resolved", "dismissed"]),
  body("resolution").optional().trim().isString(),
  validate,
  admin.resolveReport,
);

// Tasks (moderation)
router.get("/tasks",
  query("status").optional().isIn(["open", "in_progress", "completed", "cancelled", "disputed"]),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("perPage").optional().isInt({ min: 1, max: 100 }).toInt(),
  validate,
  admin.listTasks,
);
router.post("/tasks/:id/cancel", param("id").isUUID(), validate, admin.cancelTaskAdmin);

// Transactions
router.get("/transactions",
  query("type").optional().isString(),
  query("startDate").optional().isISO8601(),
  query("endDate").optional().isISO8601(),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("perPage").optional().isInt({ min: 1, max: 100 }).toInt(),
  validate,
  admin.listPlatformTransactions,
);

export default router;
