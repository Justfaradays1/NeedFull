"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Clock } from "lucide-react";
import { CategoryCard } from "./CategoryCard";
import {
  getCategoryConfigs,
  getCategoryConfig,
  getRecentlyUsedCategories,
  addRecentlyUsedCategory,
  type CategoryConfig,
} from "@/lib/categoryConfig";

interface CategorySelectionStepProps {
  allCategories: { id: string; name: string; icon: string }[];
  selectedCategoryId: string;
  onSelect: (id: string, name: string) => void;
}

export function CategorySelectionStep({
  allCategories,
  selectedCategoryId,
  onSelect,
}: CategorySelectionStepProps) {
  const [search, setSearch] = useState("");
  const [recentNames, setRecentNames] = useState<string[]>([]);

  useEffect(() => {
    setRecentNames(getRecentlyUsedCategories());
  }, []);

  // WHAT: Build full category data by merging API categories with our config
  const enrichedCategories = useMemo(() => {
    return allCategories.map((cat) => {
      const config = getCategoryConfig(cat.name);
      return {
        id: cat.id,
        name: cat.name,
        displayName: config.displayName,
        icon: config.icon,
        description: config.description,
      };
    });
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
      {recentItems.length > 0 && !search && (
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
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.displayName}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((cat) => (
            <CategoryCard
              key={cat.id}
              icon={cat.icon}
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
