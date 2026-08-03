"use client";

import { useState, useEffect, useRef } from "react";

// WHAT: Supporting marketing panel for auth pages (right side, desktop only)
// WHY: Reinforces the NeedFull story without competing with the login form.
//      Deliberately calm: one gentle crossfade, restrained color, and text
//      that reads in BOTH themes (fixed brand gradient + white text)

const previews = [
  { tag: "Laundry", note: "Temi F. just earned ₦1,500", emoji: "🧺" },
  { tag: "Printing", note: "50 pages of notes done in 40 min", emoji: "🖨️" },
  { tag: "Food Delivery", note: "Jollof run delivered at Aroma Cafe", emoji: "🍲" },
  { tag: "Tech Help", note: "Laptop setup finished before class", emoji: "💻" },
  { tag: "Cleaning", note: "Hostel clean-up rated 4.9★", emoji: "🧹" },
] as const;

const highlights = [
  "Secure escrow payments",
  "Verified NeedRunners",
  "Fast campus delivery",
  "Trusted student marketplace",
] as const;

const stats = [
  { value: "2,400+", label: "Tasks completed" },
  { value: "1,800+", label: "Students helped" },
  { value: "850+", label: "Active runners" },
  { value: "₦4.2M", label: "Money earned" },
] as const;

export function AuthBranding() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % previews.length);
    }, 6000);
    return () => clearInterval(id);
  }, []);

  const preview = previews[index];

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden"
      aria-hidden="true"
    >
      {/* Deep brand background (identical in light & dark) */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-dark via-brand to-brand-mid" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(234,163,37,0.10)_0%,transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_85%,rgba(255,255,255,0.05)_0%,transparent_50%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-gold/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-white/5 blur-3xl" />

      {/* ─── Logo ─── */}
      <div className="relative z-10 shrink-0 p-8 lg:p-10">
        <a
          href="/"
          className="inline-flex items-center gap-2.5"
          aria-label="NeedFull home"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-gold backdrop-blur-sm">
            <svg viewBox="0 3 36 30" fill="none" className="h-6 w-6">
              <rect x="12" y="24" width="16" height="2.5" rx="1.25" fill="currentColor" opacity="0.18" />
              <rect x="2" y="27.5" width="26" height="3" rx="1.5" fill="currentColor" opacity="0.28" />
              <circle cx="23" cy="9" r="4" fill="currentColor" />
              <path d="M23 13v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M23 19.5l-2.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M23 19.5l2.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="8" cy="14" r="4" fill="white" fillOpacity="0.9" />
              <path d="M8 18v8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.9" />
              <path d="M8 20l7.5-1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.9" />
              <circle cx="16" cy="21" r="2.5" fill="currentColor" />
              <circle cx="16" cy="21" r="1.5" fill="#1A6B4A" />
            </svg>
          </div>
          <span className="font-display text-lg font-bold text-white">
            NeedFull
          </span>
        </a>
      </div>

      {/* ─── Showcase ─── */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-8 lg:px-12">
        <div className="flex w-full max-w-md flex-col gap-6">
          {/* Headline + value proposition */}
          <div>
            <h2 className="font-display text-[32px] font-extrabold leading-[1.1] tracking-tight text-white lg:text-4xl">
              Your campus.
              <br />
              Your hustle.
              <br />
              <span className="text-gold">Real money.</span>
            </h2>
            <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-white/70">
              Post a task or complete one nearby. NeedFull holds every payment in
              escrow until the job is done right.
            </p>
          </div>

          {/* Live task preview — single gentle crossfade */}
          <div>
            <div className="mb-2.5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
              </span>
              Live on campus
            </div>
            <div
              key={index}
              className="animate-fade-in rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm"
              style={{ animationDuration: "0.5s" }}
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-lg">
                  {preview.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold text-white">
                    {preview.tag}
                  </p>
                  <p className="truncate text-[13px] text-white/60">
                    {preview.note}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-gold px-2.5 py-1 text-[10px] font-bold text-white">
                  Live
                </span>
              </div>
            </div>
          </div>

          {/* Platform highlights */}
          <div className="grid grid-cols-2 gap-2.5">
            {highlights.map((h) => (
              <div
                key={h}
                className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold">
                  <svg viewBox="0 0 20 20" fill="none" className="h-3 w-3">
                    <path
                      d="M4 10.5l4 4 8-9"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="text-[13px] font-medium text-white/85">
                  {h}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Stats (understated) ─── */}
      <div className="relative z-10 shrink-0 px-8 pb-8 lg:px-10 lg:pb-10">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-lg font-extrabold text-white lg:text-xl">
                {s.value}
              </p>
              <p className="mt-0.5 text-[10px] font-medium text-white/55">
                {s.label}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-white/45">
          Fast. Trusted. Mobile-first on any network.
        </p>
      </div>
    </div>
  );
}