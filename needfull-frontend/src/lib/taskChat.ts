// WHAT: Task-scoped chat navigation helpers
// WHY: Conversations in NeedFull belong to a task, never to random users.
//      These helpers find (or create) the conversation for a task and navigate
//      to it, so every chat entry point stays attached to its task.
// FUTURE: Add media/voice/location payload support, archive handling.

import { get, post } from "@/lib/apiClient";

interface ConversationRef {
  id: string;
  taskId: string | null;
}

// WHAT: Find or create the conversation for a task (between the current user
//      and otherUserId). Returns the conversation id, or null on failure.
export async function openTaskChat(
  taskId: string,
  otherUserId: string,
): Promise<string | null> {
  try {
    // WHAT: Prefer an existing conversation already scoped to this task
    const res = await get<{ success: boolean; data: ConversationRef[] }>(
      "/chat/conversations",
    );
    const existing = (res.data || []).find((c) => c.taskId === taskId);
    if (existing) return existing.id;

    // WHAT: Create the task-scoped conversation on first open
    const created = await post<{ success: boolean; data: ConversationRef }>(
      "/chat/conversations",
      { otherUserId, taskId },
    );
    return created?.data?.id ?? null;
  } catch {
    return null;
  }
}
