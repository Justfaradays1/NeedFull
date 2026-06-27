// WHAT: Reviews controller — create review, get reviews for a task
// WHY: Rating system for tasks

import { Request, Response } from "express";
import db from "../config/db";
import { onTrustEvent } from "../services/trust.service";
import { v4 as uuidv4 } from "uuid";

export async function createReview(req: Request, res: Response): Promise<void> {
  try {
    const { taskId, revieweeId, rating, comment } = req.body;
    const reviewerId = req.user!.id;

    // WHAT: Verify task completion and participation
    const task = await db.query<any>(
      "SELECT id, poster_id, assigned_to as runner_id, status FROM tasks WHERE id = $1",
      [taskId],
    );
    if (task.rows.length === 0) {
      res.status(404).json({ success: false, message: "Task not found" });
      return;
    }
    if (task.rows[0].status !== "completed") {
      res
        .status(400)
        .json({ success: false, message: "Can only review completed tasks" });
      return;
    }
    if (
      task.rows[0].poster_id !== reviewerId &&
      task.rows[0].runner_id !== reviewerId
    ) {
      res
        .status(403)
        .json({
          success: false,
          message: "You are not a participant in this task",
        });
      return;
    }

    // WHAT: Check for duplicate review
    const existing = await db.query(
      "SELECT id FROM reviews WHERE reviewer_id = $1 AND task_id = $2",
      [reviewerId, taskId],
    );
    if (existing.rows.length > 0) {
      res
        .status(409)
        .json({
          success: false,
          message: "You have already reviewed this task",
        });
      return;
    }

    const id = uuidv4();
    await db.query(
      "INSERT INTO reviews (id, task_id, reviewer_id, reviewee_id, rating, comment, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())",
      [id, taskId, reviewerId, revieweeId, rating, comment || null],
    );

    // WHAT: Fire-and-forget trust recalculation for reviewee
    // WHY: New review affects trust score; don't block response
    onTrustEvent(revieweeId, "review_received").catch(console.error);

    res
      .status(201)
      .json({ success: true, data: { id, taskId, rating, comment } });
  } catch (error) {
    console.error("[Reviews] createReview error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to create review" });
  }
}

export async function getForTask(req: Request, res: Response): Promise<void> {
  try {
    const result = await db.query<any>(
      `SELECT r.id, r.rating, r.comment, r.created_at,
        jsonb_build_object('id', u.id, 'fullName', u.full_name) as reviewer
       FROM reviews r JOIN users u ON r.reviewer_id = u.id
       WHERE r.task_id = $1 ORDER BY r.created_at DESC`,
      [req.params.taskId],
    );
    res.json({
      success: true,
      data: result.rows.map((r: any) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.created_at,
        reviewer: r.reviewer,
      })),
    });
  } catch (error) {
    console.error("[Reviews] getForTask error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch reviews" });
  }
}
