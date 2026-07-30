"use client";

import { formatNaira, getPricingGuidance, getCategoryBudgetConfig } from "./budgetConfig";
import type { CategoryBudgetConfig } from "./budgetConfig";

interface BudgetSliderProps {
  value: number;
  config: CategoryBudgetConfig;
  onChange: (value: number) => void;
}

export function BudgetSlider({ value, config, onChange }: BudgetSliderProps) {
  const guidance = getPricingGuidance(value, config);
  const min = config.min;
  const max = config.max;
  const pct = value > 0 ? ((value - min) / (max - min)) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="text-center">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-3xl font-extrabold text-gray-900 tabular-nums">
            {formatNaira(value)}
          </span>
        </div>
        {value > 0 && (
          <p className={`mt-1 text-xs font-medium ${guidance.color}`}>
            {guidance.label}
          </p>
        )}
      </div>

      <div className="relative px-1">
        <input
          type="range"
          min={min}
          max={max}
          step={100}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-200 outline-none transition-all"
          style={{
            background: `linear-gradient(to right, #1A6B4A ${pct}%, #e5e7eb ${pct}%)`,
          }}
        />
        <div className="mt-1 flex justify-between text-xs text-gray-400">
          <span>{formatNaira(min)}</span>
          <span>{formatNaira(max)}</span>
        </div>
      </div>
    </div>
  );
}
