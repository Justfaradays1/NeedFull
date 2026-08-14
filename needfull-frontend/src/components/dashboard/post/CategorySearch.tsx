"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { searchCategoryConfigs, getCategoryColor } from "@/lib/categoryConfig";
import { CategoryIcon } from "@/components/ui/CategoryIcon";

// WHAT: Config-driven category search widget (used inside the desktop context
//       panel and on the /categories page). Single source of truth is
//       lib/categoryConfig.ts — display names, icons, descriptions, keywords.
// WHY: Old hardcoded name/icon arrays drifted from the real taxonomy; one
//       canonical config keeps every surface consistent.
export function CategorySearch() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => searchCategoryConfigs(query), [query]);

  return (
    <div className="space-y-2.5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search categories..."
          aria-label="Search categories"
          className="w-full rounded-full border border-card-border bg-surface py-2.5 pl-9 pr-9 text-sm font-medium outline-none transition-colors placeholder:text-gray-500 search-pill dark:placeholder:text-gray-400"
          style={{ color: "var(--color-foreground, #171717)" }}
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <p className="px-1 text-sm font-medium text-gray-600 dark:text-gray-300">
          No categories match “{query}”.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-2">
          {filtered.map((cat) => (
            <li key={cat.key}>
              <Link
                href={`/tasks/create?category=${encodeURIComponent(cat.displayName)}`}
                title={cat.description}
                className="flex items-center gap-2.5 rounded-xl border border-card-border bg-surface px-2.5 py-2.5 text-[13px] font-semibold text-gray-700 transition-all duration-150 hover:-translate-y-px hover:border-brand/30 hover:bg-brand-light/40 hover:shadow-sm active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 dark:text-white"
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: getCategoryColor(cat.key) }}
                >
                  <CategoryIcon name={cat.icon} className="h-3.5 w-3.5" />
                </span>
                <span className="truncate">{cat.displayName}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}