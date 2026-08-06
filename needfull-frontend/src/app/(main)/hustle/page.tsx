// WHAT: Runner marketplace — Find Tasks. Search + category chips + sort + rich cards
// WHY: Runners need a proper discovery surface: search by keyword/poster/location,
//      filter by category, sort by budget/distance/deadline, and read trust signals
//      (poster avatar + trust score) before applying.

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Clock,
  Briefcase,
  RefreshCw,
  Plus,
  ChevronRight,
  ArrowUpRight,
  Search,
  CircleDollarSign,
  Flame,
  Star,
  BadgeCheck,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { get } from "@/lib/apiClient";
import { useAuthUser, useAuthStore } from "@/store";
import { formatCurrency } from "@/lib/format";
import { Avatar } from "@/components/ui/avatar";

interface TaskItem {
  id: string;
  title: string;
  description?: string;
  budget: { kobo: number; naira: number };
  status: string;
  isUrgent: boolean;
  createdAt: string;
  deadline: string | null;
  locationLabel: string | null;
  distance: number | null;
  applicationCount: number;
  category: { id: string; name: string; icon: string } | null;
  poster: {
    id: string;
    fullName: string;
    trustScore?: number;
    avatarUrl?: string | null;
    isVerifiedStudent?: boolean;
  };
}

interface Category {
  id: string;
  name: string;
  icon: string;
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

function timeLeft(dateStr: string): string | null {
  const ms = new Date(dateStr).getTime() - Date.now();
  if (ms <= 0) return "Due now";
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `Due in ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `Due in ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `Due in ${days}d`;
  return null;
}

function formatDistance(meters: number | null): string | null {
  if (meters === null || meters === undefined) return null;
  if (meters < 1000) return `${Math.round(meters)}m away`;
  return `${(meters / 1000).toFixed(1)}km away`;
}

function isNew(dateStr: string): boolean {
  return Date.now() - new Date(dateStr).getTime() < 24 * 60 * 60 * 1000;
}

// WHAT: High-pay threshold — ₦5,000 budget and above earns the "High Pay" label
const HIGH_PAY_KOBO = 500_000;

/* ─── TaskCard ─── */

function TaskCard({ task, index }: { task: TaskItem; index: number }) {
  const distance = formatDistance(task.distance);
  const due = task.deadline ? timeLeft(task.deadline) : null;
  const labels: React.ReactNode[] = [];
  if (index === 0)
    labels.push(
      <span key="top" className="inline-flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[9px] font-bold text-white">
        <Flame className="h-2.5 w-2.5" /> TOP PICK
      </span>,
    );
  if (task.isUrgent)
    labels.push(
      <span key="urgent" className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-700">
        <Flame className="h-2.5 w-2.5" /> URGENT
      </span>,
    );
  if (task.budget.kobo >= HIGH_PAY_KOBO)
    labels.push(
      <span key="pay" className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
        <Sparkles className="h-2.5 w-2.5" /> HIGH PAY
      </span>,
    );
  if (task.poster?.isVerifiedStudent)
    labels.push(
      <span key="verified" className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-bold text-blue-700">
        <BadgeCheck className="h-2.5 w-2.5" /> VERIFIED POSTER
      </span>,
    );
  if (isNew(task.createdAt) && index > 0)
    labels.push(
      <span key="new" className="rounded-full bg-teal-50 px-2 py-0.5 text-[9px] font-bold text-teal-700">
        NEW
      </span>,
    );

  return (
    <Link
      href={`/feed/${task.id}`}
      className={`tap-target block rounded-2xl border border-card-border bg-surface p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] ${
        index === 0 ? "border-gold/40 ring-1 ring-gold/20" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {labels.length > 0 && <div className="mb-1.5 flex flex-wrap items-center gap-1.5">{labels}</div>}
          <div className="mb-1.5 flex items-center gap-1.5">
            {task.category?.icon && (
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-light text-sm">
                {task.category.icon}
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
            {distance && (
              <span className="inline-flex items-center gap-1 font-semibold text-brand-text">
                <MapPin className="h-3 w-3" />
                {distance}
              </span>
            )}
            {due && (
              <span className="inline-flex items-center gap-1 text-red-600">
                <Clock className="h-3 w-3" />
                {due}
              </span>
            )}
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
          <div className="mt-3 flex items-center gap-2 border-t border-card-border pt-2.5">
            <Avatar
              src={task.poster?.avatarUrl}
              name={task.poster?.fullName}
              size="xs"
            />
            <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-gray-700">
              {task.poster?.fullName || "Poster"}
            </span>
            {typeof task.poster?.trustScore === "number" && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-gray-500">
                <Star className="h-3 w-3 fill-gold text-gold" />
                Trust {task.poster.trustScore}
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
                    ? "bg-brand text-white shadow-sm"
                    : "border border-card-border bg-surface text-gray-600"
                }`}
              >
                {c.icon && <span className="text-sm leading-none">{c.icon}</span>}
                {c.name}
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
              <TaskCard key={task.id} task={task} index={idx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}