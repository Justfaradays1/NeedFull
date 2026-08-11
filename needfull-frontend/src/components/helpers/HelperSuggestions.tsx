"use client";

// WHAT: "Available Helpers for this Task" — shown on the create-task flow once
//       a category is picked, so posters see who could take the job before posting.
// WHY:  Gives confidence to publish: matching runners by category, right now.
// NOTE: Discovery only. Posters still post the task; runners still apply.

import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck, ChevronRight, Star, UsersRound } from "lucide-react";
import { get } from "@/lib/apiClient";
import { Avatar } from "@/components/ui/avatar";
import { HelperOffer, formatDistance } from "./types";

export function HelperSuggestions({ categoryId }: { categoryId: string }) {
  const [offers, setOffers] = useState<HelperOffer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!categoryId) {
      setOffers([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    get<{ success: boolean; data: HelperOffer[] }>(
      `/availability?categoryId=${categoryId}&perPage=3`,
    )
      .then((res) => {
        if (!cancelled) setOffers(res.success ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setOffers([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  if (!categoryId || (!loading && offers.length === 0)) return null;

  return (
    <div className="rounded-xl border border-brand/20 bg-brand-light/50 p-3">
      <p className="flex items-center gap-1.5 text-xs font-bold text-brand-text">
        <UsersRound className="h-3.5 w-3.5" />
        Available runners for this task
      </p>
      {loading ? (
        <p className="mt-2 text-[11px] text-gray-500">Checking who&apos;s available…</p>
      ) : (
        <div className="mt-2 divide-y divide-card-border">
          {offers.map((offer) => {
            const distance = formatDistance(offer.distance);
            const rating = offer.runner?.averageRating;
            return (
              <Link
                key={offer.id}
                href={`/profile/${offer.runnerId}`}
                className="flex items-center gap-2 py-2"
              >
                <Avatar
                  src={offer.runner?.avatarUrl}
                  name={offer.runner?.fullName}
                  size="sm"
                  border
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 text-xs font-bold text-gray-900">
                    <span className="truncate">{offer.runner?.fullName}</span>
                    {offer.runner?.isVerifiedStudent && (
                      <BadgeCheck className="h-3 w-3 shrink-0 text-blue-500" />
                    )}
                    {offer.isOnlineToday && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                    )}
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
                    {rating !== null && rating !== undefined && (
                      <span className="inline-flex items-center gap-0.5 font-semibold text-gray-600">
                        <Star className="h-2.5 w-2.5 fill-gold text-gold" />
                        {Number(rating).toFixed(1)}
                      </span>
                    )}
                    {distance && (
                      <span>
                        <span className="font-semibold text-gray-600">
                          {distance}
                        </span>
                      </span>
                    )}
                    <span>· Travels {offer.maxTravelKm}km</span>
                  </span>
                </span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-300" />
              </Link>
            );
          })}
        </div>
      )}
      <p className="mt-1 text-[10px] text-gray-400">
        You&apos;ll still post the task and pick your runner — view their profile
        to learn more.
      </p>
    </div>
  );
}