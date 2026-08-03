"use client";

import Link from "next/link";
import { TASK_CATEGORIES } from "@/components/dashboard/post/CategorySearch";

export function CategoryShortcuts() {
  return (
    <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-5 md:grid-cols-5">
      {TASK_CATEGORIES.map((cat) => (
        <Link
          key={cat.name}
          href={`/tasks/create?category=${encodeURIComponent(cat.name)}`}
          className="flex flex-col items-center gap-1 rounded-xl border border-card-border bg-surface px-1 py-2.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-md active:scale-[0.97]"
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full text-lg"
            style={{ background: cat.color }}
          >
            {cat.icon}
          </div>
          <span className="text-[10px] font-semibold text-gray-700 text-center leading-tight">
            {cat.name}
          </span>
        </Link>
      ))}
    </div>
  );
}