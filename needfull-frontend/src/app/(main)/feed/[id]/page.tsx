// WHAT: Task detail page (public / runner view) — one coherent flow:
//       back → badges → title → stats → description → location → due →
//       payment → poster → apply. All surfaces use semantic tokens so the
//       page is intentional in BOTH light and dark mode.
// WHY:  Runners decide on a task here — quick facts at the top, trust signals
//       about the poster, a transparent payment breakdown, then the apply
//       flow and escrow reassurance.
// FUTURE: Add image gallery, add review prompt after completion, add dispute button

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Clock,
  AlertCircle,
  DollarSign,
  Send,
  Loader2,
  BadgeCheck,
  Star,
  ShieldCheck,
  Calendar,
  Briefcase,
  Users,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAuthInit, useIsAuthenticated, useAuthUser } from "@/store";
import apiClient, { get } from "@/lib/apiClient";
import { formatCurrency } from "@/lib/format";
import { getCategoryDisplayName, getCategoryColor, getCategoryIcon } from "@/lib/categoryConfig";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { TaskStatusBadge } from "@/components/ui/task-status-badge";
import { WorkModeBadge } from "@/components/tasks/WorkModeBadge";
import { LocationRow } from "@/components/ui/location-row";
import { StatCard } from "@/components/ui/stat-card";
import { PaymentBreakdown } from "@/components/tasks/PaymentBreakdown";
import { EscrowStatusCard } from "@/components/tasks/EscrowStatusCard";
import { CelebrationModal } from "@/components/ui/celebration-modal";
import { useCelebration } from "@/hooks/useCelebration";
import { FeedDetailSkeleton } from "@/components/ui/skeletons/TaskDetailSkeleton";
import { Avatar } from "@/components/ui/avatar";

interface TaskCapabilities {
  canEdit: boolean;
  canCancel: boolean;
  canViewApplications: boolean;
  canApply: boolean;
  canConfirmCompletion: boolean;
  canChat: boolean;
  canRate: boolean;
}

interface TaskDetail {
  id: string;
  posterId: string;
  title: string;
  description: string;
  budget: { kobo: number; naira: number };
  agreedAmount: { kobo: number; naira: number } | null;
  escrowAmount: { kobo: number; naira: number };
  additionalFundingRequired: { kobo: number; naira: number };
  acceptedProposal?: {
    id: string;
    proposedAmount: { kobo: number; naira: number };
    difference: { kobo: number; naira: number };
    status: string;
  } | null;
  status: string;
  isUrgent: boolean;
  runnerDoneAt?: string | null;
  workMode?: "on_site" | "remote" | null;
  locationLabel: string | null;
  deadline: string | null;
  imageUrl: string | null;
  createdAt: string;
  distance: number | null;
  applicationCount: number;
  category: { id: string; name: string; icon: string };
  poster: {
    id: string;
    fullName: string;
    profilePictureUrl: string | null;
    avatarUrl?: string | null;
    trustScore: number;
    isVerifiedStudent?: boolean;
    school?: string | null;
    memberSince?: string | null;
    averageRating?: number | null;
    tasksCompleted?: number;
    tasksPosted?: number;
  };
  runner?: {
    id: string;
    fullName: string;
    profilePictureUrl: string | null;
  } | null;
  myApplication?: {
    id: string;
    status: string;
    proposedAmount: { kobo: number; naira: number } | null;
    proposal?: {
      id: string;
      proposedAmount: { kobo: number; naira: number };
      difference: { kobo: number; naira: number };
      status: string;
    } | null;
  } | null;
  capabilities?: TaskCapabilities;
}

interface RelatedTask {
  id: string;
  title: string;
  budget: { kobo: number; naira: number };
  isUrgent: boolean;
  createdAt: string;
  distance: number | null;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
  });
}

function formatDistance(meters: number | null): string | null {
  if (meters === null || meters === undefined) return null;
  if (meters < 1000) return `${Math.round(meters)}m away`;
  return `${(meters / 1000).toFixed(1)}km away`;
}

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  useAuthInit();
  const isAuthenticated = useIsAuthenticated();
  const user = useAuthUser();

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyMessage, setApplyMessage] = useState("");
  const [proposedAmount, setProposedAmount] = useState("");
  const [applying, setApplying] = useState(false);
  const [related, setRelated] = useState<RelatedTask[]>([]);
  const [funding, setFunding] = useState(false);
  const applyRef = useRef<HTMLDivElement>(null);
  const celebration = useCelebration();

  const fetchTask = useCallback(async () => {
    try {
      let lat = "";
      let lng = "";
      try {
        const raw = localStorage.getItem("nf_runner_location");
        if (raw) {
          const loc = JSON.parse(raw);
          if (loc && typeof loc.lat === "number" && typeof loc.lng === "number") {
            lat = String(loc.lat);
            lng = String(loc.lng);
          }
        }
      } catch { /* no saved location */ }
      const res = await apiClient.get(`/tasks/${taskId}?lat=${lat}&lng=${lng}`);
      return res.data?.data ?? null;
    } catch (err: any) {
      if (err?.response?.status === 404) toast.error("Task not found");
      else toast.error("Failed to load task");
      return null;
    }
  }, [taskId]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    (async () => {
      const data = await fetchTask();
      if (!cancelled) {
        setTask(data);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, fetchTask]);

  // WHAT: Related tasks — same category, other posters, max 3
  useEffect(() => {
    if (!isAuthenticated || !task?.category?.id) return;
    let cancelled = false;
    get<{ success: boolean; data: RelatedTask[] }>(
      `/tasks?status=open&categoryId=${task.category.id}&perPage=3`,
    )
      .then((res) => {
        if (!cancelled && res.success) {
          setRelated(res.data.filter((t) => t.id !== task.id));
        }
      })
      .catch(() => { /* optional — ignore */ });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, task?.category?.id, task?.id]);

  const handleApply = async () => {
    if (!applyMessage.trim() || applyMessage.trim().length < 10) {
      toast.error("Write a short message (at least 10 characters) first");
      applyRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setApplying(true);
    try {
      await apiClient.post("/applications", {
        taskId,
        message: applyMessage.trim(),
        proposedAmountNaira: proposedAmount
          ? parseFloat(proposedAmount)
          : undefined,
      });
      setApplyMessage("");
      setProposedAmount("");
      const data = await fetchTask();
      setTask(data);
      celebration.showForAction("runner", "application_submitted", {
        primaryLabel: "Back to Feed",
        primaryHref: "/feed",
      });
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to submit application",
      );
    } finally {
      setApplying(false);
    }
  };

  // WHAT: Single submit point — the sticky Apply CTA submits directly from the
  //      current form state (message + optional proposed amount).
  //      handleApply scrolls to the form automatically when the message is invalid.
  const submitApply = () => {
    handleApply();
  };

  // WHAT: Poster funds the remaining agreed amount (IDEMPOTENT endpoint)
  // WHY: Moves the task forever out of awaiting_funding — fund() credits escrow
  //      and flips status to in_progress in one atomic transaction
  const handleFundAccepted = async () => {
    if (!task?.acceptedProposal) return;
    setFunding(true);
    try {
      await apiClient.post(`/proposals/${task.acceptedProposal.id}/fund`);
      toast.success("Payment secured — the task is now active!");
      const data = await fetchTask();
      setTask(data);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Funding failed";
      toast.error(msg);
      if (/balance|wallet/i.test(msg)) router.push("/wallet/fund");
    } finally {
      setFunding(false);
    }
  };

  if (!isAuthenticated) return null;

  if (loading) {
    return <FeedDetailSkeleton />;
  }

  if (!task) {
    return (
      <div className="page-shell flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <AlertCircle className="mb-3 h-12 w-12 text-foreground-muted" />
        <h2 className="text-lg font-semibold text-foreground">Task not found</h2>
        <button
          onClick={() => router.push("/hustle")}
          className="mt-4 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-on-brand"
        >
          Find Tasks
        </button>
      </div>
    );
  }

  const canApply = task.capabilities?.canApply && !task.myApplication;
  const distanceLabel = formatDistance(task.distance);
  const isPoster = task.posterId === user?.id;
  // WHAT: All payout math uses the AGREED amount once a negotiation exists —
  //       the original budget is only the starting point for open tasks
  const payKobo = task.agreedAmount ? task.agreedAmount.kobo : task.budget.kobo;
  const posterAvatar = task.poster.profilePictureUrl || task.poster.avatarUrl || null;
  const rating = task.poster.averageRating ?? null;
  const memberSince = task.poster.memberSince
    ? new Date(task.poster.memberSince).toLocaleDateString("en-NG", {
        month: "short",
        year: "numeric",
      })
    : null;
  const dueLabel = task.deadline
    ? new Date(task.deadline).toLocaleDateString("en-NG", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <>
      <div className="page-shell min-h-screen pb-28 md:pb-8">
        {/* Header — clean surface, readable in both themes (no green wash) */}
        <header className="sticky top-0 z-30 border-b border-border-default bg-surface-primary/95 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-2xl items-center gap-2 px-4 py-2.5">
            <button
              onClick={() => router.back()}
              aria-label="Go back"
              className="tap-target shrink-0 rounded-lg text-foreground-secondary hover:bg-surface-secondary"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
            </button>
            <span className="nf-section-label truncate">Task Details</span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-2xl px-4 pb-6 pt-4">
          {/* ─── Hero: badges → title → meta ─── */}
          <section className="rounded-2xl border border-border-default bg-surface-primary p-4 shadow-card sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <TaskStatusBadge
                status={task.status}
                runnerDoneAt={task.runnerDoneAt}
                urgent={task.isUrgent}
              />
              <WorkModeBadge mode={task.workMode} />
              <span
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 text-[11px] font-extrabold leading-none text-white"
                style={{ backgroundColor: getCategoryColor(task.category.name) }}
              >
                <CategoryIcon
                  name={getCategoryIcon(task.category.name)}
                  className="h-3.5 w-3.5"
                  strokeWidth={2.5}
                />
                {getCategoryDisplayName(task.category.name)}
              </span>
            </div>

            <h1 className="mt-3 font-display text-xl font-extrabold leading-snug text-foreground sm:text-2xl">
              {task.title}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-foreground-muted">
              {distanceLabel && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-location" strokeWidth={2.5} />
                  {distanceLabel}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-foreground-muted" />
                Posted {timeAgo(task.createdAt)}
              </span>
            </div>
          </section>

          {/* ─── Stats: supporting, not dominant ─── */}
          {!task.imageUrl && (
            <section className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <StatCard
                label="Budget"
                value={formatCurrency(task.budget.kobo)}
                icon={<DollarSign className="h-3.5 w-3.5 text-gold" strokeWidth={2.5} />}
              />
              <StatCard
                label="Due"
                value={
                  task.deadline
                    ? new Date(task.deadline).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                      })
                    : "Flexible"
                }
                icon={<Clock className="h-3.5 w-3.5 text-gold" strokeWidth={2.5} />}
              />
              <StatCard
                label="Applicants"
                value={`${task.applicationCount}`}
                icon={<Users className="h-3.5 w-3.5 text-processing" strokeWidth={2.5} />}
              />
              <StatCard
                label="Posted"
                value={timeAgo(task.createdAt)}
                icon={<Calendar className="h-3.5 w-3.5 text-processing" strokeWidth={2.5} />}
              />
            </section>
          )}

          {task.imageUrl && (
            <div className="mt-3">
              <img
                src={task.imageUrl}
                alt={task.title}
                className="max-h-60 w-full rounded-2xl border border-border-default object-cover"
              />
              <section className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <StatCard
                  label="Budget"
                  value={formatCurrency(task.budget.kobo)}
                  icon={<DollarSign className="h-3.5 w-3.5 text-gold" strokeWidth={2.5} />}
                />
                <StatCard
                  label="Due"
                  value={
                    task.deadline
                      ? new Date(task.deadline).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                        })
                      : "Flexible"
                  }
                  icon={<Clock className="h-3.5 w-3.5 text-gold" strokeWidth={2.5} />}
                />
                <StatCard
                  label="Applicants"
                  value={`${task.applicationCount}`}
                  icon={<Users className="h-3.5 w-3.5 text-processing" strokeWidth={2.5} />}
                />
                <StatCard
                  label="Posted"
                  value={timeAgo(task.createdAt)}
                  icon={<Calendar className="h-3.5 w-3.5 text-processing" strokeWidth={2.5} />}
                />
              </section>
            </div>
          )}

          {/* ─── Description — primary content, never disabled-looking ─── */}
          <section className="mt-5">
            <p className="nf-section-label">Description</p>
            <p className="mt-1.5 whitespace-pre-line text-[15px] leading-relaxed text-foreground">
              {task.description}
            </p>
          </section>

          {/* ─── Location + due — canonical accents ─── */}
          {task.locationLabel && (
            <section className="mt-4 rounded-2xl border border-border-default bg-surface-primary p-4">
              <LocationRow
                label="Task location"
                location={task.locationLabel}
                distance={distanceLabel}
              />
              {dueLabel && (
                <div className="mt-3 flex items-start gap-2 border-t border-border-subtle pt-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={2.5} />
                  <div>
                    <p className="nf-section-label">Due</p>
                    <p className="mt-1 text-sm font-semibold text-foreground-secondary">
                      {dueLabel}
                    </p>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ─── Payment breakdown — warm semantic surface ─── */}
          <section className="mt-3">
            <PaymentBreakdown
              budgetKobo={task.budget.kobo}
              agreedKobo={payKobo !== task.budget.kobo ? payKobo : null}
              escrowKobo={task.escrowAmount.kobo}
            />
          </section>

          {/* ─── Poster card — trust signals ─── */}
          <section className="mt-3">
            <Link
              href={`/profile/${task.poster.id}`}
              className="card-surface block p-4 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lifted active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <Avatar
                  src={posterAvatar}
                  name={task.poster.fullName}
                  size="lg"
                  border
                />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 text-sm font-bold text-foreground">
                    <span className="truncate">{task.poster.fullName}</span>
                    {task.poster.isVerifiedStudent && (
                      <BadgeCheck className="h-4 w-4 shrink-0 text-info-text" />
                    )}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-foreground-muted">
                    {task.poster.school || "Campus student"}
                    {task.poster.school && " · "}
                    {memberSince ? `Member since ${memberSince}` : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-foreground-secondary">
                    {rating !== null && (
                      <span className="inline-flex items-center gap-0.5 font-semibold">
                        <Star className="h-3 w-3 fill-gold text-gold" />
                        {rating}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-brand-text" />
                      Trust {task.poster.trustScore}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Briefcase className="h-3 w-3 text-foreground-muted" />
                      {task.poster.tasksPosted ?? 0} posted
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="flex h-3 w-3 items-center justify-center rounded-full bg-success-bg text-[8px] font-black text-success-text">
                        ✓
                      </span>
                      {task.poster.tasksCompleted ?? 0} done
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-foreground-muted" />
              </div>
            </Link>
          </section>

          {/* ─── Runner assigned ─── */}
          {task.runner && (
            <section className="mt-3 flex items-center gap-3 rounded-2xl border border-warning-border bg-warning-bg p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning text-sm font-bold text-white">
                {task.runner.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-warning-text">
                  {task.runner.fullName}
                </p>
                <p className="text-xs font-medium text-warning-text/80">
                  Runner assigned
                </p>
              </div>
            </section>
          )}

          {task.status === "in_progress" && (
            <section className="mt-3">
              <EscrowStatusCard
                budgetNaira={task.budget.naira}
                posterName={task.poster.fullName}
                runnerName={task.runner?.fullName}
                status={task.status}
              />
            </section>
          )}

          {/* ─── Poster: agreed to negotiate — fund the remaining amount ─── */}
          {isPoster && task.status === "awaiting_funding" && task.acceptedProposal && (
            <section className="mt-3 rounded-2xl border border-payment-border bg-payment-bg p-4">
              <p className="flex items-center gap-1.5 text-sm font-extrabold text-payment-text-strong">
                <ShieldCheck className="h-4 w-4" strokeWidth={2.5} />
                Additional funding required
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-foreground-secondary">
                You agreed to pay{" "}
                <span className="font-bold text-foreground">
                  {formatCurrency(payKobo)}
                </span>
                . {formatCurrency(task.escrowAmount.kobo)} is already secured
                in escrow — fund the remaining{" "}
                <span className="font-black text-payment-text-strong">
                  {formatCurrency(task.additionalFundingRequired.kobo)}
                </span>{" "}
                and {task.runner?.fullName?.split(" ")[0] || "the runner"} can
                start immediately.
              </p>
              <button
                type="button"
                onClick={handleFundAccepted}
                disabled={funding}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-gold/25 active:scale-[0.98] disabled:opacity-60"
              >
                {funding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                {funding
                  ? "Securing payment..."
                  : `Fund ${formatCurrency(task.additionalFundingRequired.kobo)}`}
              </button>
              <p className="mt-2 text-[11px] text-foreground-muted">
                Funded from your wallet balance — top up first if needed.
              </p>
            </section>
          )}

          {/* ─── Runner: application / proposal status ─── */}
          {task.myApplication && (
            <section className="mt-3">
              <ApplicationStatusCard task={task} />
            </section>
          )}

          {/* ─── Apply form ─── */}
          <div ref={applyRef} className="mt-4 scroll-mt-24">
            {canApply && (
              <div className="card-surface p-4">
                <h3 className="font-display text-base font-bold text-foreground">
                  Apply for this task
                </h3>
                <p className="mb-3 mt-0.5 text-xs text-foreground-muted">
                  Tell the poster why you&apos;re the best fit. Your bid is
                  protected by escrow either way.
                </p>
                <textarea
                  value={applyMessage}
                  onChange={(e) => setApplyMessage(e.target.value)}
                  placeholder="Tell the poster why you're the best fit..."
                  className="mb-3 w-full rounded-xl border border-border-default bg-surface-primary p-3 text-sm text-foreground placeholder:text-foreground-muted focus:border-brand focus:outline-none"
                  rows={3}
                  maxLength={500}
                />
                <div className="mb-1">
                  <label className="text-xs font-semibold text-foreground-secondary">
                    Proposed amount (optional)
                  </label>
                  <div className="relative mt-1.5">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-foreground-muted">
                      ₦
                    </span>
                    <input
                      type="number"
                      value={proposedAmount}
                      onChange={(e) => setProposedAmount(e.target.value)}
                      placeholder={task.budget.naira.toLocaleString()}
                      className="w-full rounded-xl border border-border-default bg-surface-primary py-2.5 pl-8 pr-3 text-sm text-foreground placeholder:text-foreground-muted focus:border-brand focus:outline-none"
                      min={50}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-foreground-muted">
                    Leave empty to accept the listed budget
                  </p>
                </div>
              </div>
            )}
          </div>

          {task.status === "open" &&
            !canApply &&
            !task.capabilities?.canApply &&
            !task.myApplication && (
              <div className="mt-4 rounded-2xl bg-surface-secondary p-4 text-center text-sm font-medium text-foreground-muted">
                Sign in to apply for this task
              </div>
            )}

          {/* ─── Related tasks ─── */}
          {related.length > 0 && (
            <section className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-base font-bold text-foreground">
                  Similar tasks
                </h2>
                <Link
                  href="/hustle"
                  className="flex items-center gap-0.5 text-xs font-bold text-gold-dark"
                >
                  View all <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="space-y-2">
                {related.map((t) => (
                  <Link
                    key={t.id}
                    href={`/feed/${t.id}`}
                    className="card-surface flex items-center justify-between gap-3 p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-lifted active:scale-[0.98]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-foreground">
                        {t.title}
                      </p>
                      <p className="mt-0.5 text-xs text-foreground-muted">
                        {t.isUrgent ? "Urgent · " : ""}
                        {formatDistance(t.distance) || "Campus task"} · {timeAgo(t.createdAt)}
                      </p>
                    </div>
                    <span className="shrink-0 font-display text-sm font-black text-gold">
                      {formatCurrency(t.budget.kobo)}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Sticky Apply CTA — the single submission point, all screens */}
      {canApply && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border-default bg-surface-primary/95 px-4 pb-4 pt-3 shadow-[0_-8px_30px_rgb(0_0_0/0.12)] backdrop-blur-xl md:inset-x-auto md:bottom-6 md:right-6 md:w-80 md:rounded-2xl md:border md:p-4 md:shadow-lifted">
          <div className="mx-auto flex max-w-lg items-center justify-between gap-3 md:block">
            <div className="min-w-0">
              <p className="flex items-center gap-1 text-[10px] font-bold text-success-text">
                <ShieldCheck className="h-3 w-3" strokeWidth={2.5} />
                Escrow-protected
              </p>
              <p className="text-[10px] text-foreground-muted">
                Funds held safely until the task is done
              </p>
            </div>
            <button
              type="button"
              onClick={submitApply}
              disabled={applying}
              className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-gold px-5 py-3 text-sm font-bold text-white shadow-md shadow-gold/25 active:scale-[0.97] disabled:opacity-60 md:mt-2 md:w-full"
            >
              {applying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {applying ? "Submitting..." : "Apply for this Task"}
            </button>
          </div>
        </div>
      )}

      <CelebrationModal
        open={celebration.open}
        onClose={celebration.close}
        config={celebration.config}
      />
    </>
  );
}

// WHAT: Runner-side status card — "Your application" with the negotiated bid,
//       and the hired state (including the waiting-for-funding interim)
// WHY: The runner needs to know exactly where they stand: bid sent, proposal
//      accepted, or hired-but-waiting for the poster to secure the difference
function ApplicationStatusCard({ task }: { task: TaskDetail }) {
  const app = task.myApplication!;
  const proposal = app.proposal;
  const paidKobo = proposal
    ? proposal.proposedAmount.kobo
    : app.proposedAmount?.kobo;

  if (app.status === "accepted") {
    const waitingFunding = task.status === "awaiting_funding";
    return (
      <div
        className={`rounded-2xl border p-4 text-sm ${
          waitingFunding
            ? "border-warning-border bg-warning-bg"
            : "border-success-border bg-success-bg"
        }`}
      >
        <p
          className={`flex items-center gap-1.5 font-bold ${
            waitingFunding ? "text-warning-text" : "text-success-text"
          }`}
        >
          <BadgeCheck className="h-4 w-4" strokeWidth={2.5} />
          You&apos;re hired for {formatCurrency(payKoboOf(task))}
        </p>
        {waitingFunding ? (
          <p className="mt-1 text-xs leading-relaxed text-warning-text">
            The poster is securing the remaining{" "}
            <span className="font-black">
              {formatCurrency(task.additionalFundingRequired.kobo)}
            </span>{" "}
            — the task goes live automatically once funded.
          </p>
        ) : (
          <p className="mt-1 text-xs text-success-text">
            The full amount is secured in escrow. Start the task when ready.
          </p>
        )}
      </div>
    );
  }

  if (app.status === "rejected") {
    return (
      <div className="rounded-2xl border border-error-border bg-error-bg p-3.5 text-sm font-semibold text-error-text">
        Your application was not selected this time.
      </div>
    );
  }

  const expired = proposal?.status === "expired";
  return (
    <div className="rounded-2xl border border-border-default bg-surface-primary p-4 text-sm">
      <div
        className={`rounded-xl border p-3 ${
          expired
            ? "border-border-default bg-surface-secondary"
            : "border-warning-border bg-warning-bg"
        }`}
      >
        <p
          className={`font-bold ${
            expired ? "text-foreground-muted" : "text-warning-text"
          }`}
        >
          {expired
            ? "Your budget proposal expired"
            : proposal
              ? "Budget proposal sent"
              : "Application sent"}
        </p>
        {paidKobo && (
          <div className="mt-1.5 space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-foreground-muted">Your bid</span>
              <span className="font-bold text-foreground">
                {formatCurrency(paidKobo)}
              </span>
            </div>
            {proposal && (
              <div className="flex items-center justify-between">
                <span className="text-foreground-muted">
                  {proposal.difference.kobo > 0 ? "Above budget" : "Below budget"}
                </span>
                <span className="font-bold text-foreground-secondary">
                  {proposal.difference.kobo > 0 ? "+" : "−"}
                  {formatCurrency(Math.abs(proposal.difference.kobo))}
                </span>
              </div>
            )}
          </div>
        )}
        <p className="mt-1.5 text-[11px] text-foreground-muted">
          {expired
            ? "The poster didn't respond in time. You can send a new proposal."
            : "Waiting for the poster to respond. You'll be notified."}
        </p>
      </div>
    </div>
  );
}

function payKoboOf(task: TaskDetail): number {
  return task.agreedAmount ? task.agreedAmount.kobo : task.budget.kobo;
}