// WHAT: Admin tasks page — moderation view of all platform tasks
// WHY: Admins need to monitor and moderate task content
// FUTURE: Add task flagging, add bulk actions

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ClipboardList, Loader2, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthInit, useIsAuthenticated, useIsAdmin } from "@/store";
import apiClient from "@/lib/apiClient";

interface TaskItem {
  id: string;
  title: string;
  budget: { kobo: number; naira: number };
  status: string;
  isUrgent: boolean;
  createdAt: string;
  category: { id: string; name: string };
  poster?: { id: string; fullName: string };
}

export default function AdminTasksPage() {
  const router = useRouter();
  useAuthInit();
  const isAuthenticated = useIsAuthenticated();
  const isAdmin = useIsAdmin();

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), perPage: "20" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await apiClient.get(`/admin/tasks?${params}`);
      setTasks(res.data?.data ?? []);
      setHasMore(res.data?.hasMore ?? false);
    } catch {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) fetchTasks();
    else if (isAuthenticated && !isAdmin) router.push("/feed");
  }, [isAuthenticated, isAdmin, router, fetchTasks]);

  const handleCancel = async (taskId: string) => {
    if (!window.confirm("Cancel this task? Escrow will be refunded.")) return;
    setCancellingId(taskId);
    try {
      await apiClient.post(`/admin/tasks/${taskId}/cancel`);
      toast.success("Task cancelled");
      fetchTasks();
    } catch {
      toast.error("Failed to cancel task");
    } finally {
      setCancellingId(null);
    }
  };

  const filters = ["all", "open", "in_progress", "completed", "cancelled"];

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="tap-target rounded-lg p-2 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">All Tasks</h1>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto px-4 py-3">
        {filters.map((f) => (
          <button key={f} onClick={() => { setStatusFilter(f); setPage(1); }} className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${statusFilter === f ? "bg-brand text-white" : "bg-gray-200 text-gray-600"}`}>
            {f === "in_progress" ? "In Progress" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="px-4 pb-6">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <ClipboardList className="mb-2 h-12 w-12" />
            <p className="text-sm">No tasks found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((t) => (
              <div key={t.id} className="rounded-xl bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{t.title}</p>
                    <p className="text-xs text-gray-500">by {t.poster?.fullName ?? "Unknown"}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {t.isUrgent && <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">URGENT</span>}
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${t.status === "open" ? "bg-green-100 text-green-800" : t.status === "in_progress" ? "bg-amber-100 text-amber-800" : t.status === "completed" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600"}`}>
                      {t.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
                <div className="mb-2 text-xs text-gray-600">
                  <span className="font-medium">Budget:</span> ₦{t.budget.naira.toLocaleString()} &middot;
                  <span className="font-medium"> Category:</span> {t.category.name}
                </div>
                <p className="mb-3 text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</p>
                {(t.status === "open" || t.status === "in_progress") && (
                  <button onClick={() => handleCancel(t.id)} disabled={cancellingId === t.id} className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-300 py-2.5 text-sm font-semibold text-red-600 disabled:opacity-50">
                    {cancellingId === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                    Cancel Task
                  </button>
                )}
              </div>
            ))}
            <div className="flex items-center justify-between pt-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-lg bg-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 disabled:opacity-30">Previous</button>
              <span className="text-xs text-gray-500">Page {page}</span>
              <button disabled={!hasMore} onClick={() => setPage((p) => p + 1)} className="rounded-lg bg-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 disabled:opacity-30">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
