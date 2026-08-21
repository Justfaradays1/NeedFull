import Link from "next/link";
import { Accordion } from "@/components/ui/accordion";
import { LANDING_FAQ } from "@/lib/faq-data";

export function FaqSection() {
  return (
    <section id="faq" className="border-b border-border-subtle bg-background">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Frequently asked questions
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-muted sm:text-base">
          The questions people ask most before their first task.
        </p>

        <div className="mt-10">
          <Accordion items={LANDING_FAQ} />
        </div>

        <div className="mt-10">
          <Link
            href="/faq"
            className="inline-flex items-center gap-2 rounded-xl border-[1.5px] border-brand px-6 py-3 text-sm font-bold text-brand-text transition-colors duration-150 hover:bg-brand hover:text-on-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            View all FAQs
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </Link>
        </div>
      </div>
    </section>
  );
}