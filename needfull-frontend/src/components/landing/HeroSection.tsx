// WHAT: Hero — tabbed poster/runner value proposition + dynamic proof card + functional entry
// WHY: Single conversion entry. Tabs left-aligned; hero content centered on mobile, left on desktop. Search CTA inside pill, one primary per role.

"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, CheckCircle2, Star, ShieldCheck, MapPin } from "lucide-react";
import { useAuthDestinations } from "./authDestinations";
import { useRole } from "./RoleContext";
import { searchCategoryConfigs } from "@/lib/categoryConfig";

const POSTER_TASKS = [
  "Laundry pickup & delivery",
  "Wash and iron clothes",
  "Delivery & Pickup",
  "Printing documents",
  "Cleaning my room",
  "Grocery shopping",
  "Errands & Shopping",
];

const RUNNER_TASKS = [
  "Laundry pickup & delivery",
  "Wash and iron clothes",
  "Delivery & Pickup",
  "Printing documents",
  "Cleaning my room",
  "Grocery shopping",
  "Errands & Shopping",
];

function filterTasks(tasks: string[], q: string) {
  const query = q.trim().toLowerCase();
  if (!query) return tasks.slice(0, 5);
  return tasks.filter((t) => t.toLowerCase().includes(query)).slice(0, 5);
}

export function HeroSection() {
  const router = useRouter();
  const { postTask } = useAuthDestinations();
  const { role, setRole } = useRole();
  const isPoster = role === "poster";
  const [posterQuery, setPosterQuery] = useState("");
  const [runnerQuery, setRunnerQuery] = useState("");
  const [posterFocused, setPosterFocused] = useState(false);
  const [runnerFocused, setRunnerFocused] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);
  const runnerRef = useRef<HTMLDivElement>(null);

  const handlePosterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = posterQuery.trim();
    if (q) router.push(`/tasks/create?title=${encodeURIComponent(q)}`);
    else router.push(postTask);
  };

  const handleRunnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = runnerQuery.trim();
    router.push(q ? `/feed?q=${encodeURIComponent(q)}` : "/feed");
  };

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (posterRef.current && !posterRef.current.contains(e.target as Node)) setPosterFocused(false);
      if (runnerRef.current && !runnerRef.current.contains(e.target as Node)) setRunnerFocused(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPosterFocused(false);
        setRunnerFocused(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <section id="hero" className="relative border-b border-border-subtle bg-background overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{ backgroundImage: `radial-gradient(var(--color-border) 1px, transparent 1px)`, backgroundSize: "32px 32px" }}
      />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-start gap-10 px-4 pt-8 pb-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:pt-10 lg:pb-20">
        <div>
          <div
            className="inline-flex gap-1 rounded-full p-1 mb-6"
            role="tablist"
            aria-label="Choose your role"
            style={{ backgroundColor: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}
          >
            <button role="tab" aria-selected={isPoster} onClick={() => setRole("poster")} className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${isPoster ? "shadow-sm" : "hover:text-foreground"}`} style={isPoster ? { backgroundColor: "var(--color-success)", color: "white" } : { color: "var(--color-muted)" }}>
              For posters
            </button>
            <button role="tab" aria-selected={!isPoster} onClick={() => setRole("runner")} className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${!isPoster ? "shadow-sm" : "hover:text-foreground"}`} style={!isPoster ? { backgroundColor: "var(--color-success)", color: "white" } : { color: "var(--color-muted)" }}>
              For runners
            </button>
          </div>

          {isPoster ? (
            <>
              <h1 className="mx-auto max-w-xl px-4 text-center font-display text-[clamp(1.9rem,4.5vw,3rem)] font-extrabold leading-[1.12] tracking-tight text-foreground sm:px-0 lg:mx-0 lg:px-0 lg:text-left">
                Get everyday tasks handled by <span style={{ color: "var(--color-success)" }}>someone nearby</span>, safely and fast.
              </h1>
              <p className="mx-auto mt-4 max-w-lg px-4 text-center text-base leading-relaxed text-muted sm:px-0 sm:text-lg lg:mx-0 lg:text-left">
                Post what you need, set your budget, and let a nearby Runner take care of it.
              </p>
              <form onSubmit={handlePosterSubmit} className="mx-auto mt-8 max-w-lg lg:mx-0">
                <label htmlFor="poster-search" className="sr-only">What do you need help with</label>
                <div ref={posterRef} className="relative">
                  <div className="flex items-center gap-2 rounded-full border border-border-default bg-surface pl-3 pr-1.5 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-brand/20 focus-within:border-brand">
                    <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                    <input id="poster-search" type="text" value={posterQuery} onChange={(e) => setPosterQuery(e.target.value)} onFocus={() => setPosterFocused(true)} placeholder="What do you need help with?" autoComplete="off" className="min-w-0 flex-1 bg-transparent px-1 py-2 text-[15px] text-foreground placeholder:text-muted outline-none" />
                    <button type="submit" className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full px-5 text-sm font-bold text-white shadow-sm transition-colors hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40" style={{ backgroundColor: "var(--color-gold)" }}>
                      Post a task <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                  {posterFocused && (
                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 rounded-xl border border-border-default bg-surface shadow-lg overflow-hidden">
                      {(() => {
                        const tasks = filterTasks(POSTER_TASKS, posterQuery);
                        const cats = searchCategoryConfigs(posterQuery).slice(0, 5);
                        return (
                          <>
                            {tasks.length > 0 && (
                              <div className="p-2">
                                <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-muted">Popular tasks</p>
                                {tasks.map((t) => (
                                  <button key={t} type="button" onMouseDown={(e) => { e.preventDefault(); router.push(`/tasks/create?title=${encodeURIComponent(t)}`); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-foreground hover:bg-surface-2">
                                    <Search className="h-4 w-4 shrink-0 text-muted" /> {t}
                                  </button>
                                ))}
                              </div>
                            )}
                            {cats.length > 0 && (
                              <div className="border-t border-border-subtle p-2">
                                <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-muted">Categories</p>
                                {cats.slice(0, 4).map((c) => (
                                  <button key={c.key} type="button" onMouseDown={(e) => { e.preventDefault(); router.push(`/tasks/create?category=${encodeURIComponent(c.displayName)}`); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-foreground hover:bg-surface-2">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-2 text-muted text-xs font-bold border border-border-default">{c.shortName.charAt(0)}</span>
                                    {c.displayName}
                                  </button>
                                ))}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </form>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-foreground-secondary lg:justify-start">
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" /> Payment protected</span>
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" /> Verified users</span>
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" /> Local help</span>
              </div>
            </>
          ) : (
            <>
              <h1 className="mx-auto max-w-xl px-4 text-center font-display text-[clamp(1.9rem,4.5vw,3rem)] font-extrabold leading-[1.12] tracking-tight text-foreground sm:px-0 lg:mx-0 lg:px-0 lg:text-left">
                Turn your free time into <span style={{ color: "var(--color-success)" }}>extra income.</span>
              </h1>
              <p className="mx-auto mt-4 max-w-lg px-4 text-center text-base leading-relaxed text-muted sm:px-0 sm:text-lg lg:mx-0 lg:text-left">
                Explore nearby tasks, choose what fits you, and get paid when you complete it.
              </p>
              <form onSubmit={handleRunnerSubmit} className="mx-auto mt-8 max-w-lg lg:mx-0">
                <label htmlFor="runner-search" className="sr-only">Search nearby tasks</label>
                <div ref={runnerRef} className="relative">
                  <div className="flex items-center gap-2 rounded-full border border-border-default bg-surface pl-3 pr-1.5 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-brand/20 focus-within:border-brand">
                    <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                    <input id="runner-search" type="text" value={runnerQuery} onChange={(e) => setRunnerQuery(e.target.value)} onFocus={() => setRunnerFocused(true)} placeholder="Search nearby tasks, delivery, laundry..." autoComplete="off" className="min-w-0 flex-1 bg-transparent px-1 py-2 text-[15px] text-foreground placeholder:text-muted outline-none" />
                    <button type="submit" className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full px-5 text-sm font-bold text-white shadow-sm transition-colors hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40" style={{ backgroundColor: "var(--color-gold)" }}>
                      Explore tasks <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                  {runnerFocused && (
                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 rounded-xl border border-border-default bg-surface shadow-lg overflow-hidden">
                      {(() => {
                        const tasks = filterTasks(RUNNER_TASKS, runnerQuery);
                        const cats = searchCategoryConfigs(runnerQuery).slice(0, 5);
                        return (
                          <>
                            {tasks.length > 0 && (
                              <div className="p-2">
                                <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-muted">Tasks</p>
                                {tasks.map((t) => (
                                  <button key={t} type="button" onMouseDown={(e) => { e.preventDefault(); router.push(`/feed?q=${encodeURIComponent(t)}`); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-foreground hover:bg-surface-2">
                                    <Search className="h-4 w-4 shrink-0 text-muted" /> {t}
                                  </button>
                                ))}
                              </div>
                            )}
                            {cats.length > 0 && (
                              <div className="border-t border-border-subtle p-2">
                                <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-muted">Categories</p>
                                {cats.slice(0, 4).map((c) => (
                                  <button key={c.key} type="button" onMouseDown={(e) => { e.preventDefault(); router.push(`/feed?q=${encodeURIComponent(c.displayName)}`); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-foreground hover:bg-surface-2">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-2 text-muted text-xs font-bold border border-border-default">{c.shortName.charAt(0)}</span>
                                    {c.displayName}
                                  </button>
                                ))}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </form>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-foreground-secondary lg:justify-start">
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" /> Payment protected</span>
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" /> Verified posters</span>
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" /> Pick your schedule</span>
              </div>
            </>
          )}
        </div>

        <div className="mx-auto w-full max-w-sm lg:mx-0 lg:justify-self-end self-start">
          {isPoster ? (
            <div className="rounded-xl border shadow-sm" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card-bg)" }}>
              <div className="flex items-center justify-between border-b px-5 py-3.5" style={{ borderColor: "var(--color-border)" }}>
                <p className="text-[11px] font-bold uppercase tracking-widest text-foreground-secondary">NeedFull task</p>
                <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold" style={{ backgroundColor: "var(--color-success-light)", color: "var(--color-success)" }}>
                  <ShieldCheck className="h-3 w-3" aria-hidden="true" /> Escrow
                </span>
              </div>
              <div className="px-5 py-4">
                <h2 className="font-display text-lg font-bold text-foreground">Laundry & Washing</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted">“Wash and iron 5 items and return them nearby.”</p>
                <p className="mt-3 text-2xl font-extrabold tracking-tight text-foreground">₦2,500</p>
                <ol className="mt-5 space-y-0" aria-label="Task progress">
                  {[
                    { label: "Posted" },
                    { label: "Runner accepted" },
                    { label: "Task completed" },
                  ].map((step, i) => (
                    <li key={step.label} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white" style={{ backgroundColor: "var(--color-success)" }} aria-hidden="true"><CheckCircle2 className="h-3.5 w-3.5" /></span>
                        {i < 2 && <span className="mt-1 w-px flex-1" style={{ backgroundColor: "var(--color-border)" }} />}
                      </div>
                      <p className="pb-1 text-sm font-semibold text-foreground">{step.label}</p>
                    </li>
                  ))}
                </ol>
                <div className="mt-4 rounded-lg border px-4 py-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface-2)" }}>
                  <p className="inline-flex items-center gap-1.5 text-[13px] font-bold" style={{ color: "var(--color-success)" }}><CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Payment protected</p>
                  <p className="mt-0.5 text-[13px] leading-snug" style={{ color: "var(--color-muted)" }}>Released when the task is complete.</p>
                </div>
                <a href={isPoster ? (posterQuery.trim() ? `/tasks/create?title=${encodeURIComponent(posterQuery.trim())}` : postTask) : "/feed"} className="mt-4 inline-flex items-center gap-1 text-sm font-medium hover:underline" style={{ color: "var(--color-success)" }}>
                  View task <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border shadow-sm" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card-bg)" }}>
              <div className="flex items-center justify-between border-b px-5 py-3.5" style={{ borderColor: "var(--color-border)" }}>
                <p className="text-[11px] font-bold uppercase tracking-widest text-foreground-secondary">Nearby task</p>
                <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold" style={{ backgroundColor: "var(--color-success-light)", color: "var(--color-success)" }}>Available now</span>
              </div>
              <div className="px-5 py-4">
                <h2 className="font-display text-lg font-bold text-foreground">Delivery & Pickup</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted">“Pick up and deliver a package nearby.”</p>
                <p className="mt-3 text-2xl font-extrabold tracking-tight text-foreground">₦3,000</p>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-foreground-secondary">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Nearby</span>
                  <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-gold text-gold" /> Poster 4.8 ★</span>
                </div>
                <a href="/feed" className="mt-4 inline-flex items-center gap-1 text-sm font-medium hover:underline" style={{ color: "var(--color-success)" }}>
                  View task <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
                <p className="mt-1 text-xs text-muted">Choose what fits your time and skills.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}