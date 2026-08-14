// WHAT: Protected layout with bottom navigation for main app pages
// WHY: Auth guard prevents unauthenticated access, bottom nav provides primary navigation
// FUTURE: Add real-time unread badge via Socket.io, add deep link handling, add tab transition animations

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  ChevronDown,
  Shield,
  User,
  LogOut,
} from "lucide-react";
import {
  useAuthStore,
  useAuthUser,
  useUserRoles,
  useActiveRole,
} from "@/store";
import type { AuthUser } from "@/store/authStore";
import { Avatar } from "@/components/ui/avatar";
import { Dropdown } from "@/components/ui/dropdown";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { NotificationDrawer } from "@/components/ui/NotificationDrawer";
import { TopBar } from "@/components/layout/TopBar";
import { DesktopSidebar, NavIcon } from "@/components/layout/DesktopSidebar";
import { DesktopContextPanel } from "@/components/layout/DesktopContextPanel";
import { DesktopFloatingActions } from "@/components/layout/DesktopFloatingActions";

import { useNotifications } from "@/hooks/useNotifications";
import { useChatUnread } from "@/hooks/useChatUnread";
import { useSmartScroll } from "@/hooks/useSmartScroll";
import toast from "react-hot-toast";
import { POSTER_NAV, RUNNER_NAV } from "@/lib/navConfig";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [mounted, setMounted] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const recoveryAttempted = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => {
      const token = localStorage.getItem("nf_access_token");
      setHasToken(!!token);
      setMounted(true);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // Redirect to login only when we're certain there's no token.
  useEffect(() => {
    if (mounted && !isAuthenticated && !hasToken) {
      router.replace("/login");
    }
  }, [mounted, isAuthenticated, hasToken, router]);

  // Recovery: if token exists but persist hasn't hydrated the store
  // (isAuthenticated stays false), attempt to restore from localStorage
  // directly or fetch user from the API.
  useEffect(() => {
    if (!mounted || isAuthenticated || !hasToken) return;
    if (recoveryAttempted.current) return;
    recoveryAttempted.current = true;

    let cancelled = false;

    const recover = async () => {
      // 1) Try to restore user from zustand's persisted data in localStorage
      //    as a FALLBACK — never prefer it over a fresh /auth/me response,
      //    or profile changes (e.g. a new avatar) would stay hidden until
      //    the cache expires.
      let cached: AuthUser | null = null;
      try {
        const raw = localStorage.getItem("nf-auth");
        if (raw) {
          const parsed = JSON.parse(raw);
          // zustand 4.5 stores as { state: {...}, version: 0 }
          const stored = parsed?.state ?? parsed;
          if (stored?.isAuthenticated === true && stored?.user?.id) {
            cached = stored.user as AuthUser;
          }
        }
      } catch { /* corrupt data — fall through to API */ }

      // 2) Fetch user from the API using the raw token
      try {
        const token = localStorage.getItem("nf_access_token");
        if (!token) throw new Error("no token");
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "https://needfull.onrender.com/api"}/auth/me`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok) throw new Error("API rejected token");
        const json = await res.json();
        const raw = json.user ?? json.data;
        if (!cancelled && raw?.id) {
          useAuthStore.getState().setUser({
            id: raw.id,
            email: raw.email,
            fullName: raw.fullName ?? raw.full_name ?? "",
            role: raw.role ?? "user",
            roles: raw.roles ?? ["poster"],
            activeRole: raw.activeRole ?? raw.active_role ?? "poster",
            emailVerified: raw.emailVerified ?? !!raw.email_verified_at,
            trustScore: raw.trustScore ?? raw.trust_score ?? 0,
            profilePictureUrl: raw.profilePictureUrl ?? null,
            isAvailable: raw.isAvailable ?? raw.is_available ?? false,
            runnerBusy: raw.runnerBusy ?? raw.runner_busy ?? false,
            runnerStatus: raw.runnerStatus ?? "none",
            wallet: (json.wallet ?? raw.wallet)
              ? { id: (json.wallet ?? raw.wallet).id, balanceKobo: (json.wallet ?? raw.wallet).balanceKobo ?? 0, escrowKobo: (json.wallet ?? raw.wallet).escrowKobo ?? 0, earningsKobo: (json.wallet ?? raw.wallet).earningsKobo ?? 0, pendingKobo: (json.wallet ?? raw.wallet).pendingKobo ?? 0 }
              : undefined,
          });
          return;
        }
      } catch { /* offline / server down — fall through to cache */ }

      // 3) Offline fallback — restore the last known good cached user
      if (!cancelled && cached) {
        useAuthStore.getState().setUser(cached);
      } else if (!cancelled && !cached) {
        useAuthStore.getState().logout();
        router.replace("/login");
      }
    };

    recover();
    return () => { cancelled = true; };
  }, [mounted, isAuthenticated, hasToken, router]);

  if (!mounted) return null;

  if (!isAuthenticated) {
    if (hasToken) {
      return (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        </div>
      );
    }
    return null;
  }

  return <>{children}</>;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const user = useAuthUser();
  const roles = useUserRoles();
  const activeRole = useActiveRole();

  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [switchingRole, setSwitchingRole] = useState<string | null>(null);
  const {
    notifications,
    groupedNotifications,
    unreadCount,
    loading: notificationsLoading,
    markAllAsRead,
  } = useNotifications();
  const { unreadCount: chatUnreadCount, refreshChatUnread } = useChatUnread();
  const router = useRouter();
  const { hidden: chromeHidden } = useSmartScroll();

  // Refresh chat unread count whenever the route changes (e.g. after
  // reading messages in /chat, the badge updates on the way back)
  useEffect(() => {
    refreshChatUnread();
  }, [pathname, refreshChatUnread]);

  // Mirror the active role onto <html data-role> so global CSS (e.g. the
  // search-pill focus ring) can theme poster (green) vs runner (gold).
  useEffect(() => {
    const role = activeRole === "runner" ? "runner" : "poster";
    document.documentElement.setAttribute("data-role", role);
  }, [activeRole]);

  // Open the command palette from the right context panel's search bar
  useEffect(() => {
    const onOpen = () => setIsPaletteOpen(true);
    window.addEventListener("nf:open-command-palette", onOpen);
    return () => window.removeEventListener("nf:open-command-palette", onOpen);
  }, []);

  const avatarMenuItems = [
    {
      key: "header",
      render: () => (
        <div className="flex items-center gap-3 border-b border-card-border px-4 py-3">
          <Avatar
            src={user?.profilePictureUrl}
            name={user?.fullName}
            email={user?.email}
            size="lg"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground-strong">
              {user?.fullName || "Unnamed user"}
            </p>
            <p className="truncate text-[11px] text-gray-500">
              {activeRole?.charAt(0).toUpperCase() + activeRole?.slice(1)} Role
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "profile",
      label: "My Profile",
      icon: <User size={16} />,
      onClick: () => router.push("/profile"),
    },
    {
      key: "switch-role",
      render: () =>
        roles.length > 1 ? (
          <div className="space-y-1 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.24em] text-gray-500">
              Switch role
            </p>
            <div className="flex rounded-xl border border-border-default bg-surface-secondary p-0.5 dark:border-gray-700 dark:bg-amber-950/20">
              {roles.map((role) => (
                <button
                  key={role}
                  type="button"
                  disabled={switchingRole !== null}
                  onClick={async () => {
                    if (role === activeRole || switchingRole) return;
                    setSwitchingRole(role);
                    try {
                      const res = await import("@/lib/apiClient").then((mod) =>
                        mod.post<{
                          success: boolean;
                          message?: string;
                          data: { activeRole: string };
                        }>("/users/me/switch-role", { role }),
                      );
                      if (res.success && user) {
                        useAuthStore
                          .getState()
                          .setUser({ ...user, activeRole: res.data.activeRole });
                        toast.success(
                          `Switched to ${role.charAt(0).toUpperCase() + role.slice(1)}`,
                        );
                      } else {
                        toast.error(res.message || "Failed to switch role");
                      }
                    } catch (err: unknown) {
                      const message =
                        err instanceof Error && err.message === "Network Error"
                          ? "Can't reach the server. Check your connection."
                          : "Failed to switch role. Please try again.";
                      toast.error(message);
                      console.error("Failed to switch role", err);
                    } finally {
                      setSwitchingRole(null);
                    }
                  }}
                  className={`flex-1 rounded-[10px] px-3 py-2 text-center text-sm font-medium transition-all ${
                    role === activeRole
                      ? "bg-surface text-brand shadow-sm dark:bg-amber-950/60 dark:text-amber-300"
                      : "text-foreground-secondary hover:text-foreground-strong dark:text-amber-400/70 dark:hover:text-amber-200 disabled:opacity-60"
                  }`}
                >
                  {switchingRole === role
                    ? "…"
                    : role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
            </div>
          </div>
        ) : null,
    },
    {
      key: "theme",
      render: () => (
        <div className="px-4 py-3">
          <p className="text-xs uppercase tracking-[0.24em] text-gray-500">
            Theme
          </p>
          <div className="mt-2">
            <ThemeToggle />
          </div>
        </div>
      ),
    },
    {
      key: "divider",
      render: () => <div className="border-t border-card-border" />,
    },
    {
      key: "help",
      label: "Help & Support",
      icon: <Shield size={16} />,
      onClick: () => router.push("/settings"),
    },
    {
      key: "signout",
      label: "Sign Out",
      icon: <LogOut size={16} />,
      variant: "danger" as const,
      onClick: () => {
        useAuthStore.getState().logout();
        router.push("/login");
      },
    },
  ];

  return (
    <div
      className="page-shell md:flex md:flex-col"
      style={{ minHeight: "100dvh" }}
    >
      {/* ─── Global Top Bar — spans all three columns ─── */}
      <TopBar
        onOpenPalette={() => setIsPaletteOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        unreadCount={unreadCount}
        right={
          <Dropdown items={avatarMenuItems} align="right">
            <button
              type="button"
              className="tap-target inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm text-white transition hover:bg-white/20"
              aria-label="Open profile menu"
            >
              <Avatar
                src={user?.profilePictureUrl}
                name={user?.fullName}
                email={user?.email}
                size="sm"
              />
              <span className="hidden truncate text-sm font-semibold md:inline-block">
                {user?.fullName?.split(" ")[0] || "You"}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-white/60" />
            </button>
          </Dropdown>
        }
      />

      {/* ─── Workspace row: Left rail | Main | Right rail ─── */}
      <div className="flex flex-1 md:overflow-hidden">
        {/* ─── Left Sidebar (permanent rail) ─── */}
        <DesktopSidebar
          user={user}
          activeRole={activeRole}
          pathname={pathname}
          chatUnreadCount={chatUnreadCount}
        />

        {/* ─── Main Content (independent scroll pane) ─── */}
        <main className="workspace-scroll relative min-w-0 flex-1 md:h-[calc(100dvh-3.5rem)] md:overflow-y-auto">
          <AuthGuard>
            <CommandPalette
              open={isPaletteOpen}
              onClose={() => setIsPaletteOpen(false)}
            />
            <NotificationDrawer
              open={isNotificationsOpen}
              onClose={() => setIsNotificationsOpen(false)}
              notifications={notifications}
              groupedNotifications={groupedNotifications}
              unreadCount={unreadCount}
              loading={notificationsLoading}
              markAllAsRead={markAllAsRead}
            />
            <div className="pb-nav md:pb-0">{children}</div>
          </AuthGuard>
        </main>

        {/* ─── Right Context Panel (xl+) ─── */}
        <DesktopContextPanel pathname={pathname} />
      </div>

      {/* ─── Mobile bottom nav ─── */}
      <nav
        className={`glass-white fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-lg rounded-3xl border border-slate-200/70 px-3 py-3 shadow-2xl shadow-slate-900/10 backdrop-blur-2xl transition-opacity duration-300 md:hidden ${
          chromeHidden ? "opacity-75" : "opacity-100"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center justify-between gap-2 px-1">
          {(activeRole === "runner" ? RUNNER_NAV : POSTER_NAV)
            .filter((n) => n.mobileTab)
            .map((tab) => {
            const { href, label, icon } = tab;
            const isCta = tab.isCta;
            const isActive =
              pathname === href || pathname.startsWith(href + "/");
            const isRunner = activeRole === "runner";
            const activeColor = isRunner ? "text-gold" : "text-brand-text";
            const activeBg = isRunner ? "bg-gold-light/70 shadow-sm shadow-gold/10" : "bg-brand-light/70 shadow-sm shadow-brand/10";
            const activeText = isRunner ? "text-gold" : "text-brand-text";
            const activeIconColor = isRunner ? "text-gold scale-110" : "text-brand-text scale-110";

            if (isCta) {
              return (
                <Link
                  key={href}
                  href={href}
                  className="glass-gold relative -mt-5 flex h-14 w-14 items-center justify-center rounded-3xl text-white shadow-xl transition-all duration-200 active:scale-95 hover:shadow-2xl"
                  style={{ flex: "none" }}
                  aria-label={label}
                >
                  <NavIcon icon={icon} className="h-6 w-6" />
                </Link>
              );
            }

            return (
              <Link
                key={href}
                href={href}
                className={`tap-target relative flex flex-1 flex-col items-center justify-center gap-1 rounded-3xl px-2 py-2 transition-all duration-200 ${
                  isActive ? activeColor : "text-foreground-secondary"
                }`}
                aria-label={label}
              >
                <div
                  className={`relative flex items-center justify-center rounded-2xl px-3 py-2 transition-all duration-200 ${
                    isActive ? activeBg : "bg-transparent"
                  }`}
                >
                  <NavIcon
                    icon={icon}
                    className={`h-6 w-6 transition-all duration-200 ${isActive ? activeIconColor : "text-foreground-muted"}`}
                  />
                  {label === "Chat" && chatUnreadCount > 0 ? (
                    <span className="absolute -right-1.5 -top-1 flex min-w-4 items-center justify-center rounded-full bg-danger px-1 py-px text-[9px] font-bold leading-none text-white">
                      {chatUnreadCount > 9 ? "9+" : chatUnreadCount}
                    </span>
                  ) : null}
                </div>
                <span
                  className={`text-[11px] transition-all duration-200 ${
                    isActive
                      ? `font-semibold ${activeText}`
                      : "font-semibold text-foreground-secondary"
                  }`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ─── Floating Actions (tablet+) ─── */}
      <DesktopFloatingActions
        pathname={pathname}
        chatUnreadCount={chatUnreadCount}
        dimmed={chromeHidden}
      />
    </div>
  );
}
