"use client";

import Link from "next/link";
import {
  MessageCircle,
  ChevronRight,
  Clock,
  User,
  ClipboardCheck,
  ExternalLink,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";

interface ActiveTask {
  id: string;
  title: string;
  status: string;
  runner?: { id: string; fullName: string } | null;
  budget: { kobo: number; naira: number };
  deadline?: string | null;
  category?: { name: string; icon: string } | null;
}

interface ActiveTasksSectionProps {
  tasks: ActiveTask[];
  loading: boolean;
}

function statusBadge(status: string) {
  const cfg: Record<string, { label: string; color: string; bg: string }> = {
    in_progress: { label: "In Progress", color: "#EAA325", bg: "bg-amber-50" },
    awaiting_confirmation: { label: "Awaiting Confirmation", color: "#2563EB", bg: "bg-blue-50" },
    completed: { label: "Completed", color: "#16A34A", bg: "bg-green-50" },
    cancelled: { label: "Cancelled", color: "#EF4444", bg: "bg-red-50" },
  };
  const c = cfg[status] ?? { label: status, color: "#6B7280", bg: "bg-gray-50" };
  return (
    <span
      className={`inline-flex items-center rounded-full ${c.bg} px-2 py-0.5 text-[10px] font-bold`}
      style={{ color: c.color }}
    >
      {c.label}
    </span>
  );
}

export function ActiveTasksSection({ tasks, loading }: ActiveTasksSectionProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-card-border bg-surface p-4 shadow-sm">
        <div className="mb-3 h-5 w-28 animate-pulse rounded bg-gray-100" />
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-50" />
          ))}
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-card-border bg-surface p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-gray-900">Active Tasks</h3>
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center">
          <ClipboardCheck className="h-8 w-8 text-gray-300" />
          <p className="text-sm font-bold text-gray-900">No active tasks</p>
          <p className="text-xs text-gray-500">
            Post a task and a NeedRunner will pick it up
          </p>
          <Link
            href="/tasks/create"
            className="mt-1 inline-flex items-center gap-1 rounded-lg bg-gold px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.97]"
          >
            + Post Your First Task
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-card-border bg-surface p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">
          Active Tasks
          <span className="ml-1.5 text-xs font-normal text-gray-500">
            ({tasks.length})
          </span>
        </h3>
        <Link
          href="/tasks/mine"
          className="flex items-center gap-0.5 text-[11px] font-bold text-brand"
        >
          View all <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-2">
        {tasks.slice(0, 5).map((task) => (
          <Link
            key={task.id}
            href={`/tasks/${task.id}`}
            className="block rounded-lg border border-card-border p-3 transition-all hover:border-brand/20 hover:shadow-sm active:scale-[0.99]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  {task.category?.icon && (
                    <span className="text-sm">{task.category.icon}</span>
                  )}
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {task.title}
                  </p>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {statusBadge(task.status)}
                  <span className="text-xs font-bold text-gray-900">
                    {formatCurrency(task.budget.kobo)}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
                  {task.runner && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {task.runner.fullName}
                    </span>
                  )}
                  {task.deadline && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(task.deadline).toLocaleDateString("en-NG", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </div>
              </div>
              <ExternalLink className="h-4 w-4 shrink-0 text-gray-300" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
