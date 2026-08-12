"use client";

import { useState, useMemo } from "react";
import { Loader2, Search, Clock } from "lucide-react";
import { CategoryCard } from "./CategoryCard";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import {
  getCategoryConfigs,
  getCategoryConfig,
  getRecentlyUsedCategories,
  addRecentlyUsedCategory,
} from "@/lib/categoryConfig";

interface CategorySelectionStepProps {
  allCategories: { id: string; name: string; icon: string }[];
  selectedCategoryId: string;
  onSelect: (id: string, name: string) => void;
  loading?: boolean;
}

export function CategorySelectionStep({
  allCategories,
  selectedCategoryId,
  onSelect,
  loading = false,
}: CategorySelectionStepProps) {
  const [search, setSearch] = useState("");
  const [recentNames, setRecentNames] = useState<string[]>(() =>
    getRecentlyUsedCategories(),
  );

  // WHAT: Build full category data by merging API categories with our config
  // WHY:  Collapse DB rows that resolve to the same canonical key (legacy rows
  //       must never render as duplicate "Other / Custom" tiles) and order by
  //       canonical config order so every surface shows the same 13 categories.
  const enrichedCategories = useMemo(() => {
    const byKey = new Map<string, {
      id: string;
      key: string;
      name: string;
      displayName: string;
      icon: string;
      colorVar: string;
      description: string;
    }>();
    for (const cat of allCategories) {
      const config = getCategoryConfig(cat.name);
      if (!byKey.has(config.key)) {
        byKey.set(config.key, {
          id: cat.id,
          key: config.key,
          name: cat.name,
          displayName: config.displayName,
          icon: config.icon,
          colorVar: config.colorVar,
          description: config.description,
        });
      }
    }
    const order = new Map(getCategoryConfigs().map((c, i) => [c.key, i]));
    return [...byKey.values()].sort(
      (a, b) => (order.get(a.key) ?? 999) - (order.get(b.key) ?? 999),
    );
  }, [allCategories]);

  // WHAT: Filter by search
  const filtered = useMemo(() => {
    if (!search.trim()) return enrichedCategories;
    const q = search.toLowerCase();
    return enrichedCategories.filter(
      (c) =>
        c.displayName.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q),
    );
  }, [enrichedCategories, search]);

  // WHAT: Recently used categories that exist in the current list
  const recentItems = useMemo(() => {
    return recentNames
      .map((name) => enrichedCategories.find((c) => c.name === name || c.displayName === name))
      .filter(Boolean) as typeof enrichedCategories;
  }, [recentNames, enrichedCategories]);

  function handleSelect(id: string, name: string) {
    addRecentlyUsedCategory(name);
    setRecentNames(getRecentlyUsedCategories());
    onSelect(id, name);
  }

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-gray-900">
          What do you need help with?
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          Choose the category that best matches your task so NeedFull can
          recommend the most suitable NeedRunners.
        </p>
      </div>

      {/* Search (desktop only) */}
      <div className="hidden sm:block">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories..."
            className="w-full rounded-xl border-2 border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-brand"
          />
        </div>
      </div>

      {/* Recently Used */}
      {!loading && recentItems.length > 0 && !search && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Recently Used
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentItems.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSelect(cat.id, cat.name)}
                className={`tap-target flex items-center gap-1.5 rounded-full border-2 px-4 py-2 text-sm font-semibold transition-all ${
                  selectedCategoryId === cat.id
                    ? "border-brand bg-brand/10 text-brand-text"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                <span
                  className="flex h-4 w-4 items-center justify-center rounded text-white"
                  style={{ backgroundColor: cat.colorVar }}
                >
                  <CategoryIcon name={cat.icon} className="h-2.5 w-2.5" />
                </span>
                <span>{cat.displayName}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category Grid */}
      {loading ? (
        <div className="flex min-h-[400px] items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white sm:min-h-[520px] lg:min-h-[560px]">
          <Loader2 className="h-5 w-5 animate-spin text-brand" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((cat) => (
            <CategoryCard
              key={cat.id}
              icon={cat.icon}
              colorVar={cat.colorVar}
              name={cat.displayName}
              description={cat.description}
              selected={selectedCategoryId === cat.id}
              onSelect={() => handleSelect(cat.id, cat.name)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <p className="text-sm font-medium text-gray-500">No categories found</p>
          <p className="text-xs text-gray-400">Try a different search term</p>
        </div>
      )}
    </div>
  );
}
