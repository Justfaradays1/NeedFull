// WHAT: 3-step task posting form — category, location/deadline, review & post
// WHY: Guided creation flow ensures complete task data before wallet escrow
// FUTURE: Add draft save, add AI budget suggestions, add image upload step

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Crosshair,
  Clock,
  Zap,
  AlertTriangle,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  DollarSign,
  Info,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { get, post } from '@/lib/apiClient';
import { useAuthInit } from '@/hooks/useAuthInit';

// WHAT: Category shape from API
interface Category {
  id: string;
  name: string;
  icon: string;
}

// WHAT: Budget suggestions per category name
const BUDGET_SUGGESTIONS: Record<string, { min: number; max: number }> = {
  Delivery: { min: 500, max: 2000 },
  Shopping: { min: 1000, max: 5000 },
  Assignment: { min: 500, max: 3000 },
  Tutoring: { min: 1000, max: 5000 },
  Tech: { min: 1000, max: 10000 },
  Handyman: { min: 2000, max: 10000 },
  Event: { min: 2000, max: 15000 },
  Other: { min: 500, max: 5000 },
};

// WHAT: Steps for the progress indicator
const STEPS = [
  { num: 1, label: 'What' },
  { num: 2, label: 'Where & When' },
  { num: 3, label: 'Review' },
];

// WHAT: Platform fee configuration (mirrors backend)
const PLATFORM_FEE_PERCENT = 10;

export default function CreateTaskPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  useAuthInit();

  // WHAT: Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // WHAT: Step state
  const [step, setStep] = useState(1);

  // WHAT: Categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [catLoading, setCatLoading] = useState(true);

  // WHAT: Form data
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budgetNaira, setBudgetNaira] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [deadline, setDeadline] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);

  // WHAT: GPS state
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // WHAT: Submit state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);

  // WHAT: Field-level errors per step
  const [errors, setErrors] = useState<Record<string, string>>({});

  // WHAT: Load categories on mount
  useEffect(() => {
    if (!user) return;
    setCatLoading(true);
    get<{ success: boolean; data: Category[] }>('/categories')
      .then((res) => { if (res.success) setCategories(res.data); })
      .catch(() => {})
      .finally(() => setCatLoading(false));
  }, [user]);

  // WHAT: Find selected category name for suggestions
  const selectedCategory = categories.find((c) => c.id === categoryId);
  const suggestion = selectedCategory
    ? BUDGET_SUGGESTIONS[selectedCategory.name] ?? BUDGET_SUGGESTIONS.Other
    : null;

  // WHAT: Budget naira as number
  const budgetNum = parseFloat(budgetNaira) || 0;
  const platformFee = budgetNum * (PLATFORM_FEE_PERCENT / 100);
  const totalDeduction = budgetNum + platformFee;

  // WHAT: GPS location detection
  function detectLocation() {
    if (!navigator.geolocation) {
      setGeoError('GPS not supported on this device');
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocating(false);
      },
      (err) => {
        setGeoError(
          err.code === 1
            ? 'Location permission denied. Enable GPS and try again.'
            : 'Could not detect location. Try again.',
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  // WHAT: Validate current step, return true if valid
  function validateStep(s: number): boolean {
    const newErrors: Record<string, string> = {};

    if (s === 1) {
      if (!categoryId) newErrors.categoryId = 'Select a category';
      if (!title.trim() || title.trim().length < 5)
        newErrors.title = 'Title must be at least 5 characters';
      if (title.trim().length > 200)
        newErrors.title = 'Title must be under 200 characters';
      if (!description.trim() || description.trim().length < 10)
        newErrors.description = 'Description must be at least 10 characters';
      if (description.trim().length > 2000)
        newErrors.description = 'Description must be under 2000 characters';
      if (!budgetNaira || budgetNum < 50)
        newErrors.budgetNaira = 'Budget must be at least ₦50';
    }

    if (s === 2) {
      if (!locationLabel.trim())
        newErrors.locationLabel = 'Enter a location or use GPS';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // WHAT: Go to next step
  function nextStep() {
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, 3));
    }
  }

  function prevStep() {
    setStep((s) => Math.max(s - 1, 1));
    setErrors({});
  }

  // WHAT: Submit the task
  async function handleSubmit() {
    if (!validateStep(3)) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const deadlineISO = deadline ? new Date(deadline).toISOString() : undefined;

      const res = await post<{ success: boolean; data: { id: string } }>(
        '/tasks',
        {
          categoryId,
          title: title.trim(),
          description: description.trim(),
          budgetNaira: budgetNum,
          deadline: deadlineISO,
          isUrgent,
          locationLabel: locationLabel.trim() || undefined,
          lat: lat ?? undefined,
          lng: lng ?? undefined,
        },
      );

      if (res.success) {
        setCreatedTaskId(res.data.id);
        setSuccess(true);
      } else {
        setSubmitError('Failed to create task. Please try again.');
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  // WHAT: Navigate to task detail after success
  function goToTask() {
    if (createdTaskId) router.push(`/tasks/${createdTaskId}`);
  }

  if (!user) return null;

  // ─── SUCCESS SCREEN ───────────────────────
  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-light">
          <CheckCircle2 className="h-10 w-10 text-brand" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold text-gray-900">
          Task Posted!
      </h1>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-600">
          Your task is now live. Runners in your area will be notified. Your wallet will only be charged when you accept a runner.
        </p>
        <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
          <button
            type="button"
            onClick={goToTask}
            className="tap-target w-full rounded-xl bg-gold py-3.5 text-base font-bold text-white shadow-sm hover:bg-gold-dark"
          >
            View Task
          </button>
          <button
            type="button"
            onClick={() => router.push('/feed')}
            className="tap-target w-full rounded-xl border border-gray-300 bg-surface py-3.5 text-base font-semibold text-gray-600 hover:bg-gray-50"
          >
            Back to Feed
          </button>
        </div>
      </div>
    );
  }

  // ─── MAIN FORM ────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* WHAT: Top bar with back button */}
      <div className="sticky top-0 z-10 bg-surface px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <button
            type="button"
            onClick={() => (step > 1 ? prevStep() : router.push('/feed'))}
            className="tap-target flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              {STEPS.map((s, i) => (
                <div key={s.num} className="flex items-center gap-1">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                      step > s.num
                        ? 'bg-brand text-white'
                        : step === s.num
                          ? 'border-2 border-brand bg-brand text-white'
                          : 'border-2 border-gray-300 bg-surface text-gray-400'
                    }`}
                  >
                    {step > s.num ? <Check className="h-3 w-3" /> : s.num}
                  </div>
                  <span
                    className={`hidden text-xs font-medium sm:inline ${
                      step === s.num ? 'text-brand' : 'text-gray-400'
                    }`}
                  >
                    {s.label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`mx-1 h-0.5 w-6 rounded-full sm:w-10 ${
                        step > s.num ? 'bg-brand' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* WHAT: Form content */}
      <div className="mx-auto max-w-lg px-4 pb-8 pt-6">
        {/* ── Step 1: What ── */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Category grid */}
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-800">
                Category
              </label>
              {catLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading categories...
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryId(cat.id)}
                      className={`tap-target flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-center transition-all ${
                        categoryId === cat.id
                          ? 'border-gold bg-gold-light/30 shadow-sm'
                          : 'border-card-border bg-surface hover:border-gray-300'
                      }`}
                    >
                      <span className="text-lg">{cat.icon}</span>
                      <span className="text-[10px] font-medium leading-tight text-gray-600">
                        {cat.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {errors.categoryId && (
                <p className="mt-1 text-xs text-red-500">{errors.categoryId}</p>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="mb-1 block text-sm font-bold text-gray-800">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Pick up my laundry from hall A"
                maxLength={200}
                className={`w-full rounded-xl border-2 px-4 py-3 text-sm outline-none transition-colors placeholder:text-gray-400 ${
                  errors.title
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-200 focus:border-brand'
                }`}
              />
              {errors.title && (
                <p className="mt-1 text-xs text-red-500">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="mb-1 block text-sm font-bold text-gray-800">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what needs to be done in detail..."
                rows={4}
                maxLength={2000}
                className={`w-full resize-none rounded-xl border-2 px-4 py-3 text-sm outline-none transition-colors placeholder:text-gray-400 ${
                  errors.description
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-200 focus:border-brand'
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-500">{errors.description}</p>
              )}
            </div>

            {/* Budget */}
            <div>
              <label className="mb-1 block text-sm font-bold text-gray-800">
                Budget
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-600">
                  ₦
                </span>
                <input
                  type="number"
                  value={budgetNaira}
                  onChange={(e) => setBudgetNaira(e.target.value)}
                  placeholder="e.g. 2000"
                  min={50}
                  className={`w-full rounded-xl border-2 px-8 py-3 pl-10 text-sm outline-none transition-colors placeholder:text-gray-400 ${
                    errors.budgetNaira
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-200 focus:border-brand'
                  }`}
                />
              </div>
              {errors.budgetNaira && (
                <p className="mt-1 text-xs text-red-500">{errors.budgetNaira}</p>
              )}

              {/* Fair price suggestion */}
              {suggestion && (
                <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-brand-light/40 px-3 py-2">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                  <p className="text-[11px] leading-relaxed text-gray-600">
                    Fair price suggestion for <strong>{selectedCategory?.name}</strong>:{' '}
                    <strong>₦{suggestion.min.toLocaleString()} – ₦{suggestion.max.toLocaleString()}</strong>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 2: Where & When ── */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Location */}
            <div>
              <label className="mb-1 block text-sm font-bold text-gray-800">
                Location
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={locationLabel}
                  onChange={(e) => setLocationLabel(e.target.value)}
                  placeholder="e.g. New Lecture Hall, Main Campus"
                  className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm outline-none transition-colors placeholder:text-gray-400 ${
                    errors.locationLabel
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-200 focus:border-brand'
                  }`}
                />
                <button
                  type="button"
                  onClick={detectLocation}
                  disabled={locating}
                  className="tap-target flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-xl border-2 border-card-border bg-surface text-gray-500 hover:border-brand hover:text-brand disabled:opacity-50"
                >
                  {locating ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Crosshair className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.locationLabel && (
                <p className="mt-1 text-xs text-red-500">{errors.locationLabel}</p>
              )}
              {geoError && (
                <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
                  <AlertTriangle className="h-3 w-3" />
                  {geoError}
                </p>
              )}
              {lat !== null && lng !== null && (
                <p className="mt-1 flex items-center gap-1 text-xs text-brand">
                  <MapPin className="h-3 w-3" />
                  Coordinates detected
                </p>
              )}
            </div>

            {/* Deadline */}
            <div>
              <label className="mb-1 block text-sm font-bold text-gray-800">
                Deadline <span className="font-normal text-gray-500">(optional)</span>
              </label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 pl-10 text-sm outline-none transition-colors focus:border-brand"
                />
              </div>
            </div>

            {/* Urgent toggle */}
            <label className="flex cursor-pointer items-center justify-between rounded-xl border-2 border-card-border bg-surface px-4 py-3.5 transition-colors hover:border-gold/50">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full ${
                  isUrgent ? 'bg-gold/20' : 'bg-gray-100'
                }`}>
                  <Zap className={`h-5 w-5 ${isUrgent ? 'text-gold' : 'text-gray-400'}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Urgent</p>
                  <p className="text-[11px] text-gray-500">Runner needed ASAP</p>
                </div>
              </div>
              <div
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  isUrgent ? 'bg-gold' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    isUrgent ? 'translate-x-5' : ''
                  }`}
                />
              </div>
              <input
                type="checkbox"
                checked={isUrgent}
                onChange={(e) => setIsUrgent(e.target.checked)}
                className="sr-only"
              />
            </label>

            {/* Emergency toggle — only for verified students */}
            {user.emailVerified && (
              <label className="flex cursor-pointer items-center justify-between rounded-xl border-2 border-card-border bg-surface px-4 py-3.5 transition-colors hover:border-red-300">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full ${
                    isEmergency ? 'bg-red-100' : 'bg-gray-100'
                  }`}>
                    <AlertTriangle className={`h-5 w-5 ${isEmergency ? 'text-red-500' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Emergency</p>
                    <p className="text-[11px] text-gray-500">Critical situation — immediate response</p>
                  </div>
                </div>
                <div
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    isEmergency ? 'bg-red-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      isEmergency ? 'translate-x-5' : ''
                    }`}
                  />
                </div>
                <input
                  type="checkbox"
                  checked={isEmergency}
                  onChange={(e) => setIsEmergency(e.target.checked)}
                  className="sr-only"
                />
              </label>
            )}
            {!user.emailVerified && (
              <div className="flex items-start gap-2 rounded-xl bg-gray-50 px-4 py-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <p className="text-xs text-gray-500">
                  Emergency listing is available for verified students only.{' '}
                  <button type="button" className="font-semibold text-brand underline">
                    Verify your account
                  </button>
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Step 3: Review & Post ── */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="font-display text-lg font-bold text-gray-900 sm:text-xl">
              Review your task
            </h2>

            {/* Summary card */}
            <div className="space-y-4 rounded-2xl border border-card-border bg-surface p-4 shadow-card transition-shadow duration-200 hover:shadow-lifted active:scale-[0.99]">
              {/* Category */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Category</span>
                <span className="inline-flex items-center gap-1 rounded-md bg-brand-light px-2 py-0.5 text-xs font-semibold text-brand">
                  {selectedCategory?.icon} {selectedCategory?.name}
                </span>
              </div>
              <hr className="border-gray-100" />

              {/* Title */}
              <div>
                <span className="text-xs text-gray-500">Title</span>
                <p className="mt-0.5 text-sm font-medium text-gray-900">{title}</p>
              </div>
              <hr className="border-gray-100" />

              {/* Description */}
              <div>
                <span className="text-xs text-gray-500">Description</span>
                <p className="mt-0.5 text-sm leading-relaxed text-gray-700 line-clamp-4">
                  {description}
                </p>
              </div>
              <hr className="border-gray-100" />

              {/* Budget + fee */}
              <div>
                <span className="text-xs text-gray-500">Budget</span>
                <p className="mt-0.5 font-display text-xl font-bold text-brand">
                  ₦{budgetNum.toLocaleString()}
                </p>
                <div className="mt-2 rounded-lg bg-brand-light/30 px-3 py-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Platform fee ({PLATFORM_FEE_PERCENT}%)</span>
                    <span className="font-semibold text-gray-800">+₦{platformFee.toLocaleString()}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs font-bold">
                    <span className="text-gray-700">Total escrow hold</span>
                    <span className="text-brand">₦{totalDeduction.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <hr className="border-gray-100" />

              {/* Location */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Location</span>
                <span className="flex items-center gap-1 text-xs font-medium text-gray-700">
                  <MapPin className="h-3 w-3" />
                  {locationLabel}
                  {lat !== null && <span className="text-gray-500">(GPS)</span>}
                </span>
              </div>

              {/* Deadline */}
              {deadline && (
                <>
                  <hr className="border-gray-100" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Deadline</span>
                    <span className="flex items-center gap-1 text-xs font-medium text-gray-700">
                      <Clock className="h-3 w-3" />
                      {new Date(deadline).toLocaleDateString('en-NG', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </>
              )}

              {/* Urgency */}
              {(isUrgent || isEmergency) && (
                <>
                  <hr className="border-gray-100" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Priority</span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold ${
                        isEmergency
                          ? 'bg-red-100 text-red-600'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {isEmergency ? (
                        <AlertTriangle className="h-3 w-3" />
                      ) : (
                        <Zap className="h-3 w-3" />
                      )}
                      {isEmergency ? 'EMERGENCY' : 'URGENT'}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Info note */}
            <div className="flex items-start gap-2 rounded-xl bg-brand-light/30 px-4 py-3">
              <DollarSign className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <p className="text-xs leading-relaxed text-gray-600">
                Your payment is only deducted when you accept a runner. Until then, the budget amount is held in escrow but not charged to your wallet.
              </p>
            </div>

            {/* Submit error */}
            {submitError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="flex items-center gap-1.5 text-sm font-medium text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  {submitError}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Navigation buttons ── */}
        <div className="mt-8 flex gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="tap-target flex w-14 items-center justify-center rounded-xl border-2 border-card-border bg-surface py-3.5 hover:bg-gray-50"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              className="tap-target flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand py-3.5 text-base font-bold text-white shadow-sm hover:bg-brand-dark"
            >
              Continue
              <ChevronRight className="h-5 w-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="tap-target flex flex-1 items-center justify-center gap-2 rounded-xl bg-gold py-3.5 text-base font-bold text-white shadow-sm hover:bg-gold-dark disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  Post Task — ₦{budgetNum.toLocaleString()}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
