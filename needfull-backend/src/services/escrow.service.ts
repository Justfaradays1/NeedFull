// WHAT: Escrow service — wraps wallet.service with business logic, notifications, and emails
// WHY: Callers manage zero transactions; escrow.service always handles withTransaction internally
// FUTURE: Add platform fee tracking dashboard for admin analytics

import { queryOne, withTransaction } from "../config/db";
import { PLATFORM_FEE_PERCENT } from "../config/constants";
import { lockEscrow, releaseEscrow, refundEscrow } from "./wallet.service";
import { notifyUser } from "./notification.service";
import { sendTaskPaymentReleased } from "./email.service";

// WHAT: Minimal task row shape for escrow operations
interface TaskRow {
  id: string;
  poster_id: string;
  runner_id: string | null;
  agreed_amount_kobo: number | null;
  budget_kobo: number;
  title: string;
  status: string;
}

// WHAT: User row shape for email dispatch
interface UserRow {
  id: string;
  full_name: string;
  email: string;
}

// WHAT: Lock task budget in escrow — called when task is posted
// WHY: Reserves funds before task goes live, notifies poster
export async function lockTaskEscrow(
  posterId: string,
  taskId: string,
  amountKobo: number,
): Promise<void> {
  await withTransaction(async (client) => {
    await lockEscrow(client, posterId, amountKobo, taskId);
  });

  await notifyUser(posterId, {
    type: "escrow_locked",
    title: "Payment secured",
    body: `₦${(amountKobo / 100).toLocaleString()} is locked in escrow for your task. Released when you confirm completion.`,
    taskId,
    conversationId: undefined,
    actorId: posterId,
  });
}

// WHAT: Release escrow to runner after task completion
// WHY: Pays runner (minus platform fee), notifies both parties, sends runner email
export async function releaseTaskEscrow(taskId: string): Promise<void> {
  // WHAT: Fetch task details — must be in_progress
  const task = await queryOne<TaskRow>(
    `SELECT id, poster_id, assigned_to as runner_id, agreed_amount_kobo, budget_kobo, title, status
     FROM tasks WHERE id = $1`,
    [taskId],
  );

  if (task.status !== "in_progress") {
    throw new Error(`Task is not in_progress (status: ${task.status})`);
  }

  if (!task.runner_id) {
    throw new Error("No runner assigned to this task");
  }

  const amountKobo = task.agreed_amount_kobo ?? task.budget_kobo;
  const feeKobo = Math.floor((amountKobo * PLATFORM_FEE_PERCENT) / 100);
  const runnerReceivesKobo = amountKobo - feeKobo;

  // WHAT: Release escrow inside transaction
  await withTransaction(async (client) => {
    await releaseEscrow(
      client,
      task.poster_id,
      task.runner_id!,
      amountKobo,
      taskId,
      PLATFORM_FEE_PERCENT,
    );
  });

  // WHAT: Fetch runner details for notification and email
  const runner = await queryOne<UserRow>(
    `SELECT id, full_name, email FROM users WHERE id = $1`,
    [task.runner_id],
  );

  // WHAT: Notify runner
  await notifyUser(task.runner_id, {
    type: "payment_received",
    title: "Payment received!",
    body: `₦${(runnerReceivesKobo / 100).toLocaleString()} has been added to your wallet.`,
    taskId,
    conversationId: undefined,
    actorId: task.poster_id,
  });

  // WHAT: Notify poster
  await notifyUser(task.poster_id, {
    type: "escrow_released",
    title: "Task payment released",
    body: "Payment released to runner. Rate your experience.",
    taskId,
    conversationId: undefined,
    actorId: task.runner_id,
  });

  // WHAT: Send runner email (non-blocking, best-effort)
  sendTaskPaymentReleased(
    runner.email,
    runner.full_name,
    runnerReceivesKobo / 100,
  ).catch((err: any) =>
    console.warn("[Escrow] Payment release email failed:", err),
  );
}

// WHAT: Refund escrow back to poster — e.g. task cancelled before completion
// WHY: Returns locked funds, notifies poster with reason
export async function refundTaskEscrow(
  taskId: string,
  reason: string,
): Promise<void> {
  // WHAT: Fetch task — must have escrow locked
  const task = await queryOne<TaskRow>(
    `SELECT id, poster_id, assigned_to as runner_id, agreed_amount_kobo, budget_kobo, title, status
     FROM tasks WHERE id = $1`,
    [taskId],
  );

  const amountKobo = task.agreed_amount_kobo ?? task.budget_kobo;

  // WHAT: Refund escrow inside transaction
  await withTransaction(async (client) => {
    await refundEscrow(client, task.poster_id, amountKobo, taskId);
  });

  await notifyUser(task.poster_id, {
    type: "escrow_refunded",
    title: "Payment refunded",
    body: `₦${(amountKobo / 100).toLocaleString()} returned to your wallet. Reason: ${reason}`,
    taskId,
    conversationId: undefined,
    actorId: task.poster_id,
  });
}
