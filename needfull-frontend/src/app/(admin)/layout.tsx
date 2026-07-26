"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { useAuthStore } from "@/store";
import { AdminSidebar } from "@/components/layout/AdminSidebar";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isAdmin = user?.role === "admin";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (!isAdmin) {
      router.replace("/feed");
      return;
    }
  }, [mounted, isAuthenticated, isAdmin, router]);

  if (!mounted || !isAuthenticated || !isAdmin) return null;

  return <>{children}</>;
}

export default function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex flex-col page-shell" style={{ minHeight: "100dvh" }}>
        {/* Mobile top bar */}
        <div className="glass-dark sticky top-0 z-20 flex items-center justify-between px-4 py-3 md:pl-60">
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 text-gold">
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
            <span className="font-display text-base font-bold text-white">
              Admin
            </span>
          </div>
          <Link
            href="/feed"
            className="tap-target flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 transition-colors hover:bg-white/20 ml-auto"
          >
            Exit Admin <LogOut className="h-3 w-3" />
          </Link>
        </div>

        <AdminSidebar />

        {/* Page content with bottom nav padding on mobile, sidebar offset on desktop */}
        <div className="flex-1 pb-20 md:ml-56 md:pb-0">{children}</div>
      </div>
    </AuthGuard>
  );
}
