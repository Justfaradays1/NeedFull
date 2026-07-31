"use client";

import { useEffect, useState } from "react";
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
import { Callout } from "@/components/ui/callout";
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
  category: { id: string; name: string; icon: string } | null;
  poster: { id: string; fullName: string };
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
  const [unreadCount, setUnreadCount] = useState(0);
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
  const emailVerified = Boolean((user as any)?.emailVerified);
  const hasEarnings = (user as any)?.hasEarnings ?? transactions.some((t) =>
    ["escrow_release", "earnings"].includes(t.type)
  );

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchAll = async () => {
      try {
        const [
          openTasksRes,
          postedRes,
          convRes,
          txRes,
          myTasksRes,
        ] = await Promise.all([
          get<{ success: boolean; data: TaskItem[] }>("/tasks?sortBy=newest&status=open&perPage=6").catch(() => null),
          get<{ success: boolean; data: TaskItem[] }>("/tasks/me/posted").catch(() => null),
          get<{ success: boolean; data: { unreadCount: number }[] }>("/chat/conversations").catch(() => null),
          get<{ success: boolean; data: WalletTransaction[] }>("/wallet/transactions?perPage=10").catch(() => null),
          get<{ success: boolean; data: TaskItem[] }>("/tasks/me?perPage=20").catch(() => null),
        ]);

        if (openTasksRes?.success) setTasks(openTasksRes.data);
        if (myTasksRes?.success) setAllTasks(myTasksRes.data);
        if (postedRes?.success) setPostedCount(postedRes.data.length);
        if (convRes?.success) {
          const count = (convRes.data as any).reduce?.(
            (s: number, c: any) => s + (c.unreadCount || 0),
            0,
          ) ?? 0;
          setUnreadCount(count);
        }
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
    };

    fetchAll();
  }, [isAuthenticated, router]);

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
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-4">
        {/* ─── Mobile & Tablet Layout (< 1024px) ─── */}
        <div className="flex flex-col gap-4 lg:hidden">
          <WelcomeHeader
            firstName={firstName}
            fullName={user?.fullName ?? ""}
            email={user?.email ?? ""}
            profilePictureUrl={(user as any)?.profilePictureUrl}
            emailVerified={emailVerified}
            unreadNotifications={unreadCount}
          />
          <WalletSummaryCard
            balanceKobo={balanceKobo}
            escrowKobo={escrowKobo}
            hasEarnings={hasEarnings}
          />
          <QuickStats
            tasksPosted={tasksPosted}
            tasksCompleted={tasksCompleted}
            activeTasks={activeTasks}
            averageRating={averageRating}
            totalSpent={totalSpent}
            successRate={successRate}
            trustScore={trustScore}
          />
          <QuickActions />
          <CategoryShortcuts />
          <ActiveTasksSection tasks={allTasks} loading={tasksLoading} />
          <NearbyActivity />
          <RecommendedRunners runners={[]} loading={false} />
          <RecentActivity activities={activities} loading={tasksLoading} />
          <SmartInsights />
          <BecomeRunnerBanner />
          <Callout variant="tip">
            Complete your profile with a bio and photo to build trust and get more task opportunities.
          </Callout>
        </div>

        {/* ─── Desktop Layout (>= 1024px) ─── */}
        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-4">
          {/* Row 1: Header spans full width */}
          <div className="col-span-12 mb-1">
            <WelcomeHeader
              firstName={firstName}
              fullName={user?.fullName ?? ""}
              email={user?.email ?? ""}
              profilePictureUrl={(user as any)?.profilePictureUrl}
              emailVerified={emailVerified}
              unreadNotifications={unreadCount}
            />
          </div>

          {/* Row 2: Wallet (8) + Stats (4) */}
          <div className="col-span-8">
            <WalletSummaryCard
              balanceKobo={balanceKobo}
              escrowKobo={escrowKobo}
              hasEarnings={hasEarnings}
            />
          </div>
          <div className="col-span-4">
            <QuickStats
              tasksPosted={tasksPosted}
              tasksCompleted={tasksCompleted}
              activeTasks={activeTasks}
              averageRating={averageRating}
              totalSpent={totalSpent}
              successRate={successRate}
              trustScore={trustScore}
            />
          </div>

          {/* Row 3: Quick Actions (4) + Categories (8) */}
          <div className="col-span-3">
            <QuickActions />
          </div>
          <div className="col-span-9">
            <CategoryShortcuts />
          </div>

          {/* Row 4: Active Tasks (8) + Recommended Runners (4) */}
          <div className="col-span-8">
            <ActiveTasksSection tasks={allTasks} loading={tasksLoading} />
          </div>
          <div className="col-span-4">
            <RecommendedRunners runners={[]} loading={false} />
            <div className="mt-4">
              <NearbyActivity />
            </div>
          </div>

          {/* Row 5: Recent Activity (8) + Insights (4) */}
          <div className="col-span-8">
            <RecentActivity activities={activities} loading={tasksLoading} />
          </div>
          <div className="col-span-4">
            <SmartInsights />
            <div className="mt-4 rounded-xl border border-card-border bg-surface p-4 shadow-sm">
              <BecomeRunnerBanner />
            </div>
          </div>

          {/* Row 6: Callout */}
          <div className="col-span-12">
            <Callout variant="tip">
              Complete your profile with a bio and photo to build trust and get more task opportunities.
            </Callout>
          </div>
        </div>
      </div>
    </div>
  );
}
