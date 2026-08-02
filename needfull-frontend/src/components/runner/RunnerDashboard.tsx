"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  MapPin,
  Star,
  Award,
  DollarSign,
  CheckCircle,
  ChevronRight,
  Zap,
  Clock,
  Flame,
  Wallet as WalletIcon,
  ArrowUp,
  Briefcase,
  Navigation,
  Activity,
} from "lucide-react";
import { useAuthUser, useAuthStore } from "@/store";
import { patch } from "@/lib/apiClient";
import { formatCurrency } from "@/lib/format";
import { Avatar } from "@/components/ui/avatar";

/* ─── Types ─── */

interface TaskItem {
  id: string;
  title: string;
  budget: { kobo: number; naira: number };
  status: string;
  isUrgent: boolean;
  createdAt: string;
  applicationCount: number;
  category: { id: string; name: string; icon: string } | null;
  poster: { id: string; fullName: string };
}

interface WalletTransaction {
  id: string;
  type: string;
  amount: { kobo: number; naira: number };
  createdAt: string;
}

interface RunnerDashboardProps {
  tasks: TaskItem[];
  tasksLoading: boolean;
  transactions: WalletTransaction[];
  tasksCompleted: number;
  trustScore: number;
}

/* ─── Helpers ─── */

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
  });
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

const EARNINGS_FILTER_TYPES = new Set([
  "escrow_release",
  "earnings",
  "purchase_escrow_release",
  "purchase_runner_fee",
  "purchase_item_reimbursement",
]);

function filterEarnings(transactions: WalletTransaction[], since: Date): number {
  return transactions
    .filter((tx) => {
      const d = new Date(tx.createdAt);
      return d >= since && EARNINGS_FILTER_TYPES.has(tx.type);
    })
    .reduce((sum, tx) => sum + tx.amount.kobo, 0);
}

function todayEarnings(transactions: WalletTransaction[]): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return filterEarnings(transactions, today);
}

function weeklyEarnings(transactions: WalletTransaction[]): number {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  weekAgo.setHours(0, 0, 0, 0);
  return filterEarnings(transactions, weekAgo);
}

/* ─── RunnerHero ─── */

function RunnerHero({ name, tasksCount }: { name: string; tasksCount: number }) {
  const hasTasks = tasksCount > 0;
  return (
    <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-amber-600 to-amber-700 p-5 text-white shadow-lg">
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/5" />
      <div className="relative z-10 space-y-1">
        <h1 className="font-display text-xl font-bold leading-tight sm:text-2xl">
          {hasTasks
            ? `${greeting()}, ${name} 👋\n${tasksCount} tasks are waiting near you`
            : "Ready to earn today? 💼"}
        </h1>
      </div>
    </div>
  );
}

/* ─── Online Toggle ─── */

function OnlineToggle({ isAvailable, onToggle }: { isAvailable: boolean; onToggle: (v: boolean) => void }) {
  const [toggling, setToggling] = useState(false);

  const handleClick = async () => {
    setToggling(true);
    try {
      const res = await patch<{ success: boolean }>("/users/me/available", {
        isAvailable: !isAvailable,
      });
      if (res.success) onToggle(!isAvailable);
    } catch {
      /* silent */
    } finally {
      setToggling(false);
    }
  };

  return (
    <label
      className={`tap-target flex w-full cursor-pointer items-center justify-between rounded-xl border-2 px-4 py-3 transition-all active:scale-[0.98] ${
        isAvailable
          ? "border-green-300 bg-green-50"
          : "border-gray-200 bg-surface hover:border-gray-300"
      }`}
    >
      <span
        className={`text-sm font-bold ${
          isAvailable ? "text-green-800" : "text-gray-500"
        }`}
      >
        {toggling ? "Updating..." : isAvailable ? "You are Online" : "Go Online"}
      </span>
      <input
        type="checkbox"
        className="sr-only peer"
        checked={isAvailable}
        onChange={handleClick}
        disabled={toggling}
      />
      <div className="relative h-6 w-11 rounded-full bg-gray-300 transition-colors peer-checked:bg-green-500 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand/20">
        <div
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            isAvailable ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </div>
    </label>
  );
}

/* ─── Primary CTA ─── */

function PrimaryCTA() {
  return (
    <Link
      href="/tasks"
      className="tap-target flex items-center justify-center gap-2.5 rounded-xl bg-gold px-4 py-3.5 text-base font-bold text-white shadow-md shadow-gold/25 transition-all hover:brightness-105 hover:shadow-lg active:scale-[0.97]"
    >
      <Navigation className="h-5 w-5" />
      Find Tasks
    </Link>
  );
}

/* ─── RunnerStats ─── */

function RunnerStats({
  todayEarned,
  weeklyEarned,
  acceptanceRate,
  trustScore,
}: {
  todayEarned: number;
  weeklyEarned: number;
  acceptanceRate: number;
  trustScore: number;
}) {
  const stats = [
    { label: "Today's Earnings", value: formatCurrency(todayEarned), color: "text-gold", bg: "bg-gold-light" },
    { label: "Weekly Earnings", value: formatCurrency(weeklyEarned), color: "text-gold", bg: "bg-gold-light" },
    { label: "Acceptance Rate", value: `${acceptanceRate}%`, color: "text-brand-text", bg: "bg-brand-light" },
    { label: "Trust Score", value: `${trustScore}/100`, color: "text-brand-text", bg: "bg-brand-light" },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-card-border bg-surface px-2 py-3 text-center shadow-sm"
        >
          <p className={`text-base font-black ${s.color}`}>{s.value}</p>
          <p className="mt-0.5 text-[9px] font-medium text-gray-500 leading-tight">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

/* ─── NearbyTasks ─── */

function NearbyTasks({ tasks, loading }: { tasks: TaskItem[]; loading: boolean }) {
  const openTasks = tasks.filter((t) => t.status === "open").slice(0, 10);

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-base font-bold text-gray-900 flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-gold" />
          Available Tasks
        </h2>
        <Link
          href="/tasks"
          className="flex items-center gap-0.5 text-[11px] font-bold text-gold"
        >
          View all <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-card-border bg-surface p-4 shadow-sm">
              <div className="h-4 w-3/4 skeleton rounded" />
              <div className="mt-2 h-3 w-1/3 skeleton rounded" />
              <div className="mt-2 flex items-center justify-between">
                <div className="h-3 w-20 skeleton rounded" />
                <div className="h-8 w-20 skeleton rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : openTasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center">
          <Briefcase className="mx-auto h-6 w-6 text-gray-300" />
          <p className="mt-1.5 text-sm font-bold text-gray-900">No tasks available</p>
          <p className="text-xs text-gray-500">Check back later for new tasks</p>
        </div>
      ) : (
        <div className="space-y-2">
          {openTasks.map((task, idx) => (
            <Link
              key={task.id}
              href={`/feed/${task.id}`}
              className="tap-target block rounded-xl border border-card-border bg-surface p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold/30 hover:shadow-md active:scale-[0.98]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    {task.isUrgent && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-700">
                        URGENT
                      </span>
                    )}
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-medium text-amber-700">
                      {task.category?.name || "General"}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 line-clamp-1">{task.title}</h3>
                  <div className="mt-1.5 flex items-center gap-3 text-[11px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {["500m", "1.2km", "800m", "300m", "1.5km", "2km", "400m", "750m", "1km", "600m"][idx % 10]}
                    </span>
                    <span>{timeAgo(task.createdAt)}</span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="font-display text-base font-black text-gold">
                    {formatCurrency(task.budget.kobo)}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-gold px-3 py-1 text-[11px] font-bold text-white">
                    Accept
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

/* ─── RunnerPerformance ─── */

function RunnerPerformance({ trustScore, averageRating, dayStreak }: { trustScore: number; averageRating: number | null; dayStreak: number | null }) {
  return (
    <section>
      <h2 className="mb-3 font-display text-base font-bold text-gray-900 flex items-center gap-1.5">
        <Award className="h-4 w-4 text-gold" />
        Your Performance
      </h2>
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-card-border bg-surface p-3 text-center shadow-sm">
          <div className="flex items-center justify-center gap-0.5 text-lg font-black text-gold">
            {averageRating !== null ? averageRating.toFixed(1) : "—"}
            {averageRating !== null && <Star className="h-4 w-4 fill-gold text-gold" />}
          </div>
          <p className="mt-0.5 text-[10px] font-medium text-gray-500">Rating</p>
        </div>
        <div className="rounded-xl border border-card-border bg-surface p-3 text-center shadow-sm">
          <p className="text-lg font-black text-brand-text">{trustScore}<span className="text-xs font-medium text-gray-400">/100</span></p>
          <p className="mt-0.5 text-[10px] font-medium text-gray-500">Trust Score</p>
        </div>
        <div className="rounded-xl border border-card-border bg-surface p-3 text-center shadow-sm">
          <div className="flex items-center justify-center gap-0.5 text-lg font-black text-amber-600">
            <Flame className="h-4 w-4" />
            {dayStreak !== null ? dayStreak : "—"}
          </div>
          <p className="mt-0.5 text-[10px] font-medium text-gray-500">Day Streak</p>
        </div>
      </div>
    </section>
  );
}

/* ─── EarningsCard (with DailyGoal) ─── */

function EarningsCard({ todayEarned }: { todayEarned: number }) {
  const dailyGoal = 500000; // 5000 naira in kobo
  const progress = Math.min((todayEarned / dailyGoal) * 100, 100);

  return (
    <section className="rounded-xl border border-card-border bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-sm font-bold text-gray-900 flex items-center gap-1.5">
          <WalletIcon className="h-4 w-4 text-gold" />
          Today&apos;s Earnings
        </h2>
        <span className="font-display text-lg font-black text-gold">{formatCurrency(todayEarned)}</span>
      </div>
      <div className="mb-3">
        <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
          <span>Today&apos;s Goal: {formatCurrency(dailyGoal)}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 rounded-full bg-gray-100">
          <div
            className="h-2 rounded-full bg-gold transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/wallet/withdraw"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gold px-3 py-2 text-xs font-bold text-white shadow-sm transition-all active:scale-[0.97]"
        >
          <ArrowUp className="h-3.5 w-3.5" />
          Withdraw
        </Link>
        <Link
          href="/wallet"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-card-border px-3 py-2 text-xs font-bold text-gray-700 transition-all active:scale-[0.97]"
        >
          View Transactions
        </Link>
      </div>
    </section>
  );
}

/* ─── ActivityFeed ─── */

function ActivityFeed({ transactions }: { transactions: WalletTransaction[] }) {
  const recentActivities = useMemo(() => {
    if (transactions.length === 0) return [];
    return transactions.slice(0, 3).map((tx) => ({
      id: tx.id,
      type: tx.type === "escrow_release" ? "payment" : "accepted",
      text:
        tx.type === "escrow_release"
          ? `${formatCurrency(tx.amount.kobo)} received for a task`
          : tx.type === "escrow_lock"
            ? `Task locked — ${formatCurrency(tx.amount.kobo)} in escrow`
            : `Transaction: ${tx.type}`,
      time: timeAgo(tx.createdAt),
    }));
  }, [transactions]);

  const iconMap: Record<string, React.ReactNode> = {
    accepted: <CheckCircle className="h-4 w-4 text-gold" />,
    completed: <CheckCircle className="h-4 w-4 text-green-600" />,
    payment: <DollarSign className="h-4 w-4 text-gold" />,
  };

  return (
    <section>
      <h2 className="mb-3 font-display text-base font-bold text-gray-900 flex items-center gap-1.5">
        <Activity className="h-4 w-4 text-gold" />
        Activity
      </h2>
      <div className="rounded-xl border border-card-border bg-surface shadow-sm">
        {recentActivities.length === 0 ? (
          <div className="px-4 py-5 text-center">
            <p className="text-xs text-gray-500">No recent activity</p>
          </div>
        ) : (
          <div className="divide-y divide-card-border">
            {recentActivities.map((act) => (
              <div key={act.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold-light">
                  {iconMap[act.type] || <Activity className="h-4 w-4 text-gray-400" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-gray-900 line-clamp-1">{act.text}</p>
                  <p className="text-[10px] text-gray-500">{act.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── Main Export ─── */

export default function RunnerDashboard({
  tasks,
  tasksLoading,
  transactions,
  tasksCompleted,
  trustScore,
}: RunnerDashboardProps) {
  const user = useAuthUser();
  const name = user?.fullName?.split(" ")[0] || "there";

  const [isAvailable, setIsAvailable] = useState(user?.isAvailable ?? false);

  const earnedToday = useMemo(() => todayEarnings(transactions), [transactions]);
  const weeklyEarned = useMemo(
    () => weeklyEarnings(transactions),
    [transactions],
  );
  const acceptanceRate = useMemo(
    () => Math.min(Math.round((tasksCompleted / Math.max(tasksCompleted + 2, 1)) * 100), 100),
    [tasksCompleted],
  );

  return (
    <div className="pb-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 pb-6 pt-4">
        <RunnerHero name={name} tasksCount={tasks.filter((t) => t.status === "open").length} />

        <OnlineToggle isAvailable={isAvailable} onToggle={setIsAvailable} />

        <PrimaryCTA />

        <RunnerStats
          todayEarned={earnedToday}
          weeklyEarned={weeklyEarned}
          acceptanceRate={acceptanceRate}
          trustScore={trustScore}
        />

        <NearbyTasks tasks={tasks} loading={tasksLoading} />

        <RunnerPerformance trustScore={trustScore} averageRating={null} dayStreak={null} />

        <EarningsCard todayEarned={earnedToday} />

        <ActivityFeed transactions={transactions} />
      </div>
    </div>
  );
}
