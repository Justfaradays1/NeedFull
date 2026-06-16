// WHAT: Reports controller — create report and get user's reports
// WHY: User reporting system for moderation and safety
// RULES: Users can only report others, not themselves; at least one target required

import { Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import db, { queryOne } from "../config/db";
import type { AuthRequest } from "../middleware/auth";
import { notifyUser } from "../services/notification.service";
import { v4 as uuidv4 } from "uuid";

// WHAT: Create a new report against a user or task
// WHY: Allow users to flag inappropriate behavior or content for admin review
// VALIDATION: reportedUserId OR reportedTaskId required; cannot report self
export async function create(
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
    const { reason, reportedUserId, reportedTaskId } = req.body;

    // WHAT: Validate at least one report target
    // WHY: A report must target either a user or a task
    if (!reportedUserId && !reportedTaskId) {
      return void res.status(400).json({
        error: "Must report either a user or a task",
      });
    }

    // WHAT: Prevent self-reporting
    // WHY: Users shouldn't be able to report themselves
    if (reportedUserId && reportedUserId === userId) {
      return void res.status(400).json({ error: "Cannot report yourself" });
    }

    const reportId = uuidv4();
    const now = new Date().toISOString();

    // WHAT: Create report record
    // WHY: Persist report for admin review with audit trail
    const created = await queryOne<any>(
      `INSERT INTO reports 
       (id, reporter_id, reported_user_id, reported_task_id, reason, status, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, 'open', $6, $7) 
       RETURNING id, reporter_id, reported_user_id, reported_task_id, reason, status, created_at`,
      [
        reportId,
        userId,
        reportedUserId || null,
        reportedTaskId || null,
        reason,
        now,
        now,
      ],
    );

    // WHAT: Notify all admins asynchronously (don't block request)
    // WHY: Admins need to be aware of new reports, but notification delay is acceptable
    setImmediate(async () => {
      try {
        const adminResult = await db.query<{ id: string }>(
          "SELECT id FROM users WHERE role = 'admin' LIMIT 50",
        );

        for (const admin of adminResult.rows) {
          await notifyUser(admin.id, {
            type: "new_report",
            title: "New Report Submitted",
            body: `Report against ${reportedUserId ? "user" : "task"} by ${userId}`,
            actorId: userId,
            taskId: reportedTaskId,
          }).catch((err) => {
            console.warn(
              `[Reports] Failed to notify admin ${admin.id}:`,
              err instanceof Error ? err.message : "Unknown error",
            );
          });
        }
      } catch (err) {
        console.error(
          "[Reports] Failed to notify admins:",
          err instanceof Error ? err.message : "Unknown error",
        );
      }
    });

    res.status(201).json({
      id: created.id,
      reporterId: created.reporter_id,
      reportedUserId: created.reported_user_id,
      reportedTaskId: created.reported_task_id,
      reason: created.reason,
      status: created.status,
      createdAt: created.created_at,
    });
  } catch (error) {
    next(error);
  }
}

// WHAT: Get paginated list of reports submitted by current user
// WHY: Allow users to track their own reports and their status
// PAGINATION: page and perPage from query string
export async function getMyReports(
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
    const perPage = Math.min(50, Math.max(1, parseInt(req.query.perPage as string) || 20));
    const offset = (page - 1) * perPage;

    // WHAT: Fetch paginated reports for current user
    // WHY: Most recent reports first for quick status checking
    const result = await db.query<any>(
      `SELECT id, reported_user_id, reported_task_id, reason, status, created_at, updated_at 
       FROM reports 
       WHERE reporter_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, perPage, offset],
    );

    // WHAT: Get total count for pagination metadata
    const countResult = await db.query<{ count: string }>(
      "SELECT COUNT(*) as count FROM reports WHERE reporter_id = $1",
      [userId],
    );

    const total = parseInt(countResult.rows[0]?.count || "0");

    res.json({
      data: result.rows.map((r: any) => ({
        id: r.id,
        reportedUserId: r.reported_user_id,
        reportedTaskId: r.reported_task_id,
        reason: r.reason,
        status: r.status,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
      total,
      page,
      perPage,
    });
  } catch (error) {
    next(error);
  }
}

// FUTURE: Admin reports endpoints handled in admin.controller.ts
// - getReports() — list all reports with filters (status, date range)
// - updateReportStatus() — mark as reviewed/resolved
// - deleteReport() — remove spurious reports
