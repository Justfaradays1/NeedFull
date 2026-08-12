"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getCategoryConfigs } from "@/lib/categoryConfig";
import { CategoryTile } from "@/components/ui/CategoryTile";

// WHAT: Home "Popular Categories" — one horizontal rail on mobile (touch scroll,
//       no wrap), first 4 as a compact row on md+. "View all" opens /categories.
// WHY:  Categories are discovery controls: the rail previews them, the
//       dedicated page holds the complete experience. Data + tile come from
//       the single shared source (lib/categoryConfig.ts + CategoryTile).
export function BrowseCategories() {
  const categories = getCategoryConfigs().filter((c) => c.key !== "other");

  return (
    <section aria-label="Popular categories">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">
          Popular Categories
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

      {/* Rail: single renderer — mobile = horizontal scroll line (scrollbar
          hidden), md+ = only the first 4 tiles remain visible in one row. */}
      <div className="scrollbar-hide -mr-4 mt-3 flex gap-2 overflow-x-auto pb-1 pr-4 md:-mr-0 md:flex-wrap md:overflow-visible md:pr-0">
        {categories.slice(0, 12).map((cat, i) => (
          <CategoryTile
            key={cat.key}
            category={cat}
            className={`w-40 shrink-0 md:w-auto md:flex-1 md:min-w-[9.5rem] ${
              i >= 4 ? "md:hidden" : ""
            }`}
          />
        ))}
      </div>
    </section>
  );
}