// WHAT: Notifications controller — list, unread count, mark read, mark all read
// WHY: View and manage in-app notifications
// FUTURE: Add DELETE endpoint for clearing old notifications
// FUTURE: Add push notification registration endpoint

import { Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import db, { queryOne } from "../config/db";
import type { AuthRequest } from "../middleware/auth";
import {
  getUnreadCount,
  markRead as svcMarkRead,
  markAllRead as svcMarkAllRead,
} from "../services/notification.service";

// WHAT: List notifications — paginated, includes total and unread count
export async function list(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return void res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user!.id;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const perPage = Math.min(
      50,
      Math.max(1, parseInt(req.query.perPage as string) || 20),
    );
    const offset = (page - 1) * perPage;

    const [result, countRes, unread] = await Promise.all([
      db.query<any>(
        "SELECT id, type, title, body, task_id, conversation_id, actor_id, is_read, created_at, read_at FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
        [userId, perPage, offset],
      ),
      db.query<{ count: string }>(
        "SELECT COUNT(*) as count FROM notifications WHERE user_id = $1",
        [userId],
      ),
      getUnreadCount(userId),
    ]);

    res.json({
      data: result.rows.map((r: any) => ({
        id: r.id,
        type: r.type,
        title: r.title,
        body: r.body,
        taskId: r.task_id,
        conversationId: r.conversation_id,
        actorId: r.actor_id,
        isRead: r.is_read,
        createdAt: r.created_at,
        readAt: r.read_at,
      })),
      total: parseInt(countRes.rows[0]?.count || "0", 10),
      page,
      perPage,
      unreadCount: unread,
    });
  } catch (error) {
    next(error);
  }
}

// WHAT: Get unread notification count
export async function unreadCount(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const count = await getUnreadCount(req.user!.id);
    res.json({ count });
  } catch (error) {
    next(error);
  }
}

// WHAT: Mark a single notification as read
// SECURITY: Verify notification belongs to authenticated user before marking
export async function markRead(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return void res.status(400).json({ errors: errors.array() });
    }

    const notificationId = req.params.id;
    const userId = req.user!.id;

    // WHAT: Verify notification exists and belongs to this user (ownership check)
    // WHY: Prevent marking other users' notifications as read (security violation)
    const notification = await queryOne<{ user_id: string }>(
      "SELECT user_id FROM notifications WHERE id = $1",
      [notificationId],
    );

    if (!notification) {
      return void res.status(404).json({ error: "Notification not found" });
    }

    if (notification.user_id !== userId) {
      return void res.status(403).json({ error: "Forbidden" });
    }

    await svcMarkRead(notificationId, userId);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

// WHAT: Delete a single notification
// SECURITY: Verify notification belongs to authenticated user before deleting
export async function remove(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return void res.status(400).json({ errors: errors.array() });
    }

    const notificationId = req.params.id;
    const userId = req.user!.id;

    const notification = await queryOne(
      "SELECT user_id FROM notifications WHERE id = $1",
      [notificationId],
    );

    if (!notification) {
      return void res.status(404).json({ error: "Notification not found" });
    }

    if (notification.user_id !== userId) {
      return void res.status(403).json({ error: "Forbidden" });
    }

    await db.query("DELETE FROM notifications WHERE id = $1", [notificationId]);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

// WHAT: Mark all notifications as read for the current user
export async function markAllRead(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await svcMarkAllRead(req.user!.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}
