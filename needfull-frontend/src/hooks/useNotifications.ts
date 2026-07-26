// WHAT: Notifications hook — fetches, manages, and updates notification state
// WHY: Centralize notification logic (fetch, grouping, delete, mark read/all)
// FUTURE: Add socket.io listener for real-time notifications, add pagination infinite scroll

"use client";

import { useState, useCallback } from "react";

// WHAT: Notification type from backend
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

// WHAT: Hook for notification management
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [groupedNotifications, setGroupedNotifications] =
    useState<GroupedNotifications>({
      today: [],
      yesterday: [],
      older: [],
    });
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // WHAT: Fetch notifications list
  // WHY: Load notifications on mount and when paginating
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Notifications are event-driven — no mock/placeholder data.
    // Real notifications come from the backend when events occur.
    // TODO: Wire to backend endpoint when ready:
    // const res = await apiClient.get<NotificationListResponse>('/notifications');
    // setNotifications(res.data);
    // setUnreadCount(res.data.filter((n) => !n.is_read).length);

    setNotifications([]);
    setGroupedNotifications({ today: [], yesterday: [], older: [] });
    setUnreadCount(0);
    setLoading(false);
  }, []);

  // WHAT: Mark single notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, is_read: true } : n,
      ),
    );

    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  // WHAT: Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, []);

  // WHAT: Delete notification
  // WHY: Remove notification from list
  const deleteNotification = useCallback(async (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  }, []);

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
