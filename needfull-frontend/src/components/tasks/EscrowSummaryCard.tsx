'use client';

import { ShieldCheck, Info } from 'lucide-react';

interface EscrowSummaryCardProps {
  budgetNaira: number;
  feePercent: number;
  walletBalanceKobo?: number;
}

export function EscrowSummaryCard({ budgetNaira, feePercent, walletBalanceKobo }: EscrowSummaryCardProps) {
  const budgetKobo = Math.round(budgetNaira * 100);
  const feeKobo = Math.floor((budgetKobo * feePercent) / 100);
  const runnerReceivesNaira = (budgetKobo - feeKobo) / 100;
  const feeNaira = feeKobo / 100;

  if (budgetNaira <= 0) return null;

  return (
    <div className="rounded-2xl border border-card-border bg-surface p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-brand-text" />
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
          Escrow summary
        </span>
      </div>

      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Task budget</span>
          <span className="font-semibold text-gray-900">₦{budgetNaira.toLocaleString()}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Locked in escrow</span>
          <span className="font-semibold text-brand-text">₦{budgetNaira.toLocaleString()}</span>
        </div>

        <hr className="border-border-subtle" />

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1">
            <span className="text-gray-500">Platform fee ({feePercent}%)</span>
            <Info className="h-3 w-3 text-gray-400" />
          </div>
          <span className="text-gray-500">—₦{feeNaira.toLocaleString()}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Runner receives</span>
          <span className="font-semibold text-gray-900">
            ₦{runnerReceivesNaira.toLocaleString()}
          </span>
        </div>
      </div>

      {walletBalanceKobo !== undefined && (
        <>
          <hr className="border-border-subtle" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Wallet balance</span>
            <span className="font-semibold text-gray-900">
              ₦{(walletBalanceKobo / 100).toLocaleString()}
            </span>
          </div>
          <p className={`mt-1.5 text-xs ${walletBalanceKobo >= budgetNaira * 100 ? 'text-brand-text' : 'text-danger'}`}>
            {walletBalanceKobo >= budgetNaira * 100
              ? 'Enough ✓'
              : `Insufficient — top up before posting`}
          </p>
        </>
      )}

      <div className="mt-3 rounded-xl bg-brand-light/20 px-3 py-2">
        <p className="text-[11px] leading-relaxed text-gray-600">
          Platform fee is deducted from the runner&apos;s payout upon completion. You only
          pay the task budget into escrow.
        </p>
      </div>
    </div>
  );
}
