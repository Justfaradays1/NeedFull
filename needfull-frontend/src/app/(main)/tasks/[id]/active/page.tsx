// WHAT: Task Active page — the live, in-flight task experience for both the
//       poster and the hired runner: escrow box, hired agent, progress timeline,
//       and the right next action for whoever is viewing.
// WHY: This is the heart of the task flow. Once a runner is hired, everything
//      shifts here — the task is no longer a request, it's work in motion with
//      money in escrow. The page shows exactly where the task stands and what
//      the viewer can do next (start work / mark done / confirm & release).
// FUTURE: Add live ETA/location, dispute button, task chat inline.

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Calendar,
  ShieldCheck,
  Lock,
  MessageCircle,
  Loader2,
  CheckCircle2,
  PlayCircle,
  BadgeCheck,
  Star,
  Briefcase,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthInit, useIsAuthenticated, useAuthUser } from "@/store";
import apiClient from "@/lib/apiClient";
import { formatCurrency } from "@/lib/format";
import { getCategoryDisplayName, getCategoryColor, getCategoryIcon } from "@/lib/categoryConfig";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { openTaskChat } from "@/lib/taskChat";
import { TaskDetailSkeleton } from "@/components/ui/skeletons/TaskDetailSkeleton";
import { Avatar } from "@/components/ui/avatar";
import { TaskTimeline, buildTaskTimeline } from "@/components/tasks/TaskTimeline";

interface TaskCapabilities {
  canStartWork: boolean;
  canMarkAsDone: boolean;
  canConfirmCompletion: boolean;
  canCancel: boolean;
  canChat: boolean;
  canRate: boolean;
}

interface TaskDetailData {
  id: string;
  posterId: string;
  title: string;
  budget: { kobo: number; naira: number };
  agreedAmount: { kobo: number; naira: number } | null;
  status: string;
  runnerPhase: string | null;
  runnerDoneAt: string | null;
  locationLabel: string | null;
  deadline: string | null;
  isUrgent: boolean;
  category: { id: string; name: string; icon: string };
  poster: {
    id: string;
    fullName: string;
    profilePictureUrl: string | null;
    avatarUrl?: string | null;
    averageRating?: number | null;
    tasksCompleted?: number;
    isVerifiedStudent?: boolean;
  };
  runner: {
    id: string;
    fullName: string;
    profilePictureUrl: string | null;
    avatarUrl?: string | null;
    averageRating?: number | null;
    tasksCompleted?: number;
    isVerifiedStudent?: boolean;
  } | null;
  runnerId: string | null;
  createdAt: string;
  capabilities?: TaskCapabilities;
}

export default function TaskActivePage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  useAuthInit();
  const isAuthenticated = useIsAuthenticated();
  const user = useAuthUser();

  const [task, setTask] = useState<TaskDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [action, setAction] = useState<string | null>(null);

  const fetchTask = async () => {
    try {
      const res = await apiClient.get(`/tasks/${taskId}`);
      setTask(res.data?.data ?? null);
    } catch (err: any) {
      if (err?.response?.status === 404) setNotFound(true);
      else toast.error("Failed to load task");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchTask();
  }, [isAuthenticated, taskId]);

  const isPoster = task ? user?.id === task.posterId : false;
  const isRunner = task ? user?.id === task.runnerId : false;
  const participant = isPoster || isRunner;

  const handleStartWork = async () => {
    setAction("start");
    try {
      await apiClient.post(`/tasks/${taskId}/start-work`);
      toast.success("Work started! Keep the poster updated.");
      await fetchTask();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Couldn't start work");
    } finally {
      setAction(null);
    }
  };

  const handleMarkDone = async () => {
    setAction("done");
    try {
      await apiClient.post(`/tasks/${taskId}/done`);
      toast.success("Task marked done — awaiting poster confirmation.");
      await fetchTask();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Couldn't mark as done");
    } finally {
      setAction(null);
    }
  };

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

  if (!isAuthenticated) return null;

  if (loading) return <TaskDetailSkeleton />;

  if (notFound || !task) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center page-shell px-4 text-center">
        <h2 className="text-lg font-semibold text-gray-900">Task not found</h2>
        <Link
          href="/tasks"
          className="mt-4 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-on-brand"
        >
          My Tasks
        </Link>
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center page-shell px-4 text-center">
        <h2 className="text-lg font-semibold text-gray-900">
          You&apos;re not part of this task
        </h2>
        <Link
          href="/tasks"
          className="mt-4 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-on-brand"
        >
          My Tasks
        </Link>
      </div>
    );
  }

  const agreed = task.agreedAmount ?? task.budget;
  const steps = buildTaskTimeline(task);
  const peer = isPoster ? task.runner : task.poster;
  const peerLabel = isPoster ? "Hired Agent" : "Poster";
  const isAwaiting = !!task.runnerDoneAt && task.status === "in_progress";
  const neutral =
    !task.capabilities?.canStartWork &&
    !task.capabilities?.canMarkAsDone &&
    !task.capabilities?.canConfirmCompletion &&
    !task.capabilities?.canRate;

  return (
    <div className="min-h-screen page-shell pb-32 md:pb-40">
      {/* Header */}
      <div className="glass-dark px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="tap-target rounded-lg p-2 hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-white">Task Active</h1>
            <p className="text-[11px] text-white/70">{task.title}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        {/* Escrow box */}
        <div className="mb-4 overflow-hidden rounded-2xl border border-brand/20 bg-brand-light">
          <div className="px-4 py-3.5">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-dark">
                <ShieldCheck className="h-4 w-4" />
                Funds in Escrow
              </p>
              <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-0.5 text-[10px] font-bold text-white">
                <Lock className="h-3 w-3" /> Secured
              </span>
            </div>
            <p className="mt-2 font-display text-3xl font-black text-brand-dark">
              {formatCurrency(agreed.kobo)}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-gray-600">
              Payment is safely held by NeedFull. It&apos;s released to the runner the
              moment you confirm the task is complete — you never chase for money.
            </p>
          </div>
        </div>

        {/* Task info */}
        <div className="mb-4 overflow-hidden rounded-2xl border border-card-border bg-surface shadow-sm">
          <div className="p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                {isAwaiting ? "Awaiting Confirmation" : "In Progress"}
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

            <h2 className="font-display text-lg font-bold text-gray-900">
              {task.title}
            </h2>

            <div className="mt-2 space-y-1.5 text-xs text-gray-600">
              {task.locationLabel && (
                <p className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-gray-400" />
                  {task.locationLabel}
                </p>
              )}
              {task.deadline && (
                <p className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  Due {new Date(task.deadline).toLocaleDateString("en-NG", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </p>
              )}
              <p className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                Posted {new Date(task.createdAt).toLocaleDateString("en-NG", {
                  day: "numeric",
                  month: "short",
                })}
              </p>
            </div>

            {/* Hired agent (poster view) / Poster (runner view) */}
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-gray-100 p-3">
              <Avatar
                src={peer?.profilePictureUrl || peer?.avatarUrl || null}
                name={peer?.fullName}
                size="md"
                border
              />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                  {peerLabel}
                </p>
                <p className="flex items-center gap-1 truncate text-sm font-bold text-gray-900">
                  <span className="truncate">{peer?.fullName}</span>
                  {peer?.isVerifiedStudent && (
                    <BadgeCheck className="h-4 w-4 shrink-0 text-blue-500" />
                  )}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
                  {peer?.averageRating != null && (
                    <span className="inline-flex items-center gap-0.5 font-semibold">
                      <Star className="h-3 w-3 fill-gold text-gold" />
                      {peer.averageRating}
                    </span>
                  )}
                  {typeof peer?.tasksCompleted === "number" && (
                    <span className="inline-flex items-center gap-0.5">
                      <Briefcase className="h-3 w-3" />
                      {peer.tasksCompleted} done
                    </span>
                  )}
                </div>
              </div>
              {task.capabilities?.canChat && (
                <button
                  onClick={handleChat}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-xs font-bold text-on-brand active:scale-[0.97]"
                >
                  <MessageCircle className="h-4 w-4" />
                  Chat
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Progress timeline */}
        <div className="mb-4 rounded-2xl border border-card-border bg-surface p-4 shadow-sm">
          <h2 className="mb-4 font-display text-sm font-bold text-gray-900">
            Task Progress
          </h2>
          <TaskTimeline steps={steps} />
        </div>

        {/* What's next (neutral state) */}
        {neutral && (
          <div className="rounded-2xl border border-gold/25 bg-gold-light/40 p-4 text-center">
            <p className="text-sm font-semibold text-gold-dark">
              {isPoster
                ? "The runner has been hired. Track their progress here and confirm completion when the work is done."
                : "You've been hired! Start the work and mark it done when you've delivered."}
            </p>
          </div>
        )}
      </div>

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/70 bg-white/95 px-4 pb-4 pt-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl md:inset-x-auto md:bottom-6 md:right-6 md:w-80 md:rounded-2xl md:border md:p-4 md:shadow-xl">
        <div className="mx-auto flex max-w-lg flex-col gap-2">
          {task.capabilities?.canStartWork && (
            <button
              onClick={handleStartWork}
              disabled={action === "start"}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-bold text-on-brand active:scale-[0.97] disabled:opacity-60"
            >
              {action === "start" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PlayCircle className="h-4 w-4" />
              )}
              Start Work
            </button>
          )}

          {task.capabilities?.canMarkAsDone && (
            <button
              onClick={handleMarkDone}
              disabled={action === "done"}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-bold text-white active:scale-[0.97] disabled:opacity-60"
            >
              {action === "done" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Mark as Done
            </button>
          )}

          {task.capabilities?.canConfirmCompletion && (
            <button
              onClick={() => router.push(`/tasks/${taskId}/complete`)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-3 text-sm font-bold text-white shadow-sm shadow-gold/25 active:scale-[0.97]"
            >
              <CheckCircle2 className="h-4 w-4" />
              Confirm Complete &amp; Release Payment
            </button>
          )}

          {task.capabilities?.canRate && (
            <button
              onClick={() => router.push(`/tasks/${taskId}/rate`)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-3 text-sm font-bold text-white shadow-sm shadow-gold/25 active:scale-[0.97]"
            >
              <Star className="h-4 w-4" />
              Rate Your Experience
            </button>
          )}

          {task.capabilities?.canCancel && (
            <button
              onClick={() => router.push(`/tasks/${taskId}`)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-3 text-sm font-semibold text-red-600"
            >
              Manage Task
            </button>
          )}
        </div>
      </div>
    </div>
  );
}