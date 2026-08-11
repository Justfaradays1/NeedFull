"use client";

import Link from "next/link";
import { Plus, ChevronRight } from "lucide-react";
import { getCategoryColor, getCategoryIcon } from "@/lib/categoryConfig";
import { CategoryIcon } from "@/components/ui/CategoryIcon";

interface ActiveTask {
  id: string;
  title: string;
  status: string;
  budget: { kobo: number; naira: number };
  category?: { name: string; icon: string } | null;
}

interface ActiveTasksSectionProps {
  tasks: ActiveTask[];
  loading: boolean;
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    open: "Waiting for runner",
    matched: "Runner assigned",
    accepted: "Runner assigned",
    in_progress: "In progress",
    awaiting_confirmation: "Awaiting confirmation",
    completed: "Completed",
  };
  return map[status] ?? status.replace(/_/g, " ");
}

// WHAT: State-aware, compact Active Tasks on Home. A single concise preview
//       when something is live; a tiny inline empty state otherwise. The full
//       task lifecycle lives in My Tasks (/tasks).
export function ActiveTasksSection({ tasks, loading }: ActiveTasksSectionProps) {
  const active = tasks.filter((t) =>
    ["open", "matched", "accepted", "in_progress", "awaiting_confirmation"].includes(t.status),
  );

  if (loading) {
    return (
      <section aria-label="Active tasks">
        <div className="mb-2 h-5 w-28 animate-pulse rounded bg-gray-100" />
        <div className="h-16 animate-pulse rounded-xl bg-gray-50" />
      </section>
    );
  }

  return (
    <section aria-label="Active tasks">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">
          Active Tasks
        </h2>
        <Link
          href="/tasks"
          className="flex shrink-0 items-center gap-0.5 text-[11px] font-bold text-brand-text"
        >
          View all <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {active.length === 0 ? (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-dashed border-gray-200 px-3.5 py-3 dark:border-white/10">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            No active tasks yet
          </p>
          <Link
            href="/tasks/create"
            className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-gold px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.97]"
          >
            <Plus className="h-3.5 w-3.5" />
            Post a Task
          </Link>
        </div>
      ) : (
        <div className="card-list mt-3">
          {active.slice(0, 2).map((task) => (
            <Link
              key={task.id}
              href={`/tasks/${task.id}`}
              className="flex items-center gap-3 rounded-xl border border-card-border bg-surface p-3 shadow-sm transition-all hover:border-brand/20 hover:shadow-md active:scale-[0.99]"
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: getCategoryColor(task.category?.name ?? "other") }}
              >
                <CategoryIcon name={getCategoryIcon(task.category?.name ?? "other")} className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
                  {task.title}
                </p>
                <p className="truncate text-[11px] font-medium text-brand-text">
                  {statusLabel(task.status)}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}