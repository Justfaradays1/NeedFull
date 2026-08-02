// WHAT: Desktop/tablet sidebar for the main app shell
// WHY: md-lg renders an icon rail (hover reveals labels), lg+ renders the full
//      labeled sidebar; single component keeps both states in sync

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, LogOut, Zap } from "lucide-react";
import { useAuthStore } from "@/store";
import { POSTER_NAV, RUNNER_NAV } from "@/lib/navConfig";
import type { NavItem } from "@/lib/navConfig";

// WHAT: Lazy-load a lucide icon by name
// WHY: WASM SWC can fail on lucide-react dynamic icon resolution; this avoids
//      importing all icons upfront in the nav-heavy sidebar
export function NavIcon({ icon, className }: { icon: string; className?: string }) {
  const [Icon, setIcon] = useState<React.ComponentType<{
    className?: string;
  }> | null>(null);

  useEffect(() => {
    let cancelled = false;
    import("lucide-react")
      .then((mod) => {
        if (cancelled) return;
        const Icons: Record<string, React.ComponentType<{ className?: string }>> = {
          BellRing: mod.BellRing,
          Bookmark: mod.Bookmark,
          CirclePlus: mod.CirclePlus,
          ClipboardCheck: mod.ClipboardCheck,
          Compass: mod.Compass,
          HelpCircle: mod.HelpCircle,
          House: mod.House,
          ListTodo: mod.ListTodo,
          MessageCircle: mod.MessageCircle,
          Settings: mod.Settings,
          User: mod.User,
          Wallet: mod.Wallet,
        };
        setIcon(() => Icons[icon]);
      })
      .catch(() => {
        if (!cancelled)
          setIcon(() => () => (
            <span style={{ width: 20, height: 20 }} />
          ));
      });
    return () => { cancelled = true; };
  }, [icon]);

  if (!Icon) return <span style={{ width: 20, height: 20 }} />;
  return <Icon className={className || "h-5 w-5"} />;
}

function SidebarSection({
  label,
  defaultOpen,
  children,
}: {
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="tap-target flex w-full items-center justify-between rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 transition-colors hover:text-gray-600"
      >
        {label}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className="grid transition-all duration-300 ease-in-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="space-y-0.5 pb-1.5">{children}</div>
        </div>
      </div>
    </div>
  );
}

function RunnerIllustration() {
  return (
    <svg
      viewBox="0 0 80 60"
      fill="none"
      className="h-14 w-auto"
      aria-hidden="true"
    >
      {/* Head */}
      <circle cx="52" cy="10" r="6" fill="#EAA325" fillOpacity="0.3" />
      <circle cx="52" cy="10" r="4" fill="#EAA325" />
      {/* Body lean */}
      <path
        d="M50 16l-4 16 8 2 2-10z"
        fill="#EAA325"
        fillOpacity="0.25"
        stroke="#EAA325"
        strokeWidth="0.8"
      />
      {/* Back arm */}
      <path
        d="M48 18l-8 6 2 3 6-5z"
        fill="#EAA325"
        fillOpacity="0.2"
        stroke="#EAA325"
        strokeWidth="0.8"
      />
      {/* Front arm */}
      <path
        d="M52 18l10-4-1-4-7 3z"
        fill="#EAA325"
        fillOpacity="0.2"
        stroke="#EAA325"
        strokeWidth="0.8"
      />
      {/* Back leg */}
      <path
        d="M46 34l-4 10 4 2 3-8z"
        fill="#EAA325"
        fillOpacity="0.2"
        stroke="#EAA325"
        strokeWidth="0.8"
      />
      {/* Front leg */}
      <path
        d="M52 34l2 12 5-1-1-9z"
        fill="#EAA325"
        fillOpacity="0.2"
        stroke="#EAA325"
        strokeWidth="0.8"
      />
      {/* Motion lines */}
      <path
        d="M62 20l6-2M64 26l7-1M60 32l8 2"
        stroke="#EAA325"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.4"
      />
      {/* Ground */}
      <line
        x1="20"
        y1="52"
        x2="70"
        y2="52"
        stroke="#EAA325"
        strokeWidth="1"
        strokeOpacity="0.2"
        strokeDasharray="3 3"
      />
    </svg>
  );
}

export function DesktopSidebar({
  user,
  activeRole,
  pathname,
  unreadCount,
}: {
  user: any;
  activeRole: string;
  pathname: string;
  unreadCount: number;
}) {
  const isRunner = activeRole === "runner";
  const navItems: NavItem[] = isRunner ? RUNNER_NAV : POSTER_NAV;

  useEffect(() => {
    useAuthStore.getState().refreshUser();
  }, [pathname]);

  const isPending = user?.runnerStatus === "pending";
  const isCta = navItems.some((n) => n.isCta);

  function renderLink(item: NavItem, rail: boolean) {
    if (item.disabled) {
      return (
        <div
          key={item.label}
          className={`flex items-center gap-3 rounded-xl text-sm font-medium text-gray-400 cursor-not-allowed ${
            rail ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
          }`}
        >
          <NavIcon icon={item.icon} className="h-5 w-5 shrink-0 text-gray-300" />
          {!rail && (
            <>
              <span>{item.label}</span>
              <span className="ml-auto text-[9px] font-medium text-gray-300">Soon</span>
            </>
          )}
        </div>
      );
    }

    const isActive =
      pathname === item.href || pathname.startsWith(item.href + "/");

    if (item.isCta) {
      if (rail) {
        return (
          <Link
            key={item.label}
            href={item.href}
            title={item.label}
            className="group relative mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-on-brand shadow-md shadow-brand/20 transition-all duration-150 hover:bg-brand-mid hover:shadow-lg active:scale-95"
            aria-label={item.label}
          >
            <NavIcon icon={item.icon} className="h-6 w-6" />
          </Link>
        );
      }
      return (
        <Link
          key={item.label}
          href={item.href}
          className="tap-target group mt-1 flex items-center gap-3 rounded-xl bg-brand px-3 py-3 text-sm font-bold text-on-brand shadow-md shadow-brand/20 transition-all duration-150 hover:shadow-lg hover:shadow-brand/25 active:scale-[0.98]"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 transition-colors group-hover:bg-white/25">
            <NavIcon icon={item.icon} className="h-5 w-5" />
          </div>
          <span>{item.label}</span>
          <ChevronRight className="ml-auto h-4 w-4 text-white/60" />
        </Link>
      );
    }

    const showChatBadge = item.href === "/chat" && unreadCount > 0;

    if (rail) {
      return (
        <Link
          key={item.label}
          href={item.href}
          title={item.label}
          aria-label={item.label}
          className={`group relative flex items-center justify-center rounded-xl px-2 py-2.5 transition-all duration-150 ${
            isActive
              ? "bg-brand-light/80 text-brand font-bold shadow-sm ring-1 ring-brand/20"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          <span className="relative">
            <NavIcon
              icon={item.icon}
              className={`h-5 w-5 shrink-0 transition-colors ${
                isActive ? "text-brand-text" : "text-gray-400"
              }`}
            />
            {showChatBadge && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold leading-none text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </span>
        </Link>
      );
    }

    return (
      <Link
        key={item.label}
        href={item.href}
        className={`tap-target flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
          isActive
            ? "bg-brand-light/80 text-brand font-bold shadow-sm ring-1 ring-brand/20"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        <span className="relative">
          <NavIcon
            icon={item.icon}
            className={`h-5 w-5 shrink-0 transition-colors ${
              isActive ? "text-brand-text" : "text-gray-400"
            }`}
          />
          {showChatBadge && (
            <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold leading-none text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </span>
        <span>{item.label}</span>
      </Link>
    );
  }

  const sections: { key: "main" | "community" | "account"; label: string; collapsible: boolean }[] = [
    { key: "main", label: "Main", collapsible: false },
    { key: "community", label: "Community", collapsible: true },
    { key: "account", label: "Account", collapsible: true },
  ];

  return (
    <aside
      className="hidden md:flex md:shrink-0 md:border-r md:border-gray-200 md:bg-surface/95 md:backdrop-blur-xl"
      style={{ height: "100dvh" }}
    >
      <div className="sidebar-scroll flex h-full w-full flex-col overflow-x-visible px-3 py-4 md:w-20 lg:w-64 lg:px-3">
        {/* ─── CTA Card / rail CTA ─── */}
        {isRunner ? (
          <div className="mb-4 hidden rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/40 p-3 shadow-sm dark:border-amber-800/50 dark:from-amber-950/60 dark:to-amber-900/30 lg:block">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <p className="text-sm font-bold text-gray-900 dark:text-amber-100">
                NeedRunner Dashboard
              </p>
            </div>
            <p className="mt-1 text-xs text-gray-600 dark:text-amber-200/70">
              View available tasks and your earnings at a glance.
            </p>
            <Link
              href="/tasks"
              className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-amber-600 active:scale-[0.97]"
            >
              Open Dashboard
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        ) : isCta ? (
          <div className="mb-4">
            <div className="relative hidden overflow-hidden rounded-xl border border-amber-200/70 bg-gradient-to-br from-amber-50 via-amber-50/60 to-white p-3 shadow-sm transition-all hover:shadow-md dark:border-amber-800/40 dark:from-amber-950/50 dark:via-amber-950/30 dark:to-amber-950/20 lg:block">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900 dark:text-amber-100">
                    {isPending ? "Application Pending" : "Become a NeedRunner"}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-amber-200/70">
                    {isPending
                      ? "Your application is under review. Check back soon."
                      : "Earn money by completing tasks around campus."}
                  </p>
                  <div className="mt-2.5 flex flex-nowrap items-center gap-1.5">
                    <Link
                      href="/become-runner"
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-sm transition-all hover:from-amber-600 hover:to-amber-500 active:scale-[0.97] whitespace-nowrap"
                    >
                      {isPending ? "View Status" : "Get Started"}
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                    {!isPending && (
                      <Link
                        href="/become-runner"
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-amber-300/50 px-2.5 py-1.5 text-[11px] font-semibold transition-all hover:bg-amber-50 active:scale-[0.97] whitespace-nowrap dark:border-amber-700/50 dark:text-amber-400 dark:hover:bg-amber-950/50"
                      >
                        Learn More
                      </Link>
                    )}
                  </div>
                </div>
                <div className="shrink-0 -mr-1 -mt-1">
                  <RunnerIllustration />
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* ─── Navigation ─── */}
        <nav className="flex-1 space-y-2">
          {sections.map((section) => {
            const items = navItems.filter((n) => n.section === section.key);
            if (items.length === 0) return null;

            if (section.collapsible) {
              return (
                <div key={section.key} className="hidden lg:block">
                  <SidebarSection label={section.label}>
                    {items.map((n) => renderLink(n, false))}
                  </SidebarSection>
                </div>
              );
            }

            return (
              <div key={section.key} className="hidden lg:block">
                <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                  {section.label}
                </p>
                <div className="space-y-0.5">{items.map((n) => renderLink(n, false))}</div>
              </div>
            );
          })}

          {/* ─── Rail-only nav (icons for all non-hidden items) ─── */}
          <div className="flex flex-col items-center space-y-1 lg:hidden">
            {navItems
              .filter((n) => n.section === "main" || n.section === "community")
              .map((n) => renderLink(n, true))}
            <div className="my-2 h-px w-8 bg-gray-200 dark:bg-gray-700" />
            {navItems
              .filter((n) => n.section === "account")
              .map((n) => renderLink(n, true))}
          </div>
        </nav>

        {/* ─── Sign Out ─── */}
        <div className="mt-4 shrink-0 border-t border-gray-100 pt-3">
          <button
            type="button"
            onClick={() => {
              useAuthStore.getState().logout();
              window.location.href = "/login";
            }}
            className={`group flex w-full items-center gap-3 rounded-xl text-sm font-semibold text-red-600 transition-all hover:bg-red-50 active:scale-[0.98] justify-center px-2 lg:justify-start lg:px-3`}
            aria-label="Sign Out"
            title="Sign Out"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className="hidden lg:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
