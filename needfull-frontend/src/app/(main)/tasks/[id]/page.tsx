// WHAT: My Task detail page — task view from poster or runner perspective
// WHY: Allows task poster/runner to manage their task — cancel, complete, view applications
// FUTURE: Add in-chat link, add dispute flow, add re-open for cancelled tasks

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Clock,
  DollarSign,
  User,
  CheckCircle,
  XCircle,
  Loader2,
  MessageCircle,
  Users,
  Star,
  PlayCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthInit, useIsAuthenticated, useAuthUser } from "@/store";
import apiClient from "@/lib/apiClient";
import { getCategoryDisplayName, getCategoryColor, getCategoryIcon } from "@/lib/categoryConfig";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { openTaskChat } from "@/lib/taskChat";
import { CelebrationModal } from "@/components/ui/celebration-modal";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useCelebration } from "@/hooks/useCelebration";
import { TaskDetailSkeleton } from "@/components/ui/skeletons/TaskDetailSkeleton";

interface TaskCapabilities {
  canEdit: boolean;
  canCancel: boolean;
  canViewApplications: boolean;
  canApply: boolean;
  canConfirmCompletion: boolean;
  canMarkAsDone: boolean;
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
  locationLabel: string | null;
  lat?: number | null;
  lng?: number | null;
  deadline: string | null;
  imageUrl: string | null;
  createdAt: string;
  category: { id: string; name: string; icon: string };
  poster: { id: string; fullName: string; profilePictureUrl: string | null };
  runner?: {
    id: string;
    fullName: string;
    profilePictureUrl: string | null;
  } | null;
  runnerDoneAt?: string | null;
  applicationCount?: number;
  capabilities?: TaskCapabilities;
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
  cancelled: { bg: "bg-gray-200", text: "text-gray-600", label: "Cancelled" },
};

export default function MyTaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  useAuthInit();
  const isAuthenticated = useIsAuthenticated();
  const user = useAuthUser();

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const isPoster = user?.id === task?.poster.id;
  const isRunner = user?.id === task?.runner?.id;
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const celebration = useCelebration();

  // WHAT: Nearby available runners shown to a poster on an open task
  interface NearbyRunner {
    id: string;
    fullName: string;
    bio: string | null;
    profilePictureUrl: string | null;
    department: string | null;
    level: string | null;
    trustScore: number;
    tasksCompleted: number;
    distanceMeters: number;
  }
  const [nearbyRunners, setNearbyRunners] = useState<NearbyRunner[] | null>(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !task) return;
    const isOpenPosterView = task.id === params.id && task.status === "open" && task.poster?.id === user?.id;
    if (!isOpenPosterView || !task.lat || !task.lng) return;
    let cancelled = false;
    const fetchNearby = async () => {
      setNearbyLoading(true);
      try {
        const res = await apiClient.get(
          `/users/nearby-runners?lat=${task.lat}&lng=${task.lng}&radiusMeters=5000`,
        );
        if (!cancelled) setNearbyRunners(res.data?.data ?? []);
      } catch {
        // Non-critical — silently ignore runner discovery failures
      } finally {
        if (!cancelled) setNearbyLoading(false);
      }
    };
    fetchNearby();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, task, params.id, user?.id]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchTask = async () => {
      try {
        const res = await apiClient.get(`/tasks/${taskId}?lat=&lng=`);
        setTask(res.data?.data ?? null);
      } catch {
        toast.error("Failed to load task");
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
  }, [isAuthenticated, taskId]);

  const handleChat = async () => {
    const otherId = isPoster ? task?.runner?.id : task?.poster.id;
    if (!otherId || !task) {
      toast.error("Chat is available once a runner is hired");
      return;
    }
    const convId = await openTaskChat(taskId, otherId);
    if (convId) router.push(`/chat/${convId}`);
    else toast.error("Couldn't open chat — try again");
  };

  const handleCancel = async () => {
    setCancelConfirmOpen(false);
    setActionLoading("cancel");
    try {
      await apiClient.post(`/tasks/${taskId}/cancel`);
      toast.success("Task cancelled");
      const res = await apiClient.get(`/tasks/${taskId}?lat=&lng=`);
      setTask(res.data?.data ?? null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to cancel");
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAsDone = async () => {
    setActionLoading("done");
    try {
      await apiClient.post(`/tasks/${taskId}/done`);
      toast.success("Task marked as done! Awaiting poster confirmation.");
      const res = await apiClient.get(`/tasks/${taskId}?lat=&lng=`);
      setTask(res.data?.data ?? null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to mark as done");
    } finally {
      setActionLoading(null);
    }
  };

  if (!isAuthenticated) return null;

  if (loading) {
    return <TaskDetailSkeleton />;
  }

  if (!task) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center page-shell px-4 text-center">
        <h2 className="text-lg font-semibold text-gray-900">Task not found</h2>
        <button
          onClick={() => router.push("/tasks")}
          className="mt-4 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-on-brand"
        >
          My Tasks
        </button>
      </div>
    );
  }

  const badge = task.runnerDoneAt && task.status === "in_progress"
    ? { bg: "bg-purple-100", text: "text-purple-800", label: "Awaiting Confirmation" }
    : STATUS_BADGES[task.status] || STATUS_BADGES.open;

  return (
    <>
      <div className="min-h-screen page-shell">
        <div className="bg-surface px-4 py-3 shadow-sm border-b border-card-border">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="tap-target rounded-lg p-2 hover:bg-gray-200"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </button>
            <h1 className="text-lg font-bold text-gray-900 truncate">
              {task.title}
            </h1>
          </div>
        </div>

        <div className="px-4 py-4">
          <div className="overflow-hidden rounded-2xl bg-surface shadow-sm border border-card-border">
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
                {task.isUrgent && (
                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                    URGENT
                  </span>
                )}
                <span
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-white"
                  style={{ backgroundColor: getCategoryColor(task.category.name) }}
                >
                  <CategoryIcon name={getCategoryIcon(task.category.name)} className="h-3 w-3" strokeWidth={2.5} />
                  {getCategoryDisplayName(task.category.name)}
                </span>
              </div>

              <p className="mb-4 text-sm leading-relaxed text-gray-700 whitespace-pre-line">
                {task.description}
              </p>

              <div className="mb-4 space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-brand-text" />
                  <span className="font-semibold text-gray-900">
                    ₦{task.budget.naira.toLocaleString()}
                  </span>
                </div>
                {task.locationLabel && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{task.locationLabel}</span>
                  </div>
                )}
                {task.deadline && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>
                      Due {new Date(task.deadline).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="mb-4 flex items-center gap-3 rounded-xl bg-gray-200 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand-text">
                  {(task.runner?.fullName ?? task.poster.fullName)
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {isPoster
                      ? "You (Poster)"
                      : isRunner
                        ? "You (Runner)"
                        : task.poster.fullName}
                  </p>
                  {task.runner && (
                    <p className="text-xs text-gray-500">
                      Runner: {task.runner.fullName}
                    </p>
                  )}
                  {!task.runner && (
                    <p className="text-xs text-gray-500">
                      Poster: {task.poster.fullName}
                    </p>
                  )}
                </div>
              </div>

{task.status === "in_progress" && (
                  <div className="mb-4 rounded-xl bg-amber-50 p-3 text-center text-sm font-semibold text-amber-800">
                    Escrow locked — view live progress &amp; instructions
                  </div>
                )}

                {task.status === "in_progress" && (
                  <button
                    onClick={() => router.push(`/tasks/${taskId}/active`)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-gold py-3 text-sm font-bold text-white shadow-sm shadow-gold/20 transition-all active:scale-[0.97]"
                  >
                    <PlayCircle className="h-4 w-4" />
                    View Live Task
                  </button>
                )}

              <div className="flex flex-col gap-2">
                {task.capabilities?.canViewApplications && (
                  <button
                    onClick={() => router.push(`/tasks/${taskId}/applicants`)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-gold py-3 text-sm font-bold text-white shadow-sm shadow-gold/20 transition-all active:scale-[0.97]"
                  >
                    <Users className="h-4 w-4" />
                    View {task.applicationCount || 0} Applicant
                    {(task.applicationCount || 0) === 1 ? "" : "s"}
                  </button>
                )}

                {task.capabilities?.canCancel && (
                  <button
                    onClick={() => setCancelConfirmOpen(true)}
                    disabled={actionLoading === "cancel"}
                    className="flex items-center justify-center gap-2 rounded-xl border border-red-300 py-3 text-sm font-semibold text-red-600 disabled:opacity-50"
                  >
                    {actionLoading === "cancel" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    Cancel Task
                  </button>
                )}

                {task.capabilities?.canConfirmCompletion && (
                  <button
                    onClick={() => router.push(`/tasks/${taskId}/complete`)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-bold text-on-brand disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Confirm Complete &amp; Release Payment
                  </button>
                )}

                {task.capabilities?.canRate && (
                  <button
                    onClick={() => router.push(`/tasks/${taskId}/rate`)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-bold text-on-brand disabled:opacity-50"
                  >
                    <Star className="h-4 w-4" />
                    Rate &amp; Review
                  </button>
                )}

                {task.capabilities?.canMarkAsDone && (
                  <button
                    onClick={handleMarkAsDone}
                    disabled={actionLoading === "done"}
                    className="flex items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {actionLoading === "done" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    Mark as Done
                  </button>
                )}

                {task.capabilities?.canChat && (
                  <button
                    onClick={handleChat}
                    className="flex items-center justify-center gap-2 rounded-xl bg-gray-200 py-3 text-sm font-semibold text-gray-700"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Open Chat
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {task.status === "open" && task.lat && task.lng && (
          <div className="px-4 pb-6">
            <div className="overflow-hidden rounded-2xl border border-card-border bg-surface shadow-sm">
              <div className="flex items-center justify-between border-b border-card-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-brand-text" />
                  <h2 className="text-sm font-bold text-gray-900">
                    Available runners near this task
                  </h2>
                </div>
                {!nearbyLoading && nearbyRunners && (
                  <span className="text-xs font-medium text-gray-500">
                    {nearbyRunners.length} online within 5km
                  </span>
                )}
              </div>

              {nearbyLoading ? (
                <div className="space-y-2 px-4 py-4">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-14 skeleton rounded-xl" />
                  ))}
                </div>
              ) : nearbyRunners && nearbyRunners.length > 0 ? (
                <div className="divide-y divide-card-border">
                  {nearbyRunners.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand-text">
                        {r.profilePictureUrl ? (
                          <img
                            src={r.profilePictureUrl}
                            alt={r.fullName}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          r.fullName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {r.fullName}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {[r.department, r.level].filter(Boolean).join(" · ") ||
                            r.bio ||
                            "Runner"}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="flex items-center gap-1 text-xs font-semibold text-gray-600">
                          <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                          {r.trustScore}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="h-3.5 w-3.5 text-gray-400" />
                          {r.distanceMeters < 1000
                            ? `${Math.round(r.distanceMeters)}m`
                            : `${(r.distanceMeters / 1000).toFixed(1)}km`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-8 text-center">
                  <Users className="mx-auto h-8 w-8 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-500">
                    No runners are online right now
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Applications will still reach you when posted
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <ConfirmationDialog
        open={cancelConfirmOpen}
        onConfirm={handleCancel}
        onCancel={() => setCancelConfirmOpen(false)}
        title="Cancel this task?"
        message="Escrow will be refunded to your wallet. This action cannot be undone."
        confirmLabel="Cancel Task"
        variant="danger"
        loading={actionLoading === "cancel"}
      />
      <CelebrationModal
        open={celebration.open}
        onClose={celebration.close}
        config={celebration.config}
      />
    </>
  );
}
