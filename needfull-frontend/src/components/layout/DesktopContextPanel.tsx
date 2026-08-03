// WHAT: Right-hand context panel for the desktop shell (xl+ only)
// WHY: Provides page-aware, complementary widgets without duplicating the
//      center column's content; single registry keeps panel contents curated

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Eye,
  EyeOff,
  LifeBuoy,
  Wallet as WalletIcon,
} from "lucide-react";
import { useAuthUser } from "@/store";
import { formatCurrency } from "@/lib/format";
import { CategorySearch } from "@/components/dashboard/post/CategorySearch";
import { NearbyActivity } from "@/components/dashboard/post/NearbyActivity";
import { QuickActions } from "@/components/dashboard/post/QuickActions";
import { SmartInsights } from "@/components/dashboard/post/SmartInsights";

type WidgetKey = "wallet" | "categories" | "nearby" | "insights" | "quick" | "support";

const WIDGET_TITLES: Partial<Record<WidgetKey, string>> = {
  categories: "Browse Categories",
  nearby: "Around Campus",
  insights: "Smart Insights",
  quick: "Quick Actions",
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

// WHAT: Route-prefix → widget sets; first matching prefix wins
// WHY: Keeps panel curated per page; unknown routes get a sensible default
const REGISTRY: { match: string; widgets: WidgetKey[] }[] = [
  { match: "/feed", widgets: ["wallet", "categories"] },
  { match: "/explore", widgets: ["categories", "nearby", "support"] },
  { match: "/tasks/create", widgets: [] },
  { match: "/tasks/", widgets: ["wallet", "quick", "insights"] },
  { match: "/tasks", widgets: ["wallet", "nearby", "insights"] },
  { match: "/chat", widgets: ["wallet", "support"] },
  { match: "/wallet", widgets: ["quick", "insights", "support"] },
  { match: "/profile", widgets: ["wallet", "nearby"] },
  { match: "/notifications", widgets: ["support"] },
  { match: "/become-runner", widgets: ["support"] },
];

const FALLBACK: WidgetKey[] = ["wallet", "nearby", "support"];

function resolveWidgets(pathname: string): WidgetKey[] {
  const hit = REGISTRY.find((r) => pathname.startsWith(r.match));
  return hit ? hit.widgets : FALLBACK;
}

export function DesktopContextPanel({ pathname }: { pathname: string }) {
  const widgets = resolveWidgets(pathname);
  if (widgets.length === 0) return null;

  return (
    <aside
      className="hidden xl:flex xl:w-80 xl:shrink-0 xl:sticky xl:top-0 xl:self-start xl:flex-col xl:border-l xl:border-gray-200 xl:bg-surface/60 xl:backdrop-blur-xl"
      style={{ height: "100dvh" }}
      aria-label="Page context panel"
    >
      {/* WHAT: Internal scroll is a fallback only — it only engages when panel
         content exceeds the viewport, keeping a single browser scrollbar
         in the common case */}
      <div className="sidebar-scroll flex-1 space-y-4 overflow-y-auto px-4 py-4">
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
            case "nearby":
              return (
                <PanelCard key={key} title={WIDGET_TITLES.nearby}>
                  <NearbyActivity />
                </PanelCard>
              );
            case "insights":
              return (
                <PanelCard key={key} title={WIDGET_TITLES.insights}>
                  <SmartInsights />
                </PanelCard>
              );
            case "quick":
              return (
                <PanelCard key={key} title={WIDGET_TITLES.quick}>
                  <QuickActions />
                </PanelCard>
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
