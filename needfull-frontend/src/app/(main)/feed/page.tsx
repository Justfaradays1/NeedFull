"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  MessageCircle,
  Briefcase,
  User,
  Star,
  Award,
  TrendingUp,
  DollarSign,
  CheckCircle,
  ChevronRight,
  LogOut,
  Settings,
  Wallet as WalletIcon,
  Shield,
  BookOpen,
  PenTool,
  Palette,
  Code,
  Truck,
  ArrowRight,
  ArrowUp,
  ArrowDownLeft,
  ArrowUpRight,
  Clock3,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";
import { useAuthUser, useAuthStore, useActiveRole } from "@/store";
import { get } from "@/lib/apiClient";
import { formatCurrency } from "@/lib/format";
import { BecomeRunnerBanner } from "@/components/home/BecomeRunnerBanner";
import { Callout } from "@/components/ui/callout";
import { Avatar } from "@/components/ui/avatar";
import { Dropdown } from "@/components/ui/dropdown";
import RunnerDashboard from "@/components/runner/RunnerDashboard";

/* ─── Types ─── */

interface TaskItem {
  id: string;
  title: string;
  budget: { kobo: number; naira: number };
  status: string;
  role?: string;
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

type HeroType =
  | "urgent"
  | "active"
  | "action_needed"
  | "nudge"
  | "info"
  | "default";

interface HeroCta {
  label: string;
  href: string;
}

interface HeroState {
  type: HeroType;
  headline: string;
  subline: string;
  cta: HeroCta | null;
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

function getHeroState(
  user: {
    firstName: string;
    hasOpenDispute: boolean;
    isVerifiedStudent: boolean;
    totalTasksCompleted: number;
  },
  wallet: { balance: number },
  tasks: TaskItem[],
): HeroState {
  const hour = new Date().getHours();
  const currentGreeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (user.hasOpenDispute) {
    return {
      type: "urgent",
      headline: `${currentGreeting}, ${user.firstName} ⚠️`,
      subline: "You have an open dispute. An admin is reviewing it.",
      cta: { label: "View dispute", href: "/disputes" },
    };
  }

  if (tasks.some((t) => t.status === "in_progress" && t.role === "runner")) {
    return {
      type: "active",
      headline: `${currentGreeting}, ${user.firstName} ⚡`,
      subline:
        "You have an active task in progress. Complete it to release payment.",
      cta: { label: "View task", href: "/tasks/active" },
    };
  }

  const awaitingConfirm = tasks.filter(
    (t) => t.status === "in_progress" && t.role === "poster",
  );
  if (awaitingConfirm.length) {
    return {
      type: "action_needed",
      headline: `${currentGreeting}, ${user.firstName} 👋`,
      subline: `${awaitingConfirm.length} task${awaitingConfirm.length > 1 ? "s" : ""} waiting for your confirmation.`,
      cta: { label: "Review & confirm", href: "/tasks/mine" },
    };
  }

  if (!user.isVerifiedStudent) {
    return {
      type: "nudge",
      headline: `${currentGreeting}, ${user.firstName} 👋`,
      subline:
        "Verify your student ID to unlock runner earnings and higher trust score.",
      cta: { label: "Verify now — takes 2 min", href: "/profile/verify" },
    };
  }

  if (wallet.balance < 10000 && user.totalTasksCompleted > 0) {
    return {
      type: "info",
      headline: `${currentGreeting}, ${user.firstName} 👋`,
      subline:
        "Your wallet is nearly empty. Fund it to start posting tasks again.",
      cta: { label: "Fund wallet", href: "/wallet/fund" },
    };
  }

  return {
    type: "default",
    headline: `${currentGreeting}, ${user.firstName} 👋`,
    subline: `You have ${tasks.filter((t) => t.status === "open").length} open tasks and ${formatCurrency(wallet.balance)} available.`,
    cta: null,
  };
}

/* ─── Skeletons ─── */

function TaskSkeleton() {
  return (
    <div className="w-50 shrink-0 animate-pulse space-y-2.5 rounded-xl bg-surface p-3 shadow-sm">
      <div className="h-2.5 w-14 rounded bg-gray-100" />
      <div className="h-4 w-full rounded bg-gray-100" />
      <div className="h-3 w-3/4 rounded bg-gray-100" />
      <div className="flex gap-2">
        <div className="h-2.5 w-12 rounded bg-gray-100" />
        <div className="h-2.5 w-16 rounded bg-gray-100" />
      </div>
    </div>
  );
}

/* ─── Profile Dropdown ─── */

function ProfileDropdown({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthUser();
  const logout = useAuthStore((s) => s.logout);

  const items = [
    {
      key: "header",
      render: () => (
        <div className="flex items-center gap-3 border-b border-card-border px-4 py-3">
          <Avatar
            src={user?.profilePictureUrl}
            name={user?.fullName}
            email={user?.email}
            size="lg"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-gray-900">
              {user?.fullName}
            </p>
            <p className="truncate text-[11px] text-gray-500">{user?.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "profile",
      label: "Profile",
      icon: <User size={16} />,
      onClick: () => router.push("/profile"),
    },
    {
      key: "wallet",
      label: "Wallet",
      icon: <WalletIcon size={16} />,
      onClick: () => router.push("/wallet"),
    },
    {
      key: "settings",
      label: "Settings",
      icon: <Settings size={16} />,
      onClick: () => router.push("/settings"),
    },
    {
      key: "divider",
      render: () => <div className="border-t border-card-border" />,
    },
    {
      key: "logout",
      label: "Log Out",
      icon: <LogOut size={16} />,
      variant: "danger" as const,
      onClick: () => {
        logout();
        router.push("/login");
      },
    },
  ];

  return <Dropdown items={items}>{children}</Dropdown>;
}

/* ─── Task Card (solid — no glass on dense content) ─── */

function TaskCard({ task }: { task: TaskItem }) {
  return (
    <Link
      href={`/feed/${task.id}`}
      className="tap-target block w-50 shrink-0 rounded-xl border border-card-border glass-card p-3 transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
    >
      <div className="mb-1.5 flex items-center gap-1.5">
        {task.isUrgent && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-700">
            URGENT
          </span>
        )}
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-medium text-gray-700">
          {task.category?.name || "General"}
        </span>
      </div>
      <p className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug">
        {task.title}
      </p>
      <div className="mt-2 flex items-center gap-1.5 text-xs">
        <DollarSign className="h-3 w-3 text-brand" />
        <span className="font-bold text-gray-900">
          ₦{task.budget.naira.toLocaleString()}
        </span>
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[10px] text-gray-500">
        <span>{timeAgo(task.createdAt)}</span>
        <span>
          {task.applicationCount} applicant
          {task.applicationCount !== 1 ? "s" : ""}
        </span>
      </div>
    </Link>
  );
}

/* ─── Popular Category Card ─── */

const POPULAR_CATEGORIES = [
  {
    id: "assignment",
    name: "Assignment Help",
    icon: BookOpen,
    desc: "Research, writing, editing",
  },
  {
    id: "delivery",
    name: "Delivery",
    icon: Truck,
    desc: "Food, packages, documents",
  },
  {
    id: "design",
    name: "Graphic Design",
    icon: Palette,
    desc: "Flyers, logos, banners",
  },
  {
    id: "tutoring",
    name: "Tutoring",
    icon: PenTool,
    desc: "One-on-one academic help",
  },
  {
    id: "tech",
    name: "Tech Support",
    icon: Code,
    desc: "IT, software, hardware",
  },
];

function PopularCategoryCard({
  cat,
}: {
  cat: (typeof POPULAR_CATEGORIES)[number];
}) {
  const Icon = cat.icon;
  return (
    <button
      type="button"
      className="tap-target flex flex-col items-center gap-1.5 rounded-xl border border-card-border bg-surface px-3 py-3 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-lifted active:scale-[0.97]"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-light">
        <Icon className="h-4 w-4 text-brand" />
      </div>
      <span className="text-[11px] font-bold text-gray-900 text-center leading-tight">
        {cat.name}
      </span>
      <span className="text-[9px] text-gray-600 text-center leading-tight">
        {cat.desc}
      </span>
    </button>
  );
}

/* ─── Wallet Hero Card ─── */

function WalletHeroCard({
  balance,
  escrow,
  greeting,
  emailVerified,
}: {
  balance: number;
  escrow: number;
  greeting: string;
  emailVerified: boolean;
}) {
  const [balanceHidden, setBalanceHidden] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-[#0D422C] to-[#1A6B4A] p-5 text-white shadow-lg">
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute bottom-10 right-20 h-16 w-16 rounded-full bg-white/[0.03]" />

      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-xl font-bold leading-tight sm:text-2xl">
            {greeting}
          </h1>
          {emailVerified ? (
            <span className="shrink-0 rounded-full bg-green-400/20 px-2 py-0.5 text-[10px] font-bold text-green-300 ring-1 ring-green-400/30">
              Verified
            </span>
          ) : (
            <Link href="/verify-email" className="shrink-0 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 ring-1 ring-amber-400/30 hover:bg-amber-400/30 transition-colors">
              Unverified
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          <p className="text-[11px] font-medium text-white/60">Available Balance</p>
          <button
            onClick={() => setBalanceHidden((h) => !h)}
            className="flex h-7 w-7 items-center justify-center rounded-full"
            style={{ background: "rgba(255,255,255,0.15)" }}
            aria-label={balanceHidden ? "Show balance" : "Hide balance"}
          >
            {balanceHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        </div>
        <p className="-mt-2 text-3xl font-black tracking-tight">
          {balanceHidden ? "••••••" : formatCurrency(balance)}
        </p>

        {escrow > 0 && (
          <div className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 w-fit">
            <Lock className="h-3 w-3 text-white/70" />
            <p className="text-xs text-white/80">
              {formatCurrency(escrow)} in escrow
            </p>
          </div>
        )}

        <div className="mt-1 flex items-center gap-2">
          <Link
            href="/wallet/fund"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-bold text-[#1A6B4A] shadow-sm transition-all hover:brightness-95 active:scale-[0.97]"
          >
            <Plus className="h-3.5 w-3.5" />
            Fund
          </Link>
          <Link
            href="/wallet"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3.5 py-2 text-xs font-bold text-white transition-all hover:bg-white/25 active:scale-[0.97]"
          >
            <ArrowUp className="h-3.5 w-3.5" />
            Withdraw
          </Link>
          <Link
            href="/wallet"
            className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-white/70 hover:text-white"
          >
            <span className="truncate max-[399px]:max-w-[80px]">Transaction History</span>
            <ChevronRight className="h-3 w-3 shrink-0" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Stat Cards ─── */

function StatCards({
  tasksPosted,
  tasksCompleted,
  trustScore,
}: {
  tasksPosted: number;
  tasksCompleted: number;
  trustScore: number;
}) {
  const stats = [
    { label: "Posted", value: tasksPosted, color: "#1A6B4A" },
    { label: "Completed", value: tasksCompleted, color: "#2563EB" },
    { label: "Trust", value: `${trustScore}/100`, color: "#EAA325" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-[var(--stat-card-border)] bg-[var(--stat-card-bg)] px-3 py-3 text-center shadow-sm"
        >
          <p
            className="text-xl font-black"
            style={{ color: stat.color }}
          >
            {stat.value}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-[var(--text-muted)]">
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ─── Recent Transactions ─── */

function RecentTransactions({
  transactions,
}: {
  transactions: WalletTransaction[];
}) {
  const typeConfig: Record<
    string,
    { label: string; sign: string; color: string }
  > = {
    manual_deposit_confirmed: { label: "Deposit", sign: "+", color: "#16A34A" },
    virtual_deposit: { label: "Deposit", sign: "+", color: "#16A34A" },
    card_deposit: { label: "Card deposit", sign: "+", color: "#16A34A" },
    escrow_release: { label: "Task payment", sign: "+", color: "#16A34A" },
    escrow_lock: { label: "Task locked", sign: "", color: "#EAA325" },
    escrow_refund: { label: "Refunded", sign: "+", color: "#16A34A" },
    withdrawal_requested: { label: "Withdrawal", sign: "-", color: "#E74C3C" },
    platform_fee: { label: "Platform fee", sign: "-", color: "#6B7280" },
  };

  if (!transactions?.length) {
    return (
      <div className="rounded-2xl border border-card-border bg-surface p-4 shadow-card">
        <h3 className="mb-3 text-sm font-bold text-gray-900">
          Recent Transactions
        </h3>
        <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center">
          <WalletIcon className="mx-auto h-6 w-6 text-gray-300" />
          <p className="mt-1.5 text-sm font-bold text-gray-900">
            No transactions yet
          </p>
          <p className="text-xs text-gray-500">
            Fund your wallet to start posting tasks
          </p>
          <Link
            href="/wallet/fund"
            className="mt-2 inline-flex items-center gap-1 rounded-lg bg-gold px-3.5 py-1.5 text-xs font-bold text-white shadow-sm"
          >
            Fund wallet <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-card-border bg-surface p-4 shadow-card">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">
          Recent Transactions
        </h3>
        <Link
          href="/wallet"
          className="flex items-center gap-0.5 text-[11px] font-bold text-brand"
        >
          See all <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="space-y-1">
        {transactions.slice(0, 4).map((tx, i) => {
          const cfg =
            typeConfig[tx.type] ?? {
              label: tx.type,
              sign: "",
              color: "#6B7280",
            };
          return (
            <div
              key={tx.id ?? i}
              className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-gray-50"
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background:
                    cfg.sign === "+"
                      ? "rgba(22,163,74,0.12)"
                      : cfg.sign === "-"
                        ? "rgba(231,76,60,0.12)"
                        : "rgba(234,163,37,0.12)",
                }}
              >
                {cfg.sign === "+" && <ArrowDownLeft className="h-4 w-4 text-green-600" />}
                {cfg.sign === "-" && <ArrowUpRight className="h-4 w-4 text-red-500" />}
                {cfg.sign === "" && <Lock className="h-4 w-4 text-amber-500" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  {cfg.label}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(tx.createdAt).toLocaleDateString("en-NG", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <p
                className="text-sm font-bold shrink-0"
                style={{ color: cfg.color }}
              >
                {cfg.sign}
                {formatCurrency(tx.amount.kobo)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Open Opportunities ─── */

function OpenOpportunities({ tasks }: { tasks: TaskItem[] }) {
  const openTasks = tasks.filter((t) => t.status === "open").slice(0, 2);

  return (
    <div className="rounded-2xl border border-card-border bg-surface p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
            <TrendingUp className="h-4 w-4 text-brand" />
            Open Opportunities
          </h3>
          <p className="mt-0.5 text-xs text-gray-600">
            Fresh tasks that are ready for action.
          </p>
        </div>
        <Link
          href="/tasks"
          className="flex items-center gap-0.5 text-[11px] font-bold text-brand"
        >
          View all <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {openTasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center">
          <Briefcase className="mx-auto h-6 w-6 text-gray-300" />
          <p className="mt-1.5 text-sm font-bold text-gray-900">
            No tasks posted yet
          </p>
          <p className="text-xs text-gray-500">
            Be the first to post a task on campus.
          </p>
          <Link
            href="/tasks/create"
            className="mt-2 inline-flex items-center gap-1 rounded-lg bg-gold px-4 py-2 text-xs font-bold text-white shadow-md"
          >
            + Post a Task
          </Link>
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {openTasks.map((task) => (
            <Link
              key={task.id}
              href={`/feed/${task.id}`}
              className="tap-target block w-50 shrink-0 rounded-xl border border-card-border p-3 transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
            >
              <div className="mb-1.5 flex items-center gap-1.5">
                {task.isUrgent && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-700">
                    URGENT
                  </span>
                )}
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-medium text-gray-700">
                  {task.category?.name || "General"}
                </span>
              </div>
              <p className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug">
                {task.title}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900">
                  ₦{task.budget.naira.toLocaleString()}
                </span>
              </div>
              <p className="mt-1 text-[10px] text-gray-500">
                {task.createdAt
                  ? new Date(task.createdAt).toLocaleDateString("en-NG", {
                      month: "short",
                      day: "numeric",
                    })
                  : "Flexible"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ─── */

export default function FeedPage() {
  const router = useRouter();
  const user = useAuthUser();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [postedCount, setPostedCount] = useState<number | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

  const balanceKobo = user?.wallet?.balanceKobo ?? 0;
  const escrowKobo = user?.wallet?.escrowKobo ?? 0;
  const trustScore = user?.trustScore ?? 0;
  const activeRoleFromHook = useActiveRole();
  const activeRole = (activeRoleFromHook || user?.activeRole) === "runner" ? "runner" : "poster";
  const firstName = user?.fullName?.split(" ")[0] || "there";
  const tasksPosted = (user as any)?.totalTasksPosted ?? postedCount ?? 0;
  const tasksCompleted = (user as any)?.totalTasksCompleted ?? 0;

  const heroState = getHeroState(
    {
      firstName,
      hasOpenDispute: false,
      isVerifiedStudent: Boolean((user as any)?.isVerifiedStudent ?? false),
      totalTasksCompleted: Number((user as any)?.totalTasksCompleted ?? 0),
    },
    { balance: balanceKobo },
    tasks,
  );

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchAll = async () => {
      try {
        const [tasksRes, postedRes, convRes, txRes] = await Promise.all([
          get<{ success: boolean; data: TaskItem[] }>(
            "/tasks?sortBy=newest&status=open&perPage=6",
          ),
          get<{ success: boolean; data: TaskItem[] }>("/tasks/me/posted").catch(
            () => null,
          ),
          get<{ success: boolean; data: { unreadCount: number }[] }>(
            "/chat/conversations",
          ).catch(() => null),
          get<{ success: boolean; data: WalletTransaction[] }>(
            "/wallet/transactions?perPage=5",
          ).catch(() => null),
        ]);
        if (tasksRes?.success) setTasks(tasksRes.data);
        if (postedRes?.success) setPostedCount(postedRes.data.length);
        if (convRes?.success) {
          setUnreadCount(
            (convRes.data as any).reduce?.(
              (s: number, c: any) => s + (c.unreadCount || 0),
              0,
            ) ?? 0,
          );
        }
        if (txRes?.success) setTransactions(txRes.data);
      } catch {
        /* silent */
      } finally {
        setTasksLoading(false);
      }
    };
    fetchAll();
  }, [isAuthenticated]);

  if (activeRole === "runner") {
    return (
      <RunnerDashboard
        tasks={tasks}
        tasksLoading={tasksLoading}
        transactions={transactions}
        tasksCompleted={tasksCompleted}
        trustScore={trustScore}
      />
    );
  }

  return (
    <div className="pb-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 pb-6 pt-4">
        {/* Section 1 — Wallet Hero Card */}
        <WalletHeroCard
          balance={balanceKobo}
          escrow={escrowKobo}
          greeting={heroState.headline}
          emailVerified={Boolean((user as any)?.emailVerified)}
        />

        {/* Section 2 — Stat Cards */}
        <StatCards
          tasksPosted={tasksPosted}
          tasksCompleted={tasksCompleted}
          trustScore={trustScore}
        />

        {/* Section 3 — Contextual actions (2 buttons only) */}
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/tasks/create"
            className="flex items-center justify-center gap-2 rounded-xl border border-card-border bg-surface px-4 py-3 text-sm font-bold text-gray-900 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-md active:scale-[0.97]"
          >
            <Plus className="h-4 w-4 text-brand" />
            Post Task
          </Link>
          <Link
            href="/tasks"
            className="flex items-center justify-center gap-2 rounded-xl border border-card-border bg-surface px-4 py-3 text-sm font-bold text-gray-900 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-md active:scale-[0.97]"
          >
            <Briefcase className="h-4 w-4 text-brand" />
            Browse Tasks
          </Link>
        </div>

        {/* Section 4 — Recent Transactions */}
        <RecentTransactions transactions={transactions} />

        {/* Section 5 — Open Opportunities */}
        <OpenOpportunities tasks={tasks} />

        {/* Popular categories */}
        <section>
          <div className="mb-2 flex items-center gap-1 text-sm font-bold text-gray-900">
            <Star className="h-4 w-4 text-gold" />
            Popular categories
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {POPULAR_CATEGORIES.map((cat) => (
              <PopularCategoryCard key={cat.id} cat={cat} />
            ))}
          </div>
        </section>

        <BecomeRunnerBanner />

        <Callout variant="tip">
          Complete your profile with a bio and photo to build trust and get more
          task opportunities.
        </Callout>
      </div>
    </div>
  );
}
