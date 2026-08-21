// WHAT: Consolidated How It Works + Earn — single tabbed section (Upwork pattern)
// WHY: Merges two standalone stacked sections into one viewport-sized tabbed
//      component. Poster tab shows HowItWorks 4-step content unchanged;
//      Runner tab shows EarnSection content unchanged. No copy rewrite.

"use client";

import { useState } from "react";
import { ArrowRight, FilePlus2, UserCheck, BadgeCheck, Wallet, Clock, Star } from "lucide-react";
import { useAuthDestinations } from "./authDestinations";

type Audience = "poster" | "runner";

// Exact copy from HowItWorksSection.tsx — 4 steps, unchanged
const HOW_IT_WORKS_STEPS = [
  { n: "1", title: "Post a task", desc: "Describe what you need, set a budget, and publish. It takes a few minutes.", icon: FilePlus2 },
  { n: "2", title: "Find a Runner", desc: "Runners apply to your task. Review their profile and rating, then accept the best fit.", icon: UserCheck },
  { n: "3", title: "Get it done", desc: "Your payment locks in escrow while the Runner works. Track the task status from posted to completed.", icon: BadgeCheck },
  { n: "4", title: "Payment is released", desc: "Confirm the work is done and escrow releases the payment to the Runner. Both sides can leave a rating.", icon: Wallet },
] as const;

// Exact copy from EarnSection.tsx — unchanged
const EARN_POINTS = [
  { icon: Wallet, title: "Get paid for real tasks", desc: "Laundry, delivery, printing, errands — money is released to your wallet when the poster confirms the task." },
  { icon: Clock, title: "Work around your timetable", desc: "Pick up tasks between classes. No fixed schedule, no interview, no CV." },
  { icon: Star, title: "Build a rating that counts", desc: "Every completed task earns a rating. A stronger profile wins better tasks." },
] as const;

export function TwoWaysSection() {
  const { postTask, startEarning } = useAuthDestinations();
  const [activeAudience, setActiveAudience] = useState<Audience>("poster");

  return (
    <section id="two-ways" className="border-b border-border-subtle bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            One marketplace. Two ways to use it.
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted sm:text-base">
            NeedFull connects people who need help with people ready to help.
          </p>
        </div>

        {/* Audience tabs — Upwork pattern, single control for both audiences */}
        <div className="mt-8 flex justify-center" role="tablist" aria-label="Select audience">
          <div className="flex gap-1 rounded-full p-1 max-w-xs w-full sm:w-auto" style={{ backgroundColor: "var(--color-border)" }}>
            {(["poster", "runner"] as Audience[]).map((audience) => (
              <button
                key={audience}
                role="tab"
                aria-selected={activeAudience === audience}
                onClick={() => setActiveAudience(audience)}
                className={`flex-1 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
                  activeAudience === audience
                    ? "bg-foreground text-background shadow-sm"
                    : "text-foreground-secondary hover:text-foreground"
                }`}
              >
                {audience === "poster" ? "For posters" : "For runners"}
              </button>
            ))}
          </div>
        </div>

        {/* Content panel — switches between HowItWorks (4-step) and Earn (full) */}
        <div className="mt-10">
          {activeAudience === "poster" ? (
            <div>
              <h3 className="font-display text-xl font-bold text-foreground sm:text-2xl">How NeedFull works</h3>
              <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted sm:text-base">
                A marketplace between people who need help and people nearby who want to earn. The money stays protected at every step.
              </p>
              <ol className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
                {HOW_IT_WORKS_STEPS.map((step, i) => (
                  <li key={step.n} className="relative">
                    {i < HOW_IT_WORKS_STEPS.length - 1 && (
                      <span className="absolute left-9 top-0 hidden h-px w-[calc(100%-3rem)] bg-border-strong lg:block" aria-hidden="true" />
                    )}
                    <div className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border-default bg-surface text-brand">
                      <step.icon className="h-4.5 w-4.5" aria-hidden="true" />
                    </div>
                    <span className="mt-4 block text-[13px] font-bold tracking-widest text-foreground-muted">Step {step.n}</span>
                    <h4 className="mt-1 font-display text-lg font-bold text-foreground">{step.title}</h4>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.desc}</p>
                  </li>
                ))}
              </ol>
              <div className="mt-10 text-center sm:text-left">
                <a href={postTask} className="inline-flex h-[52px] items-center justify-center gap-2 rounded-xl bg-gold px-7 text-[15px] font-bold text-white shadow-card transition-all duration-150 hover:brightness-105 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2">
                  Post a task
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
              <div>
                <h3 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">Turn your free time into income.</h3>
                <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-muted sm:text-base">
                  See what students around you need done, complete the tasks you can handle, and earn. Payments are protected for both sides — you get paid when the work is done.
                </p>
                <a href={startEarning} className="mt-7 inline-flex h-[52px] items-center justify-center gap-2 rounded-xl bg-brand px-7 text-[15px] font-bold text-on-brand shadow-card transition-colors duration-150 hover:bg-brand-mid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">
                  Start earning
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
              <ul className="space-y-4">
                {EARN_POINTS.map((point) => (
                  <li key={point.title} className="flex gap-4 rounded-xl border border-border-default bg-surface p-5 shadow-sm">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand">
                      <point.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h4 className="font-display text-base font-bold text-foreground">{point.title}</h4>
                      <p className="mt-1 text-sm leading-relaxed text-muted">{point.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}