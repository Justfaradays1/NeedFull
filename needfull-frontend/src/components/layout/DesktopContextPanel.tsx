// WHAT: Right-hand context panel for the desktop shell (xl+ only)
// WHY: Provides page-aware, complementary widgets without duplicating the
//      center column's content; single registry keeps panel contents curated.
//      Home (/feed) shows Recent Activity here — NOT in the middle column —
//      so the middle stays focused on the primary workflow.

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronRight,
  CheckCircle,
  Clock,
  DollarSign,
  Eye,
  EyeOff,
  LifeBuoy,
  MessageCircle,
  Plus,
  Star,
  UserPlus,
  Wallet as WalletIcon,
} from "lucide-react";
import { useAuthUser } from "@/store";
import { useDashboardStore } from "@/store/dashboardStore";
import { formatCurrency } from "@/lib/format";
import { Callout } from "@/components/ui/callout";
import { CategorySearch } from "@/components/dashboard/post/CategorySearch";

type WidgetKey = "wallet" | "categories" | "recent" | "support" | "tip";

const WIDGET_TITLES: Partial<Record<WidgetKey, string>> = {
  categories: "Browse Categories",
};

function PanelCard({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-card-border bg-surface p-4 shadow-sm">
      {title ? (
        <h3 className="mb-3 inline-flex items-center rounded-lg bg-brand px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-sm">
          {title}
        </h3>
      ) : null}
      {children}
    </section>
  );
}

function WalletMini() {
  const user = useAuthUser();
  const [hidden, setHidden] = useState(false);
  const wallet = user?.wallet;
  const balanceKobo = wallet?.balanceKobo ?? 0;
  const escrowKobo = wallet?.escrowKobo ?? 0;

  return (
    <Link
      href="/wallet"
      className="group block overflow-hidden rounded-2xl bg-linear-to-br from-brand-dark via-brand to-brand-mid p-4 text-on-brand shadow-md transition-all duration-200 hover:shadow-lg active:scale-[0.99]"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <WalletIcon className="h-4 w-4 text-on-brand/60" />
          <span className="text-xs font-medium text-on-brand/60">
            Wallet Balance
          </span>
        </div>
        <ArrowUpRight className="h-4 w-4 text-on-brand/60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <p className="font-display text-2xl font-extrabold tracking-tight">
          {hidden ? "₦••••••" : formatCurrency(balanceKobo)}
        </p>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setHidden(!hidden);
          }}
          className="rounded-lg p-1 text-on-brand/60 transition-colors hover:bg-white/10 hover:text-on-brand"
          aria-label={hidden ? "Show balance" : "Hide balance"}
        >
          {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <p className="mt-1 text-[11px] text-on-brand/60">
        ₦{((escrowKobo ?? 0) / 100).toLocaleString("en-NG", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}{" "}
        in escrow
      </p>
    </Link>
  );
}

function SupportCard() {
  return (
    <PanelCard title="Need Help?">
      <div className="space-y-2">
        <Link
          href="/faq"
          className="flex items-center gap-3 rounded-xl border border-card-border bg-surface px-3 py-2.5 text-sm font-medium text-gray-700 transition-all hover:border-brand/30 hover:bg-brand-light/40 dark:text-white"
        >
          <LifeBuoy className="h-4 w-4 shrink-0 text-brand-text" />
          Help & Support
          <ArrowUpRight className="ml-auto h-3.5 w-3.5 text-gray-400" />
        </Link>
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-xl border border-card-border bg-surface px-3 py-2.5 text-sm font-medium text-gray-700 transition-all hover:border-brand/30 hover:bg-brand-light/40 dark:text-white"
        >
          <WalletIcon className="h-4 w-4 shrink-0 text-brand-text" />
          Payment Settings
          <ArrowUpRight className="ml-auto h-3.5 w-3.5 text-gray-400" />
        </Link>
      </div>
    </PanelCard>
  );
}

/* ─── Recent Activity (right-panel copy; data shared from the Home fetch) ─── */

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return days < 7 ? `${days}d` : new Date(dateStr).toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}

const typeConfig: Record<string, { icon: typeof Clock; bg: string; color: string }> = {
  task_completed: { icon: CheckCircle, bg: "bg-green-50", color: "#16A34A" },
  task_posted: { icon: Plus, bg: "bg-blue-50", color: "#2563EB" },
  escrow_release: { icon: DollarSign, bg: "bg-emerald-50", color: "#1A6B4A" },
  wallet_funded: { icon: DollarSign, bg: "bg-emerald-50", color: "#1A6B4A" },
  review_received: { icon: Star, bg: "bg-amber-50", color: "#EAA325" },
  runner_hired: { icon: UserPlus, bg: "bg-purple-50", color: "#7C3AED" },
  message_received: { icon: MessageCircle, bg: "bg-blue-50", color: "#2563EB" },
};

function RecentActivityPanel() {
  const activities = useDashboardStore((s) => s.recentActivities);

  return (
    <PanelCard title="Recent Activity">
      {activities.length === 0 ? (
        <p className="text-xs text-gray-500">No recent activity yet</p>
      ) : (
        <div className="divide-y divide-card-border">
          {activities.slice(0, 3).map((activity) => {
            const cfg = typeConfig[activity.type] ?? { icon: Clock, bg: "bg-gray-50", color: "#6B7280" };
            const Icon = cfg.icon;
            return (
              <div key={activity.id} className="flex items-center gap-2.5 py-2.5">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${cfg.bg}`}>
                  <Icon className="h-3.5 w-3.5" style={{ color: cfg.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-gray-900 dark:text-white">
                    {activity.title}
                  </p>
                  <p className="truncate text-[10px] text-gray-500">
                    {activity.description}
                  </p>
                </div>
                <span className="shrink-0 text-[10px] text-gray-400">
                  {timeAgo(activity.createdAt)}
                </span>
              </div>
            );
          })}
        </div>
      )}
      <Link
        href="/wallet"
        className="mt-2 flex items-center gap-0.5 text-[11px] font-bold text-brand-text"
      >
        View all <ChevronRight className="h-3 w-3" />
      </Link>
    </PanelCard>
  );
}

// WHAT: Route-prefix → widget sets; first matching prefix wins
// WHY: Keeps panel curated per page; unknown routes get a sensible default
const REGISTRY: { match: string; widgets: WidgetKey[] }[] = [
  { match: "/feed", widgets: ["wallet", "recent", "tip"] },
  { match: "/categories", widgets: ["support"] },
  { match: "/explore", widgets: ["categories", "support"] },
  { match: "/helpers", widgets: ["categories", "support"] },
  { match: "/tasks/create", widgets: [] },
  { match: "/tasks/", widgets: ["wallet", "support"] },
  { match: "/tasks", widgets: ["wallet", "support"] },
  { match: "/chat", widgets: ["wallet", "support"] },
  { match: "/wallet", widgets: ["support"] },
  { match: "/profile", widgets: ["wallet", "support"] },
  { match: "/notifications", widgets: ["support"] },
  { match: "/become-runner", widgets: ["support"] },
];

const FALLBACK: WidgetKey[] = ["wallet", "support"];

function resolveWidgets(pathname: string): WidgetKey[] {
  const hit = REGISTRY.find((r) => pathname.startsWith(r.match));
  return hit ? hit.widgets : FALLBACK;
}

export function DesktopContextPanel({ pathname }: { pathname: string }) {
  const widgets = resolveWidgets(pathname);
  if (widgets.length === 0) return null;

  return (
    <aside
      className="hidden xl:flex xl:w-80 xl:shrink-0 xl:sticky xl:top-14 xl:self-stretch xl:flex-col xl:border-l xl:border-gray-200 xl:bg-surface/60 xl:backdrop-blur-xl"
      style={{ height: "calc(100dvh - 3.5rem)" }}
      aria-label="Page context panel"
    >
      <div className="sidebar-scroll flex-1 space-y-4 overflow-y-auto px-5 py-6">
        {widgets.map((key) => {
          switch (key) {
            case "wallet":
              return <WalletMini key={key} />;
            case "categories":
              return (
                <PanelCard key={key} title={WIDGET_TITLES.categories}>
                  <CategorySearch />
                </PanelCard>
              );
            case "recent":
              return <RecentActivityPanel key={key} />;
            case "tip":
              return (
                <Callout key={key} variant="tip">
                  Complete your profile with a bio and photo to build trust and get more task opportunities.
                </Callout>
              );
            case "support":
              return <SupportCard key={key} />;
            default:
              return null;
          }
        })}
      </div>
    </aside>
  );
}