// WHAT: Admin reports page — review and resolve user reports
// WHY: Admins need to moderate reported users and content
// FUTURE: Add severity filters, add user warning system

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Flag, Check, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthInit, useIsAuthenticated, useIsAdmin } from "@/store";
import apiClient from "@/lib/apiClient";

interface Report {
  id: string;
  reason: string;
  status: string;
  createdAt: string;
  reporter?: { id: string; fullName: string };
  reportedUser?: { id: string; fullName: string };
  reportedTask?: { id: string; title: string };
}

export default function AdminReportsPage() {
  const router = useRouter();
  useAuthInit();
  const isAuthenticated = useIsAuthenticated();
  const isAdmin = useIsAdmin();

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"open" | "all">("open");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [resolution, setResolution] = useState("");
  const [action, setAction] = useState<"dismiss" | "action_taken">("action_taken");

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter === "open" ? "?status=open" : "";
      const res = await apiClient.get(`/admin/reports${params}`);
      setReports(res.data?.data ?? []);
    } catch {
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) fetchReports();
    else if (isAuthenticated && !isAdmin) router.push("/feed");
  }, [isAuthenticated, isAdmin, router, fetchReports]);

  const handleResolve = async (id: string) => {
    if (!resolution.trim()) { toast.error("Please provide a resolution note"); return; }
    setProcessingId(id);
    try {
      await apiClient.post(`/admin/reports/${id}/resolve`, { status: action, resolution: resolution.trim() });
      toast.success("Report resolved");
      setResolution("");
      fetchReports();
    } catch {
      toast.error("Failed to resolve report");
    } finally {
      setProcessingId(null);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="tap-target rounded-lg p-2 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Reports</h1>
        </div>
      </header>

      <div className="flex gap-2 px-4 py-3">
        {(["open", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${filter === f ? "bg-brand text-white" : "bg-gray-200 text-gray-600"}`}>
            {f === "open" ? "Open" : "All"}
          </button>
        ))}
      </div>

      <div className="px-4 pb-6">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Flag className="mb-2 h-12 w-12" />
            <p className="text-sm">No reports found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <div key={r.id} className="rounded-xl bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-start justify-between">
                  <p className="font-semibold text-gray-900">Report #{r.id.slice(0, 8)}</p>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${r.status === "open" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>{r.status}</span>
                </div>
                <p className="mb-2 text-sm text-gray-700">{r.reason}</p>
                <div className="mb-2 text-xs text-gray-500">
                  {r.reporter && <p>Reported by: {r.reporter.fullName}</p>}
                  {r.reportedUser && <p>Against: {r.reportedUser.fullName}</p>}
                  {r.reportedTask && <p>Task: {r.reportedTask.title}</p>}
                </div>
                <p className="mb-3 text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</p>
                {r.status === "open" && (
                  <div className="space-y-2">
                    <textarea value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="Resolution notes..." className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-brand focus:outline-none" rows={2} />
                    <div className="flex gap-2">
                      <button onClick={() => setAction("action_taken")} className={`rounded-lg px-3 py-2 text-xs font-semibold ${action === "action_taken" ? "bg-brand text-white" : "bg-gray-100 text-gray-600"}`}>Action Taken</button>
                      <button onClick={() => setAction("dismiss")} className={`rounded-lg px-3 py-2 text-xs font-semibold ${action === "dismiss" ? "bg-gray-600 text-white" : "bg-gray-100 text-gray-600"}`}>Dismiss</button>
                    </div>
                    <button onClick={() => handleResolve(r.id)} disabled={!resolution.trim() || processingId === r.id} className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                      {processingId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Resolve Report
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
