"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, ChevronRight, MapPin, Crosshair, Clock, Zap,
  AlertTriangle, ShieldCheck, Loader2, CheckCircle2, ArrowLeft,
  DollarSign, Info, ShoppingBag, Store,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store";
import { get, post } from "@/lib/apiClient";
import { getCategoryDisplayName, getCategoryColor, getCategoryIcon } from "@/lib/categoryConfig";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { useAuthInit } from "@/hooks/useAuthInit";
import { ProgressSteps } from "@/components/ui/progress-steps";
import PurchaseBudgetCard from "@/components/tasks/PurchaseBudgetCard";

interface Category {
  id: string;
  name: string;
  icon: string;
}

const PLATFORM_FEE_PERCENT = 10;
const STEPS = [
  { num: 1, label: "Task" },
  { num: 2, label: "Budget" },
  { num: 3, label: "Location" },
  { num: 4, label: "Review" },
];

export default function CreatePurchaseTaskPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  useAuthInit();

  useEffect(() => {
    if (!user) router.push("/login");
  }, [user, router]);

  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [catLoading, setCatLoading] = useState(true);

  // Step 1: Task info
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [storeName, setStoreName] = useState("");

  // Step 2: Budget
  const [estimatedItemCostNaira, setEstimatedItemCostNaira] = useState("");
  const [runnerFeeNaira, setRunnerFeeNaira] = useState("");
  const [maxAdditionalSpendingNaira, setMaxAdditionalSpendingNaira] = useState("");

  // Step 3: Location
  const [locationLabel, setLocationLabel] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [deadline, setDeadline] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  // WHAT: Live wallet balance — fetched on mount because the auth store's
  //       wallet snapshot goes stale once escrow locks or deposits land
  // WHY: The submit guard must match what the server will check, otherwise
  //      posting fails with a surprise 400
  const [liveBalanceKobo, setLiveBalanceKobo] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    setCatLoading(true);
    get<Category[] | { success: boolean; data: Category[] }>("/categories")
      .then((res) => {
        if (Array.isArray(res)) setCategories(res);
        else if (res?.success && Array.isArray(res.data)) setCategories(res.data);
      })
      .catch(() => {})
      .finally(() => setCatLoading(false));

    get<{ success?: boolean; data?: { balance_kobo?: number }; balance_kobo?: number }>("/wallet")
      .then((res) => {
        const kobo = res?.data?.balance_kobo ?? res?.balance_kobo;
        if (typeof kobo === "number") setLiveBalanceKobo(kobo);
      })
      .catch(() => {});
  }, [user]);

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const estCost = parseFloat(estimatedItemCostNaira) || 0;
  const runnerFee = parseFloat(runnerFeeNaira) || 0;
  const platformFee = Math.floor(runnerFee * PLATFORM_FEE_PERCENT / 100);
  const maxAdd = parseFloat(maxAdditionalSpendingNaira) || 0;
  const total = estCost + runnerFee + platformFee;
  const balanceKobo = liveBalanceKobo ?? user?.wallet?.balanceKobo ?? 0;
  const hasEnough = total === 0 || balanceKobo >= total * 100;

  function detectLocation() {
    if (!navigator.geolocation) { setGeoError("GPS not supported"); return; }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); setLocating(false); },
      (err) => {
        setGeoError(err.code === 1 ? "Location permission denied" : "Could not detect location");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function validateStep(s: number): boolean {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!categoryId) e.categoryId = "Select a category";
      if (!title.trim() || title.trim().length < 5) e.title = "Title must be at least 5 characters";
      if (!description.trim() || description.trim().length < 10) e.description = "Description must be at least 10 characters";
    }
    if (s === 2) {
      if (!estimatedItemCostNaira || estCost < 1) e.estimatedItemCostNaira = "Enter estimated cost";
      if (!runnerFeeNaira || runnerFee < 50) e.runnerFeeNaira = "Runner fee must be at least ₦50";
    }
    if (s === 3) {
      if (!locationLabel.trim()) e.locationLabel = "Enter a delivery location";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function nextStep() { if (validateStep(step)) setStep((s) => Math.min(s + 1, 4)); }
  function prevStep() { setStep((s) => Math.max(s - 1, 1)); setErrors({}); }

  async function handleSubmit() {
    if (!validateStep(4)) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const deadlineISO = deadline ? new Date(deadline).toISOString() : undefined;
      const res = await post<{ success: boolean; data: { taskId: string } }>("/purchase", {
        categoryId,
        title: title.trim(),
        description: description.trim(),
        estimatedItemCostNaira: estCost,
        runnerFeeNaira: runnerFee,
        maxAdditionalSpendingNaira: maxAdd,
        storeName: storeName.trim() || undefined,
        deadline: deadlineISO,
        isUrgent,
        locationLabel: locationLabel.trim() || undefined,
        lat: lat ?? undefined,
        lng: lng ?? undefined,
      });

      if (res.success) {
        // Now fund the escrow
        try {
          await post(`/purchase/${res.data.taskId}/fund`);
          setCreatedTaskId(res.data.taskId);
          toast.success("Task created and escrow funded!");
          router.push(`/tasks/${res.data.taskId}`);
        } catch {
          setCreatedTaskId(res.data.taskId);
          toast.success("Task created! Fund escrow from the task page.");
          router.push(`/tasks/${res.data.taskId}`);
        }
      } else {
        setSubmitError("Failed to create purchase task");
      }
    } catch (err: any) {
      // WHAT: Prefer the server's reason (validation hint, balance check, etc.)
      // WHY: axios's default "Request failed with status code 400" tells the
      //      user nothing about what to fix
      const msg =
        err?.response?.data?.message ||
        (err instanceof Error ? err.message : "Something went wrong");
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) return null;

  return (
    <>
      <div className="min-h-screen page-shell">
        <div className="bg-surface px-4 py-3 shadow-sm">
          <div className="mx-auto flex max-w-lg items-center gap-3">
            <button
              type="button"
              onClick={() => (step > 1 ? prevStep() : router.push("/tasks/create"))}
              className="tap-target flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-elevated"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <ProgressSteps
                steps={STEPS.map((s) => ({ id: String(s.num), label: s.label }))}
                currentStep={step - 1}
              />
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-lg px-4 pb-8 pt-6">
          {/* Step 1: Task Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingBag className="h-5 w-5 text-brand-text" />
                <h2 className="font-display text-lg font-bold text-gray-900">Purchase Task</h2>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-900">Category</label>
                {catLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                  </div>
                ) : (
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {categories.map((cat) => {
                      const name = getCategoryDisplayName(cat.name);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategoryId(cat.id)}
                          className={`tap-target flex items-center gap-1.5 whitespace-nowrap rounded-full border-2 px-4 py-2 text-sm font-semibold transition-all shrink-0 ${
                            categoryId === cat.id
                              ? "border-gold bg-gold-light/30 text-gold-dark shadow-sm"
                              : "border-card-border bg-surface text-gray-600 hover:border-gray-400"
                          }`}
                        >
                          <CategoryIcon
                            name={getCategoryIcon(cat.name)}
                            className="h-4 w-4"
                            style={{ color: getCategoryColor(cat.name) }}
                          />
                          <span>{name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {errors.categoryId && <p className="mt-1 text-xs text-error-text">{errors.categoryId}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-gray-900">Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Buy groceries from Shoprite"
                  maxLength={200}
                  className={`w-full rounded-xl border-2 px-4 py-3 text-sm outline-none placeholder:text-foreground-muted ${
                    errors.title ? "border-error-border" : "border-border-default focus:border-brand"
                  }`}
                />
                {errors.title && <p className="mt-1 text-xs text-error-text">{errors.title}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-gray-900">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what items to buy, preferred brands, quantities..."
                  rows={4} maxLength={2000}
                  className={`w-full resize-none rounded-xl border-2 px-4 py-3 text-sm outline-none placeholder:text-foreground-muted ${
                    errors.description ? "border-error-border" : "border-border-default focus:border-brand"
                  }`}
                />
                {errors.description && <p className="mt-1 text-xs text-error-text">{errors.description}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-gray-900">
                  Store <span className="font-normal text-gray-500">(optional)</span>
                </label>
                <div className="relative">
                  <Store className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
                  <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)}
                    placeholder="e.g. Shoprite, Spar, MilkHub"
                    className="w-full rounded-xl border-2 border-border-default px-4 py-3 pl-10 text-sm outline-none focus:border-brand"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Budget */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="font-display text-lg font-bold text-gray-900">Budget</h2>

              <div>
                <label className="mb-1 block text-sm font-bold text-gray-900">Estimated Item Cost (₦)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-600">₦</span>
                  <input type="number" value={estimatedItemCostNaira} onChange={(e) => setEstimatedItemCostNaira(e.target.value)}
                    placeholder="e.g. 4300" min={1}
                    className={`w-full rounded-xl border-2 px-8 py-3 pl-10 text-sm outline-none ${
                      errors.estimatedItemCostNaira ? "border-error-border" : "border-border-default focus:border-brand"
                    }`}
                  />
                </div>
                {errors.estimatedItemCostNaira && <p className="mt-1 text-xs text-error-text">{errors.estimatedItemCostNaira}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-gray-900">Runner Fee (₦)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-600">₦</span>
                  <input type="number" value={runnerFeeNaira} onChange={(e) => setRunnerFeeNaira(e.target.value)}
                    placeholder="e.g. 700" min={50}
                    className={`w-full rounded-xl border-2 px-8 py-3 pl-10 text-sm outline-none ${
                      errors.runnerFeeNaira ? "border-error-border" : "border-border-default focus:border-brand"
                    }`}
                  />
                </div>
                {errors.runnerFeeNaira && <p className="mt-1 text-xs text-error-text">{errors.runnerFeeNaira}</p>}
                <p className="mt-1 text-[11px] text-gray-500">
                  Platform fee ({PLATFORM_FEE_PERCENT}%): ₦{platformFee.toLocaleString()}
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-gray-900">
                  Maximum Additional Spending Allowed (₦)
                  <span className="font-normal text-gray-500"> (optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-600">₦</span>
                  <input type="number" value={maxAdditionalSpendingNaira} onChange={(e) => setMaxAdditionalSpendingNaira(e.target.value)}
                    placeholder="e.g. 500" min={0}
                    className="w-full rounded-xl border-2 border-border-default px-8 py-3 pl-10 text-sm outline-none focus:border-brand"
                  />
                </div>
                <p className="mt-1 text-[11px] text-gray-500">
                  Runner can spend up to this amount above estimate without asking approval
                </p>
              </div>

              {/* Live budget preview */}
              {estCost > 0 && runnerFee > 0 && (
                <PurchaseBudgetCard
                  estimatedItemCostNaira={estCost}
                  runnerFeeNaira={runnerFee}
                  platformFeeNaira={platformFee}
                  maxAdditionalSpendingNaira={maxAdd}
                />
              )}
            </div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="font-display text-lg font-bold text-gray-900">Delivery Location</h2>

              <div>
                <label className="mb-1 block text-sm font-bold text-gray-900">Delivery Location</label>
                <div className="flex gap-2">
                  <input type="text" value={locationLabel} onChange={(e) => setLocationLabel(e.target.value)}
                    placeholder="e.g. New Lecture Hall, Main Campus"
                    className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm outline-none placeholder:text-foreground-muted ${
                      errors.locationLabel ? "border-error-border focus:border-error" : "border-border-default focus:border-brand"
                    }`}
                  />
                  <button type="button" onClick={detectLocation} disabled={locating}
                    className="tap-target flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-card-border bg-surface text-gray-500 hover:border-brand hover:text-brand-text disabled:opacity-50"
                  >
                    {locating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Crosshair className="h-5 w-5" />}
                  </button>
                </div>
                {errors.locationLabel && <p className="mt-1 text-xs text-error-text">{errors.locationLabel}</p>}
                {geoError && <p className="mt-1 flex items-center gap-1 text-xs text-error-text"><AlertTriangle className="h-3 w-3" />{geoError}</p>}
                {lat !== null && lng !== null && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-brand-text"><MapPin className="h-3 w-3" />Coordinates detected</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-gray-900">Deadline <span className="font-normal text-gray-500">(optional)</span></label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
                  <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                    className="w-full rounded-xl border-2 border-border-default px-4 py-3 pl-10 text-sm outline-none focus:border-brand"
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border-2 border-card-border bg-surface px-4 py-3.5 transition-colors hover:border-gold/50">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full ${isUrgent ? "bg-gold/20" : "bg-surface-secondary"}`}>
                    <Zap className={`h-5 w-5 ${isUrgent ? "text-gold" : "text-foreground-muted"}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Urgent</p>
                    <p className="text-[11px] text-gray-500">Runner needed ASAP</p>
                  </div>
                </div>
                <div className={`relative h-6 w-11 rounded-full transition-colors ${isUrgent ? "bg-gold" : "bg-gray-400"}`}>
                  <div className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isUrgent ? "translate-x-5" : ""}`} />
                </div>
                <input type="checkbox" checked={isUrgent} onChange={(e) => setIsUrgent(e.target.checked)} className="sr-only" />
              </label>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="font-display text-lg font-bold text-gray-900">Review your purchase task</h2>

              <div className="space-y-4 rounded-2xl border border-card-border bg-surface p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Category</span>
                  <span
                    className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: getCategoryColor(selectedCategory?.name ?? "other") }}
                  >
                    <CategoryIcon name={getCategoryIcon(selectedCategory?.name ?? "other")} className="h-3 w-3" strokeWidth={2.5} />
                    {selectedCategory
                      ? getCategoryDisplayName(selectedCategory.name)
                      : "Select a category"}
                  </span>
                </div>
                <hr className="border-border-subtle" />

                <div>
                  <span className="text-xs text-gray-500">Title</span>
                  <p className="mt-0.5 text-sm font-medium text-gray-900">{title}</p>
                </div>
                <hr className="border-border-subtle" />

                <div>
                  <span className="text-xs text-gray-500">Description</span>
                  <p className="mt-0.5 text-sm leading-relaxed text-gray-700 line-clamp-4">{description}</p>
                </div>
                <hr className="border-border-subtle" />

                {storeName && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Store</span>
                      <span className="text-xs font-medium text-gray-700">{storeName}</span>
                    </div>
                    <hr className="border-border-subtle" />
                  </>
                )}

                <PurchaseBudgetCard
                  estimatedItemCostNaira={estCost}
                  runnerFeeNaira={runnerFee}
                  platformFeeNaira={platformFee}
                  maxAdditionalSpendingNaira={maxAdd}
                />
                <hr className="border-border-subtle" />

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Location</span>
                  <span className="flex items-center gap-1 text-xs font-medium text-gray-700">
                    <MapPin className="h-3 w-3" />{locationLabel}{lat !== null && <span className="text-gray-500">(GPS)</span>}
                  </span>
                </div>

                {deadline && (
                  <>
                    <hr className="border-border-subtle" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Deadline</span>
                      <span className="flex items-center gap-1 text-xs font-medium text-gray-700">
                        <Clock className="h-3 w-3" />
                        {new Date(deadline).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </>
                )}

                {isUrgent && (
                  <>
                    <hr className="border-border-subtle" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Priority</span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-warning-light px-2 py-0.5 text-xs font-bold text-warning">
                        <Zap className="h-3 w-3" />URGENT
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Escrow info */}
              <div className="flex items-start gap-2 rounded-xl bg-brand-light/30 px-4 py-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-text" />
                <p className="text-xs leading-relaxed text-gray-600">
                  <strong>Full amount locked in NeedFull Escrow.</strong>{" "}
                  Funds are only released to the runner after delivery is confirmed.
                  Your wallet will be charged <strong>₦{total.toLocaleString()}</strong> immediately.
                </p>
              </div>

              {submitError && (
                <div className="rounded-xl border border-error-border bg-error-bg px-4 py-3">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-error-text">
                    <AlertTriangle className="h-4 w-4" />{submitError}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex gap-3">
            {step > 1 && (
              <button type="button" onClick={prevStep}
                className="tap-target flex w-14 items-center justify-center rounded-xl border-2 border-card-border bg-surface py-3.5 hover:bg-surface-elevated"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
            )}

            {step < 4 ? (
              <button type="button" onClick={nextStep}
                className="tap-target flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand py-3.5 text-base font-bold text-on-brand shadow-sm hover:bg-brand-dark"
              >
                Continue <ChevronRight className="h-5 w-5" />
              </button>
            ) : (
              <>
                <button type="button" onClick={handleSubmit}
                  disabled={submitting || !hasEnough}
                  className="tap-target flex flex-1 items-center justify-center gap-2 rounded-xl bg-gold py-3.5 text-base font-bold text-white shadow-sm hover:bg-gold-dark disabled:opacity-60"
                >
                  {submitting ? (
                    <><Loader2 className="h-5 w-5 animate-spin" />Creating...</>
                  ) : (
                    <><ShieldCheck className="h-5 w-5" /> Fund Escrow — ₦{total.toLocaleString()}</>
                  )}
                </button>
                {!hasEnough && (
                  <button type="button" onClick={() => router.push("/wallet/fund")}
                    className="tap-target mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-brand bg-surface py-3 text-sm font-bold text-brand-text hover:bg-brand-light/30"
                  >
                    Fund Wallet
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
