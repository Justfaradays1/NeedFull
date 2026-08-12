"use client";

import { formatNaira, parseNairaInput } from "./budgetConfig";

interface BudgetInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
}

export function BudgetInput({
  value,
  onChange,
  placeholder = "Enter your budget",
}: BudgetInputProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = parseNairaInput(e.target.value);
    const num = parseInt(raw, 10) || 0;
    onChange(num);
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-0 rounded-2xl border-2 border-border-default bg-surface-primary px-5 py-4 transition-all duration-200 focus-within:border-brand focus-within:shadow-sm">
        <span className="text-2xl font-bold text-gray-400">₦</span>
        <input
          type="text"
          inputMode="numeric"
          value={value > 0 ? Math.round(value).toLocaleString("en-NG") : ""}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full border-none bg-transparent px-2 text-2xl font-bold text-gray-900 outline-none placeholder:text-gray-400"
        />
      </div>
    </div>
  );
}
