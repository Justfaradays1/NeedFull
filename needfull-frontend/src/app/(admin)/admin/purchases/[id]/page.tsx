"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, ShieldCheck, AlertTriangle, CheckCircle2,
  FileImage, User, Clock, DollarSign, MessageCircle, XCircle,
  Send, Eye,
} from "lucide-react";
import toast from "react-hot-toast";
import { get, post } from "@/lib/apiClient";
import PurchaseWorkflowTimeline from "@/components/tasks/PurchaseWorkflowTimeline";

interface PurchaseDetail {
  task: any;
  purchase: any;
  budgetApprovals: any[];
  disputes: any[];
  auditLogs: any[];
  walletMovements: any[];
}

const STATUS_COLORS: Record<string, string> = {
  pending_payment: "bg-gray-100 text-gray-600",
  funded: "bg-blue-100 text-blue-800",
  accepted: "bg-indigo-100 text-indigo-800",
  at_store: "bg-purple-100 text-purple-800",
  shopping: "bg-purple-100 text-purple-800",
  receipt_uploaded: "bg-teal-100 text-teal-800",
  needs_budget_approval: "bg-amber-100 text-amber-800",
  heading_to_delivery: "bg-orange-100 text-orange-800",
  delivered: "bg-cyan-100 text-cyan-800",
  completed: "bg-green-100 text-green-800",
  disputed: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-600",
  cancelled: "bg-gray-100 text-gray-500",
};

export default function AdminPurchaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  const [detail, setDetail] = useState<PurchaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [resolution, setResolution] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    fetchDetail();
  }, [taskId]);

  async function fetchDetail() {
    try {
      const res = await get<{ success: boolean; data: PurchaseDetail }>(
        `/purchase/admin/tasks/${taskId}`,
      );
      if (res.success) setDetail(res.data);
    } catch {
      toast.error("Failed to load purchase detail");
    } finally {
      setLoading(false);
    }
  }

  async function handleResolveDispute(disputeId: string) {
    if (!resolution) {
      toast.error("Select a resolution");
      return;
    }
    setActionLoading("resolve");
    try {
      await post(`/purchase/admin/disputes/${disputeId}/resolve`, {
        resolution,
        notes: adminNotes || undefined,
      });
      toast.success("Dispute resolved");
      setResolution("");
      setAdminNotes("");
      fetchDetail();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to resolve");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-text" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <p className="text-gray-500">Purchase task not found</p>
      </div>
    );
  }

  const p = detail.purchase;
  const t = detail.task;
  const s = p?.status || t?.status;

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Purchases
      </button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900 truncate">{t?.title || "Purchase Task"}</h1>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            STATUS_COLORS[s] || "bg-gray-100 text-gray-600"
          }`}
        >
          {s?.replace(/_/g, " ")}
        </span>
      </div>

      {/* Workflow Timeline */}
      {p && (
        <div className="rounded-2xl bg-surface p-4 border border-card-border">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Progress Timeline</h3>
          <PurchaseWorkflowTimeline status={p.status} />
        </div>
      )}

      {/* Task Info */}
      <div className="rounded-2xl bg-surface p-4 border border-card-border space-y-3">
        <h3 className="text-sm font-bold text-gray-900">Task Details</h3>
        {t?.description && (
          <p className="text-sm text-gray-700">{t.description}</p>
        )}

        {/* People */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand-text">
            {t?.poster?.fullName?.charAt(0) || "?"}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Poster: {t?.poster?.fullName || "Unknown"}
            </p>
            <p className="text-xs text-gray-500">{t?.poster?.email}</p>
          </div>
        </div>

        {t?.runner && (
          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber/10 text-sm font-bold text-amber">
              {t.runner.fullName?.charAt(0) || "?"}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Runner: {t.runner.fullName}
              </p>
              <p className="text-xs text-gray-500">{t.runner.email}</p>
            </div>
          </div>
        )}
      </div>

      {/* Budget Breakdown */}
      {p && (
        <div className="rounded-2xl bg-surface p-4 border border-card-border space-y-2">
          <h3 className="text-sm font-bold text-gray-900">Budget</h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Estimated Item Cost</span>
              <span className="font-semibold">₦{(p.estimated_item_cost / 100).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Runner Fee</span>
              <span className="font-semibold">₦{(p.runner_fee / 100).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Platform Fee</span>
              <span className="font-medium text-brand-text">₦{(p.platform_fee / 100).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Spending Buffer</span>
              <span className="font-medium">₦{(p.max_additional_spending / 100).toLocaleString()}</span>
            </div>
            <hr className="border-gray-100" />
            <div className="flex justify-between">
              <span className="font-bold text-gray-900">Total Escrow</span>
              <span className="font-bold text-gold">₦{(p.total_escrow / 100).toLocaleString()}</span>
            </div>
            {p.receipt_amount && (
              <>
                <hr className="border-gray-100" />
                <div className="flex justify-between">
                  <span className="text-gray-600">Actual Receipt</span>
                  <span className="font-bold text-gold">₦{(p.receipt_amount / 100).toLocaleString()}</span>
                </div>
              </>
            )}
          </div>
          {p.receipt_url && (
            <a
              href={p.receipt_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-brand-text underline"
            >
              <FileImage className="h-3 w-3" /> View Receipt
            </a>
          )}
          {p.store_name && (
            <p className="text-xs text-gray-500">Store: {p.store_name}</p>
          )}
        </div>
      )}

      {/* Disputes */}
      {detail.disputes.length > 0 && (
        <div className="rounded-2xl bg-surface p-4 border border-red-200 space-y-3">
          <h3 className="text-sm font-bold text-red-800 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" /> Disputes
          </h3>
          {detail.disputes.map((dispute: any) => (
            <div key={dispute.id} className="rounded-lg bg-red-50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-red-800">
                  {dispute.status} · by {dispute.opener?.fullName || "Unknown"}
                </p>
                <span className="text-[10px] text-gray-500">
                  {new Date(dispute.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-red-700">{dispute.reason}</p>
              {dispute.description && (
                <p className="text-xs text-gray-500">{dispute.description}</p>
              )}
              {dispute.status === "open" || dispute.status === "under_review" ? (
                <div className="space-y-2 pt-2 border-t border-red-200">
                  <p className="text-xs font-semibold text-gray-700">Resolve Dispute</p>
                  <div className="flex gap-2">
                    {["release_to_runner", "refund_poster", "split"].map((r) => (
                      <button
                        key={r}
                        onClick={() => setResolution(r)}
                        className={`rounded-lg px-3 py-1.5 text-[10px] font-semibold transition-colors ${
                          resolution === r
                            ? "bg-brand text-white"
                            : "bg-white border border-gray-300 text-gray-600"
                        }`}
                      >
                        {r.replace(/_/g, " ")}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Internal notes..."
                    className="w-full rounded-lg border border-gray-300 p-2 text-xs focus:border-brand focus:outline-none"
                    rows={2}
                  />
                  <button
                    onClick={() => handleResolveDispute(dispute.id)}
                    disabled={actionLoading === "resolve" || !resolution}
                    className="flex w-full items-center justify-center gap-1 rounded-lg bg-brand py-2 text-xs font-bold text-white disabled:opacity-50"
                  >
                    {actionLoading === "resolve" ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3" />
                    )}
                    Apply Resolution
                  </button>
                </div>
              ) : (
                <p className="text-xs font-medium text-green-700">
                  Resolved: {dispute.resolution?.replace(/_/g, " ")}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Budget Approvals */}
      {detail.budgetApprovals.length > 0 && (
        <div className="rounded-2xl bg-surface p-4 border border-amber-200 space-y-2">
          <h3 className="text-sm font-bold text-amber-800">Budget Approvals</h3>
          {detail.budgetApprovals.map((ba: any) => (
            <div key={ba.id} className="flex items-center justify-between rounded-lg bg-amber-50 p-2.5">
              <div>
                <p className="text-xs font-semibold text-amber-800">
                  Excess: ₦{(ba.excess_amount / 100).toLocaleString()}
                </p>
                <p className="text-[10px] text-amber-600">Status: {ba.status}</p>
              </div>
              <span className="text-[10px] text-gray-500">
                {new Date(ba.created_at).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Wallet Movements */}
      {detail.walletMovements.length > 0 && (
        <div className="rounded-2xl bg-surface p-4 border border-card-border space-y-2">
          <h3 className="text-sm font-bold text-gray-900">Wallet Movements</h3>
          {detail.walletMovements.map((wm: any) => (
            <div key={wm.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-2.5">
              <div>
                <p className="text-xs font-semibold text-gray-700">{wm.type}</p>
                <p className="text-[10px] text-gray-500">
                  {wm.user?.fullName} · {new Date(wm.created_at).toLocaleString()}
                </p>
              </div>
              <span className="text-xs font-bold text-gray-900">
                ₦{(wm.amount / 100).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Audit Logs */}
      {detail.auditLogs.length > 0 && (
        <div className="rounded-2xl bg-surface p-4 border border-card-border space-y-2">
          <h3 className="text-sm font-bold text-gray-900">Audit Log</h3>
          <div className="max-h-48 space-y-1 overflow-y-auto">
            {detail.auditLogs.map((log: any) => (
              <div key={log.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-2.5 py-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium text-gray-700">{log.action}</span>
                  {log.actor && (
                    <span className="text-[10px] text-gray-400">by {log.actor.fullName}</span>
                  )}
                </div>
                <span className="text-[10px] text-gray-400">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
