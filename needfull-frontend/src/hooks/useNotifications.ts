// WHAT: Notifications hook — fetches, manages, and updates notification state
// WHY: Centralize notification logic (fetch, grouping, delete, mark read/all)
// FUTURE: Add socket.io listener for real-time notifications, add pagination infinite scroll

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { get, post, del } from "@/lib/apiClient";

// WHAT: Notification type matching consumer expectations (snake_case fields)
// WHY: NotificationItem and NotificationDrawer components read snake_case fields
export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  task_id?: string;
  conversation_id?: string;
  actor_id?: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

// WHAT: Grouped notifications for display
export interface GroupedNotifications {
  today: Notification[];
  yesterday: Notification[];
  older: Notification[];
}

// WHAT: Backend list response shape (camelCase from controller)
interface BackendNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  taskId: string | null;
  conversationId: string | null;
  actorId: string | null;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

interface NotificationListResponse {
  data: BackendNotification[];
  total: number;
  page: number;
  perPage: number;
  unreadCount: number;
}

// WHAT: Map backend camelCase notification to consumer-facing snake_case shape
// WHY: Consumers (NotificationItem, NotificationDrawer) expect snake_case fields
function toNotification(n: BackendNotification): Notification {
  return {
    id: n.id,
    user_id: "", // backend omits; not needed by consumers
    type: n.type,
    title: n.title,
    body: n.body,
    task_id: n.taskId ?? undefined,
    conversation_id: n.conversationId ?? undefined,
    actor_id: n.actorId ?? undefined,
    is_read: n.isRead,
    created_at: n.createdAt,
    updated_at: n.createdAt, // backend doesn't return updated_at in list
  };
}

// WHAT: Group notifications into today / yesterday / older buckets
// WHY: NotificationDrawer renders these three groups
function groupByDate(list: Notification[]): GroupedNotifications {
  const today: Notification[] = [];
  const yesterday: Notification[] = [];
  const older: Notification[] = [];

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  for (const n of list) {
    const d = new Date(n.created_at);
    if (d >= todayStart) today.push(n);
    else if (d >= yesterdayStart) yesterday.push(n);
    else older.push(n);
  }

  return { today, yesterday, older };
}

// WHAT: Hook for notification management
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groupedNotifications = useMemo(
    () => groupByDate(notifications),
    [notifications],
  );

  // WHAT: Fetch notifications from backend
  // WHY: Load on mount and when explicitly refreshed
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await get<NotificationListResponse>("/notifications");
      const mapped = res.data.map(toNotification);
      setNotifications(mapped);
      setUnreadCount(res.unreadCount);
    } catch {
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  // WHAT: Auto-fetch on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // WHAT: Mark single notification as read (optimistic)
  const markAsRead = useCallback(async (notificationId: string) => {
    const prev = notifications;
    // Optimistic update
    setNotifications((list) =>
      list.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));

    try {
      await post(`/notifications/${notificationId}/read`);
    } catch {
      // Revert on failure
      setNotifications(prev);
      setUnreadCount((c) => c + 1);
    }
  }, [notifications]);

  // WHAT: Mark all notifications as read (optimistic)
  const markAllAsRead = useCallback(async () => {
    const prev = notifications;
    setNotifications((list) => list.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      await post("/notifications/read-all");
    } catch {
      // Revert on failure
      setNotifications(prev);
      setUnreadCount((c) =>
        c === 0 ? prev.filter((n) => !n.is_read).length : c,
      );
    }
  }, [notifications]);

  // WHAT: Delete notification (optimistic)
  const deleteNotification = useCallback(async (notificationId: string) => {
    const prev = notifications;
    setNotifications((list) => list.filter((n) => n.id !== notificationId));

    try {
      await del(`/notifications/${notificationId}`);
    } catch {
      // Revert on failure
      setNotifications(prev);
    }
  }, [notifications]);

  return {
    notifications,
    groupedNotifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
  };
}
