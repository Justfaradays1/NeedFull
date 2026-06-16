// WHAT: Task application service — apply, accept, reject, counter-offer workflow
// WHY: Centralized application logic ensures consistent validation, state transitions, and notifications
// FUTURE: Add auto-accept for trusted runners, add application deadline, add interview/question flow

import db, { queryOne, withTransaction } from "../config/db";
import { lockEscrow } from "./wallet.service";
import { notifyUser, notifyMany } from "./notification.service";
import { v4 as uuidv4 } from "uuid";

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
  status: string;
  runner_id: string | null;
}

// WHAT: Apply to a task — runner submits application with optional proposed amount
export async function apply(
  userId: string,
  params: {
    taskId: string;
    message: string;
    proposedAmountNaira?: number;
  },
): Promise<any> {
  // WHAT: Validate task exists and is open
  const task = await queryOne<TaskRow>(
    `SELECT id, poster_id, title, budget_kobo, status, runner_id FROM tasks WHERE id = $1`,
    [params.taskId],
  );

  if (task.status !== "open") {
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

  // WHAT: Create application
  const applicationId = uuidv4();
  const now = new Date().toISOString();
  const application = await queryOne<ApplicationRow>(
    `INSERT INTO task_applications
     (id, task_id, runner_id, message, proposed_amount_kobo, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, 'pending', $6, $6)
     RETURNING *`,
    [applicationId, params.taskId, userId, params.message.trim(), proposedAmountKobo, now],
  );

  // WHAT: Notify poster
  await notifyUser(task.poster_id, {
    type: "new_application",
    title: "New Application",
    body: `A runner applied to "${task.title}"`,
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

// WHAT: Accept an application — poster chooses a runner, locks escrow, updates task
export async function acceptApplication(
  applicationId: string,
  posterId: string,
): Promise<any> {
  // WHAT: Fetch application with task
  const appAndTask = await queryOne<any>(
    `SELECT
      a.id as app_id, a.task_id, a.runner_id, a.proposed_amount_kobo, a.counter_amount_kobo,
      a.agreed_amount_kobo, a.status as app_status,
      t.poster_id, t.title, t.budget_kobo, t.status as task_status, t.runner_id as task_runner_id
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

  // WHAT: Validate task is open
  if (appAndTask.task_status !== "open") {
    throw new Error(`Task status is "${appAndTask.task_status}". Cannot accept applications.`);
  }

  // WHAT: Determine agreed amount
  // WHY: counter_amount overrides proposed, which overrides task budget
  const agreedAmountKobo =
    appAndTask.counter_amount_kobo ||
    appAndTask.proposed_amount_kobo ||
    appAndTask.budget_kobo;

  const runnerId = appAndTask.runner_id;
  const taskId = appAndTask.task_id;
  const taskTitle = appAndTask.title;

  // WHAT: Atomic accept — lock escrow, update task, update applications
  await withTransaction(async (client) => {
    // WHAT: Lock escrow for agreed amount
    await lockEscrow(client, posterId, agreedAmountKobo, taskId);

    // WHAT: Update task to in_progress with runner and agreed amount
    await client.query(
      `UPDATE tasks
       SET status = 'in_progress', runner_id = $1, agreed_amount_kobo = $2, updated_at = NOW()
       WHERE id = $3`,
      [runnerId, agreedAmountKobo, taskId],
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
      t.poster_id, t.title, t.budget_kobo, t.status as task_status
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

  // WHAT: Treat counter_amount as agreed — proceed to full acceptApplication logic
  // We reuse acceptApplication but substitute the agreed amount
  const agreedAmountKobo = app.counter_amount_kobo;
  const taskId = app.task_id;
  const taskTitle = app.title;
  const posterId = app.poster_id;

  // WHAT: Validate task is still open
  if (app.task_status !== "open") {
    throw new Error(`Task status is "${app.task_status}". Cannot accept.`);
  }

  await withTransaction(async (client) => {
    await lockEscrow(client, posterId, agreedAmountKobo, taskId);

    await client.query(
      `UPDATE tasks
       SET status = 'in_progress', runner_id = $1, agreed_amount_kobo = $2, updated_at = NOW()
       WHERE id = $3`,
      [runnerId, agreedAmountKobo, taskId],
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
