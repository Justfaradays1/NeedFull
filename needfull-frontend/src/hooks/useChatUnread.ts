// WHAT: Chat unread-count hook — sums unread messages across conversations
// WHY: Message badges (FAB, sidebar, mobile nav) must reflect real chat unread,
//      not notification counts; polls lightly since chat updates via Socket.io

"use client";

import { useState, useEffect, useCallback } from "react";
import { get } from "@/lib/apiClient";

interface Conversation {
  unreadCount?: number;
}

export function useChatUnread() {
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const res = await get<{ success: boolean; data: Conversation[] }>(
        "/chat/conversations",
      );
      const total = (res.data ?? []).reduce(
        (sum, c) => sum + (c.unreadCount ?? 0),
        0,
      );
      setUnreadCount(total);
    } catch {
      // keep last known value on transient errors
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 15000);
    return () => clearInterval(id);
  }, [refresh]);

  return { unreadCount, refreshChatUnread: refresh };
}
