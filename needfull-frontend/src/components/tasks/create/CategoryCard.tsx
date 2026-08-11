"use client";

import { Check } from "lucide-react";
import { CategoryIcon } from "@/components/ui/CategoryIcon";

interface CategoryCardProps {
  icon: string;
  colorVar: string;
  name: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
}

export function CategoryCard({
  icon,
  colorVar,
  name,
  description,
  selected,
  onSelect,
}: CategoryCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative flex flex-col items-center gap-2.5 rounded-2xl border-2 p-4 text-center transition-all duration-200 tap-target ${
        selected
          ? "border-brand bg-brand/10 shadow-sm"
          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm hover:-translate-y-0.5"
      }`}
    >
      {/* Checkmark overlay when selected */}
      {selected && (
        <div className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-on-brand animate-scale-in">
          <Check className="h-3 w-3" strokeWidth={3} />
        </div>
      )}

      {/* Icon — category colour tile with white glyph */}
      <span
        className="flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-sm transition-transform duration-200 group-hover:scale-105"
        style={{ backgroundColor: colorVar }}
      >
        <CategoryIcon name={icon} className="h-5.5 w-5.5" />
      </span>

      {/* Name */}
      <span
        className={`text-[13px] font-bold leading-tight ${
          selected ? "text-brand-text" : "text-gray-800"
        }`}
      >
        {name}
      </span>

      {/* Description (desktop only) */}
      {description && (
        <span className="hidden text-[11px] leading-tight text-gray-400 sm:line-clamp-2">
          {description}
        </span>
      )}
    </button>
  );
}