// WHAT: Proposals routes — budget negotiation endpoints
// WHY: Distinct auditable records; mounted at /api. Runner proposes, poster
//      accepts/rejects/funds, runner can cancel a pending proposal.

import { Router } from "express";
import { body, param } from "express-validator";
import { authenticate, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import * as proposals from "../controllers/proposals.controller";

const router = Router();
router.use(authenticate);

// WHAT: Runner submits a budget proposal for a task they have applied to
router.post(
  "/tasks/:taskId/proposals",
  param("taskId").isUUID(),
  body("amount").isFloat({ min: 50 }),
  body("reason").optional().trim().isLength({ max: 500 }),
  validate,
  requireRole("runner"),
  proposals.createProposalHandler,
);

// WHAT: Negotiation history (poster or involved runner)
router.get(
  "/tasks/:taskId/proposals",
  param("taskId").isUUID(),
  validate,
  proposals.listProposalsHandler,
);

router.post(
  "/proposals/:proposalId/accept",
  param("proposalId").isUUID(),
  validate,
  requireRole("poster"),
  proposals.acceptProposalHandler,
);

router.post(
  "/proposals/:proposalId/reject",
  param("proposalId").isUUID(),
  validate,
  requireRole("poster"),
  proposals.rejectProposalHandler,
);

router.post(
  "/proposals/:proposalId/cancel",
  param("proposalId").isUUID(),
  validate,
  proposals.cancelProposalHandler,
);

// WHAT: Poster funds the additional amount (IDEMPOTENT — safe to retry)
router.post(
  "/proposals/:proposalId/fund",
  param("proposalId").isUUID(),
  validate,
  requireRole("poster"),
  proposals.fundProposalHandler,
);

export default router;