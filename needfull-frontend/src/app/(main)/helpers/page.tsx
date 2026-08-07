// WHAT: /helpers — dedicated "Available Helpers" discovery page
// WHY:  Posters can search, filter, and sort every runner who is currently
//       offering a service, then profile/message/invite them.

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  MapPin,
  Search,
  SlidersHorizontal,
  LocateFixed,
  UsersRound,
} from "lucide-react";
import { get } from "@/lib/apiClient";
import { useAuthStore } from "@/store";
import { HelperCard } from "@/components/helpers/HelperCard";
import { HelperOffer } from "@/components/helpers/types";

interface Category {
  id: string;
  name: string;
  icon: string;
}

type SortKey = "recommended" | "nearest" | "rated" | "active";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "recommended", label: "Recommended" },
  { key: "nearest", label: "Nearest" },
  { key: "rated", label: "Highest rated" },
  { key: "active", label: "Recently active" },
];

function sortOffers(offers: HelperOffer[], sort: SortKey): HelperOffer[] {
  const copy = [...offers];
  switch (sort) {
    case "nearest":
      return copy.sort((a, b) => {
        if (a.distance === b.distance) return 0;
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    case "rated":
      return copy.sort((a, b) => {
        const ra = a.runner?.averageRating ?? -1;
        const rb = b.runner?.averageRating ?? -1;
        return rb - ra;
      });
    case "active":
      return copy.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    default:
      return copy.sort(
        (a, b) => (b.runner?.trustScore ?? 0) - (a.runner?.trustScore ?? 0),
      );
  }
}

export default function HelpersPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [categories, setCategories] = useState<Category[]>([]);
  const [offers, setOffers] = useState<HelperOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [radius, setRadius] = useState<string>(""); // meters
  const [minRating, setMinRating] = useState<string>("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [onlineToday, setOnlineToday] = useState(false);
  const [sort, setSort] = useState<SortKey>("recommended");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    get<Category[] | { success: boolean; data: Category[] }>("/categories")
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.success ? res.data : [];
        setCategories(list);
      })
      .catch(() => setCategories([]));
  }, [isAuthenticated]);

  const locate = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocating(false);
        setCoords(null);
      },
      { timeout: 8000 },
    );
  }, []);

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    setError(false);
    const params = new URLSearchParams();
    if (categoryId) params.set("categoryId", categoryId);
    if (coords) {
      params.set("lat", String(coords.lat));
      params.set("lng", String(coords.lng));
      if (radius) params.set("radiusMeters", radius);
    }
    if (minRating) params.set("minRating", minRating);
    if (verifiedOnly) params.set("verifiedOnly", "true");
    if (onlineToday) params.set("onlineToday", "true");
    const q = searchInput.trim();
    if (q) params.set("search", q);
    params.set("perPage", "50");
    try {
      const res = await get<{ success: boolean; data: HelperOffer[] }>(
        `/availability?${params.toString()}`,
      );
      setOffers(res.success ? res.data : []);
    } catch {
      setOffers([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [categoryId, coords, radius, minRating, verifiedOnly, onlineToday, searchInput]);

  // Debounce fetch on filter/search changes
  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    const t = setTimeout(fetchOffers, 350);
    return () => clearTimeout(t);
  }, [isAuthenticated, fetchOffers]);

  const sorted = useMemo(() => sortOffers(offers, sort), [offers, sort]);

  const selectCls =
    "rounded-lg border border-card-border bg-surface px-2 py-1.5 text-[11px] font-semibold text-gray-700 focus:border-brand focus:outline-none";

  return (
    <div>
      <div className="sticky top-0 z-30 glass border-b border-card-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-light">
            <UsersRound className="h-5 w-5 text-brand-text" />
          </span>
          <div>
            <h1 className="font-display text-base font-bold text-gray-900">
              Available Helpers
            </h1>
            <p className="text-[10px] text-gray-500">
              Runners offering services right now
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 pb-10 pt-5">
        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search helpers, services, or notes…"
            className="w-full rounded-xl border border-card-border bg-surface py-2.5 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>

        {/* Category chips */}
        <div className="flex snap-x gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setCategoryId("")}
            className={`tap-target shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors ${
              categoryId === ""
                ? "bg-brand text-on-brand"
                : "border border-card-border bg-surface text-gray-600"
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryId(categoryId === c.id ? "" : c.id)}
              className={`tap-target flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors ${
                categoryId === c.id
                  ? "bg-brand text-on-brand"
                  : "border border-card-border bg-surface text-gray-600"
              }`}
            >
              <span>{c.icon}</span>
              {c.name}
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-card-border bg-surface p-2">
          <SlidersHorizontal className="ml-1 h-3.5 w-3.5 text-gray-400" />
          <button
            onClick={locate}
            disabled={locating}
            className={`tap-target inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[11px] font-bold transition-colors ${
              coords
                ? "border-brand bg-brand-light text-brand-text"
                : "border-card-border bg-white text-gray-600"
            } disabled:opacity-50`}
          >
            <LocateFixed className="h-3 w-3" />
            {coords ? "Located" : "My location"}
          </button>
          <select
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
            className={selectCls}
            disabled={!coords}
          >
            <option value="">Any distance</option>
            <option value="1000">Within 1km</option>
            <option value="2000">Within 2km</option>
            <option value="5000">Within 5km</option>
            <option value="10000">Within 10km</option>
          </select>
          <select
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
            className={selectCls}
          >
            <option value="">Any rating</option>
            <option value="4">4.0 and up</option>
            <option value="4.5">4.5 and up</option>
          </select>
          <label className="tap-target inline-flex items-center gap-1.5 px-1 py-1 text-[11px] font-bold text-gray-600">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="h-3.5 w-3.5 accent-brand"
            />
            Verified
          </label>
          <label className="tap-target inline-flex items-center gap-1.5 px-1 py-1 text-[11px] font-bold text-gray-600">
            <input
              type="checkbox"
              checked={onlineToday}
              onChange={(e) => setOnlineToday(e.target.checked)}
              className="h-3.5 w-3.5 accent-brand"
            />
            Online today
          </label>
          <span className="ml-auto inline-flex items-center gap-1.5">
            <span className="text-[10px] font-semibold text-gray-400">
              Sort
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className={selectCls}
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </span>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid gap-3 py-8 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-44 animate-pulse rounded-2xl bg-gray-100"
              />
            ))}
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-sm font-bold text-gray-800">
              Couldn&apos;t load helpers
            </p>
            <button
              onClick={fetchOffers}
              className="tap-target mt-2 text-xs font-bold text-brand-text"
            >
              Try again
            </button>
          </div>
        ) : sorted.length === 0 ? (
          <div className="py-14 text-center">
            <UsersRound className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-3 text-sm font-bold text-gray-800">
              No helpers match your filters
            </p>
            <p className="mx-auto mt-1 max-w-xs text-[11px] leading-relaxed text-gray-500">
              Try widening the distance or clearing a filter. Or post your task
              and we&apos;ll notify nearby runners.
            </p>
            <Link
              href="/tasks/create"
              className="tap-target mt-4 inline-block rounded-xl bg-brand px-6 py-2.5 text-xs font-bold text-on-brand shadow-sm transition-opacity hover:opacity-90"
            >
              Post a Task
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((offer) => (
              <HelperCard key={offer.id} offer={offer} wide />
            ))}
          </div>
        )}

        {!coords && !locating && (
          <p className="flex items-center justify-center gap-1 text-[10px] text-gray-400">
            <MapPin className="h-3 w-3" />
            Share your location to sort by distance and see who&apos;s nearest.
          </p>
        )}
      </div>
    </div>
  );
}