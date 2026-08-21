// WHAT: How it works — tabbed poster/runner 4-step grid
// WHY: Single explanatory section after hero. Heading + tabs share one row on desktop.

"use client";

import { FilePlus2, UserCheck, BadgeCheck, Wallet, Search, CheckCircle2, ClipboardCheck, Coins } from "lucide-react";
import { useRole } from "./RoleContext";

const POSTER_STEPS = [
  { n: "1", title: "Post a task", desc: "Tell us what you need, set your budget, and publish it.", icon: FilePlus2 },
  { n: "2", title: "Get matched", desc: "A nearby Runner accepts your task and gets to work.", icon: UserCheck },
  { n: "3", title: "Get it done", desc: "Track the task while your payment stays protected.", icon: BadgeCheck },
  { n: "4", title: "Payment is released", desc: "Confirm completion and the Runner gets paid.", icon: Wallet },
];

const RUNNER_STEPS = [
  { n: "1", title: "Find a task", desc: "Browse nearby tasks that match what you can do.", icon: Search },
  { n: "2", title: "Accept it", desc: "Choose tasks that fit your time, skills, and location.", icon: CheckCircle2 },
  { n: "3", title: "Complete the work", desc: "Follow the task details and get it done.", icon: ClipboardCheck },
  { n: "4", title: "Get paid", desc: "Once completion is confirmed, your earnings are released.", icon: Coins },
];

export function HowItWorksSection() {
  const { role, setRole } = useRole();
  const isPoster = role === "poster";
  const steps = isPoster ? POSTER_STEPS : RUNNER_STEPS;

  return (
    <section id="how-it-works" className="border-b border-border-subtle bg-surface-primary">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        {/* Header row: heading left, tabs right */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl whitespace-nowrap">
            How it works
          </h2>
          <div
            className="inline-flex gap-1 rounded-full p-1 self-start sm:self-auto shrink-0"
            role="tablist"
            aria-label="How it works audience"
            style={{ backgroundColor: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}
          >
            <button
              role="tab"
              aria-selected={isPoster}
              onClick={() => setRole("poster")}
              className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${isPoster ? "shadow-sm" : "hover:text-foreground"}`}
              style={isPoster ? { backgroundColor: "var(--color-success)", color: "white" } : { color: "var(--color-muted)" }}
            >
              For posters
            </button>
            <button
              role="tab"
              aria-selected={!isPoster}
              onClick={() => setRole("runner")}
              className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${!isPoster ? "shadow-sm" : "hover:text-foreground"}`}
              style={!isPoster ? { backgroundColor: "var(--color-success)", color: "white" } : { color: "var(--color-muted)" }}
            >
              For runners
            </button>
          </div>
        </div>

        <ol className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <li key={step.n} className="relative">
              {i < steps.length - 1 && <span className="absolute left-9 top-0 hidden h-px w-[calc(100%-3rem)] bg-border-strong lg:block" aria-hidden="true" />}
              <div className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border-default bg-surface text-brand">
                <step.icon className="h-4.5 w-4.5" aria-hidden="true" />
              </div>
              <span className="mt-4 block text-[13px] font-bold tracking-widest text-foreground-muted">Step {step.n}</span>
              <h3 className="mt-1 font-display text-lg font-bold text-foreground">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}