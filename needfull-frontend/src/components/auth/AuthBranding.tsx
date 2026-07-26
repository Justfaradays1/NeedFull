"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface MicroCard {
  text: string;
  delay: string;
}

interface TaskScenario {
  category: string;
  title: string;
  reward: string;
  location: string;
  due: string;
  runnerInitials: string;
  runnerName: string;
  runnerRating: string;
  color: string;
  badgeBg: string;
  microCards: MicroCard[];
}

const scenarios: TaskScenario[] = [
  {
    category: "Laundry",
    title: "Wash and iron 5 clothes before 6pm",
    reward: "₦1,500",
    location: "Female Hostel Block B",
    due: "Due in 2 hours",
    runnerInitials: "TF",
    runnerName: "Temi F.",
    runnerRating: "4.9",
    color: "from-amber-500 to-amber-400",
    badgeBg: "bg-brand-light text-brand",
    microCards: [
      { text: "Just earned ₦1,350", delay: "0.5s" },
      { text: "★ 4.9 · 32 reviews", delay: "1.2s" },
      { text: "2 students applied", delay: "2.0s" },
      { text: "27 Active Tasks Nearby", delay: "0.8s" },
    ],
  },
  {
    category: "Food Delivery",
    title: "Pick up Jollof Rice from Aroma Cafe",
    reward: "₦800",
    location: "Aroma Cafe → Science Faculty",
    due: "Due in 45 min",
    runnerInitials: "KO",
    runnerName: "Kola O.",
    runnerRating: "4.7",
    color: "from-orange-500 to-orange-400",
    badgeBg: "bg-orange-100 text-orange-700",
    microCards: [
      { text: "Task completed ✓", delay: "0.3s" },
      { text: "New Job Posted", delay: "1.5s" },
      { text: "★★★★★ New review", delay: "1.0s" },
      { text: "12 delivery tasks open", delay: "2.2s" },
    ],
  },
  {
    category: "Printing",
    title: "Print 50 pages of lecture notes",
    reward: "₦500",
    location: "Library Printing Room",
    due: "Due by tomorrow 9am",
    runnerInitials: "AM",
    runnerName: "Amina M.",
    runnerRating: "4.8",
    color: "from-blue-500 to-blue-400",
    badgeBg: "bg-blue-100 text-blue-700",
    microCards: [
      { text: "Just earned ₦450", delay: "0.7s" },
      { text: "✓ Verified Runner", delay: "1.8s" },
      { text: "8 printing tasks nearby", delay: "0.5s" },
      { text: "65 tasks completed", delay: "2.5s" },
    ],
  },
  {
    category: "Shopping",
    title: "Buy groceries from Campus Market",
    reward: "₦2,000",
    location: "Campus Market → Block C",
    due: "Due in 3 hours",
    runnerInitials: "CJ",
    runnerName: "Chidi J.",
    runnerRating: "5.0",
    color: "from-green-500 to-green-400",
    badgeBg: "bg-green-100 text-green-700",
    microCards: [
      { text: "Just earned ₦1,800", delay: "0.4s" },
      { text: "★ 5.0 · 48 reviews", delay: "1.1s" },
      { text: "3 runners available", delay: "0.9s" },
      { text: "New Job Posted", delay: "2.0s" },
    ],
  },
  {
    category: "Academic",
    title: "Proofread my 300-level essay",
    reward: "₦1,200",
    location: "Arts & Humanities Block",
    due: "Due in 5 hours",
    runnerInitials: "SE",
    runnerName: "Sade E.",
    runnerRating: "4.6",
    color: "from-purple-500 to-purple-400",
    badgeBg: "bg-purple-100 text-purple-700",
    microCards: [
      { text: "Just earned ₦1,080", delay: "1.3s" },
      { text: "Task completed ✓", delay: "0.6s" },
      { text: "42 students helped", delay: "1.7s" },
      { text: "★★★★★ New review", delay: "0.3s" },
    ],
  },
  {
    category: "Transport",
    title: "Drive me to the park this evening",
    reward: "₦1,000",
    location: "Main Gate → City Park",
    due: "Due at 6pm",
    runnerInitials: "IB",
    runnerName: "Ibrahim B.",
    runnerRating: "4.8",
    color: "from-cyan-500 to-cyan-400",
    badgeBg: "bg-cyan-100 text-cyan-700",
    microCards: [
      { text: "✓ Verified Runner", delay: "0.9s" },
      { text: "Just earned ₦900", delay: "1.4s" },
      { text: "5 transport requests", delay: "0.7s" },
      { text: "⭐ 4.8 · 56 reviews", delay: "2.1s" },
    ],
  },
];

const marketingMessages = [
  "Turn your free time into income.",
  "Your campus. Your marketplace.",
  "Help others. Earn more.",
  "Every task is an opportunity.",
  "You're never alone on campus.",
];

export function AuthBranding() {
  const [current, setCurrent] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const msgIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scenario = scenarios[current];

  const startRotation = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % scenarios.length);
    }, 7000);
  }, []);

  useEffect(() => {
    if (!isPaused) startRotation();
    else if (intervalRef.current) clearInterval(intervalRef.current);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, startRotation]);

  // Marketing messages rotate independently
  useEffect(() => {
    msgIntervalRef.current = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % marketingMessages.length);
    }, 5000);
    return () => {
      if (msgIntervalRef.current) clearInterval(msgIntervalRef.current);
    };
  }, []);

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Deep background */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-dark via-brand to-brand-mid" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(234,163,37,0.10)_0%,transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,rgba(255,255,255,0.04)_0%,transparent_50%)]" />
      {/* Faint grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      {/* Abstract shape top-right */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-gold/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-white/5 blur-3xl" />

      {/* Top: logo */}
      <div className="relative z-10 shrink-0 p-8 lg:p-10">
        <a href="/" className="inline-flex items-center gap-2.5" aria-label="NeedFull home">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-gold backdrop-blur-sm">
            <svg viewBox="0 3 36 30" fill="none" className="h-5 w-5">
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
          <span className="font-display text-lg font-bold text-white">NeedFull</span>
        </a>
      </div>

      {/* Center: hero card area */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-8 lg:px-12">
        <div className="flex w-full max-w-sm flex-col items-center gap-3">
          {/* Micro-cards row 1 (top 2) */}
          <div className="flex w-full flex-wrap items-center justify-center gap-2">
            {scenario.microCards.slice(0, 2).map((card, i) => (
              <div
                key={i}
                className="animate-fade-slide-up rounded-xl border border-white/20 bg-white/95 px-3.5 py-2 shadow-lg"
                style={{
                  animationDelay: card.delay,
                  animationDuration: "0.4s",
                }}
              >
                <p className="whitespace-nowrap text-xs font-semibold text-gray-900">{card.text}</p>
              </div>
            ))}
          </div>

          {/* Hero task card */}
          <div
            key={current}
            className="w-full animate-scale-in rounded-2xl p-6 shadow-2xl lg:p-8"
            style={{
              animationDuration: "0.5s",
              backgroundColor: "var(--color-card-bg, #ffffff)",
            }}
          >
            <div className="flex items-center justify-between">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${scenario.badgeBg}`}>
                {scenario.category}
              </span>
              <span className="font-display text-2xl font-extrabold text-gold">{scenario.reward}</span>
            </div>
            <h3 className="mt-4 font-display text-lg font-bold" style={{ color: "var(--color-foreground, #171717)" }}>
              {scenario.title}
            </h3>
            <div className="mt-2 flex items-center gap-1.5 text-sm" style={{ color: "var(--color-muted, #6b7280)" }}>
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              {scenario.location}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-sm text-amber-600">
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {scenario.due}
            </div>
            <div className="mt-6 flex items-center gap-3 pt-4" style={{ borderTop: "1px solid var(--color-card-border, #e5e7eb)" }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                {scenario.runnerInitials}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: "var(--color-foreground, #171717)" }}>{scenario.runnerName}</p>
                <p className="flex items-center gap-1 text-xs" style={{ color: "var(--color-muted, #6b7280)" }}>
                  <span className="text-gold">&#9733;</span> {scenario.runnerRating}
                </p>
              </div>
              <a href="/register" className="rounded-full bg-gold px-5 py-2 text-xs font-bold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.97]">
                Apply &rarr;
              </a>
            </div>

            {/* Micro-cards row 2 (bottom 2) */}
            <div className="flex w-full flex-wrap items-center justify-center gap-2">
              {scenario.microCards.slice(2).map((card, i) => (
              <div
                key={i}
                className="animate-fade-slide-up rounded-xl border border-white/20 bg-white/95 px-3.5 py-2 shadow-lg"
                style={{
                  animationDelay: card.delay,
                  animationDuration: "0.4s",
                }}
              >
                <p className="whitespace-nowrap text-xs font-semibold text-gray-900">{card.text}</p>
              </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: metrics + marketing message */}
      <div className="relative z-10 shrink-0 space-y-4 px-8 pb-8 lg:px-10 lg:pb-10">
        {/* Metrics bar */}
        <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
          {[
            { value: "2,400+", label: "Tasks Done" },
            { value: "850+", label: "Runners" },
            { value: "12", label: "Services" },
            { value: "₦4.2M", label: "Earned" },
          ].map((m) => (
            <div key={m.label} className="text-center">
              <p className="font-display text-xl font-extrabold text-gold lg:text-2xl">{m.value}</p>
              <p className="text-[10px] font-medium text-white/60">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Marketing message + dots */}
        <div className="flex items-center justify-between">
          <p
            key={msgIndex}
            className="animate-fade-in text-sm font-medium text-white/80"
            style={{ animationDuration: "0.5s" }}
          >
            {marketingMessages[msgIndex]}
          </p>
          <div className="flex items-center gap-1.5">
            {scenarios.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { setCurrent(i); if (!isPaused) startRotation(); }}
                aria-label={`Task ${i + 1}`}
                className={`rounded-full transition-all duration-500 ${
                  i === current ? "h-2 w-6 bg-gold" : "h-2 w-2 bg-white/25 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
