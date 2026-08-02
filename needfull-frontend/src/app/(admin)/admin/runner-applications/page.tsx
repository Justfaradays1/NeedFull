"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Check, X, Loader2, Zap, Search,
} from "lucide-react";
import toast from "react-hot-toast";

import apiClient from "@/lib/apiClient";

interface RunnerApplication {
  id: string;
  fullName: string;
  email: string;
  school?: string;
  department?: string;
  trustScore: number;
  runnerStatus: string;
  createdAt: string;
}

export default function AdminRunnerApplicationsPage() {
  const [applications, setApplications] = useState<RunnerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/admin/runner-applications");
      setApplications(res.data?.data ?? res.data ?? []);
    } catch {
      toast.error("Failed to load runner applications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const filtered = applications.filter(
    (a) =>
      a.fullName.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()),
  );

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      await apiClient.post(`/admin/runner-applications/${id}/review`, { action: "approve" });
      toast.success("Runner application approved");
      fetchApplications();
    } catch {
      toast.error("Failed to approve application");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      await apiClient.post(`/admin/runner-applications/${id}/review`, { action: "reject" });
      toast.success("Runner application rejected");
      fetchApplications();
    } catch {
      toast.error("Failed to reject application");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 md:text-2xl">
            Runner Applications
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Review and approve or reject runner applications
          </p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
        <Search className="h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border-0 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-brand-text" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-20">
          <Zap className="h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-bold text-gray-900">
            {search ? "No matching applications" : "No pending applications"}
          </p>
          <p className="text-xs text-gray-500">
            {search
              ? "Try a different search term"
              : "New runner applications will appear here"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => (
            <div
              key={app.id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900">
                    {app.fullName}
                  </p>
                  <p className="text-xs text-gray-500">{app.email}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                    {app.school && <span>School: {app.school}</span>}
                    {app.department && <span>Dept: {app.department}</span>}
                    <span>Trust: {app.trustScore}</span>
                    <span>
                      Applied:{" "}
                      {new Date(app.createdAt).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => handleApprove(app.id)}
                    disabled={processingId === app.id}
                    className="tap-target inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-green-700 active:scale-[0.97] disabled:opacity-50"
                  >
                    {processingId === app.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Check className="h-3 w-3" />
                    )}
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(app.id)}
                    disabled={processingId === app.id}
                    className="tap-target inline-flex items-center gap-1 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-red-600 active:scale-[0.97] disabled:opacity-50"
                  >
                    {processingId === app.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
