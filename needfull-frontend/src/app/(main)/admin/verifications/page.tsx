"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Shield, Check, X, AlertTriangle, Loader2,
  Search, ZoomIn, Maximize2, Minimize2, ChevronDown, ChevronUp,
  BookOpen,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthInit, useIsAuthenticated, useIsAdmin } from "@/store";
import apiClient from "@/lib/apiClient";

interface Verification {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  school?: string;
  department?: string;
  matricNumber?: string;
  idUrl: string;
  status: string;
  note: string | null;
  createdAt: string;
}

type FilterTab = "pending" | "approved" | "rejected";

const GUIDELINES = [
  "Photo is clear and readable (not blurry or pixelated)",
  "It's a valid student ID card from a Nigerian university",
  "Name on the ID matches the user's NeedFull profile name",
  "Card is not expired, defaced, or tampered with",
  "Matric number (if visible) is valid and legible",
];

export default function AdminVerificationsPage() {
  const router = useRouter();
  useAuthInit();
  const isAuthenticated = useIsAuthenticated();
  const isAdmin = useIsAdmin();

  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>("pending");
  const [showGuidelines, setShowGuidelines] = useState(true);

  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const fetchVerifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/admin/verifications");
      setVerifications(res.data?.data ?? res.data ?? []);
    } catch {
      toast.error("Failed to load verifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && isAdmin) fetchVerifications();
    else if (isAuthenticated && !isAdmin) router.push("/feed");
  }, [isAuthenticated, isAdmin, router, fetchVerifications]);

  const filtered = verifications.filter((v) => v.status === filter);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      await apiClient.post(`/admin/verifications/${id}`, { action: "approve" });
      toast.success("Verification approved — student badge added");
      fetchVerifications();
    } catch {
      toast.error("Failed to approve verification");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectId || !rejectNote.trim()) return;
    setProcessingId(rejectId);
    try {
      await apiClient.post(`/admin/verifications/${rejectId}`, {
        action: "reject",
        note: rejectNote.trim(),
      });
      toast.success("Verification rejected");
      setRejectId(null);
      setRejectNote("");
      fetchVerifications();
    } catch {
      toast.error("Failed to reject verification");
    } finally {
      setProcessingId(null);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="tap-target rounded-lg p-2 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Student ID Verifications</h1>
        </div>
      </header>

      <div className="px-4 py-4">
        {/* Guidelines panel */}
        <div className="mb-4 overflow-hidden rounded-xl border border-amber-200 bg-amber-50">
          <button
            onClick={() => setShowGuidelines(!showGuidelines)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-amber-800"
          >
            <span className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Review Guidelines
            </span>
            {showGuidelines ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showGuidelines && (
            <div className="border-t border-amber-200 px-4 py-3">
              <p className="mb-2 text-xs font-semibold text-amber-700">Check the following before approving:</p>
              <ul className="space-y-1">
                {GUIDELINES.map((g, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-amber-800">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                    {g}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Filter tabs */}
        <div className="mb-4 flex gap-2">
          {(["pending", "approved", "rejected"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-colors ${
                filter === tab
                  ? tab === "pending"
                    ? "bg-amber-100 text-amber-800"
                    : tab === "approved"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Shield className="mb-2 h-12 w-12" />
            <p className="text-sm">No {filter} verifications</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((v) => (
              <div key={v.id} className="rounded-xl bg-white p-4 shadow-sm">
                {/* User info */}
                <div className="mb-3 flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900">{v.fullName}</p>
                    <p className="text-xs text-gray-500">{v.email}</p>
                    {(v.school || v.department) && (
                      <p className="mt-0.5 text-xs text-gray-400">
                        {[v.school, v.department].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    {v.matricNumber && (
                      <p className="mt-0.5 text-xs text-gray-400">Matric: {v.matricNumber}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-400">
                      Submitted {new Date(v.createdAt).toLocaleDateString("en-NG", {
                        day: "numeric", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    v.status === "pending" ? "bg-amber-100 text-amber-800"
                    : v.status === "approved" ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                  }`}>
                    {v.status}
                  </span>
                </div>

                {/* ID card photo */}
                {v.idUrl && (
                  <div className="mb-3">
                    <div
                      onClick={() => setZoomImage(v.idUrl)}
                      className="relative cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-gray-100 transition-colors hover:border-brand"
                    >
                      <img src={v.idUrl} alt="Student ID card" className="max-h-56 w-full object-contain" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity hover:opacity-100">
                        <div className="flex items-center gap-1 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white">
                          <ZoomIn className="h-3.5 w-3.5" /> Tap to zoom
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rejection note */}
                {v.status === "rejected" && v.note && (
                  <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                    <span className="font-semibold">Reason: </span>{v.note}
                  </div>
                )}

                {/* Action buttons */}
                {v.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(v.id)}
                      disabled={processingId === v.id}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                    >
                      {processingId === v.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Approve
                    </button>
                    <button
                      onClick={() => { setRejectId(v.id); setRejectNote(""); }}
                      disabled={processingId === v.id}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                    >
                      {processingId === v.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject modal */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
              <h3 className="font-semibold text-gray-900">Reject Verification</h3>
            </div>
            <p className="mb-3 text-xs text-gray-500">
              Tell the user why their ID was rejected so they can fix it and resubmit.
            </p>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="e.g. Image is blurry, please resubmit with a clearer photo"
              className="mb-4 w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              rows={3}
              autoFocus
            />
            {rejectNote.trim().length > 0 && rejectNote.trim().length < 10 && (
              <p className="-mt-3 mb-3 text-xs text-red-500">Please provide a detailed reason (at least 10 characters)</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => { setRejectId(null); setRejectNote(""); }}
                className="flex-1 rounded-xl bg-gray-100 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectNote.trim() || rejectNote.trim().length < 10 || processingId === rejectId}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {processingId === rejectId ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image zoom modal */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setZoomImage(null)}
        >
          <button
            onClick={() => setZoomImage(null)}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/20 p-2 text-white transition-colors hover:bg-white/40"
          >
            <Minimize2 className="h-5 w-5" />
          </button>
          <img
            src={zoomImage}
            alt="Student ID card (zoomed)"
            className="max-h-[90vh] max-w-full rounded-lg object-contain shadow-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
