// WHAT: Notification item card — displays single notification with actions
// WHY: Reusable component for notification list, handles tap/long-press

"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  MessageCircle,
  Star,
  Wallet,
  AlertCircle,
  MoreVertical,
  Trash2,
  Check,
} from "lucide-react";
import type { Notification } from "@/hooks/useNotifications";

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}

// WHAT: Get icon and color for notification type
const getNotificationIcon = (type: Notification["type"]) => {
  switch (type) {
    case "task_assigned":
      return { icon: CheckCircle2, color: "bg-blue-100 text-blue-600" };
    case "task_completed":
      return { icon: CheckCircle2, color: "bg-green-100 text-green-600" };
    case "message":
      return { icon: MessageCircle, color: "bg-purple-100 text-purple-600" };
    case "review_received":
      return { icon: Star, color: "bg-amber-100 text-amber-600" };
    case "wallet_transaction":
      return { icon: Wallet, color: "bg-green-100 text-green-600" };
    case "report_filed":
      return { icon: AlertCircle, color: "bg-red-100 text-red-600" };
    case "verification_status":
      return { icon: Check, color: "bg-indigo-100 text-indigo-600" };
    default:
      return { icon: MessageCircle, color: "bg-gray-100 text-gray-600" };
  }
};

// WHAT: Format time ago
const getTimeAgo = (date: string) => {
  const now = new Date();
  const notifDate = new Date(date);
  const seconds = Math.floor((now.getTime() - notifDate.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
}: NotificationItemProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [isLongPress, setIsLongPress] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const { icon: IconComponent, color } = getNotificationIcon(notification.type);

  // WHAT: Handle long press for context menu
  const handleMouseDown = () => {
    longPressTimer.current = setTimeout(() => {
      setIsLongPress(true);
      setShowMenu(true);
    }, 500); // 500ms long press
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    if (!isLongPress) {
      // Regular tap — navigate to relevant screen
      if (!notification.is_read) {
        onMarkRead(notification.id);
      }

      if (notification.task_id) {
        router.push(`/tasks/${notification.task_id}`);
      } else if (notification.conversation_id) {
        router.push(`/chat/${notification.conversation_id}`);
      }
    }

    setIsLongPress(false);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(notification.id);
    setShowMenu(false);
  };

  const handleMarkReadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkRead(notification.id);
    setShowMenu(false);
  };

  return (
    <div
      className={`relative flex gap-3 p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer ${
        !notification.is_read ? "bg-blue-50" : ""
      }`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
        }
        setIsLongPress(false);
      }}
    >
      {/* Unread Indicator Dot */}
      {!notification.is_read && (
        <div className="absolute top-4 left-0 w-1 h-1 bg-blue-600 rounded-full"></div>
      )}

      {/* Icon */}
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${color}`}
      >
        <IconComponent className="w-5 h-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title */}
        <p
          className={`text-sm leading-tight ${
            !notification.is_read
              ? "font-semibold text-gray-900"
              : "font-medium text-gray-700"
          }`}
        >
          {notification.title}
        </p>

        {/* Body — 2-line clamp */}
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
          {notification.body}
        </p>

        {/* Time ago */}
        <p className="text-xs text-gray-500 mt-1">
          {getTimeAgo(notification.created_at)}
        </p>
      </div>

      {/* More Menu Button */}
      <div className="flex-shrink-0 ml-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
          aria-label="More options"
        >
          <MoreVertical className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Context Menu */}
      {showMenu && (
        <div className="absolute right-0 top-12 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
          {!notification.is_read && (
            <button
              onClick={handleMarkReadClick}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100"
            >
              <Check className="w-4 h-4" />
              Mark as read
            </button>
          )}
          <button
            onClick={handleDeleteClick}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
