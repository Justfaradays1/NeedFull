// WHAT: Desktop/tablet sidebar for the main app shell — X-style information
//       architecture: a short curated main nav, a "More" overflow menu, fixed
//       bottom profile card, and NO scrollbar
// WHY: Lightweight, scannable navigation that scales without crowding;
//      secondary destinations live in the More menu instead of the sidebar

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  BellRing,
  ChevronDown,
  ClipboardList,
  Coins,
  FileText,
  Flag,
  HelpCircle,
  Info,
  LogOut,
  MoreHorizontal,
  Plus,
  RefreshCcw,
  Settings,
  Shield,
  ShieldCheck,
  User,
  Wallet,
  Zap,
} from "lucide-react";
import { useAuthStore } from "@/store";
import { Avatar } from "@/components/ui/avatar";
import { SmartMenu } from "@/components/ui/SmartMenu";
import { BrandMark } from "@/components/ui/BrandMark";

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
          UsersRound: mod.UsersRound,
          Wallet: mod.Wallet,
        };
        setIcon(() => Icons[icon]);
      })
      .catch(() => {
        if (!cancelled)
          setIcon(() => () => (
            <span style={{ width: 24, height: 24 }} />
          ));
      });
    return () => { cancelled = true; };
  }, [icon]);

  if (!Icon) return <span style={{ width: 24, height: 24 }} />;
  return <Icon className={className || "h-6 w-6"} />;
}

// WHAT: Curated main navigation — only the most important destinations
// WHY: X-style: a short list that fits without scrolling; everything else → More
const POSTER_MAIN: { href: string; label: string; icon: string }[] = [
  { href: "/feed", label: "Home", icon: "House" },
  { href: "/explore", label: "Explore", icon: "Compass" },
  { href: "/helpers", label: "Helpers", icon: "UsersRound" },
  { href: "/tasks", label: "Browse Tasks", icon: "ListTodo" },
  { href: "/chat", label: "Messages", icon: "MessageCircle" },
  { href: "/profile", label: "Profile", icon: "User" },
];

const RUNNER_MAIN: { href: string; label: string; icon: string }[] = [
  { href: "/feed", label: "Home", icon: "House" },
  { href: "/hustle", label: "Find Tasks", icon: "ListTodo" },
  { href: "/wallet", label: "Earnings", icon: "Wallet" },
  { href: "/chat", label: "Messages", icon: "MessageCircle" },
  { href: "/profile", label: "Profile", icon: "User" },
];

// NOTE: Sidebar menus use the viewport-aware SmartMenu (see components/ui/SmartMenu.tsx)

function MenuLink({
  href,
  icon: Icon,
  label,
  onNavigate,
  disabled,
  danger,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onNavigate?: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  if (disabled) {
    return (
      <div
        role="menuitem"
        aria-disabled="true"
        className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold text-gray-400"
      >
        <Icon className="h-5 w-5 shrink-0 text-gray-400" />
        <span>{label}</span>
        <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-gray-400">
          Soon
        </span>
      </div>
    );
  }
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold transition-colors duration-150 active:scale-[0.99] ${
        danger
          ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
          : "text-gray-800 hover:bg-gray-100 dark:text-white dark:hover:bg-white/10"
      }`}
    >
      <Icon className="h-5 w-5 shrink-0 text-gray-600 dark:text-gray-300" />
      <span>{label}</span>
    </Link>
  );
}

export function DesktopSidebar({
  user,
  activeRole,
  pathname,
  chatUnreadCount,
}: {
  user: any;
  activeRole: string;
  pathname: string;
  chatUnreadCount: number;
}) {
  const isRunner = activeRole === "runner";
  const isAdmin = user?.role === "admin";
  const isPending = user?.runnerStatus === "pending";
  const mainNav = isRunner ? RUNNER_MAIN : POSTER_MAIN;

  const [moreOpen, setMoreOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const profileAvatarRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    useAuthStore.getState().refreshUser();
  }, [pathname]);

  useEffect(() => {
    setMoreOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const logout = () => {
    useAuthStore.getState().logout();
    window.location.href = "/login";
  };

  // WHAT: Shared nav item spec — every item (main nav, More, profile) uses the
  // exact same height, padding, icon size and typography so the sidebar reads
  // as one design system instead of individual buttons
  // WHAT: Shared nav item spec — only the ACTIVE item gets the green pill;
  // hover stays a neutral background. The pill color is a fixed green tint
  // (identical in light and dark mode), and link text color never changes.
  const NAV_BASE =
    "flex h-11 items-center gap-3.5 rounded-xl text-[17px] transition-all duration-200 md:justify-center lg:justify-start lg:px-4 active:scale-[0.98]";
  const NAV_TEXT = "text-black dark:text-white";
  const NAV_INACTIVE = `${NAV_TEXT} font-semibold hover:bg-gray-100 dark:hover:bg-white/10`;
  const NAV_ACTIVE =
    `bg-[rgba(26,107,74,0.12)] font-bold shadow-sm ring-1 ring-[rgba(26,107,74,0.22)] ${NAV_TEXT}`;

  const moreItems = [
    { href: "/wallet", label: "Wallet", icon: Wallet },
    { href: "/tasks", label: "My Tasks", icon: ClipboardList },
    { href: "/notifications", label: "Notifications", icon: BellRing },
    { href: "/settings", label: "Settings", icon: Settings },
    { divider: true },
    { href: "/faq", label: "Help Center", icon: HelpCircle },
    { href: "/privacy", label: "Privacy & Security", icon: ShieldCheck },
    { href: "/terms", label: "Terms", icon: FileText },
    { href: "/about", label: "About NeedFull", icon: Info },
    { href: "/faq", label: "Report a Problem", icon: Flag },
  ] as const;

  return (
    <aside
      className="hidden md:flex md:shrink-0 md:sticky md:top-0 md:self-start md:border-r md:border-gray-200 md:bg-surface/95 md:backdrop-blur-xl md:z-40"
      style={{ height: "100dvh" }}
    >
      <div className="flex h-full w-full flex-col md:w-20 lg:w-[280px] xl:w-80">
        {/* ─── Brand ─── */}
        <Link
          href="/feed"
          aria-label="NeedFull home"
          className="flex h-14 shrink-0 items-center px-3 md:justify-center lg:justify-start lg:px-5"
        >
          <span className="hidden md:block">
            <BrandMark wordmarkClass="hidden lg:block text-gray-900 dark:text-white" />
          </span>
        </Link>

        {/* ─── Main Navigation (never scrolls) ─── */}
        {/* WHY: pt-4 pushes the first nav item onto the same horizontal line as
           the greeting (center column) and the wallet card (right rail), which
           both start 16px below their 56px top bands */}
        <nav className="flex-1 space-y-1 overflow-visible px-2 pt-4 md:px-2 lg:px-4">
          {mainNav.map((item) => {
            const active = isActive(item.href);
            const showBadge = item.href === "/chat" && chatUnreadCount > 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`group relative ${NAV_BASE} ${
                  active ? NAV_ACTIVE : NAV_INACTIVE
                }`}
                aria-current={active ? "page" : undefined}
              >
                <span className="relative">
                  <NavIcon
                    icon={item.icon}
                    className="h-5 w-5 shrink-0 text-gray-600 dark:text-gray-300"
                  />
                  {showBadge && (
                    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold leading-none text-white">
                      {chatUnreadCount > 9 ? "9+" : chatUnreadCount}
                    </span>
                  )}
                </span>
                <span className="hidden lg:block">{item.label}</span>
              </Link>
            );
          })}

          {/* ─── Post (primary CTA) ─── */}
          {!isRunner && (
            <Link
              href="/tasks/create"
              title="Post a task"
              className={`flex items-center rounded-full bg-gold font-bold text-white shadow-md shadow-gold/25 transition-all duration-150 hover:brightness-105 hover:shadow-lg active:scale-[0.97] md:mx-auto md:mt-3 md:h-12 md:w-12 lg:mx-0 lg:h-11 lg:w-full lg:justify-center lg:gap-2 lg:px-4 lg:text-[17px]`}
            >
              <Plus className="h-6 w-6 md:h-5 md:w-5" />
              <span className="hidden lg:block">Post</span>
            </Link>
          )}

          {/* ─── More ─── */}
          <div ref={moreRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setMoreOpen(!moreOpen);
                setProfileOpen(false);
              }}
              title="More"
              aria-expanded={moreOpen}
              aria-haspopup="menu"
              className={`group relative ${NAV_BASE} ${
                moreOpen ? NAV_ACTIVE : NAV_INACTIVE
              }`}
            >
              <MoreHorizontal className="h-5 w-5 shrink-0 text-gray-600 dark:text-gray-300" />
              <span className="hidden lg:block">More</span>
            </button>

            <SmartMenu
              open={moreOpen}
              onClose={() => setMoreOpen(false)}
              anchorRef={moreRef}
              ariaLabel="More menu"
              className="w-64"
            >
              {moreItems.map((item, i) => {
                if ("divider" in item) {
                  return <div key={i} className="mx-2 my-1.5 border-t border-gray-100 dark:border-white/10" />;
                }
                return (
                  <MenuLink
                    key={item.label}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    onNavigate={() => setMoreOpen(false)}
                  />
                );
              })}
              {isAdmin && (
                <>
                  <div className="mx-2 my-1.5 border-t border-gray-100 dark:border-white/10" />
                  <MenuLink
                    href="/admin"
                    icon={Shield}
                    label="Admin Dashboard"
                    onNavigate={() => setMoreOpen(false)}
                  />
                </>
              )}
            </SmartMenu>
          </div>
        </nav>

        {/* ─── Promo card (tall screens only — sidebar never scrolls) ─── */}
        <div className="hidden lg:[@media(min-height:860px)]:block lg:px-3 lg:pb-2">
          {isRunner ? (
            <div className="rounded-xl border border-card-border bg-surface p-3 shadow-sm">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-gold" />
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  NeedRunner Dashboard
                </p>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                View available tasks and your earnings at a glance.
              </p>
              <Link
                href="/tasks"
                className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-gold px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.97]"
              >
                Open Dashboard
              </Link>
            </div>
          ) : (
            <div className="group relative overflow-hidden rounded-xl border border-card-border bg-surface p-3 shadow-sm transition-all duration-200 hover:shadow-md">
              <div className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-gold/10" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent" />
              <div className="relative flex items-start gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold-light">
                  <Coins className="h-4 w-4 text-gold-dark" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {isPending ? "Application Pending" : "Start Earning"}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                    {isPending
                      ? "Your application is under review. Check back soon."
                      : (
                        <>
                          Complete nearby tasks and{" "}
                          <span className="font-semibold text-brand-text">earn</span>{" "}
                          with NeedFull.
                        </>
                      )}
                  </p>
                </div>
              </div>
              <div className="relative mt-3 flex gap-1.5">
                <Link
                  href="/become-runner"
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-gold px-2.5 py-2 text-[11px] font-bold text-white shadow-sm transition-all duration-150 hover:brightness-105 active:scale-[0.97] whitespace-nowrap"
                >
                  {isPending ? "View Status" : "Start Earning"}
                </Link>
                {!isPending && (
                  <Link
                    href="/faq"
                    className="inline-flex items-center justify-center gap-1 rounded-lg border-[1.5px] border-brand/25 px-3 py-2 text-[11px] font-semibold text-brand-text transition-all duration-150 hover:border-brand/50 hover:bg-brand-light/40 active:scale-[0.97] whitespace-nowrap"
                  >
                    Learn More
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ─── Profile (fixed bottom) ─── */}
        <div
          ref={profileRef}
          className="relative border-t border-gray-100 p-2 dark:border-white/10 lg:p-3"
        >
          <button
            type="button"
            onClick={() => {
              setProfileOpen(!profileOpen);
              setMoreOpen(false);
            }}
            aria-expanded={profileOpen}
            aria-haspopup="menu"
            className="flex w-full items-center gap-3 rounded-xl p-2 transition-all duration-150 hover:bg-gray-100 active:scale-[0.98] md:justify-center lg:justify-start dark:hover:bg-white/10"
          >
            <span ref={profileAvatarRef} className="inline-flex shrink-0">
              <Avatar
                src={user?.profilePictureUrl}
                name={user?.fullName}
                email={user?.email}
                size="md"
              />
            </span>
            <span className="hidden min-w-0 flex-1 text-left lg:block">
              <span className="block truncate text-[15px] font-bold text-gray-900 dark:text-white">
                {user?.fullName?.split(" ")[0] || "You"}
              </span>
              <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                {user?.email}
              </span>
            </span>
            <ChevronDown
              className={`hidden h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 lg:block ${
                profileOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          <SmartMenu
            open={profileOpen}
            onClose={() => setProfileOpen(false)}
            anchorRef={profileAvatarRef}
            ariaLabel="Profile menu"
            caretLeft={11}
            className="w-64"
          >
            <div className="border-b border-gray-100 px-3 py-2.5 dark:border-white/10">
              <p className="truncate text-[15px] font-bold text-gray-900 dark:text-white">
                {user?.fullName || "Unnamed user"}
              </p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                {user?.email}
              </p>
            </div>
            <div className="pt-1.5">
              <MenuLink href="/profile" icon={User} label="View Profile" onNavigate={() => setProfileOpen(false)} />
              <MenuLink href="/settings" icon={Settings} label="Settings" onNavigate={() => setProfileOpen(false)} />
              <MenuLink href="/wallet" icon={Wallet} label="Wallet" onNavigate={() => setProfileOpen(false)} />
              <div className="mx-2 my-1.5 border-t border-gray-100 dark:border-white/10" />
              <MenuLink href="/" icon={RefreshCcw} label="Switch Account" disabled />
              <MenuLink href="/login" icon={LogOut} label="Logout" danger onNavigate={logout} />
            </div>
          </SmartMenu>
        </div>
      </div>
    </aside>
  );
}
