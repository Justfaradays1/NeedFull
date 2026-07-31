"use client";

import { Lightbulb, TrendingUp, Clock, Sun } from "lucide-react";

const insights = [
  {
    icon: TrendingUp,
    label: "Best Time to Post",
    text: "Posting before 5 PM increases your chances of finding a NeedRunner quickly.",
    color: "#1A6B4A",
    bg: "bg-emerald-50",
  },
  {
    icon: Clock,
    label: "Quick Response",
    text: "Printing tasks currently receive responses within 6 minutes.",
    color: "#EAA325",
    bg: "bg-amber-50",
  },
  {
    icon: Sun,
    label: "Peak Activity",
    text: "NeedRunners nearby are very active this afternoon.",
    color: "#2563EB",
    bg: "bg-blue-50",
  },
  {
    icon: Lightbulb,
    label: "Tip",
    text: "Adding clear photos to your task gets 2x more applications.",
    color: "#7C3AED",
    bg: "bg-purple-50",
  },
];

export function SmartInsights() {
  return (
    <div className="rounded-xl border border-card-border bg-surface p-4 shadow-sm">
      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-gray-900">
        <Lightbulb className="h-4 w-4 text-gold" />
        Insights
      </h3>

      <div className="space-y-2">
        {insights.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="flex items-start gap-2.5 rounded-lg p-2.5 transition-colors hover:bg-gray-50"
            >
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${item.bg}`}
              >
                <Icon className="h-3.5 w-3.5" style={{ color: item.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-gray-900">{item.label}</p>
                <p className="text-[11px] text-gray-500 leading-snug">{item.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
