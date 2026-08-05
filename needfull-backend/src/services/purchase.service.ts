// WHAT: Purchase escrow service — secure escrow-based purchase and delivery system
// WHY: Posters fund escrow before task goes live; runners never receive direct payments
// NOTE: wallet.service.ts is the ONLY file that modifies wallet balances

import { v4 as uuidv4 } from "uuid";
import db, { queryOne, withTransaction } from "../config/db";
import { PLATFORM_FEE_PERCENT } from "../config/constants";
import { lockEscrow, releaseEscrow, refundEscrow } from "./wallet.service";
import { notifyUser } from "./notification.service";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PurchaseTaskRow {
  id: string;
  task_id: string;
  estimated_item_cost: number;
  runner_fee: number;
  platform_fee: number;
  max_additional_spending: number;
  total_escrow: number;
  store_name: string | null;
  receipt_url: string | null;
  receipt_amount: number | null;
  receipt_notes: string | null;
  receipt_uploaded_at: string | null;
  delivery_otp: string | null;
  otp_generated_at: string | null;
  otp_verified_at: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface TaskRow {
  id: string;
  poster_id: string;
  title: string;
  description: string;
  status: string;
  assigned_to: string | null;
  budget_kobo: number;
  is_purchase: boolean;
}

interface UserRow {
  id: string;
  full_name: string;
  email: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

async function logAudit(purchaseTaskId: string, action: string, actorId: string | null, details?: Record<string, unknown>): Promise<void> {
  try {
    await db.query(
      `INSERT INTO purchase_audit_logs (purchase_task_id, action, actor_id, details, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [purchaseTaskId, action, actorId, details ? JSON.stringify(details) : null],
    );
  } catch (err) {
    console.warn("[Purchase] Audit log failed:", err);
  }
}

// ─── Create Purchase Task ──────────────────────────────────────────────────────

export interface CreatePurchaseInput {
  categoryId: string;
  title: string;
  description: string;
  deadline?: string;
  isUrgent?: boolean;
  locationLabel?: string;
  lat?: number;
  lng?: number;
  estimatedItemCostNaira: number;
  runnerFeeNaira: number;
  maxAdditionalSpendingNaira: number;
  storeName?: string;
}

export async function createPurchaseTask(userId: string, input: CreatePurchaseInput) {
  const estimatedItemCost = Math.round(input.estimatedItemCostNaira * 100);
  const runnerFee = Math.round(input.runnerFeeNaira * 100);
  const maxAdditional = Math.round(input.maxAdditionalSpendingNaira * 100);
  const platformFee = Math.floor((runnerFee * PLATFORM_FEE_PERCENT) / 100);
  const totalEscrow = estimatedItemCost + runnerFee + platformFee;

  if (totalEscrow <= 0) throw new Error("Total escrow must be greater than 0");
  if (estimatedItemCost <= 0) throw new Error("Estimated item cost must be greater than 0");
  if (runnerFee <= 0) throw new Error("Runner fee must be greater than 0");

  const taskId = uuidv4();
  const purchaseId = uuidv4();

  await withTransaction(async (client) => {
    // Create the parent task
    await client.query(
      `INSERT INTO tasks (id, poster_id, category_id, title, description, budget_kobo, status, is_purchase,
        deadline, is_urgent, location_label, location, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'open', true, $7, $8, $9,
        CASE WHEN $10 IS NOT NULL AND $11 IS NOT NULL THEN ST_SetSRID(ST_MakePoint($10, $11), 4326) ELSE NULL END,
        NOW(), NOW())`,
      [
        taskId, userId, input.categoryId, input.title.trim(), input.description.trim(),
        totalEscrow,
        input.deadline ? new Date(input.deadline) : null,
        input.isUrgent || false,
        input.locationLabel?.trim() || null,
        input.lat || null,
        input.lng || null,
      ],
    );

    // Create the purchase task record
    await client.query(
      `INSERT INTO purchase_tasks (id, task_id, estimated_item_cost, runner_fee, platform_fee,
        max_additional_spending, total_escrow, store_name, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending_payment', NOW(), NOW())`,
      [purchaseId, taskId, estimatedItemCost, runnerFee, platformFee, maxAdditional, totalEscrow, input.storeName?.trim() || null],
    );
  });

  await logAudit(purchaseId, "purchase_task_created", userId, { taskId, totalEscrow });

  return { taskId, purchaseId, totalEscrow };
}

// ─── Fund Purchase (lock escrow) ────────────────────────────────────────────────

export async function fundPurchaseTask(userId: string, taskId: string) {
  const task = await queryOne<TaskRow>(
    "SELECT id, poster_id, title, description, status, assigned_to, budget_kobo, is_purchase FROM tasks WHERE id = $1",
    [taskId],
  );

  if (task.poster_id !== userId) throw new Error("Only the poster can fund this task");
  if (!task.is_purchase) throw new Error("Not a purchase task");

  const purchase = await queryOne<PurchaseTaskRow>(
    "SELECT * FROM purchase_tasks WHERE task_id = $1",
    [taskId],
  );

  if (purchase.status !== "pending_payment") throw new Error("Purchase task already funded");

  await withTransaction(async (client) => {
    await lockEscrow(client, userId, purchase.total_escrow, taskId);

    await client.query(
      "UPDATE purchase_tasks SET status = 'funded', updated_at = NOW() WHERE id = $1",
      [purchase.id],
    );

    await client.query(
      "UPDATE tasks SET status = 'open', updated_at = NOW() WHERE id = $1",
      [taskId],
    );
  });

  await logAudit(purchase.id, "purchase_funded", userId, { amountKobo: purchase.total_escrow });

  await notifyUser(userId, {
    type: "purchase_funded",
    title: "Payment Secured by NeedFull",
    body: `₦${(purchase.total_escrow / 100).toLocaleString()} locked in escrow. Funds released only after successful delivery.`,
    taskId,
    conversationId: undefined,
    actorId: userId,
  });

  return { purchaseId: purchase.id, totalEscrow: purchase.total_escrow };
}

// ─── Accept Purchase Task (runner) ─────────────────────────────────────────────

export async function acceptPurchaseTask(userId: string, taskId: string) {
  const task = await queryOne<TaskRow>(
    "SELECT id, poster_id, title, description, status, assigned_to, budget_kobo, is_purchase FROM tasks WHERE id = $1",
    [taskId],
  );

  if (task.status !== "open") throw new Error("Task is not open");
  if (!task.is_purchase) throw new Error("Not a purchase task");

  const purchase = await queryOne<PurchaseTaskRow>(
    "SELECT * FROM purchase_tasks WHERE task_id = $1",
    [taskId],
  );

  if (purchase.status !== "funded") throw new Error("Task not yet funded");

  await withTransaction(async (client) => {
    await client.query(
      "UPDATE tasks SET assigned_to = $1, status = 'in_progress', updated_at = NOW() WHERE id = $2",
      [userId, taskId],
    );
    await client.query(
      "UPDATE purchase_tasks SET status = 'accepted', updated_at = NOW() WHERE id = $1",
      [purchase.id],
    );
  });

  const poster = await queryOne<UserRow>("SELECT id, full_name FROM users WHERE id = $1", [task.poster_id]);

  await logAudit(purchase.id, "purchase_accepted", userId, { runnerId: userId });

  await notifyUser(userId, {
    type: "purchase_accepted",
    title: "Task Assigned to You",
    body: `You accepted "${task.title}". Start heading to the store.`,
    taskId,
    conversationId: undefined,
    actorId: userId,
  });

  await notifyUser(task.poster_id, {
    type: "purchase_runner_assigned",
    title: "Runner Assigned",
    body: `${poster?.full_name || "A runner"} accepted your purchase task "${task.title}".`,
    taskId,
    conversationId: undefined,
    actorId: userId,
  });

  return { purchaseId: purchase.id, status: "accepted" };
}

// ─── Update Workflow Status ────────────────────────────────────────────────────

const VALID_TRANSITIONS: Record<string, string[]> = {
  accepted: ["at_store"],
  at_store: ["shopping"],
  shopping: ["receipt_uploaded"],
  receipt_uploaded: ["heading_to_delivery", "needs_budget_approval"],
  heading_to_delivery: ["delivered"],
  delivered: ["confirmed"],
  confirmed: ["completed"],
};

export async function updatePurchaseStatus(taskId: string, userId: string, newStatus: string) {
  const task = await queryOne<TaskRow>(
    "SELECT id, poster_id, title, description, status, assigned_to, budget_kobo, is_purchase FROM tasks WHERE id = $1",
    [taskId],
  );

  if (!task.is_purchase) throw new Error("Not a purchase task");

  const purchase = await queryOne<PurchaseTaskRow>(
    "SELECT * FROM purchase_tasks WHERE task_id = $1",
    [taskId],
  );

  const isRunner = task.assigned_to === userId;

  // Runner can transition forward through the workflow
  if (!isRunner) throw new Error("Only the assigned runner can update workflow");

  const allowed = VALID_TRANSITIONS[purchase.status];
  if (!allowed || !allowed.includes(newStatus)) {
    throw new Error(`Cannot transition from '${purchase.status}' to '${newStatus}'`);
  }

  await db.query(
    "UPDATE purchase_tasks SET status = $1, updated_at = NOW() WHERE id = $2",
    [newStatus, purchase.id],
  );

  const statusLabels: Record<string, string> = {
    at_store: "Arrived at store",
    shopping: "Shopping in progress",
    heading_to_delivery: "Heading to delivery location",
    delivered: "Marked as delivered",
  };

  await logAudit(purchase.id, `purchase_status_${newStatus}`, userId, { from: purchase.status });

  await notifyUser(task.poster_id, {
    type: `purchase_${newStatus}`,
    title: statusLabels[newStatus] || newStatus.replace(/_/g, " "),
    body: `Runner update on "${task.title}": ${statusLabels[newStatus] || newStatus.replace(/_/g, " ")}`,
    taskId,
    conversationId: undefined,
    actorId: userId,
  });

  return { purchaseId: purchase.id, status: newStatus };
}

// ─── Upload Receipt ────────────────────────────────────────────────────────────

export async function uploadReceipt(
  taskId: string,
  userId: string,
  receiptAmountNaira: number,
  receiptUrl: string,
  notes?: string,
) {
  const task = await queryOne<TaskRow>(
    "SELECT id, poster_id, title, description, status, assigned_to, budget_kobo, is_purchase FROM tasks WHERE id = $1",
    [taskId],
  );

  if (task.assigned_to !== userId) throw new Error("Only the assigned runner can upload receipts");
  if (!task.is_purchase) throw new Error("Not a purchase task");

  const purchase = await queryOne<PurchaseTaskRow>(
    "SELECT * FROM purchase_tasks WHERE task_id = $1",
    [taskId],
  );

  if (purchase.status !== "shopping") throw new Error("Must be in shopping status to upload receipt");

  const receiptAmountKobo = Math.round(receiptAmountNaira * 100);
  const itemPlusBuffer = purchase.estimated_item_cost + purchase.max_additional_spending;

  await db.query(
    `UPDATE purchase_tasks
     SET receipt_url = $1, receipt_amount = $2, receipt_notes = $3, receipt_uploaded_at = NOW(),
         updated_at = NOW()
     WHERE id = $4`,
    [receiptUrl, receiptAmountKobo, notes || null, purchase.id],
  );

  await logAudit(purchase.id, "receipt_uploaded", userId, { amountKobo: receiptAmountKobo });

  if (receiptAmountKobo <= itemPlusBuffer) {
    // Within approved range — continue automatically
    await db.query(
      "UPDATE purchase_tasks SET status = 'receipt_uploaded', updated_at = NOW() WHERE id = $1",
      [purchase.id],
    );

    await notifyUser(task.poster_id, {
      type: "purchase_receipt_uploaded",
      title: "Receipt Uploaded",
      body: `Receipt for ₦${receiptAmountNaira.toLocaleString()} uploaded. Within budget — continuing automatically.`,
      taskId,
      conversationId: undefined,
      actorId: userId,
    });

    return { purchaseId: purchase.id, status: "receipt_uploaded", withinBudget: true };
  } else {
    // Over budget — needs approval
    const excessKobo = receiptAmountKobo - purchase.estimated_item_cost;
    await db.query(
      "UPDATE purchase_tasks SET status = 'needs_budget_approval', updated_at = NOW() WHERE id = $1",
      [purchase.id],
    );

    await notifyUser(task.poster_id, {
      type: "purchase_budget_approval_needed",
      title: "Budget Approval Needed",
      body: `Purchase total of ₦${receiptAmountNaira.toLocaleString()} exceeds your approved estimate by ₦${(excessKobo / 100).toLocaleString()}. Please review.`,
      taskId,
      conversationId: undefined,
      actorId: userId,
    });

    return { purchaseId: purchase.id, status: "needs_budget_approval", withinBudget: false, excessKobo };
  }
}

// ─── Budget Approval ───────────────────────────────────────────────────────────

export async function requestBudgetApproval(
  taskId: string,
  runnerId: string,
  excessAmountNaira: number,
  actualReceiptAmountNaira: number,
  reason?: string,
) {
  const purchase = await queryOne<PurchaseTaskRow>(
    "SELECT pt.* FROM purchase_tasks pt JOIN tasks t ON pt.task_id = t.id WHERE pt.task_id = $1 AND t.assigned_to = $2",
    [taskId, runnerId],
  );

  if (!purchase) throw new Error("Purchase task not found or you're not the assigned runner");
  if (purchase.status !== "needs_budget_approval") throw new Error("No budget approval pending");

  const excessKobo = Math.round(excessAmountNaira * 100);
  const actualKobo = Math.round(actualReceiptAmountNaira * 100);

  const result = await db.query(
    `INSERT INTO purchase_budget_approvals (purchase_task_id, requested_by, excess_amount, actual_receipt_amount, reason, status)
     VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING id`,
    [purchase.id, runnerId, excessKobo, actualKobo, reason || null],
  );

  await logAudit(purchase.id, "budget_approval_requested", runnerId, { excessKobo });

  return { approvalId: result.rows[0].id };
}

export async function approveBudget(approvalId: string, posterId: string) {
  const approval = await queryOne<{ id: string; purchase_task_id: string; excess_amount: number; status: string; requested_by: string }>(
    "SELECT * FROM purchase_budget_approvals WHERE id = $1",
    [approvalId],
  );

  if (approval.status !== "pending") throw new Error("Approval already resolved");
  if (!approval.purchase_task_id) throw new Error("Approval not found");

  const purchase = await queryOne<PurchaseTaskRow>(
    "SELECT * FROM purchase_tasks WHERE id = $1",
    [approval.purchase_task_id],
  );

  const task = await queryOne<TaskRow>(
    "SELECT * FROM tasks WHERE id = $1",
    [purchase.task_id],
  );

  if (task.poster_id !== posterId) throw new Error("Only the poster can approve budget overages");

  await withTransaction(async (client) => {
    await client.query(
      "UPDATE purchase_budget_approvals SET status = 'approved', resolved_by = $1, resolved_at = NOW() WHERE id = $2",
      [posterId, approvalId],
    );

    await client.query(
      "UPDATE purchase_tasks SET status = 'receipt_uploaded', updated_at = NOW() WHERE id = $1",
      [purchase.id],
    );

    // Lock extra amount from poster's wallet
    if (approval.excess_amount > 0) {
      await lockEscrow(client, posterId, approval.excess_amount, purchase.task_id);

      // Update total_escrow to reflect the additional amount
      await client.query(
        "UPDATE purchase_tasks SET total_escrow = total_escrow + $1, estimated_item_cost = estimated_item_cost + $1, updated_at = NOW() WHERE id = $2",
        [approval.excess_amount, purchase.id],
      );
    }
  });

  await logAudit(purchase.id, "budget_approved", posterId, { approvalId, excessKobo: approval.excess_amount });

  await notifyUser(approval.requested_by, {
    type: "purchase_budget_approved",
    title: "Additional Budget Approved",
    body: `Poster approved ₦${(approval.excess_amount / 100).toLocaleString()} extra. You can continue.`,
    taskId: purchase.task_id,
    conversationId: undefined,
    actorId: posterId,
  });

  return { purchaseId: purchase.id, status: "receipt_uploaded" };
}

export async function rejectBudget(approvalId: string, posterId: string) {
  const approval = await queryOne<{ id: string; purchase_task_id: string; excess_amount: number; status: string; requested_by: string }>(
    "SELECT * FROM purchase_budget_approvals WHERE id = $1",
    [approvalId],
  );

  if (approval.status !== "pending") throw new Error("Approval already resolved");

  await db.query(
    "UPDATE purchase_budget_approvals SET status = 'rejected', resolved_by = $1, resolved_at = NOW() WHERE id = $2",
    [posterId, approvalId],
  );

  // Keep status as needs_budget_approval — poster can request adjustments via chat
  await logAudit(approval.purchase_task_id, "budget_rejected", posterId, { approvalId });

  await notifyUser(approval.requested_by, {
    type: "purchase_budget_rejected",
    title: "Additional Budget Rejected",
    body: "The poster has rejected the additional budget. Please discuss adjustments via chat.",
    taskId: approval.purchase_task_id,
    conversationId: undefined,
    actorId: posterId,
  });

  return { approvalId };
}

// ─── Delivery OTP ──────────────────────────────────────────────────────────────

export async function generateDeliveryOTP(taskId: string, userId: string) {
  const task = await queryOne<TaskRow>(
    "SELECT id, poster_id, assigned_to, budget_kobo, is_purchase FROM tasks WHERE id = $1",
    [taskId],
  );

  if (task.assigned_to !== userId) throw new Error("Only the assigned runner can generate OTP");
  if (!task.is_purchase) throw new Error("Not a purchase task");

  const purchase = await queryOne<PurchaseTaskRow>(
    "SELECT * FROM purchase_tasks WHERE task_id = $1",
    [taskId],
  );

  if (purchase.status !== "heading_to_delivery" && purchase.status !== "receipt_uploaded") {
    throw new Error("Must be heading to delivery to generate OTP");
  }

  // Generate 6-digit OTP
  const otp = String(Math.floor(100000 + Math.random() * 900000));

  await db.query(
    "UPDATE purchase_tasks SET delivery_otp = $1, otp_generated_at = NOW(), status = 'heading_to_delivery', updated_at = NOW() WHERE id = $2",
    [otp, purchase.id],
  );

  await logAudit(purchase.id, "otp_generated", userId, {});

  // Show OTP to runner
  await notifyUser(userId, {
    type: "purchase_otp_ready",
    title: "Delivery OTP Generated",
    body: `Your delivery OTP is: ${otp}. Share this with the poster upon arrival to complete delivery.`,
    taskId,
    conversationId: undefined,
    actorId: userId,
  });

  await notifyUser(task.poster_id, {
    type: "purchase_otp_ready",
    title: "Runner Heading to You",
    body: "Runner is heading to the delivery location. Open the task to reveal the delivery OTP when they arrive.",
    taskId,
    conversationId: undefined,
    actorId: userId,
  });

  return { otp, purchaseId: purchase.id };
}

export async function verifyDeliveryOTP(taskId: string, userId: string, otp: string) {
  const task = await queryOne<TaskRow>(
    "SELECT id, poster_id, assigned_to, budget_kobo, is_purchase FROM tasks WHERE id = $1",
    [taskId],
  );

  if (task.assigned_to !== userId) throw new Error("Only the assigned runner can verify OTP");
  if (!task.is_purchase) throw new Error("Not a purchase task");

  const purchase = await queryOne<PurchaseTaskRow>(
    "SELECT * FROM purchase_tasks WHERE task_id = $1",
    [taskId],
  );

  if (purchase.status !== "heading_to_delivery") throw new Error("No pending delivery to verify");

  // The runner enters the OTP — they need to get it from the poster
  // In the app, the poster sees the OTP and tells the runner
  // The runner then enters it to confirm delivery
  if (purchase.delivery_otp !== otp) {
    throw new Error("Invalid OTP. Please check with the poster.");
  }

  await db.query(
    "UPDATE purchase_tasks SET otp_verified_at = NOW(), status = 'delivered', updated_at = NOW() WHERE id = $1",
    [purchase.id],
  );

  await logAudit(purchase.id, "otp_verified", userId, {});

  await notifyUser(task.poster_id, {
    type: "purchase_delivered",
    title: "Items Delivered!",
    body: "The runner has confirmed delivery. Please check your items and confirm delivery to release payment.",
    taskId,
    conversationId: undefined,
    actorId: userId,
  });

  return { purchaseId: purchase.id, status: "delivered" };
}

// ─── Poster Confirmation ───────────────────────────────────────────────────────

export async function confirmDelivery(taskId: string, posterId: string) {
  const task = await queryOne<TaskRow>(
    "SELECT id, poster_id, title, assigned_to, budget_kobo, is_purchase FROM tasks WHERE id = $1",
    [taskId],
  );

  if (task.poster_id !== posterId) throw new Error("Only the poster can confirm delivery");
  if (!task.is_purchase) throw new Error("Not a purchase task");

  const purchase = await queryOne<PurchaseTaskRow>(
    "SELECT * FROM purchase_tasks WHERE task_id = $1",
    [taskId],
  );

  if (purchase.status !== "delivered") throw new Error("Task has not been marked as delivered");

  // Release funds
  const runnerReceives = purchase.estimated_item_cost + purchase.runner_fee; // item reimbursement + runner fee
  const platformKeeps = purchase.platform_fee;

  await withTransaction(async (client) => {
    // Release escrow: runner gets item cost + runner fee, platform keeps fee
    await releaseEscrow(client, posterId, task.assigned_to!, runnerReceives + platformKeeps, taskId, PLATFORM_FEE_PERCENT);

    await client.query(
      "UPDATE purchase_tasks SET status = 'completed', updated_at = NOW() WHERE id = $1",
      [purchase.id],
    );

    await client.query(
      "UPDATE tasks SET status = 'completed', updated_at = NOW() WHERE id = $1",
      [taskId],
    );
  });

  await logAudit(purchase.id, "purchase_completed", posterId, {
    runnerReceivesKobo: runnerReceives,
    platformFeeKobo: platformKeeps,
  });

  await notifyUser(task.assigned_to!, {
    type: "purchase_payment_released",
    title: "Payment Released!",
    body: `₦${(runnerReceives / 100).toLocaleString()} has been added to your wallet. ₦${(platformKeeps / 100).toLocaleString()} platform fee deducted.`,
    taskId,
    conversationId: undefined,
    actorId: posterId,
  });

  await notifyUser(posterId, {
    type: "purchase_completed",
    title: "Purchase Task Complete",
    body: `"${task.title}" completed. Thank you for using NeedFull escrow!`,
    taskId,
    conversationId: undefined,
    actorId: task.assigned_to!,
  });

  return { purchaseId: purchase.id, status: "completed" };
}

// ─── Report Issue (opens dispute) ──────────────────────────────────────────────

export async function openDispute(
  taskId: string,
  userId: string,
  reason: string,
  description?: string,
) {
  const task = await queryOne<TaskRow>(
    "SELECT id, poster_id, assigned_to, budget_kobo, is_purchase FROM tasks WHERE id = $1",
    [taskId],
  );

  if (task.poster_id !== userId && task.assigned_to !== userId) {
    throw new Error("Only the poster or runner can open a dispute");
  }
  if (!task.is_purchase) throw new Error("Not a purchase task");

  const purchase = await queryOne<PurchaseTaskRow>(
    "SELECT * FROM purchase_tasks WHERE task_id = $1",
    [taskId],
  );

  if (purchase.status !== "delivered" && purchase.status !== "heading_to_delivery") {
    throw new Error("Can only dispute after delivery attempt");
  }

  await db.query(
    "UPDATE purchase_tasks SET status = 'disputed', updated_at = NOW() WHERE id = $1",
    [purchase.id],
  );

  const disputeResult = await db.query(
    `INSERT INTO purchase_disputes (purchase_task_id, opened_by, reason, description, status)
     VALUES ($1, $2, $3, $4, 'open') RETURNING id`,
    [purchase.id, userId, reason, description || null],
  );

  await logAudit(purchase.id, "dispute_opened", userId, { disputeId: disputeResult.rows[0].id, reason });

  // Notify the other party
  const otherParty = task.poster_id === userId ? task.assigned_to : task.poster_id;
  if (otherParty) {
    await notifyUser(otherParty, {
      type: "purchase_dispute_opened",
      title: "Dispute Opened",
      body: `A dispute has been opened for "${task.title}". An admin will review the case.`,
      taskId,
      conversationId: undefined,
      actorId: userId,
    });
  }

  return { disputeId: disputeResult.rows[0].id, purchaseId: purchase.id };
}

// ─── Upload Dispute Evidence ───────────────────────────────────────────────────

export async function uploadDisputeEvidence(
  disputeId: string,
  userId: string,
  fileUrl: string,
  description?: string,
) {
  const result = await db.query(
    `INSERT INTO purchase_dispute_evidence (dispute_id, uploaded_by, file_url, description)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [disputeId, userId, fileUrl, description || null],
  );

  return { evidenceId: result.rows[0].id };
}

// ─── Admin: Resolve Dispute ────────────────────────────────────────────────────

export async function resolveDispute(
  disputeId: string,
  adminId: string,
  resolution: "release_to_runner" | "refund_poster" | "split",
  notes?: string,
) {
  const dispute = await queryOne<{
    id: string;
    purchase_task_id: string;
    status: string;
  }>("SELECT * FROM purchase_disputes WHERE id = $1", [disputeId]);

  if (dispute.status !== "open" && dispute.status !== "under_review") {
    throw new Error("Dispute already resolved");
  }

  const purchase = await queryOne<PurchaseTaskRow>(
    "SELECT * FROM purchase_tasks WHERE id = $1",
    [dispute.purchase_task_id],
  );

  const task = await queryOne<TaskRow>(
    "SELECT * FROM tasks WHERE id = $1",
    [purchase.task_id],
  );

  await withTransaction(async (client) => {
    await client.query(
      "UPDATE purchase_disputes SET status = 'resolved', resolution = $1, admin_id = $2, admin_notes = $3, resolved_at = NOW() WHERE id = $4",
      [resolution, adminId, notes || null, disputeId],
    );

    if (resolution === "release_to_runner") {
      const runnerReceives = purchase.estimated_item_cost + purchase.runner_fee;
      const platformKeeps = purchase.platform_fee;
      await releaseEscrow(client, task.poster_id, task.assigned_to!, runnerReceives + platformKeeps, purchase.task_id, PLATFORM_FEE_PERCENT);
      await client.query(
        "UPDATE purchase_tasks SET status = 'completed', updated_at = NOW() WHERE id = $1",
        [purchase.id],
      );
      await client.query(
        "UPDATE tasks SET status = 'completed', updated_at = NOW() WHERE id = $1",
        [purchase.task_id],
      );
    } else if (resolution === "refund_poster") {
      await refundEscrow(client, task.poster_id, purchase.total_escrow, purchase.task_id);
      await client.query(
        "UPDATE purchase_tasks SET status = 'refunded', updated_at = NOW() WHERE id = $1",
        [purchase.id],
      );
      await client.query(
        "UPDATE tasks SET status = 'cancelled', updated_at = NOW() WHERE id = $1",
        [purchase.task_id],
      );
    } else if (resolution === "split") {
      // Split: runner gets runner_fee, poster gets rest refunded
      const runnerGets = purchase.runner_fee;
      const refundAmount = purchase.total_escrow - runnerGets - purchase.platform_fee;

      await client.query(
        `UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2`,
        [runnerGets, task.assigned_to],
      );
      await client.query(
        `UPDATE wallets SET escrow = escrow - $1, balance = balance + $2, updated_at = NOW() WHERE user_id = $3`,
        [purchase.total_escrow, refundAmount, task.poster_id],
      );

      // WHAT: Runner's share goes to EARNINGS bucket, never spendable balance
      // WHY: Runner money is earned money — same rule as releaseEscrow
      const runnerWallet = await client.query<any>(
        `SELECT id, earnings FROM wallets WHERE user_id = $1 FOR UPDATE`,
        [task.assigned_to],
      );
      if (runnerWallet.rows.length === 0) {
        throw new Error(`Runner wallet not found for user ${task.assigned_to}`);
      }
      await client.query(
        `UPDATE wallets SET earnings = earnings + $1, updated_at = NOW() WHERE user_id = $2`,
        [runnerGets, task.assigned_to],
      );
      await client.query(
        `INSERT INTO wallet_transactions 
         (wallet_id, type, amount, balance_before, balance_after, task_id, note, created_at)
         VALUES ($1, 'earnings', $2, $3, $4, $5, $6, NOW())`,
        [
          runnerWallet.rows[0].id,
          runnerGets,
          runnerWallet.rows[0].earnings,
          runnerWallet.rows[0].earnings + runnerGets,
          task.id,
          `Runner fee from purchase dispute split (task ${task.id})`,
        ],
      );

      await client.query(
        "UPDATE purchase_tasks SET status = 'completed', updated_at = NOW() WHERE id = $1",
        [purchase.id],
      );
      await client.query(
        "UPDATE tasks SET status = 'completed', updated_at = NOW() WHERE id = $1",
        [purchase.task_id],
      );
    }
  });

  const resolutionLabels: Record<string, string> = {
    release_to_runner: "Funds released to runner",
    refund_poster: "Funds refunded to poster",
    split: "Funds split between both parties",
  };

  await notifyUser(task.poster_id, {
    type: "purchase_dispute_resolved",
    title: "Dispute Resolved",
    body: resolutionLabels[resolution],
    taskId: purchase.task_id,
    conversationId: undefined,
    actorId: adminId,
  });

  if (task.assigned_to) {
    await notifyUser(task.assigned_to, {
      type: "purchase_dispute_resolved",
      title: "Dispute Resolved",
      body: resolutionLabels[resolution],
      taskId: purchase.task_id,
      conversationId: undefined,
      actorId: adminId,
    });
  }

  await logAudit(purchase.id, "dispute_resolved", adminId, { disputeId, resolution });

  return { disputeId, resolution };
}

// ─── Admin: Get Purchase Detail ────────────────────────────────────────────────

export async function getPurchaseDetail(taskId: string) {
  const task = await queryOne<any>(
    `SELECT t.id, t.title, t.description, t.status, t.budget_kobo, t.is_purchase, t.created_at, t.updated_at,
            jsonb_build_object('id', p.id, 'fullName', p.full_name, 'email', p.email) as poster,
            CASE WHEN t.assigned_to IS NOT NULL THEN jsonb_build_object('id', r.id, 'fullName', r.full_name, 'email', r.email) ELSE NULL END as runner
     FROM tasks t
     JOIN users p ON t.poster_id = p.id
     LEFT JOIN users r ON t.assigned_to = r.id
     WHERE t.id = $1`,
    [taskId],
  );

  if (!task) throw Object.assign(new Error("Task not found"), { statusCode: 404 });

  const purchase = await queryOne<any>(
    `SELECT * FROM purchase_tasks WHERE task_id = $1`,
    [taskId],
  );

  const approvals = (await db.query<any>(
    "SELECT * FROM purchase_budget_approvals WHERE purchase_task_id = $1 ORDER BY created_at DESC",
    [purchase?.id],
  )).rows;

  const disputes = (await db.query<any>(
    `SELECT pd.*, jsonb_build_object('id', u.id, 'fullName', u.full_name) as opener
     FROM purchase_disputes pd
     JOIN users u ON pd.opened_by = u.id
     WHERE pd.purchase_task_id = $1 ORDER BY pd.created_at DESC`,
    [purchase?.id],
  )).rows;

  const auditLogs = (await db.query<any>(
    `SELECT pal.*, jsonb_build_object('id', u.id, 'fullName', u.full_name) as actor
     FROM purchase_audit_logs pal
     LEFT JOIN users u ON pal.actor_id = u.id
     WHERE pal.purchase_task_id = $1 ORDER BY pal.created_at DESC`,
    [purchase?.id],
  )).rows;

  const walletMovements = (await db.query<any>(
    `SELECT wt.*, jsonb_build_object('id', u.id, 'fullName', u.full_name) as "user"
     FROM wallet_transactions wt
     JOIN users u ON wt.user_id = u.id
     WHERE wt.task_id = $1 ORDER BY wt.created_at DESC`,
    [taskId],
  )).rows;

  return {
    task,
    purchase,
    budgetApprovals: approvals,
    disputes,
    auditLogs,
    walletMovements,
  };
}

// ─── Admin: Escrow Stats ───────────────────────────────────────────────────────

export async function getEscrowStats() {
  const totalEscrow = (await db.query<any>(
    "SELECT COALESCE(SUM(total_escrow), 0) as total FROM purchase_tasks WHERE status IN ('funded','accepted','at_store','shopping','receipt_uploaded','needs_budget_approval','heading_to_delivery','delivered','disputed')",
  )).rows[0]?.total || 0;

  const todayTransactions = (await db.query<any>(
    "SELECT COUNT(*) as count FROM purchase_audit_logs WHERE created_at >= CURRENT_DATE",
  )).rows[0]?.count || 0;

  const completed = (await db.query<any>(
    "SELECT COUNT(*) as count FROM purchase_tasks WHERE status = 'completed'",
  )).rows[0]?.count || 0;

  const pendingDeliveries = (await db.query<any>(
    "SELECT COUNT(*) as count FROM purchase_tasks WHERE status IN ('heading_to_delivery','delivered')",
  )).rows[0]?.count || 0;

  const pendingConfirmations = (await db.query<any>(
    "SELECT COUNT(*) as count FROM purchase_tasks WHERE status = 'delivered'",
  )).rows[0]?.count || 0;

  const pendingBudgetApprovals = (await db.query<any>(
    "SELECT COUNT(*) as count FROM purchase_tasks WHERE status = 'needs_budget_approval'",
  )).rows[0]?.count || 0;

  const openDisputes = (await db.query<any>(
    "SELECT COUNT(*) as count FROM purchase_disputes WHERE status IN ('open','under_review')",
  )).rows[0]?.count || 0;

  const totalRefunded = (await db.query<any>(
    "SELECT COALESCE(SUM(total_escrow), 0) as total FROM purchase_tasks WHERE status = 'refunded'",
  )).rows[0]?.total || 0;

  const totalReleased = (await db.query<any>(
    "SELECT COALESCE(SUM(total_escrow), 0) as total FROM purchase_tasks WHERE status = 'completed'",
  )).rows[0]?.total || 0;

  return {
    totalEscrowKobo: totalEscrow,
    totalEscrowNaira: totalEscrow / 100,
    todayTransactions,
    completedPurchases: completed,
    pendingDeliveries,
    pendingConfirmations,
    pendingBudgetApprovals,
    openDisputes,
    totalRefundedKobo: totalRefunded,
    totalRefundedNaira: totalRefunded / 100,
    totalReleasedKobo: totalReleased,
    totalReleasedNaira: totalReleased / 100,
  };
}

// ─── Admin: List Purchase Tasks ────────────────────────────────────────────────

export async function listPurchaseTasks(filters: {
  status?: string;
  page?: number;
  perPage?: number;
}) {
  const page = filters.page || 1;
  const perPage = filters.perPage || 20;
  const offset = (page - 1) * perPage;
  const params: unknown[] = [];
  let statusClause = "";

  if (filters.status) {
    statusClause = "AND pt.status = $1";
    params.push(filters.status);
  }

  const countResult = await db.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM purchase_tasks pt ${statusClause ? `WHERE pt.status = $1` : ""}`,
    statusClause ? [filters.status] : [],
  );

  const idx = params.length + 1;
  const rows = await db.query<any>(
    `SELECT pt.*, t.title, t.status as task_status,
            jsonb_build_object('id', u.id, 'fullName', u.full_name) as poster
     FROM purchase_tasks pt
     JOIN tasks t ON pt.task_id = t.id
     JOIN users u ON t.poster_id = u.id
     ${statusClause.replace("pt.", "")}
     ORDER BY pt.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, perPage, offset],
  );

  return {
    data: rows.rows,
    pagination: {
      page,
      perPage,
      total: parseInt(countResult.rows[0]?.count || "0", 10),
    },
  };
}
