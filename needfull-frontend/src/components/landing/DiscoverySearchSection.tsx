// WHAT: Lightweight category discovery — small horizontal pill row
// WHY: Supports hero conversion without dominating it. No large colorful
//      cards, no dashboard feel. Neutral pills, green hover.

"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useRole } from "./RoleContext";

const POSTER_CATEGORIES = [
  { label: "Laundry & Washing", href: "/tasks/create?category=Laundry%20%26%20Washing" },
  { label: "Delivery & Pickup", href: "/tasks/create?category=Delivery%20%26%20Pickup" },
  { label: "Cleaning", href: "/tasks/create?category=Cleaning" },
  { label: "Printing", href: "/tasks/create?category=Printing%20%26%20Documents" },
  { label: "Errands", href: "/tasks/create?category=Shopping%20%26%20Errands" },
  { label: "Shopping", href: "/tasks/create?category=Shopping%20%26%20Errands" },
];

const RUNNER_CATEGORIES = [
  { label: "Delivery", href: "/feed?category=delivery" },
  { label: "Laundry", href: "/feed?category=laundry" },
  { label: "Shopping", href: "/feed?category=shopping" },
  { label: "Cleaning", href: "/feed?category=cleaning" },
  { label: "Printing", href: "/feed?category=printing" },
  { label: "Errands", href: "/feed?category=shopping" },
];

export function DiscoverySearchSection() {
  const { role } = useRole();
  const isPoster = role === "poster";
  const categories = isPoster ? POSTER_CATEGORIES : RUNNER_CATEGORIES;
  const heading = isPoster ? "Popular tasks" : "Popular opportunities";

  return (
    <section id="discover" className="border-b border-border-subtle bg-background overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="flex flex-nowrap items-center gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
          <h2 className="shrink-0 text-sm font-bold tracking-wide text-foreground-secondary whitespace-nowrap">{heading}</h2>
          <div className="flex flex-nowrap gap-2">
            {categories.map((cat) => (
              <Link
                key={cat.label}
                href={cat.href}
                className="inline-flex shrink-0 whitespace-nowrap items-center gap-1.5 rounded-full border border-border-default bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-success hover:bg-success-light hover:text-success focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
              >
                {cat.label} <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}