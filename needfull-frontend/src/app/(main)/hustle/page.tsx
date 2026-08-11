// WHAT: Runner marketplace — Find Tasks. Search + category chips + sort + rich cards
// WHY: Runners need a proper discovery surface: search by keyword/poster/location,
//      filter by category, sort by budget/distance/deadline, and read trust signals
//      (poster avatar + trust score) before applying.

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  RefreshCw,
  Plus,
  ChevronRight,
  Search,
  CircleDollarSign,
  Briefcase,
  ChevronDown,
} from "lucide-react";
import { get } from "@/lib/apiClient";
import { getCategoryDisplayName, getCategoryColor, getCategoryIcon } from "@/lib/categoryConfig";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { useAuthUser, useAuthStore } from "@/store";
import { type TaskItem } from "@/types/task";
import TaskCard from "@/components/tasks/TaskCard";

interface Category {
  id: string;
  name: string;
  icon?: string | null;
}

type SortMode =
  | "recommended"
  | "newest"
  | "highest"
  | "nearest"
  | "ending_soon";

// WHAT: Read the runner's saved location (set during onboarding/Start Earning)
// WHY: Enables server-side distance on every task so cards can show "2.1km away"
function getRunnerLocation(): { lat: number; lng: number } | null {
  try {
    const raw = localStorage.getItem("nf_runner_location");
    if (!raw) return null;
    const loc = JSON.parse(raw);
    return loc && typeof loc.lat === "number" && typeof loc.lng === "number" ? loc : null;
  } catch {
    return null;
  }
}

/* ─── Sorts ─── */

const SORT_OPTIONS: { value: SortMode; label: string; needsLocation?: boolean }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "newest", label: "Newest" },
  { value: "highest", label: "Highest Budget" },
  { value: "nearest", label: "Nearest", needsLocation: true },
  { value: "ending_soon", label: "Ending Soon" },
];

/* ─── Page ─── */

export default function HustlePage() {
  const user = useAuthUser();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<SortMode>("recommended");
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState(false);
  const hasLocation = useMemo(() => getRunnerLocation() !== null, []);

  // WHAT: Debounce the search box so we don't hit the API on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const loc = getRunnerLocation();
      const params = new URLSearchParams({ status: "open", sortBy: "newest", perPage: "50" });
      if (loc) {
        params.set("lat", String(loc.lat));
        params.set("lng", String(loc.lng));
        params.set("radiusKm", "10");
      }
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await get<{ success: boolean; data: TaskItem[] }>(`/tasks?${params.toString()}`);
      if (res.success) setTasks(res.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchTasks();
  }, [isAuthenticated, fetchTasks]);

  // WHAT: Pull real categories once (fallback: derive from loaded tasks)
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    get<Category[] | { success: boolean; data: Category[] }>("/categories")
      .then((res) => {
        if (cancelled) return;
        if (Array.isArray(res)) setCategories(res);
        else if (res?.success && Array.isArray(res.data)) setCategories(res.data);
      })
      .catch(() => { /* fall back to derived list */ });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const derivedCategories = useMemo(() => {
    const seen = new Set<string>();
    const list: Category[] = [];
    for (const t of tasks) {
      if (t.category && !seen.has(t.category.id)) {
        seen.add(t.category.id);
        list.push({ id: t.category.id, name: t.category.name, icon: t.category.icon });
      }
    }
    return list;
  }, [tasks]);

  const chipCategories = categories.length > 0 ? categories : derivedCategories;

  const visible = useMemo(() => {
    const filtered = category === "all" ? tasks : tasks.filter((t) => t.category?.id === category);
    const sorted = [...filtered];
    if (sort === "newest") {
      sorted.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    } else if (sort === "highest") {
      sorted.sort((a, b) => b.budget.kobo - a.budget.kobo);
    } else if (sort === "nearest") {
      sorted.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    } else if (sort === "ending_soon") {
      sorted.sort((a, b) => {
        const ad = a.deadline ? +new Date(a.deadline) : Infinity;
        const bd = b.deadline ? +new Date(b.deadline) : Infinity;
        if (ad === bd) return +new Date(b.createdAt) - +new Date(a.createdAt);
        return ad - bd;
      });
    } else {
      // recommended: urgent first, then newest within each band
      sorted.sort((a, b) => {
        if (a.isUrgent !== b.isUrgent) return a.isUrgent ? -1 : 1;
        return +new Date(b.createdAt) - +new Date(a.createdAt);
      });
    }
    return sorted;
  }, [tasks, category, sort]);

  const isOnline = user?.isAvailable ?? false;
  const searching = search.trim().length > 0;

  const clearFilters = useCallback(() => {
    setSearch("");
    setDebouncedSearch("");
    setCategory("all");
  }, []);

  return (
    <div className="min-h-screen page-shell">
      {/* Header */}
      <div className="glass-dark px-4 pb-4 pt-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold text-white sm:text-2xl">
              Find Tasks
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

        {/* Search — title, category, location, poster name */}
        <div className="mt-3 flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-white/70" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, category, location, or poster…"
            className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="shrink-0 text-xs font-bold text-white/70 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="px-4 pb-10 pt-4">
        {/* Offline notice */}
        {!isOnline && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-gold/30 bg-gold-light/60 px-4 py-3">
            <p className="text-xs font-medium text-gray-700">
              You&apos;re offline. Posters can&apos;t see you — go online to get found.
            </p>
            <Link
              href="/feed"
              className="shrink-0 rounded-lg bg-gold px-3 py-1.5 text-xs font-bold text-white shadow-sm active:scale-[0.97]"
            >
              Go Online
            </Link>
          </div>
        )}

        {/* Category chips + sort — sticky under the app bar */}
        <div className="sticky top-14 z-20 -mx-4 space-y-2 bg-gray-50 px-4 py-2">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
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
            {chipCategories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                  category === c.id
                    ? "text-white shadow-sm"
                    : "border border-card-border bg-surface text-gray-600"
                }`}
                style={category === c.id ? { backgroundColor: getCategoryColor(c.name) } : undefined}
              >
                <CategoryIcon
                  name={getCategoryIcon(c.name)}
                  className="h-3.5 w-3.5"
                  style={{ color: category === c.id ? "#ffffff" : getCategoryColor(c.name) }}
                />
                {getCategoryDisplayName(c.name)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-card-border bg-surface p-1 scrollbar-hide">
            {SORT_OPTIONS.map((opt) => {
              const disabled = opt.needsLocation && !hasLocation;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => setSort(opt.value)}
                  className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
                    sort === opt.value
                      ? "bg-gold text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  } ${disabled ? "opacity-40" : ""}`}
                >
                  {sort === opt.value && <ChevronDown className="h-3 w-3 -rotate-90" />}
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Result count */}
        <div className="mb-3 mt-2 flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-gray-500">
            {loading
              ? "Loading tasks…"
              : `${visible.length} open task${visible.length === 1 ? "" : "s"}${search ? ` for “${search.trim()}”` : ""}${category !== "all" ? " in this category" : ""}`}
          </p>
          {(search || category !== "all") && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-[11px] font-bold text-brand-text hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Deck */}
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
            <p className="mt-2 text-sm font-bold text-gray-900">
              {search ? `No tasks match “${search.trim()}”` : "No tasks here right now"}
            </p>
            <p className="mx-auto mt-1 max-w-[16rem] text-xs leading-relaxed text-gray-500">
              {search
                ? "Try a different keyword — the poster name, place, or task type often works."
                : category !== "all"
                  ? "Nothing in this category at the moment — try another one."
                  : "New tasks drop all day. Refresh to catch the latest, or widen your radius."}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {(search || category !== "all") && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-card-border px-3.5 py-2 text-xs font-bold text-gray-700 transition-all active:scale-[0.97]"
                >
                  Show all tasks
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
            {!search && category === "all" && (
              <Link
                href="/tasks/create"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-brand-text"
              >
                <Plus className="h-3.5 w-3.5" />
                Or post a task of your own <ChevronRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((task, idx) => (
              <TaskCard key={task.id} task={task} featured={idx === 0} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}