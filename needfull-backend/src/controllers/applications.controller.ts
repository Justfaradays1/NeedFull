// WHAT: Applications controller — apply, accept, reject, counter, withdraw
// WHY: Delegates to application.service; new endpoints for getForTask, getMyApplications, withdraw
// FUTURE: Add batch operations, add reason codes

import { Request, Response } from "express";
import db from "../config/db";
import { apply, acceptApplication, rejectApplication, counterOffer, acceptCounterOffer } from "../services/application.service";

export async function applyHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await apply(req.user!.id, { taskId: req.body.taskId, message: req.body.message, proposedAmountNaira: req.body.proposedAmountNaira });
    res.status(201).json({ success: true, message: "Application submitted", data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to apply";
    console.error("[Applications] applyHandler error:", error);
    res.status(400).json({ success: false, message: msg });
  }
}

export async function acceptApplicationHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await acceptApplication(req.params.applicationId, req.user!.id);
    res.json({ success: true, ...result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to accept application";
    console.error("[Applications] acceptApplicationHandler error:", error);
    res.status(400).json({ success: false, message: msg });
  }
}

export async function rejectApplicationHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await rejectApplication(req.params.applicationId, req.user!.id);
    res.json({ success: true, ...result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to reject application";
    console.error("[Applications] rejectApplicationHandler error:", error);
    res.status(400).json({ success: false, message: msg });
  }
}

export async function counterOfferHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await counterOffer(req.params.applicationId, req.user!.id, req.body.counterAmountNaira);
    res.json({ success: true, ...result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to send counter offer";
    console.error("[Applications] counterOfferHandler error:", error);
    res.status(400).json({ success: false, message: msg });
  }
}

export async function acceptCounterOfferHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await acceptCounterOffer(req.params.applicationId, req.user!.id);
    res.json({ success: true, ...result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to accept counter offer";
    console.error("[Applications] acceptCounterOfferHandler error:", error);
    res.status(400).json({ success: false, message: msg });
  }
}

// WHAT: Get applications for a task (poster only)
export async function getForTask(req: Request, res: Response): Promise<void> {
  try {
    const result = await db.query<any>(
      `SELECT a.id, a.task_id, a.runner_id, a.message, a.proposed_amount_kobo, a.counter_amount_kobo, a.agreed_amount_kobo, a.status, a.created_at,
        jsonb_build_object('id', u.id, 'fullName', u.full_name, 'trustScore', u.trust_score, 'profilePictureUrl', u.profile_picture_url, 'department', u.department, 'level', u.level) as runner
       FROM task_applications a JOIN users u ON a.runner_id = u.id
       WHERE a.task_id = $1 ORDER BY a.created_at DESC`,
      [req.params.taskId],
    );
    res.json({ success: true, data: result.rows.map((r: any) => ({
      id: r.id, taskId: r.task_id, runnerId: r.runner_id, message: r.message,
      proposedAmount: r.proposed_amount_kobo ? { kobo: r.proposed_amount_kobo, naira: r.proposed_amount_kobo / 100 } : null,
      counterAmount: r.counter_amount_kobo ? { kobo: r.counter_amount_kobo, naira: r.counter_amount_kobo / 100 } : null,
      agreedAmount: r.agreed_amount_kobo ? { kobo: r.agreed_amount_kobo, naira: r.agreed_amount_kobo / 100 } : null,
      status: r.status, createdAt: r.created_at, runner: r.runner,
    })) });
  } catch (error) {
    console.error("[Applications] getForTask error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch applications" });
  }
}

// WHAT: Get current user's applications
export async function getMyApplications(req: Request, res: Response): Promise<void> {
  try {
    const result = await db.query<any>(
      `SELECT a.id, a.task_id, a.message, a.proposed_amount_kobo, a.counter_amount_kobo, a.agreed_amount_kobo, a.status, a.created_at,
        jsonb_build_object('id', t.id, 'title', t.title, 'budgetKobo', t.budget_kobo, 'status', t.status, 'isUrgent', t.is_urgent) as task,
        jsonb_build_object('id', u.id, 'fullName', u.full_name) as poster
       FROM task_applications a JOIN tasks t ON a.task_id = t.id JOIN users u ON t.poster_id = u.id
       WHERE a.runner_id = $1 ORDER BY a.created_at DESC`,
      [req.user!.id],
    );
    res.json({ success: true, data: result.rows.map((r: any) => ({
      id: r.id, taskId: r.task_id, message: r.message,
      proposedAmount: r.proposed_amount_kobo ? { kobo: r.proposed_amount_kobo, naira: r.proposed_amount_kobo / 100 } : null,
      counterAmount: r.counter_amount_kobo ? { kobo: r.counter_amount_kobo, naira: r.counter_amount_kobo / 100 } : null,
      agreedAmount: r.agreed_amount_kobo ? { kobo: r.agreed_amount_kobo, naira: r.agreed_amount_kobo / 100 } : null,
      status: r.status, createdAt: r.created_at, task: r.task, poster: r.poster,
    })) });
  } catch (error) {
    console.error("[Applications] getMyApplications error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch your applications" });
  }
}

// WHAT: Withdraw an application (runner removes their own pending/negotiating application)
export async function withdrawApplication(req: Request, res: Response): Promise<void> {
  try {
    const result = await db.query<any>(
      "UPDATE task_applications SET status = 'withdrawn', updated_at = NOW() WHERE id = $1 AND runner_id = $2 AND status IN ('pending', 'negotiating') RETURNING id, status",
      [req.params.applicationId, req.user!.id],
    );
    if (result.rows.length === 0) { res.status(400).json({ success: false, message: "Application not found or cannot be withdrawn" }); return; }
    res.json({ success: true, message: "Application withdrawn", data: { id: result.rows[0].id, status: result.rows[0].status } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to withdraw application";
    console.error("[Applications] withdrawApplication error:", error);
    res.status(400).json({ success: false, message: msg });
  }
}
