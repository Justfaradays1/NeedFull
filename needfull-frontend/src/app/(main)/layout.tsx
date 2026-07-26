// WHAT: Protected layout with bottom navigation for main app pages
// WHY: Auth guard prevents unauthenticated access, bottom nav provides primary navigation
// FUTURE: Add real-time unread badge via Socket.io, add deep link handling, add tab transition animations

"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  Search,
  ChevronDown,
  Shield,
  ShieldCheck,
  User,
  LogOut,
  House,
  Compass,
  ListTodo,
  MessageCircle,
  CirclePlus,
  BellRing,
  Bookmark,
  ClipboardCheck,
  Wallet,
  Settings,
  HelpCircle,
  Zap,
  Eye,
  ChevronRight,
  Award,
  DollarSign,
} from "lucide-react";
import {
  useAuthStore,
  useAuthUser,
  useUserRoles,
  useActiveRole,
} from "@/store";
import { Avatar } from "@/components/ui/avatar";
import { Dropdown } from "@/components/ui/dropdown";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { NotificationDrawer } from "@/components/ui/NotificationDrawer";

import { useNotifications } from "@/hooks/useNotifications";

const POSTER_TABS = [
  { href: "/feed", label: "Home", icon: "House" },
  { href: "/explore", label: "Explore", icon: "Compass" },
  { href: "/post", label: "Post", icon: "CirclePlus", isFab: true },
  { href: "/chat", label: "Chat", icon: "MessageCircle" },
  { href: "/profile", label: "Profile", icon: "User" },
] as const;

const RUNNER_TABS = [
  { href: "/feed", label: "Home", icon: "House" },
  { href: "/tasks", label: "Tasks", icon: "ListTodo" },
  { href: "/wallet", label: "Earnings", icon: "Wallet" },
  { href: "/chat", label: "Chat", icon: "MessageCircle" },
  { href: "/profile", label: "Profile", icon: "User" },
] as const;

// WHAT: Defer heavy icon imports to avoid WASM SWC compilation issues
// WHY: WASM SWC can fail on lucide-react dynamic icon resolution
function TabIcon({ icon, className }: { icon: string; className?: string }) {
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
          House: mod.House,
          Compass: mod.Compass,
          CirclePlus: mod.CirclePlus,
          MessageCircle: mod.MessageCircle,
          User: mod.User,
          ChevronLeft: mod.ChevronLeft,
          ListTodo: mod.ListTodo,
          Wallet: mod.Wallet,
        };
        setIcon(() => Icons[icon]);
      })
      .catch(() => {
        if (!cancelled)
          setIcon(() => () => (
            <span
              style={{
                width: className?.includes("h-7") ? 28 : 20,
                height: className?.includes("h-7") ? 28 : 20,
              }}
            />
          ));
      });
    return () => {
      cancelled = true;
    };
  }, [icon]);

  if (!Icon)
    return (
      <span
        style={{
          width: className?.includes("h-7") ? 28 : 20,
          height: className?.includes("h-7") ? 28 : 20,
        }}
      />
    );
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

function NavSidebarContent({
  user,
  roles,
  pathname,
}: {
  user: any;
  roles: string[];
  pathname: string;
}) {
  const isRunner = roles.includes("runner");

  useEffect(() => {
    useAuthStore.getState().refreshUser();
  }, [pathname]);

  const isPending = user?.runnerStatus === "pending";

  return (
    <div className="flex flex-col h-full px-3 py-4 sidebar-scroll">
      {/* ─── CTA Card ─── */}
      {isRunner ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/40 p-3 shadow-sm dark:border-amber-800/50 dark:from-amber-950/60 dark:to-amber-900/30">
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
      ) : (
        <div className="relative mb-4 overflow-hidden rounded-xl border border-amber-200/70 bg-gradient-to-br from-amber-50 via-amber-50/60 to-white p-3 shadow-sm transition-all hover:shadow-md dark:border-amber-800/40 dark:from-amber-950/50 dark:via-amber-950/30 dark:to-amber-950/20">
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
      )}

      {/* ─── Navigation ─── */}
      <nav className="flex-1 space-y-2">
        {/* MAIN — always visible */}
        <div>
          <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
            Main
          </p>
          <div className="space-y-0.5">
            {[
              { href: "/feed", label: "Home", icon: House },
              { href: "/explore", label: "Explore", icon: Compass },
              { href: "/tasks", label: "Browse Tasks", icon: ListTodo },
            ].map(({ href, label, icon: Icon }) => {
              const isActive =
                pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={`tap-target flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-brand-light/80 text-brand font-bold shadow-sm ring-1 ring-brand/20"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 shrink-0 transition-colors ${
                      isActive ? "text-brand" : "text-gray-400"
                    }`}
                  />
                  <span>{label}</span>
                </Link>
              );
            })}
            {/* Post Task — prominent CTA */}
            <Link
              href="/tasks/create"
              className="tap-target group mt-1 flex items-center gap-3 rounded-xl bg-brand px-3 py-3 text-sm font-bold text-white shadow-md shadow-brand/20 transition-all duration-150 hover:shadow-lg hover:shadow-brand/25 active:scale-[0.98]"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 transition-colors group-hover:bg-white/25">
                <CirclePlus className="h-5 w-5" />
              </div>
              <span>Post Task</span>
              <ChevronRight className="ml-auto h-4 w-4 text-white/60" />
            </Link>
          </div>
        </div>

        {/* COMMUNITY — collapsible, closed by default */}
        <SidebarSection label="Community">
          {[
            { href: "/chat", label: "Chat", icon: MessageCircle },
            { href: "/notifications", label: "Notifications", icon: BellRing },
            { href: "#", label: "Saved", icon: Bookmark, disabled: true },
            { href: "#", label: "My Applications", icon: ClipboardCheck, disabled: true },
          ].map(({ href, label, icon: Icon, disabled }) => {
            const isActive =
              !disabled &&
              (pathname === href || pathname.startsWith(href + "/"));
            if (disabled) {
              return (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-400 cursor-not-allowed"
                >
                  <Icon className="h-5 w-5 shrink-0 text-gray-300" />
                  <span>{label}</span>
                  <span className="ml-auto text-[9px] font-medium text-gray-300">
                    Soon
                  </span>
                </div>
              );
            }
            return (
              <Link
                key={href}
                href={href}
                className={`tap-target flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-brand-light/80 text-brand font-bold shadow-sm ring-1 ring-brand/20"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 transition-colors ${
                    isActive ? "text-brand" : "text-gray-400"
                  }`}
                />
                <span>{label}</span>
              </Link>
            );
          })}
        </SidebarSection>

        {/* ACCOUNT — collapsible, closed by default */}
        <SidebarSection label="Account">
          {[
            { href: "/profile", label: "Profile", icon: User },
            { href: "/wallet", label: "Wallet", icon: Wallet },
            { href: "/settings", label: "Settings", icon: Settings },
            { href: "/settings", label: "Help & Support", icon: HelpCircle },
          ].map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={label}
                href={href}
                className={`tap-target flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-brand-light/80 text-brand font-bold shadow-sm ring-1 ring-brand/20"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 transition-colors ${
                    isActive ? "text-brand" : "text-gray-400"
                  }`}
                />
                <span>{label}</span>
              </Link>
            );
          })}
        </SidebarSection>
      </nav>

      {/* ─── Sign Out ─── */}
      <div className="mt-4 shrink-0 border-t border-gray-100 pt-3">
        <button
          type="button"
          onClick={() => {
            useAuthStore.getState().logout();
            window.location.href = "/login";
          }}
          className="tap-target flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition-all hover:bg-red-50 active:scale-[0.98]"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [mounted, setMounted] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const recoveryAttempted = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem("nf_access_token");
    setHasToken(!!token);
    setMounted(true);
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
      try {
        const raw = localStorage.getItem("nf-auth");
        if (raw) {
          const parsed = JSON.parse(raw);
          // zustand 4.5 stores as { state: {...}, version: 0 }
          const stored = parsed?.state ?? parsed;
          if (stored?.isAuthenticated === true && stored?.user?.id) {
            if (!cancelled) {
              useAuthStore.getState().setUser(stored.user);
              return;
            }
          }
        }
      } catch { /* corrupt data — fall through to API */ }

      // 2) Fetch user from the API using the raw token
      try {
        const token = localStorage.getItem("nf_access_token");
        if (!token) throw new Error("no token");
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/me`,
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
            wallet: (json.wallet ?? raw.wallet)
              ? { id: (json.wallet ?? raw.wallet).id, balanceKobo: (json.wallet ?? raw.wallet).balanceKobo, escrowKobo: (json.wallet ?? raw.wallet).escrowKobo }
              : undefined,
          });
        }
      } catch {
        if (!cancelled) {
          useAuthStore.getState().logout();
          router.replace("/login");
        }
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

function UnreadBadge() {
  const [count, setCount] = useState(0);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    import("@/lib/apiClient").then((mod) => {
      mod.default
        .get("/notifications/unread-count")
        .then((res) => setCount(res.data?.data?.count ?? 0))
        .catch(() => {});
    });
  }, [isAuthenticated]);

  return count > 0 ? (
    <span className="absolute -right-1.5 -top-1 flex min-w-4 items-center justify-center rounded-full bg-danger px-1 py-px text-[9px] font-bold leading-none text-white">
      {count > 99 ? "99+" : count}
    </span>
  ) : null;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const user = useAuthUser();
  const roles = useUserRoles();
  const activeRole = useActiveRole();

  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const {
    notifications,
    groupedNotifications,
    unreadCount,
    loading: notificationsLoading,
    markAllAsRead,
  } = useNotifications();
  const router = useRouter();

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
            <p className="truncate text-sm font-bold text-gray-900">
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
            <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-700 dark:bg-amber-950/20">
              {roles.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={async () => {
                    if (role === activeRole) return;
                    try {
                      const res = await import("@/lib/apiClient").then((mod) =>
                        mod.post<{
                          success: boolean;
                          data: { activeRole: string };
                        }>("/users/me/switch-role", { role }),
                      );
                      if (res.success && user) {
                        useAuthStore
                          .getState()
                          .setUser({ ...user, activeRole: res.data.activeRole });
                      }
                    } catch {
                      console.error("Failed to switch role");
                    }
                  }}
                  className={`flex-1 rounded-[10px] px-3 py-2 text-center text-sm font-medium transition-all ${
                    role === activeRole
                      ? "bg-white text-brand shadow-sm dark:bg-amber-950/60 dark:text-amber-300"
                      : "text-gray-600 hover:text-gray-900 dark:text-amber-400/70 dark:hover:text-amber-200"
                  }`}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
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
      className="flex flex-col md:flex-row page-shell"
      style={{ minHeight: "100dvh" }}
    >
      {/* ─── Desktop Sidebar ─── */}
      <aside className="hidden md:flex md:flex-col md:w-72 md:shrink-0 md:border-r md:border-gray-200 md:bg-surface/95 md:backdrop-blur-xl" style={{ height: "100dvh" }}>
        <NavSidebarContent
          user={user}
          roles={roles}
          pathname={pathname}
        />
      </aside>

      {/* ─── Main Content Area ─── */}
      <div className="flex flex-col flex-1 min-w-0" style={{ height: "100dvh" }}>
        <AuthGuard>
          <div className="glass-dark sticky top-0 z-30">
            <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
              <Link
                href="/feed"
                className="flex items-center gap-2 shrink-0"
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-gold"
                  style={{ boxShadow: "inset 0 1px 0 rgba(234,163,37,0.3)" }}
                >
                  <svg
                    viewBox="0 3 36 30"
                    fill="none"
                    className="h-6 w-6"
                    aria-hidden="true"
                  >
                    <rect
                      x="12"
                      y="24"
                      width="16"
                      height="2.5"
                      rx="1.25"
                      fill="currentColor"
                      opacity="0.18"
                    />
                    <rect
                      x="2"
                      y="27.5"
                      width="26"
                      height="3"
                      rx="1.5"
                      fill="currentColor"
                      opacity="0.28"
                    />
                    <circle cx="23" cy="9" r="4" fill="currentColor" />
                    <path
                      d="M23 13v8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M23 19.5l-2.5 4.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M23 19.5l2.5 4.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M23 15.5l-7 2.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <circle cx="8" cy="14" r="4" fill="white" fillOpacity="0.9" />
                    <path
                      d="M8 18v8"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeOpacity="0.9"
                    />
                    <path
                      d="M8 24.5l-2 4"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeOpacity="0.9"
                    />
                    <path
                      d="M8 24.5l2 4"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeOpacity="0.9"
                    />
                    <path
                      d="M8 20l7.5-1"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeOpacity="0.9"
                    />
                    <circle cx="16" cy="21" r="2.5" fill="currentColor" />
                    <circle cx="16" cy="21" r="1.5" fill="#1A6B4A" />
                  </svg>
                </div>
                <span className="font-bold text-base leading-none font-display text-white">
                  NeedFull
                </span>
              </Link>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaletteOpen(true)}
                  className="hidden h-10 min-h-[44px] items-center gap-1.5 rounded-2xl border border-white/15 bg-white/10 px-3 text-white/80 transition hover:bg-white/20 md:inline-flex"
                  aria-label="Search tasks"
                >
                  <Search className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium">Search</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPaletteOpen(true)}
                  className="inline-flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white/80 transition hover:bg-white/20 md:hidden max-[380px]:hidden"
                  aria-label="Open search"
                >
                  <Search className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsNotificationsOpen(true)}
                  className="relative tap-target inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white/80 transition hover:bg-white/20"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 ? (
                    <span className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-danger px-1.5 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  ) : null}
                </button>
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
              </div>
            </div>
          </div>

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

          <div
            className="flex-1 overflow-y-auto pb-nav md:pb-0"
            style={{ minHeight: 0 }}
          >
            {children}
          </div>
        </AuthGuard>

        <nav
          className="glass-white fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-lg rounded-3xl border border-slate-200/70 px-3 py-3 shadow-2xl shadow-slate-900/10 backdrop-blur-2xl md:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex items-center justify-between gap-2 px-1">
            {(activeRole === "runner" ? RUNNER_TABS : POSTER_TABS).map((tab) => {
              const { href, label, icon } = tab;
              const isFab = "isFab" in tab && tab.isFab;
              const isActive =
                pathname === href || pathname.startsWith(href + "/");
              const isRunner = activeRole === "runner";
              const activeColor = isRunner ? "text-gold" : "text-brand";
              const activeBg = isRunner ? "bg-gold-light/70 shadow-sm shadow-gold/10" : "bg-brand-light/70 shadow-sm shadow-brand/10";
              const activeText = isRunner ? "text-gold" : "text-brand";
              const activeIconColor = isRunner ? "text-gold scale-110" : "text-brand scale-110";

              if (isFab) {
                return (
                  <Link
                    key={href}
                    href={href}
                    className="glass-gold relative -mt-5 flex h-14 w-14 items-center justify-center rounded-3xl text-white shadow-xl transition-all duration-200 active:scale-95 hover:shadow-2xl"
                    style={{ flex: "none" }}
                    aria-label={label}
                  >
                    <TabIcon icon={icon} className="h-6 w-6" />
                  </Link>
                );
              }

              return (
                <Link
                  key={href}
                  href={href}
                  className={`tap-target relative flex flex-1 flex-col items-center justify-center gap-1 rounded-3xl px-2 py-2 min-h-15 transition-all duration-200 ${
                    isActive ? activeColor : "text-slate-600"
                  }`}
                  aria-label={label}
                >
                  <div
                    className={`relative flex items-center justify-center rounded-2xl px-3 py-2 transition-all duration-200 ${
                      isActive ? activeBg : "bg-transparent"
                    }`}
                  >
                    <TabIcon
                      icon={icon}
                      className={`h-6 w-6 transition-all duration-200 ${isActive ? activeIconColor : "text-slate-500"}`}
                    />
                    {label === "Chat" && <UnreadBadge />}
                  </div>
                  <span
                    className={`text-[11px] transition-all duration-200 ${
                      isActive
                        ? `font-semibold ${activeText}`
                        : "font-semibold text-slate-600"
                    }`}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
