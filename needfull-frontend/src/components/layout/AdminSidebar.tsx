"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Banknote,
  Users,
  ClipboardList,
  Clock,
  Flag,
  Shield,
  ShieldCheck,
  ListChecks,
  Zap,
  LogOut,
  MoreHorizontal,
} from "lucide-react";
import { useAuthStore } from "@/store";

const ADMIN_TABS: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isMore?: boolean;
}[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/deposits", label: "Deposits", icon: Banknote },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/tasks", label: "Tasks", icon: ClipboardList },
  { href: "/admin/more", label: "More", icon: MoreHorizontal, isMore: true },
];

const MORE_ITEMS = [
  { href: "/admin/purchases", label: "Escrow", icon: ShieldCheck },
  { href: "/admin/withdrawals", label: "Withdrawals", icon: Clock },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/verifications", label: "Verifications", icon: Shield },
  { href: "/admin/runner-applications", label: "Runner Applications", icon: Zap },
  { href: "/admin/transactions", label: "Transactions", icon: ListChecks },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      {showMore && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setShowMore(false)}
          />
          <div className="fixed bottom-20 left-1/2 z-50 w-64 -translate-x-1/2 rounded-2xl border border-card-border bg-surface p-2 shadow-lifted">
            {MORE_ITEMS.map(({ href, label, icon: Icon }) => {
              const isActive =
                pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setShowMore(false)}
                  className={`tap-target flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-brand-light text-brand"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* Mobile: bottom navigation bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-card-border bg-surface md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex max-w-lg items-center justify-around px-2">
          {ADMIN_TABS.map(({ href, label, icon: Icon, isMore }) => {
            if (isMore) {
              return (
                <button
                  key="more"
                  type="button"
                  onClick={() => setShowMore((p) => !p)}
                  className="tap-target relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-13 text-gray-500"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{label}</span>
                </button>
              );
            }
            const isActive =
              pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`tap-target relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-13 transition-all duration-200 ${
                  isActive ? "text-brand" : "text-gray-500"
                }`}
              >
                <div
                  className={`flex items-center justify-center rounded-xl px-3 py-1.5 transition-all duration-200 ${
                    isActive ? "bg-brand-light/60" : ""
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 transition-all duration-200 ${isActive ? "scale-110" : ""}`}
                  />
                </div>
                <span
                  className={`text-[10px] transition-all duration-200 ${
                    isActive ? "font-bold" : "font-medium"
                  }`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop: fixed left sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-56 md:fixed md:left-0 md:top-0 md:h-full md:border-r md:border-card-border md:bg-surface md:z-30">
        <div className="flex items-center gap-2 px-4 py-4 border-b border-card-border">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-gold">
            <svg viewBox="0 3 36 30" fill="none" className="w-4.5 h-4.5">
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
          <span className="font-display text-base font-bold text-gray-900">
            Admin
          </span>
        </div>
        <nav className="flex-1 space-y-0.5 px-2 py-3 overflow-y-auto">
          {[
            ...ADMIN_TABS.filter((t) => !("isMore" in t && t.isMore)),
            ...MORE_ITEMS,
          ].map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`tap-target flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-brand-light text-brand"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-card-border px-2 py-3">
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="tap-target flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
