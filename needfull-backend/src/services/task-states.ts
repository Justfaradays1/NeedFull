// WHAT: Task lifecycle state machine — canonical states, legacy storage mapping,
//       and transition guards. Single source of truth for task status rules.
// WHY: Tasks historically stored legacy strings (open / in_progress / completed /
//      cancelled) with no transition validation. This module defines the product
//      state machine (Draft → Published → Matched → Accepted → Runner En Route →
//      Started → Completed → Payment Released → Rated → Archived), maps canonical
//      states to storage values so legacy rows keep working, and blocks invalid
//      jumps. No storage value is rewritten here — mapping keeps old rows intact.
// FUTURE: Persist granular phases in their own column; add dispute/draft states;
//         expose transition history for auditing.

export const TaskStatus = {
  DRAFT: "draft",
  PUBLISHED: "published",
  AWAITING_FUNDING: "awaiting_funding",
  MATCHED: "matched",
  ACCEPTED: "accepted",
  RUNNER_EN_ROUTE: "runner_en_route",
  STARTED: "started",
  COMPLETED: "completed",
  PAYMENT_RELEASED: "payment_released",
  RATED: "rated",
  CANCELLED: "cancelled",
  ARCHIVED: "archived",
} as const;

export type TaskStatusValue = (typeof TaskStatus)[keyof typeof TaskStatus];

// WHAT: Storage values the tasks.status column actually holds (legacy vocabulary)
export const STORAGE_STATUSES = [
  "open",
  "awaiting_funding",
  "in_progress",
  "completed",
  "cancelled",
] as const;
export type StorageStatus = (typeof STORAGE_STATUSES)[number];

// WHAT: Runner progress phases stored in tasks.runner_phase (null until hired)
export const RunnerPhase = {
  MATCHED: "matched",
  ACCEPTED: "accepted",
  TRAVELLING: "travelling",
  ARRIVED: "arrived",
  WORKING: "working",
  AWAITING_CONFIRMATION: "awaiting_confirmation",
} as const;

export type RunnerPhaseValue = (typeof RunnerPhase)[keyof typeof RunnerPhase];

// WHAT: Human-readable label + phase group for UI rendering
export interface TaskStateMeta {
  label: string;
  phase: "discovery" | "hiring" | "active" | "closing" | "terminal";
  storage: StorageStatus;
}

export const TASK_STATE_META: Record<TaskStatusValue, TaskStateMeta> = {
  [TaskStatus.DRAFT]: { label: "Draft", phase: "discovery", storage: "open" },
  [TaskStatus.PUBLISHED]: { label: "Published", phase: "discovery", storage: "open" },
  [TaskStatus.AWAITING_FUNDING]: { label: "Awaiting Funding", phase: "hiring", storage: "awaiting_funding" },
  [TaskStatus.MATCHED]: { label: "Matched", phase: "hiring", storage: "in_progress" },
  [TaskStatus.ACCEPTED]: { label: "Runner Accepted", phase: "hiring", storage: "in_progress" },
  [TaskStatus.RUNNER_EN_ROUTE]: { label: "Runner En Route", phase: "active", storage: "in_progress" },
  [TaskStatus.STARTED]: { label: "In Progress", phase: "active", storage: "in_progress" },
  [TaskStatus.COMPLETED]: { label: "Awaiting Confirmation", phase: "closing", storage: "in_progress" },
  [TaskStatus.PAYMENT_RELEASED]: { label: "Completed", phase: "closing", storage: "completed" },
  [TaskStatus.RATED]: { label: "Rated", phase: "closing", storage: "completed" },
  [TaskStatus.CANCELLED]: { label: "Cancelled", phase: "terminal", storage: "cancelled" },
  [TaskStatus.ARCHIVED]: { label: "Archived", phase: "terminal", storage: "cancelled" },
};

// WHAT: Allowed transitions. Transitions are defined canonically; storage values
//       never skip stages (e.g. open → completed directly is rejected).
export const ALLOWED_TRANSITIONS: Record<TaskStatusValue, TaskStatusValue[]> = {
  [TaskStatus.DRAFT]: [TaskStatus.PUBLISHED, TaskStatus.ARCHIVED],
  [TaskStatus.PUBLISHED]: [TaskStatus.MATCHED, TaskStatus.AWAITING_FUNDING, TaskStatus.CANCELLED],
  [TaskStatus.AWAITING_FUNDING]: [TaskStatus.MATCHED, TaskStatus.CANCELLED],
  [TaskStatus.MATCHED]: [TaskStatus.ACCEPTED, TaskStatus.STARTED, TaskStatus.CANCELLED],
  [TaskStatus.ACCEPTED]: [TaskStatus.RUNNER_EN_ROUTE, TaskStatus.STARTED, TaskStatus.CANCELLED],
  [TaskStatus.RUNNER_EN_ROUTE]: [TaskStatus.STARTED, TaskStatus.CANCELLED],
  [TaskStatus.STARTED]: [TaskStatus.COMPLETED, TaskStatus.CANCELLED],
  [TaskStatus.COMPLETED]: [TaskStatus.PAYMENT_RELEASED],
  [TaskStatus.PAYMENT_RELEASED]: [TaskStatus.RATED, TaskStatus.ARCHIVED],
  [TaskStatus.RATED]: [TaskStatus.ARCHIVED],
  [TaskStatus.CANCELLED]: [TaskStatus.ARCHIVED],
  [TaskStatus.ARCHIVED]: [],
};

// WHAT: Map a row (storage status + optional flags) to its canonical state
// WHY: in_progress alone is ambiguous — runner_done_at and runner_phase
//      disambiguate Matched / Accepted / En Route / Started / Awaiting Confirmation
export function canonicalStatus(
  status: string,
  flags?: { runnerDoneAt?: string | null; runnerPhase?: string | null },
): TaskStatusValue {
  switch (status) {
    case "open":
      return TaskStatus.PUBLISHED;
    case "awaiting_funding":
      return TaskStatus.AWAITING_FUNDING;
    case "in_progress":
      if (flags?.runnerDoneAt) return TaskStatus.COMPLETED;
      switch (flags?.runnerPhase) {
        case RunnerPhase.ACCEPTED:
          return TaskStatus.ACCEPTED;
        case RunnerPhase.TRAVELLING:
          return TaskStatus.RUNNER_EN_ROUTE;
        case RunnerPhase.ARRIVED:
        case RunnerPhase.WORKING:
          return TaskStatus.STARTED;
        case RunnerPhase.MATCHED:
        default:
          return TaskStatus.MATCHED;
      }
    case "completed":
      return TaskStatus.PAYMENT_RELEASED;
    case "cancelled":
      return TaskStatus.CANCELLED;
    default:
      return TaskStatus.DRAFT;
  }
}

// WHAT: Map a canonical state back to the storage value (never rewrites rows,
//       only used when computing what to persist on a transition)
export function storageForStatus(status: TaskStatusValue): StorageStatus {
  return TASK_STATE_META[status].storage;
}

// WHAT: Assert a transition is legal — throws a friendly error otherwise
export function assertValidTransition(
  from: TaskStatusValue,
  to: TaskStatusValue,
  context?: string,
): void {
  if (from === to) return;
  const allowed = ALLOWED_TRANSITIONS[from] || [];
  if (!allowed.includes(to)) {
    const where = context ? ` (${context})` : "";
    throw new Error(
      `Invalid task status transition: "${TASK_STATE_META[from].label}" → "${TASK_STATE_META[to].label}"${where}`,
    );
  }
}

// WHAT: Guard a transition from a raw storage row to a canonical target
export function assertTransitionFromStorage(
  storageStatus: string,
  to: TaskStatusValue,
  flags?: { runnerDoneAt?: string | null; runnerPhase?: string | null },
  context?: string,
): TaskStatusValue {
  const from = canonicalStatus(storageStatus, flags);
  assertValidTransition(from, to, context);
  return from;
}
