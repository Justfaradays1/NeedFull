"use client";

import {
  Briefcase,
  CheckCircle,
  Activity,
  Star,
  Clock,
  TrendingUp,
  DollarSign,
} from "lucide-react";

interface QuickStatsProps {
  tasksPosted: number;
  tasksCompleted: number;
  activeTasks: number;
  averageRating: number;
  totalSpent: number;
  successRate: number;
  trustScore: number;
  /** "row" = 2/4-across horizontal tiles (mobile & full width); "compact" = 2x2 mini tiles (desktop column) */
  layout?: "row" | "compact";
}

const statDefs = [
  {
    key: "posted",
    label: "Posted",
    icon: Briefcase,
    color: "#1A6B4A",
    bg: "bg-emerald-50",
    getValue: (s: QuickStatsProps) => String(s.tasksPosted),
  },
  {
    key: "completed",
    label: "Completed",
    icon: CheckCircle,
    color: "#2563EB",
    bg: "bg-blue-50",
    getValue: (s: QuickStatsProps) => String(s.tasksCompleted),
  },
  {
    key: "active",
    label: "Active",
    icon: Activity,
    color: "#EAA325",
    bg: "bg-amber-50",
    getValue: (s: QuickStatsProps) => String(s.activeTasks),
  },
  {
    key: "rating",
    label: "Rating",
    icon: Star,
    color: "#EAA325",
    bg: "bg-amber-50",
    getValue: (s: QuickStatsProps) => s.averageRating > 0 ? Number(s.averageRating).toFixed(1) : "—",
  },
];

const extraStatDefs = [
  {
    key: "success",
    label: "Success Rate",
    icon: TrendingUp,
    color: "#16A34A",
    bg: "bg-green-50",
    getValue: (s: QuickStatsProps) => `${s.successRate}%`,
  },
  {
    key: "spent",
    label: "Total Spent",
    icon: DollarSign,
    color: "#6B7280",
    bg: "bg-gray-50",
    getValue: (s: QuickStatsProps) => `₦${(s.totalSpent / 100).toLocaleString()}`,
  },
  {
    key: "trust",
    label: "Trust",
    icon: TrendingUp,
    color: "#1A6B4A",
    bg: "bg-emerald-50",
    getValue: (s: QuickStatsProps) => `${s.trustScore}`,
  },
];

export function QuickStats({ layout = "row", ...props }: QuickStatsProps) {
  const showExtra = props.tasksPosted > 0 || props.tasksCompleted > 0;
  const stats = showExtra
    ? [...statDefs, ...extraStatDefs]
    : statDefs.slice(0, 4);

  const tiles = (
    <div className={`grid gap-2 ${layout === "compact" ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}>
      {stats.slice(0, layout === "compact" ? 4 : 7).map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.key}
            className="rounded-xl border border-card-border bg-surface p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.bg}`}>
                <Icon className="h-4 w-4" style={{ color: stat.color }} />
              </div>
              <p className="text-lg font-black" style={{ color: stat.color }}>
                {stat.getValue(props)}
              </p>
            </div>
            <p className="mt-1 text-[11px] font-medium text-gray-500">
              {stat.label}
            </p>
          </div>
        );
      })}
    </div>
  );

  if (layout === "compact") {
    return (
      <section className="rounded-2xl border border-card-border bg-surface p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-gray-900 dark:text-white">
          My Stats
        </h3>
        {tiles}
      </section>
    );
  }

  return tiles;
}