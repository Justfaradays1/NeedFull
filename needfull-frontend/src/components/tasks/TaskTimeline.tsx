// WHAT: Vertical task progress timeline — Posted → Hired → In Progress →
//       Awaiting Confirmation → Payment Released (→ Rated)
// WHY: The permanent historical record of a task. Derived from the task's
//      canonical state (status + runner_phase + runner_done_at) so it always
//      reflects reality without a separate timeline table.
// FUTURE: Back with a persisted task_timeline_events table once disputes and
//         granular runner phases (arrived/started) land.

"use client";

import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { timeAgo } from "@/lib/format";

export interface TimelineStep {
  id: string;
  label: string;
  sub?: string | null;
  done: boolean;
  current?: boolean;
}

interface TaskTimelineProps {
  steps: TimelineStep[];
}

export function TaskTimeline({ steps }: TaskTimelineProps) {
  return (
    <div className="space-y-0">
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        return (
          <div key={step.id} className="flex gap-3">
            {/* Dot + line column */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  step.done
                    ? "border-brand bg-brand text-on-brand"
                    : step.current
                      ? "border-gold bg-gold-light text-gold"
                      : "border-gray-300 bg-surface text-gray-300",
                )}
              >
                {step.done ? (
                  <Check className="h-3.5 w-3.5" />
                ) : step.current ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                )}
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "w-0.5 flex-1 min-h-6",
                    step.done ? "bg-brand/40" : "bg-gray-200",
                  )}
                />
              )}
            </div>
            {/* Label column */}
            <div className={cn("pb-5", isLast && "pb-0")}>
              <p
                className={cn(
                  "text-sm font-semibold leading-tight",
                  step.done
                    ? "text-gray-900"
                    : step.current
                      ? "text-gold"
                      : "text-gray-400",
                )}
              >
                {step.label}
              </p>
              {step.sub && (
                <p className="mt-0.5 text-xs text-gray-500">{step.sub}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// WHAT: Build timeline steps for a task from its raw API shape
// WHY: Single source for the progress tracker — mirrors task-states.ts
//      canonicalStatus() on the client so UI and backend agree.
export function buildTaskTimeline(task: {
  status: string;
  runnerPhase?: string | null;
  runnerDoneAt?: string | null;
  runnerId?: string | null;
  agreedAmount?: { kobo: number; naira: number } | null;
  createdAt: string;
  runner?: { fullName: string } | null;
}): TimelineStep[] {
  const runnerHired = !!task.runnerId;
  const working = ["working", "arrived"].includes(task.runnerPhase ?? "");
  const awaiting = !!task.runnerDoneAt;
  const released = task.status === "completed";

  const time = (s?: string | null) => (s ? timeAgo(s) : null);
  const runnerName = task.runner?.fullName?.split(" ")[0] ?? "The runner";

  return [
    {
      id: "posted",
      label: "Task Posted",
      sub: time(task.createdAt),
      done: true,
    },
    {
      id: "hired",
      label: "Runner Hired",
      sub: runnerHired ? `${runnerName} accepted the task` : null,
      done: runnerHired,
    },
    {
      id: "started",
      label: "Work In Progress",
      sub: released
        ? "Task completed"
        : working || awaiting
          ? `${runnerName} is working on it`
          : runnerHired
            ? "Waiting for the runner to start"
            : null,
      done: working || awaiting || released,
      current: runnerHired && !working && !awaiting && !released,
    },
    {
      id: "awaiting",
      label: "Awaiting Confirmation",
      sub: awaiting
        ? `${runnerName} marked the task done`
        : released
          ? "Confirmed by the poster"
          : "The poster confirms when the work is done",
      done: awaiting || released,
      current: awaiting && !released,
    },
    {
      id: "released",
      label: "Payment Released",
      sub: released ? "Escrow released to the runner" : null,
      done: released,
    },
  ];
}
