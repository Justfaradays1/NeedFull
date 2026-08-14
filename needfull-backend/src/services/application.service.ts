// WHAT: Task application service — apply, accept, reject, counter-offer workflow
// WHY: Centralized application logic ensures consistent validation, state transitions, and notifications
// FUTURE: Add auto-accept for trusted runners, add application deadline, add interview/question flow

import db, { queryOne, withTransaction } from "../config/db";
import { notifyUser, notifyMany } from "./notification.service";
import { getOrCreateTaskConversation } from "./conversation.service";
import {
  TaskStatus,
  canonicalStatus,
  assertValidTransition,
  RunnerPhase,
} from "./task-states";
import { insertProposal, acceptAtAmount } from "./proposal.service";
import { v4 as uuidv4 } from "uuid";
import { MIN_TASK_BUDGET_KOBO } from "../config/constants";

// WHAT: Application row shape from the database
interface ApplicationRow {
  id: string;
  task_id: string;
  runner_id: string;
  message: string | null;
  proposed_amount_kobo: number | null;
  counter_amount_kobo: number | null;
  agreed_amount_kobo: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

// WHAT: Task row shape (minimal for validation)
interface TaskRow {
  id: string;
  poster_id: string;
  title: string;
  budget_kobo: number;
  escrow_amount_kobo: number;
  status: string;
  runner_id: string | null;
  runner_done_at: string | null;
  runner_phase: string | null;
}

// WHAT: Apply to a task — runner submits application with optional proposed amount
// WHY: When the proposed amount differs from the original budget, an auditable
//      task_budget_proposals record is created atomically with the application.
//      The original budget is NEVER overwritten.
export async function apply(
  userId: string,
  params: {
    taskId: string;
    message: string;
    proposedAmountNaira?: number;
  },
): Promise<any> {
  // WHAT: Validate task exists and is published (open)
  const task = await queryOne<TaskRow>(
    `SELECT id, poster_id, title, budget_kobo, escrow_amount_kobo, status, assigned_to as runner_id, runner_done_at, runner_phase FROM tasks WHERE id = $1`,
    [params.taskId],
  );

  const canonical = task
    ? canonicalStatus(task.status, { runnerDoneAt: task.runner_done_at, runnerPhase: task.runner_phase })
    : TaskStatus.DRAFT;
  if (canonical !== TaskStatus.PUBLISHED) {
    throw new Error(`Task is not accepting applications (status: ${task.status})`);
  }
  if (task.poster_id === userId) {
    throw new Error("You cannot apply to your own task");
  }

  // WHAT: Check for existing application
  const existing = await db.query(
    `SELECT id FROM task_applications WHERE task_id = $1 AND runner_id = $2`,
    [params.taskId, userId],
  );
  if (existing.rows.length > 0) {
    throw new Error("You have already applied to this task");
  }

  // WHAT: Convert proposed amount to kobo if provided
  const proposedAmountKobo = params.proposedAmountNaira
    ? Math.floor(params.proposedAmountNaira * 100)
    : null;

  if (proposedAmountKobo !== null) {
    // WHAT: Server-side amount validation (the client is untrusted)
    if (!Number.isFinite(proposedAmountKobo) || proposedAmountKobo <= 0) {
      throw new Error("Proposed amount must be a positive amount");
    }
    if (proposedAmountKobo < MIN_TASK_BUDGET_KOBO) {
      throw new Error(
        `The proposed amount must be at least ₦${(MIN_TASK_BUDGET_KOBO / 100).toFixed(0)}`,
      );
    }
  }

  // WHAT: Create application + (if negotiating) proposal — atomically
  const applicationId = uuidv4();
  const now = new Date().toISOString();
  const application = await withTransaction(async (client) => {
    const app = await client.query<ApplicationRow>(
      `INSERT INTO task_applications
       (id, task_id, applicant_id, runner_id, message, proposed_amount_kobo, status, created_at, updated_at)
       VALUES ($1, $2, $3, $3, $4, $5, 'pending', $6, $6)
       RETURNING *`,
      [applicationId, params.taskId, userId, params.message.trim(), proposedAmountKobo, now],
    );

    // WHAT: Record the negotiation separately — the task budget stays intact
    if (proposedAmountKobo !== null && proposedAmountKobo !== task.budget_kobo) {
      await insertProposal(client, {
        taskId: params.taskId,
        applicationId,
        proposerId: userId,
        amountKobo: proposedAmountKobo,
        reason: null,
      });
    }

    return app.rows[0];
  });

  // WHAT: Notify poster
  const proposalNote =
    proposedAmountKobo && proposedAmountKobo !== task.budget_kobo
      ? ` They proposed ₦${(proposedAmountKobo / 100).toLocaleString()} (original budget ₦${(task.budget_kobo / 100).toLocaleString()}).`
      : "";
  await notifyUser(task.poster_id, {
    type: proposedAmountKobo && proposedAmountKobo !== task.budget_kobo ? "budget_proposal_sent" : "new_application",
    title: proposedAmountKobo && proposedAmountKobo !== task.budget_kobo ? "New Budget Proposal" : "New Application",
    body: `A runner applied to "${task.title}".${proposalNote}`,
    taskId: params.taskId,
    conversationId: undefined,
    actorId: userId,
  });

  return {
    id: application.id,
    taskId: application.task_id,
    status: application.status,
    message: application.message,
    proposedAmount: application.proposed_amount_kobo
      ? { kobo: application.proposed_amount_kobo, naira: application.proposed_amount_kobo / 100 }
      : null,
    createdAt: application.created_at,
  };
}

// WHAT: Open the task chat between poster and runner after hiring
// WHY: The Task Chats model creates the conversation the moment a runner is
//      selected — chats never exist in a vacuum, they exist because of a task.
async function createTaskChatAfterHire(
  posterId: string,
  runnerId: string,
  taskId: string,
): Promise<void> {
  try {
    await getOrCreateTaskConversation(posterId, runnerId, taskId);
  } catch (err) {
    console.warn("[Chat] Failed to create task conversation after hire:", err);
  }
}

// WHAT: Accept an application — poster chooses a runner. If the agreed amount
//       (proposal/counter) differs from the escrowed amount, the hire is
//       routed through the auditable proposal pipeline:
//         higher → AWAITING_FUNDING (poster must fund the difference first)
//         lower  → hired; the excess stays in escrow until settlement
export async function acceptApplication(
  applicationId: string,
  posterId: string,
): Promise<any> {
  // WHAT: Fetch application with task
  const appAndTask = await queryOne<any>(
    `SELECT
      a.id as app_id, a.task_id, a.runner_id, a.proposed_amount_kobo, a.counter_amount_kobo,
      a.agreed_amount_kobo, a.status as app_status,
      t.id as id, t.poster_id, t.title, t.budget_kobo, t.escrow_amount_kobo, t.status as task_status, t.assigned_to as task_runner_id,
      t.runner_done_at, t.runner_phase
     FROM task_applications a
     JOIN tasks t ON a.task_id = t.id
     WHERE a.id = $1`,
    [applicationId],
  );

  // WHAT: Validate ownership
  if (appAndTask.poster_id !== posterId) {
    throw new Error("Only the task poster can accept applications");
  }

  // WHAT: Validate application is pending
  if (appAndTask.app_status !== "pending" && appAndTask.app_status !== "negotiating") {
    throw new Error(`Application status is "${appAndTask.app_status}". Cannot accept.`);
  }

  // WHAT: Validate task is published (open) — guard via state machine
  const taskCanonical = canonicalStatus(appAndTask.task_status, {
    runnerDoneAt: appAndTask.runner_done_at,
    runnerPhase: appAndTask.runner_phase,
  });
  assertValidTransition(taskCanonical, TaskStatus.MATCHED, "accept application");

  // WHAT: Determine agreed amount
  // WHY: counter_amount overrides proposed, which overrides task budget
  const agreedAmountKobo =
    appAndTask.counter_amount_kobo ||
    appAndTask.proposed_amount_kobo ||
    appAndTask.budget_kobo;

  const runnerId = appAndTask.runner_id;
  const taskId = appAndTask.task_id;
  const taskTitle = appAndTask.title;

  // WHAT: Negotiated amount — route through the auditable proposal pipeline
  // WHY: The original budget and negotiated amount are different concepts.
  //      Accepting a HIGHER amount NEVER auto-starts the task: the poster must
  //      fund the difference (idempotently) before the runner can begin.
  if (agreedAmountKobo !== appAndTask.budget_kobo) {
    return acceptAtAmount({
      task: appAndTask,
      applicationId,
      agreedAmountKobo,
      posterId,
      reason:
        appAndTask.counter_amount_kobo !== null
          ? "Counter offer agreed"
          : "Accepted application proposed amount",
    });
  }

  // WHAT: Agreed amount equals the original budget — direct hire, no
  //       negotiation, no extra escrow movement (already locked at publish)
  await withTransaction(async (client) => {
    await client.query(
      `UPDATE tasks
       SET status = 'in_progress', assigned_to = $1, agreed_amount_kobo = $2,
           runner_phase = '${RunnerPhase.MATCHED}', updated_at = NOW()
       WHERE id = $3`,
      [runnerId, agreedAmountKobo, taskId],
    );

    // WHAT: Mark runner BUSY — they now have a task in flight and cannot be
    // matched or notified about new nearby tasks
    await client.query(
      `UPDATE users SET runner_busy = true, updated_at = NOW() WHERE id = $1`,
      [runnerId],
    );

    // WHAT: Mark accepted application
    await client.query(
      `UPDATE task_applications
       SET status = 'accepted', agreed_amount_kobo = $1, updated_at = NOW()
       WHERE id = $2`,
      [agreedAmountKobo, applicationId],
    );

    // WHAT: Reject all other pending applications for this task
    await client.query(
      `UPDATE task_applications
       SET status = 'rejected', updated_at = NOW()
       WHERE task_id = $1 AND id != $2 AND status IN ('pending', 'negotiating')`,
      [taskId, applicationId],
    );
  });

  // WHAT: Notify accepted runner
  await notifyUser(runnerId, {
    type: "application_accepted",
    title: "Application Accepted",
    body: `Your application for "${taskTitle}" has been accepted!`,
    taskId,
    conversationId: undefined,
    actorId: posterId,
  });

  // WHAT: Open the task chat (poster ↔ runner) now that a runner is hired
  await createTaskChatAfterHire(posterId, runnerId, taskId);

  // WHAT: Notify rejected runners (non-blocking)
  const rejectedApps = await db.query<{ runner_id: string }>(
    `SELECT runner_id FROM task_applications
     WHERE task_id = $1 AND status = 'rejected' AND runner_id != $2`,
    [taskId, runnerId],
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

  return {
    status: "accepted",
    message: "Application accepted. Escrow has been locked.",
    taskId,
    runnerId,
    agreedAmount: { kobo: agreedAmountKobo, naira: agreedAmountKobo / 100 },
  };
}

// WHAT: Reject an application — poster declines a runner
export async function rejectApplication(
  applicationId: string,
  posterId: string,
): Promise<{ status: string; message: string }> {
  const app = await queryOne<any>(
    `SELECT
      a.id, a.runner_id, a.status as app_status, a.task_id,
      t.poster_id, t.title
     FROM task_applications a
     JOIN tasks t ON a.task_id = t.id
     WHERE a.id = $1`,
    [applicationId],
  );

  if (app.poster_id !== posterId) {
    throw new Error("Only the task poster can reject applications");
  }
  if (app.app_status !== "pending" && app.app_status !== "negotiating") {
    throw new Error(`Application status is "${app.app_status}". Cannot reject.`);
  }

  await db.query(
    `UPDATE task_applications SET status = 'rejected', updated_at = NOW() WHERE id = $1`,
    [applicationId],
  );

  await notifyUser(app.runner_id, {
    type: "application_rejected",
    title: "Application Rejected",
    body: `Your application for "${app.title}" was not selected`,
    taskId: app.task_id,
    conversationId: undefined,
    actorId: posterId,
  });

  return { status: "rejected", message: "Application rejected" };
}

// WHAT: Counter-offer — poster proposes a different amount to a runner
export async function counterOffer(
  applicationId: string,
  posterId: string,
  counterAmountNaira: number,
): Promise<any> {
  const app = await queryOne<any>(
    `SELECT
      a.id, a.runner_id, a.status as app_status, a.proposed_amount_kobo, a.task_id,
      t.poster_id, t.title
     FROM task_applications a
     JOIN tasks t ON a.task_id = t.id
     WHERE a.id = $1`,
    [applicationId],
  );

  if (app.poster_id !== posterId) {
    throw new Error("Only the task poster can make a counter offer");
  }
  if (app.app_status !== "pending") {
    throw new Error(`Application status is "${app.app_status}". Cannot make counter offer.`);
  }

  const counterAmountKobo = Math.floor(counterAmountNaira * 100);

  if (counterAmountKobo <= 0) {
    throw new Error("Counter offer must be greater than ₦0");
  }

  await db.query(
    `UPDATE task_applications
     SET counter_amount_kobo = $1, status = 'negotiating', updated_at = NOW()
     WHERE id = $2`,
    [counterAmountKobo, applicationId],
  );

  await notifyUser(app.runner_id, {
    type: "counter_offer",
    title: "Counter Offer",
    body: `The poster sent a counter offer of ₦${(counterAmountKobo / 100).toLocaleString()} for "${app.title}"`,
    taskId: app.task_id,
    conversationId: undefined,
    actorId: posterId,
  });

  return {
    status: "negotiating",
    message: "Counter offer sent to runner",
    counterAmount: { kobo: counterAmountKobo, naira: counterAmountKobo / 100 },
  };
}

// WHAT: Accept counter offer — runner agrees to poster's proposed amount
export async function acceptCounterOffer(
  applicationId: string,
  runnerId: string,
): Promise<any> {
  const app = await queryOne<any>(
    `SELECT
      a.id as app_id, a.task_id, a.runner_id, a.counter_amount_kobo, a.status as app_status,
      t.id as id, t.poster_id, t.title, t.budget_kobo, t.escrow_amount_kobo, t.status as task_status,
      t.runner_done_at, t.runner_phase
     FROM task_applications a
     JOIN tasks t ON a.task_id = t.id
     WHERE a.id = $1`,
    [applicationId],
  );

  if (app.runner_id !== runnerId) {
    throw new Error("Only the applicant can accept a counter offer");
  }
  if (app.app_status !== "negotiating") {
    throw new Error(
      `Application status is "${app.app_status}". Only negotiating applications can accept counter offers.`,
    );
  }
  if (!app.counter_amount_kobo) {
    throw new Error("No counter offer amount found");
  }

  // WHAT: Treat counter_amount as agreed — proceed to acceptApplication logic
  const agreedAmountKobo = app.counter_amount_kobo;
  const taskId = app.task_id;
  const taskTitle = app.title;
  const posterId = app.poster_id;

  // WHAT: Validate task is published (open) — guard via state machine
  const taskCanonical = canonicalStatus(app.task_status, {
    runnerDoneAt: app.runner_done_at,
    runnerPhase: app.runner_phase,
  });
  assertValidTransition(taskCanonical, TaskStatus.MATCHED, "accept counter offer");

  // WHAT: Negotiated amount — route through the auditable proposal pipeline
  // WHY: Accepting a HIGHER counter never auto-starts the task: the poster
  //      must fund the difference (idempotently) before work can begin
  if (agreedAmountKobo !== app.budget_kobo) {
    return acceptAtAmount({
      task: app,
      applicationId,
      agreedAmountKobo,
      posterId,
      reason: "Counter offer agreed by runner",
    });
  }

  await withTransaction(async (client) => {
    await client.query(
      `UPDATE tasks
       SET status = 'in_progress', assigned_to = $1, agreed_amount_kobo = $2,
           runner_phase = '${RunnerPhase.ACCEPTED}', updated_at = NOW()
       WHERE id = $3`,
      [runnerId, agreedAmountKobo, taskId],
    );

    // WHAT: Mark runner BUSY — accepted work means no new task matching
    await client.query(
      `UPDATE users SET runner_busy = true, updated_at = NOW() WHERE id = $1`,
      [runnerId],
    );

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
      [taskId, applicationId],
    );
  });

  // WHAT: Notify poster that runner accepted
  await notifyUser(posterId, {
    type: "counter_accepted",
    title: "Counter Offer Accepted",
    body: `The runner accepted your counter offer for "${taskTitle}"`,
    taskId,
    conversationId: undefined,
    actorId: runnerId,
  });

  // WHAT: Open the task chat (poster ↔ runner) now that the deal is sealed
  await createTaskChatAfterHire(posterId, runnerId, taskId);

  // WHAT: Notify rejected runners
  const rejectedApps = await db.query<{ runner_id: string }>(
    `SELECT runner_id FROM task_applications
     WHERE task_id = $1 AND status = 'rejected' AND runner_id != $2`,
    [taskId, runnerId],
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

  return {
    status: "accepted",
    message: "Counter offer accepted. Escrow has been locked.",
    taskId,
    runnerId,
    agreedAmount: { kobo: agreedAmountKobo, naira: agreedAmountKobo / 100 },
  };
}
