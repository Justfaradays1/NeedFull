// WHAT: Admin transactions page — view all platform wallet transactions
// WHY: Admins need to audit financial activity across the platform
// FUTURE: Add export CSV, add date range picker, add transaction search

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ListChecks, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthInit, useIsAuthenticated, useIsAdmin } from "@/store";
import apiClient from "@/lib/apiClient";

interface Tx {
  id: string;
  type: string;
  amount: { kobo: number; naira: number };
  balanceBefore: { kobo: number; naira: number };
  balanceAfter: { kobo: number; naira: number };
  reference: string | null;
  taskId: string | null;
  note: string | null;
  createdAt: string;
}

export default function AdminTransactionsPage() {
  const router = useRouter();
  useAuthInit();
  const isAuthenticated = useIsAuthenticated();
  const isAdmin = useIsAdmin();

  const [txns, setTxns] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTxns = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), perPage: "20" });
      if (typeFilter !== "all") params.set("type", typeFilter);
      const res = await apiClient.get(`/admin/transactions?${params}`);
      setTxns(res.data?.data ?? []);
      setTotalPages(res.data?.pagination?.totalPages ?? 1);
    } catch {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) fetchTxns();
    else if (isAuthenticated && !isAdmin) router.push("/feed");
  }, [isAuthenticated, isAdmin, router, fetchTxns]);

  const types = ["all", "deposit", "withdrawal", "escrow_lock", "escrow_release", "earnings", "fee", "refund"];

  const typeColors: Record<string, string> = {
    deposit: "bg-green-100 text-green-800",
    withdrawal: "bg-red-100 text-red-800",
    escrow_lock: "bg-amber-100 text-amber-800",
    escrow_release: "bg-blue-100 text-blue-800",
    earnings: "bg-green-100 text-green-800",
    fee: "bg-purple-100 text-purple-800",
    refund: "bg-gray-100 text-gray-800",
    platform_fee: "bg-purple-100 text-purple-800",
    card_deposit: "bg-green-100 text-green-800",
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="tap-target rounded-lg p-2 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Transactions</h1>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto px-4 py-3">
        {types.map((t) => (
          <button key={t} onClick={() => { setTypeFilter(t); setPage(1); }} className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${typeFilter === t ? "bg-brand text-white" : "bg-gray-200 text-gray-600"}`}>
            {t === "escrow_lock" ? "Escrow Lock" : t === "escrow_release" ? "Escrow Release" : t === "platform_fee" ? "Fee" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="px-4 pb-6">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>
        ) : txns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <ListChecks className="mb-2 h-12 w-12" />
            <p className="text-sm">No transactions found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {txns.map((tx) => (
              <div key={tx.id} className="rounded-xl bg-white px-4 py-3 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${typeColors[tx.type] || "bg-gray-100 text-gray-600"}`}>
                      {tx.type.replace(/_/g, " ")}
                    </span>
                    <p className="mt-1 text-xs text-gray-500">{tx.note || "—"}</p>
                    {tx.reference && <p className="text-[10px] text-gray-400">Ref: {tx.reference}</p>}
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${tx.amount.kobo > 0 ? "text-green-600" : "text-red-600"}`}>
                      {tx.amount.kobo > 0 ? "+" : ""}₦{tx.amount.naira.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-lg bg-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 disabled:opacity-30">Previous</button>
              <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg bg-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 disabled:opacity-30">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
