// WHAT: Runner availability manager — create and manage "I am available" offers
// WHY: The Runner's primary action. Lightweight form: what service, a short
//      note, how far they'll travel, until when, and whether they're online today.

"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  MapPin,
  Loader2,
  Wifi,
  CalendarDays,
  Navigation,
} from "lucide-react";
import toast from "react-hot-toast";
import { get, post, patch } from "@/lib/apiClient";
import { getCategoryDisplayName, getCategoryColor, getCategoryIcon } from "@/lib/categoryConfig";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { useAuthInit, useIsAuthenticated } from "@/store";

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface OfferItem {
  id: string;
  category: { id: string; name: string; icon: string };
  note: string;
  availableUntil: string | null;
  maxTravelKm: number;
  isOnlineToday: boolean;
  locationLabel: string | null;
  createdAt: string;
}

const TRAVEL_OPTIONS = [
  { value: 1, label: "1km" },
  { value: 2, label: "2km" },
  { value: 5, label: "5km" },
  { value: 10, label: "10km+" },
];

// WHAT: Reuse the location the runner already saved when going online, if any
function savedLocation(): { lat: number; lng: number } | null {
  try {
    const raw = localStorage.getItem("nf_runner_location");
    if (!raw) return null;
    const loc = JSON.parse(raw);
    return loc && typeof loc.lat === "number" && typeof loc.lng === "number" ? loc : null;
  } catch {
    return null;
  }
}

export default function AvailabilityPage() {
  const router = useRouter();
  useAuthInit();
  const isAuthenticated = useIsAuthenticated();

  const [categories, setCategories] = useState<Category[]>([]);
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");
  const [travel, setTravel] = useState<number>(5);
  const [until, setUntil] = useState("");
  const [onlineToday, setOnlineToday] = useState(true);
  const [geolocating, setGeolocating] = useState(false);
  const [hasLocation, setHasLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchOffers = useCallback(async () => {
    try {
      const res = await get<{ success: boolean; data: OfferItem[] }>(
        "/availability/mine",
      );
      setOffers(res.success ? res.data : []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    get<Category[] | { success: boolean; data: Category[] }>("/categories")
      .then((res) => {
        if (cancelled) return;
        if (Array.isArray(res)) setCategories(res);
        else if (res?.success && Array.isArray(res.data)) setCategories(res.data);
      })
      .catch(() => { /* categories are optional here */ });
    fetchOffers();
    setHasLocation(savedLocation() !== null);
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, fetchOffers]);

  const useMyLocation = () => {
    if (hasLocation) {
      setHasLocation(false);
      return;
    }
    if (!navigator.geolocation) {
      toast("Location not available — offer still reaches campus posts");
      setHasLocation(false);
      return;
    }
    setGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        localStorage.setItem(
          "nf_runner_availability_location",
          JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        );
        setHasLocation(true);
        setGeolocating(false);
      },
      () => {
        setHasLocation(false);
        setGeolocating(false);
        toast("Location unavailable — we'll keep you on the campus default.");
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  };

  const submit = async () => {
    if (!categoryId) {
      toast.error("Pick a service you can help with");
      return;
    }
    setSubmitting(true);
    try {
      const loc = hasLocation ? currentLocation() : null;
      const res = await post<{ success: boolean; message: string }>(
        "/availability",
        {
          categoryId,
          note: note.trim(),
          maxTravelKm: travel,
          availableUntil: until ? new Date(`${until}T23:59:59`).toISOString() : null,
          isOnlineToday: onlineToday,
          lat: loc?.lat ?? null,
          lng: loc?.lng ?? null,
        },
      );
      if (res.success) {
        toast.success("You're now available — nearby posters can find you");
        setNote("");
        setUntil("");
        fetchOffers();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Couldn't create your offer");
    } finally {
      setSubmitting(false);
    }
  };

  function currentLocation(): { lat: number; lng: number } | null {
    try {
      const raw = localStorage.getItem("nf_runner_availability_location");
      if (!raw) return null;
      const loc = JSON.parse(raw);
      return loc && typeof loc.lat === "number" && typeof loc.lng === "number" ? loc : null;
    } catch {
      return null;
    }
  }

  const endOffer = async (id: string) => {
    try {
      await patch<{ success: boolean }>(`/availability/${id}/deactivate`);
      setOffers((prev) => prev.filter((o) => o.id !== id));
      toast.success("Offer ended");
    } catch {
      toast.error("Couldn't end the offer");
    }
  };

  if (!isAuthenticated) return null;

  const minDate = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen page-shell pb-12">
      <div className="glass-dark px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/feed")}
            className="tap-target rounded-lg p-2 hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">Your Offers</h1>
            <p className="text-[11px] text-white/70">Tell nearby posters what you can do</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Create offer */}
        <div className="overflow-hidden rounded-2xl border border-card-border bg-surface shadow-sm">
          <div className="border-b border-card-border px-4 py-3">
            <h2 className="flex items-center gap-1.5 font-display text-sm font-bold text-gray-900">
              <Wifi className="h-4 w-4 text-gold" />
              Offer Your Services
            </h2>
            <p className="mt-0.5 text-[11px] text-gray-500">
              Not a storefront — just a signal: "I'm around if you need this."
            </p>
          </div>

          <div className="space-y-4 p-4">
            <div>
              <p className="mb-2 text-xs font-bold text-gray-700">What can you help with?</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategoryId(c.id)}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                      categoryId === c.id
                        ? "text-white shadow-sm"
                        : "border border-card-border bg-surface-secondary text-gray-700"
                    }`}
                    style={categoryId === c.id ? { backgroundColor: getCategoryColor(c.name) } : undefined}
                  >
                    <CategoryIcon
                      name={getCategoryIcon(c.name)}
                      className="h-3.5 w-3.5"
                      style={{ color: categoryId === c.id ? "#ffffff" : getCategoryColor(c.name) }}
                    />
                    {getCategoryDisplayName(c.name)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-gray-700">
                Short note <span className="font-medium text-foreground-muted">(optional)</span>
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={200}
                rows={2}
                placeholder="e.g. Errands around Oye hostels, quick and careful"
                className="w-full rounded-xl border border-border-default p-3 text-sm focus:border-brand focus:outline-none"
              />
              <p className="mt-1 text-right text-[10px] text-foreground-muted">
                {note.length}/200
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-gray-700">
                  Max travel
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {TRAVEL_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTravel(opt.value)}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors ${
                        travel === opt.value
                          ? "bg-gold text-white shadow-sm"
                          : "border border-card-border bg-surface-secondary text-gray-600"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 flex items-center gap-1 text-xs font-bold text-gray-700">
                  <CalendarDays className="h-3.5 w-3.5 text-foreground-muted" />
                  Available until
                </label>
                <input
                  type="date"
                  value={until}
                  min={minDate}
                  onChange={(e) => setUntil(e.target.value)}
                  className="w-full rounded-xl border border-border-default px-3 py-2 text-xs focus:border-brand focus:outline-none"
                />
                <p className="mt-1 text-[10px] text-foreground-muted">Leave blank = open-ended</p>
              </div>
            </div>

            <button
              type="button"
              onClick={useMyLocation}
              disabled={geolocating}
              className={`flex w-full items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-bold transition-colors ${
                hasLocation
                  ? "border-success-border bg-success-bg text-success-text"
                  : "border-card-border bg-surface-secondary text-gray-600"
              }`}
            >
              {geolocating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : hasLocation ? (
                <>
                  <Check className="h-4 w-4" />
                  Location set — posters near you will see distance
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4" />
                  Use my current location
                </>
              )}
            </button>

            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-card-border bg-surface-secondary px-4 py-3">
              <span>
                <span className="block text-xs font-bold text-gray-800">Online today</span>
                <span className="block text-[11px] text-gray-500">
                  Show me as reachable in your offer
                </span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={onlineToday}
                onClick={() => setOnlineToday((v) => !v)}
                className={`relative h-6 w-11 rounded-full transition-colors ${onlineToday ? "bg-brand" : "bg-gray-300"}`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                    onlineToday ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </label>

            <button
              type="button"
              onClick={submit}
              disabled={submitting || !categoryId}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3.5 text-base font-bold text-white shadow-md shadow-gold/25 transition-all hover:brightness-105 active:scale-[0.97] disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Wifi className="h-5 w-5" />
              )}
              {submitting ? "Making you available…" : "Make Me Available"}
            </button>
          </div>
        </div>

        {/* Active offers */}
        <div>
          <h2 className="mb-2 flex items-center gap-1.5 font-display text-sm font-bold text-gray-900">
            <Wifi className="h-4 w-4 text-gold" />
            Active Offers
          </h2>
          {loading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-14 skeleton rounded-xl" />
              <div className="h-14 skeleton rounded-xl" />
            </div>
          ) : offers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border-default px-4 py-8 text-center">
              <Wifi className="mx-auto h-6 w-6 text-foreground-muted" />
              <p className="mt-2 text-sm font-bold text-gray-900">No active offers</p>
              <p className="mx-auto mt-1 max-w-[16rem] text-xs text-gray-500">
                Create an offer above and nearby posters will start finding you.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className="flex items-center gap-3 rounded-2xl border border-card-border bg-surface p-3.5 shadow-sm"
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                    style={{ backgroundColor: getCategoryColor(offer.category?.name ?? "other") }}
                  >
                    <CategoryIcon name={getCategoryIcon(offer.category?.name ?? "other")} className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                      {offer.category?.name
                        ? getCategoryDisplayName(offer.category.name)
                        : "Help"}
                      {offer.isOnlineToday && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success-bg px-1.5 py-0.5 text-[9px] font-bold text-success-text">
                          <span className="h-1.5 w-1.5 rounded-full bg-success" />
                          ONLINE
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {offer.maxTravelKm}km{offer.locationLabel ? ` · ${offer.locationLabel}` : ""}
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
                  <button
                    type="button"
                    onClick={() => endOffer(offer.id)}
                    className="shrink-0 rounded-lg border border-card-border px-3 py-1.5 text-[11px] font-bold text-gray-600 transition-all active:scale-[0.97]"
                  >
                    End
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="pt-1 text-center text-[11px] text-foreground-muted">
          While you wait, find something to do now →{" "}
          <button
            type="button"
            onClick={() => router.push("/hustle")}
            className="font-bold text-brand-text hover:underline"
          >
            Find Tasks
          </button>
        </p>
      </div>
    </div>
  );
}