// WHAT: Task discovery — search + category browse connected to real data
// WHY: The landing page must route visitors into the actual product
//      workflow. Search filters canonical categories (categoryConfig) and
//      shows LIVE open tasks from GET /tasks (public, optionalAuth) — no
//      fake listings.

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, MapPin, Loader2 } from "lucide-react";
import {
  getCategoryConfigs,
  searchCategoryConfigs,
  type CategoryConfig,
} from "@/lib/categoryConfig";
import { CategoryTile } from "@/components/ui/CategoryTile";
import { get } from "@/lib/apiClient";
import { formatCurrency } from "@/lib/format";
import { useAuthDestinations } from "./authDestinations";

interface OpenTask {
  id: string;
  title: string;
  budget: { kobo: number; naira: number };
  category: { id: string; name: string; icon: string } | null;
  locationLabel?: string | null;
}

const PRIMARY_CATEGORIES = ["laundry", "delivery", "printing", "cleaning", "food", "errands"];

export function DiscoverySection() {
  const { findRunner } = useAuthDestinations();
  const [query, setQuery] = useState("");
  const [tasks, setTasks] = useState<OpenTask[]>([]);
  const [loading, setLoading] = useState(true);

  const matchingCategories = (() => {
    const all = getCategoryConfigs();
    if (!query.trim()) {
      const primary = PRIMARY_CATEGORIES
        .map((key) => all.find((c) => c.key === key))
        .filter((c): c is CategoryConfig => Boolean(c));
      const rest = all.filter((c) => !PRIMARY_CATEGORIES.includes(c.key));
      return [...primary, ...rest];
    }
    return searchCategoryConfigs(query);
  })();

  const loadOpenTasks = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await get<{ success: boolean; data: OpenTask[] }>(
        `/tasks?status=open&sortBy=newest&perPage=4${q ? `&search=${encodeURIComponent(q)}` : ""}`,
      );
      setTasks(res?.success ? res.data : []);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void loadOpenTasks(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query, loadOpenTasks]);

  return (
    <section
      id="discover"
      className="border-b border-border-subtle bg-surface-primary"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          What do you need help with?
        </h2>

        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-start">
          {/* Search */}
          <div className="w-full lg:max-w-md">
            <label htmlFor="landing-search" className="sr-only">
              Search for a task or service
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-foreground-muted"
                aria-hidden="true"
              />
              <input
                id="landing-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for a task or service..."
                className="h-12 w-full rounded-xl border border-border-default bg-surface pl-10 pr-4 text-[15px] text-foreground outline-none transition-colors placeholder:text-foreground-muted focus:border-brand focus:ring-2 focus:ring-brand/20"
                autoComplete="off"
              />
            </div>
            <p className="mt-2 text-[13px] text-foreground-muted">
              Matching tasks below update live from the NeedFull marketplace.
            </p>
          </div>

          {/* Category tiles */}
          <div className="flex-1">
            <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4" aria-label="Task categories">
              {matchingCategories.map((category) => (
                <li key={category.key}>
                  <CategoryTile category={category} />
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Live open tasks */}
        <div className="mt-10">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-foreground">
              {query.trim() ? `Open tasks matching “${query.trim()}”` : "Open tasks nearby"}
            </h3>
            <Link
              href={findRunner}
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:rounded-sm"
            >
              Browse all tasks
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          {loading ? (
            <div className="mt-4 flex h-24 items-center justify-center text-foreground-muted">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Loading tasks…
            </div>
          ) : tasks.length === 0 ? (
            <p className="mt-4 rounded-xl border border-border-default bg-surface px-4 py-6 text-sm text-foreground-muted">
              No open tasks match right now. Try a different search or post
              your own task.
            </p>
          ) : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {tasks.map((task) => (
                <li key={task.id}>
                  <Link
                    href={`/tasks/${task.id}`}
                    className="flex h-full flex-col rounded-xl border border-border-default bg-surface p-4 shadow-sm transition-colors hover:border-brand/30 hover:bg-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                  >
                    <p className="text-sm font-bold leading-snug text-foreground">
                      {task.title}
                    </p>
                    <p className="mt-1 text-[13px] text-foreground-muted">
                      {task.category?.name ?? "General"}
                    </p>
                    <div className="mt-auto flex items-end justify-between pt-3">
                      <span className="text-[15px] font-extrabold text-foreground">
                        {formatCurrency(task.budget.kobo)}
                      </span>
                      {task.locationLabel && (
                        <span className="inline-flex items-center gap-1 text-[12px] text-foreground-muted">
                          <MapPin className="h-3 w-3" aria-hidden="true" />
                          {task.locationLabel}
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}