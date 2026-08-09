"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { TASK_CATEGORIES } from "@/components/dashboard/post/CategorySearch";

// WHAT: Home "Browse Categories" — one horizontal rail on mobile (touch scroll,
//       no wrap), a compact wrapped row on md+. "View all" opens /categories.
// WHY:  Categories are discovery controls: the rail previews them, the
//       dedicated page holds the complete experience.
export function BrowseCategories() {
  return (
    <section aria-label="Browse categories">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">
          Browse Categories
        </h2>
        <Link
          href="/categories"
          className="flex shrink-0 items-center gap-0.5 text-[11px] font-bold text-brand-text"
        >
          View all <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      <p className="mt-0.5 text-xs text-gray-500">
        Find the right kind of help for your task.
      </p>

      {/* Rail: mobile = single horizontal scroll line with partial peek on the
          right; md+ = wrapped compact row (no huge grid). */}
      <div className="scrollbar-hide -mr-4 mt-3 flex gap-2 overflow-x-auto pb-1 pr-4 md:-mr-0 md:flex-wrap md:overflow-visible md:pr-0">
        {TASK_CATEGORIES.map((cat) => (
          <Link
            key={cat.name}
            href={`/tasks/create?category=${encodeURIComponent(cat.name)}`}
            className="flex w-[4.5rem] shrink-0 flex-col items-center gap-1.5 rounded-xl border border-card-border bg-surface px-1 py-2.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-md active:scale-[0.97] md:w-20"
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-lg"
              style={{ background: cat.color }}
            >
              {cat.icon}
            </span>
            <span className="truncate text-[10px] font-semibold text-gray-700 dark:text-white">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}