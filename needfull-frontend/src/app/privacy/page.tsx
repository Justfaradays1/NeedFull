import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — NeedFull",
};

export default function PrivacyPage() {
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
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Privacy Policy</h1>
        <p className="mb-8 text-sm text-gray-500">Last updated: July 2026</p>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
          <section>
            <h2 className="text-lg font-bold text-gray-900">1. Information We Collect</h2>
            <p>
              We collect information you provide when creating an account: your name, email address, phone number, university, department, and hostel. We also collect task listings, messages, and transaction data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide and improve the NeedFull platform</li>
              <li>To facilitate task matching and escrow transactions</li>
              <li>To verify your identity and prevent fraud</li>
              <li>To send notifications about tasks and payments</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">3. Information Sharing</h2>
            <p>
              We do not sell your personal information. We may share it with:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Other users as necessary for task completion (e.g., your name and hostel to an Agent)</li>
              <li>Service providers who help operate the platform (hosting, analytics)</li>
              <li>Law enforcement when required by law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">4. Data Security</h2>
            <p>
              We use industry-standard encryption and security practices to protect your data. Passwords are hashed using bcrypt with a cost factor of 12. However, no method of electronic storage is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">5. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active. If you delete your account, we anonymise or delete your personal data within 30 days, except where we are required to retain it for legal reasons.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">6. Your Rights</h2>
            <p>
              You can access, update, or delete your personal information through your account settings. You can also contact us to request a copy of your data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">7. Contact</h2>
            <p>
              For questions about this policy, contact us at{" "}
              <a href="mailto:support@needfull.app" className="font-semibold text-brand hover:underline">support@needfull.app</a>.
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
