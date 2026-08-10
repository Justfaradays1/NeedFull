"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { get } from "@/lib/apiClient";
import { useAuthUser, useAuthStore, useActiveRole } from "@/store";
import { useAuthInit } from "@/hooks/useAuthInit";
import { useDashboardStore } from "@/store/dashboardStore";

import { WalletSummaryCard } from "@/components/dashboard/post/WalletSummaryCard";
import { QuickActions } from "@/components/dashboard/post/QuickActions";
import { BrowseCategories } from "@/components/dashboard/post/BrowseCategories";
import { PostTaskCTA } from "@/components/dashboard/post/PostTaskCTA";
import { ActiveTasksSection } from "@/components/dashboard/post/ActiveTasksSection";
import { RecentActivity } from "@/components/dashboard/post/RecentActivity";
import { DashboardSkeleton } from "@/components/dashboard/post/DashboardSkeleton";
import RunnerDashboard from "@/components/runner/RunnerDashboard";

/* ─── Types ─── */

interface TaskItem {
  id: string;
  title: string;
  budget: { kobo: number; naira: number };
  status: string;
  role?: string;
  isUrgent: boolean;
  createdAt: string;
  applicationCount: number;
  distance?: number | null;
  category: { id: string; name: string; icon: string } | null;
  poster: { id: string; fullName: string; trustScore?: number; avatarUrl?: string | null };
}

interface WalletTransaction {
  id: string;
  type: string;
  amount: { kobo: number; naira: number };
  createdAt: string;
}

/* ─── Main Page ─── */

export default function FeedPage() {
  const router = useRouter();
  const user = useAuthUser();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  useAuthInit();

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [allTasks, setAllTasks] = useState<TaskItem[]>([]);
  const [pageReady, setPageReady] = useState(false);
  const recentActivities = useDashboardStore((s) => s.recentActivities);
  const setRecentActivities = useDashboardStore((s) => s.setRecentActivities);

  const balanceKobo = user?.wallet?.balanceKobo ?? 0;
  const escrowKobo = user?.wallet?.escrowKobo ?? 0;
  const activeRoleFromHook = useActiveRole();
  const activeRole = (activeRoleFromHook || user?.activeRole) === "runner" ? "runner" : "poster";
  const firstName = user?.fullName?.split(" ")[0] || "there";
  const tasksCompleted = (user as any)?.totalTasksCompleted ?? 0;
  const trustScore = user?.trustScore ?? 0;
  const hasEarnings = transactions.some((t) =>
    ["escrow_release", "earnings"].includes(t.type)
  );
  const activeTasksCount = allTasks.filter((t) =>
    ["open", "matched", "accepted", "in_progress", "awaiting_confirmation"].includes(t.status)
  ).length;

  const fetchAll = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      let locationQuery = "";
      try {
        const raw = localStorage.getItem("nf_runner_location");
        if (raw) {
          const loc = JSON.parse(raw);
          if (loc && typeof loc.lat === "number" && typeof loc.lng === "number") {
            locationQuery = `&lat=${loc.lat}&lng=${loc.lng}&radiusKm=10`;
          }
        }
      } catch { /* no saved location — fetch without distance */ }
      const [
        openTasksRes,
        txRes,
        myTasksRes,
      ] = await Promise.all([
        get<{ success: boolean; data: TaskItem[] }>(`/tasks?sortBy=newest&status=open&perPage=6${locationQuery}`).catch(() => null),
        get<{ success: boolean; data: WalletTransaction[] }>("/wallet/transactions?perPage=10").catch(() => null),
        get<{ success: boolean; data: TaskItem[] }>("/tasks/me?perPage=20").catch(() => null),
      ]);

      if (openTasksRes?.success) setTasks(openTasksRes.data);
      if (myTasksRes?.success) setAllTasks(myTasksRes.data);
      if (txRes?.success) {
        setTransactions(txRes.data);

        const derived: any[] = txRes.data.slice(0, 10).map((tx: any) => {
          const typeMap: Record<string, string> = {
            escrow_release: "task_completed",
            escrow_lock: "runner_hired",
            manual_deposit_confirmed: "wallet_funded",
          };
          const titleMap: Record<string, string> = {
            escrow_release: "Task payment received",
            escrow_lock: "NeedRunner hired",
            manual_deposit_confirmed: "Wallet funded",
          };
          const descMap: Record<string, string> = {
            escrow_release: "Payment released for a completed task",
            escrow_lock: "A NeedRunner was assigned to your task",
            manual_deposit_confirmed: "Bank transfer confirmed",
          };
          return {
            id: tx.id,
            type: typeMap[tx.type] ?? "wallet_funded",
            title: titleMap[tx.type] ?? "Account activity",
            description: descMap[tx.type] ?? "A transaction occurred",
            createdAt: tx.createdAt,
          };
        });

        if (myTasksRes?.success) {
          myTasksRes.data.slice(0, 5).forEach((t: any) => {
            if (t.status === "completed") {
              derived.unshift({
                id: `task-completed-${t.id}`,
                type: "task_completed",
                title: "Task completed",
                description: `"${t.title}" was marked complete`,
                createdAt: t.updatedAt || t.createdAt,
              });
            }
          });
        }

        // Sync to the shared store so the desktop right panel renders the same
        // activity without a second fetch.
        setRecentActivities(derived.slice(0, 10));
      }
    } catch {
      /* silent */
    } finally {
      setTasksLoading(false);
      setPageReady(true);
    }
  }, [isAuthenticated, setRecentActivities]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchAll();
  }, [isAuthenticated, router, fetchAll]);

  if (!isAuthenticated || !pageReady) {
    return <DashboardSkeleton />;
  }

  if (activeRole === "runner") {
    return (
      <RunnerDashboard
        tasks={tasks}
        tasksLoading={tasksLoading}
        transactions={transactions}
        tasksCompleted={tasksCompleted}
        trustScore={trustScore}
        refresh={fetchAll}
      />
    );
  }

  return (
    <div className="page-column">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:gap-5">
        <WalletSummaryCard
          firstName={firstName}
          balanceKobo={balanceKobo}
          escrowKobo={escrowKobo}
          trustScore={trustScore}
          activeTasksCount={activeTasksCount}
          completedCount={tasksCompleted}
          hasEarnings={hasEarnings}
        />
        <QuickActions />
        <BrowseCategories />
        <PostTaskCTA />
        <ActiveTasksSection tasks={allTasks} loading={tasksLoading} />
        {/* Recent activity: bottom of Home on mobile/tablet, right panel on desktop */}
        <div className="xl:hidden">
          <RecentActivity activities={recentActivities} loading={tasksLoading} />
        </div>
      </div>
    </div>
  );
}