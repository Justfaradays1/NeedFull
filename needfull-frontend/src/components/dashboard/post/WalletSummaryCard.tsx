"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  ArrowUpRight,
  ChevronRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { useGreeting } from "@/hooks/useGreeting";

interface WalletSummaryCardProps {
  firstName: string;
  balanceKobo: number;
  escrowKobo: number;
  hasEarnings: boolean;
}

// WHAT: Compact wallet card — greeting, balance, and the primary wallet action
//       in a single component. The greeting lives INSIDE the card, so Home has
//       no separate hero section above it.
export function WalletSummaryCard({
  firstName,
  balanceKobo,
  escrowKobo,
  hasEarnings,
}: WalletSummaryCardProps) {
  const [hidden, setHidden] = useState(false);
  const greeting = useGreeting();

  return (
    <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-brand-dark via-brand to-brand-mid p-4 text-on-brand shadow-md">
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-white/5" />

      <div className="relative z-10">
        {/* Greeting — inside the card, calm and secondary to the balance */}
        <p className="truncate text-[15px] font-semibold text-on-brand/90">
          {greeting.text}, {firstName} <span>{greeting.emoji}</span>
        </p>

        <div className="mt-3.5 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[11px] font-medium text-on-brand/60">
              Available Balance
            </span>
            <p className="mt-0.5 truncate text-[26px] font-black leading-none tracking-tight sm:text-3xl">
              {hidden ? "₦••••••" : formatCurrency(balanceKobo)}
            </p>
          </div>
          <button
            onClick={() => setHidden((h) => !h)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-on-brand/15"
            aria-label={hidden ? "Show balance" : "Hide balance"}
          >
            {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Link
            href="/wallet/fund"
            className="inline-flex items-center gap-1.5 rounded-lg bg-on-brand px-3.5 py-2 text-xs font-bold text-brand shadow-sm transition-all hover:brightness-95 active:scale-[0.97]"
          >
            <Plus className="h-3.5 w-3.5" />
            Fund Wallet
          </Link>

          {hasEarnings ? (
            <Link
              href="/wallet/withdraw"
              className="inline-flex items-center gap-1.5 rounded-lg bg-on-brand/15 px-3.5 py-2 text-xs font-bold text-on-brand transition-all hover:bg-on-brand/25 active:scale-[0.97]"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              Withdraw
            </Link>
          ) : null}

          <Link
            href="/wallet"
            className="ml-auto inline-flex min-w-0 max-w-full items-center gap-0.5 text-[11px] font-medium text-on-brand/60 transition-colors hover:text-on-brand"
          >
            <span className="hidden truncate sm:inline">Escrow {formatCurrency(escrowKobo)}</span>
            <span className="truncate sm:hidden">Escrow {formatCurrency(escrowKobo)}</span>
            <ChevronRight className="h-3 w-3 shrink-0" />
          </Link>
        </div>
      </div>
    </div>
  );
}