// WHAT: Runner discovery page — ranked deck of open tasks for runners
// WHY: Runners need their own task surface, detached from the poster feed.
//      Fetches open tasks, ranks them (urgent first, then by chosen sort),
//      and keeps filters in a scrollable chip row that never steals the screen.

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Clock,
  Briefcase,
  RefreshCw,
  Plus,
  ChevronRight,
  ArrowUpRight,
  CircleDollarSign,
  Flame,
} from "lucide-react";
import { get } from "@/lib/apiClient";
import { useAuthUser, useAuthStore } from "@/store";
import { formatCurrency } from "@/lib/format";

interface TaskItem {
  id: string;
  title: string;
  description?: string;
  budget: { kobo: number; naira: number };
  status: string;
  isUrgent: boolean;
  createdAt: string;
  applicationCount: number;
  category: { id: string; name: string; icon: string } | null;
  poster: { id: string; fullName: string };
}

type SortMode = "ranked" | "newest" | "highest";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
  });
}

function TaskCard({ task, index }: { task: TaskItem; index: number }) {
  return (
    <Link
      href={`/feed/${task.id}`}
      className={`tap-target block rounded-2xl border border-card-border bg-surface p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] ${
        index === 0 ? "border-gold/40 ring-1 ring-gold/20" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            {index === 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[9px] font-bold text-white">
                <Flame className="h-2.5 w-2.5" /> TOP PICK
              </span>
            )}
            {task.isUrgent && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-700">
                URGENT
              </span>
            )}
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-medium text-amber-700">
              {task.category?.name || "General"}
            </span>
          </div>
          <h3 className="text-sm font-bold text-gray-900 line-clamp-2">{task.title}</h3>
          {task.description ? (
            <p className="mt-1 text-xs leading-relaxed text-gray-500 line-clamp-2">
              {task.description}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeAgo(task.createdAt)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {task.poster?.fullName?.split(" ")[0] || "Campus"}
            </span>
            {task.applicationCount > 0 ? (
              <span className="inline-flex items-center gap-1">
                <Briefcase className="h-3 w-3" />
                {task.applicationCount} applied
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-green-600">
                No one has applied yet
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="font-display text-lg font-black text-gold">
            {formatCurrency(task.budget.kobo)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-gold px-3 py-1.5 text-[11px] font-bold text-white shadow-sm shadow-gold/20">
            View & Apply <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "ranked", label: "Top Ranked" },
  { value: "newest", label: "Newest" },
  { value: "highest", label: "Highest Pay" },
];

export default function HustlePage() {
  const user = useAuthUser();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<SortMode>("ranked");
  const [error, setError] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const res = await get<{ success: boolean; data: TaskItem[] }>(
        "/tasks?status=open&sortBy=newest&perPage=50",
      );
      if (res.success) setTasks(res.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchTasks();
  }, [isAuthenticated, fetchTasks]);

  const categories = useMemo(() => {
    const seen = new Set<string>();
    const list: { id: string; name: string }[] = [];
    for (const t of tasks) {
      if (t.category && !seen.has(t.category.id)) {
        seen.add(t.category.id);
        list.push({ id: t.category.id, name: t.category.name });
      }
    }
    return list;
  }, [tasks]);

  const visible = useMemo(() => {
    const filtered = category === "all" ? tasks : tasks.filter((t) => t.category?.id === category);
    const sorted = [...filtered];
    if (sort === "newest") {
      sorted.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    } else if (sort === "highest") {
      sorted.sort((a, b) => b.budget.kobo - a.budget.kobo);
    } else {
      // ranked: urgent first, then newest within each band
      sorted.sort((a, b) => {
        if (a.isUrgent !== b.isUrgent) return a.isUrgent ? -1 : 1;
        return +new Date(b.createdAt) - +new Date(a.createdAt);
      });
    }
    return sorted;
  }, [tasks, category, sort]);

  const isOnline = user?.isAvailable ?? false;

  return (
    <div className="min-h-screen page-shell">
      {/* Header */}
      <div className="glass-dark px-4 pb-4 pt-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold text-white sm:text-2xl">
              Your Hustle
            </h1>
            <p className="mt-0.5 text-xs text-white/70 sm:text-sm">
              Campus tasks waiting to be done — earn real money
            </p>
          </div>
          <Link
            href="/feed"
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors ${
              isOnline
                ? "bg-green-500/20 text-green-300"
                : "bg-white/15 text-white/80"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${isOnline ? "bg-green-400" : "bg-white/50"}`}
            />
            {isOnline ? "Online" : "Offline"}
          </Link>
        </div>
      </div>

      <div className="px-4 pb-10 pt-4">
        {/* Offline notice — always visible handoff to go online */}
        {!isOnline && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-gold/30 bg-gold-light/60 px-4 py-3">
            <p className="text-xs font-medium text-gray-700">
              You&apos;re offline. Posters can&apos;t see you — go online to get
              found.
            </p>
            <Link
              href="/feed"
              className="shrink-0 rounded-lg bg-gold px-3 py-1.5 text-xs font-bold text-white shadow-sm active:scale-[0.97]"
            >
              Go Online
            </Link>
          </div>
        )}

        {/* Summary + sort (non-sticky) */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-gray-500">
            {loading ? "Loading tasks…" : `${visible.length} open task${visible.length === 1 ? "" : "s"}${category !== "all" ? " in this category" : ""}`}
          </p>
          <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-0.5 dark:bg-neutral-800">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSort(opt.value)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors ${
                  sort === opt.value
                    ? "bg-white text-brand-text shadow-sm dark:bg-neutral-700 dark:text-amber-300"
                    : "text-gray-500"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category chips — scrollable, not sticky */}
        <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
              category === "all"
                ? "bg-brand text-on-brand shadow-sm"
                : "border border-card-border bg-surface text-gray-600"
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                category === c.id
                  ? "bg-brand text-on-brand shadow-sm"
                  : "border border-card-border bg-surface text-gray-600"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Task deck */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-card-border bg-surface p-4 shadow-sm">
                <div className="h-4 w-2/3 skeleton rounded" />
                <div className="mt-2 h-3 w-1/2 skeleton rounded" />
                <div className="mt-3 flex items-center justify-between">
                  <div className="h-3 w-24 skeleton rounded" />
                  <div className="h-8 w-24 skeleton rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-center">
            <CircleDollarSign className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm font-bold text-gray-900">Couldn&apos;t load tasks</p>
            <p className="text-xs text-gray-500">Check your connection and try again</p>
            <button
              type="button"
              onClick={fetchTasks}
              className="tap-target mt-4 inline-flex items-center gap-1.5 rounded-lg bg-gold px-4 py-2 text-xs font-bold text-white shadow-sm active:scale-[0.97]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try Again
            </button>
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-center">
            <Briefcase className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm font-bold text-gray-900">No tasks here right now</p>
            <p className="mx-auto mt-1 max-w-[16rem] text-xs leading-relaxed text-gray-500">
              {category !== "all"
                ? "Nothing in this category yet — try another one."
                : "New tasks drop all day. Refresh to catch the latest."}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              {category !== "all" && (
                <button
                  type="button"
                  onClick={() => setCategory("all")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-card-border px-3.5 py-2 text-xs font-bold text-gray-700 transition-all active:scale-[0.97]"
                >
                  Show all categories
                </button>
              )}
              <button
                type="button"
                onClick={fetchTasks}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all active:scale-[0.97]"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </button>
            </div>
            <Link
              href="/tasks/create"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-brand-text"
            >
              <Plus className="h-3.5 w-3.5" />
              Or post a task of your own <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((task, idx) => (
              <TaskCard key={task.id} task={task} index={idx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}