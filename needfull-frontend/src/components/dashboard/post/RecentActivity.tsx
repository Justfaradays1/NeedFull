"use client";

import Link from "next/link";
import {
  Clock,
  ChevronRight,
  CheckCircle,
  Plus,
  DollarSign,
  MessageCircle,
  Star,
  UserPlus,
} from "lucide-react";

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  createdAt: string;
}

interface RecentActivityProps {
  activities: Activity[];
  loading: boolean;
  /** Cap how many items render (Home = 3; right panel reuse) */
  limit?: number;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}

const typeConfig: Record<string, { icon: typeof Clock; bg: string; color: string }> = {
  task_completed: { icon: CheckCircle, bg: "bg-green-50", color: "#16A34A" },
  task_posted: { icon: Plus, bg: "bg-blue-50", color: "#2563EB" },
  escrow_release: { icon: DollarSign, bg: "bg-emerald-50", color: "#1A6B4A" },
  wallet_funded: { icon: DollarSign, bg: "bg-emerald-50", color: "#1A6B4A" },
  review_received: { icon: Star, bg: "bg-amber-50", color: "#EAA325" },
  runner_hired: { icon: UserPlus, bg: "bg-purple-50", color: "#7C3AED" },
  message_received: { icon: MessageCircle, bg: "bg-blue-50", color: "#2563EB" },
};

// WHAT: Compact Recent Activity — a clean list, NOT a big card. At most
//       `limit` items; "View all" leads to the full transaction history.
export function RecentActivity({
  activities,
  loading,
  limit = 3,
}: RecentActivityProps) {
  if (loading) {
    return (
      <section aria-label="Recent activity">
        <div className="mb-2 h-5 w-28 animate-pulse rounded bg-gray-100" />
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex animate-pulse items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gray-100" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-32 rounded bg-gray-100" />
                <div className="h-2.5 w-20 rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (activities.length === 0) return null;

  return (
    <section aria-label="Recent activity">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">
          Recent Activity
        </h2>
        <Link
          href="/wallet"
          className="flex shrink-0 items-center gap-0.5 text-[11px] font-bold text-brand-text"
        >
          View all <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="mt-1.5 divide-y divide-card-border">
        {activities.slice(0, limit).map((activity) => {
          const cfg = typeConfig[activity.type] ?? { icon: Clock, bg: "bg-gray-50", color: "#6B7280" };
          const Icon = cfg.icon;
          return (
            <div key={activity.id} className="flex items-center gap-3 py-2.5">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cfg.bg}`}
              >
                <Icon className="h-4 w-4" style={{ color: cfg.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                  {activity.title}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {activity.description}
                </p>
              </div>
              <span className="shrink-0 text-[11px] text-gray-400">
                {timeAgo(activity.createdAt)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}