// WHAT: My Task detail page — task view from poster or runner perspective
// WHY: Allows task poster/runner to manage their task — cancel, complete, view applications
// FUTURE: Add in-chat link, add dispute flow, add re-open for cancelled tasks

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Clock, DollarSign, User, CheckCircle, XCircle, Loader2, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthInit, useIsAuthenticated, useAuthUser } from "@/store";
import apiClient from "@/lib/apiClient";

interface TaskDetail {
  id: string;
  title: string;
  description: string;
  budget: { kobo: number; naira: number };
  status: string;
  isUrgent: boolean;
  locationLabel: string | null;
  deadline: string | null;
  imageUrl: string | null;
  createdAt: string;
  category: { id: string; name: string; icon: string };
  poster: { id: string; fullName: string; profilePictureUrl: string | null };
  runner?: { id: string; fullName: string; profilePictureUrl: string | null } | null;
  applicationCount?: number;
}

const STATUS_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  open: { bg: "bg-green-100", text: "text-green-800", label: "Open" },
  in_progress: { bg: "bg-amber-100", text: "text-amber-800", label: "In Progress" },
  completed: { bg: "bg-blue-100", text: "text-blue-800", label: "Completed" },
  cancelled: { bg: "bg-gray-100", text: "text-gray-600", label: "Cancelled" },
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
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  const handleCancel = async () => {
    if (!window.confirm("Cancel this task? Escrow will be refunded to your wallet.")) return;
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

  const handleComplete = async () => {
    setActionLoading("complete");
    try {
      await apiClient.post(`/tasks/${taskId}/complete`);
      toast.success("Task marked as complete");
      const res = await apiClient.get(`/tasks/${taskId}?lat=&lng=`);
      setTask(res.data?.data ?? null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to complete");
    } finally {
      setActionLoading(null);
    }
  };

  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <h2 className="text-lg font-semibold text-gray-900">Task not found</h2>
        <button onClick={() => router.push("/tasks")} className="mt-4 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white">My Tasks</button>
      </div>
    );
  }

  const isPoster = user?.id === task.poster.id;
  const isRunner = user?.id === task.runner?.id;
  const badge = STATUS_BADGES[task.status] || STATUS_BADGES.open;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="tap-target rounded-lg p-2 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 truncate">{task.title}</h1>
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          {task.imageUrl && <img src={task.imageUrl} alt={task.title} className="w-full object-cover max-h-56" />}
          <div className="p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${badge.bg} ${badge.text}`}>{badge.label}</span>
              {task.isUrgent && <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">URGENT</span>}
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">{task.category.name}</span>
            </div>

            <p className="mb-4 text-sm leading-relaxed text-gray-700 whitespace-pre-line">{task.description}</p>

            <div className="mb-4 space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-brand" />
                <span className="font-semibold text-gray-900">₦{task.budget.naira.toLocaleString()}</span>
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
                  <span>Due {new Date(task.deadline).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <div className="mb-4 flex items-center gap-3 rounded-xl bg-gray-50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">
                {(task.runner?.fullName ?? task.poster.fullName).charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {isPoster ? "You (Poster)" : isRunner ? "You (Runner)" : task.poster.fullName}
                </p>
                {task.runner && <p className="text-xs text-gray-500">Runner: {task.runner.fullName}</p>}
                {!task.runner && <p className="text-xs text-gray-500">Poster: {task.poster.fullName}</p>}
              </div>
            </div>

            {task.status === "in_progress" && (
              <div className="mb-4 rounded-xl bg-amber-50 p-3 text-center text-sm font-semibold text-amber-800">
                Escrow locked — complete the task to release payment
              </div>
            )}

            <div className="flex flex-col gap-2">
              {isPoster && task.status === "open" && (
                <button
                  onClick={handleCancel}
                  disabled={actionLoading === "cancel"}
                  className="flex items-center justify-center gap-2 rounded-xl border border-red-300 py-3 text-sm font-semibold text-red-600 disabled:opacity-50"
                >
                  {actionLoading === "cancel" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  Cancel Task
                </button>
              )}

              {(isPoster || isRunner) && task.status === "in_progress" && isRunner && (
                <button
                  onClick={handleComplete}
                  disabled={actionLoading === "complete"}
                  className="flex items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  {actionLoading === "complete" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Mark as Complete
                </button>
              )}

              <button
                onClick={() => router.push(`/chat/${taskId}`)}
                className="flex items-center justify-center gap-2 rounded-xl bg-gray-100 py-3 text-sm font-semibold text-gray-700"
              >
                <MessageCircle className="h-4 w-4" />
                Open Chat
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
