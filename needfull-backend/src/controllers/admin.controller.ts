// WHAT: Admin controller — dashboard stats, user management, deposits, withdrawals, reports, tasks
// WHY: Centralised admin dashboard for platform moderation and monitoring
// FUTURE: Add revenue analytics with time-series data, user growth charts, fraud detection

import { Request, Response } from "express";
import db, { withTransaction } from "../config/db";
import { notifyUser } from "../services/notification.service";
import { onTrustEvent } from "../services/trust.service";
import { confirmManualTransfer as svcConfirmTransfer, rejectManualTransfer as svcRejectTransfer } from "../services/manualTransfer.service";

// WHAT: Helper to safely count rows in a table (handles missing tables)
async function safeCount(table: string, where?: string): Promise<number> {
  try {
    const sql = where ? `SELECT COUNT(*) as c FROM ${table} WHERE ${where}` : `SELECT COUNT(*) as c FROM ${table}`;
    const result = await db.query<{ c: string }>(sql);
    return parseInt(result.rows[0]?.c || "0", 10);
  } catch (err) {
    console.warn(`[Admin] safeCount table "${table}" failed (table may not exist yet):`, (err as Error).message);
    return 0;
  }
}

// WHAT: Helper to safely sum a column (handles missing tables)
async function safeSum(table: string, column: string, where?: string): Promise<number> {
  try {
    const sql = where
      ? `SELECT COALESCE(SUM(${column}), 0) as s FROM ${table} WHERE ${where}`
      : `SELECT COALESCE(SUM(${column}), 0) as s FROM ${table}`;
    const result = await db.query<{ s: string }>(sql);
    return parseInt(result.rows[0]?.s || "0", 10);
  } catch (err) {
    console.warn(`[Admin] safeSum table "${table}" failed (table may not exist yet):`, (err as Error).message);
    return 0;
  }
}

// WHAT: Dashboard stats with per-query error handling
// WHY: Combined SQL query fails if any referenced table doesn't exist (MVP phase)
export async function getDashboardStats(_req: Request, res: Response): Promise<void> {
  try {
    const [
      totalUsers, newUsersToday,
      totalTasks, openTasks, completedTasks,
      totalVolumeKobo, todayVolumeKobo,
      pendingManualTransfers,
      pendingWithdrawals,
      pendingVerifications,
      openReports,
      platformEarningsKobo,
    ] = await Promise.all([
      safeCount('users'),
      safeCount('users', "created_at >= CURRENT_DATE"),
      safeCount('tasks'),
      safeCount('tasks', "status = 'open'"),
      safeCount('tasks', "status = 'completed'"),
      safeSum('wallet_transactions', 'amount', "type IN ('earnings', 'card_deposit', 'manual_deposit_confirmed')"),
      safeSum('wallet_transactions', 'amount', "type IN ('earnings', 'card_deposit', 'manual_deposit_confirmed') AND created_at >= CURRENT_DATE"),
      safeCount('manual_transfers', "status = 'pending'"),
      safeCount('withdrawal_requests', "status = 'pending'"),
      safeCount('student_id_verifications', "status = 'pending'"),
      safeCount('reports', "status = 'open'"),
      safeSum('wallet_transactions', 'amount', "type = 'platform_fee'"),
    ]);

    res.json({
      success: true, data: {
        totalUsers, newUsersToday,
        totalTasks, openTasks, completedTasks,
        totalVolumeKobo, totalVolumeNaira: totalVolumeKobo / 100,
        todayVolumeKobo, todayVolumeNaira: todayVolumeKobo / 100,
        pendingManualTransfers, pendingWithdrawals, pendingVerifications, openReports,
        platformEarningsKobo, platformEarningsNaira: platformEarningsKobo / 100,
      },
    });
  } catch (error) {
    console.error("[Admin] getDashboardStats error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch dashboard stats" });
  }
}

// WHAT: Paginated user list with filters
export async function listUsers(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.perPage as string) || 20;
    const offset = (page - 1) * perPage;
    const search = req.query.search as string;
    const role = req.query.role as string;
    const isVerifiedStudent = req.query.isVerifiedStudent as string;
    const isBanned = req.query.isBanned as string;
    const isRunner = req.query.isRunner as string;
    const params: any[] = [];
    const clauses: string[] = [];
    let idx = 1;

    if (search) { clauses.push(`(u.full_name ILIKE $${idx} OR u.email ILIKE $${idx})`); params.push(`%${search}%`); idx++; }
    if (role) { clauses.push(`u.role = $${idx}`); params.push(role); idx++; }
    if (isVerifiedStudent) { clauses.push(`u.is_verified_student = $${idx}`); params.push(isVerifiedStudent === 'true'); idx++; }
    if (isBanned) { clauses.push(`u.is_banned = $${idx}`); params.push(isBanned === 'true'); idx++; }
    if (isRunner) { clauses.push(`u.is_runner = $${idx}`); params.push(isRunner === 'true'); idx++; }

    const whereSQL = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    const [rows, countRes] = await Promise.all([
      db.query<any>(
        `SELECT u.id, u.full_name, u.email, u.role, u.trust_score, u.tasks_completed, u.is_verified_student,
                u.is_runner, u.is_available, u.is_banned, u.created_at,
          jsonb_build_object('balanceKobo', w.balance, 'escrowKobo', w.escrow) as wallet
         FROM users u JOIN wallets w ON w.user_id = u.id ${whereSQL} ORDER BY u.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, perPage, offset],
      ),
      db.query<{ count: string }>(`SELECT COUNT(*) as count FROM users u ${whereSQL}`, params),
    ]);
    res.json({ success: true, data: rows.rows.map((r: any) => ({ id: r.id, fullName: r.full_name, email: r.email, role: r.role, trustScore: r.trust_score, tasksCompleted: r.tasks_completed, isVerifiedStudent: r.is_verified_student, isRunner: r.is_runner, isAvailable: r.is_available, isBanned: r.is_banned, wallet: r.wallet, createdAt: r.created_at })), pagination: { page, perPage, total: parseInt(countRes.rows[0]?.count || "0", 10) } });
  } catch (error) {
    console.error("[Admin] listUsers error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
}

// WHAT: Ban a user
export async function banUser(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.params.id;
    await db.query("UPDATE users SET is_banned = true, updated_at = NOW() WHERE id = $1", [userId]);
    notifyUser(userId, { type: "account_banned", title: "Account Banned", body: "Your account has been suspended for violating our terms of service.", taskId: undefined, conversationId: undefined, actorId: req.user!.id }).catch(() => {});
    res.json({ success: true, message: "User banned" });
  } catch (error) {
    console.error("[Admin] banUser error:", error);
    res.status(500).json({ success: false, message: "Failed to ban user" });
  }
}

// WHAT: Unban a user
export async function unbanUser(req: Request, res: Response): Promise<void> {
  try {
    await db.query("UPDATE users SET is_banned = false, updated_at = NOW() WHERE id = $1", [req.params.id]);
    res.json({ success: true, message: "User unbanned" });
  } catch (error) {
    console.error("[Admin] unbanUser error:", error);
    res.status(500).json({ success: false, message: "Failed to unban user" });
  }
}

// WHAT: Approve or reject student ID verification
export async function listVerifications(req: Request, res: Response): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const perPage = Math.min(50, Math.max(1, parseInt(req.query.perPage as string) || 20));
    const offset = (page - 1) * perPage;

    const [result, countRes] = await Promise.all([
      db.query<any>(
        `SELECT sv.id, sv.user_id, sv.image_url, sv.status, sv.rejection_note, sv.created_at,
                u.email, u.full_name
         FROM student_id_verifications sv
         JOIN users u ON sv.user_id = u.id
         ORDER BY sv.created_at DESC LIMIT $1 OFFSET $2`,
        [perPage, offset],
      ),
      db.query<{ count: string }>("SELECT COUNT(*) as count FROM student_id_verifications"),
    ]);

    const total = parseInt(countRes.rows[0]?.count || "0", 10);
    res.json({
      success: true,
      data: result.rows.map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        email: r.email,
        fullName: r.full_name,
        idUrl: r.image_url,
        status: r.status,
        note: r.rejection_note,
        createdAt: r.created_at,
      })),
      pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
    });
  } catch (error) {
    console.error("[Admin] listVerifications error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch verifications" });
  }
}

export async function verifyStudentId(req: Request, res: Response): Promise<void> {
  try {
    const { action, note } = req.body;
    const adminId = req.user!.id;
    if (!["approve", "reject"].includes(action)) { res.status(400).json({ success: false, message: "Action must be 'approve' or 'reject'" }); return; }

    const verification = await db.query<any>("SELECT id, user_id, status FROM student_id_verifications WHERE id = $1", [req.params.id]);
    if (verification.rows.length === 0) { res.status(404).json({ success: false, message: "Verification not found" }); return; }
    if (verification.rows[0].status !== "pending") { res.status(400).json({ success: false, message: "Verification already reviewed" }); return; }
    const targetUserId = verification.rows[0].user_id;

    await withTransaction(async (client) => {
      if (action === "approve") {
        // Prevent double verification
        const userCheck = await client.query("SELECT is_verified_student FROM users WHERE id = $1 FOR UPDATE", [targetUserId]);
        if (userCheck.rows[0]?.is_verified_student) {
          throw Object.assign(new Error("Student already verified"), { statusCode: 400 });
        }

        await client.query(
          "UPDATE student_id_verifications SET status = 'approved', reviewed_by = $1, reviewed_at = NOW(), updated_at = NOW() WHERE id = $2",
          [adminId, req.params.id],
        );
        await client.query(
          "UPDATE users SET is_verified_student = true, updated_at = NOW() WHERE id = $1",
          [targetUserId],
        );
      } else {
        await client.query(
          "UPDATE student_id_verifications SET status = 'rejected', reviewed_by = $1, reviewed_at = NOW(), rejection_note = $2, updated_at = NOW() WHERE id = $3",
          [adminId, note || null, req.params.id],
        );
      }

      // Audit log
      await client.query(
        `INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, details, created_at)
         VALUES ($1, $2, 'student_verification', $3, $4, NOW())`,
        [adminId, action === "approve" ? "approve_verification" : "reject_verification", req.params.id, note || null],
      );
    });

    if (action === "approve") {
      onTrustEvent(targetUserId, "student_verified").catch(() => {});
    }

    notifyUser(targetUserId, {
      type: "verification_result", title: action === "approve" ? "ID Verified" : "Verification Rejected",
      body: action === "approve" ? "Your student ID has been verified. You can now access all features." : `Your student ID verification was rejected.${note ? ` Reason: ${note}` : " Please resubmit with a clearer image."}`,
      actorId: adminId, taskId: undefined, conversationId: undefined,
    }).catch(() => {});
    res.json({ success: true, message: `Verification ${action === "approve" ? "approved" : "rejected"}` });
  } catch (error: any) {
    if (error.statusCode === 400) { res.status(400).json({ success: false, message: error.message }); return; }
    console.error("[Admin] verifyStudentId error:", error);
    res.status(500).json({ success: false, message: "Failed to review verification" });
  }
}

// WHAT: List manual transfers, default status=pending
export async function listManualTransfers(req: Request, res: Response): Promise<void> {
  try {
    const status = (req.query.status as string) || "pending";
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.perPage as string) || 20;
    const offset = (page - 1) * perPage;
    const [rows, countRes] = await Promise.all([
      db.query<any>(
        `SELECT mt.*, jsonb_build_object('id', u.id, 'fullName', u.full_name, 'email', u.email) as "user"
         FROM manual_transfers mt JOIN users u ON mt.user_id = u.id
         WHERE mt.status = $1 ORDER BY mt.created_at DESC LIMIT $2 OFFSET $3`,
        [status, perPage, offset],
      ),
      db.query<{ count: string }>("SELECT COUNT(*) as count FROM manual_transfers WHERE status = $1", [status]),
    ]);
    res.json({ success: true, data: rows.rows, pagination: { page, perPage, total: parseInt(countRes.rows[0]?.count || "0", 10) } });
  } catch (error) {
    console.error("[Admin] listManualTransfers error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch manual transfers" });
  }
}

// WHAT: Confirm a manual transfer (credits wallet)
export async function confirmManualTransfer(req: Request, res: Response): Promise<void> {
  try {
    const result = await svcConfirmTransfer(req.params.id, req.user!.id);
    res.json({ success: true, data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to confirm transfer";
    res.status(400).json({ success: false, message: msg });
  }
}

// WHAT: Reject a manual transfer
export async function rejectManualTransfer(req: Request, res: Response): Promise<void> {
  try {
    const { reason } = req.body;
    if (!reason) { res.status(400).json({ success: false, message: "Rejection reason is required" }); return; }
    const transfer = await svcRejectTransfer(req.params.id, req.user!.id, reason);
    res.json({ success: true, data: transfer });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to reject transfer";
    res.status(400).json({ success: false, message: msg });
  }
}

// WHAT: List withdrawal requests, filterable by status
export async function listWithdrawals(req: Request, res: Response): Promise<void> {
  try {
    const status = (req.query.status as string) || "pending";
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.perPage as string) || 20;
    const offset = (page - 1) * perPage;
    const [rows, countRes] = await Promise.all([
      db.query<any>(
        `SELECT wr.*, jsonb_build_object('id', u.id, 'fullName', u.full_name, 'email', u.email) as "user"
         FROM withdrawal_requests wr JOIN users u ON wr.user_id = u.id
         WHERE wr.status = $1 ORDER BY wr.created_at DESC LIMIT $2 OFFSET $3`,
        [status, perPage, offset],
      ),
      db.query<{ count: string }>("SELECT COUNT(*) as count FROM withdrawal_requests WHERE status = $1", [status]),
    ]);
    res.json({ success: true, data: rows.rows, pagination: { page, perPage, total: parseInt(countRes.rows[0]?.count || "0", 10) } });
  } catch (error) {
    console.error("[Admin] listWithdrawals error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch withdrawals" });
  }
}

// WHAT: Manually mark withdrawal as processed
export async function processWithdrawal(req: Request, res: Response): Promise<void> {
  try {
    await db.query("UPDATE withdrawal_requests SET status = 'processed', processed_by = $1, processed_at = NOW(), updated_at = NOW() WHERE id = $2 AND status = 'pending'", [req.user!.id, req.params.id]);
    res.json({ success: true, message: "Withdrawal marked as processed" });
  } catch (error) {
    console.error("[Admin] processWithdrawal error:", error);
    res.status(500).json({ success: false, message: "Failed to process withdrawal" });
  }
}

// WHAT: List reports, filter by status
export async function listReports(req: Request, res: Response): Promise<void> {
  try {
    const status = req.query.status as string || "";
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.perPage as string) || 20;
    const offset = (page - 1) * perPage;
    const params: any[] = [];
    let whereSQL = "";
    let idx = 1;
    if (status) { whereSQL = "WHERE r.status = $1"; params.push(status); idx++; }
    const [rows, countRes] = await Promise.all([
      db.query<any>(
        `SELECT r.id, r.reason, r.description, r.status, r.resolution, r.created_at,
          jsonb_build_object('id', rep.id, 'fullName', rep.full_name) as reporter,
          jsonb_build_object('id', ru.id, 'fullName', ru.full_name) as reported_user
         FROM reports r
         JOIN users rep ON r.reporter_id = rep.id
         LEFT JOIN users ru ON r.reported_user_id = ru.id
         ${whereSQL} ORDER BY r.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
        status ? [...params, perPage, offset] : [perPage, offset],
      ),
      db.query<{ count: string }>(`SELECT COUNT(*) as count FROM reports r ${whereSQL}`, params),
    ]);
    res.json({ success: true, data: rows.rows, pagination: { page, perPage, total: parseInt(countRes.rows[0]?.count || "0", 10) } });
  } catch (error) {
    console.error("[Admin] listReports error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch reports" });
  }
}

// WHAT: Resolve a report
export async function resolveReport(req: Request, res: Response): Promise<void> {
  try {
    const { status, resolution } = req.body; // status: 'resolved' | 'dismissed'
    if (!["resolved", "dismissed"].includes(status)) { res.status(400).json({ success: false, message: "Status must be 'resolved' or 'dismissed'" }); return; }

    const report = await db.query<any>("SELECT r.id, r.reported_user_id, r.status FROM reports r WHERE r.id = $1", [req.params.id]);
    if (report.rows.length === 0) { res.status(404).json({ success: false, message: "Report not found" }); return; }

    await db.query("UPDATE reports SET status = $1, resolution = $2, resolved_by = $3, resolved_at = NOW(), updated_at = NOW() WHERE id = $4",
      [status, resolution || null, req.user!.id, req.params.id]);

    if (report.rows[0].reported_user_id && status === "resolved") {
      onTrustEvent(report.rows[0].reported_user_id, "report_resolved").catch(() => {});
    }
    res.json({ success: true, message: `Report ${status}` });
  } catch (error) {
    console.error("[Admin] resolveReport error:", error);
    res.status(500).json({ success: false, message: "Failed to resolve report" });
  }
}

// WHAT: List all tasks (moderation view) with filter options
export async function listTasks(req: Request, res: Response): Promise<void> {
  try {
    const status = req.query.status as string;
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.perPage as string) || 20;
    const offset = (page - 1) * perPage;
    const params: any[] = [];
    let whereSQL = "";
    let idx = 1;
    if (status) { whereSQL = "WHERE t.status = $1"; params.push(status); idx++; }
    const [rows, countRes] = await Promise.all([
      db.query<any>(
        `SELECT t.id, t.title, t.budget_kobo, t.status, t.is_urgent, t.created_at,
          jsonb_build_object('id', u.id, 'fullName', u.full_name) as poster,
          jsonb_build_object('id', c.id, 'name', c.name) as category
         FROM tasks t JOIN users u ON t.poster_id = u.id JOIN categories c ON t.category_id = c.id
         ${whereSQL} ORDER BY t.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
        status ? [...params, perPage, offset] : [perPage, offset],
      ),
      db.query<{ count: string }>(`SELECT COUNT(*) as count FROM tasks ${whereSQL}`, params),
    ]);
    res.json({ success: true, data: rows.rows.map((r: any) => ({ id: r.id, title: r.title, budget: { kobo: r.budget_kobo, naira: r.budget_kobo / 100 }, status: r.status, isUrgent: r.is_urgent, category: r.category, poster: r.poster, createdAt: r.created_at })), pagination: { page, perPage, total: parseInt(countRes.rows[0]?.count || "0", 10) } });
  } catch (error) {
    console.error("[Admin] listTasks error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch tasks" });
  }
}

// WHAT: Admin cancel any task regardless of status, refund escrow if in_progress
export async function cancelTaskAdmin(req: Request, res: Response): Promise<void> {
  try {
    const task = await db.query<any>("SELECT id, status, budget_kobo, poster_id, title FROM tasks WHERE id = $1", [req.params.id]);
    if (task.rows.length === 0) { res.status(404).json({ success: false, message: "Task not found" }); return; }
    const t = task.rows[0];

    await db.query("UPDATE tasks SET status = 'cancelled', updated_at = NOW() WHERE id = $1", [t.id]);

    if (t.status === 'in_progress') {
      const { refundEscrow } = await import("../services/wallet.service");
      const { withTransaction } = await import("../config/db");
      await withTransaction(async (client: any) => {
        await refundEscrow(client, t.poster_id, t.budget_kobo, t.id);
      });
    }

    notifyUser(t.poster_id, { type: "task_cancelled", title: "Task Cancelled by Admin", body: `Your task "${t.title}" has been cancelled by an administrator.${t.status === 'in_progress' ? ' Escrow has been refunded.' : ''}`, taskId: t.id, conversationId: undefined, actorId: req.user!.id }).catch(() => {});

    res.json({ success: true, message: "Task cancelled", data: { id: t.id, status: "cancelled" } });
  } catch (error) {
    console.error("[Admin] cancelTaskAdmin error:", error);
    res.status(500).json({ success: false, message: "Failed to cancel task" });
  }
}

// WHAT: List all wallet_transactions with filters
export async function listPlatformTransactions(req: Request, res: Response): Promise<void> {
  try {
    const type = req.query.type as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.perPage as string) || 20;
    const offset = (page - 1) * perPage;
    const params: any[] = [];
    const clauses: string[] = [];
    let idx = 1;

    if (type) { clauses.push(`wt.type = $${idx}`); params.push(type); idx++; }
    if (startDate) { clauses.push(`wt.created_at >= $${idx}`); params.push(startDate); idx++; }
    if (endDate) { clauses.push(`wt.created_at <= $${idx}`); params.push(endDate); idx++; }

    const whereSQL = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    const [rows, countRes] = await Promise.all([
      db.query<any>(
        `SELECT wt.id, wt.user_id, wt.type, wt.amount AS amount_kobo, wt.balance_before, wt.balance_after, wt.description, wt.created_at,
          jsonb_build_object('id', u.id, 'fullName', u.full_name, 'email', u.email) as "user"
         FROM wallet_transactions wt JOIN users u ON wt.user_id = u.id
         ${whereSQL} ORDER BY wt.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, perPage, offset],
      ),
      db.query<{ count: string }>(`SELECT COUNT(*) as count FROM wallet_transactions wt ${whereSQL}`, params),
    ]);
    res.json({ success: true, data: rows.rows, pagination: { page, perPage, total: parseInt(countRes.rows[0]?.count || "0", 10) } });
  } catch (error) {
    console.error("[Admin] listPlatformTransactions error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch transactions" });
  }
}

// WHAT: List runner applications (status = pending)
export async function listRunnerApplications(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.perPage as string) || 20;
    const offset = (page - 1) * perPage;
    const [rows, countRes] = await Promise.all([
      db.query<any>(
        "SELECT id, full_name AS \"fullName\", email, school, department, level, trust_score AS \"trustScore\", runner_status AS \"runnerStatus\", created_at, updated_at FROM users WHERE runner_status = 'pending' ORDER BY updated_at DESC LIMIT $1 OFFSET $2",
        [perPage, offset],
      ),
      db.query<{ count: string }>("SELECT COUNT(*) as count FROM users WHERE runner_status = 'pending'"),
    ]);
    res.json({ success: true, data: rows.rows, pagination: { page, perPage, total: parseInt(countRes.rows[0]?.count || "0", 10) } });
  } catch (error) {
    console.error("[Admin] listRunnerApplications error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch runner applications" });
  }
}

// WHAT: Approve or reject a runner application
export async function reviewRunnerApplication(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { action } = req.body;
    if (!["approve", "reject"].includes(action)) {
      res.status(400).json({ success: false, message: "Action must be 'approve' or 'reject'" });
      return;
    }
    const user = await db.query<any>("SELECT * FROM users WHERE id = $1", [id]);
    if (user.rows.length === 0) { res.status(404).json({ success: false, message: "User not found" }); return; }
    if (user.rows[0].runner_status !== "pending") {
      res.status(400).json({ success: false, message: "User does not have a pending runner application" });
      return;
    }
    if (action === "approve") {
      await db.query(
        "UPDATE users SET runner_status = 'approved', roles = CASE WHEN NOT ('runner' = ANY(roles)) THEN array_append(roles, 'runner') ELSE roles END, updated_at = NOW() WHERE id = $1",
        [id],
      );
      const target = await db.query<any>("SELECT full_name FROM users WHERE id = $1", [id]);
      const name = target.rows[0]?.full_name || 'You';
      notifyUser(id, {
        type: 'runner_approved',
        title: '🎉 Welcome to the Runner Team!',
        body: `${name}, your application to become a NeedRunner has been approved! Start browsing and earning now.`,
        actorId: req.user!.id,
        conversationId: undefined,
        taskId: undefined,
      }).catch(() => {});
    } else {
      await db.query(
        "UPDATE users SET runner_status = 'none', updated_at = NOW() WHERE id = $1",
        [id],
      );
      notifyUser(id, {
        type: 'runner_rejected',
        title: 'Application Update',
        body: 'Your runner application was not approved at this time. You can reapply later.',
        actorId: req.user!.id,
        conversationId: undefined,
        taskId: undefined,
      }).catch(() => {});
    }
    await db.query(
      "INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, details, created_at) VALUES ($1, $2, 'runner_application', $3, $4, NOW())",
      [req.user!.id, `${action}_runner`, id, JSON.stringify({ action })],
    );
    res.json({ success: true, message: `Runner application ${action}d` });
  } catch (error) {
    console.error("[Admin] reviewRunnerApplication error:", error);
    res.status(500).json({ success: false, message: "Failed to review runner application" });
  }
}
