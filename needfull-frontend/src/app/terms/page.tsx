import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — NeedFull",
};

export default function TermsPage() {
  return (
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
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Terms of Service</h1>
        <p className="mb-8 text-sm text-gray-500">Last updated: July 2026</p>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
          <section>
            <h2 className="text-lg font-bold text-gray-900">1. Acceptance of Terms</h2>
            <p>
              By creating a NeedFull account, you agree to be bound by these Terms of Service. If you do not agree, do not use the platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">2. Description of Service</h2>
            <p>
              NeedFull is a campus economy platform that connects students who need tasks done (Seekers) with students who want to earn money (Agents). We act as a trusted intermediary, holding funds in escrow until tasks are completed satisfactorily.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">3. User Eligibility</h2>
            <p>
              You must be a registered student at a tertiary institution to use NeedFull. You must be at least 16 years old. You are responsible for maintaining the confidentiality of your account credentials.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">4. Prohibited Activities</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Posting tasks that violate Nigerian law or university policies</li>
              <li>Creating fake tasks or fraudulent listings</li>
              <li>Attempting to complete the escrow flow outside the platform</li>
              <li>Harassing, threatening, or abusing other users</li>
              <li>Creating multiple accounts to evade restrictions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">5. Fees</h2>
            <p>
              Creating an account and posting tasks is free. NeedFull charges a service fee on completed tasks, disclosed at the time of task creation. Fees are non-refundable.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">6. Dispute Resolution</h2>
            <p>
              If a dispute arises between a Seeker and an Agent, NeedFull may mediate. Our decision is final and binding. We reserve the right to release escrow funds to either party based on available evidence.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">7. Limitation of Liability</h2>
            <p>
              NeedFull is not liable for any indirect, incidental, or consequential damages arising from your use of the platform. Our total liability is limited to the fees you have paid us in the 30 days preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">8. Changes to Terms</h2>
            <p>
              We may update these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.
            </p>
          </section>
        </div>

        <div className="mt-12 border-t border-gray-200 pt-6 text-center">
          <Link href="/" className="text-sm font-semibold text-brand hover:underline">
            Back to NeedFull
          </Link>
        </div>
      </main>
    </div>
  );
}
