"use client";

import { Info } from "lucide-react";

interface PurchaseBudgetCardProps {
  estimatedItemCostNaira: number;
  runnerFeeNaira: number;
  platformFeeNaira: number;
  maxAdditionalSpendingNaira: number;
}

export default function PurchaseBudgetCard({
  estimatedItemCostNaira,
  runnerFeeNaira,
  platformFeeNaira,
  maxAdditionalSpendingNaira,
}: PurchaseBudgetCardProps) {
  const total = estimatedItemCostNaira + runnerFeeNaira + platformFeeNaira;

  return (
    <div className="space-y-3 rounded-2xl bg-white p-4 shadow-card border border-card-border">
      <h3 className="text-sm font-bold text-gray-900">Budget Breakdown</h3>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Estimated Item Cost</span>
          <span className="font-semibold text-gray-900">
            ₦{estimatedItemCostNaira.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Runner Fee</span>
          <span className="font-semibold text-gray-900">
            ₦{runnerFeeNaira.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Platform Fee</span>
          <span className="font-medium text-brand-text">
            ₦{platformFeeNaira.toLocaleString()}
          </span>
        </div>
        <hr className="border-gray-100" />
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-gray-900">Total</span>
          <span className="text-lg font-bold text-gold">
            ₦{total.toLocaleString()}
          </span>
        </div>
      </div>

      {maxAdditionalSpendingNaira > 0 && (
        <div className="flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
          <p className="text-[11px] leading-relaxed text-amber-800">
            Runner can spend up to ₦
            {maxAdditionalSpendingNaira.toLocaleString()} above estimate without
            approval.
          </p>
        </div>
      )}

      <div className="flex items-start gap-1.5 rounded-lg bg-brand-light/30 px-3 py-2">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-text" />
        <p className="text-[11px] leading-relaxed text-gray-600">
          Full amount locked in NeedFull Escrow. Funds released to runner only
          after successful delivery confirmation.
        </p>
      </div>
    </div>
  );
}
