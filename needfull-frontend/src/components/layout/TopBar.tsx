// WHAT: Global top bar — the single horizontal strip that visually connects
//       the left rail, main column, and right panel (Spotify-style workspace).
// WHY:  One consistent band running edge-to-edge above all three columns so the
//       app reads as a connected workspace instead of stacked independent pages.
// NOTE: Always visible. Brand lives here (not in the sidebar) on desktop.
//       Search opens the CommandPalette (global discovery); the category icon
//       beside it jumps straight to the /categories browse page.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LayoutGrid, Search } from "lucide-react";
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
  const pathname = usePathname();
  const onCategories = pathname === "/categories";

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-brand-dark">
      <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6 lg:px-5">
        {/* Brand — anchor of the entire workspace */}
        <Link href="/feed" aria-label="NeedFull home" className="shrink-0">
          <BrandMark wordmarkClass="text-white hidden sm:inline" />
        </Link>

        {/* Right cluster — pill search, category discovery, notifications, user */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Global search — Spotify-style standalone pill: subtle filled
              surface, fully rounded ends, icon left, shortcut right. */}
          <button
            type="button"
            onClick={onOpenPalette}
            className="hidden h-10 min-h-[44px] items-center gap-2.5 rounded-full px-4 text-white/80 transition-colors hover:bg-white/15 search-pill glass-search md:flex"
            aria-label="Search tasks, NeedRunners, and categories"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium text-white/90">
              Search
              <span className="ml-2 hidden text-xs font-normal text-white/45 lg:inline">
                tasks, NeedRunners, categories
              </span>
            </span>
            <kbd className="hidden rounded-md border border-white/15 bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-white/50 xl:inline">
              ⌘K
            </kbd>
          </button>

          {/* Category discovery — compact standalone pill icon button */}
          <Link
            href="/categories"
            aria-label="Browse categories"
            title="Browse categories"
            aria-current={onCategories ? "page" : undefined}
            className={`hidden h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 md:inline-flex ${
              onCategories
                ? "border-transparent bg-brand-mid text-white hover:bg-brand-mid hover:text-white"
                : "border-white/15 bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
            }`}
          >
            <LayoutGrid
              className={`h-5 w-5 transition-transform duration-150 ${
                onCategories ? "scale-110" : "hover:scale-105"
              }`}
            />
          </Link>

          {/* Mobile: search + categories as compact icon controls */}
          <button
            type="button"
            onClick={onOpenPalette}
            className="inline-flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/80 transition hover:bg-white/20 md:hidden"
            aria-label="Open search"
          >
            <Search className="h-5 w-5" />
          </button>
          <Link
            href="/categories"
            aria-label="Browse categories"
            aria-current={onCategories ? "page" : undefined}
            className={`inline-flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 md:hidden ${
              onCategories
                ? "border-transparent bg-brand-mid text-white"
                : "border-white/15 bg-white/10 text-white/80 hover:bg-white/20"
            }`}
          >
            <LayoutGrid className="h-5 w-5" />
          </Link>
          <button
            type="button"
            onClick={onOpenNotifications}
            className="relative tap-target inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/80 transition hover:bg-white/20"
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