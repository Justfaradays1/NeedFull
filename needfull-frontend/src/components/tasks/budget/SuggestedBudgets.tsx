"use client";

import { formatNaira } from "./budgetConfig";

interface SuggestedBudgetsProps {
  suggestions: number[];
  selected: number;
  onSelect: (value: number) => void;
}

export function SuggestedBudgets({
  suggestions,
  selected,
  onSelect,
}: SuggestedBudgetsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((amount) => {
        const isActive = selected === amount;
        return (
          <button
            key={amount}
            type="button"
            onClick={() => onSelect(amount)}
            className={`tap-target rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition-all duration-150 ${
              isActive
                ? "border-brand bg-brand text-on-brand shadow-sm"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            {formatNaira(amount)}
          </button>
        );
      })}
    </div>
  );
}
