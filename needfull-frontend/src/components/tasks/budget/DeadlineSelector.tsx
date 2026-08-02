"use client";

import { useState } from "react";
import { Clock, Sun, CalendarDays } from "lucide-react";

type DeadlineOption = "today" | "tomorrow" | "custom";

interface DeadlineSelectorProps {
  value: { option: DeadlineOption; customDate?: string };
  onChange: (value: { option: DeadlineOption; customDate?: string }) => void;
}

const OPTIONS: {
  key: DeadlineOption;
  label: string;
  icon: typeof Clock;
  suffix: string;
}[] = [
  { key: "today", label: "Today", icon: Sun, suffix: "⚡" },
  { key: "tomorrow", label: "Tomorrow", icon: Clock, suffix: "🌅" },
  { key: "custom", label: "Pick Date & Time", icon: CalendarDays, suffix: "📅" },
];

export function DeadlineSelector({ value, onChange }: DeadlineSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isActive = value.option === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onChange({ option: opt.key })}
              className={`tap-target flex flex-1 flex-col items-center gap-1 rounded-xl border-2 px-3 py-3 text-center text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? "border-brand bg-brand/10 text-brand-text"
                  : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{opt.label}</span>
              <span className="text-base">{opt.suffix}</span>
            </button>
          );
        })}
      </div>

      {value.option === "custom" && (
        <input
          type="datetime-local"
          value={value.customDate ?? ""}
          onChange={(e) =>
            onChange({ option: "custom", customDate: e.target.value })
          }
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-brand"
        />
      )}
    </div>
  );
}
