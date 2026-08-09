"use client";

import Link from "next/link";
import { ClipboardList, UsersRound, ArrowLeftRight } from "lucide-react";

// WHAT: The three primary quick actions on Home — My Tasks, Find a NeedRunner,
//       Transactions. Everything else lives in its own destination.
// WHY:  Keep Home calm: these are the three most-used entry points, and each
//       maps 1:1 to a dedicated page.
export function QuickActions() {
  return (
    <section aria-label="Quick actions">
      <h2 className="section-label mb-2">Quick Actions</h2>
      <div className="grid grid-cols-3 gap-2">
        <Link
          href="/tasks"
          className="group flex flex-col items-center gap-1.5 rounded-xl border border-card-border bg-surface px-2 py-3 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-md active:scale-[0.97]"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-light">
            <ClipboardList className="h-4 w-4 text-brand-text" />
          </span>
          <span className="text-[11px] font-bold text-gray-700 dark:text-white">
            My Tasks
          </span>
        </Link>

        <Link
          href="/helpers"
          className="group flex flex-col items-center gap-1.5 rounded-xl border border-card-border bg-surface px-2 py-3 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-md active:scale-[0.97]"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-light">
            <UsersRound className="h-4 w-4 text-gold" />
          </span>
          <span className="text-[11px] font-bold text-gray-700 dark:text-white">
            Find a NeedRunner
          </span>
        </Link>

        <Link
          href="/wallet"
          className="group flex flex-col items-center gap-1.5 rounded-xl border border-card-border bg-surface px-2 py-3 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-md active:scale-[0.97]"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-light">
            <ArrowLeftRight className="h-4 w-4 text-brand-text" />
          </span>
          <span className="text-[11px] font-bold text-gray-700 dark:text-white">
            Transactions
          </span>
        </Link>
      </div>
    </section>
  );
}