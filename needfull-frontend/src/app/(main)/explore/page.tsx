// WHAT: Explore — NeedFull's discovery hub.
// WHY:  Answers "what can I do / hire for / what's happening around me?"
//       Categories → Tasks Near You → Runners Nearby → Popular Right Now → Recommended.
//       No roadmap cards, no account progression (trust/credits live on Profile/Wallet).
// NOTE: One open-tasks fetch (perPage=12) powers Near You / Popular / Recommended;
//       nearby runners load lazily only after geolocation resolves. Header, search
//       and categories render instantly from static config.

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Compass,
  Flame,
  LocateFixed,
  MapPin,
  Search,
  Sparkles,
} from "lucide-react";
import { get } from "@/lib/apiClient";
import { useAuthStore } from "@/store";
import {
  getCategoryConfigs,
  getCategoryColor,
  getCategoryIcon,
} from "@/lib/categoryConfig";
import { formatCurrency, timeAgo, formatDistance } from "@/lib/format";
import { type TaskItem } from "@/types/task";
import { Avatar } from "@/components/ui/avatar";
import TaskCard from "@/components/tasks/TaskCard";
import { CategoryTile } from "@/components/ui/CategoryTile";
import { CategoryIcon } from "@/components/ui/CategoryIcon";

/* ─── Types ─── */

interface Runner {
  id: string;
  fullName: string;
  bio: string | null;
  profilePictureUrl: string | null;
  trustScore: number;
  tasksCompleted: number;
  department: string | null;
  level: string | null;
  hostel: string | null;
  skills: string[] | null;
  distanceMeters: number;
}

/* ─── Shared bits ─── */

function SectionHeader({
  icon,
  title,
  actionHref,
  actionLabel,
}: {
  icon: React.ReactNode;
  title: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="mb-2.5 flex items-center justify-between gap-2">
      <h2 className="flex items-center gap-1.5 text-sm font-bold text-gray-900 dark:text-white">
        {icon}
        {title}
      </h2>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="flex shrink-0 items-center gap-0.5 text-xs font-bold text-brand-text"
        >
          {actionLabel} <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-40 w-64 shrink-0 animate-pulse rounded-2xl border border-card-border bg-surface-secondary dark:bg-white/5 sm:w-72"
        />
      ))}
    </div>
  );
}

function RunnerCard({ runner, onTap }: { runner: Runner; onTap: () => void }) {
  const topSkill = runner.skills?.[0] || null;
  return (
    <button
      type="button"
      onClick={onTap}
      className="tap-target flex w-36 shrink-0 flex-col items-center rounded-2xl border border-card-border bg-surface p-4 text-center shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:border-brand/25 hover:shadow-lifted active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
    >
      <div className="relative">
        <Avatar src={runner.profilePictureUrl} name={runner.fullName} size="lg" />
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-success" />
      </div>
      <p className="mt-2 w-full truncate text-[13px] font-bold text-gray-900 dark:text-white">
        {runner.fullName}
      </p>
      {topSkill ? (
        <p className="mt-0.5 w-full truncate text-[11px] font-medium text-gray-600 dark:text-gray-400">
          {topSkill}
        </p>
      ) : (
        <p className="mt-0.5 w-full truncate text-[11px] text-gray-400 dark:text-gray-500">
          NeedRunner
        </p>
      )}
      <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold">
        <span className="rounded-full bg-brand-light px-2 py-0.5 font-bold text-brand-text dark:bg-white/10 dark:text-emerald-300">
          {runner.trustScore}
        </span>
        <span className="inline-flex items-center gap-0.5 text-gray-700 dark:text-gray-300">
          <MapPin className="h-2.5 w-2.5" />
          {formatDistance(runner.distanceMeters)}
        </span>
      </div>
    </button>
  );
}

/* Compact task chip — Popular / Recommended rows */
function CompactTaskChip({ task }: { task: TaskItem }) {
  const categoryName = task.category?.name ?? "other";
  return (
    <Link
      href={`/feed/${task.id}`}
      className="tap-target flex w-72 min-w-72 shrink-0 items-center gap-2.5 rounded-2xl border border-card-border bg-surface p-3 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-brand/25 hover:shadow-md active:scale-[0.98]"
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
        style={{ backgroundColor: getCategoryColor(categoryName) }}
      >
        <CategoryIcon name={getCategoryIcon(categoryName)} className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold text-gray-900 dark:text-white">
          {task.title}
        </p>
        <p className="truncate text-[11px] font-medium text-gray-500 dark:text-gray-400">
          {formatCurrency(task.budget.kobo)} · {timeAgo(task.createdAt)}
          {task.isUrgent ? " · URGENT" : ""}
        </p>
      </div>
    </Link>
  );
}

/* ─── Main page ─── */

export default function ExplorePage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState(false);

  const [runners, setRunners] = useState<Runner[]>([]);
  const [runnersLoading, setRunnersLoading] = useState(true);
  const [geoState, setGeoState] = useState<"loading" | "ok" | "denied">("loading");

  const categories = useMemo(
    () => getCategoryConfigs().filter((c) => c.key !== "other"),
    [],
  );

  const openPalette = useCallback(() => {
    window.dispatchEvent(new Event("nf:open-command-palette"));
  }, []);

  /* WHAT: One open-tasks fetch powers Near You / Popular / Recommended.
     WHY:  Single request, progressive section rendering, no duplicates. */
  const fetchTasks = useCallback(async () => {
    if (!isAuthenticated) return;
    setTasksLoading(true);
    setTasksError(false);
    try {
      let locationQuery = "";
      try {
        const raw = localStorage.getItem("nf_runner_location");
        if (raw) {
          const loc = JSON.parse(raw);
          if (loc && typeof loc.lat === "number" && typeof loc.lng === "number") {
            locationQuery = `&lat=${loc.lat}&lng=${loc.lng}&radiusKm=10`;
          }
        }
      } catch { /* no saved location — fetch without distance */ }
      const res = await get<{ success: boolean; data: TaskItem[] }>(
        `/tasks?sortBy=newest&status=open&perPage=12${locationQuery}`,
      );
      setTasks(res.success ? res.data : []);
    } catch {
      setTasksError(true);
    } finally {
      setTasksLoading(false);
    }
  }, [isAuthenticated]);

  /* WHAT: Nearby runners — lazy, geolocation-gated (secondary discovery) */
  const fetchRunners = useCallback(() => {
    if (!isAuthenticated) return;
    setRunnersLoading(true);
    setGeoState("loading");
    if (!navigator.geolocation) {
      setGeoState("denied");
      setRunnersLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await get<{ success: boolean; data: Runner[] }>(
            `/users/nearby-runners?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}&radiusMeters=5000`,
          );
          if (res.success) setRunners(res.data);
        } catch {
          setRunners([]);
        } finally {
          setGeoState("ok");
          setRunnersLoading(false);
        }
      },
      () => {
        setGeoState("denied");
        setRunnersLoading(false);
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }, [isAuthenticated]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchTasks();
      fetchRunners();
    }, 0);
    return () => clearTimeout(t);
  }, [fetchTasks, fetchRunners]);

  /* WHAT: Sliced task collections from the single fetch */
  const nearYou = useMemo(() => {
    if (tasks.length === 0) return tasks;
    const withDist = tasks.filter((t) => typeof t.distance === "number");
    const list = withDist.length > 0
      ? [...withDist].sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
      : tasks;
    return list.slice(0, 5);
  }, [tasks]);

  const popular = useMemo(() => {
    return [...tasks]
      .sort((a, b) => (b.applicationCount ?? 0) - (a.applicationCount ?? 0))
      .slice(0, 4);
  }, [tasks]);

  const recommended = useMemo(() => {
    const nearIds = new Set(nearYou.map((t) => t.id));
    const rest = tasks
      .filter((t) => !nearIds.has(t.id))
      .sort((a, b) => {
        if (b.isUrgent !== a.isUrgent) return b.isUrgent ? 1 : -1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    return rest.slice(0, 4);
  }, [tasks, nearYou]);

  return (
    <div className="min-h-screen page-shell pb-12">
      {/* Header */}
      <div className="glass-dark px-4 pb-4 pt-3">
        <h1 className="font-display text-xl font-bold text-white sm:text-2xl">
          Explore
        </h1>
        <p className="mt-0.5 text-xs text-white/70 sm:text-sm">
          Discover tasks, runners, and categories
        </p>
      </div>

      <div className="space-y-7 px-4 pt-4">
        {/* Search — opens the global command palette */}
        <button
          type="button"
          onClick={openPalette}
          className="search-pill flex h-12 w-full items-center gap-2.5 rounded-full border border-card-border bg-surface px-4 text-left shadow-sm transition-all hover:border-brand/30 hover:shadow-md active:scale-[0.99]"
          aria-label="Search tasks, runners, and categories"
        >
          <Search className="h-4 w-4 shrink-0 text-foreground-muted" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-600 dark:text-gray-300">
            Search tasks, runners, categories...
          </span>
          <kbd className="hidden shrink-0 rounded-md border border-card-border bg-surface-secondary px-1.5 py-0.5 text-[10px] font-semibold text-foreground-muted md:inline dark:bg-white/5">
            ⌘K
          </kbd>
        </button>

        {/* Popular Categories — static, instant */}
        <section aria-label="Popular categories">
          <SectionHeader
            icon={<Compass className="h-4 w-4 text-brand-text" />}
            title="Popular Categories"
            actionHref="/categories"
            actionLabel="See all"
          />
          <div className="scrollbar-hide -mr-4 flex gap-2 overflow-x-auto pb-1 pr-4">
            {categories.map((cat) => (
              <CategoryTile key={cat.key} category={cat} className="w-44 shrink-0" />
            ))}
          </div>
        </section>

        {/* Tasks Near You */}
        <section aria-label="Tasks near you">
          <SectionHeader
            icon={<MapPin className="h-4 w-4 text-brand-text" />}
            title="Tasks Near You"
            actionHref="/feed"
            actionLabel="Browse tasks"
          />
          {tasksLoading ? (
            <ListSkeleton count={3} />
          ) : tasksError ? (
            <p className="rounded-xl border border-card-border bg-surface px-4 py-6 text-center text-xs text-gray-500">
              Couldn&apos;t load tasks.{" "}
              <button
                type="button"
                onClick={fetchTasks}
                className="font-bold text-brand-text"
              >
                Try again
              </button>
            </p>
          ) : nearYou.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-card-border bg-surface px-4 py-8 text-center">
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                No open tasks right now
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Be the first to post — someone nearby will pick it up.
              </p>
              <Link
                href="/tasks/create"
                className="mt-3 inline-flex rounded-lg bg-gold px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.97]"
              >
                Post a Task
              </Link>
            </div>
          ) : (
            <div className="scrollbar-hide -mr-4 flex gap-3 overflow-x-auto pb-1 pr-4">
              {nearYou.map((t) => (
                <TaskCard key={t.id} task={t} />
              ))}
            </div>
          )}
        </section>

        {/* Runners Nearby */}
        <section aria-label="Runners nearby">
          <SectionHeader
            icon={<MapPin className="h-4 w-4 text-gold-dark" />}
            title="Runners Nearby"
            actionHref="/helpers"
            actionLabel="Find a Runner"
          />
          {runnersLoading ? (
            <ListSkeleton count={3} />
          ) : geoState === "denied" ? (
            <div className="flex items-center gap-3 rounded-2xl border border-warning-border bg-warning-bg px-4 py-3.5 dark:border-amber-500/30 dark:bg-amber-500/10">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warning-bg dark:bg-amber-500/20">
                <LocateFixed className="h-4 w-4 text-warning-text dark:text-amber-300" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-warning-text dark:text-amber-200">
                  Location is off
                </p>
                <p className="text-[11px] text-warning-text dark:text-amber-300/80">
                  Turn on location to see runners near you — or browse everyone.
                </p>
              </div>
              <Link
                href="/helpers"
                className="shrink-0 rounded-lg bg-warning px-3 py-1.5 text-xs font-bold text-white transition-all hover:brightness-105 active:scale-[0.97]"
              >
                Browse
              </Link>
            </div>
          ) : runners.length === 0 ? (
            <div className="flex flex-col items-center gap-1 rounded-2xl border border-dashed border-card-border bg-surface px-4 py-8 text-center">
              <Compass className="h-8 w-8 text-foreground-muted" />
              <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
                No runners nearby right now
              </p>
              <p className="text-xs text-gray-500">Check back soon</p>
            </div>
          ) : (
            <div className="scrollbar-hide -mr-4 flex gap-3 overflow-x-auto pb-1 pr-4">
              {runners.map((r) => (
                <RunnerCard
                  key={r.id}
                  runner={r}
                  onTap={() => router.push(`/profile/${r.id}`)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Popular Right Now — most applied-for open tasks */}
        <section aria-label="Popular right now">
          <SectionHeader
            icon={<Flame className="h-4 w-4 text-gold-dark" />}
            title="Popular Right Now"
            actionHref="/feed"
            actionLabel="See tasks"
          />
          {!tasksLoading && popular.length === 0 ? (
            <p className="rounded-xl border border-card-border bg-surface px-4 py-6 text-center text-xs text-gray-500">
              Popular tasks will appear here as students post them.
            </p>
          ) : (
            <div className="scrollbar-hide -mr-4 flex gap-2.5 overflow-x-auto pb-1 pr-4">
              {(popular.length > 0 ? popular : tasks.slice(0, 4)).map((t) => (
                <CompactTaskChip key={t.id} task={t} />
              ))}
            </div>
          )}
        </section>

        {/* Recommended For You */}
        <section aria-label="Recommended for you">
          <SectionHeader
            icon={<Sparkles className="h-4 w-4 text-brand-text" />}
            title="Recommended For You"
            actionHref="/feed"
            actionLabel="See tasks"
          />
          {!tasksLoading && recommended.length === 0 ? (
            <p className="rounded-xl border border-card-border bg-surface px-4 py-6 text-center text-xs text-gray-500">
              Recommendations will appear as we learn what you hire for.
            </p>
          ) : (
            <div className="scrollbar-hide -mr-4 flex gap-2.5 overflow-x-auto pb-1 pr-4">
              {(recommended.length > 0 ? recommended : tasks.slice(0, 4)).map((t) => (
                <CompactTaskChip key={t.id} task={t} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}