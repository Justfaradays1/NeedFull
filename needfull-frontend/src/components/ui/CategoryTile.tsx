"use client";

// WHAT: Compact colour-coded category tile — the reusable "browse" unit:
//       [ Name ............. (icon) ] on a solid category colour.
// WHY:  One tile used on /categories, the dashboard rail, and chat so the
//       category system looks identical everywhere. Icon sits right, in
//       white, per the Spotify-style browse pattern. Name wraps gracefully
//       (max 2 lines) — never truncates mid-word.

import Link from "next/link";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import type { CategoryConfig } from "@/lib/categoryConfig";

export function CategoryTile({
  category,
  href,
  className = "",
}: {
  category: CategoryConfig;
  href?: string;
  className?: string;
}) {
  const target =
    href ??
    `/tasks/create?category=${encodeURIComponent(category.displayName)}`;

  return (
    <Link
      href={target}
      title={category.description}
      className={`group flex items-center justify-between gap-2.5 rounded-xl px-3 py-2.5 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md hover:brightness-105 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${className}`}
      style={{ backgroundColor: category.colorVar }}
    >
      <span className="min-w-0 text-[13px] font-bold leading-tight text-white">
        {category.displayName}
      </span>
      <CategoryIcon
        name={category.icon}
        className="h-5 w-5 shrink-0 text-white/95 transition-transform duration-150 group-hover:scale-110"
      />
    </Link>
  );
}