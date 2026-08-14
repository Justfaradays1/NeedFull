// WHAT: Payment breakdown card — escrow transparency for the runner
// WHY:  Finance deserves its own warm surface (gold-tinted, never gray mud).
//       All payout math derives from the AGREED amount once negotiation exists;
//       the original budget is only the starting point for open tasks.

import { ShieldCheck } from "lucide-react";
import { formatCurrency } from "@/lib/format";

const PLATFORM_FEE_RATE = 0.1;

export function PaymentBreakdown({
  budgetKobo,
  agreedKobo,
  escrowKobo,
}: {
  budgetKobo: number;
  agreedKobo?: number | null;
  escrowKobo: number;
}) {
  const payKobo = agreedKobo ?? budgetKobo;
  const negotiated = !!agreedKobo && agreedKobo !== budgetKobo;
  const runnerReceivesKobo = Math.round(payKobo * (1 - PLATFORM_FEE_RATE));
  const platformFeeKobo = payKobo - runnerReceivesKobo;

  return (
    <section className="rounded-2xl border border-payment-border bg-payment-bg p-4">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-extrabold text-payment-text-strong">
        <ShieldCheck className="h-4 w-4" strokeWidth={2.5} />
        Payment Breakdown
      </p>

      <div className="space-y-2 text-[13px]">
        {negotiated && (
          <div className="flex items-center justify-between rounded-lg bg-payment-bg-strong px-2.5 py-1.5">
            <span className="font-bold text-payment-text">Negotiated amount</span>
            <span className="font-black text-payment-text-strong">
              {formatCurrency(payKobo)}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-foreground-muted">Task budget</span>
          <span
            className={`font-semibold ${
              negotiated ? "text-foreground-muted line-through" : "text-foreground"
            }`}
          >
            {formatCurrency(budgetKobo)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-foreground-muted">Platform fee (10%)</span>
          <span className="text-foreground-muted">− {formatCurrency(platformFeeKobo)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between border-t border-payment-border pt-2.5">
          <span className="font-bold text-foreground">You receive</span>
          <span className="font-display text-lg font-black text-payment-text-strong">
            {formatCurrency(runnerReceivesKobo)}
          </span>
        </div>
      </div>

      <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-foreground-muted">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-location" />
        Your payment is held safely in escrow by NeedFull until the task is
        completed and confirmed — you never chase the poster for money.
      </p>
    </section>
  );
}