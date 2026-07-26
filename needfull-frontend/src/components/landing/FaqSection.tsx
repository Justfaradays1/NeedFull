import Link from "next/link";
import { Accordion } from "@/components/ui/accordion";
import { LANDING_FAQ } from "@/lib/faq-data";

export function FaqSection() {
  return (
    <section id="faq" className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--color-section-alt)' }}>
      {/* Faint grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.15) 1px, transparent 1px)`, backgroundSize: "48px 48px" }} />
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -right-24 top-1/4 h-56 w-56 rounded-full bg-brand/5 blur-3xl" />
      <div className="mx-auto max-w-3xl relative z-10">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-section-label inline-flex items-center rounded-full bg-brand-light px-3.5 py-1 text-brand">FAQ</span>
          <h2 className="mt-4 font-display text-[clamp(1.5rem,4vw,2.25rem)] font-extrabold tracking-tight" style={{ color: 'var(--color-foreground)' }}>
            Frequently asked questions
          </h2>
          <p className="text-section-desc mt-3" style={{ color: 'var(--color-muted)' }}>
            Everything you need to know. Still have questions? Here are the answers to the ones people ask most.
          </p>
        </div>

        <div className="mt-12">
          <Accordion items={LANDING_FAQ} />
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/faq"
            className="inline-flex items-center gap-2 rounded-[10px] border-2 border-brand px-6 py-3 text-sm font-bold text-brand transition-all duration-150 hover:bg-brand hover:text-white active:scale-[0.97] sm:text-base"
          >
            View All FAQs
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </Link>
        </div>

        <div className="mt-16 text-center">
          <div className="rounded-2xl border border-card-border bg-surface p-8 shadow-card sm:p-10">
            <h3 className="font-display text-lg font-bold text-gray-900 sm:text-xl">Still have questions?</h3>
            <p className="mt-2 text-sm text-gray-500 sm:text-base">
              We&apos;re here to help. Reach out and we&apos;ll get back to you within a few hours.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="/chat"
                className="inline-flex items-center gap-2 rounded-[10px] bg-brand px-6 py-3 text-sm font-bold text-white shadow-card transition-all duration-150 hover:bg-brand-mid active:scale-[0.97] sm:text-base"
              >
                Chat with Us
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </a>
              <a
                href="mailto:support@needfull.app"
                className="inline-flex items-center gap-2 rounded-[10px] border px-6 py-3 text-sm font-semibold transition-all duration-150 hover:bg-white/10 active:scale-[0.97] sm:text-base"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
