// WHAT: Wallet funding method selection page (route: /wallet/fund)
// WHY: Users choose how to add money to their wallet — manual bank transfer (free), virtual account (~₦30), or card (1.5% + ₦100)
// FUTURE: Add saved payment methods, add quick-amount presets, add promo code entry

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Landmark, CreditCard, Smartphone, Wallet, ArrowLeft } from 'lucide-react';
import { useIsAuthenticated, useAuthUser, useAuthInit } from '@/store';

// WHAT: Convert kobo to naira string for display
// WHY: All amounts stored as kobo integers, display requires naira formatting
function formatNaira(kobo: number): string {
  return (kobo / 100).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// WHAT: Funding method card props
interface FundingCardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: { text: string; gold?: boolean };
  fee?: string;
  feeWarning?: boolean;
  highlight?: string;
}

// WHAT: Single funding method card with icon, badge, description, and fee
// WHY: Consistent, tappable selection card for each funding method
function FundingCard({ href, icon, title, description, badge, fee, feeWarning, highlight }: FundingCardProps) {
  return (
    <Link
      href={href}
      className="tap-target group flex w-full items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all hover:border-brand/30 hover:shadow-md active:scale-[0.98]"
    >
      {/* Icon container */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand">
        {icon}
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {/* Badge row */}
        <div className="flex items-center gap-2 flex-wrap">
          {badge && (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                badge.gold
                  ? 'bg-gold text-white'
                  : 'bg-brand-light text-brand'
              }`}
            >
              {badge.text}
            </span>
          )}
          {highlight && (
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-[11px] font-bold text-green-700">
              {highlight}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-display text-base font-bold text-gray-900 group-hover:text-brand">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm leading-relaxed text-gray-600">
          {description}
        </p>

        {/* Fee disclaimer */}
        {fee && (
          <p className={`text-xs font-medium ${feeWarning ? 'text-amber-600' : 'text-gray-500'}`}>
            {fee}
          </p>
        )}
      </div>

      {/* Arrow indicator */}
      <div className="flex h-12 shrink-0 items-center text-gray-400 transition-colors group-hover:text-brand">
        <ChevronRight className="h-5 w-5" />
      </div>
    </Link>
  );
}

export default function WalletFundPage() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const user = useAuthUser();
  useAuthInit();

  // WHAT: Redirect to login if not authenticated
  // WHY: Protect wallet page from unauthenticated access
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  const balanceKobo = user?.wallet?.balanceKobo ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 safe-all">
      {/* WHAT: Brand green header */}
      <div className="bg-brand px-4 pb-6 pt-4 sm:px-6">
        {/* Back button + title */}
        <div className="mb-4 flex items-center gap-3">
          <Link
            href="/wallet"
            className="tap-target -ml-1 flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-display text-lg font-bold text-white">
            Fund Wallet
          </h1>
        </div>

        {/* Current balance card */}
        <div className="rounded-xl bg-white/10 px-5 py-4 backdrop-blur-sm">
          <p className="text-sm font-medium text-white/70">Current Balance</p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <Wallet className="h-5 w-5 text-gold" />
            <span className="font-display text-3xl font-bold text-white">
              ₦{formatNaira(balanceKobo)}
            </span>
          </div>
        </div>
      </div>

      {/* WHAT: Funding method selection */}
      <div className="space-y-3 px-4 py-6 sm:px-6">
        {/* Section heading */}
        <div className="mb-1">
          <h2 className="font-display text-base font-bold text-gray-900">
            Choose payment method
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Select how you want to add funds
          </p>
        </div>

        {/* WHAT: Manual Bank Transfer — RECOMMENDED, FREE */}
        <FundingCard
          href="/wallet/fund/manual"
          icon={<Landmark className="h-6 w-6" />}
          badge={{ text: 'RECOMMENDED', gold: true }}
          highlight="FREE"
          title="Bank Transfer"
          description="Transfer directly to our account. Free, no charges."
        />

        {/* WHAT: Virtual Account — AUTO-CONFIRM */}
        <FundingCard
          href="/wallet/fund/virtual"
          icon={<CreditCard className="h-6 w-6" />}
          badge={{ text: 'AUTO-CONFIRM' }}
          title="Your Personal Account"
          description="Transfer to your dedicated account number. ~₦30 flat fee."
          fee="~₦30 flat fee applies"
        />

        {/* WHAT: Card Payment — Paystack, instant */}
        <FundingCard
          href="/wallet/fund/card"
          icon={<Smartphone className="h-6 w-6" />}
          title="Debit / Credit Card"
          description="Instant top-up via Paystack. 1.5% + ₦100 fee applies."
          fee="1.5% + ₦100 processing fee"
          feeWarning
        />
      </div>

      {/* WHAT: Info footer */}
      <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
        <div className="rounded-xl bg-brand-light px-4 py-3">
          <p className="text-xs font-medium text-brand-dark">
            All payments are processed securely through PCI-compliant gateways.
            Funds are held in escrow until task completion for your protection.
          </p>
        </div>
      </div>

      {/* WHAT: Bottom safe area spacing for notched devices */}
      <div className="h-safe-bottom" />
    </div>
  );
}
