// WHAT: Final conversion — the last chance to convert visitors
// WHY: Presents both marketplace paths one more time with a strong,
//      clear visual hierarchy before the footer.

"use client";

import { ArrowRight } from "lucide-react";
import { useAuthDestinations } from "./authDestinations";

export function FinalCtaSection() {
  const { postTask, startEarning } = useAuthDestinations();

  return (
    <section id="final-cta" className="border-t border-border-subtle bg-surface-primary">
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-24">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Need something done? Or ready to earn?
        </h2>
        <p className="mt-3 max-w-lg mx-auto text-[15px] leading-relaxed text-muted sm:text-base">
          NeedFull connects people who need help with people ready to help.
          Your payment is protected either way.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href={postTask}
            className="inline-flex h-[52px] w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-gold px-7 text-[15px] font-bold text-white shadow-card transition-all duration-150 hover:brightness-105 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
          >
            Post a task
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
          <a
            href={startEarning}
            className="inline-flex h-[52px] w-full max-w-xs items-center justify-center gap-2 rounded-xl border-[1.5px] border-border-strong bg-surface px-7 text-[15px] font-semibold text-foreground transition-colors duration-150 hover:bg-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            Start earning
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}