"use client";

// WHAT: Poster dashboard "Available Helpers" section — swipeable on mobile,
//       responsive grid on desktop, placed right under the wallet.
// WHY:  The fastest path from "I need help" to "someone who can help right now".
//       Discovery only: cards link to profiles; invites go through open tasks.
// NOTE: Self-fetches GET /availability?perPage=5 so it never blocks the page.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, UsersRound } from "lucide-react";
import { get } from "@/lib/apiClient";
import { useAuthStore } from "@/store";
import { HelperCard } from "./HelperCard";
import { HelperOffer } from "./types";

export function AvailableHelpers() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [offers, setOffers] = useState<HelperOffer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOffers = useCallback(async () => {
    try {
      const res = await get<{ success: boolean; data: HelperOffer[] }>(
        "/availability?perPage=5",
      );
      setOffers(res.success ? res.data : []);
    } catch {
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchOffers();
  }, [isAuthenticated, fetchOffers]);

  return (
    <section className="overflow-hidden rounded-2xl border border-card-border bg-surface shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-light">
            <UsersRound className="h-5 w-5 text-brand-text" />
          </span>
          <div>
            <h2 className="font-display text-sm font-bold text-gray-900">
              Available Helpers
            </h2>
            <p className="text-[10px] text-gray-500">
              Runners offering services near you right now
            </p>
          </div>
        </div>
        <Link
          href="/helpers"
          className="flex shrink-0 items-center gap-0.5 text-[11px] font-bold text-brand-text"
        >
          View all <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {loading ? (
        <div className="flex gap-3 overflow-hidden px-4 pb-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 w-64 shrink-0 animate-pulse rounded-2xl bg-gray-100 sm:w-72"
            />
          ))}
        </div>
      ) : offers.length === 0 ? (
        <div className="px-4 pb-5 pt-2 text-center">
          <p className="text-xs font-bold text-gray-900">
            No helpers available right now
          </p>
          <p className="mx-auto mt-1 max-w-xs text-[11px] leading-relaxed text-gray-500">
            Post your task anyway — we&apos;ll notify nearby runners who can
            help. You can also browse all runners in Explore.
          </p>
          <Link
            href="/tasks/create"
            className="tap-target mt-3 inline-block rounded-xl bg-brand px-5 py-2.5 text-xs font-bold text-on-brand shadow-sm transition-opacity hover:opacity-90"
          >
            Post a Task
          </Link>
        </div>
      ) : (
        <div className="flex snap-x gap-3 overflow-x-auto px-4 pb-4 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-2 md:overflow-visible lg:grid-cols-3">
          {offers.map((offer) => (
            <HelperCard key={offer.id} offer={offer} wide />
          ))}
        </div>
      )}
    </section>
  );
}