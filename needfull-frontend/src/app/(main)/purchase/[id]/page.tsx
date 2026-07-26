"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, MapPin, Clock, DollarSign, Loader2,
  ShieldCheck, CheckCircle2, Upload, KeyRound, MessageCircle,
  AlertTriangle, XCircle, Camera, FileImage, ShoppingBag,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthInit, useIsAuthenticated, useAuthUser } from "@/store";
import apiClient from "@/lib/apiClient";
import PurchaseWorkflowTimeline, { WORKFLOW_STEPS } from "@/components/tasks/PurchaseWorkflowTimeline";
import { PurchaseDetailSkeleton } from "@/components/ui/skeletons/PurchaseDetailSkeleton";

interface PurchaseDetail {
  task: {
    id: string; title: string; description: string; status: string;
    budget_kobo: number; is_purchase: boolean; created_at: string; updated_at: string;
    poster: { id: string; fullName: string; email: string };
    runner?: { id: string; fullName: string; email: string } | null;
  };
  purchase: {
    id: string; task_id: string; estimated_item_cost: number; runner_fee: number;
    platform_fee: number; max_additional_spending: number; total_escrow: number;
    store_name: string | null; receipt_url: string | null;
    receipt_amount: number | null; receipt_notes: string | null;
    receipt_uploaded_at: string | null;
    delivery_otp: string | null; otp_generated_at: string | null;
    otp_verified_at: string | null;
    status: string; created_at: string; updated_at: string;
  };
  budgetApprovals: any[];
  disputes: any[];
  auditLogs: any[];
  walletMovements: any[];
}

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Pending Payment",
  funded: "Funded",
  accepted: "Accepted",
  at_store: "At Store",
  shopping: "Shopping",
  receipt_uploaded: "Receipt Uploaded",
  needs_budget_approval: "Budget Approval Needed",
  heading_to_delivery: "Heading to Delivery",
  delivered: "Delivered",
  confirmed: "Confirmed",
  completed: "Completed",
  disputed: "Disputed",
  refunded: "Refunded",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  pending_payment: "bg-gray-200 text-gray-600",
  funded: "bg-green-100 text-green-800",
  accepted: "bg-blue-100 text-blue-800",
  at_store: "bg-purple-100 text-purple-800",
  shopping: "bg-indigo-100 text-indigo-800",
  receipt_uploaded: "bg-teal-100 text-teal-800",
  needs_budget_approval: "bg-amber-100 text-amber-800",
  heading_to_delivery: "bg-orange-100 text-orange-800",
  delivered: "bg-cyan-100 text-cyan-800",
  completed: "bg-green-100 text-green-800",
  disputed: "bg-red-100 text-red-800",
  refunded: "bg-gray-200 text-gray-600",
  cancelled: "bg-gray-200 text-gray-500",
};

export default function PurchaseTaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  useAuthInit();
  const isAuthenticated = useIsAuthenticated();
  const user = useAuthUser();

  const [detail, setDetail] = useState<PurchaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [runnerOTP, setRunnerOTP] = useState("");
  const [showRunnerOTP, setShowRunnerOTP] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptAmount, setReceiptAmount] = useState("");
  const [receiptNotes, setReceiptNotes] = useState("");
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeDescription, setDisputeDescription] = useState("");

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchDetail();
  }, [isAuthenticated, taskId]);

  async function fetchDetail() {
    try {
      const res = await apiClient.get(`/purchase/admin/tasks/${taskId}`);
      setDetail(res.data?.data ?? null);
    } catch {
      toast.error("Failed to load purchase task");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus(status: string) {
    setActionLoading(status);
    try {
      await apiClient.patch(`/purchase/${taskId}/status`, { status });
      toast.success("Status updated");
      fetchDetail();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleUploadReceipt() {
    if (!receiptFile || !receiptAmount) {
      toast.error("Receipt image and amount are required");
      return;
    }
    setActionLoading("receipt");
    try {
      const formData = new FormData();
      formData.append("receipt", receiptFile);
      formData.append("receiptAmountNaira", receiptAmount);
      if (receiptNotes) formData.append("notes", receiptNotes);
      await apiClient.post(`/purchase/${taskId}/receipt`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Receipt uploaded");
      setReceiptFile(null);
      setReceiptAmount("");
      setReceiptNotes("");
      fetchDetail();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to upload receipt");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleGenerateOTP() {
    setActionLoading("otp");
    try {
      const res = await apiClient.post(`/purchase/${taskId}/generate-otp`);
      setRunnerOTP(res.data?.data?.otp || "");
      toast.success("OTP generated! Share with poster on arrival.");
      fetchDetail();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to generate OTP");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleVerifyOTP() {
    if (!showRunnerOTP || showRunnerOTP.length !== 6) {
      toast.error("Enter the 6-digit OTP from the poster");
      return;
    }
    setActionLoading("verify");
    try {
      await apiClient.post(`/purchase/${taskId}/verify-otp`, { otp: showRunnerOTP });
      toast.success("Delivery verified!");
      setShowRunnerOTP("");
      fetchDetail();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Invalid OTP");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleConfirmDelivery() {
    setActionLoading("confirm");
    try {
      await apiClient.post(`/purchase/${taskId}/confirm`);
      toast.success("Delivery confirmed! Payment released.");
      fetchDetail();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to confirm");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleOpenDispute() {
    if (!disputeReason || disputeReason.length < 10) {
      toast.error("Describe the issue (at least 10 characters)");
      return;
    }
    setActionLoading("dispute");
    try {
      await apiClient.post(`/purchase/${taskId}/dispute`, {
        reason: disputeReason,
        description: disputeDescription,
      });
      toast.success("Dispute opened. Admin will review.");
      setShowDisputeForm(false);
      setDisputeReason("");
      setDisputeDescription("");
      fetchDetail();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to open dispute");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleApproveBudget(approvalId: string) {
    setActionLoading(`approve-${approvalId}`);
    try {
      await apiClient.post(`/purchase/approvals/${approvalId}/approve`);
      toast.success("Budget approved");
      fetchDetail();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to approve");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRejectBudget(approvalId: string) {
    setActionLoading(`reject-${approvalId}`);
    try {
      await apiClient.post(`/purchase/approvals/${approvalId}/reject`);
      toast.success("Budget rejected — discuss with runner");
      fetchDetail();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to reject");
    } finally {
      setActionLoading(null);
    }
  }

  const posterActions = () => {
    if (!detail || !user || user.id !== detail.task.poster.id) return null;
    const s = detail.purchase.status;

    return (
      <div className="space-y-2">
        {s === "delivered" && (
          <button
            onClick={handleConfirmDelivery}
            disabled={actionLoading === "confirm"}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {actionLoading === "confirm" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Confirm Delivery & Release Payment
          </button>
        )}

        {detail.purchase.status === "needs_budget_approval" && detail.budgetApprovals.filter((a: any) => a.status === "pending").length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Budget Approval Needed</p>
                <p className="text-xs text-amber-700 mt-1">
                  The purchase total exceeded your approved budget. Review the request below.
                </p>
              </div>
            </div>
            {detail.budgetApprovals.filter((a: any) => a.status === "pending").map((approval: any) => (
              <div key={approval.id} className="rounded-lg bg-white p-3 space-y-2">
                <p className="text-sm">
                  <span className="font-semibold">Excess Amount: </span>
                  ₦{(approval.excess_amount / 100).toLocaleString()}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Receipt Total: </span>
                  ₦{(approval.actual_receipt_amount / 100).toLocaleString()}
                </p>
                {approval.reason && (
                  <p className="text-xs text-gray-500">{approval.reason}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproveBudget(approval.id)}
                    disabled={actionLoading === `approve-${approval.id}`}
                    className="flex-1 rounded-lg bg-brand py-2 text-xs font-bold text-white disabled:opacity-50"
                  >
                    {actionLoading === `approve-${approval.id}` ? (
                      <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                    ) : (
                      "Approve & Continue"
                    )}
                  </button>
                  <button
                    onClick={() => handleRejectBudget(approval.id)}
                    disabled={actionLoading === `reject-${approval.id}`}
                    className="flex-1 rounded-lg border border-gray-400 py-2 text-xs font-medium text-gray-600 disabled:opacity-50"
                  >
                    Request Adjustment
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {s !== "completed" && s !== "cancelled" && s !== "refunded" && s !== "pending_payment" && (
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/chat/${taskId}`)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-200 py-3 text-sm font-semibold text-gray-700"
            >
              <MessageCircle className="h-4 w-4" />
              Chat with Runner
            </button>
            {!showDisputeForm && s !== "disputed" && (
              <button
                onClick={() => setShowDisputeForm(true)}
                className="flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-medium text-red-600"
              >
                <AlertTriangle className="h-4 w-4" />
                Report Issue
              </button>
            )}
          </div>
        )}

        {showDisputeForm && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
            <p className="text-sm font-semibold text-red-800">Report an Issue</p>
            <textarea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Describe the issue with this delivery..."
              className="w-full rounded-lg border border-red-200 p-3 text-xs focus:border-red-400 focus:outline-none"
              rows={3}
            />
            <textarea
              value={disputeDescription}
              onChange={(e) => setDisputeDescription(e.target.value)}
              placeholder="Additional details (optional)"
              className="w-full rounded-lg border border-red-200 p-3 text-xs focus:border-red-400 focus:outline-none"
              rows={2}
            />
            <div className="flex gap-2">
              <button
                onClick={handleOpenDispute}
                disabled={actionLoading === "dispute"}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-xs font-bold text-white disabled:opacity-50"
              >
                {actionLoading === "dispute" ? (
                  <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                ) : (
                  "Open Dispute"
                )}
              </button>
              <button
                onClick={() => setShowDisputeForm(false)}
                className="rounded-lg border border-gray-400 px-4 py-2.5 text-xs font-medium text-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const runnerActions = () => {
    if (!detail || !user || user.id !== detail.task.runner?.id) return null;
    const s = detail.purchase.status;

    return (
      <div className="space-y-3">
        {s === "accepted" && (
          <button
            onClick={() => handleUpdateStatus("at_store")}
            disabled={actionLoading === "at_store"}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {actionLoading === "at_store" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
            I&apos;m at the Store
          </button>
        )}

        {s === "at_store" && (
          <button
            onClick={() => handleUpdateStatus("shopping")}
            disabled={actionLoading === "shopping"}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {actionLoading === "shopping" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShoppingBag className="h-4 w-4" />
            )}
            Start Shopping
          </button>
        )}

        {s === "shopping" && (
          <div className="rounded-xl border border-card-border bg-surface p-4 space-y-3">
            <p className="text-sm font-bold text-gray-900">Upload Receipt</p>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Receipt Image
              </label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-400 p-4 hover:border-brand">
                {receiptFile ? (
                  <>
                    <FileImage className="h-5 w-5 text-brand" />
                    <span className="text-xs text-gray-600">{receiptFile.name}</span>
                  </>
                ) : (
                  <>
                    <Camera className="h-5 w-5 text-gray-400" />
                    <span className="text-xs text-gray-500">Tap to upload receipt photo</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Receipt Total (₦)
              </label>
              <input
                type="number"
                value={receiptAmount}
                onChange={(e) => setReceiptAmount(e.target.value)}
                placeholder="e.g. 4650"
                className="w-full rounded-lg border border-gray-400 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Notes (optional)
              </label>
              <input
                type="text"
                value={receiptNotes}
                onChange={(e) => setReceiptNotes(e.target.value)}
                placeholder="Any notes about the purchase..."
                className="w-full rounded-lg border border-gray-400 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <button
              onClick={handleUploadReceipt}
              disabled={actionLoading === "receipt" || !receiptFile || !receiptAmount}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {actionLoading === "receipt" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Upload Receipt
            </button>
          </div>
        )}

        {(s === "receipt_uploaded" || s === "needs_budget_approval") && (
          <>
            <button
              onClick={handleGenerateOTP}
              disabled={actionLoading === "otp"}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {actionLoading === "otp" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              {s === "needs_budget_approval" ? "Waiting for Budget Approval..." : "Generate Delivery OTP / Heading to Delivery"}
            </button>
          </>
        )}

        {runnerOTP && (
          <div className="rounded-xl border-2 border-gold bg-amber-50 p-4 text-center">
            <p className="text-xs text-amber-700 mb-1">Delivery OTP</p>
            <p className="text-2xl font-bold tracking-widest text-amber-900">{runnerOTP}</p>
            <p className="text-xs text-amber-600 mt-1">
              Share this code with the poster when you arrive
            </p>
          </div>
        )}

        {s === "heading_to_delivery" && (
          <div className="rounded-xl border border-card-border bg-surface p-4 space-y-3">
            <p className="text-sm font-bold text-gray-900">Enter Delivery OTP</p>
            <p className="text-xs text-gray-500">
              Ask the poster for the 6-digit OTP displayed in their app.
            </p>
            <input
              type="text"
              value={showRunnerOTP}
              onChange={(e) => setShowRunnerOTP(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              className="w-full rounded-lg border border-gray-400 px-4 py-3 text-center text-lg font-bold tracking-widest focus:border-brand focus:outline-none"
            />
            <button
              onClick={handleVerifyOTP}
              disabled={actionLoading === "verify" || showRunnerOTP.length !== 6}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {actionLoading === "verify" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Confirm Delivery
            </button>
          </div>
        )}

        {s !== "completed" && s !== "cancelled" && s !== "refunded" && s !== "disputed" && s !== "pending_payment" && (
          <button
            onClick={() => router.push(`/chat/${taskId}`)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-200 py-3 text-sm font-semibold text-gray-700"
          >
            <MessageCircle className="h-4 w-4" />
            Chat with Poster
          </button>
        )}
      </div>
    );
  };

  const escrowBanner = () => {
    if (!detail) return null;
    const s = detail.purchase.status;
    if (s === "completed") {
      return (
        <div className="rounded-xl bg-green-50 p-4 text-center border border-green-200">
          <CheckCircle2 className="mx-auto mb-1 h-6 w-6 text-green-600" />
          <p className="text-sm font-bold text-green-800">Payment Released</p>
          <p className="text-xs text-green-600">Funds have been distributed.</p>
        </div>
      );
    }
    if (s === "disputed") {
      return (
        <div className="rounded-xl bg-red-50 p-4 text-center border border-red-200">
          <AlertTriangle className="mx-auto mb-1 h-6 w-6 text-red-600" />
          <p className="text-sm font-bold text-red-800">Payment on Hold</p>
          <p className="text-xs text-red-600">Awaiting admin review.</p>
        </div>
      );
    }
    if (s === "refunded") {
      return (
        <div className="rounded-xl bg-gray-200 p-4 text-center border border-gray-200">
          <XCircle className="mx-auto mb-1 h-6 w-6 text-gray-400" />
          <p className="text-sm font-bold text-gray-700">Funds Refunded</p>
          <p className="text-xs text-gray-500">Money returned to your wallet.</p>
        </div>
      );
    }
    return (
      <div className="rounded-xl bg-brand-light/30 p-4 border border-brand/20">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-brand" />
          <div>
            <p className="text-sm font-bold text-brand">Payment Secured by NeedFull</p>
            <p className="text-xs text-gray-600 mt-1">
              ₦{(detail.purchase.total_escrow / 100).toLocaleString()} locked in escrow.
              Funds released only after successful delivery.
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (!isAuthenticated) return null;

  if (loading) {
    return <PurchaseDetailSkeleton />;
  }

  if (!detail) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center page-shell px-4 text-center">
        <AlertTriangle className="mb-3 h-12 w-12 text-gray-400" />
        <h2 className="text-lg font-semibold text-gray-900">Purchase task not found</h2>
        <button onClick={() => router.push("/tasks")} className="mt-4 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white">
          My Tasks
        </button>
      </div>
    );
  }

  const isPoster = user?.id === detail.task.poster.id;
  const isRunner = user?.id === detail.task.runner?.id;
  const s = detail.purchase.status;

  return (
    <div className="min-h-screen page-shell">
      <div className="sticky top-0 z-10 bg-surface px-4 py-3 shadow-sm border-b border-card-border">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="tap-target rounded-lg p-2 hover:bg-gray-200">
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 truncate">{detail.task.title}</h1>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Status badge */}
        <div className="flex items-center justify-between">
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_COLORS[s] || "bg-gray-200 text-gray-600"}`}>
            {STATUS_LABELS[s] || s}
          </span>
          {detail.purchase.store_name && (
            <span className="text-xs text-gray-500">Store: {detail.purchase.store_name}</span>
          )}
        </div>

        {/* Escrow/Status Banner */}
        {escrowBanner()}

        {/* Workflow Timeline */}
        <div className="rounded-2xl bg-surface p-4 shadow-sm border border-card-border">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Progress</h3>
          <PurchaseWorkflowTimeline status={s} />
        </div>

        {/* Task Info */}
        <div className="rounded-2xl bg-surface p-4 shadow-sm border border-card-border space-y-3">
          <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">{detail.task.description}</p>

          <div className="space-y-2 text-sm text-gray-600">
            <BudgetRow label="Estimated Item Cost" amountKobo={detail.purchase.estimated_item_cost} />
            <BudgetRow label="Runner Fee" amountKobo={detail.purchase.runner_fee} />
            <BudgetRow label="Platform Fee" amountKobo={detail.purchase.platform_fee} accent />
            <hr className="border-gray-100" />
            <BudgetRow label="Total Escrow" amountKobo={detail.purchase.total_escrow} bold />
          </div>

          {detail.purchase.receipt_amount && (
            <>
              <hr className="border-gray-100" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500">ACTUAL RECEIPT</p>
                <BudgetRow label="Receipt Amount" amountKobo={detail.purchase.receipt_amount} highlight />
                {detail.purchase.receipt_url && (
                  <a
                    href={detail.purchase.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-brand underline"
                  >
                    <FileImage className="h-3 w-3" />
                    View Receipt
                  </a>
                )}
                {detail.purchase.receipt_notes && (
                  <p className="text-xs text-gray-500 italic">{detail.purchase.receipt_notes}</p>
                )}
              </div>
            </>
          )}

          {detail.purchase.max_additional_spending > 0 && (
            <div className="text-xs text-gray-500">
              Spending buffer: ₦{(detail.purchase.max_additional_spending / 100).toLocaleString()}
            </div>
          )}
        </div>

        {/* People */}
        <div className="rounded-2xl bg-surface p-4 shadow-sm border border-card-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">
              {detail.task.poster.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {isPoster ? "You (Poster)" : detail.task.poster.fullName}
              </p>
              <p className="text-xs text-gray-500">Poster</p>
            </div>
          </div>
          {detail.task.runner && (
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber/10 text-sm font-bold text-amber">
                {detail.task.runner.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {isRunner ? "You (Runner)" : detail.task.runner.fullName}
                </p>
                <p className="text-xs text-gray-500">Runner</p>
              </div>
            </div>
          )}
        </div>

        {/* Dispute info */}
        {detail.disputes.length > 0 && !showDisputeForm && (
          <div className="rounded-xl bg-red-50 p-3 border border-red-200">
            <p className="text-xs font-semibold text-red-800">
              Dispute #{detail.disputes[0].status}
            </p>
            <p className="text-xs text-red-600 mt-1">{detail.disputes[0].reason}</p>
          </div>
        )}

        {/* Actions */}
        {isPoster && posterActions()}
        {isRunner && runnerActions()}

        {!isPoster && !isRunner && (
          <div className="rounded-xl bg-gray-200 p-4 text-center text-sm text-gray-500">
            You are not part of this task.
          </div>
        )}
      </div>
    </div>
  );
}

function BudgetRow({ label, amountKobo, accent, bold, highlight }: {
  label: string; amountKobo: number; accent?: boolean; bold?: boolean; highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${bold ? "font-bold text-gray-900" : "text-gray-600"}`}>{label}</span>
      <span className={`text-sm ${
        highlight ? "font-bold text-gold" : accent ? "font-medium text-brand" : bold ? "font-bold text-gray-900" : "font-semibold text-gray-900"
      }`}>
        ₦{(amountKobo / 100).toLocaleString()}
      </span>
    </div>
  );
}


