"use client";

import Link from "next/link";
import {
  Plus,
  LayoutGrid,
  MessageCircle,
  ClipboardList,
  Wallet,
} from "lucide-react";

const actions = [
  {
    label: "Browse Categories",
    href: "/tasks",
    icon: LayoutGrid,
    color: "#2563EB",
    bg: "bg-blue-50",
    textColor: "text-blue-700",
  },
  {
    label: "Messages",
    href: "/chat",
    icon: MessageCircle,
    color: "#EAA325",
    bg: "bg-amber-50",
    textColor: "text-amber-700",
  },
  {
    label: "Task History",
    href: "/tasks",
    icon: ClipboardList,
    color: "#6B7280",
    bg: "bg-gray-50",
    textColor: "text-gray-700",
  },
  {
    label: "Wallet",
    href: "/wallet",
    icon: Wallet,
    color: "#1A6B4A",
    bg: "bg-emerald-50",
    textColor: "text-emerald-700",
  },
];

// WHAT: One cohesive Quick Action module — the gold "Post a Task" hero on top,
// followed by a uniform 2x2 action button grid inside the same card
export function QuickActions() {
  return (
    <section className="rounded-2xl border border-card-border bg-surface p-3 shadow-sm">
      <Link
        href="/tasks/create"
        className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-gold to-gold-dark px-4 py-3.5 text-white shadow-md shadow-gold/20 transition-all hover:brightness-105 active:scale-[0.98]"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20">
          <Plus className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Post a Task</p>
          <p className="text-xs text-white/80">Get help from a NeedRunner</p>
        </div>
      </Link>

      <div className="mt-2 grid grid-cols-2 gap-2">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className={`flex h-11 items-center gap-2 rounded-xl border border-card-border ${action.bg} px-3 transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.97]`}
          >
            <action.icon
              className="h-4 w-4 shrink-0"
              style={{ color: action.color }}
            />
            <span className={`truncate text-xs font-bold ${action.textColor}`}>
              {action.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}