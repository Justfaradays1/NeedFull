"use client";

import { Info, Wallet, Lock, CheckCircle2, AlertTriangle } from "lucide-react";
import { formatNaira, PLATFORM_FEE_PERCENT } from "./budgetConfig";

interface PaymentSummaryCardProps {
  budgetNaira: number;
  walletBalanceKobo: number;
}

export function PaymentSummaryCard({
  budgetNaira,
  walletBalanceKobo,
}: PaymentSummaryCardProps) {
  const fee = Math.floor(budgetNaira * PLATFORM_FEE_PERCENT / 100);
  const total = budgetNaira + fee;
  const balanceNaira = walletBalanceKobo / 100;
  const hasEnough = total === 0 || balanceNaira >= total;

  if (budgetNaira <= 0) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <p className="text-center text-sm text-gray-400">
          Enter a budget to see payment summary
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200">
      <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-500">
        Payment Summary
      </h3>

      <div className="space-y-2.5">
        <Row label="Task Budget" value={formatNaira(budgetNaira)} />
        <Row
          label={`Platform Fee (${PLATFORM_FEE_PERCENT}%)`}
          value={formatNaira(fee)}
          muted
        />
        <Row label="Escrow Amount" value={formatNaira(budgetNaira)} icon={<Lock className="h-3 w-3 text-brand-text" />} />
        <div className="border-t border-gray-100 pt-2">
          <Row
            label="Total Payment"
            value={formatNaira(total)}
            bold
          />
        </div>
        <div className="border-t border-gray-100 pt-2">
          <Row
            label="Wallet Balance"
            value={formatNaira(balanceNaira)}
            icon={<Wallet className="h-3 w-3 text-gray-400" />}
          />
        </div>
      </div>

      {/* Wallet validation */}
      <div
        className={`mt-4 rounded-xl px-4 py-3 text-sm ${
          hasEnough
            ? "bg-green-50 text-green-700"
            : "bg-red-50 text-red-600"
        }`}
      >
        <div className="flex items-start gap-2">
          {hasEnough ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          )}
          <div>
            {hasEnough ? (
              <>
                <p className="font-semibold">Enough to post this task</p>
                <p className="mt-0.5 text-xs opacity-80">
                  {formatNaira(total)} will be held in escrow
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold">Insufficient Wallet Balance</p>
                <p className="mt-0.5 text-xs opacity-80">
                  You need {formatNaira(total - balanceNaira)} more
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Helper text */}
      <div className="mt-4 space-y-2">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-3 w-3 shrink-0 text-gray-400" />
          <p className="text-[11px] leading-relaxed text-gray-400">
            The platform fee helps cover secure payments, fraud protection,
            customer support, and platform maintenance.
          </p>
        </div>
        <div className="flex items-start gap-2">
          <Lock className="mt-0.5 h-3 w-3 shrink-0 text-brand-text" />
          <p className="text-[11px] leading-relaxed text-gray-500">
            Your task budget will be held safely in NeedFull Escrow and released
            to the NeedRunner only after you confirm that the task has been
            completed successfully.
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
  bold,
  icon,
}: {
  label: string;
  value: string;
  muted?: boolean;
  bold?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={`flex items-center gap-1 text-sm ${muted ? "text-gray-400" : "text-gray-600"}`}>
        {icon}
        {label}
      </span>
      <span
        className={`text-sm tabular-nums ${
          bold ? "font-bold text-gray-900" : "font-semibold text-gray-700"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
