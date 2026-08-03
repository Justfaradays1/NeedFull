"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";

export const TASK_CATEGORIES = [
  { name: "Laundry", icon: "🧺", color: "#E8F5E9" },
  { name: "Delivery", icon: "🛵", color: "#E3F2FD" },
  { name: "Printing", icon: "🖨", color: "#FFF3E0" },
  { name: "Cleaning", icon: "🧹", color: "#F3E5F5" },
  { name: "Food Runs", icon: "🍔", color: "#FFF8E1" },
  { name: "Shopping", icon: "🛒", color: "#E0F2F1" },
  { name: "Tech", icon: "💻", color: "#E8EAF6" },
  { name: "Design", icon: "🎨", color: "#FBE9E7" },
  { name: "Moving", icon: "📦", color: "#EFEBE9" },
  { name: "Academics", icon: "📚", color: "#F1F8E9" },
];

export function CategorySearch() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TASK_CATEGORIES;
    return TASK_CATEGORIES.filter((c) => c.name.toLowerCase().includes(q));
  }, [query]);

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
          className="w-full rounded-xl border border-card-border bg-surface py-2.5 pl-9 pr-9 text-sm font-medium outline-none transition-colors placeholder:text-gray-500 focus:border-brand/50 focus:ring-2 focus:ring-brand/15 dark:placeholder:text-gray-400"
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
            <li key={cat.name}>
              <Link
                href={`/tasks/create?category=${encodeURIComponent(cat.name)}`}
                className="flex items-center gap-2.5 rounded-xl border border-card-border bg-surface px-2.5 py-2.5 text-[13px] font-semibold text-gray-700 transition-all duration-150 hover:-translate-y-px hover:border-brand/30 hover:bg-brand-light/40 hover:shadow-sm active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 dark:text-white"
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm shadow-inner"
                  style={{ background: cat.color }}
                >
                  {cat.icon}
                </span>
                <span className="truncate">{cat.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
