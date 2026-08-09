"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

// WHAT: Primary Home CTA — visually stronger than category cards but light.
// WHY:  Posting a task is one of NeedFull's core actions; it sits right after
//       Browse Categories so the flow reads: discover → act.
export function PostTaskCTA() {
  return (
    <Link
      href="/tasks/create"
      className="group flex items-center gap-3 rounded-2xl bg-gradient-to-r from-gold to-gold-dark px-4 py-3.5 text-white shadow-md shadow-gold/20 transition-all hover:brightness-105 active:scale-[0.98]"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 transition-transform group-hover:scale-105">
        <Plus className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">Post a Task</p>
        <p className="truncate text-xs text-white/80">
          Get help from a NeedRunner
        </p>
      </div>
    </Link>
  );
}