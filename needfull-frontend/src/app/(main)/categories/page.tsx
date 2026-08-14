// WHAT: /categories — canonical NeedFull category discovery page
// WHY:  Home shows a compact preview rail; this page is the complete
//       marketplace directory: search with keyword matching, colour-coded
//       compact tiles (icon + short label), responsive columns, keyboard
//       accessible links. One shared data source (lib/categoryConfig.ts)
//       and one shared tile (components/ui/CategoryTile.tsx).
// NOTE: Pure static config — no API fetch, no images, negligible page-cost.
//       Tiles deep-link into the post flow with the category pre-selected
//       (the `?category=` param is honored by /tasks/create).

"use client";

import { useMemo, useState } from "react";
import { Search, X, LayoutGrid } from "lucide-react";
import { searchCategoryConfigs } from "@/lib/categoryConfig";
import { CategoryTile } from "@/components/ui/CategoryTile";

export default function CategoriesPage() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => searchCategoryConfigs(query), [query]);

  return (
    <div className="page-column">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        {/* Heading */}
        <div className="flex items-start gap-3">
          <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-light text-brand-text sm:flex">
            <LayoutGrid className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-scale-section text-gray-900 dark:text-white">
              Browse Categories
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Find the right kind of help for your task.
            </p>
          </div>
        </div>

        {/* Category search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search categories..."
            aria-label="Search categories"
            className="w-full rounded-full border border-card-border bg-surface py-3 pl-10 pr-10 text-sm font-medium outline-none transition-colors placeholder:text-gray-500 search-pill dark:placeholder:text-gray-400"
            style={{ color: "var(--color-foreground, #171717)" }}
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-foreground-muted transition-colors hover:bg-surface-secondary hover:text-gray-600 dark:hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {filtered.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-card-border px-6 py-16 text-center">
            <p className="text-3xl">🔍</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              No category matches “{query}”
            </p>
            <p className="max-w-xs text-xs text-gray-500">
              Try another word — for example “furniture”, “iron” or “research”.
            </p>
            <button
              type="button"
              onClick={() => setQuery("")}
              className="mt-2 rounded-lg bg-brand px-4 py-2 text-xs font-bold text-on-brand transition-all hover:brightness-105 active:scale-[0.97]"
            >
              Show all categories
            </button>
          </div>
        ) : (
          /* Compact colour-coded tiles: 2 cols mobile → 3 tablet → 4 desktop */
          <section aria-label="Popular categories">
            <div className="mb-2.5 flex items-baseline justify-between gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {query ? "Search results" : "Popular Categories"}
              </h2>
              <span className="text-xs text-foreground-muted">
                {filtered.length} {filtered.length === 1 ? "category" : "categories"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-4">
              {filtered.map((cat) => (
                <CategoryTile key={cat.key} category={cat} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}