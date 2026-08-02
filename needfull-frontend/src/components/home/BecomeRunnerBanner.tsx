"use client";

import Link from "next/link";
import {
  ArrowRight,
  Clock,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  Wallet,
} from "lucide-react";
import { useAuthUser } from "@/store";

// WHAT: "Start Earning" promotional card for the dashboard and feed
// WHY: Benefit-driven CTA with clean hierarchy, restrained color and rich trust
//      signals — feels like part of the product, not an ad

const STATS = [
  {
    icon: Wallet,
    value: "₦1,850",
    label: "Avg. payout",
  },
  {
    icon: MapPin,
    value: "12 tasks",
    label: "Nearby now",
  },
  {
    icon: Clock,
    value: "45 min",
    label: "Avg. completion",
  },
] as const;

export function BecomeRunnerBanner() {
  const user = useAuthUser();

  if (!user) return null;
  if (user.role === "admin") return null;
  if (user.roles?.includes("runner")) return null;

  return (
    <section className="group relative overflow-hidden rounded-2xl border border-card-border bg-surface shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lifted">
      {/* ─── Subtle ambient decoration (no illustration) ─── */}
      <div className="pointer-events-none absolute -left-12 -top-12 h-40 w-40 rounded-full bg-brand/10 blur-2xl transition-opacity duration-300 group-hover:opacity-70" />
      <div className="pointer-events-none absolute -bottom-14 -right-10 h-44 w-44 rounded-full bg-gold/10 blur-2xl" />
      <div className="pointer-events-none absolute right-6 top-5 text-gold/30">
        <Sparkles className="h-6 w-6" />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent" />

      <div className="relative z-10 flex flex-col gap-6 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
        {/* ─── Copy ─── */}
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-gold-light px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-gold-dark">
            <Sparkles className="h-3 w-3" />
            For students who earn
          </div>
          <h3 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-[28px]">
            Start Earning
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300 sm:text-[15px]">
            Complete nearby tasks and{" "}
            <span className="font-bold text-brand-text">earn</span> extra income
            around your <span className="font-bold text-brand-text">campus</span>{" "}
            with <span className="font-bold text-brand-text">NeedFull</span>.
          </p>

          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <Link
              href="/become-runner"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-6 py-3 text-sm font-bold text-white shadow-md shadow-gold/25 transition-all duration-150 hover:brightness-105 hover:shadow-lg hover:shadow-gold/30 active:scale-[0.97]"
            >
              Start Earning
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/faq"
              className="inline-flex items-center justify-center gap-2 rounded-xl border-[1.5px] border-brand/25 px-6 py-3 text-sm font-semibold text-brand-text transition-all duration-150 hover:border-brand/50 hover:bg-brand-light/40 active:scale-[0.97]"
            >
              How it Works
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-text" />
              Escrow-protected payouts
            </span>
            <span className="inline-flex items-center gap-1">
              <Star className="h-3.5 w-3.5 text-gold" />
              4.8 avg. runner rating
            </span>
          </div>
        </div>

        {/* ─── Trust / earnings cluster ─── */}
        <div className="lg:w-72 lg:shrink-0">
          <div className="rounded-xl border border-card-border bg-brand-light/20 p-4 transition-colors duration-300 group-hover:bg-brand-light/30">
            <p className="font-display text-2xl font-extrabold tracking-tight text-brand-text">
              ₦250,000+
            </p>
            <p className="mt-0.5 text-xs font-medium text-gray-600 dark:text-gray-300">
              earned by students this week
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {STATS.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="rounded-lg border border-card-border bg-surface px-2 py-2 text-center"
                  >
                    <Icon className="mx-auto h-3.5 w-3.5 text-gold" />
                    <p className="mt-1 text-[11px] font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                    <p className="text-[9px] leading-tight text-gray-500 dark:text-gray-400">
                      {stat.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
