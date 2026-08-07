// WHAT: Applicants page (poster) — review every runner who applied to a task
// WHY: The hiring decision lives here. Posters compare applicant trust signals,
//      message them, or hire one runner. Hiring transitions the task to MATCHED
//      (storage in_progress), notifies the chosen runner, and rejects the rest.

"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Star,
  BadgeCheck,
  Briefcase,
  MapPin,
  ShieldCheck,
  MessageCircle,
  UserCheck,
  Users,
  AlertCircle,
  RefreshCw,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import { get, post } from "@/lib/apiClient";
import { useAuthInit, useIsAuthenticated } from "@/store";
import { formatCurrency } from "@/lib/format";
import { Avatar } from "@/components/ui/avatar";

interface Applicant {
  id: string;
  taskId: string;
  runnerId: string;
  message: string | null;
  proposedAmount: { kobo: number; naira: number } | null;
  counterAmount: { kobo: number; naira: number } | null;
  agreedAmount: { kobo: number; naira: number } | null;
  status: string;
  createdAt: string;
  runner: {
    id: string;
    fullName: string;
    trustScore?: number;
    profilePictureUrl?: string | null;
    avatarUrl?: string | null;
    department?: string | null;
    level?: string | null;
    school?: string | null;
    tasksCompleted?: number;
    isVerifiedStudent?: boolean;
    bio?: string | null;
    skills?: string[] | null;
    locationLabel?: string | null;
    averageRating?: number | null;
  };
}

interface TaskSummary {
  id: string;
  title: string;
  status: string;
  budget: { kobo: number; naira: number };
  applicationCount: number;
  capabilities?: { canViewApplications: boolean };
}

export default function ApplicantsPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  useAuthInit();
  const isAuthenticated = useIsAuthenticated();

  const [task, setTask] = useState<TaskSummary | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [denied, setDenied] = useState(false);
  const [hiringId, setHiringId] = useState<string | null>(null);

  const fetchApplicants = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      setDenied(false);
      const [taskRes, appsRes] = await Promise.all([
        get<{ success: boolean; data: TaskSummary }>(`/tasks/${taskId}`),
        get<{ success: boolean; data: Applicant[] }>(
          `/applications/task/${taskId}`,
        ),
      ]);

      if (taskRes.success) {
        setTask(taskRes.data);
        if (!taskRes.data.capabilities?.canViewApplications) setDenied(true);
      }
      if (appsRes.success) setApplicants(appsRes.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchApplicants();
  }, [isAuthenticated, fetchApplicants]);

  const hire = async (applicationId: string, runnerName: string) => {
    if (hiringId) return;
    setHiringId(applicationId);
    try {
      const res = await post<{ success: boolean; message: string }>(
        `/applications/${applicationId}/accept`,
      );
      if (res.success) {
        toast.success(`${runnerName} is now hired. Escrow is locked.`);
        await fetchApplicants();
      } else {
        toast.error(res.message || "Couldn't hire this runner");
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Couldn't hire this runner — try again",
      );
    } finally {
      setHiringId(null);
    }
  };

  const openChat = async (runnerId: string) => {
    try {
      const res = await post<{ success: boolean; data: { id: string } }>(
        "/chat/conversations",
        { otherUserId: runnerId },
      );
      if (res.success) router.push(`/chat/${res.data.id}`);
      else router.push("/chat");
    } catch {
      toast.error("Couldn't open chat — try again");
    }
  };

  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <PageShell taskId={taskId}>
        <div className="h-16 w-1/2 skeleton rounded-2xl" />
        <div className="mt-3 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-card-border bg-surface p-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 skeleton rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 skeleton rounded" />
                  <div className="h-3 w-1/2 skeleton rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell taskId={taskId}>
        <div className="flex flex-col items-center py-16 text-center">
          <AlertCircle className="h-10 w-10 text-gray-300" />
          <h2 className="mt-3 text-base font-bold text-gray-900">
            Couldn&apos;t load applicants
          </h2>
          <button
            type="button"
            onClick={fetchApplicants}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-gold px-4 py-2.5 text-xs font-bold text-white shadow-sm active:scale-[0.97]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try Again
          </button>
        </div>
      </PageShell>
    );
  }

  if (denied || !task?.capabilities?.canViewApplications) {
    return (
      <PageShell taskId={taskId}>
        <div className="flex flex-col items-center py-16 text-center">
          <ShieldCheck className="h-10 w-10 text-gray-300" />
          <h2 className="mt-3 text-base font-bold text-gray-900">
            Only the task poster can see applicants
          </h2>
          <button
            type="button"
            onClick={() => router.push("/tasks")}
            className="mt-4 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-on-brand"
          >
            My Tasks
          </button>
        </div>
      </PageShell>
    );
  }

  const hired = applicants.find((a) => a.status === "accepted");

  return (
    <PageShell taskId={taskId}>
      {/* Task summary */}
      <div className="mb-4 rounded-2xl border border-card-border bg-surface p-4 shadow-sm">
        <h1 className="text-base font-bold text-gray-900">{task?.title}</h1>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
          <span className="inline-flex items-center gap-1 font-semibold text-brand-text">
            <Briefcase className="h-3 w-3" />
            {task?.applicationCount ?? applicants.length} applicant
            {(task?.applicationCount ?? applicants.length) === 1 ? "" : "s"}
          </span>
          <span className="inline-flex items-center gap-1 font-black text-gold">
            {task ? formatCurrency(task.budget.kobo) : ""}
          </span>
        </div>
      </div>

      {/* Hired banner */}
      {hired && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-600 text-white">
            <UserCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-green-900">
              {hired.runner.fullName} has been hired
            </p>
            <p className="text-[11px] text-green-700">
              Escrow is locked. Other applicants were notified.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/tasks")}
            className="shrink-0 rounded-lg bg-green-600 px-3 py-2 text-[11px] font-bold text-white transition-all active:scale-[0.97]"
          >
            My Tasks
          </button>
        </div>
      )}

      {applicants.length === 0 && !hired ? (
        <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-12 text-center">
          <Users className="mx-auto h-9 w-9 text-gray-300" />
          <h2 className="mt-3 text-sm font-bold text-gray-900">
            No one has applied yet
          </h2>
          <p className="mx-auto mt-1 max-w-[17rem] text-xs leading-relaxed text-gray-500">
            Runners discover your task on the marketplace. When they apply,
            you&apos;ll be able to review and hire here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {applicants.map((app) => {
            const isHired = app.status === "accepted";
            const actionable = app.status === "pending" || app.status === "negotiating";
            const amount = app.counterAmount || app.proposedAmount;
            return (
              <div
                key={app.id}
                className={`rounded-2xl border bg-surface p-4 shadow-sm ${
                  isHired ? "border-green-300 ring-1 ring-green-200" : "border-card-border"
                }`}
              >
                {/* Runner identity */}
                <div className="flex items-start gap-3">
                  <Link href={`/profile/${app.runnerId}`} className="shrink-0">
                    <Avatar
                      src={app.runner.profilePictureUrl || app.runner.avatarUrl}
                      name={app.runner.fullName}
                      size="lg"
                      border
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1 text-sm font-bold text-gray-900">
                      <Link href={`/profile/${app.runnerId}`} className="truncate hover:underline">
                        {app.runner.fullName}
                      </Link>
                      {app.runner.isVerifiedStudent && (
                        <BadgeCheck className="h-4 w-4 shrink-0 text-blue-500" />
                      )}
                      {isHired && (
                        <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-bold text-green-700">
                          HIRED
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-gray-500">
                      {[app.runner.department, app.runner.level, app.runner.school]
                        .filter(Boolean)
                        .join(" · ") || "Campus runner"}
                    </p>

                    {/* Trust + rating + completed */}
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-600">
                      {typeof app.runner.averageRating === "number" && (
                        <span className="inline-flex items-center gap-0.5 font-semibold">
                          <Star className="h-3 w-3 fill-gold text-gold" />
                          {app.runner.averageRating}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3 text-brand-text" />
                        Trust {app.runner.trustScore ?? "—"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-gray-400" />
                        {app.runner.tasksCompleted ?? 0} tasks done
                      </span>
                      {app.runner.locationLabel && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          {app.runner.locationLabel}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="font-display text-base font-black text-gold">
                      {amount ? formatCurrency(amount.kobo) : "Budget"}
                    </p>
                    <p className="text-[10px] capitalize text-gray-400">{app.status}</p>
                  </div>
                </div>

                {/* Bio + skills */}
                {app.runner.bio && (
                  <p className="mt-3 text-xs leading-relaxed text-gray-600 line-clamp-2">
                    {app.runner.bio}
                  </p>
                )}
                {Array.isArray(app.runner.skills) && app.runner.skills.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {app.runner.skills.slice(0, 4).map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-brand-light/60 px-2 py-0.5 text-[10px] font-semibold text-brand-text"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {/* Application message */}
                {app.message && (
                  <div className="mt-3 rounded-xl bg-gray-50 p-3">
                    <p className="text-[11px] leading-relaxed text-gray-600">
                      “{app.message}”
                    </p>
                  </div>
                )}

                {/* Actions */}
                {actionable ? (
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!!hiringId}
                      onClick={() => hire(app.id, app.runner.fullName)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gold px-3 py-2.5 text-xs font-bold text-white shadow-sm shadow-gold/20 transition-all active:scale-[0.97] disabled:opacity-60"
                    >
                      {hiringId === app.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <UserCheck className="h-3.5 w-3.5" />
                      )}
                      {hiringId === app.id ? "Hiring…" : "Hire"}
                    </button>
                    <button
                      type="button"
                      onClick={() => openChat(app.runnerId)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-card-border px-3 py-2.5 text-xs font-bold text-gray-700 transition-all active:scale-[0.97]"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Chat
                    </button>
                  </div>
                ) : isHired ? (
                  <button
                    type="button"
                    onClick={() => openChat(app.runnerId)}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-green-600 px-3 py-2.5 text-xs font-bold text-white transition-all active:scale-[0.97]"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Chat with hired runner
                  </button>
                ) : (
                  <p className="mt-3 text-center text-[11px] font-medium text-gray-400">
                    Not selected — this application is closed
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

function PageShell({ taskId, children }: { taskId: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen page-shell">
      <div className="glass-dark px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/tasks/${taskId}`}
            className="tap-target rounded-lg p-2 hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </Link>
          <h1 className="truncate text-lg font-bold text-white">Applicants</h1>
        </div>
      </div>
      <div className="px-4 pb-10 pt-4">{children}</div>
    </div>
  );
}