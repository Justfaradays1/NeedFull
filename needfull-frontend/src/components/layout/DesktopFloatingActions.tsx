// WHAT: Floating action buttons for desktop (Messages + Post a Task)
// WHY: Keeps the two most-used actions one tap away without crowding the header;
//      hidden on mobile where the bottom nav already provides both

"use client";

import Link from "next/link";
import { MessageCircle, Plus } from "lucide-react";

export function DesktopFloatingActions({
  pathname,
  chatUnreadCount,
}: {
  pathname: string;
  chatUnreadCount: number;
}) {
  if (pathname.startsWith("/tasks/create")) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 hidden flex-col items-center gap-3 md:flex">
      {/* ─── Messages (laptop+) ─── */}
      <Link
        href="/chat"
        className="group relative hidden h-16 w-16 items-center justify-center rounded-full border-2 border-amber-300 bg-surface text-brand-text shadow-xl shadow-amber-300/45 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-amber-300/55 active:scale-95 lg:flex"
        aria-label="Open messages"
      >
        <span className="relative">
          <MessageCircle className="h-7 w-7" />
          {chatUnreadCount > 0 && (
            <span className="absolute -right-3 -top-2.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[10px] font-bold leading-none text-white">
              {chatUnreadCount > 9 ? "9+" : chatUnreadCount}
            </span>
          )}
        </span>
        <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
          Messages
        </span>
      </Link>

      {/* ─── Post a Task (tablet+) ─── */}
      <Link
        href="/tasks/create"
        className="group relative flex items-center rounded-full bg-gold px-4 py-3 text-white shadow-lifted transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-lg active:scale-95"
        aria-label="Post a task"
      >
        <Plus className="h-5 w-5" />
        <span className="ml-2 hidden text-sm font-bold sm:inline">Post a Task</span>
        <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 lg:hidden">
          Post a Task
        </span>
      </Link>
    </div>
  );
}
