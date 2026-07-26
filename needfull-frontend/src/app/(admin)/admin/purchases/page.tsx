"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag, Loader2, ShieldCheck, AlertTriangle, DollarSign,
  CheckCircle2, Clock, XCircle, Search,
} from "lucide-react";
import { get } from "@/lib/apiClient";

interface PurchaseTaskRow {
  id: string;
  task_id: string;
  estimated_item_cost: number;
  runner_fee: number;
  platform_fee: number;
  total_escrow: number;
  receipt_amount: number | null;
  status: string;
  store_name: string | null;
  title: string;
  poster: { id: string; fullName: string };
  created_at: string;
}

interface EscrowStats {
  totalEscrowKobo: number;
  totalEscrowNaira: number;
  todayTransactions: number;
  completedPurchases: number;
  pendingDeliveries: number;
  pendingConfirmations: number;
  pendingBudgetApprovals: number;
  openDisputes: number;
  totalRefundedKobo: number;
  totalReleasedKobo: number;
}

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "funded", label: "Funded" },
  { value: "accepted", label: "Accepted" },
  { value: "shopping", label: "Shopping" },
  { value: "receipt_uploaded", label: "Receipt Uploaded" },
  { value: "needs_budget_approval", label: "Budget Needed" },
  { value: "heading_to_delivery", label: "In Transit" },
  { value: "delivered", label: "Delivered" },
  { value: "completed", label: "Completed" },
  { value: "disputed", label: "Disputed" },
  { value: "refunded", label: "Refunded" },
];

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

export default function AdminPurchasesPage() {
  const [stats, setStats] = useState<EscrowStats | null>(null);
  const [tasks, setTasks] = useState<PurchaseTaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  async function fetchData() {
    setLoading(true);
    try {
      const [statsRes, tasksRes] = await Promise.all([
        get<{ success: boolean; data: EscrowStats }>("/purchase/admin/stats"),
        get<{ success: boolean; data: PurchaseTaskRow[] }>(
          `/purchase/admin/tasks${statusFilter ? `?status=${statusFilter}` : ""}`,
        ),
      ]);
      if (statsRes.success) setStats(statsRes.data);
      if (tasksRes.success) setTasks(tasksRes.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Escrow Management</h1>
        <button
          onClick={fetchData}
          className="rounded-xl bg-brand px-4 py-2 text-xs font-bold text-white"
        >
          Refresh
        </button>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<ShieldCheck className="h-4 w-4 text-brand" />}
            label="Total in Escrow"
            value={`₦${stats.totalEscrowNaira.toLocaleString()}`}
            bg="bg-brand-light/30"
          />
          <StatCard
            icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
            label="Completed"
            value={String(stats.completedPurchases)}
            bg="bg-green-50"
          />
          <StatCard
            icon={<Clock className="h-4 w-4 text-orange-600" />}
            label="Pending Delivery"
            value={String(stats.pendingDeliveries)}
            bg="bg-orange-50"
          />
          <StatCard
            icon={<AlertTriangle className="h-4 w-4 text-red-600" />}
            label="Disputes"
            value={String(stats.openDisputes)}
            bg="bg-red-50"
          />
          <StatCard
            icon={<DollarSign className="h-4 w-4 text-amber-600" />}
            label="Budget Approvals"
            value={String(stats.pendingBudgetApprovals)}
            bg="bg-amber-50"
          />
          <StatCard
            icon={<ShoppingBag className="h-4 w-4 text-blue-600" />}
            label="Today's Activity"
            value={String(stats.todayTransactions)}
            bg="bg-blue-50"
          />
        </div>
      )}

      {/* Status filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              statusFilter === f.value
                ? "bg-brand text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Purchase tasks list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-2xl bg-surface p-8 text-center border border-card-border">
          <ShoppingBag className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">No purchase tasks found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <Link
              key={task.id}
              href={`/admin/purchases/${task.task_id}`}
              className="block rounded-xl bg-surface p-4 border border-card-border hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {task.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {task.poster.fullName}
                    {task.store_name && ` · ${task.store_name}`}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    STATUS_COLORS[task.status] || "bg-gray-100 text-gray-600"
                  }`}
                >
                  {task.status.replace(/_/g, " ")}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <span>₦{(task.total_escrow / 100).toLocaleString()}</span>
                <span>{new Date(task.created_at).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon, label, value, bg,
}: {
  icon: React.ReactNode; label: string; value: string; bg: string;
}) {
  return (
    <div className={`rounded-xl ${bg} p-3`}>
      <div className="flex items-center gap-1.5 mb-1">{icon}<span className="text-[10px] font-medium text-gray-600">{label}</span></div>
      <p className="text-base font-bold text-gray-900">{value}</p>
    </div>
  );
}
