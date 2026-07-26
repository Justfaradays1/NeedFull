// WHAT: Admin dashboard overview — stat cards, pending alerts, quick navigation
// WHY: Central admin landing page for platform moderation and monitoring

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  ClipboardList,
  DollarSign,
  AlertTriangle,
  UserCheck,
  ArrowUpRight,
  Banknote,
  Clock,
  Shield,
  Flag,
  ListChecks,
  WalletCards,
  Loader2,
} from "lucide-react";
import { get } from "@/lib/apiClient";

interface DashboardStats {
  totalUsers: number;
  newUsersToday: number;
  totalTasks: number;
  openTasks: number;
  completedTasks: number;
  totalVolumeKobo: number;
  totalVolumeNaira: number;
  todayVolumeKobo: number;
  todayVolumeNaira: number;
  pendingManualTransfers: number;
  pendingWithdrawals: number;
  pendingVerifications: number;
  openReports: number;
  platformEarningsKobo: number;
  platformEarningsNaira: number;
}

const NAV_ITEMS = [
  {
    href: "/admin/users",
    label: "Users",
    Icon: Users,
    countKey: "totalUsers" as const,
  },
  {
    href: "/admin/deposits",
    label: "Deposits",
    Icon: Banknote,
    countKey: "pendingManualTransfers" as const,
  },
  {
    href: "/admin/withdrawals",
    label: "Withdrawals",
    Icon: Clock,
    countKey: "pendingWithdrawals" as const,
  },
  {
    href: "/admin/reports",
    label: "Reports",
    Icon: Flag,
    countKey: "openReports" as const,
  },
  {
    href: "/admin/verifications",
    label: "Verifications",
    Icon: Shield,
    countKey: "pendingVerifications" as const,
  },
  {
    href: "/admin/tasks",
    label: "Tasks",
    Icon: ClipboardList,
    countKey: "openTasks" as const,
  },
  {
    href: "/admin/transactions",
    label: "Transactions",
    Icon: ListChecks,
    countKey: null,
  },
];

function StatCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-card-border bg-surface p-4 shadow-card transition-shadow duration-200 hover:shadow-lifted active:scale-[0.99]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 md:text-sm">
            {label}
          </p>
          <p className="mt-1 font-display text-2xl font-black text-gray-900 md:text-3xl">
            {value}
          </p>
          {sub && (
            <p className="mt-0.5 text-[11px] text-gray-500 md:text-xs">{sub}</p>
          )}
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${color} md:h-12 md:w-12`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function AlertBadge({
  href,
  count,
  label,
  color,
}: {
  href: string;
  count: number;
  label: string;
  color: string;
}) {
  if (count === 0) return null;
  const colors: Record<string, string> = {
    red: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
    amber: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
    blue: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
  };
  return (
    <Link
      href={href}
      className={`tap-target flex items-center justify-between rounded-xl border p-3 text-sm font-bold transition-colors ${colors[color] || colors.blue}`}
    >
      <span>
        {count} {label}
      </span>
      <ArrowUpRight className="h-4 w-4 shrink-0" />
    </Link>
  );
}

function NavCard({
  href,
  label,
  Icon,
  count,
  badgeColor,
}: {
  href: string;
  label: string;
  Icon: any;
  count?: number;
  badgeColor?: string;
}) {
  const badgeCls = badgeColor || "bg-brand-light text-brand";
  return (
    <Link
      href={href}
      className="tap-target flex flex-col items-center gap-2 rounded-2xl border border-card-border bg-surface p-4 shadow-card transition-shadow duration-200 hover:border-brand/20 active:scale-[0.99]"
    >
      <div className="relative">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-light">
          <Icon className="h-5 w-5 text-brand" />
        </div>
        {count !== undefined && count > 0 && (
          <span
            className={`absolute -right-1.5 -top-1.5 flex min-w-4.5 items-center justify-center rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none ${badgeCls}`}
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </div>
      <span className="text-xs font-semibold text-gray-700 md:text-sm">
        {label}
      </span>
    </Link>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    get<{ success: boolean; data: DashboardStats }>("/admin/stats")
      .then((res) => {
        if (!cancelled && res.success) setStats(res.data);
      })
      .catch((err: any) => {
        if (!cancelled) {
          console.error(
            "[AdminDashboard] Failed to fetch stats:",
            err?.response?.status,
            err?.response?.data || err?.message,
          );
          setError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fetchKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand" />
          <p className="mt-2 text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
        <p className="mt-2 font-bold text-gray-900">Failed to load dashboard</p>
        <p className="mt-1 text-sm text-gray-500">
          Could not fetch admin stats. The backend may be unavailable.
        </p>
        <button
          type="button"
          onClick={() => setFetchKey((k) => k + 1)}
          className="tap-target mt-4 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-mid"
        >
          Retry
        </button>
      </div>
    );
  }

  const s = stats;
  const pendingAttention =
    (s?.pendingManualTransfers ?? 0) +
    (s?.pendingWithdrawals ?? 0) +
    (s?.openReports ?? 0);

  const badgeColor = (count: number): string | undefined => {
    if (count === 0) return undefined;
    if (
      (s?.pendingManualTransfers ?? 0) > 0 &&
      count === s?.pendingManualTransfers
    )
      return "bg-red-100 text-red-600";
    if (count >= 5) return "bg-red-100 text-red-600";
    if (count >= 1) return "bg-amber-100 text-amber-600";
    return undefined;
  };

  return (
    <div className="pb-8">
      <div className="mx-4 space-y-4 mt-4">
        {/* Stat Cards (2×2) */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Total Users"
            value={s?.totalUsers?.toLocaleString() ?? "—"}
            sub={`↑ ${s?.newUsersToday ?? 0} new today`}
            icon={<Users className="h-5 w-5 text-white" />}
            color="bg-brand"
          />
          <StatCard
            label="Open Tasks"
            value={s?.openTasks?.toLocaleString() ?? "—"}
            icon={<ClipboardList className="h-5 w-5 text-white" />}
            color="bg-info"
          />
          <StatCard
            label="Platform Earnings"
            value={
              s?.platformEarningsNaira
                ? `₦${s.platformEarningsNaira.toLocaleString()}`
                : "₦0"
            }
            icon={<DollarSign className="h-5 w-5 text-white" />}
            color="bg-gold-dark"
          />
          <StatCard
            label="Pending Items"
            value={pendingAttention}
            sub="Deposits + Withdrawals + Reports"
            icon={<AlertTriangle className="h-5 w-5 text-white" />}
            color={pendingAttention > 0 ? "bg-danger" : "bg-gray-400"}
          />
        </div>

        {/* Pending Actions Alerts */}
        {(s?.pendingManualTransfers ?? 0) > 0 ||
        (s?.pendingWithdrawals ?? 0) > 0 ||
        (s?.openReports ?? 0) > 0 ||
        (s?.pendingVerifications ?? 0) > 0 ? (
          <div className="space-y-1.5">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500">
              <AlertTriangle className="h-3.5 w-3.5" /> Pending Actions
            </p>
            <AlertBadge
              href="/admin/deposits"
              count={s?.pendingManualTransfers ?? 0}
              label="deposits need review"
              color="red"
            />
            <AlertBadge
              href="/admin/withdrawals"
              count={s?.pendingWithdrawals ?? 0}
              label="withdrawals need processing"
              color="amber"
            />
            <AlertBadge
              href="/admin/reports"
              count={s?.openReports ?? 0}
              label="open reports"
              color="red"
            />
            <AlertBadge
              href="/admin/verifications"
              count={s?.pendingVerifications ?? 0}
              label="pending verifications"
              color="blue"
            />
          </div>
        ) : null}

        {/* Quick Nav Grid */}
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
            Quick Navigation
          </p>
          <div className="grid grid-cols-4 gap-3">
            {NAV_ITEMS.map(({ href, label, Icon, countKey }) => {
              const count = countKey && s ? s[countKey] : undefined;
              const bc =
                count !== undefined && count > 0
                  ? countKey === "pendingManualTransfers" ||
                    countKey === "openReports"
                    ? "bg-red-100 text-red-600"
                    : countKey === "pendingWithdrawals"
                      ? "bg-amber-100 text-amber-600"
                      : "bg-brand-light text-brand"
                  : undefined;
              return (
                <NavCard
                  key={href}
                  href={href}
                  label={label}
                  Icon={Icon}
                  count={count}
                  badgeColor={bc}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
