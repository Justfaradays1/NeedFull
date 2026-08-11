import type { Metadata } from "next";
import Link from "next/link";
import { FaqContent } from "@/components/faq/FaqContent";
import { FloatingSupportButton } from "@/components/ui/FloatingSupportButton";

export const metadata: Metadata = {
  title: "Frequently Asked Questions — NeedFull Help Center",
  description: "Find answers to common questions about NeedFull, posting tasks, payments, trust & safety, and becoming a student runner.",
};

export default function FaqPage() {
  return (
    <>
      <div className="min-h-screen bg-white">
        <header className="border-b border-gray-200 px-4 py-6 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2.5" aria-label="NeedFull home">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-gold" style={{ boxShadow: "inset 0 1px 0 rgba(234,163,37,0.3)" }}>
              <svg viewBox="0 3 36 30" fill="none" className="h-7 w-7">
                <rect x="12" y="24" width="16" height="2.5" rx="1.25" fill="currentColor" opacity="0.18" />
                <rect x="2" y="27.5" width="26" height="3" rx="1.5" fill="currentColor" opacity="0.28" />
                <circle cx="23" cy="9" r="4" fill="currentColor" />
                <path d="M23 13v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M23 19.5l-2.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M23 19.5l2.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M23 15.5l-7 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="8" cy="14" r="4" fill="white" fillOpacity="0.9" />
                <path d="M8 18v8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.9" />
                <path d="M8 24.5l-2 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.9" />
                <path d="M8 24.5l2 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.9" />
                <path d="M8 20l7.5-1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.9" />
                <circle cx="16" cy="21" r="2.5" fill="currentColor" />
                <circle cx="16" cy="21" r="1.5" fill="#1A6B4A" />
              </svg>
            </div>
            <span className="font-display text-xl font-bold text-gray-900">NeedFull</span>
          </Link>
        </header>

        <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center rounded-full bg-brand-light px-3.5 py-1 text-xs font-bold text-brand">Help Center</span>
            <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
              Frequently asked questions
            </h1>
            <p className="mt-3 text-sm text-gray-500 sm:text-base">
              Everything you need to know about NeedFull. Can&apos;t find what you&apos;re looking for? Reach out to our support team.
            </p>
          </div>

          <div className="mt-12">
            <FaqContent />
          </div>

          <div className="mt-16 rounded-2xl border border-card-border bg-surface p-8 text-center shadow-card sm:p-10">
            <h2 className="font-display text-lg font-bold text-gray-900 sm:text-xl">Still need help?</h2>
            <p className="mt-2 text-sm text-gray-500 sm:text-base">
              Our support team is ready to help. Reach out and we&apos;ll get back to you soon.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="mailto:support@needfull.app"
                className="inline-flex items-center gap-2 rounded-[10px] bg-brand px-6 py-3 text-sm font-bold text-white shadow-card transition-all duration-150 hover:bg-brand-mid active:scale-[0.97] sm:text-base"
              >
                Contact Support
              </a>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-[10px] border px-6 py-3 text-sm font-semibold transition-all duration-150 hover:bg-white/10 active:scale-[0.97] sm:text-base"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
              >
                Back to Home
              </Link>
            </div>
          </div>
        </main>
      </div>
      <FloatingSupportButton />
    </>
  );
}
