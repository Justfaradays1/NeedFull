"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
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
  RefreshCw,
  Plus,
  Wifi,
  ShieldCheck,
} from "lucide-react";
import { useAuthUser, useAuthStore } from "@/store";
import { get, patch } from "@/lib/apiClient";
import { formatCurrency } from "@/lib/format";
import { useGreeting } from "@/hooks/useGreeting";
import { Avatar } from "@/components/ui/avatar";
import { StartEarningModal } from "@/components/runner/StartEarningModal";

/* ─── Types ─── */

interface TaskItem {
  id: string;
  title: string;
  budget: { kobo: number; naira: number };
  status: string;
  isUrgent: boolean;
  createdAt: string;
  applicationCount: number;
  distance?: number | null;
  category: { id: string; name: string; icon: string } | null;
  poster: { id: string; fullName: string; trustScore?: number; avatarUrl?: string | null };
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
  refresh?: () => Promise<void>;
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

const EARNINGS_FILTER_TYPES = new Set([
  "escrow_release",
  "earnings",
  "purchase_escrow_release",
  "purchase_runner_fee",
  "purchase_item_reimbursement",
  "withdrawal_failed_refund",
]);

const WITHDRAWAL_TYPES = new Set(["withdrawal_requested", "earnings_withdrawal"]);

function filterEarnings(transactions: WalletTransaction[], since: Date): number {
  return transactions
    .filter((tx) => {
      const d = new Date(tx.createdAt);
      return d >= since && EARNINGS_FILTER_TYPES.has(tx.type);
    })
    .reduce((sum, tx) => sum + tx.amount.kobo, 0);
}

function availableEarnings(transactions: WalletTransaction[]): number {
  let sum = 0;
  for (const tx of transactions) {
    if (EARNINGS_FILTER_TYPES.has(tx.type)) sum += tx.amount.kobo;
    else if (WITHDRAWAL_TYPES.has(tx.type)) sum -= Math.abs(tx.amount.kobo);
  }
  return sum;
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
  const greeting = useGreeting();
  const hasTasks = tasksCount > 0;
  return (
    <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-amber-600 to-amber-700 p-5 text-white shadow-lg">
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/5" />
      <div className="relative z-10 space-y-1">
        <h1 className="font-display text-xl font-bold leading-tight sm:text-2xl">
          {hasTasks
            ? `${greeting.text} ${greeting.emoji}, ${name} 👋\n${tasksCount} tasks are waiting near you`
            : "Ready to earn today? 💼"}
        </h1>
      </div>
    </div>
  );
}

/* ─── Online Toggle ─── */

function OnlineToggle({
  isAvailable,
  isBusy,
  onToggle,
}: {
  isAvailable: boolean;
  isBusy: boolean;
  onToggle: (v: boolean) => void;
}) {
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

  const label = isBusy
    ? "Working on a task"
    : toggling
      ? "Updating..."
      : isAvailable
        ? "You are Online"
        : "Go Online";

  return (
    <label
      className={`tap-target flex w-full cursor-pointer items-center justify-between rounded-xl border-2 px-4 py-3 transition-all active:scale-[0.98] ${
        isBusy
          ? "border-gold bg-gold-light/60"
          : isAvailable
            ? "border-green-300 bg-green-50"
            : "border-gray-200 bg-surface hover:border-gray-300"
      }`}
    >
      <span
        className={`flex items-center gap-2 text-sm font-bold ${
          isBusy ? "text-gold-dark" : isAvailable ? "text-green-800" : "text-gray-500"
        }`}
      >
        {isBusy && (
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
          </span>
        )}
        {label}
      </span>
      <input
        type="checkbox"
        className="sr-only peer"
        checked={isAvailable}
        onChange={handleClick}
        disabled={toggling || isBusy}
      />
      <div
        className={`relative h-6 w-11 rounded-full transition-colors peer-checked:bg-green-500 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand/20 ${
          isBusy ? "bg-gold" : "bg-gray-300"
        }`}
      >
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

function PrimaryCTA({
  isAvailable,
  isBusy,
  onStart,
}: {
  isAvailable: boolean;
  isBusy: boolean;
  onStart: () => void;
}) {
  if (isBusy) {
    return (
      <Link
        href="/tasks"
        className="tap-target flex items-center justify-center gap-2.5 rounded-xl bg-brand px-4 py-3.5 text-base font-bold text-white shadow-md transition-all hover:brightness-105 active:scale-[0.97]"
      >
        <Briefcase className="h-5 w-5" />
        View My Task
      </Link>
    );
  }
  if (isAvailable) {
    return (
      <Link
        href="/hustle"
        className="tap-target flex items-center justify-center gap-2.5 rounded-xl bg-gold px-4 py-3.5 text-base font-bold text-white shadow-md shadow-gold/25 transition-all hover:brightness-105 hover:shadow-lg active:scale-[0.97]"
      >
        <Navigation className="h-5 w-5" />
        Find Tasks
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={onStart}
      className="tap-target flex w-full items-center justify-center gap-2.5 rounded-xl bg-gold px-4 py-3.5 text-base font-bold text-white shadow-md shadow-gold/25 transition-all hover:brightness-105 hover:shadow-lg active:scale-[0.97]"
    >
      <Zap className="h-5 w-5" />
      Start Earning
    </button>
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

function NearbyTasks({
  tasks,
  loading,
  refresh,
}: {
  tasks: TaskItem[];
  loading: boolean;
  refresh?: () => Promise<void>;
}) {
  const openTasks = tasks.filter((t) => t.status === "open").slice(0, 3);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!refresh || refreshing) return;
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-base font-bold text-gray-900 flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-gold" />
          Available Tasks
        </h2>
        <Link
          href="/hustle"
          className="flex items-center gap-0.5 text-[11px] font-bold text-gold"
        >
          View All Tasks <ChevronRight className="h-3 w-3" />
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
        <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center">
          <Briefcase className="mx-auto h-7 w-7 text-gray-300" />
          <p className="mt-2 text-sm font-bold text-gray-900">No tasks near you right now</p>
          <p className="mx-auto mt-1 max-w-[16rem] text-xs leading-relaxed text-gray-500">
            New tasks drop all day. Refresh to catch the latest, or post one you can nail yourself.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all active:scale-[0.97] disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
            <Link
              href="/hustle/available"
              className="inline-flex items-center gap-1.5 rounded-lg border border-card-border px-3.5 py-2 text-xs font-bold text-gray-700 transition-all active:scale-[0.97]"
            >
              <Plus className="h-3.5 w-3.5" />
              Offer Your Services
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {openTasks.map((task) => {
            const distance = task.distance
              ? task.distance < 1000
                ? `${Math.round(task.distance)}m away`
                : `${(task.distance / 1000).toFixed(1)}km away`
              : null;
            return (
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
                      {distance ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {distance}
                        </span>
                      ) : null}
                      <span>{timeAgo(task.createdAt)}</span>
                      {typeof task.poster?.trustScore === "number" && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-400">
                          <Star className="h-3 w-3 fill-gold text-gold" />
                          {task.poster.trustScore}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                      {task.poster?.avatarUrl ? (
                        <img
                          src={task.poster.avatarUrl}
                          alt=""
                          className="h-4 w-4 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand/10 text-[8px] font-bold text-brand-text">
                          {task.poster?.fullName?.charAt(0).toUpperCase() || "?"}
                        </span>
                      )}
                      <span className="truncate text-[10px] font-semibold text-gray-600">
                        {task.poster?.fullName}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="font-display text-base font-black text-gold">
                      {formatCurrency(task.budget.kobo)}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-gold px-3 py-1 text-[11px] font-bold text-white">
                      View Details
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ─── AvailabilityCard ─── */

interface OfferItem {
  id: string;
  category: { id: string; name: string; icon: string };
  note: string;
  availableUntil: string | null;
  maxTravelKm: number;
  isOnlineToday: boolean;
}

// WHAT: The Runner's core signal — "I am available to work"
// WHY: Replaces the poster-style "post a task" thinking with an availability
//      story: what the runner offers, where, and for how long.
function AvailabilityCard() {
  const [offers, setOffers] = useState<OfferItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [endingId, setEndingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await get<{ success: boolean; data: OfferItem[] }>(
        "/availability/mine",
      );
      setOffers(res.success ? res.data : []);
    } catch {
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const endOffer = async (id: string) => {
    setEndingId(id);
    try {
      await patch<{ success: boolean }>(`/availability/${id}/deactivate`);
      setOffers((prev) => (prev ? prev.filter((o) => o.id !== id) : prev));
    } catch {
      /* silent */
    } finally {
      setEndingId(null);
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-card-border bg-surface shadow-sm">
      <div className="bg-linear-to-r from-brand to-brand-text/70 px-4 py-3 text-white">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-1.5 font-display text-sm font-bold">
              <Wifi className="h-4 w-4" />
              {offers && offers.length > 0 ? "You're Offering" : "Your Availability"}
            </h2>
            <p className="mt-0.5 text-[11px] text-white/80">
              {offers && offers.length > 0
                ? "Nearby posters can find and invite you"
                : "Tell posters what you can help with today"}
            </p>
          </div>
          <Link
            href="/hustle/available"
            className="shrink-0 rounded-lg bg-white/15 px-3 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-white/25"
          >
            Manage
          </Link>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-12 skeleton rounded-xl" />
            <div className="h-12 skeleton rounded-xl" />
          </div>
        ) : offers && offers.length > 0 ? (
          <div className="space-y-2">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="flex items-center gap-3 rounded-xl border border-card-border bg-gray-50 p-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold-light text-base">
                  {offer.category?.icon || "✨"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 text-sm font-bold text-gray-900">
                    Available for {offer.category?.name || "Help"}
                    {offer.isOnlineToday && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-bold text-green-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        ONLINE TODAY
                      </span>
                    )}
                  </p>
                  <p className="truncate text-[11px] text-gray-500">
                    {offer.note ||
                      `Up to ${offer.maxTravelKm}km ${
                        offer.availableUntil
                          ? `· until ${new Date(offer.availableUntil).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}`
                          : "· no end date"
                      }`}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={endingId === offer.id}
                  onClick={() => endOffer(offer.id)}
                  className="shrink-0 rounded-lg border border-card-border px-3 py-1.5 text-[11px] font-bold text-gray-600 transition-all active:scale-[0.97] disabled:opacity-50"
                >
                  {endingId === offer.id ? "Ending…" : "End"}
                </button>
              </div>
            ))}
            <Link
              href="/hustle/available"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-gold/40 px-3 py-2.5 text-xs font-bold text-gold transition-colors hover:bg-gold-light/40"
            >
              <Plus className="h-3.5 w-3.5" />
              Offer another service
            </Link>
          </div>
        ) : (
          <div>
            <Link
              href="/hustle/available"
              className="tap-target flex items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3.5 text-base font-bold text-white shadow-md shadow-gold/25 transition-all hover:brightness-105 active:scale-[0.97]"
            >
              <Plus className="h-5 w-5" />
              Offer Your Services
            </Link>
            <p className="mt-2.5 flex items-start gap-1.5 text-[11px] leading-relaxed text-gray-500">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-text" />
              Posting tasks is for posters. You show what you can do — they send
              the work your way. Escrow still protects your payment.
            </p>
          </div>
        )}
      </div>
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

function EarningsCard({
  availableEarnings,
  todayEarned,
}: {
  availableEarnings: number;
  todayEarned: number;
}) {
  const dailyGoal = 500000; // 5000 naira in kobo
  const progress = Math.min((todayEarned / dailyGoal) * 100, 100);

  return (
    <section className="rounded-xl border border-card-border bg-surface p-4 shadow-sm">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-display text-sm font-bold text-gray-900 flex items-center gap-1.5">
          <WalletIcon className="h-4 w-4 text-gold" />
          Your Earnings
        </h2>
        <span className="text-[11px] font-medium text-gray-500">Available Earnings</span>
      </div>
      <p className="font-display text-2xl font-black text-gold">
        {formatCurrency(availableEarnings)}
      </p>
      <p className="mt-0.5 text-xs text-gray-500">
        Today: <span className="font-bold text-gray-700">{formatCurrency(todayEarned)}</span>
      </p>
      <div className="mt-3 mb-3">
        <div className="mb-1 flex items-center justify-between text-[11px] text-gray-500">
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
  refresh,
}: RunnerDashboardProps) {
  const user = useAuthUser();
  const name = user?.fullName?.split(" ")[0] || "there";

  const [isAvailable, setIsAvailable] = useState(user?.isAvailable ?? false);
  const [startFlowOpen, setStartFlowOpen] = useState(false);
  const isBusy = user?.runnerBusy ?? false;

  const earnedToday = useMemo(() => todayEarnings(transactions), [transactions]);
  const weeklyEarned = useMemo(
    () => weeklyEarnings(transactions),
    [transactions],
  );
  const availableEarned = useMemo(
    () => availableEarnings(transactions),
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

        <OnlineToggle isAvailable={isAvailable} isBusy={isBusy} onToggle={setIsAvailable} />

        <PrimaryCTA isAvailable={isAvailable} isBusy={isBusy} onStart={() => setStartFlowOpen(true)} />

        <StartEarningModal
          open={startFlowOpen}
          onClose={() => setStartFlowOpen(false)}
          tasks={tasks}
          onGoLive={() => setIsAvailable(true)}
        />

        <AvailabilityCard />

        <RunnerStats
          todayEarned={earnedToday}
          weeklyEarned={weeklyEarned}
          acceptanceRate={acceptanceRate}
          trustScore={trustScore}
        />

        <NearbyTasks tasks={tasks} loading={tasksLoading} refresh={refresh} />

        <RunnerPerformance trustScore={trustScore} averageRating={null} dayStreak={null} />

        <EarningsCard availableEarnings={availableEarned} todayEarned={earnedToday} />

        <ActivityFeed transactions={transactions} />
      </div>
    </div>
  );
}
