"use client";

import Link from "next/link";
import { ArrowRight, Check, Users } from "lucide-react";
import { useAuthUser } from "@/store";

const PERKS = [
  "Work when you\u2019re free",
  "Secure payments",
  "Build your reputation",
] as const;

export function BecomeRunnerBanner() {
  const user = useAuthUser();

  if (!user) return null;
  if (user.role === "admin") return null;
  if (user.roles?.includes("runner")) return null;

  return (
    <section className="relative flex min-h-55 max-h-75 overflow-hidden rounded-2xl border border-brand/15 bg-linear-to-br from-brand-dark via-brand to-brand-mid shadow-md md:min-h-0 md:h-60">
      {/* Subtle ambient glow */}
      <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-gold/5 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-white/5 blur-xl" />

      {/* ─── Desktop: side-by-side ─── */}
      <div className="hidden md:flex w-full items-stretch">
        {/* Text content — ~65% */}
        <div className="flex flex-1 flex-col justify-center px-6 py-5">
          <h3 className="font-display text-lg font-extrabold text-on-brand">
            Become a Runner
          </h3>

          <p className="mt-1 max-w-md text-[13px] leading-relaxed text-on-brand/70">
            Earn money by completing tasks around your campus and community.
          </p>

          <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1">
            {PERKS.map((perk) => (
              <span
                key={perk}
                className="flex items-center gap-1.5 text-[12px] text-on-brand/80"
              >
                <Check className="h-3 w-3 shrink-0 text-gold" />
                {perk}
              </span>
            ))}
          </div>

          <div className="mt-3">
            <Link
              href="/become-runner"
              className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-4 py-2 text-[13px] font-bold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.97]"
            >
              Become a Runner
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Image area — ~35% */}
        <div className="relative w-[35%] shrink-0 overflow-hidden">
          {/* Left-edge gradient fade */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-1/2 bg-linear-to-r from-brand-dark to-transparent" />

          <div
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: 'url("/images/runner-placeholder.jpg")' }}
            role="img"
            aria-label="Student runner"
          >
            <div
              className="flex h-full w-full items-center justify-center bg-linear-to-br from-brand/70 to-brand-dark/80 bg-cover bg-center"
              style={{
                backgroundImage:
                  "radial-gradient(ellipse at 30% 50%, rgba(234,163,37,0.1) 0%, transparent 60%)",
              }}
            >
              <div className="flex flex-col items-center gap-2 p-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                  <Users className="h-6 w-6 text-gold" />
                </div>
                <p className="text-xs font-medium text-on-brand/60">
                  Student Runner
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Mobile: stacked ─── */}
      <div className="flex md:hidden flex-col">
        {/* Image strip */}
        <div className="relative h-28 overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-brand-dark via-brand-dark/60 to-transparent z-10" />
          <div
            className="h-full w-full bg-cover bg-position-[center_35%]"
            style={{ backgroundImage: 'url("/images/runner-placeholder.jpg")' }}
            role="img"
            aria-label="Student runner"
          >
            <div
              className="flex h-full w-full items-center justify-center bg-linear-to-br from-brand/60 to-brand-dark/70"
              style={{
                backgroundImage:
                  "radial-gradient(ellipse at 30% 50%, rgba(234,163,37,0.08) 0%, transparent 60%)",
              }}
            >
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
                  <Users className="h-5 w-5 text-gold" />
                </div>
                <p className="text-xs font-medium text-on-brand/70">
                  Student Runner
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-3 space-y-2.5">
          <h3 className="font-display text-base font-extrabold text-on-brand">
            Become a Runner
          </h3>

          <p className="text-[13px] leading-relaxed text-on-brand/70">
            Earn money on your own schedule.
          </p>

          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {PERKS.map((perk) => (
              <span
                key={perk}
                className="flex items-center gap-1.5 text-[12px] text-on-brand/80"
              >
                <Check className="h-3 w-3 shrink-0 text-gold" />
                {perk}
              </span>
            ))}
          </div>

          <Link
            href="/become-runner"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-4 py-2 text-[13px] font-bold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.97]"
          >
            Become a Runner
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
