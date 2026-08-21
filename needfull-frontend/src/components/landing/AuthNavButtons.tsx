// WHAT: Auth-aware navbar actions
// WHY: A logged-in visitor should see a path into the app, not a second
//      sign-in prompt. Reads the shared auth store (client-side).

"use client";

import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export function AuthNavButtons() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return (
      <Link
        href="/feed"
        className="inline-flex items-center gap-2 rounded-lg bg-gold px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-150 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
      >
        <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
        My dashboard
      </Link>
    );
  }

  return (
    <>
      <Link
        href="/login"
        className="inline-flex items-center rounded-lg px-4 py-2.5 text-sm font-semibold text-foreground-secondary transition-colors duration-150 hover:bg-surface-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        Sign in
      </Link>
      <Link
        href="/register"
        className="inline-flex items-center rounded-lg bg-gold px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-150 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
      >
        Get started
      </Link>
    </>
  );
}