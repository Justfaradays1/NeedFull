// WHAT: Confirm Completion page (poster) — the final escrow release step
// WHY: The poster sees exactly what will be released, a clear warning that this
//      cannot be undone, then confirms. Confirmation releases escrow to the
//      runner and moves the task to Completed (Payment Released).
// FUTURE: Add dispute entry before release, completion photos, platform fee line.

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Lock,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthInit, useIsAuthenticated } from "@/store";
import apiClient from "@/lib/apiClient";
import { formatCurrency } from "@/lib/format";
import { TaskDetailSkeleton } from "@/components/ui/skeletons/TaskDetailSkeleton";
import { CelebrationModal } from "@/components/ui/celebration-modal";
import { useCelebration } from "@/hooks/useCelebration";

interface TaskDetailData {
  id: string;
  posterId: string;
  title: string;
  budget: { kobo: number; naira: number };
  agreedAmount: { kobo: number; naira: number } | null;
  status: string;
  runner: {
    id: string;
    fullName: string;
    profilePictureUrl: string | null;
  } | null;
  capabilities?: {
    canConfirmCompletion: boolean;
  };
}

export default function TaskCompletePage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  useAuthInit();
  const isAuthenticated = useIsAuthenticated();

  const [task, setTask] = useState<TaskDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const celebration = useCelebration();

  const fetchTask = async () => {
    try {
      const res = await apiClient.get(`/tasks/${taskId}`);
      const data = res.data?.data ?? null;
      setTask(data);
      if (!data?.capabilities?.canConfirmCompletion) setDenied(true);
    } catch {
      toast.error("Failed to load task");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchTask();
  }, [isAuthenticated, taskId]);

  const handleRelease = async () => {
    setConfirming(true);
    try {
      await apiClient.post(`/tasks/${taskId}/complete`);
      celebration.showForAction("poster", "payment_released", {
        primaryLabel: "Rate Your Experience",
        primaryAction: () => router.push(`/tasks/${taskId}/rate`),
        secondaryLabel: "Back to My Tasks",
        secondaryHref: "/tasks",
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Couldn't complete the task");
    } finally {
      setConfirming(false);
    }
  };

  if (!isAuthenticated) return null;
  if (loading) return <TaskDetailSkeleton />;

  if (!task) {
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

  if (denied) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center page-shell px-4 text-center">
        <AlertTriangle className="mb-2 h-10 w-10 text-amber-400" />
        <h2 className="text-lg font-semibold text-gray-900">
          Nothing to confirm right now
        </h2>
        <p className="mt-1 max-w-xs text-sm text-gray-500">
          Payment can only be released once the runner has marked the task as
          done.
        </p>
        <button
          onClick={() => router.push(`/tasks/${taskId}/active`)}
          className="mt-4 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-on-brand"
        >
          Back to Task
        </button>
      </div>
    );
  }

  const agreed = task.agreedAmount ?? task.budget;

  return (
    <div className="min-h-screen page-shell">
      <div className="glass-dark px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="tap-target rounded-lg p-2 hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <h1 className="text-lg font-bold text-white">Confirm Completion</h1>
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-4xl">
            ✅
          </div>
          <h2 className="font-display text-xl font-bold text-gray-900">
            Task done?
          </h2>
          <p className="mx-auto mt-1 max-w-xs text-sm text-gray-500">
            Confirming releases the escrow payment to{" "}
            {task.runner?.fullName?.split(" ")[0]} immediately.
          </p>
        </div>

        {/* Payment summary */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-card-border bg-surface shadow-sm">
          <div className="p-4">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">
              Payment Summary
            </h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Task</span>
                <span className="font-semibold text-gray-900">{task.title}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Agent</span>
                <span className="font-semibold text-gray-900">
                  {task.runner?.fullName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Agreed amount</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(agreed.kobo)}
                </span>
              </div>
              <div className="border-t border-card-border pt-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900">
                    Amount to be released
                  </span>
                  <span className="font-display text-xl font-black text-brand-text">
                    {formatCurrency(agreed.kobo)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="flex items-center gap-1.5 text-sm font-bold text-red-700">
            <AlertTriangle className="h-4 w-4" />
            This cannot be undone
          </p>
          <p className="mt-1 text-xs leading-relaxed text-red-600">
            Once you confirm, {task.runner?.fullName?.split(" ")[0]} gets paid and
            the task is closed. Only confirm if you&apos;re satisfied with the work.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={handleRelease}
            disabled={confirming}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3.5 text-sm font-bold text-on-brand shadow-sm active:scale-[0.97] disabled:opacity-60"
          >
            {confirming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {confirming ? "Releasing..." : "Yes, Release Payment"}
          </button>
          <button
            onClick={() => router.back()}
            disabled={confirming}
            className="w-full rounded-xl border border-gray-300 py-3 text-sm font-semibold text-gray-600 active:scale-[0.97] disabled:opacity-50"
          >
            Not yet, go back
          </button>
        </div>

        <p className="mt-4 flex items-center justify-center gap-1 text-center text-[11px] text-gray-400">
          <Lock className="h-3 w-3" />
          Payment is held safely by NeedFull until you confirm.
        </p>
      </div>

      <CelebrationModal
        open={celebration.open}
        onClose={celebration.close}
        config={celebration.config}
      />
    </div>
  );
}