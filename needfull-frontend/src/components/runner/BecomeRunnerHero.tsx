"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Shield,
  Clock,
  Award,
  Star,
  Zap,
  ChevronDown,
} from "lucide-react";

const BENEFITS = [
  {
    icon: Clock,
    label: "Earn on your own schedule",
    desc: "Work when classes let out",
  },
  { icon: Award, label: "Verified badge", desc: "Stand out as trusted" },
  {
    icon: Shield,
    label: "Escrow-protected payments",
    desc: "Paid only when done",
  },
  { icon: Star, label: "Priority task matching", desc: "First pick of tasks" },
] as const;

interface Props {
  onStart: () => void;
}

export function BecomeRunnerHero({ onStart }: Props) {
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoaded(true);
  }, []);

  return (
    <section
      ref={ref}
      className="relative min-h-[90dvh] overflow-hidden bg-linear-to-b from-brand-dark via-brand to-brand-mid px-5 pb-16 pt-12 md:pb-20 md:pt-16"
    >
      {/* ─── Background decorative layers ─── */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-125 w-125 rounded-full bg-gold/5 blur-3xl" />
        <div className="absolute -right-32 bottom-0 h-100 w-100 rounded-full bg-white/3 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-75 w-75 -translate-x-1/2 rounded-full bg-brand-mid/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(234,163,37,0.08)_0%,transparent_60%)]" />
      </div>

      <div className="relative mx-auto max-w-5xl">
        {/* ─── Badge ─── */}
        <div
          className={`mx-auto mb-6 w-fit rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white/80 backdrop-blur-md transition-all duration-700 ${
            loaded ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-gold shadow-sm shadow-gold/50" />
          Now open at <span className="font-bold text-white">FUOYE</span>
        </div>

        {/* ─── Heading ─── */}
        <h1
          className={`text-center font-display text-[clamp(2rem,7vw,3.75rem)] font-extrabold leading-[1.08] tracking-tight text-white transition-all duration-700 delay-100 ${
            loaded ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
        >
          Become a <span className="text-gold">NeedRunner</span>
        </h1>

        {/* ─── Subtitle ─── */}
        <p
          className={`mx-auto mt-4 max-w-xl text-center text-base leading-relaxed text-white/65 transition-all duration-700 delay-200 md:text-lg ${
            loaded ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
        >
          Join our trusted network of verified runners. Complete errands, earn
          money, and build your reputation.
        </p>

        {/* ─── Benefit cards ─── */}
        <div className="mx-auto mt-10 grid max-w-2xl grid-cols-2 gap-3 md:gap-4">
          {BENEFITS.map((ben, i) => (
            <div
              key={ben.label}
              className={`group rounded-2xl border border-white/10 bg-white/6 px-4 py-4 backdrop-blur-sm transition-all duration-500 hover:border-white/20 hover:bg-white/10 hover:shadow-lg ${
                loaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
              }`}
              style={{ transitionDelay: `${300 + i * 100}ms` }}
            >
              <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-gold/15 text-gold transition-all duration-300 group-hover:bg-gold/25 group-hover:scale-105">
                <ben.icon className="h-4.5 w-4.5" />
              </div>
              <p className="text-sm font-bold text-white">{ben.label}</p>
              <p className="mt-0.5 text-xs text-white/50">{ben.desc}</p>
            </div>
          ))}
        </div>

        {/* ─── Earnings badge ─── */}
        <div
          className={`mx-auto mt-8 flex w-fit items-center gap-3 rounded-2xl border border-gold/20 bg-linear-to-r from-gold/10 to-gold/5 px-5 py-3 backdrop-blur-sm transition-all duration-700 delay-500 ${
            loaded ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/20">
            <Zap className="h-5 w-5 text-gold" />
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-gold/80 uppercase">
              Earn up to
            </p>
            <p className="text-lg font-black text-gold leading-none">
              ₦15,000+ daily
            </p>
          </div>
        </div>

        {/* ─── CTA buttons ─── */}
        <div
          className={`mx-auto mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center transition-all duration-700 delay-600 ${
            loaded ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
        >
          <button
            type="button"
            onClick={onStart}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gold px-8 py-3.5 text-[15px] font-bold text-white shadow-xl shadow-gold/30 transition-all duration-200 hover:brightness-110 hover:shadow-gold/40 active:scale-[0.97]"
          >
            Start Application
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border-2 border-white/30 bg-white/5 px-8 py-3.5 text-[15px] font-semibold text-white/90 backdrop-blur-sm transition-all duration-200 hover:bg-white/10 hover:text-white active:scale-[0.97]"
          >
            Learn More
          </button>
        </div>

        {/* ─── Scroll indicator ─── */}
        <div className="mx-auto mt-14 flex animate-bounce flex-col items-center gap-1 text-white/30">
          <span className="text-[10px] font-medium tracking-wider uppercase">
            Scroll to apply
          </span>
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>
    </section>
  );
}
