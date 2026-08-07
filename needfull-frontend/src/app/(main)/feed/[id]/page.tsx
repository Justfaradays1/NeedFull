// WHAT: Task detail page — summary cards, payment breakdown, seeker profile, application, escrow status
// WHY: Runners decide on a task here — quick facts at the top, trust signals about the
//      poster, a transparent payment breakdown, then the apply flow and escrow reassurance.
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
  User,
  Send,
  Loader2,
  BadgeCheck,
  Star,
  ShieldCheck,
  Calendar,
  Briefcase,
  Users,
  ChevronRight,
  Wifi,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAuthInit, useIsAuthenticated, useAuthUser } from "@/store";
import apiClient, { get } from "@/lib/apiClient";
import { formatCurrency } from "@/lib/format";
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
  title: string;
  description: string;
  budget: { kobo: number; naira: number };
  status: string;
  isUrgent: boolean;
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

const STATUS_BADGES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  open: { bg: "bg-green-100", text: "text-green-800", label: "Open" },
  in_progress: {
    bg: "bg-amber-100",
    text: "text-amber-800",
    label: "In Progress",
  },
  completed: { bg: "bg-blue-100", text: "text-blue-800", label: "Completed" },
  cancelled: { bg: "bg-gray-100", text: "text-gray-600", label: "Cancelled" },
};

function WorkModeBadge({ mode }: { mode?: "on_site" | "remote" | null }) {
  if (mode === "remote") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700">
        <Wifi className="h-3 w-3" />
        Remote
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-light/70 px-3 py-1 text-xs font-bold text-brand-text">
      <MapPin className="h-3 w-3" />
      On-site
    </span>
  );
}

const PLATFORM_FEE_RATE = 0.1;

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

  if (!isAuthenticated) return null;

  if (loading) {
    return <FeedDetailSkeleton />;
  }

  if (!task) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <AlertCircle className="mb-3 h-12 w-12 text-gray-300" />
        <h2 className="text-lg font-semibold text-gray-900">Task not found</h2>
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
  const badge = STATUS_BADGES[task.status] || STATUS_BADGES.open;
  const distanceLabel = formatDistance(task.distance);
  const runnerReceivesKobo = Math.round(task.budget.kobo * (1 - PLATFORM_FEE_RATE));
  const platformFeeKobo = task.budget.kobo - runnerReceivesKobo;
  const posterAvatar = task.poster.profilePictureUrl || task.poster.avatarUrl || null;
  const rating = task.poster.averageRating ?? null;
  const memberSince = task.poster.memberSince
    ? new Date(task.poster.memberSince).toLocaleDateString("en-NG", {
        month: "short",
        year: "numeric",
      })
    : null;

  const summaryCards: { label: string; value: string; icon: React.ReactNode }[] = [
    {
      label: "Budget",
      value: formatCurrency(task.budget.kobo),
      icon: <DollarSign className="h-3.5 w-3.5 text-gold" />,
    },
    {
      label: "Due",
      value: task.deadline
        ? new Date(task.deadline).toLocaleDateString("en-NG", { day: "numeric", month: "short" })
        : "Flexible",
      icon: <Clock className="h-3.5 w-3.5 text-gold" />,
    },
    {
      label: "Applicants",
      value: `${task.applicationCount}`,
      icon: <Users className="h-3.5 w-3.5 text-gold" />,
    },
    {
      label: "Posted",
      value: timeAgo(task.createdAt),
      icon: <Calendar className="h-3.5 w-3.5 text-gold" />,
    },
  ];

  return (
    <>
      <div className="min-h-screen page-shell pb-28 md:pb-8">
        <div className="glass-dark px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="tap-target rounded-lg p-2 hover:bg-white/20"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>
            <h1 className="text-lg font-bold text-white truncate">
              {task.title}
            </h1>
          </div>
        </div>

        <div className="px-4 py-4">
          <div className="overflow-hidden rounded-2xl bg-surface shadow-sm">
            {task.imageUrl && (
              <img
                src={task.imageUrl}
                alt={task.title}
                className="w-full object-cover max-h-56"
              />
            )}

            <div className="p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${badge.bg} ${badge.text}`}
                >
                  {badge.label}
                </span>
                <WorkModeBadge mode={task.workMode} />
                {task.isUrgent && (
                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                    URGENT
                  </span>
                )}
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                  {task.category.name}
                </span>
              </div>

              {/* Quick summary cards */}
              <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {summaryCards.map((c) => (
                  <div
                    key={c.label}
                    className="rounded-xl border border-card-border bg-gray-50 p-2.5"
                  >
                    <div className="flex items-center gap-1 text-gold">{c.icon}</div>
                    <p className="mt-1 text-sm font-black text-gray-900">{c.value}</p>
                    <p className="text-[10px] font-medium text-gray-500">{c.label}</p>
                  </div>
                ))}
              </div>

              <p className="mb-4 text-sm leading-relaxed text-gray-700 whitespace-pre-line">
                {task.description}
              </p>

              <div className="mb-4 space-y-2 text-sm text-gray-600">
                {task.locationLabel && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>
                      {task.locationLabel}
                      {distanceLabel ? ` (${distanceLabel})` : ""}
                    </span>
                  </div>
                )}
                {task.deadline && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>
                      Due {new Date(task.deadline).toLocaleDateString("en-NG", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>

              {/* Payment breakdown — escrow transparency */}
              <div className="mb-4 rounded-xl border border-gold/25 bg-gold-light/40 p-3.5">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-gold-dark">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Payment Breakdown
                </p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Task budget</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(task.budget.kobo)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Platform fee (10%)</span>
                    <span className="text-gray-500">
                      − {formatCurrency(platformFeeKobo)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-gold/20 pt-1.5">
                    <span className="font-bold text-gray-900">You receive</span>
                    <span className="font-black text-gold-dark">
                      {formatCurrency(runnerReceivesKobo)}
                    </span>
                  </div>
                </div>
                <p className="mt-2.5 flex items-start gap-1.5 text-[10px] leading-relaxed text-gray-500">
                  <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-brand-text" />
                  Your payment is held safely in escrow by NeedFull until the task is
                  completed and confirmed — you never chase the poster for money.
                </p>
              </div>

              {/* Seeker profile — trust signals */}
              <Link
                href={`/profile/${task.poster.id}`}
                className="mb-4 block rounded-xl border border-card-border bg-surface p-3.5 transition-all hover:border-brand/30 hover:shadow-sm active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    src={posterAvatar}
                    name={task.poster.fullName}
                    size="lg"
                    border
                  />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1 text-sm font-bold text-gray-900">
                      <span className="truncate">{task.poster.fullName}</span>
                      {task.poster.isVerifiedStudent && (
                        <BadgeCheck className="h-4 w-4 shrink-0 text-blue-500" />
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {task.poster.school || "Campus student"}
                      {task.poster.school && " · "}
                      {memberSince ? `Member since ${memberSince}` : ""}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-600">
                      {rating !== null && (
                        <span className="inline-flex items-center gap-0.5 font-semibold">
                          <Star className="h-3 w-3 fill-gold text-gold" />
                          {rating}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <BadgeCheck className="h-3 w-3 text-brand-text" />
                        Trust {task.poster.trustScore}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Briefcase className="h-3 w-3 text-gray-400" />
                        {task.poster.tasksPosted ?? 0} posted
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CheckIcon />
                        {task.poster.tasksCompleted ?? 0} done
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                </div>
              </Link>

              {task.runner && (
                <div className="mb-4 flex items-center gap-3 rounded-xl bg-amber-50 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber/10 text-sm font-bold text-amber">
                    {task.runner.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {task.runner.fullName}
                    </p>
                    <p className="text-xs text-amber-700">Runner assigned</p>
                  </div>
                </div>
              )}

              {task.status === "in_progress" && (
                <div className="mb-4">
                  <EscrowStatusCard
                    budgetNaira={task.budget.naira}
                    posterName={task.poster.fullName}
                    runnerName={task.runner?.fullName}
                    status={task.status}
                  />
                </div>
              )}

              {task.myApplication && (
                <div
                  className={`rounded-xl p-3 text-center text-sm font-semibold ${task.myApplication.status === "pending" || task.myApplication.status === "negotiating" ? "bg-amber-50 text-amber-800" : task.myApplication.status === "accepted" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
                >
                  Your application: {task.myApplication.status}
                  {task.myApplication.proposedAmount &&
                    ` (₦${task.myApplication.proposedAmount.naira.toLocaleString()})`}
                </div>
              )}
            </div>
          </div>

          {/* Apply form */}
          <div ref={applyRef} className="scroll-mt-20">
            {canApply && (
              <div className="mt-4 overflow-hidden rounded-2xl bg-surface p-4 shadow-sm border border-card-border">
                <h3 className="mb-1 font-semibold text-gray-900">
                  Apply for this task
                </h3>
                <p className="mb-3 text-[11px] text-gray-500">
                  Tell the poster why you&apos;re the best fit. Your bid is protected by
                  escrow either way.
                </p>
                <textarea
                  value={applyMessage}
                  onChange={(e) => setApplyMessage(e.target.value)}
                  placeholder="Tell the poster why you're the best fit..."
                  className="mb-3 w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-brand focus:outline-none"
                  rows={3}
                  maxLength={500}
                />
                <div className="mb-1">
                  <label className="text-xs font-medium text-gray-600">
                    Proposed amount (optional)
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                      ₦
                    </span>
                    <input
                      type="number"
                      value={proposedAmount}
                      onChange={(e) => setProposedAmount(e.target.value)}
                      placeholder={task.budget.naira.toLocaleString()}
                      className="w-full rounded-xl border border-gray-300 py-2.5 pl-8 pr-3 text-sm focus:border-brand focus:outline-none"
                      min={50}
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-gray-500">
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
              <div className="mt-4 rounded-xl bg-gray-100 p-4 text-center text-sm text-gray-500">
                Sign in to apply for this task
              </div>
            )}

          {/* Related tasks */}
          {related.length > 0 && (
            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-base font-bold text-gray-900">
                  Similar tasks
                </h2>
                <Link
                  href="/hustle"
                  className="flex items-center gap-0.5 text-[11px] font-bold text-gold"
                >
                  View all <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="space-y-2">
                {related.map((t) => (
                  <Link
                    key={t.id}
                    href={`/feed/${t.id}`}
                    className="tap-target flex items-center justify-between gap-3 rounded-xl border border-card-border bg-surface p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-gray-900">{t.title}</p>
                      <p className="mt-0.5 text-[11px] text-gray-500">
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
            </div>
          )}
        </div>
      </div>

      {/* Sticky Apply CTA — the single submission point, all screens */}
      {canApply && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/70 bg-white/95 px-4 pb-4 pt-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl md:inset-x-auto md:bottom-6 md:right-6 md:w-80 md:rounded-2xl md:border md:p-4 md:shadow-xl">
          <div className="mx-auto flex max-w-lg items-center justify-between gap-3 md:block">
            <div className="min-w-0">
              <p className="flex items-center gap-1 text-[10px] font-bold text-green-700">
                <ShieldCheck className="h-3 w-3" />
                Escrow-protected
              </p>
              <p className="text-[10px] text-gray-500">
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

function CheckIcon() {
  return (
    <span className="flex h-3 w-3 items-center justify-center rounded-full bg-green-100 text-[8px] font-black text-green-700">
      ✓
    </span>
  );
}