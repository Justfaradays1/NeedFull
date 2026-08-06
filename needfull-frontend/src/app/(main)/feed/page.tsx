"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { get } from "@/lib/apiClient";
import { useAuthUser, useAuthStore, useActiveRole } from "@/store";
import { useAuthInit } from "@/hooks/useAuthInit";

import { WelcomeHeader } from "@/components/dashboard/post/WelcomeHeader";
import { WalletSummaryCard } from "@/components/dashboard/post/WalletSummaryCard";
import { QuickStats } from "@/components/dashboard/post/QuickStats";
import { QuickActions } from "@/components/dashboard/post/QuickActions";
import { CategoryShortcuts } from "@/components/dashboard/post/CategoryShortcuts";
import { ActiveTasksSection } from "@/components/dashboard/post/ActiveTasksSection";
import { NearbyActivity } from "@/components/dashboard/post/NearbyActivity";
import { RecommendedRunners } from "@/components/dashboard/post/RecommendedRunners";
import { RecentActivity } from "@/components/dashboard/post/RecentActivity";
import { SmartInsights } from "@/components/dashboard/post/SmartInsights";
import { DashboardSkeleton } from "@/components/dashboard/post/DashboardSkeleton";
import { BecomeRunnerBanner } from "@/components/home/BecomeRunnerBanner";
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

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
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
  const [postedCount, setPostedCount] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [allTasks, setAllTasks] = useState<TaskItem[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [pageReady, setPageReady] = useState(false);

  const balanceKobo = user?.wallet?.balanceKobo ?? 0;
  const escrowKobo = user?.wallet?.escrowKobo ?? 0;
  const trustScore = user?.trustScore ?? 0;
  const activeRoleFromHook = useActiveRole();
  const activeRole = (activeRoleFromHook || user?.activeRole) === "runner" ? "runner" : "poster";
  const firstName = user?.fullName?.split(" ")[0] || "there";
  const tasksPosted = (user as any)?.totalTasksPosted ?? postedCount ?? 0;
  const tasksCompleted = (user as any)?.totalTasksCompleted ?? 0;
  const averageRating = (user as any)?.averageRating ?? 0;
  const totalSpent = (user as any)?.totalSpentKobo ?? 0;
  const successRate = tasksPosted > 0 ? Math.round((tasksCompleted / tasksPosted) * 100) : 0;
  const activeTasks = tasks.filter((t) => t.status === "in_progress" || t.status === "awaiting_confirmation").length;
  const hasEarnings = (user as any)?.hasEarnings ?? transactions.some((t) =>
    ["escrow_release", "earnings"].includes(t.type)
  );

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
        postedRes,
        txRes,
        myTasksRes,
      ] = await Promise.all([
        get<{ success: boolean; data: TaskItem[] }>(`/tasks?sortBy=newest&status=open&perPage=6${locationQuery}`).catch(() => null),
        get<{ success: boolean; data: TaskItem[] }>("/tasks/me/posted").catch(() => null),
        get<{ success: boolean; data: WalletTransaction[] }>("/wallet/transactions?perPage=10").catch(() => null),
        get<{ success: boolean; data: TaskItem[] }>("/tasks/me?perPage=20").catch(() => null),
      ]);

      if (openTasksRes?.success) setTasks(openTasksRes.data);
      if (myTasksRes?.success) setAllTasks(myTasksRes.data);
      if (postedRes?.success) setPostedCount(postedRes.data.length);
      if (txRes?.success) {
        setTransactions(txRes.data);

        const derived: Activity[] = txRes.data.slice(0, 10).map((tx: any) => {
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

        setActivities(derived.slice(0, 10));
      }
    } catch {
      /* silent */
    } finally {
      setTasksLoading(false);
      setPageReady(true);
    }
  }, [isAuthenticated]);

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
    <div className="min-h-screen bg-gray-50/50 dark:bg-neutral-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 pb-10 pt-4 sm:px-6 lg:px-8">
        <WelcomeHeader firstName={firstName} />
        <WalletSummaryCard
          balanceKobo={balanceKobo}
          escrowKobo={escrowKobo}
          hasEarnings={hasEarnings}
        />
        <QuickActions />
        <ActiveTasksSection tasks={allTasks} loading={tasksLoading} />
        <QuickStats
          tasksPosted={tasksPosted}
          tasksCompleted={tasksCompleted}
          activeTasks={activeTasks}
          averageRating={averageRating}
          totalSpent={totalSpent}
          successRate={successRate}
          trustScore={trustScore}
        />
        <CategoryShortcuts />
        <NearbyActivity />
        <RecommendedRunners runners={[]} loading={false} />
        <RecentActivity activities={activities} loading={tasksLoading} />
        <SmartInsights />
        <BecomeRunnerBanner />
      </div>
    </div>
  );
}
