// WHAT: Notifications hook — fetches, manages, and updates notification state
// WHY: Centralize notification logic (fetch, grouping, delete, mark read/all)
// FUTURE: Add socket.io listener for real-time notifications, add pagination infinite scroll

"use client";

import { useState, useCallback, useEffect } from "react";
import apiClient from "@/lib/apiClient";

// WHAT: Notification type from backend
export interface Notification {
  id: string;
  user_id: string;
  type:
    | "task_assigned"
    | "task_completed"
    | "review_received"
    | "message"
    | "wallet_transaction"
    | "report_filed"
    | "verification_status";
  title: string;
  body: string;
  task_id?: string;
  conversation_id?: string;
  actor_id?: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

// WHAT: List response from backend
export interface NotificationListResponse {
  data: Notification[];
  total: number;
  page: number;
  perPage: number;
  unreadCount: number;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [hasMore, setHasMore] = useState(false);

  // WHAT: Group notifications by date
  // WHY: Display them organized chronologically
  const groupNotifications = useCallback((notifs: Notification[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const grouped: GroupedNotifications = {
      today: [],
      yesterday: [],
      older: [],
    };

    notifs.forEach((notif) => {
      const notifDate = new Date(notif.created_at);
      const notifDay = new Date(
        notifDate.getFullYear(),
        notifDate.getMonth(),
        notifDate.getDate(),
      );

      if (notifDay.getTime() === today.getTime()) {
        grouped.today.push(notif);
      } else if (notifDay.getTime() === yesterday.getTime()) {
        grouped.yesterday.push(notif);
      } else {
        grouped.older.push(notif);
      }
    });

    return grouped;
  }, []);

  // WHAT: Fetch notifications list
  // WHY: Load notifications on mount and when paginating
  const fetchNotifications = useCallback(
    async (pageNum: number = 1) => {
      try {
        setLoading(pageNum === 1);
        setError(null);

        // TODO: Replace with actual endpoint once backend is ready
        // const res = await apiClient.get<NotificationListResponse>('/notifications', {
        //   params: { page: pageNum, perPage },
        // });

        // Mock data for now
        const mockNotifications: Notification[] = [
          {
            id: "1",
            user_id: "user-1",
            type: "task_assigned",
            title: "New Task Assigned",
            body: 'You have been assigned to the task "Write blog post about AI" - Budget: ₦5,000',
            task_id: "task-1",
            is_read: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            actor_id: "user-2",
          },
          {
            id: "2",
            user_id: "user-1",
            type: "message",
            title: "New Message from John",
            body: "Thanks for your work on the project! The deliverables are excellent.",
            conversation_id: "conv-1",
            is_read: true,
            created_at: new Date(Date.now() - 30 * 60000).toISOString(),
            updated_at: new Date(Date.now() - 30 * 60000).toISOString(),
            actor_id: "user-2",
          },
          {
            id: "3",
            user_id: "user-1",
            type: "review_received",
            title: "Review from Sarah",
            body: 'Sarah left a 5-star review: "Excellent work, very professional and reliable."',
            actor_id: "user-3",
            is_read: true,
            created_at: new Date(Date.now() - 24 * 60 * 60000).toISOString(),
            updated_at: new Date(Date.now() - 24 * 60 * 60000).toISOString(),
          },
          {
            id: "4",
            user_id: "user-1",
            type: "wallet_transaction",
            title: "Payment Received",
            body: 'You received ₦2,500 for completed task "Design flyer"',
            is_read: true,
            created_at: new Date(
              Date.now() - 3 * 24 * 60 * 60000,
            ).toISOString(),
            updated_at: new Date(
              Date.now() - 3 * 24 * 60 * 60000,
            ).toISOString(),
          },
        ];

        setNotifications(mockNotifications);
        setGroupedNotifications(groupNotifications(mockNotifications));
        setUnreadCount(mockNotifications.filter((n) => !n.is_read).length);
        setHasMore(false); // Mock has no pagination
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch notifications",
        );
      } finally {
        setLoading(false);
      }
    },
    [groupNotifications, perPage],
  );

  // WHAT: Mark single notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      // TODO: Call backend endpoint
      // await apiClient.put(`/notifications/${notificationId}/read`);

      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n,
        ),
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  }, []);

  // WHAT: Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      // TODO: Call backend endpoint
      // await apiClient.put('/notifications/mark-all-read');

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  }, []);

  // WHAT: Delete notification
  // WHY: Remove notification from list
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      // TODO: Call backend endpoint
      // await apiClient.delete(`/notifications/${notificationId}`);

      // Update local state
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  }, []);

  // WHAT: Load notifications on mount
  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  return {
    notifications,
    groupedNotifications,
    unreadCount,
    loading,
    error,
    page,
    hasMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
    setPage,
  };
}
