// WHAT: Guided "Start Earning" flow for runners
// WHY: New runners need a confident, step-by-step launch instead of a bare
//      toggle. Flow: readiness check → location permission → preferred
//      categories → go online → success + redirect to the discovery page.
//      Preferences persist locally (low-end friendly); availability persists
//      via the API. Backend persistence of prefs can follow later.

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  X,
  Check,
  CheckCircle2,
  MapPin,
  Loader2,
  PartyPopper,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { patch } from "@/lib/apiClient";
import { useAuthUser } from "@/store";
import toast from "react-hot-toast";

interface TaskItem {
  id: string;
  category: { id: string; name: string } | null;
}

const LOCATION_KEY = "nf_runner_location";
const CATEGORY_KEY = "nf_runner_categories";

function loadPref<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function savePref(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full/unavailable — non-fatal */
  }
}

export function StartEarningModal({
  open,
  onClose,
  tasks,
  onGoLive,
}: {
  open: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  onGoLive: () => void;
}) {
  const router = useRouter();
  const user = useAuthUser();

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    () => loadPref<{ lat: number; lng: number } | null>(LOCATION_KEY, null),
  );
  const [selected, setSelected] = useState<string[]>(() =>
    loadPref<string[]>(CATEGORY_KEY, []),
  );

  const categories = useMemo(() => {
    const seen = new Map<string, string>();
    for (const t of tasks) {
      if (t.category && !seen.has(t.category.id)) seen.set(t.category.id, t.category.name);
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [tasks]);

  if (!open) return null;

  const emailVerified = user?.emailVerified ?? false;
  const anyCategory = selected.length === 0;

  const allowLocation = () => {
    if (!navigator.geolocation) {
      toast("Location isn't available on this device — we'll use campus default.");
      setStep(2);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(loc);
        savePref(LOCATION_KEY, loc);
        setLocating(false);
        setStep(2);
      },
      () => {
        setLocating(false);
        toast("Couldn't get your location — we'll use the campus default.");
        setStep(2);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
    );
  };

  const toggleCategory = (id: string) => {
    setSelected((prev) => {
      const next = prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id];
      savePref(CATEGORY_KEY, next);
      return next;
    });
  };

  const goLive = async () => {
    setBusy(true);
    try {
      const res = await patch<{ success: boolean }>("/users/me/available", {
        isAvailable: true,
      });
      if (!res.success) throw new Error("Failed to go online");
      onGoLive();
      setStep(4);
    } catch {
      toast.error("Couldn't go online right now. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const STEPS = ["Ready", "Location", "Categories", "Go Live"];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm md:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Start earning setup"
    >
      <div className="flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-surface shadow-2xl md:rounded-3xl">
        {/* Handle + close */}
        <div className="flex items-center justify-between px-4 pt-3">
          <span className="mx-auto -mb-1 block h-1.5 w-10 rounded-full bg-gray-300 md:hidden" />
          <button
            type="button"
            onClick={onClose}
            className="tap-target -mr-2 ml-auto flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-neutral-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 pb-6 pt-1">
          {/* Progress dots */}
          {step < 4 && (
            <div className="mb-4 flex items-center gap-1.5">
              {STEPS.map((label, i) => (
                <div key={label} className="flex flex-1 flex-col gap-1">
                  <div
                    className={`h-1 rounded-full transition-colors ${
                      i <= step ? "bg-gold" : "bg-gray-200 dark:bg-neutral-800"
                    }`}
                  />
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider ${
                      i <= step ? "text-gold" : "text-gray-400"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* ─── Step 0: Ready check ─── */}
          {step === 0 && (
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-light">
                <Zap className="h-6 w-6 text-gold" />
              </div>
              <h2 className="mt-3 font-display text-xl font-bold text-gray-900 dark:text-amber-100">
                Ready to start earning?
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                A quick 3-step setup puts you in front of paying students. Takes
                under a minute.
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2.5 rounded-xl bg-gray-50 px-3.5 py-2.5 dark:bg-neutral-800/60">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                  <p className="text-xs font-medium text-gray-700 dark:text-amber-200">
                    Runner profile active
                  </p>
                </div>
                <div
                  className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 ${
                    emailVerified
                      ? "bg-gray-50 dark:bg-neutral-800/60"
                      : "bg-amber-50 dark:bg-amber-950/40"
                  }`}
                >
                  {emailVerified ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-500" />
                  )}
                  <p className="text-xs font-medium text-gray-700 dark:text-amber-200">
                    {emailVerified
                      ? "Email verified — you can receive earnings"
                      : "Verify your email to receive earnings"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="tap-target mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3 text-sm font-bold text-white shadow-md shadow-gold/25 transition-all active:scale-[0.97]"
              >
                Let&apos;s set up
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ─── Step 1: Location ─── */}
          {step === 1 && (
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-light">
                <MapPin className="h-6 w-6 text-brand-text" />
              </div>
              <h2 className="mt-3 font-display text-xl font-bold text-gray-900 dark:text-amber-100">
                Where are you?
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Posters see how close you are. Your location stays private — we
                only share a rough distance.
              </p>
              {location ? (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-green-50 px-3.5 py-3 text-xs font-semibold text-green-700 dark:bg-green-950/30 dark:text-green-300">
                  <Check className="h-4 w-4" />
                  Location saved — you&apos;re on the map.
                </div>
              ) : null}
              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={allowLocation}
                  disabled={locating}
                  className="tap-target flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-bold text-on-brand shadow-sm transition-all active:scale-[0.97] disabled:opacity-60"
                >
                  {locating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )}
                  {locating ? "Locating…" : location ? "Update location" : "Allow location"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="tap-target w-full rounded-xl border border-card-border px-4 py-3 text-xs font-bold text-gray-600 transition-all active:scale-[0.97] dark:text-amber-200/80"
                >
                  Skip — use campus default
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 2: Categories ─── */}
          {step === 2 && (
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-light">
                <Zap className="h-6 w-6 text-gold" />
              </div>
              <h2 className="mt-3 font-display text-xl font-bold text-gray-900 dark:text-amber-100">
                What do you enjoy doing?
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Pick a few categories so the best tasks find you first. Skip if
                you&apos;re open to anything.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelected([])}
                  className={`rounded-full px-3.5 py-2 text-xs font-bold transition-colors ${
                    anyCategory
                      ? "bg-brand text-on-brand shadow-sm"
                      : "border border-card-border bg-surface text-gray-600 dark:text-amber-200/80"
                  }`}
                >
                  Any category
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCategory(c.id)}
                    className={`rounded-full px-3.5 py-2 text-xs font-bold transition-colors ${
                      selected.includes(c.id)
                        ? "bg-brand text-on-brand shadow-sm"
                        : "border border-card-border bg-surface text-gray-600 dark:text-amber-200/80"
                    }`}
                  >
                    {selected.includes(c.id) ? "✓ " : ""}
                    {c.name}
                  </button>
                ))}
                {categories.length === 0 && (
                  <p className="text-xs text-gray-500">No live categories yet — you can pick later.</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="tap-target mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3 text-sm font-bold text-white shadow-md shadow-gold/25 transition-all active:scale-[0.97]"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ─── Step 3: Go live ─── */}
          {step === 3 && (
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-950/40">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="mt-3 font-display text-xl font-bold text-gray-900 dark:text-amber-100">
                You&apos;re ready to hustle
              </h2>
              <div className="mt-4 space-y-2 rounded-2xl border border-card-border bg-gray-50 p-4 dark:bg-neutral-800/60">
                <Row label="Location" value={location ? "Saved" : "Campus default"} />
                <Row label="Categories" value={anyCategory ? "Any" : `${selected.length} selected`} />
                <Row label="Status after this" value="Online" />
              </div>
              <p className="mt-3 text-xs leading-relaxed text-gray-500">
                Going online makes you visible to posters nearby. You can switch
                off anytime.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="tap-target flex items-center justify-center gap-1 rounded-xl border border-card-border px-4 py-3 text-sm font-bold text-gray-600 transition-all active:scale-[0.97] dark:text-amber-200/80"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={goLive}
                  disabled={busy}
                  className="tap-target flex flex-1 items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3 text-sm font-bold text-white shadow-md shadow-gold/25 transition-all active:scale-[0.97] disabled:opacity-60"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  {busy ? "Going online…" : "Go Online & Start Earning"}
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 4: Success ─── */}
          {step === 4 && (
            <div className="py-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold-light">
                <PartyPopper className="h-8 w-8 text-gold" />
              </div>
              <h2 className="mt-4 font-display text-xl font-bold text-gray-900 dark:text-amber-100">
                You&apos;re live!
              </h2>
              <p className="mx-auto mt-1 max-w-[15rem] text-sm text-gray-500">
                Posters can see you now. Tasks are waiting — go grab one.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push("/hustle");
                }}
                className="tap-target mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3 text-sm font-bold text-white shadow-md shadow-gold/25 transition-all active:scale-[0.97]"
              >
                Browse Tasks
                <ChevronRight className="h-4 w-4" />
              </button>
              <Link
                href="/wallet"
                className="mt-2 block text-center text-xs font-bold text-brand-text"
              >
                Set up payout details
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-gray-500 dark:text-amber-400/70">{label}</span>
      <span className="text-xs font-bold text-gray-900 dark:text-amber-100">{value}</span>
    </div>
  );
}