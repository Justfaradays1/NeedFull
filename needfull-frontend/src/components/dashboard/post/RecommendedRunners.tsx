"use client";

import Link from "next/link";
import { Star, MapPin, Shield, ChevronRight, User } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

interface Runner {
  id: string;
  fullName: string;
  profilePictureUrl?: string | null;
  rating: number;
  specialty: string;
  distance?: string;
  isVerified: boolean;
}

interface RecommendedRunnersProps {
  runners: Runner[];
  loading: boolean;
}

export function RecommendedRunners({ runners, loading }: RecommendedRunnersProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-card-border bg-surface p-4 shadow-sm">
        <div className="mb-3 h-5 w-36 animate-pulse rounded bg-gray-100" />
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="h-10 w-10 rounded-full bg-gray-100" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 rounded bg-gray-100" />
                <div className="h-2.5 w-16 rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (runners.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-card-border bg-surface p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">Recommended NeedRunners</h3>
        <Link
          href="/runners"
          className="flex items-center gap-0.5 text-[11px] font-bold text-brand-text"
        >
          View all <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-2">
        {runners.slice(0, 4).map((runner) => (
          <Link
            key={runner.id}
            href={`/profile/${runner.id}`}
            className="flex items-center gap-3 rounded-lg border border-card-border p-2.5 transition-all hover:border-brand/20 hover:shadow-sm active:scale-[0.99]"
          >
            <Avatar
              src={runner.profilePictureUrl}
              name={runner.fullName}
              email=""
              size="md"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {runner.fullName}
                </p>
                {runner.isVerified && (
                  <Shield className="h-3.5 w-3.5 shrink-0 text-brand-text" />
                )}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                {runner.rating > 0 && (
                  <span className="flex items-center gap-0.5">
                    <Star className="h-3 w-3 text-gold" />
                    {runner.rating.toFixed(1)}
                  </span>
                )}
                <span>{runner.specialty}</span>
                {runner.distance && (
                  <span className="flex items-center gap-0.5">
                    <MapPin className="h-3 w-3" />
                    {runner.distance}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
          </Link>
        ))}
      </div>
    </div>
  );
}
