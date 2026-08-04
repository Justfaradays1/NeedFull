"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Lock,
  Plus,
  ArrowUpRight,
  ChevronRight,
  Wallet as WalletIcon,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";

interface WalletSummaryCardProps {
  balanceKobo: number;
  escrowKobo: number;
  hasEarnings: boolean;
}

export function WalletSummaryCard({
  balanceKobo,
  escrowKobo,
  hasEarnings,
}: WalletSummaryCardProps) {
  const [hidden, setHidden] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-brand-dark via-brand to-brand-mid p-4 text-on-brand shadow-md sm:p-5">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute bottom-12 right-24 h-20 w-20 rounded-full bg-white/[0.03]" />

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WalletIcon className="h-4 w-4 text-on-brand/60" />
            <span className="text-xs font-medium text-on-brand/60">
              Available Balance
            </span>
          </div>
          <button
            onClick={() => setHidden((h) => !h)}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-on-brand/15"
            aria-label={hidden ? "Show balance" : "Hide balance"}
          >
            {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        </div>

        <p className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
          {hidden ? "••••••" : formatCurrency(balanceKobo)}
        </p>
        <p className="text-xs text-on-brand/50">Escrow Balance</p>

        {escrowKobo > 0 && (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-on-brand/10 px-2.5 py-1.5">
            <Lock className="h-3 w-3 text-on-brand/70" />
            <span className="text-xs text-on-brand/80">
              {formatCurrency(escrowKobo)} in escrow
            </span>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Link
            href="/wallet/fund"
            className="inline-flex items-center gap-1.5 rounded-lg bg-on-brand px-3.5 py-1.5 text-xs font-bold text-brand shadow-sm transition-all hover:brightness-95 active:scale-[0.97]"
          >
            <Plus className="h-3.5 w-3.5" />
            Fund Wallet
          </Link>

          {hasEarnings ? (
            <Link
              href="/wallet/withdraw"
              className="inline-flex items-center gap-1.5 rounded-lg bg-on-brand/15 px-3.5 py-1.5 text-xs font-bold text-on-brand transition-all hover:bg-on-brand/25 active:scale-[0.97]"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              Withdraw
            </Link>
          ) : (
            <span
              className="group relative inline-flex items-center gap-1.5 rounded-lg bg-on-brand/10 px-3.5 py-1.5 text-xs font-medium text-on-brand/50 cursor-not-allowed"
              title="Withdraw available after completing your first paid task"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              Withdraw
            </span>
          )}

          <Link
            href="/wallet"
            className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-on-brand/60 hover:text-on-brand transition-colors"
          >
            <span className="hidden sm:inline">Transaction History</span>
            <span className="sm:hidden">History</span>
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
