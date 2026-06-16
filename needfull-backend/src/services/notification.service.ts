// WHAT: Real-time notification service with database persistence and Socket.io integration
// WHY: Store user notifications, emit real-time updates, track read status
// FUTURE: Add batch notification processing with Bull queue, add notification preferences per user

import db, { queryOne } from '../config/db';
import { v4 as uuidv4 } from 'uuid';

// WHAT: Notification payload structure
// WHY: Type-safe notification data across all notification types
interface NotificationPayload {
  type: string; // 'task_accepted', 'payment_received', 'message', etc.
  title: string;
  body: string;
  taskId?: string;
  conversationId?: string;
  actorId?: string; // User who triggered the notification
}

// WHAT: Database row type for notification
interface NotificationRow extends NotificationPayload {
  id: string;
  user_id: string;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
}

// WHAT: Send notification to single user with database persistence and real-time emit
// WHY: Centralized notification delivery with async Socket.io emission and silent error handling
export async function notifyUser(
  userId: string,
  payload: NotificationPayload
): Promise<void> {
  try {
    // WHAT: Create notification record in database
    // WHY: Persist notification for history and read status tracking
    const notificationId = uuidv4();
    const now = new Date().toISOString();

    const notification = await queryOne<NotificationRow>(
      `
      INSERT INTO notifications (
        id, user_id, type, title, body, task_id, conversation_id, actor_id, is_read, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, $9)
      RETURNING id, user_id, type, title, body, task_id, conversation_id, actor_id, is_read, created_at, read_at
      `,
      [
        notificationId,
        userId,
        payload.type,
        payload.title,
        payload.body,
        payload.taskId || null,
        payload.conversationId || null,
        payload.actorId || null,
        now,
      ]
    );

    // WHAT: Emit notification via Socket.io if available
    // WHY: Deliver real-time update to connected client without page refresh
    try {
      // WHAT: Lazy import io to avoid circular dependency with main index.ts
      // WHY: index.ts creates Express app which imports services, but we need io from index.ts
      const { io } = await import('../index.js').catch(() => ({ io: null }));

      if (io) {
        io.to(`user:${userId}`).emit('notification', notification);
      }
    } catch (socketError) {
      // WHAT: Socket.io emission is optional - don't break main flow if it fails
      // WHY: Database notification persists regardless, Socket.io is best-effort
      console.warn(
        `[Notification] Socket.io emit failed for user ${userId}:`,
        socketError instanceof Error ? socketError.message : 'Unknown error'
      );
    }
  } catch (error) {
    // WHAT: Log notification error but don't throw
    // WHY: Notification failure should never interrupt main business logic (task completion, payment, etc.)
    console.error(
      `[Notification] Failed to notify user ${userId}:`,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// WHAT: Send notification to multiple users in parallel
// WHY: Efficiently notify groups (e.g., all task browsers, all admins) without blocking
export async function notifyMany(
  userIds: string[],
  payload: NotificationPayload
): Promise<void> {
  try {
    // WHAT: Send all notifications in parallel, don't fail on individual errors
    // WHY: If one notification fails, others should still be sent
    await Promise.allSettled(
      userIds.map((userId) => notifyUser(userId, payload))
    );
  } catch (error) {
    // WHAT: Log bulk notification error
    // WHY: Track failures but don't interrupt main flow
    console.error(
      `[Notification] Bulk notification failed for ${userIds.length} users:`,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// WHAT: Get count of unread notifications for a user
// WHY: Show badge/indicator count in UI and mobile push notifications
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const result = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false`,
      [userId]
    );

    return parseInt(result.count, 10);
  } catch (error) {
    // WHAT: Return 0 on error instead of throwing
    // WHY: Failed read shouldn't break app; worst case: stale badge count
    console.error(
      `[Notification] Failed to get unread count for user ${userId}:`,
      error instanceof Error ? error.message : 'Unknown error'
    );
    return 0;
  }
}

// WHAT: Mark single notification as read
// WHY: User dismissed/clicked notification, prevent showing again in list
export async function markRead(
  notificationId: string,
  userId: string
): Promise<void> {
  try {
    const now = new Date().toISOString();

    await db.query(
      `
      UPDATE notifications
      SET is_read = true, read_at = $1
      WHERE id = $2 AND user_id = $3
      `,
      [now, notificationId, userId]
    );
  } catch (error) {
    // WHAT: Log error but don't throw
    // WHY: Mark-read is cosmetic; app should continue if it fails
    console.error(
      `[Notification] Failed to mark notification ${notificationId} as read:`,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// WHAT: Mark all notifications as read for a user
// WHY: "Clear all" action to reset badge and remove from unread list
export async function markAllRead(userId: string): Promise<void> {
  try {
    const now = new Date().toISOString();

    await db.query(
      `
      UPDATE notifications
      SET is_read = true, read_at = $1
      WHERE user_id = $2 AND is_read = false
      `,
      [now, userId]
    );
  } catch (error) {
    // WHAT: Log error but don't throw
    // WHY: Bulk mark-read is cosmetic; app should continue if it fails
    console.error(
      `[Notification] Failed to mark all notifications as read for user ${userId}:`,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}
