"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  ArrowUpRight,
  ChevronRight,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { useGreeting } from "@/hooks/useGreeting";

interface WalletSummaryCardProps {
  firstName: string;
  balanceKobo: number;
  escrowKobo: number;
  trustScore: number;
  activeTasksCount: number;
  completedCount: number;
  hasEarnings: boolean;
}

// WHAT: Wallet card — greeting + trust badge row, dominant balance with
//       show/hide toggle, transaction history link, Fund Wallet, and a
//       cohesive In Escrow / Active Tasks / Completed stat band.
// WHY: Mobile stays a clean scannable balance card (no 3-stat layout).
//       Desktop uses the full width with one stat band instead of leaving
//       empty horizontal space beside the balance.
export function WalletSummaryCard({
  firstName,
  balanceKobo,
  escrowKobo,
  trustScore,
  activeTasksCount,
  completedCount,
  hasEarnings,
}: WalletSummaryCardProps) {
  const [hidden, setHidden] = useState(false);
  const greeting = useGreeting();
  const clampedTrust = Math.max(0, Math.min(100, Math.round(trustScore)));

  return (
    <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-brand-dark via-brand to-brand-mid p-4 text-on-brand shadow-md sm:p-5">
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-white/5" />

      <div className="relative z-10">
        {/* Greeting row — trust badge stays a flex item beside the greeting */}
        <div className="flex items-center justify-between gap-3">
          <h2 className="min-w-0 truncate text-[17px] font-bold sm:text-lg md:text-[21px] lg:text-[23px]">
            {greeting.text}, {firstName} <span>{greeting.emoji}</span>
          </h2>
          <Link
            href="/profile"
            title={`Trust score ${clampedTrust} out of 100`}
            aria-label={`Trust score ${clampedTrust} out of 100`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-on-brand ring-1 ring-white/20 transition-colors hover:bg-white/20"
          >
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-gold" />
            <span className="hidden lg:inline">Trust</span>
            <span>{clampedTrust}</span>
          </Link>
        </div>

        {/* Balance row — label + history right-aligned; balance dominant */}
        <div className="mt-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-on-brand/60">
              Available Balance
            </p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <p className="truncate text-[26px] font-black leading-none tracking-tight sm:text-3xl lg:text-4xl">
                {hidden ? "₦••••••" : formatCurrency(balanceKobo)}
              </p>
              <button
                onClick={() => setHidden((h) => !h)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-on-brand/15 transition-colors hover:bg-on-brand/25"
                aria-label={hidden ? "Show balance" : "Hide balance"}
              >
                {hidden ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>
          <Link
            href="/wallet"
            className="mt-0.5 inline-flex shrink-0 items-center gap-0.5 text-[11px] font-semibold text-on-brand/70 transition-colors hover:text-on-brand"
          >
            Transaction History
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Actions — Fund Wallet primary; Withdraw only when earnings exist */}
        <div className="mt-3.5 flex flex-wrap items-center gap-2">
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
        </div>

        {/* Escrow — mobile only, part of the fund action row */}
        <Link
          href="/wallet"
          className="mt-3 inline-flex items-center gap-0.5 text-[11px] font-medium text-on-brand/60 transition-colors hover:text-on-brand md:hidden"
        >
          Escrow {formatCurrency(escrowKobo)}
          <ChevronRight className="h-3 w-3" />
        </Link>

        {/* Stat band — desktop/tablet only; one cohesive band, not floating cards */}
        <div className="mt-4 grid grid-cols-3 divide-x divide-white/15 border-t border-white/15 pt-3 max-md:hidden">
          <Link
            href="/wallet"
            className="px-3 text-center transition-colors hover:opacity-90"
          >
            <p className="text-sm font-black leading-none tracking-tight">
              {formatCurrency(escrowKobo)}
            </p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-on-brand/60">
              In Escrow
            </p>
          </Link>
          <Link
            href="/tasks"
            className="px-3 text-center transition-colors hover:opacity-90"
          >
            <p className="text-sm font-black leading-none tracking-tight">
              {activeTasksCount}
            </p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-on-brand/60">
              Active Tasks
            </p>
          </Link>
          <Link
            href="/tasks"
            className="px-3 text-center transition-colors hover:opacity-90"
          >
            <p className="text-sm font-black leading-none tracking-tight">
              {completedCount}
            </p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-on-brand/60">
              Completed
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}