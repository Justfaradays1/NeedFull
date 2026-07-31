"use client";

import Link from "next/link";

const SHORTCUTS = [
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

export function CategoryShortcuts() {
  return (
    <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-5 md:grid-cols-5">
      {SHORTCUTS.map((cat) => (
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
