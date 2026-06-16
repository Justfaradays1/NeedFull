// WHAT: Admin withdrawals page — view and process withdrawal requests
// WHY: Admins need to monitor and manage withdrawal payouts
// FUTURE: Add bulk processing, add transfer status tracking

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthInit, useIsAuthenticated, useIsAdmin } from "@/store";
import apiClient from "@/lib/apiClient";

interface Withdrawal {
  id: string;
  amount: { kobo: number; naira: number };
  fee: { kobo: number; naira: number };
  accountNumber: string;
  bankName: string;
  accountName: string;
  status: string;
  createdAt: string;
  user?: { id: string; fullName: string; email: string };
}

export default function AdminWithdrawalsPage() {
  const router = useRouter();
  useAuthInit();
  const isAuthenticated = useIsAuthenticated();
  const isAdmin = useIsAdmin();

  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"pending" | "all">("pending");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchWithdrawals = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter === "pending" ? "?status=pending" : "";
      const res = await apiClient.get(`/admin/withdrawals${params}`);
      setWithdrawals(res.data?.data ?? []);
    } catch {
      toast.error("Failed to load withdrawals");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) fetchWithdrawals();
    else if (isAuthenticated && !isAdmin) router.push("/feed");
  }, [isAuthenticated, isAdmin, router, fetchWithdrawals]);

  const handleProcess = async (id: string) => {
    setProcessingId(id);
    try {
      await apiClient.post(`/admin/withdrawals/${id}/process`);
      toast.success("Withdrawal marked as processed");
      fetchWithdrawals();
    } catch {
      toast.error("Failed to process withdrawal");
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
          <h1 className="text-lg font-bold text-gray-900">Withdrawals</h1>
        </div>
      </header>

      <div className="flex gap-2 px-4 py-3">
        {(["pending", "all"] as const).map((f) => (
          <button key={f} onClick={() => setStatusFilter(f)} className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${statusFilter === f ? "bg-brand text-white" : "bg-gray-200 text-gray-600"}`}>
            {f === "pending" ? "Pending" : "All"}
          </button>
        ))}
      </div>

      <div className="px-4 pb-6">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>
        ) : withdrawals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Clock className="mb-2 h-12 w-12" />
            <p className="text-sm">No withdrawals found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((w) => (
              <div key={w.id} className="rounded-xl bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{w.user?.fullName ?? "Unknown"}</p>
                    <p className="text-xs text-gray-500">{w.user?.email}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${w.status === "pending" ? "bg-amber-100 text-amber-800" : w.status === "processed" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {w.status}
                  </span>
                </div>
                <div className="mb-2 grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div><span className="font-medium">Amount:</span> ₦{w.amount.naira.toLocaleString()}</div>
                  <div><span className="font-medium">Fee:</span> ₦{w.fee.naira.toLocaleString()}</div>
                  <div><span className="font-medium">Bank:</span> {w.bankName}</div>
                  <div><span className="font-medium">Account:</span> {w.accountNumber}</div>
                  <div className="col-span-2"><span className="font-medium">Name:</span> {w.accountName}</div>
                </div>
                <p className="mb-3 text-xs text-gray-400">Requested {new Date(w.createdAt).toLocaleDateString()}</p>
                {w.status === "pending" && (
                  <button onClick={() => handleProcess(w.id)} disabled={processingId === w.id} className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                    {processingId === w.id ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Mark as Processed"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
