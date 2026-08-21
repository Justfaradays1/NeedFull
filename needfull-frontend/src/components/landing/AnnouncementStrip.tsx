// WHAT: Top announcement/action strip — the first thing a visitor sees
// WHY: States the core value proposition in one line and gives an
//      immediate action, instead of a decorative hero badge.

"use client";

import { ArrowRight } from "lucide-react";
import { useAuthDestinations } from "./authDestinations";

export function AnnouncementStrip() {
  const { postTask } = useAuthDestinations();

  return (
    <div className="border-b border-border-subtle bg-surface-secondary">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4 lg:px-8">
        <p className="text-[13px] font-medium leading-snug text-foreground sm:text-sm">
          Stop carrying every little task yourself. Get a nearby Runner to
          handle it.
        </p>
        <a
          href={postTask}
          className="inline-flex shrink-0 items-center gap-1 text-[13px] font-bold text-brand underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:rounded-sm sm:text-sm"
        >
          Get started
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}