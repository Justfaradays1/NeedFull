// WHAT: Budget proposal service — the auditable negotiation record between a
//       Runner's proposed amount and the Poster's original budget.
// WHY: A proposal is a SEPARATE entity, never an edit of the task. The original
//      budget (tasks.budget_kobo) is preserved forever; the negotiated amount
//      (proposed_amount_kobo) is only ever AGREED, never overwritten. Accepting
//      a higher proposal creates an AWAITING_FUNDING state — the poster must
//      actually fund the difference (idempotently) before the task can start.
// RULES: All monetary calculations are server-authoritative. The client never
//        sends differences, escrow amounts, or agreed amounts.

import db, { queryOne, withTransaction } from "../config/db";
import { PoolClient } from "pg";
import { lockEscrow } from "./wallet.service";
import { notifyUser, notifyMany } from "./notification.service";
import { getOrCreateTaskConversation } from "./conversation.service";
import {
  TaskStatus,
  canonicalStatus,
  RunnerPhase,
} from "./task-states";
import { MIN_TASK_BUDGET_KOBO, PROPOSAL_EXPIRY_HOURS } from "../config/constants";
import { v4 as uuidv4 } from "uuid";

// WHAT: Proposal lifecycle statuses (lowercase — matches codebase conventions)
export const ProposalStatus = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
} as const;

export const NEGOTIABLE_PROPOSAL_STATUSES = [ProposalStatus.PENDING] as const;

interface ProposalRow {
  id: string;
  task_id: string;
  application_id: string | null;
  proposer_id: string;
  original_amount_kobo: number;
  proposed_amount_kobo: number;
  difference_kobo: number;
  reason: string | null;
  status: string;
  created_at: string;
  responded_at: string | null;
  expires_at: string;
}

interface TaskRow {
  id: string;
  poster_id: string;
  title: string;
  budget_kobo: number;
  escrow_amount_kobo: number;
  agreed_amount_kobo: number | null;
  status: string;
  runner_id: string | null;
  runner_done_at: string | null;
  runner_phase: string | null;
}

// WHAT: Fetch the task shape used across this service
async function loadTask(taskId: string): Promise<TaskRow> {
  return queryOne<TaskRow>(
    `SELECT id, poster_id, title, budget_kobo, escrow_amount_kobo,
            agreed_amount_kobo, status, assigned_to as runner_id,
            runner_done_at, runner_phase
     FROM tasks WHERE id = $1`,
    [taskId],
  );
}

// WHAT: Shared guard — can this user propose a different budget on this task?
// WHY: Duplicated between apply() and the standalone proposal endpoint so both
//      paths enforce identical rules.
export async function assertCanPropose(
  task: TaskRow,
  userId: string,
): Promise<void> {
  const canonical = canonicalStatus(task.status, {
    runnerDoneAt: task.runner_done_at,
    runnerPhase: task.runner_phase,
  });
  if (canonical !== TaskStatus.PUBLISHED) {
    throw new Error("This task is no longer open for budget negotiation");
  }
  if (task.poster_id === userId) {
    throw new Error("You cannot propose a budget on your own task");
  }
  const existing = await db.query(
    `SELECT id FROM task_budget_proposals
     WHERE task_id = $1 AND proposer_id = $2 AND status = $3`,
    [task.id, userId, ProposalStatus.PENDING],
  );
  if (existing.rows.length > 0) {
    throw new Error("You already have a pending budget proposal on this task");
  }
}

// WHAT: Validate a proposed amount (authoritative, integer kobo)
// WHY: Never trust client-sent differences — only the raw amount is accepted
function assertValidAmountKobo(amountKobo: number, originalKobo: number): void {
  if (!Number.isInteger(amountKobo) || amountKobo <= 0) {
    throw new Error("Proposed amount must be a positive whole amount");
  }
  if (amountKobo < MIN_TASK_BUDGET_KOBO) {
    throw new Error(
      `The proposed amount must be at least ₦${(MIN_TASK_BUDGET_KOBO / 100).toFixed(0)}`,
    );
  }
  if (amountKobo === originalKobo) {
    throw new Error("Your proposed amount matches the task budget — no proposal needed");
  }
}

// WHAT: Low-level proposal INSERT (reused by apply() inside its own transaction)
// WHY: apply() must create application + proposal atomically; the standalone
//      endpoint wraps this in its own transaction.
export async function insertProposal(
  client: PoolClient,
  params: {
    taskId: string;
    applicationId?: string | null;
    proposerId: string;
    amountKobo: number;
    reason?: string | null;
    status?: string;
    respondedAt?: string | null;
  },
): Promise<ProposalRow> {
  const original = await client.query<{ budget_kobo: number }>(
    `SELECT budget_kobo FROM tasks WHERE id = $1`,
    [params.taskId],
  );
  const originalKobo = original.rows[0]?.budget_kobo ?? 0;
  const proposalId = uuidv4();
  const row = await client.query<ProposalRow>(
    `INSERT INTO task_budget_proposals
     (id, task_id, application_id, proposer_id, original_amount_kobo,
      proposed_amount_kobo, difference_kobo, reason, status, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9,
             NOW() + make_interval(hours => ${PROPOSAL_EXPIRY_HOURS}))
     RETURNING *`,
    [
      proposalId,
      params.taskId,
      params.applicationId || null,
      params.proposerId,
      originalKobo,
      params.amountKobo,
      params.amountKobo - originalKobo,
      params.reason?.trim() || null,
      params.status || ProposalStatus.PENDING,
    ],
  );
  return row.rows[0];
}

// WHAT: Create a proposal on an existing application (runner re-negotiates)
//       — POST /api/tasks/:taskId/proposals
export async function createProposal(params: {
  taskId: string;
  userId: string;
  amountNaira: number;
  reason?: string;
}): Promise<any> {
  const task = await loadTask(params.taskId);
  await assertCanPropose(task, params.userId);

  const amountKobo = Math.floor(params.amountNaira * 100);
  assertValidAmountKobo(amountKobo, task.budget_kobo);

  // WHAT: The runner must have an active application on this task to negotiate
  const app = await queryOne<{ id: string }>(
    `SELECT id FROM task_applications
     WHERE task_id = $1 AND runner_id = $2 AND status IN ('pending', 'negotiating')
     ORDER BY created_at DESC LIMIT 1`,
    [params.taskId, params.userId],
  ).catch(() => null);

  const applicationId = app?.id ?? null;
  if (!applicationId) {
    throw new Error("You can only propose a budget after applying to this task");
  }

  const proposal = await withTransaction(async (client) => {
    // WHAT: Keep the application's shown amount in sync with the latest ask
    await client.query(
      `UPDATE task_applications SET proposed_amount_kobo = $1, updated_at = NOW()
       WHERE id = $2`,
      [amountKobo, applicationId],
    );
    return insertProposal(client, {
      taskId: params.taskId,
      applicationId,
      proposerId: params.userId,
      amountKobo,
      reason: params.reason,
    });
  });

  // WHAT: Notify the poster
  await notifyUser(task.poster_id, {
    type: "budget_proposal_sent",
    title: "New Budget Proposal",
    body: `A runner proposed ₦${(amountKobo / 100).toLocaleString()} for "${task.title}" (original ₦${(task.budget_kobo / 100).toLocaleString()}).`,
    taskId: params.taskId,
    conversationId: undefined,
    actorId: params.userId,
  });

  console.info(
    `[Proposal] created task=${params.taskId} proposal=${proposal.id} proposer=${params.userId} original=${task.budget_kobo} proposed=${amountKobo} diff=${proposal.difference_kobo}`,
  );

  return {
    proposalId: proposal.id,
    originalBudget: { kobo: proposal.original_amount_kobo, naira: proposal.original_amount_kobo / 100 },
    proposedAmount: { kobo: proposal.proposed_amount_kobo, naira: proposal.proposed_amount_kobo / 100 },
    difference: { kobo: proposal.difference_kobo, naira: proposal.difference_kobo / 100 },
    additionalFundingRequired: {
      kobo: Math.max(0, proposal.difference_kobo),
      naira: Math.max(0, proposal.difference_kobo) / 100,
    },
    status: proposal.status,
  };
}

// WHAT: Hire a runner whose agreed amount does NOT require additional funding
//       (equal or lower than the amount already in escrow). Lower agreements
//       KEEP the excess in escrow — it is refunded at settlement, never
//       silently moved at hire time.
async function finalizeHire(
  client: PoolClient,
  task: TaskRow,
  opts: { runnerId: string; agreedAmountKobo: number; applicationId: string | null },
): Promise<void> {
  await client.query(
    `UPDATE tasks
     SET status = 'in_progress', assigned_to = $1, agreed_amount_kobo = $2,
         runner_phase = $3, updated_at = NOW()
     WHERE id = $4`,
    [opts.runnerId, opts.agreedAmountKobo, RunnerPhase.MATCHED, task.id],
  );
  await client.query(
    `UPDATE users SET runner_busy = true, updated_at = NOW() WHERE id = $1`,
    [opts.runnerId],
  );
  if (opts.applicationId) {
    await client.query(
      `UPDATE task_applications
       SET status = 'accepted', agreed_amount_kobo = $1, updated_at = NOW()
       WHERE id = $2`,
      [opts.agreedAmountKobo, opts.applicationId],
    );
    await client.query(
      `UPDATE task_applications
       SET status = 'rejected', updated_at = NOW()
       WHERE task_id = $1 AND id != $2 AND status IN ('pending', 'negotiating')`,
      [task.id, opts.applicationId],
    );
  }
}

// WHAT: Reject every other application + notify their runners (non-blocking)
async function notifyRejectedRunners(
  taskId: string,
  keepRunnerId: string,
  posterId: string,
  taskTitle: string,
): Promise<void> {
  const rejectedApps = await db.query<{ runner_id: string }>(
    `SELECT runner_id FROM task_applications
     WHERE task_id = $1 AND status = 'rejected' AND runner_id != $2`,
    [taskId, keepRunnerId],
  );
  if (rejectedApps.rows.length > 0) {
    notifyMany(
      rejectedApps.rows.map((r) => r.runner_id),
      {
        type: "application_rejected",
        title: "Application Not Selected",
        body: `Another runner was selected for "${taskTitle}"`,
        taskId,
        conversationId: undefined,
        actorId: posterId,
      },
    ).catch(() => {});
  }
}

// WHAT: Poster accepts a runner's proposed amount.
//       If proposed > escrowed → AWAITING_FUNDING (funding is a SEPARATE step).
//       If proposed <= escrowed → immediate hire; excess stays until settlement.
export async function acceptProposal(
  proposalId: string,
  posterId: string,
): Promise<any> {
  const proposal = await queryOne<ProposalRow>(
    `SELECT * FROM task_budget_proposals WHERE id = $1`,
    [proposalId],
  ).catch((err) => {
    if ((err as any).statusCode === 404) throw new Error("Proposal not found");
    throw err;
  });

  if (proposal.status !== ProposalStatus.PENDING) {
    throw new Error(`This proposal is no longer pending (${proposal.status})`);
  }

  const task = await loadTask(proposal.task_id);
  if (task.poster_id !== posterId) {
    throw new Error("Only the task poster can accept a budget proposal");
  }
  if (task.status === "cancelled") {
    throw new Error("This task has been cancelled");
  }

  // WHAT: Expired proposals can never be accepted
  if (new Date(proposal.expires_at).getTime() < Date.now()) {
    await db.query(
      `UPDATE task_budget_proposals SET status = $1, responded_at = NOW() WHERE id = $2`,
      [ProposalStatus.EXPIRED, proposalId],
    );
    await notifyUser(proposal.proposer_id, {
      type: "proposal_expired",
      title: "Proposal Expired",
      body: `Your budget proposal for "${task.title}" expired before the poster responded.`,
      taskId: task.id,
      conversationId: undefined,
      actorId: posterId,
    });
    throw new Error("This proposal has expired");
  }

  const agreedKobo = proposal.proposed_amount_kobo;
  const escrowKobo = task.escrow_amount_kobo;
  const additionalKobo = Math.max(0, agreedKobo - escrowKobo);

  // WHAT: Race-safe accept — lock the TASK row so two competing accepts
  //       (or accept + fund) serialize; the second one fails cleanly.
  const result = await withTransaction(async (client) => {
    const locked = await client.query<TaskRow>(
      `SELECT id, poster_id, title, budget_kobo, escrow_amount_kobo,
              agreed_amount_kobo, status, assigned_to as runner_id,
              runner_done_at, runner_phase
       FROM tasks WHERE id = $1 FOR UPDATE`,
      [proposal.task_id],
    );
    const taskLocked = locked.rows[0];
    if (!taskLocked) throw new Error("Task not found");
    if (taskLocked.poster_id !== posterId) {
      throw new Error("Only the task poster can accept a budget proposal");
    }
    // WHAT: Negotiation only happens while the task is still open — once a
    //       hire is locked (or funding is awaited) no other proposal may jump in
    const canonical = canonicalStatus(taskLocked.status, {
      runnerDoneAt: taskLocked.runner_done_at,
      runnerPhase: taskLocked.runner_phase,
    });
    if (canonical !== TaskStatus.PUBLISHED) {
      throw new Error("This task is no longer open for negotiation");
    }

    // WHAT: Mark the proposal accepted — becomes immutable from here on.
    //       Conditional UPDATE: a cron-expiry racing us fails cleanly.
    const accepted = await client.query(
      `UPDATE task_budget_proposals SET status = $1, responded_at = NOW()
       WHERE id = $2 AND status = $3`,
      [ProposalStatus.ACCEPTED, proposalId, ProposalStatus.PENDING],
    );
    if ((accepted.rowCount ?? 0) === 0) {
      throw new Error("This proposal is no longer pending — refresh and try again");
    }

    const runnerId = proposal.proposer_id;
    const applicationId = proposal.application_id;

    if (applicationId) {
      await client.query(
        `UPDATE task_applications
         SET status = 'accepted', agreed_amount_kobo = $1, updated_at = NOW()
         WHERE id = $2`,
        [agreedKobo, applicationId],
      );
      await client.query(
        `UPDATE task_applications
         SET status = 'rejected', updated_at = NOW()
         WHERE task_id = $1 AND id != $2 AND status IN ('pending', 'negotiating')`,
        [taskLocked.id, applicationId],
      );
    }

    if (additionalKobo > 0) {
      // WHAT: Agreement sealed but NOT funded — task waits for the poster to
      //       actually secure the difference via fundProposal()
      await client.query(
        `UPDATE tasks SET status = 'awaiting_funding', agreed_amount_kobo = $1, updated_at = NOW()
         WHERE id = $2`,
        [agreedKobo, taskLocked.id],
      );
      return { funded: false, runnerId, agreedKobo, escrowKobo, additionalKobo, taskId: taskLocked.id, title: taskLocked.title, posterId };
    }

    await finalizeHire(client, taskLocked, {
      runnerId,
      agreedAmountKobo: agreedKobo,
      applicationId,
    });
    return { funded: true, runnerId, agreedKobo, escrowKobo, additionalKobo, taskId: taskLocked.id, title: taskLocked.title, posterId };
  });

  // WHAT: Notifications AFTER the state is committed
  if (result.funded) {
    await notifyUser(result.runnerId, {
      type: "budget_proposal_accepted",
      title: "Proposal Accepted",
      body: `The poster accepted your proposed amount of ₦${(result.agreedKobo / 100).toLocaleString()} for "${result.title}". You are hired — the money is secured.`,
      taskId: result.taskId,
      conversationId: undefined,
      actorId: posterId,
    });
    await getOrCreateTaskConversation(posterId, result.runnerId, result.taskId).catch(() => {});
    await notifyRejectedRunners(result.taskId, result.runnerId, posterId, result.title);
  } else {
    await notifyUser(result.runnerId, {
      type: "budget_proposal_accepted",
      title: "Proposal Accepted",
      body: `The poster accepted your proposed amount of ₦${(result.agreedKobo / 100).toLocaleString()} for "${result.title}". Waiting for the additional ₦${(result.additionalKobo / 100).toLocaleString()} to be secured.`,
      taskId: result.taskId,
      conversationId: undefined,
      actorId: posterId,
    });
    await notifyUser(posterId, {
      type: "funding_required",
      title: "Additional Funding Required",
      body: `You agreed to ₦${(result.agreedKobo / 100).toLocaleString()} for "${result.title}". ₦${(result.escrowKobo / 100).toLocaleString()} is already secured — please fund the remaining ₦${(result.additionalKobo / 100).toLocaleString()}.`,
      taskId: result.taskId,
      conversationId: undefined,
      actorId: result.runnerId,
    });
  }

  console.info(
    `[Proposal] accepted proposal=${proposalId} task=${result.taskId} agreed=${result.agreedKobo} escrow=${result.escrowKobo} additional=${result.additionalKobo} funded=${result.funded} poster=${posterId}`,
  );

  return {
    proposalId,
    originalBudget: { kobo: proposal.original_amount_kobo, naira: proposal.original_amount_kobo / 100 },
    proposedAmount: { kobo: proposal.proposed_amount_kobo, naira: proposal.proposed_amount_kobo / 100 },
    difference: { kobo: proposal.difference_kobo, naira: proposal.difference_kobo / 100 },
    agreedAmount: { kobo: result.agreedKobo, naira: result.agreedKobo / 100 },
    escrowAmount: { kobo: result.escrowKobo, naira: result.escrowKobo / 100 },
    additionalFundingRequired: { kobo: result.additionalKobo, naira: result.additionalKobo / 100 },
    status: ProposalStatus.ACCEPTED,
    taskStatus: result.funded ? "in_progress" : "awaiting_funding",
  };
}

// WHAT: Fund the additional amount after a proposal is accepted.
//       IDEMPOTENT: a double tap / refresh / retry can never lock ₦500 twice.
//       The poster's wallet is checked for the actual required difference.
export async function fundProposal(
  proposalId: string,
  posterId: string,
): Promise<any> {
  const proposal = await queryOne<ProposalRow>(
    `SELECT * FROM task_budget_proposals WHERE id = $1`,
    [proposalId],
  ).catch((err) => {
    if ((err as any).statusCode === 404) throw new Error("Proposal not found");
    throw err;
  });

  if (proposal.status !== ProposalStatus.ACCEPTED) {
    throw new Error(`Only accepted proposals can be funded (${proposal.status})`);
  }

  const result = await withTransaction(async (client) => {
    // WHAT: Lock the task row — serializes concurrent fund requests
    const locked = await client.query<TaskRow>(
      `SELECT id, poster_id, title, budget_kobo, escrow_amount_kobo,
              agreed_amount_kobo, status, assigned_to as runner_id,
              runner_done_at, runner_phase
       FROM tasks WHERE id = $1 FOR UPDATE`,
      [proposal.task_id],
    );
    const task = locked.rows[0];
    if (!task) throw new Error("Task not found");
    if (task.poster_id !== posterId) {
      throw new Error("Only the task poster can fund this proposal");
    }

    // WHAT: Already funded (previous tap succeeded) — idempotent success
    if (task.status === "in_progress" && task.runner_id && task.agreed_amount_kobo !== null) {
      const escrowKobo = task.escrow_amount_kobo;
      return {
        alreadyFunded: true,
        taskId: task.id,
        title: task.title,
        agreedKobo: task.agreed_amount_kobo,
        escrowKobo,
        additionalKobo: Math.max(0, task.agreed_amount_kobo - escrowKobo),
        runnerId: task.runner_id,
        posterId: task.poster_id,
      };
    }

    if (task.status !== "awaiting_funding") {
      throw new Error(`This task is not awaiting funding (${task.status})`);
    }
    if (task.agreed_amount_kobo === null) {
      throw new Error("No agreed amount set on this task");
    }

    const requiredKobo = task.agreed_amount_kobo - task.escrow_amount_kobo;

    // WHAT: The actual financial transaction — wallet.debit → escrow, guarded
    //       by the idempotency key so a retry can NEVER lock twice
    if (requiredKobo > 0) {
      await lockEscrow(client, posterId, requiredKobo, task.id, {
        idempotencyKey: `fund_${proposalId}`,
        reference: `fund_${proposalId}`,
        note: `Additional funding for "${task.title}" (agreed ₦${(task.agreed_amount_kobo / 100).toLocaleString()}, originally ₦${(task.budget_kobo / 100).toLocaleString()})`,
      });
    }

    // WHAT: The runner is the accepted proposal's proposer — the task row has
    //       NO runner until this moment (awaiting_funding hires nothing)
    const runnerId = proposal.proposer_id;

    // WHAT: Only now — funds secured — may the task move to in_progress
    const updated = await client.query(
      `UPDATE tasks
       SET status = 'in_progress', assigned_to = $1, runner_phase = $2, updated_at = NOW()
       WHERE id = $3 AND status = 'awaiting_funding'`,
      [runnerId, RunnerPhase.MATCHED, task.id],
    );
    if ((updated.rowCount ?? 0) === 0) {
      throw new Error("Task funding state changed — please refresh and retry");
    }

    await client.query(
      `UPDATE users SET runner_busy = true, updated_at = NOW() WHERE id = $1`,
      [runnerId],
    );

    return {
      alreadyFunded: false,
      taskId: task.id,
      title: task.title,
      agreedKobo: task.agreed_amount_kobo,
      escrowKobo: task.escrow_amount_kobo + requiredKobo,
      additionalKobo: requiredKobo,
      runnerId,
      posterId: task.poster_id,
    };
  });

  // WHAT: Notifications only after commit — never "payment secured" on a fail
  if (!result.alreadyFunded) {
    await notifyUser(result.posterId, {
      type: "funding_success",
      title: "Payment Secured",
      body: `The agreed amount of ₦${(result.agreedKobo / 100).toLocaleString()} for "${result.title}" is now fully secured in escrow.`,
      taskId: result.taskId,
      conversationId: undefined,
      actorId: result.posterId,
    });
    await notifyUser(result.runnerId!, {
      type: "funding_success",
      title: "Payment Secured",
      body: `The agreed amount of ₦${(result.agreedKobo / 100).toLocaleString()} for "${result.title}" is secured. You can now begin the task.`,
      taskId: result.taskId,
      conversationId: undefined,
      actorId: result.posterId,
    });
    await getOrCreateTaskConversation(result.posterId!, result.runnerId!, result.taskId).catch(() => {});
  }

  console.info(
    `[Proposal] fund proposal=${proposalId} task=${result.taskId} agreed=${result.agreedKobo} escrow=${result.escrowKobo} additional=${result.additionalKobo} alreadyFunded=${result.alreadyFunded} poster=${posterId}`,
  );

  return {
    proposalId,
    originalBudget: { kobo: proposal.original_amount_kobo, naira: proposal.original_amount_kobo / 100 },
    agreedAmount: { kobo: result.agreedKobo, naira: result.agreedKobo / 100 },
    escrowAmount: { kobo: result.escrowKobo, naira: result.escrowKobo / 100 },
    additionalFundingRequired: { kobo: result.additionalKobo, naira: result.additionalKobo / 100 },
    status: "funded",
    taskStatus: "in_progress",
  };
}

// WHAT: Poster rejects a proposal — the task stays open at its original budget
export async function rejectProposal(
  proposalId: string,
  posterId: string,
): Promise<{ status: string; message: string }> {
  const proposal = await queryOne<ProposalRow>(
    `SELECT * FROM task_budget_proposals WHERE id = $1`,
    [proposalId],
  ).catch((err) => {
    if ((err as any).statusCode === 404) throw new Error("Proposal not found");
    throw err;
  });

  if (proposal.status !== ProposalStatus.PENDING) {
    throw new Error(`This proposal is no longer pending (${proposal.status})`);
  }

  const task = await loadTask(proposal.task_id);
  if (task.poster_id !== posterId) {
    throw new Error("Only the task poster can reject a budget proposal");
  }

  await db.query(
    `UPDATE task_budget_proposals SET status = $1, responded_at = NOW() WHERE id = $2`,
    [ProposalStatus.REJECTED, proposalId],
  );

  await notifyUser(proposal.proposer_id, {
    type: "budget_proposal_rejected",
    title: "Proposal Rejected",
    body: `The poster declined your proposed amount of ₦${(proposal.proposed_amount_kobo / 100).toLocaleString()} for "${task.title}". The task stays at its original budget.`,
    taskId: task.id,
    conversationId: undefined,
    actorId: posterId,
  });

  console.info(
    `[Proposal] rejected proposal=${proposalId} task=${task.id} proposer=${proposal.proposer_id} poster=${posterId} amount=${proposal.proposed_amount_kobo}`,
  );

  return { status: ProposalStatus.REJECTED, message: "Proposal rejected" };
}

// WHAT: Runner withdraws their own pending proposal — never an accepted one
export async function cancelProposal(
  proposalId: string,
  proposerId: string,
): Promise<{ status: string; message: string }> {
  const proposal = await queryOne<ProposalRow>(
    `SELECT * FROM task_budget_proposals WHERE id = $1`,
    [proposalId],
  ).catch((err) => {
    if ((err as any).statusCode === 404) throw new Error("Proposal not found");
    throw err;
  });

  if (proposal.proposer_id !== proposerId) {
    throw new Error("Only the proposer can cancel their own proposal");
  }
  if (proposal.status !== ProposalStatus.PENDING) {
    throw new Error("Only pending proposals can be cancelled");
  }

  await db.query(
    `UPDATE task_budget_proposals SET status = $1, responded_at = NOW() WHERE id = $2`,
    [ProposalStatus.CANCELLED, proposalId],
  );

  const task = await loadTask(proposal.task_id).catch(() => null);
  if (task) {
    await notifyUser(task.poster_id, {
      type: "budget_proposal_cancelled",
      title: "Proposal Withdrawn",
      body: `The runner withdrew their proposal of ₦${(proposal.proposed_amount_kobo / 100).toLocaleString()} for "${task.title}".`,
      taskId: task.id,
      conversationId: undefined,
      actorId: proposerId,
    });
  }

  return { status: ProposalStatus.CANCELLED, message: "Proposal cancelled" };
}

// WHAT: List proposals for a task — poster or the proposer (or assigned runner)
export async function listProposals(
  taskId: string,
  userId: string,
): Promise<any[]> {
  const task = await loadTask(taskId).catch(() => null);
  if (!task) throw new Error("Task not found");
  // WHAT: Only involved users may read the negotiation history
  const isPoster = task.poster_id === userId;
  const isRunner = task.runner_id === userId;
  const proposed = await db.query<{ id: string }>(
    `SELECT id FROM task_applications WHERE task_id = $1 AND runner_id = $2 LIMIT 1`,
    [taskId, userId],
  );
  if (!isPoster && !isRunner && proposed.rows.length === 0) {
    throw new Error("You are not part of this task");
  }

  const result = await db.query<any>(
    `SELECT id, task_id, application_id, proposer_id, original_amount_kobo,
            proposed_amount_kobo, difference_kobo, reason, status,
            created_at, responded_at, expires_at
     FROM task_budget_proposals
     WHERE task_id = $1
     ORDER BY created_at DESC`,
    [taskId],
  );

  return result.rows.map((r: any) => ({
    id: r.id,
    taskId: r.task_id,
    applicationId: r.application_id,
    proposerId: r.proposer_id,
    originalBudget: { kobo: r.original_amount_kobo, naira: r.original_amount_kobo / 100 },
    proposedAmount: { kobo: r.proposed_amount_kobo, naira: r.proposed_amount_kobo / 100 },
    difference: { kobo: r.difference_kobo, naira: r.difference_kobo / 100 },
    reason: r.reason,
    status: r.status,
    createdAt: r.created_at,
    respondedAt: r.responded_at,
    expiresAt: r.expires_at,
  }));
}

// WHAT: Mark expired proposals (cron) — PENDING → EXPIRED, task untouched
// WHY: The runner's ask dies, the original budget never changes
export async function expireProposals(): Promise<number> {
  const result = await db.query<any>(
    `UPDATE task_budget_proposals
     SET status = $1, responded_at = NOW()
     WHERE status = $2 AND expires_at < NOW()
     RETURNING id, task_id, proposer_id, proposed_amount_kobo, original_amount_kobo`,
    [ProposalStatus.EXPIRED, ProposalStatus.PENDING],
  );

  for (const row of result.rows) {
    const task = await db
      .query<{ title: string }>(`SELECT title FROM tasks WHERE id = $1`, [row.task_id])
      .then((r) => r.rows[0])
      .catch(() => null);
    notifyUser(row.proposer_id, {
      type: "proposal_expired",
      title: "Proposal Expired",
      body: `Your budget proposal of ₦${(row.proposed_amount_kobo / 100).toLocaleString()} for "${task?.title ?? "a task"}" expired without a response.`,
      taskId: row.task_id,
      conversationId: undefined,
    }).catch(() => {});
    console.info(
      `[Proposal] expired proposal=${row.id} task=${row.task_id} proposer=${row.proposer_id} proposed=${row.proposed_amount_kobo}`,
    );
  }

  return result.rowCount ?? 0;
}

// WHAT: Accept an application at a given agreed amount, routing through the
//       proposal/funding gate when the agreed amount EXCEEDS current escrow.
//       Shared by application.service acceptApplication/acceptCounterOffer so
//       every negotiated hire funnels through ONE auditable path.
export async function acceptAtAmount(params: {
  task: TaskRow;
  applicationId: string;
  agreedAmountKobo: number;
  posterId: string;
  reason?: string;
}): Promise<any> {
  const { task, applicationId, agreedAmountKobo, posterId } = params;
  const escrowKobo = task.escrow_amount_kobo;
  const application = await queryOne<{ runner_id: string; status: string }>(
    `SELECT runner_id, status FROM task_applications WHERE id = $1`,
    [applicationId],
  );

  // WHAT: If the runner already has a PENDING proposal, accept it directly —
  //       this keeps the application flow and the proposal flow consistent.
  const pendingProposal = await db.query<{ id: string }>(
    `SELECT id FROM task_budget_proposals
     WHERE task_id = $1 AND application_id = $2 AND status = 'pending'
     ORDER BY created_at DESC LIMIT 1`,
    [task.id, applicationId],
  );

  if (pendingProposal.rows.length > 0) {
    return acceptProposal(pendingProposal.rows[0].id, posterId);
  }

  // WHAT: Record a proposal for audit (status ACCEPTED when funding is not
  //       required; the accept flow handles the accepted+awaiting case)
  const runnerId = application.runner_id;
  const needsFunding = agreedAmountKobo > escrowKobo;

  const result = await withTransaction(async (client) => {
    const locked = await client.query<TaskRow>(
      `SELECT id, poster_id, title, budget_kobo, escrow_amount_kobo,
              agreed_amount_kobo, status, assigned_to as runner_id,
              runner_done_at, runner_phase
       FROM tasks WHERE id = $1 FOR UPDATE`,
      [task.id],
    );
    const taskLocked = locked.rows[0];
    if (!taskLocked) throw new Error("Task not found");

    const canonical = canonicalStatus(taskLocked.status, {
      runnerDoneAt: taskLocked.runner_done_at,
      runnerPhase: taskLocked.runner_phase,
    });
    // WHAT: Only an open task may accept a hire/negotiation — a second runner
    //       can never jump in after a proposal already moved the task forward
    if (canonical !== TaskStatus.PUBLISHED) {
      throw new Error("This task is no longer open for negotiation");
    }

    const proposal = await insertProposal(client, {
      taskId: task.id,
      applicationId,
      proposerId: runnerId,
      amountKobo: agreedAmountKobo,
      reason: params.reason || "Accepted application amount",
      status: needsFunding ? ProposalStatus.PENDING : ProposalStatus.ACCEPTED,
      respondedAt: needsFunding ? null : new Date().toISOString(),
    });

    await client.query(
      `UPDATE task_applications
       SET status = 'accepted', agreed_amount_kobo = $1, updated_at = NOW()
       WHERE id = $2`,
      [agreedAmountKobo, applicationId],
    );
    await client.query(
      `UPDATE task_applications
       SET status = 'rejected', updated_at = NOW()
       WHERE task_id = $1 AND id != $2 AND status IN ('pending', 'negotiating')`,
      [task.id, applicationId],
    );

    if (needsFunding) {
      await client.query(
        `UPDATE tasks SET status = 'awaiting_funding', agreed_amount_kobo = $1, updated_at = NOW()
         WHERE id = $2`,
        [agreedAmountKobo, task.id],
      );
      return {
        proposal,
        funded: false,
        runnerId,
        agreedKobo: agreedAmountKobo,
        escrowKobo,
        additionalKobo: agreedAmountKobo - escrowKobo,
        taskId: task.id,
        title: taskLocked.title,
        posterId,
      };
    }

    await finalizeHire(client, taskLocked, { runnerId, agreedAmountKobo, applicationId });
    return {
      proposal,
      funded: true,
      runnerId,
      agreedKobo: agreedAmountKobo,
      escrowKobo,
      additionalKobo: 0,
      taskId: task.id,
      title: taskLocked.title,
      posterId,
    };
  });

  // WHAT: Same notification contract as acceptProposal
  if (result.funded) {
    await notifyUser(result.runnerId, {
      type: result.proposal.difference_kobo < 0 ? "budget_proposal_accepted" : "application_accepted",
      title: result.proposal.difference_kobo < 0 ? "Proposal Accepted" : "Application Accepted",
      body:
        result.proposal.difference_kobo < 0
          ? `The poster accepted your proposed amount of ₦${(result.agreedKobo / 100).toLocaleString()} for "${result.title}". You are hired.`
          : `Your application for "${result.title}" has been accepted!`,
      taskId: result.taskId,
      conversationId: undefined,
      actorId: posterId,
    });
    await getOrCreateTaskConversation(posterId, result.runnerId, result.taskId).catch(() => {});
    await notifyRejectedRunners(result.taskId, result.runnerId, posterId, result.title);
  } else {
    await notifyUser(result.runnerId, {
      type: "budget_proposal_accepted",
      title: "Proposal Accepted",
      body: `The poster accepted your proposed amount of ₦${(result.agreedKobo / 100).toLocaleString()} for "${result.title}". Waiting for the additional ₦${(result.additionalKobo / 100).toLocaleString()} to be secured.`,
      taskId: result.taskId,
      conversationId: undefined,
      actorId: posterId,
    });
    await notifyUser(posterId, {
      type: "funding_required",
      title: "Additional Funding Required",
      body: `You agreed to ₦${(result.agreedKobo / 100).toLocaleString()} for "${result.title}". ₦${(result.escrowKobo / 100).toLocaleString()} is already secured — please fund the remaining ₦${(result.additionalKobo / 100).toLocaleString()}.`,
      taskId: result.taskId,
      conversationId: undefined,
      actorId: result.runnerId,
    });
  }

  console.info(
    `[Proposal] acceptAtAmount task=${result.taskId} app=${applicationId} proposal=${result.proposal.id} agreed=${result.agreedKobo} escrow=${result.escrowKobo} additional=${result.additionalKobo} funded=${result.funded} poster=${posterId}`,
  );

  return {
    proposalId: result.proposal.id,
    originalBudget: { kobo: result.proposal.original_amount_kobo, naira: result.proposal.original_amount_kobo / 100 },
    proposedAmount: { kobo: result.proposal.proposed_amount_kobo, naira: result.proposal.proposed_amount_kobo / 100 },
    difference: { kobo: result.proposal.difference_kobo, naira: result.proposal.difference_kobo / 100 },
    agreedAmount: { kobo: result.agreedKobo, naira: result.agreedKobo / 100 },
    escrowAmount: { kobo: result.escrowKobo, naira: result.escrowKobo / 100 },
    additionalFundingRequired: { kobo: result.additionalKobo, naira: result.additionalKobo / 100 },
    status: result.proposal.status,
    taskStatus: result.funded ? "in_progress" : "awaiting_funding",
  };
}