// WHAT: Tasks controller — CRUD, lifecycle, and filtering
// WHY: Delegates to task.service for business logic, formats response consistently
// FUTURE: Add pagination metadata helper

import { Request, Response } from "express";
import { listTasks, getTask, createTask, updateTask, cancelTask, confirmCompletion } from "../services/task.service";

export async function listTasksHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await listTasks(
      { categoryId: req.query.categoryId as string, status: req.query.status as string, isUrgent: req.query.isUrgent as any, search: req.query.search as string, sortBy: req.query.sortBy as any, lat: req.query.lat as any, lng: req.query.lng as any, radiusKm: req.query.radiusKm as any, page: req.query.page as any, perPage: req.query.perPage as any },
      req.user?.id,
    );
    res.json({ success: true, ...result });
  } catch (error) {
    console.error("[Tasks] listTasksHandler error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch tasks" });
  }
}

export async function getTaskHandler(req: Request, res: Response): Promise<void> {
  try {
    const task = await getTask(req.params.taskId, req.query.lat ? parseFloat(req.query.lat as string) : undefined, req.query.lng ? parseFloat(req.query.lng as string) : undefined);
    res.json({ success: true, data: task });
  } catch (error: any) {
    if (error.statusCode === 404) { res.status(404).json({ success: false, message: "Task not found" }); return; }
    console.error("[Tasks] getTaskHandler error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch task" });
  }
}

export async function createTaskHandler(req: Request, res: Response): Promise<void> {
  try {
    const task = await createTask(req.user!.id, { categoryId: req.body.categoryId, title: req.body.title, description: req.body.description, budgetNaira: req.body.budgetNaira, deadline: req.body.deadline, isUrgent: req.body.isUrgent, locationLabel: req.body.locationLabel, lat: req.body.lat, lng: req.body.lng, image: req.file });
    res.status(201).json({ success: true, message: "Task created successfully", data: task });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to create task";
    console.error("[Tasks] createTaskHandler error:", error);
    res.status(400).json({ success: false, message: msg });
  }
}

export async function updateTaskHandler(req: Request, res: Response): Promise<void> {
  try {
    const task = await updateTask(req.params.taskId, req.user!.id, req.body);
    res.json({ success: true, data: task });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to update task";
    console.error("[Tasks] updateTaskHandler error:", error);
    res.status(400).json({ success: false, message: msg });
  }
}

export async function cancelTaskHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await cancelTask(req.params.taskId, req.user!.id, req.user!.role);
    res.json({ success: true, ...result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to cancel task";
    console.error("[Tasks] cancelTaskHandler error:", error);
    res.status(400).json({ success: false, message: msg });
  }
}

export async function confirmCompletionHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await confirmCompletion(req.params.taskId, req.user!.id);
    res.json({ success: true, ...result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to confirm completion";
    console.error("[Tasks] confirmCompletionHandler error:", error);
    res.status(400).json({ success: false, message: msg });
  }
}

// WHAT: Get tasks posted by the current user
export async function getMyPostedTasks(req: Request, res: Response): Promise<void> {
  try {
    const { default: db } = await import("../config/db");
    const result = await db.query<any>(
      `SELECT t.id, t.title, t.budget_kobo, t.status, t.is_urgent, t.created_at, t.deadline,
        jsonb_build_object('id', c.id, 'name', c.name, 'icon', c.icon) as category,
        (SELECT COUNT(*) FROM task_applications WHERE task_id = t.id) as application_count
       FROM tasks t JOIN categories c ON t.category_id = c.id
       WHERE t.poster_id = $1 ORDER BY t.created_at DESC`,
      [req.user!.id],
    );
    res.json({ success: true, data: result.rows.map((r: any) => ({ id: r.id, title: r.title, budget: { kobo: r.budget_kobo, naira: r.budget_kobo / 100 }, status: r.status, isUrgent: r.is_urgent, createdAt: r.created_at, deadline: r.deadline, category: r.category, applicationCount: parseInt(r.application_count, 10) })) });
  } catch (error) {
    console.error("[Tasks] getMyPostedTasks error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch your tasks" });
  }
}

// WHAT: Get tasks assigned to the current user as runner
export async function getMyAssignedTasks(req: Request, res: Response): Promise<void> {
  try {
    const { default: db } = await import("../config/db");
    const result = await db.query<any>(
      `SELECT t.id, t.title, t.budget_kobo, t.status, t.is_urgent, t.created_at, t.deadline,
        jsonb_build_object('id', c.id, 'name', c.name, 'icon', c.icon) as category,
        jsonb_build_object('id', u.id, 'fullName', u.full_name) as poster
       FROM tasks t JOIN categories c ON t.category_id = c.id JOIN users u ON t.poster_id = u.id
       WHERE t.assigned_to = $1 ORDER BY t.created_at DESC`,
      [req.user!.id],
    );
    res.json({ success: true, data: result.rows.map((r: any) => ({ id: r.id, title: r.title, budget: { kobo: r.budget_kobo, naira: r.budget_kobo / 100 }, status: r.status, isUrgent: r.is_urgent, createdAt: r.created_at, deadline: r.deadline, category: r.category, poster: r.poster })) });
  } catch (error) {
    console.error("[Tasks] getMyAssignedTasks error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch assigned tasks" });
  }
}
