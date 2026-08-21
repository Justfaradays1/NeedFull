// WHAT: Trust & safety — the real protections built into the marketplace
// WHY: Every claim here maps to actual product behaviour (escrow holds,
//      verified profiles, task status lifecycle, ratings). No invented
//      statistics.

import { ShieldCheck, BadgeCheck, Eye, Star } from "lucide-react";

const CONCEPTS = [
  {
    icon: ShieldCheck,
    title: "Escrow-protected payments",
    desc: "Your payment is locked in escrow when a Runner is accepted and only released when you confirm the task is complete.",
  },
  {
    icon: BadgeCheck,
    title: "Verified users",
    desc: "Profiles are linked to real school identity and student email verification, so both sides know who they are dealing with.",
  },
  {
    icon: Eye,
    title: "Transparent task status",
    desc: "Every task shows its real state — posted, accepted, in progress, completed — so there is never any doubt about where the work stands.",
  },
  {
    icon: Star,
    title: "Ratings that matter",
    desc: "Posters and Runners rate each other after every completed task. Those ratings shape who gets hired next.",
  },
];

export function TrustSection() {
  return (
    <section id="safety" className="border-b border-border-subtle bg-background">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Built so both sides can trust the deal
        </h2>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted sm:text-base">
          The same protections that make online marketplaces work, applied to
          campus tasks.
        </p>

        <ul className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-2">
          {CONCEPTS.map((concept) => (
            <li
              key={concept.title}
              className="flex gap-4 rounded-xl border border-border-default bg-surface p-5 shadow-sm"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand">
                <concept.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-display text-base font-bold text-foreground">
                  {concept.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  {concept.desc}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}