// WHAT: Public profile page — view another user's trust signals and recent reviews
// WHY: Runners want to know who they're working for (and vice versa) before engaging

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Star,
  ShieldCheck,
  MapPin,
  GraduationCap,
  Briefcase,
  Calendar,
  Award,
  Wifi,
  Plus,
} from "lucide-react";
import { get } from "@/lib/apiClient";
import { getCategoryDisplayName, getCategoryColor, getCategoryIcon } from "@/lib/categoryConfig";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { useAuthInit, useAuthUser } from "@/store";
import { Avatar } from "@/components/ui/avatar";

interface PublicProfile {
  id: string;
  fullName: string;
  bio: string | null;
  department: string | null;
  level: string | null;
  hostel: string | null;
  school: string | null;
  locationLabel: string | null;
  profilePictureUrl: string | null;
  trustScore: number;
  tasksCompleted: number;
  isAvailable: boolean;
  isRunner: boolean;
  isVerifiedStudent: boolean;
  averageRating: number | null;
  memberSince: string;
  trustHistory?: { score: number; createdAt: string }[];
  recentReviews?: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    reviewer: { id: string; fullName: string };
  }[];
}

interface OfferItem {
  id: string;
  category: { id: string; name: string; icon: string };
  note: string;
  availableUntil: string | null;
  maxTravelKm: number;
  isOnlineToday: boolean;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "today";
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
  });
}

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const profileId = params.id as string;
  useAuthInit();
  const user = useAuthUser();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [offers, setOffers] = useState<OfferItem[]>([]);

  const isSelf = user?.id === profileId;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await get<{ success: boolean; data: PublicProfile }>(
          `/users/${profileId}`,
        );
        if (cancelled) return;
        if (res.success) setProfile(res.data);
        else setNotFound(true);
      } catch (err: any) {
        if (!cancelled) {
          if (err?.response?.status === 404) setNotFound(true);
          else setNotFound(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    get<{ success: boolean; data: OfferItem[] }>(
      `/availability?runnerId=${profileId}`,
    )
      .then((res) => {
        if (!cancelled && res.success) setOffers(res.data);
      })
      .catch(() => { /* offers are optional */ });
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  if (loading) {
    return (
      <div className="min-h-screen page-shell pb-8">
        <div className="glass-dark px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="tap-target rounded-lg p-2 hover:bg-white/20">
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>
            <h1 className="text-lg font-bold text-white truncate">Profile</h1>
          </div>
        </div>
        <div className="animate-pulse space-y-4 p-4">
          <div className="flex items-center gap-4 rounded-2xl bg-surface p-4 shadow-sm">
            <div className="h-16 w-16 rounded-full skeleton" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 skeleton rounded" />
              <div className="h-3 w-1/2 skeleton rounded" />
            </div>
          </div>
          <div className="h-24 skeleton rounded-2xl" />
          <div className="h-32 skeleton rounded-2xl" />
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <h2 className="text-lg font-semibold text-gray-900">Profile not found</h2>
        <p className="mt-1 text-sm text-gray-500">This user may have been removed.</p>
        <button
          onClick={() => router.back()}
          className="mt-4 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-on-brand"
        >
          Go Back
        </button>
      </div>
    );
  }

  const rating = profile.averageRating ?? null;
  const ratingNum = rating === null ? null : Number(rating);
  const memberSince = new Date(profile.memberSince).toLocaleDateString("en-NG", {
    month: "short",
    year: "numeric",
  });

  const trustChips: { label: string; icon: React.ReactNode }[] = [];
  if (profile.isVerifiedStudent)
    trustChips.push({ label: "Verified Student", icon: <BadgeCheck className="h-3.5 w-3.5" /> });
  if (ratingNum !== null && ratingNum >= 4.5)
    trustChips.push({ label: "Top Rated", icon: <Star className="h-3.5 w-3.5 fill-gold text-gold" /> });
  if (profile.trustScore >= 70)
    trustChips.push({ label: "Trusted Member", icon: <ShieldCheck className="h-3.5 w-3.5" /> });

  return (
    <div className="min-h-screen page-shell">
      <div className="glass-dark px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="tap-target rounded-lg p-2 hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <h1 className="text-lg font-bold text-white truncate">
            {profile.fullName}
          </h1>
        </div>
      </div>

      <div className="px-4 py-4">
        {/* Identity card */}
        <div className="mb-4 overflow-hidden rounded-2xl bg-surface shadow-sm">
          <div className="h-20 bg-linear-to-br from-brand to-brand-text/60" />
          <div className="-mt-9 flex items-end justify-between px-4">
            <Avatar
              src={profile.profilePictureUrl}
              name={profile.fullName}
              size="xl"
              border
              className="border-4 border-surface"
            />
            {profile.isAvailable && (
              <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-[11px] font-bold text-green-700">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                {profile.isRunner ? "Available" : "Online"}
              </span>
            )}
          </div>
          <div className="px-4 pb-4 pt-2">
            <p className="flex items-center gap-1.5 font-display text-lg font-bold text-gray-900">
              {profile.fullName}
              {profile.isVerifiedStudent && (
                <BadgeCheck className="h-5 w-5 shrink-0 text-blue-500" />
              )}
            </p>
            {profile.school && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                <GraduationCap className="h-3.5 w-3.5 text-brand-text" />
                {profile.school}
                {profile.department ? ` · ${profile.department}` : ""}
                {profile.level ? ` · ${profile.level}` : ""}
              </p>
            )}
            {profile.bio && (
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{profile.bio}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
              {profile.locationLabel && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {profile.locationLabel}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Member since {memberSince}
              </span>
            </div>

            {trustChips.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {trustChips.map((chip) => (
                  <span
                    key={chip.label}
                    className="inline-flex items-center gap-1 rounded-full border border-card-border bg-gray-50 px-2.5 py-1 text-[10px] font-bold text-gray-700"
                  >
                    {chip.icon}
                    {chip.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-card-border bg-surface p-3 text-center shadow-sm">
            <p className="text-lg font-black text-brand-text">
              {profile.trustScore}
              <span className="text-xs font-medium text-gray-400">/100</span>
            </p>
            <p className="mt-0.5 text-[10px] font-medium text-gray-500">Trust Score</p>
          </div>
          <div className="rounded-xl border border-card-border bg-surface p-3 text-center shadow-sm">
            <div className="flex items-center justify-center gap-0.5 text-lg font-black text-gold">
              {ratingNum !== null ? ratingNum.toFixed(1) : "—"}
              {ratingNum !== null && <Star className="h-4 w-4 fill-gold text-gold" />}
            </div>
            <p className="mt-0.5 text-[10px] font-medium text-gray-500">Rating</p>
          </div>
          <div className="rounded-xl border border-card-border bg-surface p-3 text-center shadow-sm">
            <div className="flex items-center justify-center gap-1 text-lg font-black text-emerald-600">
              <Briefcase className="h-4 w-4" />
              {profile.tasksCompleted}
            </div>
            <p className="mt-0.5 text-[10px] font-medium text-gray-500">Tasks Done</p>
          </div>
        </div>

        {/* Currently offering — availability signal */}
        {offers.length > 0 && (
          <div className="mb-4 rounded-2xl border border-card-border bg-surface shadow-sm">
            <div className="flex items-center gap-1.5 border-b border-card-border px-4 py-3">
              <Wifi className="h-4 w-4 text-gold" />
              <h2 className="font-display text-sm font-bold text-gray-900">
                Currently Offering
              </h2>
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                {profile.isAvailable ? "AVAILABLE" : "BUSY"}
              </span>
            </div>
            <div className="divide-y divide-card-border">
              {offers.map((offer) => (
                <div key={offer.id} className="flex items-start gap-3 px-4 py-3">
                  <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                  style={{ backgroundColor: getCategoryColor(offer.category?.name ?? "other") }}
                >
                  <CategoryIcon name={getCategoryIcon(offer.category?.name ?? "other")} className="h-4 w-4" />
                </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900">
                      {offer.category?.name
                      ? getCategoryDisplayName(offer.category.name)
                      : "Help"}
                      {offer.isOnlineToday && (
                        <span className="ml-1.5 rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-bold text-green-700">
                          ONLINE TODAY
                        </span>
                      )}
                    </p>
                    {offer.note && (
                      <p className="mt-0.5 text-xs text-gray-600 line-clamp-2">{offer.note}</p>
                    )}
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {offer.maxTravelKm}km travel
                      </span>
                      {offer.availableUntil && (
                        <span>
                          until{" "}
                          {new Date(offer.availableUntil).toLocaleDateString("en-NG", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Poster actions — engage this runner directly */}
        {!isSelf && profile.isRunner && (
          <div className="mb-4">
            <Link
              href={`/tasks/create?runnerId=${profile.id}`}
              className="tap-target flex items-center justify-center gap-1.5 rounded-xl bg-gold px-3 py-3 text-sm font-bold text-white shadow-sm shadow-gold/25 transition-all hover:brightness-105 active:scale-[0.97]"
            >
              <Plus className="h-4 w-4" />
              Post a task for them
            </Link>
            <p className="mt-2 text-center text-xs text-gray-500">
              Chat unlocks once the runner is hired for a task.
            </p>
          </div>
        )}

        {/* Reviews */}
        <div className="rounded-2xl border border-card-border bg-surface shadow-sm">
          <div className="flex items-center justify-between border-b border-card-border px-4 py-3">
            <h2 className="flex items-center gap-1.5 font-display text-sm font-bold text-gray-900">
              <Award className="h-4 w-4 text-gold" />
              Recent Reviews
            </h2>
            <span className="text-[11px] font-medium text-gray-400">
              {profile.recentReviews ? profile.recentReviews.length : 0}
            </span>
          </div>
          {profile.recentReviews && profile.recentReviews.length > 0 ? (
            <div className="divide-y divide-card-border">
              {profile.recentReviews.map((rev) => (
                <div key={rev.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Avatar name={rev.reviewer.fullName} size="xs" />
                      <p className="text-xs font-bold text-gray-900">
                        {rev.reviewer.fullName}
                      </p>
                    </div>
                    <span className="text-[10px] text-gray-400">
                      {timeAgo(rev.createdAt)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-3 w-3 ${s <= rev.rating ? "fill-gold text-gold" : "text-gray-200"}`}
                      />
                    ))}
                  </div>
                  {rev.comment && (
                    <p className="mt-1.5 text-xs leading-relaxed text-gray-600">
                      {rev.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-6 text-center">
              <Star className="mx-auto h-6 w-6 text-gray-200" />
              <p className="mt-2 text-xs text-gray-500">
                No reviews yet — trust score reflects task history.
              </p>
            </div>
          )}
        </div>

        {isSelf && (
          <Link
            href="/profile"
            className="mt-4 block text-center text-xs font-bold text-brand-text hover:underline"
          >
            This is you — open your full profile →
          </Link>
        )}
      </div>
    </div>
  );
}