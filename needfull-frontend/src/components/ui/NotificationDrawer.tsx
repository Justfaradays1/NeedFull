"use client";

import { Bell, X } from "lucide-react";
import { Notification, GroupedNotifications } from "@/hooks/useNotifications";

interface NotificationDrawerProps {
  open: boolean;
  onClose: () => void;
  notifications: Notification[];
  groupedNotifications: GroupedNotifications;
  unreadCount: number;
  loading: boolean;
  markAllAsRead: () => void;
}

export function NotificationDrawer({
  open,
  onClose,
  notifications,
  groupedNotifications,
  unreadCount,
  loading,
  markAllAsRead,
}: NotificationDrawerProps) {
  if (!open) return null;

  const renderGroup = (label: string, items: Notification[]) => {
    if (!items.length) return null;
    return (
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">
          {label}
        </p>
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={`rounded-3xl border border-gray-200/80 bg-surface p-4 shadow-sm ${
                item.is_read ? "opacity-80" : ""
              }`}
            >
              <p className="font-semibold text-gray-900">
                {item.title}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-black/40 backdrop-blur-sm">
      <div className="flex-1" onClick={onClose} />
      <div className="w-full max-w-md border-l border-gray-200 bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200/80 px-5 py-4">
          <div className="flex items-center gap-3 text-gray-900">
            <Bell className="h-5 w-5" />
            <div>
              <p className="font-semibold">Notifications</p>
              <p className="text-sm text-gray-500">
                {unreadCount} unread
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 transition hover:text-gray-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex items-center justify-between rounded-3xl bg-gray-100 px-4 py-3 text-sm text-gray-700">
            <span>Action</span>
            <button
              type="button"
              onClick={markAllAsRead}
              className="font-semibold text-brand-text transition hover:text-brand-dark"
            >
              Mark all read
            </button>
          </div>

          {loading ? (
            <div className="rounded-3xl bg-gray-100 p-6 text-center text-sm text-gray-500">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center pt-10 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <Bell className="h-7 w-7 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-900">
                No notifications yet
              </p>
              <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-gray-500">
                You&apos;re all caught up. We&apos;ll notify you when something
                important happens.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {renderGroup("Today", groupedNotifications.today)}
              {renderGroup("Yesterday", groupedNotifications.yesterday)}
              {renderGroup("Earlier", groupedNotifications.older)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
