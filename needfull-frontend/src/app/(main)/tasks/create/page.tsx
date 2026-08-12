"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  MapPin,
  Clock,
  AlertTriangle,
  Loader2,
  DollarSign,
  ShoppingBag,
  BadgeCheck,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { get, post } from "@/lib/apiClient";
import { useAuthInit } from "@/hooks/useAuthInit";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { EscrowSummaryCard } from "@/components/tasks/EscrowSummaryCard";
import { BudgetStep, type BudgetStepData } from "@/components/tasks/budget/BudgetStep";
import { CategorySelectionStep } from "@/components/tasks/create/CategorySelectionStep";
import { HelperSuggestions } from "@/components/helpers/HelperSuggestions";
import { ContextualTip } from "@/components/tasks/create/ContextualTip";
import { TaskDetailsStep } from "@/components/tasks/create/TaskDetailsStep";
import { CelebrationModal } from "@/components/ui/celebration-modal";
import { useCelebration } from "@/hooks/useCelebration";
import type { TaskMode } from "@/lib/categoryConfig";
import { getCategoryConfig, getCategoryColor, getCategoryIcon, getCategoryDisplayName } from "@/lib/categoryConfig";
import { CategoryIcon } from "@/components/ui/CategoryIcon";

interface Category {
  id: string;
  name: string;
  icon: string;
}

const STEPS = [
  { num: 1, label: "Category" },
  { num: 2, label: "Details" },
  { num: 3, label: "Budget" },
  { num: 4, label: "Review" },
];

const PLATFORM_FEE_PERCENT = 10;

export default function CreateTaskPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteRunnerId = searchParams.get("runnerId") ?? undefined;
  const user = useAuthStore((s) => s.user);
  useAuthInit();

  useEffect(() => {
    if (!user) router.push("/login");
  }, [user, router]);

  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [catLoading, setCatLoading] = useState(true);

  // Step 1: Category
  const [categoryId, setCategoryId] = useState("");
  const [categoryName, setCategoryName] = useState("");

  // Step 2: Task Details
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskMode, setTaskMode] = useState<TaskMode>("onsite");
  const [taskLocation, setTaskLocation] = useState("");
  const [completionLocation, setCompletionLocation] = useState("");

  // Step 3: Budget
  const [budgetStepData, setBudgetStepData] = useState<BudgetStepData | null>(null);

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);
  const celebration = useCelebration();
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load categories
  useEffect(() => {
    get<Category[] | { success: boolean; data: Category[] }>("/categories")
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.success && Array.isArray(res.data) ? res.data : [];
        setCategories(list);

        // WHAT: Honor ?category=<name> deep-link (dashboard rail, categories page)
        // WHY:  Display names from config may differ from DB slugs; resolve by
        //       canonical display name, short name, or raw DB name.
        const q = searchParams.get("category");
        if (q && list.length) {
          const target = q.trim().toLowerCase();
          const match = list.find(
            (c) =>
              c.name.toLowerCase() === target ||
              getCategoryConfig(c.name).displayName.toLowerCase() === target ||
              getCategoryConfig(c.name).shortName.toLowerCase() === target,
          );
          if (match) {
            setCategoryId(match.id);
            setCategoryName(match.name);
          }
        }
      })
      .catch(() => {})
      .finally(() => setCatLoading(false));
  }, [searchParams]);

  // WHAT: Reset the scroll position whenever the active step changes
  // WHY:  All four steps render in the same page; without a reset, continuing
  //       from the bottom of a long step leaves the next step's viewport
  //       starting mid-page. Mobile scrolls the document; desktop scrolls the
  //       <main> workspace pane — reset whichever container is the active
  //       scroller (the other reset is a harmless no-op).
  // NOTE: Runs before paint (useLayoutEffect) so the new step appears at its
  //       top instantly — no flash of the stale scroll position.
  const skipScrollReset = useRef(true);
  useLayoutEffect(() => {
    if (skipScrollReset.current) {
      skipScrollReset.current = false;
      return;
    }
    document
      .querySelector<HTMLElement>("main.workspace-scroll")
      ?.scrollTo({ top: 0, behavior: "instant" });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [step]);

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const budgetNum = budgetStepData?.budgetNaira ?? 0;
  const deadline = budgetStepData?.deadline;
  const budgetLocLabel = budgetStepData?.taskLocation.label ?? "";
  const walletBalanceKobo = user?.wallet?.balanceKobo ?? 0;
  const totalKobo = (budgetNum + Math.floor(budgetNum * PLATFORM_FEE_PERCENT / 100)) * 100;
  const hasEnoughBalance = totalKobo === 0 || walletBalanceKobo >= totalKobo;

  function validateStep(s: number): boolean {
    const newErrors: Record<string, string> = {};
    if (s === 1 && !categoryId) newErrors.categoryId = "Select a category";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function nextStep() {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, 4));
  }

  function prevStep() {
    setStep((s) => Math.max(s - 1, 1));
    setErrors({});
  }

  async function handleSubmit() {
    if (!budgetStepData) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const locationLabel = taskLocation || budgetLocLabel || undefined;
      const lat = taskMode === "remote" ? undefined : (budgetStepData.taskLocation.lat ?? undefined);
      const lng = taskMode === "remote" ? undefined : (budgetStepData.taskLocation.lng ?? undefined);

      const res = await post<{ success: boolean; data: { id: string } }>(
        "/tasks",
        {
          categoryId,
          title: taskTitle,
          description: taskDescription,
          budgetNaira: budgetNum,
          deadline: budgetStepData.deadline,
          isUrgent: false,
          locationLabel,
          lat,
          lng,
          inviteRunnerId,
        },
      );

      if (res.success) {
        setCreatedTaskId(res.data.id);
        celebration.showForAction("poster", "task_posted", {
          primaryLabel: "View Task",
          primaryAction: () => router.push(`/tasks/${res.data.id}`),
          secondaryLabel: "Back to Feed",
          secondaryHref: "/feed",
        });
      } else {
        setSubmitError("Failed to create task. Please try again.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) return null;

  return (
    <>
      <div className="min-h-screen page-shell">
        {/* Purchase mode toggle */}
        <div className="bg-gold-light/20 px-4 py-2 border-b border-gold/20">
          <div className="mx-auto flex max-w-lg items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-gold" />
              <span className="text-xs font-medium text-gray-700">Need to buy something?</span>
            </div>
            <button
              onClick={() => router.push("/tasks/create/purchase")}
              className="rounded-full bg-gold px-3 py-1 text-[10px] font-bold text-white"
            >
              Create Purchase Task
            </button>
          </div>
        </div>

        {/* Top bar */}
        <div className="bg-surface px-4 py-3 shadow-sm">
          <div className="mx-auto flex max-w-lg items-center gap-3">
            <button
              type="button"
              onClick={() => (step > 1 ? prevStep() : router.push("/feed"))}
              className="tap-target flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-200"
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

        {/* Invited runner banner */}
        {inviteRunnerId && (
          <div className="flex items-center gap-2 bg-brand-light/70 px-4 py-2.5 border-b border-brand/15">
            <BadgeCheck className="h-4 w-4 shrink-0 text-brand-text" />
            <p className="text-xs font-semibold text-gray-700">
              This task is being posted for a specific runner — they&apos;ll get a
              notification and can apply first. Escrow still protects the payment.
            </p>
          </div>
        )}

        {/* Content */}
        <div className="mx-auto max-w-lg px-4 pb-8 pt-6">
          {/* Step 1: Category Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <CategorySelectionStep
                allCategories={categories}
                loading={catLoading}
                selectedCategoryId={categoryId}
                onSelect={(id) => {
                  setCategoryId(id);
                  const cat = categories.find((c) => c.id === id);
                  if (cat) setCategoryName(cat.name);
                }}
              />
              {errors.categoryId && (
                <p className="text-xs text-red-500">{errors.categoryId}</p>
              )}
              {categoryId ? (
                <div className="min-h-[72px]">
                  <HelperSuggestions categoryId={categoryId} />
                </div>
              ) : null}
              <ContextualTip categoryName={categoryName} />
              {/* Next button for Step 1 */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!categoryId}
                  className="tap-target flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-4 text-base font-bold text-on-brand shadow-sm transition-all hover:brightness-105 active:scale-[0.97] disabled:bg-gray-200 disabled:text-gray-400"
                >
                  Continue to Details
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Task Details */}
          {step === 2 && selectedCategory && (
            <TaskDetailsStep
              categoryName={selectedCategory.name}
              initialTitle={taskTitle}
              initialDescription={taskDescription}
              onContinue={(data) => {
                setTaskTitle(data.title);
                setTaskDescription(data.description);
                setTaskMode(data.taskMode);
                setTaskLocation(data.taskLocation);
                setCompletionLocation(data.completionLocation);
                setStep(3);
              }}
            />
          )}

          {/* Step 3: Budget */}
          {step === 3 && selectedCategory && (
            <BudgetStep
              categoryName={selectedCategory.name}
              onContinue={(data) => {
                setBudgetStepData(data);
                setStep(4);
              }}
            />
          )}

          {/* Step 4: Review */}
          {step === 4 && selectedCategory && (
            <div className="space-y-5">
              <h2 className="font-display text-lg font-bold text-gray-900 sm:text-xl">
                Review your task
              </h2>

              {/* Task Summary Card */}
              <div className="space-y-4 rounded-2xl border border-card-border bg-surface p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Category</span>
                  <span
                    className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: getCategoryColor(selectedCategory.name) }}
                  >
                    <CategoryIcon name={getCategoryIcon(selectedCategory.name)} className="h-3 w-3" strokeWidth={2.5} />
                    {getCategoryDisplayName(selectedCategory.name)}
                  </span>
                </div>
                <hr className="border-border-subtle" />

                <div>
                  <span className="text-xs text-gray-500">Title</span>
                  <p className="mt-0.5 text-sm font-medium text-gray-900">{taskTitle}</p>
                </div>
                <hr className="border-border-subtle" />

                <div>
                  <span className="text-xs text-gray-500">Description</span>
                  <p className="mt-0.5 text-sm leading-relaxed text-gray-700 line-clamp-4">{taskDescription}</p>
                </div>
                <hr className="border-border-subtle" />

                <EscrowSummaryCard
                  budgetNaira={budgetNum}
                  feePercent={PLATFORM_FEE_PERCENT}
                  walletBalanceKobo={user?.wallet?.balanceKobo ?? 0}
                />
                <hr className="border-border-subtle" />

                {(taskLocation || budgetLocLabel) && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Location</span>
                      <span className="flex items-center gap-1 text-xs font-medium text-gray-700">
                        <MapPin className="h-3 w-3" />
                        {taskLocation || budgetLocLabel}
                      </span>
                    </div>
                  </>
                )}

                {deadline && (
                  <>
                    <hr className="border-border-subtle" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Deadline</span>
                      <span className="flex items-center gap-1 text-xs font-medium text-gray-700">
                        <Clock className="h-3 w-3" />
                        {new Date(deadline).toLocaleDateString("en-NG", {
                          day: "numeric", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Payment Summary — separate from the button */}
              <div className="rounded-2xl border border-border-subtle bg-surface-primary p-5 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Payment Summary
                </h3>

                <div className="mt-4 flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-extrabold text-gray-900 tabular-nums">
                    ₦{budgetNum.toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 text-center text-xs text-gray-400">
                  Held securely in NeedFull Escrow
                </p>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Task Budget</span>
                    <span className="font-semibold text-gray-700">₦{budgetNum.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Platform Fee (10%)</span>
                    <span className="font-semibold text-gray-700">—₦{Math.floor(budgetNum * 10 / 100).toLocaleString()}</span>
                  </div>
                  <hr className="border-border-subtle" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-600">Amount to Pay</span>
                    <span className="font-bold text-brand-text">₦{(budgetNum + Math.floor(budgetNum * 10 / 100)).toLocaleString()}</span>
                  </div>
                </div>

                {/* Wallet check */}
                <div className={`mt-4 rounded-xl px-4 py-3 text-sm ${
                  hasEnoughBalance
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-600"
                }`}>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${hasEnoughBalance ? "bg-green-500" : "bg-red-500"}`} />
                    <span className="text-xs font-semibold">
                      {hasEnoughBalance
                        ? `Wallet Balance: ₦${(walletBalanceKobo / 100).toLocaleString()}`
                        : `Insufficient — you need ₦${((budgetNum + Math.floor(budgetNum * 10 / 100)) - walletBalanceKobo / 100).toLocaleString()} more`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Escrow info note */}
              <div className="flex items-start gap-2 rounded-xl bg-brand-light/30 px-4 py-3">
                <DollarSign className="mt-0.5 h-4 w-4 shrink-0 text-brand-text" />
                <p className="text-xs leading-relaxed text-gray-600">
                  Your payment is only deducted when you accept a runner. Until then, the budget amount is held in escrow but not charged to your wallet.
                </p>
              </div>

              {submitError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    {submitError}
                  </p>
                </div>
              )}

              {/* Sticky action buttons — clean, no amounts inside */}
              <div className="sticky bottom-0 -mx-4 bg-gradient-to-t from-surface-primary via-surface-primary to-transparent px-4 pb-4 pt-6">
                {hasEnoughBalance ? (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="tap-target flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-4 text-base font-bold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.97] disabled:bg-gray-200 disabled:text-gray-400"
                  >
                    {submitting ? (
                      <><Loader2 className="h-5 w-5 animate-spin" />Posting...</>
                    ) : (
                      <>Post Task</>
                    )}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => router.push("/wallet/fund")}
                      className="tap-target flex w-full items-center justify-center gap-2 rounded-xl border-2 border-brand bg-surface-primary py-4 text-base font-bold text-brand shadow-sm transition-all hover:bg-brand/5 active:scale-[0.97]"
                    >
                      Fund Wallet
                    </button>
                    <p className="text-center text-xs text-gray-400">
                      Insufficient balance to post this task
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <CelebrationModal
        open={celebration.open}
        onClose={celebration.close}
        config={celebration.config}
      />
    </>
  );
}
