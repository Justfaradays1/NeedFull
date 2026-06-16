// WHAT: Chat controller — conversations and messages
// WHY: Manages direct messaging between task participants
// FUTURE: Add typing indicators, message attachments, read receipts

import { Request, Response } from "express";
import db from "../config/db";
import { v4 as uuidv4 } from "uuid";

export async function listConversations(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const result = await db.query<any>(
      `SELECT c.id, c.task_id, c.other_user_id, c.last_message, c.last_message_at, c.created_at,
        jsonb_build_object('id', u.id, 'fullName', u.full_name, 'profilePictureUrl', u.profile_picture_url) as other_user,
        (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != $1 AND is_read = false) as unread_count
       FROM conversations c JOIN users u ON c.other_user_id = u.id
       WHERE c.user_id = $1 ORDER BY c.last_message_at DESC NULLS LAST`,
      [userId],
    );
    res.json({ success: true, data: result.rows.map((r: any) => ({ id: r.id, taskId: r.task_id, otherUser: r.other_user, lastMessage: r.last_message, lastMessageAt: r.last_message_at, unreadCount: parseInt(r.unread_count, 10), createdAt: r.created_at })) });
  } catch (error) {
    console.error("[Chat] listConversations error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch conversations" });
  }
}

export async function getOrCreateConversation(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { otherUserId } = req.body;

    // WHAT: Check if conversation already exists
    const existing = await db.query<any>(
      `SELECT id, task_id, other_user_id FROM conversations WHERE user_id = $1 AND other_user_id = $2 LIMIT 1`,
      [userId, otherUserId],
    );
    if (existing.rows.length > 0) { res.json({ success: true, data: { id: existing.rows[0].id, taskId: existing.rows[0].task_id } }); return; }

    // WHAT: Also check reverse direction
    const reverse = await db.query<any>(
      `SELECT id, task_id, other_user_id FROM conversations WHERE user_id = $1 AND other_user_id = $2 LIMIT 1`,
      [otherUserId, userId],
    );
    if (reverse.rows.length > 0) { res.json({ success: true, data: { id: reverse.rows[0].id, taskId: reverse.rows[0].task_id } }); return; }

    // WHAT: Create new conversation (bidirectional entries for easy querying)
    const conversationId = uuidv4();
    const now = new Date().toISOString();
    await db.query(
      "INSERT INTO conversations (id, user_id, other_user_id, created_at) VALUES ($1, $2, $3, $4), ($5, $3, $2, $4)",
      [conversationId, userId, otherUserId, now, uuidv4()],
    );

    res.status(201).json({ success: true, data: { id: conversationId } });
  } catch (error) {
    console.error("[Chat] getOrCreateConversation error:", error);
    res.status(500).json({ success: false, message: "Failed to create conversation" });
  }
}

export async function getMessages(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const conversationId = req.params.id;
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.perPage as string) || 50;
    const offset = (page - 1) * perPage;

    // WHAT: Verify user is part of this conversation
    const conv = await db.query<any>(
      "SELECT id FROM conversations WHERE id = $1 AND user_id = $2 LIMIT 1",
      [conversationId, userId],
    );
    if (conv.rows.length === 0) { res.status(403).json({ success: false, message: "Access denied" }); return; }

    const [result, countRes] = await Promise.all([
      db.query<any>(
        "SELECT id, sender_id, content, is_read, created_at FROM messages WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
        [conversationId, perPage, offset],
      ),
      db.query<{ count: string }>("SELECT COUNT(*) as count FROM messages WHERE conversation_id = $1", [conversationId]),
    ]);

    res.json({ success: true, data: result.rows.reverse().map((r: any) => ({ id: r.id, senderId: r.sender_id, content: r.content, isRead: r.is_read, createdAt: r.created_at })), pagination: { page, perPage, total: parseInt(countRes.rows[0]?.count || "0", 10) } });
  } catch (error) {
    console.error("[Chat] getMessages error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch messages" });
  }
}

export async function sendMessage(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const conversationId = req.params.id;

    const conv = await db.query<any>("SELECT id FROM conversations WHERE id = $1 AND user_id = $2 LIMIT 1", [conversationId, userId]);
    if (conv.rows.length === 0) { res.status(403).json({ success: false, message: "Access denied" }); return; }

    const messageId = uuidv4();
    const now = new Date().toISOString();
    await db.query(
      "INSERT INTO messages (id, conversation_id, sender_id, content, created_at) VALUES ($1, $2, $3, $4, $5)",
      [messageId, conversationId, userId, req.body.content, now],
    );

    // WHAT: Update last_message on conversation
    await db.query(
      "UPDATE conversations SET last_message = $1, last_message_at = $2 WHERE id = $3",
      [req.body.content, now, conversationId],
    );

    res.status(201).json({ success: true, data: { id: messageId, senderId: userId, content: req.body.content, createdAt: now } });
  } catch (error) {
    console.error("[Chat] sendMessage error:", error);
    res.status(500).json({ success: false, message: "Failed to send message" });
  }
}

export async function markConversationRead(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const conversationId = req.params.id;

    await db.query(
      "UPDATE messages SET is_read = true WHERE conversation_id = $1 AND sender_id != $2 AND is_read = false",
      [conversationId, userId],
    );
    res.json({ success: true, message: "Messages marked as read" });
  } catch (error) {
    console.error("[Chat] markConversationRead error:", error);
    res.status(500).json({ success: false, message: "Failed to mark messages as read" });
  }
}
