// WHAT: Conversation service — task-scoped conversation creation
// WHY: Every NeedFull conversation must belong to a task (Task Chats model).
//      A chat is created once a runner is hired (or between applicants and the
//      poster while a task is open). Conversation rows carry task_id so the
//      chat UI can group by task, show task context, and enforce lifecycle rules
//      (read-only after completion, archive, retention).
// FUTURE: Enforce participant-only creation, add archive/retention jobs, add
//         media/files/voice/location payloads scoped to the task.

import db from "../config/db";
import { v4 as uuidv4 } from "uuid";

export interface TaskConversation {
  id: string;
  taskId: string | null;
  created: boolean;
}

// WHAT: Find-or-create a conversation between two users scoped to a task
// WHY: One conversation per (task, pair). Reuses an existing row for the pair;
//      upgrades a legacy task-less row to this task; creates a new row when the
//      pair already has a different-task conversation.
export async function getOrCreateTaskConversation(
  userA: string,
  userB: string,
  taskId?: string | null,
): Promise<TaskConversation> {
  const existing = await db.query<{ id: string; task_id: string | null }>(
    `SELECT id, task_id FROM conversations
     WHERE (participant_a = $1 AND participant_b = $2)
        OR (participant_a = $2 AND participant_b = $1)
     LIMIT 1`,
    [userA, userB],
  );

  if (existing.rows.length > 0) {
    const row = existing.rows[0];
    // Same pair, no task yet (legacy conversation) → scope it to this task.
    if (taskId && row.task_id === null) {
      await db.query(
        `UPDATE conversations SET task_id = $1 WHERE id = $2`,
        [taskId, row.id],
      );
      return { id: row.id, taskId, created: false };
    }
    // Same pair and same task → reuse.
    if (!taskId || row.task_id === taskId) {
      return { id: row.id, taskId: row.task_id ?? null, created: false };
    }
    // Same pair, different task → this is a new task chat.
  }

  const conversationId = uuidv4();
  const now = new Date().toISOString();
  await db.query(
    `INSERT INTO conversations (id, participant_a, participant_b, task_id, created_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [conversationId, userA, userB, taskId || null, now],
  );

  return { id: conversationId, taskId: taskId || null, created: true };
}