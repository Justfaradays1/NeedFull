// WHAT: Final action — one clear path into the product
// WHY: Ends the page with the single most important next step instead of
//      repeating feature claims.

"use client";

import { ArrowRight } from "lucide-react";
import { useAuthDestinations } from "./authDestinations";

export function CtaSection() {
  const { postTask } = useAuthDestinations();

  return (
    <section id="cta" className="border-t border-border-subtle bg-surface-primary">
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-24">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Ready to get something done?
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-muted sm:text-base">
          Post your first task or set up your profile and start earning.
          Your payment is protected either way.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href={postTask}
            className="inline-flex h-[52px] w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-gold px-7 text-[15px] font-bold text-white shadow-card transition-all duration-150 hover:brightness-105 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
          >
            Post a task
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
          <a
            href="/register"
            className="inline-flex h-[52px] w-full max-w-xs items-center justify-center rounded-xl border-[1.5px] border-border-strong bg-surface px-7 text-[15px] font-semibold text-foreground transition-colors duration-150 hover:bg-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            Create an account
          </a>
        </div>
      </div>
    </section>
  );
}