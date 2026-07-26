// WHAT: Admin bottom navigation bar — mobile-first admin nav
// WHY: Admin dashboard needs its own navigation, visually distinct from customer nav
// FUTURE: Add desktop sidebar variant, add unread counts for pending items

"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const ADMIN_TABS = [
  { href: "/admin", label: "Dashboard", icon: "LayoutDashboard", exact: true },
  { href: "/admin/users", label: "Users", icon: "Users" },
  { href: "/admin/deposits", label: "Deposits", icon: "Banknote" },
  { href: "/admin/reports", label: "Reports", icon: "Flag" },
  { href: "/admin/more", label: "More", icon: "MoreHorizontal", isMore: true },
] as const;

const MORE_ITEMS = [
  { href: "/admin/withdrawals", label: "Withdrawals", icon: "Clock" },
  { href: "/admin/verifications", label: "Verifications", icon: "Shield" },
  { href: "/admin/runner-applications", label: "Runner Applications", icon: "Zap" },
  { href: "/admin/tasks", label: "Tasks", icon: "ClipboardList" },
  { href: "/admin/transactions", label: "Transactions", icon: "ListChecks" },
] as const;

// WHAT: Defer heavy icon imports to avoid WASM SWC compilation issues
// WHY: Same approach as customer nav — lazy-load lucide icons
function AdminTabIcon({
  icon,
  className,
}: {
  icon: string;
  className?: string;
}) {
  const [Icon, setIcon] = useState<React.ComponentType<{
    className?: string;
  }> | null>(null);

  useEffect(() => {
    let cancelled = false;
    import("lucide-react")
      .then((mod) => {
        if (cancelled) return;
        const Icons: Record<
          string,
          React.ComponentType<{ className?: string }>
        > = {
          LayoutDashboard: mod.LayoutDashboard,
          Users: mod.Users,
          Banknote: mod.Banknote,
          Flag: mod.Flag,
          MoreHorizontal: mod.MoreHorizontal,
          Clock: mod.Clock,
          Shield: mod.Shield,
          Zap: mod.Zap,
          ClipboardList: mod.ClipboardList,
          ListChecks: mod.ListChecks,
          X: mod.X,
        };
        setIcon(() => Icons[icon]);
      })
      .catch(() => {
        if (!cancelled)
          setIcon(() => () => <span style={{ width: 20, height: 20 }} />);
      });
    return () => {
      cancelled = true;
    };
  }, [icon]);

  if (!Icon) return <span style={{ width: 20, height: 20 }} />;
  return <Icon className={className || "h-5 w-5"} />;
}

export function AdminNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  // WHAT: Check if the current pathname is within one of the "More" sub-pages
  const isMoreActive = MORE_ITEMS.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
  );

  return (
    <>
      {/* More menu overlay */}
      {showMore && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* More menu panel */}
      {showMore && (
        <div
          className="fixed left-0 right-0 bottom-18 z-50 px-4 pb-2"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="mx-auto max-w-lg overflow-hidden rounded-2xl border border-gray-700 bg-gray-800 shadow-2xl">
            <div className="flex items-center justify-between px-4 pb-2 pt-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                More Sections
              </span>
              <button
                type="button"
                onClick={() => setShowMore(false)}
                className="tap-target flex h-7 w-7 items-center justify-center rounded-lg hover:bg-gray-700"
              >
                <AdminTabIcon icon="X" className="h-4 w-4 text-gray-400" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1 px-2 pb-3">
              {MORE_ITEMS.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMore(false)}
                    className={`tap-target flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-purple-600/20 text-purple-300"
                        : "text-gray-300 hover:bg-gray-700/60"
                    }`}
                  >
                    <AdminTabIcon icon={item.icon} className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom navigation bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-700/50 bg-gray-900/95 backdrop-blur-xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex max-w-lg items-center justify-around px-2">
          {ADMIN_TABS.map((tab) => {
            const isMore = "isMore" in tab && tab.isMore;
            const isExact = "exact" in tab && tab.exact;

            let isActive: boolean;
            if (isMore) {
              isActive = isMoreActive;
            } else if (isExact) {
              isActive = pathname === tab.href;
            } else {
              isActive =
                pathname === tab.href || pathname.startsWith(tab.href + "/");
            }

            if (isMore) {
              return (
                <button
                  key="more"
                  type="button"
                  onClick={() => setShowMore((v) => !v)}
                  className={`tap-target relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-12 transition-all duration-200 ${
                    isActive || showMore ? "text-purple-400" : "text-gray-500"
                  }`}
                  aria-label="More"
                >
                  <div
                    className={`relative flex items-center justify-center rounded-xl px-3 py-1.5 transition-all duration-200 ${
                      isActive || showMore ? "bg-purple-500/15" : ""
                    }`}
                  >
                    <AdminTabIcon
                      icon={tab.icon}
                      className={`h-5 w-5 transition-all duration-200 ${isActive || showMore ? "text-purple-400 scale-110" : ""}`}
                    />
                  </div>
                  <span
                    className={`text-[10px] transition-all duration-200 ${
                      isActive || showMore
                        ? "font-bold text-purple-400"
                        : "font-medium text-gray-500"
                    }`}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`tap-target relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-12 transition-all duration-200 ${
                  isActive ? "text-purple-400" : "text-gray-500"
                }`}
                aria-label={tab.label}
              >
                <div
                  className={`relative flex items-center justify-center rounded-xl px-3 py-1.5 transition-all duration-200 ${
                    isActive ? "bg-purple-500/15" : ""
                  }`}
                >
                  <AdminTabIcon
                    icon={tab.icon}
                    className={`h-5 w-5 transition-all duration-200 ${isActive ? "text-purple-400 scale-110" : ""}`}
                  />
                </div>
                <span
                  className={`text-[10px] transition-all duration-200 ${
                    isActive
                      ? "font-bold text-purple-400"
                      : "font-medium text-gray-500"
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
