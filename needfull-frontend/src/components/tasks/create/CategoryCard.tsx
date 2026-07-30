"use client";

interface CategoryCardProps {
  icon: string;
  name: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
}

export function CategoryCard({
  icon,
  name,
  description,
  selected,
  onSelect,
}: CategoryCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative flex flex-col items-center gap-2 rounded-2xl border-2 p-5 text-center transition-all duration-200 tap-target ${
        selected
          ? "border-brand bg-brand/10 shadow-sm"
          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm hover:-translate-y-0.5"
      }`}
    >
      {/* Checkmark overlay when selected */}
      {selected && (
        <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white animate-scale-in">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Icon */}
      <span className="text-3xl leading-none transition-transform duration-200 group-hover:scale-110">
        {icon}
      </span>

      {/* Name */}
      <span
        className={`text-sm font-bold leading-tight ${
          selected ? "text-brand" : "text-gray-800"
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
