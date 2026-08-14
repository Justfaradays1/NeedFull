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
      return { icon: CheckCircle2, color: "bg-info-bg text-info-text" };
    case "task_completed":
      return { icon: CheckCircle2, color: "bg-success-bg text-success-text" };
    case "message":
      return { icon: MessageCircle, color: "bg-info-bg text-info-text" };
    case "review_received":
      return { icon: Star, color: "bg-warning-bg text-warning-text" };
    case "wallet_transaction":
      return { icon: Wallet, color: "bg-success-bg text-success-text" };
    case "report_filed":
      return { icon: AlertCircle, color: "bg-error-bg text-error-text" };
    case "verification_status":
      return { icon: Check, color: "bg-info-bg text-info-text" };
    case "application_accepted":
    case "task_assigned":
    case "proposal_accepted":
    case "budget_proposal_accepted":
      return { icon: CheckCircle2, color: "bg-success-bg text-success-text" };
    case "funding_required":
      return { icon: AlertCircle, color: "bg-warning-bg text-warning-text" };
    case "budget_proposal_sent":
    case "application.counter_offer":
    case "counter_offer":
      return { icon: MessageCircle, color: "bg-warning-bg text-warning-text" };
    case "budget_proposal_rejected":
    case "budget_proposal_expired":
    case "proposal_expired":
      return { icon: AlertCircle, color: "bg-error-bg text-error-text" };
    case "funding_success":
      return { icon: Wallet, color: "bg-brand-light text-brand-text" };
    default:
      return { icon: MessageCircle, color: "bg-surface-secondary text-foreground-secondary" };
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
      className={`relative flex gap-3 p-4 border-b border-border-default hover:bg-surface-secondary transition-colors cursor-pointer ${
        !notification.is_read ? "bg-info-bg" : ""
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
        <div className="absolute top-4 left-0 w-1 h-1 bg-processing rounded-full"></div>
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
          className="p-1 hover:bg-surface-secondary rounded-lg transition-colors"
          aria-label="More options"
        >
          <MoreVertical className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Context Menu */}
      {showMenu && (
        <div className="absolute right-0 top-12 bg-surface rounded-lg shadow-lg border border-card-border z-10">
          {!notification.is_read && (
            <button
              onClick={handleMarkReadClick}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-surface-secondary flex items-center gap-2 border-b border-border-subtle"
            >
              <Check className="w-4 h-4" />
              Mark as read
            </button>
          )}
          <button
            onClick={handleDeleteClick}
            className="w-full text-left px-4 py-2 text-sm text-error-text hover:bg-error-bg flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
