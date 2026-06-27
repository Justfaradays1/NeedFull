// WHAT: Task detail page — full task view with poster info, description, application, escrow status
// WHY: Central page for task interaction — view, apply, track progress
// FUTURE: Add image gallery, add review prompt after completion, add dispute button

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Clock, AlertCircle, DollarSign, User, Send, Loader2 } from "lucide-react";
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
  distanceKm: number | null;
  category: { id: string; name: string; icon: string };
  poster: { id: string; fullName: string; profilePictureUrl: string | null; trustScore: number };
  runner?: { id: string; fullName: string; profilePictureUrl: string | null } | null;
  applicationCount: number;
  myApplication?: { id: string; status: string; proposedAmount: { kobo: number; naira: number } | null } | null;
}

const STATUS_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  open: { bg: "bg-green-100", text: "text-green-800", label: "Open" },
  in_progress: { bg: "bg-amber-100", text: "text-amber-800", label: "In Progress" },
  completed: { bg: "bg-blue-100", text: "text-blue-800", label: "Completed" },
  cancelled: { bg: "bg-gray-100", text: "text-gray-600", label: "Cancelled" },
};

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

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchTask = async () => {
      try {
        const res = await apiClient.get(`/tasks/${taskId}?lat=&lng=`);
        setTask(res.data?.data ?? null);
      } catch (err: any) {
        if (err?.response?.status === 404) toast.error("Task not found");
        else toast.error("Failed to load task");
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
  }, [isAuthenticated, taskId]);

  const handleApply = async () => {
    if (!applyMessage.trim() || applyMessage.trim().length < 10) {
      toast.error("Message must be at least 10 characters");
      return;
    }
    setApplying(true);
    try {
      await apiClient.post("/applications", {
        taskId,
        message: applyMessage.trim(),
        proposedAmountNaira: proposedAmount ? parseFloat(proposedAmount) : undefined,
      });
      toast.success("Application submitted!");
      setApplyMessage("");
      setProposedAmount("");
      const res = await apiClient.get(`/tasks/${taskId}?lat=&lng=`);
      setTask(res.data?.data ?? null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to submit application");
    } finally {
      setApplying(false);
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
        <AlertCircle className="mb-3 h-12 w-12 text-gray-300" />
        <h2 className="text-lg font-semibold text-gray-900">Task not found</h2>
        <button onClick={() => router.push("/feed")} className="mt-4 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white">Browse Tasks</button>
      </div>
    );
  }

  const isPoster = user?.id === task.poster.id;
  const isAssigned = user?.id === task.runner?.id;
  const canApply = !isPoster && !isAssigned && task.status === "open" && !task.myApplication;
  const badge = STATUS_BADGES[task.status] || STATUS_BADGES.open;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="glass-dark sticky top-0 z-30 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="tap-target rounded-lg p-2 hover:bg-white/20">
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <h1 className="text-lg font-bold text-white truncate">{task.title}</h1>
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          {task.imageUrl && (
            <img src={task.imageUrl} alt={task.title} className="w-full object-cover max-h-56" />
          )}

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
                  <span>{task.locationLabel}{task.distanceKm ? ` (${task.distanceKm.toFixed(1)} km)` : ""}</span>
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
                {task.poster.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{task.poster.fullName}</p>
                <p className="text-xs text-gray-500">Trust Score: {task.poster.trustScore}</p>
              </div>
            </div>

            {task.runner && (
              <div className="mb-4 flex items-center gap-3 rounded-xl bg-amber-50 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber/10 text-sm font-bold text-amber">
                  {task.runner.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{task.runner.fullName}</p>
                  <p className="text-xs text-amber-700">Runner assigned</p>
                </div>
              </div>
            )}

            {task.status === "in_progress" && (
              <div className="mb-4 rounded-xl bg-amber-50 p-3 text-center text-sm font-semibold text-amber-800">
                Escrow locked — payment released when task is completed
              </div>
            )}

            {task.myApplication && (
              <div className={`rounded-xl p-3 text-center text-sm font-semibold ${task.myApplication.status === "pending" || task.myApplication.status === "negotiating" ? "bg-amber-50 text-amber-800" : task.myApplication.status === "accepted" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                Your application: {task.myApplication.status}
                {task.myApplication.proposedAmount && ` (₦${task.myApplication.proposedAmount.naira.toLocaleString()})`}
              </div>
            )}
          </div>
        </div>

        {canApply && (
          <div className="mt-4 overflow-hidden rounded-2xl bg-white p-4 shadow-sm">
            <h3 className="mb-3 font-semibold text-gray-900">Apply for this task</h3>
            <textarea
              value={applyMessage}
              onChange={(e) => setApplyMessage(e.target.value)}
              placeholder="Tell the poster why you're the best fit..."
              className="mb-3 w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-brand focus:outline-none"
              rows={3}
              maxLength={500}
            />
            <div className="mb-3">
              <label className="text-xs font-medium text-gray-600">Proposed amount (optional)</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₦</span>
                <input
                  type="number"
                  value={proposedAmount}
                  onChange={(e) => setProposedAmount(e.target.value)}
                  placeholder={task.budget.naira.toLocaleString()}
                  className="w-full rounded-xl border border-gray-300 py-2.5 pl-8 pr-3 text-sm focus:border-brand focus:outline-none"
                  min={50}
                />
              </div>
              <p className="mt-1 text-[10px] text-gray-500">Leave empty to accept the listed budget</p>
            </div>
            <button
              onClick={handleApply}
              disabled={applying || applyMessage.trim().length < 10}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {applying ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        )}

        {task.status === "open" && !canApply && !isPoster && !task.myApplication && (
          <div className="mt-4 rounded-xl bg-gray-100 p-4 text-center text-sm text-gray-500">
            Sign in to apply for this task
          </div>
        )}
      </div>
    </div>
  );
}
