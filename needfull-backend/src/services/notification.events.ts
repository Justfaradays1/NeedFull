// WHAT: Centralized notification engine — domain events → in-app notification
// WHY: Services emit semantic domain events instead of hand-building notification
//      payloads. Keeps delivery strategy (in-app badge, center/history, future
//      email/SMS, push) in ONE place so new feature notifications don't drift.
// FUTURE: Add channel plugins (email/SMS/PWA push), notification preferences
//         filtering, and batching. Real-time emit + persistence live in
//         notification.service.ts (notifyUser / notifyMany).

import { notifyUser, notifyMany } from "./notification.service";

// WHAT: All task-lifecycle domain events the product sends
// WHY: Typed event names prevent typos and make event coverage auditable
export type DomainEventType =
  | "task.created"
  | "task.invited"
  | "task.hired"
  | "task.hire_confirmed"
  | "application.new"
  | "application.accepted"
  | "application.rejected"
  | "application.counter_offer"
  | "task.cancelled"
  | "task.runner_done"
  | "task.completed"
  | "review.prompt";

export interface DomainEventContext {
  recipients: string | string[];
  actorId?: string;
  taskId?: string;
  data?: Record<string, unknown> & { taskTitle?: string };
}

// WHAT: Build the display payload for a domain event
// WHY: Copy lives here, not scattered across services; keeps notification copy
//      consistent across features
function buildDisplayPayload(
  event: DomainEventType,
  data: Record<string, unknown> & { taskTitle?: string },
): { title: string; body: string } {
  const title = data.taskTitle || "Task update";
  switch (event) {
    case "task.created":
      return { title: "Task Posted", body: `Your task "${title}" is live and visible to runners.` };
    case "task.invited":
      return { title: "A poster wants you", body: `You were invited to apply to "${title}".` };
    case "task.hired":
      return { title: "You're Hired!", body: `You've been hired for "${title}". The poster chose your application.` };
    case "task.hire_confirmed":
      return { title: "Runner Booked", body: `The runner accepted the job for "${title}".` };
    case "application.new":
      return { title: "New Application", body: `A runner applied to "${title}".` };
    case "application.accepted":
      return { title: "Application Accepted", body: `Your application for "${title}" was accepted!` };
    case "application.rejected":
      return { title: "Application Not Selected", body: `Another runner was selected for "${title}".` };
    case "application.counter_offer":
      return { title: "Counter Offer", body: `You received a counter offer for "${title}".` };
    case "task.cancelled":
      return { title: "Task Cancelled", body: `The task "${title}" was cancelled.` };
    case "task.runner_done":
      return { title: "Runner Marked Done", body: `"${title}" was marked done by the runner. Confirm or report an issue.` };
    case "task.completed":
      return { title: "Task Completed", body: `"${title}" is complete and payment was released.` };
    case "review.prompt":
      return { title: "Rate Your Experience", body: `How was your experience with "${title}"?` };
    default:
      return { title, body: title };
  }
}

// WHAT: Emit a domain event → in-app notifications (persisted + real-time)
// WHY: Single funnel for services; email/SMS/push channel hooks plug in here later
export async function emitDomainEvent(
  event: DomainEventType,
  context: DomainEventContext,
): Promise<void> {
  try {
    const { recipients, actorId, taskId, data = {} } = context;
    const display = buildDisplayPayload(event, data);
    const payload = {
      type: event,
      title: display.title,
      body: display.body,
      taskId,
      conversationId: undefined,
      actorId: actorId || undefined,
    };

    if (Array.isArray(recipients)) {
      await notifyMany(recipients, payload);
    } else {
      await notifyUser(recipients, payload);
    }
  } catch (error) {
    // WHAT: Notification emission must never break the business flow
    console.error(`[NotificationEngine] Failed to emit ${event}:`, error);
  }
}