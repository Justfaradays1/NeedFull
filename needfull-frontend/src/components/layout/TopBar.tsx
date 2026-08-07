// WHAT: Global top bar — the single horizontal strip that visually connects
//       the left rail, main column, and right panel (Spotify-style workspace).
// WHY:  One consistent band running edge-to-edge above all three columns so the
//       app reads as a connected workspace instead of stacked independent pages.
// NOTE: Always visible. Brand lives here (not in the sidebar) on desktop.

"use client";

import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { BrandMark } from "@/components/ui/BrandMark";

export function TopBar({
  onOpenPalette,
  onOpenNotifications,
  unreadCount,
  right,
}: {
  onOpenPalette: () => void;
  onOpenNotifications: () => void;
  unreadCount: number;
  right?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-brand-dark">
      <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6 lg:px-5">
        {/* Brand — anchor of the entire workspace */}
        <Link href="/feed" aria-label="NeedFull home" className="shrink-0">
          <BrandMark wordmarkClass="text-white hidden sm:inline" />
        </Link>

        {/* Right cluster — search, notifications, user menu */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onOpenPalette}
            className="hidden h-10 min-h-[44px] items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 text-white/80 transition hover:bg-white/20 md:inline-flex"
            aria-label="Search tasks and runners"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium">Search</span>
            <kbd className="hidden rounded-md border border-white/15 bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-white/50 xl:inline">
              ⌘K
            </kbd>
          </button>
          <button
            type="button"
            onClick={onOpenPalette}
            className="inline-flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white/80 transition hover:bg-white/20 md:hidden"
            aria-label="Open search"
          >
            <Search className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onOpenNotifications}
            className="relative tap-target inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white/80 transition hover:bg-white/20"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-danger px-1.5 text-[10px] font-bold leading-none text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </button>
          {right}
        </div>
      </div>
    </header>
  );
}