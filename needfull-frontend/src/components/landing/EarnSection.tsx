// WHAT: Runner side of the marketplace — turn free time into income
// WHY: The landing page sells the Poster problem first; this section
//      introduces the earning opportunity with a real CTA.

"use client";

import { ArrowRight, Wallet, Clock, Star } from "lucide-react";
import { useAuthDestinations } from "./authDestinations";

const POINTS = [
  {
    icon: Wallet,
    title: "Get paid for real tasks",
    desc: "Laundry, delivery, printing, errands — money is released to your wallet when the poster confirms the task.",
  },
  {
    icon: Clock,
    title: "Work around your timetable",
    desc: "Pick up tasks between classes. No fixed schedule, no interview, no CV.",
  },
  {
    icon: Star,
    title: "Build a rating that counts",
    desc: "Every completed task earns a rating. A stronger profile wins better tasks.",
  },
];

export function EarnSection() {
  const { startEarning } = useAuthDestinations();

  return (
    <section id="features" className="border-b border-border-subtle bg-surface-primary">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-20 lg:px-8">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Turn your free time into income.
          </h2>
          <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-muted sm:text-base">
            See what students around you need done, complete the tasks you
            can handle, and earn. Payments are protected for both sides —
            you get paid when the work is done.
          </p>
          <a
            href={startEarning}
            className="mt-7 inline-flex h-[52px] items-center justify-center gap-2 rounded-xl bg-brand px-7 text-[15px] font-bold text-on-brand shadow-card transition-colors duration-150 hover:bg-brand-mid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            Start earning
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>

        <ul className="space-y-4">
          {POINTS.map((point) => (
            <li
              key={point.title}
              className="flex gap-4 rounded-xl border border-border-default bg-surface p-5 shadow-sm"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand">
                <point.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-display text-base font-bold text-foreground">
                  {point.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  {point.desc}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}