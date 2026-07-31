"use client";

import { TrendingUp, Clock, MapPin, Zap } from "lucide-react";

const activityCards = [
  {
    icon: TrendingUp,
    label: "Trending Now",
    value: "Delivery & Errands",
    sub: "Most posted category today",
    color: "#1A6B4A",
    bg: "bg-emerald-50",
  },
  {
    icon: Clock,
    label: "Avg. Completion",
    value: "45 min",
    sub: "For nearby tasks",
    color: "#2563EB",
    bg: "bg-blue-50",
  },
  {
    icon: MapPin,
    label: "Active Nearby",
    value: "12 NeedRunners",
    sub: "Ready to pick up tasks",
    color: "#EAA325",
    bg: "bg-amber-50",
  },
  {
    icon: Zap,
    label: "Fastest Category",
    value: "Printing",
    sub: "~6 min response time",
    color: "#16A34A",
    bg: "bg-green-50",
  },
];

export function NearbyActivity() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {activityCards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="rounded-xl border border-card-border bg-surface p-3 shadow-sm"
          >
            <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${card.bg}`}>
              <Icon className="h-4 w-4" style={{ color: card.color }} />
            </div>
            <p className="text-[11px] font-medium text-gray-500">{card.label}</p>
            <p className="text-sm font-bold text-gray-900">{card.value}</p>
            <p className="text-[10px] text-gray-400">{card.sub}</p>
          </div>
        );
      })}
    </div>
  );
}
