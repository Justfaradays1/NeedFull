// WHAT: Task service — all task CRUD operations with geo-filtering, escrow management, and smart matching trigger
// WHY: Centralized task logic ensures consistent budget handling, status transitions, and wallet integration
// FUTURE: Add task templates, add recurring tasks, add AI-based budget suggestions

import db, { queryOne, withTransaction } from "../config/db";
import { uploadImage } from "./cloudinary.service";
import { lockEscrow, releaseEscrow, refundEscrow } from "./wallet.service";
import { notifyUser } from "./notification.service";
import { onTrustEvent } from "./trust.service";
import { notifyNearbyRunners } from "./matching.service";
import { v4 as uuidv4 } from "uuid";
import { MIN_TASK_BUDGET_KOBO } from "../config/constants";

// WHAT: Task row shape from the database
interface TaskRow {
  id: string;
  poster_id: string;
  category_id: string;
  title: string;
  description: string;
  budget_kobo: number;
  deadline: string | null;
  is_urgent: boolean;
  status: string;
  location_label: string | null;
  location: any;
  image_url: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

// WHAT: Filters accepted by listTasks
export interface TaskFilters {
  categoryId?: string;
  status?: string;
  isUrgent?: boolean;
  search?: string;
  sortBy?: "newest" | "nearest" | "budget_high" | "budget_low" | "urgent_first";
  lat?: number;
  lng?: number;
  radiusKm?: number;
  page?: number;
  perPage?: number;
}

// WHAT: Input for creating a task
export interface CreateTaskInput {
  categoryId: string;
  title: string;
  description: string;
  budgetNaira: number;
  deadline?: string;
  isUrgent?: boolean;
  locationLabel?: string;
  lat?: number;
  lng?: number;
  image?: Express.Multer.File;
}

// WHAT: Paginated task list result
interface PaginatedTasks {
  data: any[];
  total: number;
  page: number;
  hasMore: boolean;
}

// WHAT: List tasks with filtering, geo-search, sorting, and pagination
// WHY: Centralised query builder avoids duplicating filter logic across frontend variants
export async function listTasks(
  filters: TaskFilters,
  currentUserId?: string,
): Promise<PaginatedTasks> {
  const {
    categoryId,
    status,
    isUrgent,
    search,
    sortBy = "newest",
    lat,
    lng,
    radiusKm,
    page = 1,
    perPage = 20,
  } = filters;

  const offset = (page - 1) * perPage;
  const params: any[] = [];
  let paramIndex = 1;
  const whereClauses: string[] = [];

  // WHAT: Filter by category
  if (categoryId) {
    whereClauses.push(`t.category_id = $${paramIndex++}`);
    params.push(categoryId);
  }

  // WHAT: Filter by status (default: open)
  whereClauses.push(`t.status = $${paramIndex++}`);
  params.push(status || "open");

  // WHAT: Filter urgent tasks
  if (isUrgent !== undefined) {
    whereClauses.push(`t.is_urgent = $${paramIndex++}`);
    params.push(isUrgent);
  }

  // WHAT: Text search across title and description
  if (search && search.trim()) {
    whereClauses.push(
      `(t.title ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex})`,
    );
    params.push(`%${search.trim()}%`);
    paramIndex++;
  }

  // WHAT: Geo filter using PostGIS ST_DWithin
  // WHY: Efficient spatial query using spatial index when lat/lng and radius provided
  let distanceSelect = "NULL::float as distance";
  if (lat !== undefined && lng !== undefined && radiusKm) {
    whereClauses.push(
      `t.location IS NOT NULL AND
       ST_DWithin(
         t.location,
         ST_SetSRID(ST_MakePoint($${paramIndex}, $${paramIndex + 1}), 4326)::geography,
         $${paramIndex + 2}
       )`,
    );
    params.push(lng, lat, radiusKm * 1000);
    paramIndex += 3;

    distanceSelect = `ROUND(ST_Distance(
      t.location,
      ST_SetSRID(ST_MakePoint($${paramIndex - 3}, $${paramIndex - 2}), 4326)::geography
    )::numeric, 0)::float as distance`;
  }

  // WHAT: Exclude current user's own tasks
  if (currentUserId) {
    whereClauses.push(`t.poster_id != $${paramIndex++}`);
    params.push(currentUserId);
  }

  const whereSQL =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  // WHAT: Sort options
  let orderSQL: string;
  switch (sortBy) {
    case "nearest":
      orderSQL =
        lat !== undefined && lng !== undefined
          ? "ORDER BY distance ASC NULLS LAST, t.created_at DESC"
          : "ORDER BY t.created_at DESC";
      break;
    case "budget_high":
      orderSQL = "ORDER BY t.budget_kobo DESC, t.created_at DESC";
      break;
    case "budget_low":
      orderSQL = "ORDER BY t.budget_kobo ASC, t.created_at DESC";
      break;
    case "urgent_first":
      orderSQL = "ORDER BY t.is_urgent DESC, t.created_at DESC";
      break;
    default:
      orderSQL = "ORDER BY t.created_at DESC";
  }

  // WHAT: Count total matching rows
  const countSQL = `
    SELECT COUNT(*) as count
    FROM tasks t
    ${whereSQL}
  `;
  const countResult = await db.query<{ count: string }>(countSQL, params);
  const total = parseInt(countResult.rows[0]?.count || "0", 10);

  // WHAT: Fetch paginated results with poster profile and category
  const dataSQL = `
    SELECT
      t.id, t.title, t.description, t.budget_kobo, t.deadline,
      t.is_urgent, t.status, t.location_label,
      ST_X(t.location::geometry) as lat, ST_Y(t.location::geometry) as lng,
      t.image_url, t.assigned_to as runner_id, t.created_at, t.updated_at,
      ${distanceSelect},
      jsonb_build_object(
        'id', u.id,
        'fullName', u.full_name,
        'email', u.email,
        'trustScore', u.trust_score
      ) as poster,
      jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'icon', c.icon
      ) as category
    FROM tasks t
    JOIN users u ON t.poster_id = u.id
    JOIN categories c ON t.category_id = c.id
    ${whereSQL}
    ${orderSQL}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  params.push(perPage, offset);

  const result = await db.query<any>(dataSQL, params);

  const data = result.rows.map((row: any) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    budget: { kobo: row.budget_kobo, naira: row.budget_kobo / 100 },
    deadline: row.deadline,
    isUrgent: row.is_urgent,
    status: row.status,
    locationLabel: row.location_label,
    lat: row.lat,
    lng: row.lng,
    imageUrl: row.image_url,
    runnerId: row.runner_id,
    distance: row.distance,
    poster: row.poster,
    category: row.category,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return {
    data,
    total,
    page,
    hasMore: offset + perPage < total,
  };
}

// WHAT: Get a single task by ID with full details
// WHY: Detail view needs poster profile, category, and distance
export async function getTask(
  taskId: string,
  currentLat?: number,
  currentLng?: number,
): Promise<any> {
  let distanceSelect = "NULL::float as distance";
  const params: any[] = [taskId];
  let paramIndex = 2;

  if (currentLat !== undefined && currentLng !== undefined) {
    distanceSelect = `ROUND(ST_Distance(
      t.location,
      ST_SetSRID(ST_MakePoint($${paramIndex}, $${paramIndex + 1}), 4326)::geography
    )::numeric, 0)::float as distance`;
    params.push(currentLng, currentLat);
    paramIndex += 2;
  }

  const sql = `
    SELECT
      t.id, t.poster_id, t.title, t.description, t.budget_kobo, t.deadline,
      t.is_urgent, t.status, t.location_label,
      ST_X(t.location::geometry) as lat, ST_Y(t.location::geometry) as lng,
      t.image_url, t.assigned_to as runner_id, t.created_at, t.updated_at,
      ${distanceSelect},
      jsonb_build_object(
        'id', u.id,
        'fullName', u.full_name,
        'email', u.email,
        'phone', u.phone,
        'trustScore', u.trust_score,
        'department', u.department,
        'level', u.level,
        'hostel', u.hostel,
        'avatarUrl', u.avatar_url,
        'tasksCompleted', u.tasks_completed
      ) as poster,
      jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'icon', c.icon
      ) as category
    FROM tasks t
    JOIN users u ON t.poster_id = u.id
    JOIN categories c ON t.category_id = c.id
    WHERE t.id = $1
  `;

  const row = await queryOne<any>(sql, params);

  return {
    id: row.id,
    posterId: row.poster_id,
    title: row.title,
    description: row.description,
    budget: { kobo: row.budget_kobo, naira: row.budget_kobo / 100 },
    deadline: row.deadline,
    isUrgent: row.is_urgent,
    status: row.status,
    locationLabel: row.location_label,
    lat: row.lat,
    lng: row.lng,
    imageUrl: row.image_url,
    runnerId: row.runner_id,
    distance: row.distance,
    poster: row.poster,
    category: row.category,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// WHAT: Create a new task — upload image, insert row, lock escrow, trigger smart matching
// WHY: Atomic creation ensures budget is locked before task becomes visible to runners
export async function createTask(
  userId: string,
  input: CreateTaskInput,
): Promise<any> {
  const budgetKobo = Math.floor(input.budgetNaira * 100);

  if (budgetKobo < MIN_TASK_BUDGET_KOBO) {
    throw new Error(
      `Minimum task budget is ₦${(MIN_TASK_BUDGET_KOBO / 100).toFixed(0)}`,
    );
  }

  // WHAT: Upload image to Cloudinary if provided
  let imageUrl: string | null = null;
  if (input.image) {
    try {
      imageUrl = await uploadImage(input.image.buffer, "tasks", {
        width: 1200,
      });
    } catch {
      // Image upload failure is non-blocking — task can post without image
      console.warn("[Task] Image upload failed, creating task without image");
    }
  }

  // WHAT: Create task within transaction — insert + lock escrow
  // WHY: Budget must be locked before task is publicly visible
  const task = await withTransaction(async (client) => {
    const taskId = uuidv4();
    const now = new Date().toISOString();

    // WHAT: Insert task row
    const result = await client.query<TaskRow>(
      `INSERT INTO tasks
       (id, poster_id, category_id, title, description, budget_kobo,
        deadline, is_urgent, location_label, location, image_url,
        status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9,
        CASE WHEN $10 IS NOT NULL AND $11 IS NOT NULL THEN ST_SetSRID(ST_MakePoint($11::float, $10::float), 4326)::geography ELSE NULL END,
        $12, 'open', $13, $13)
       RETURNING *`,
      [
        taskId,
        userId,
        input.categoryId,
        input.title.trim(),
        input.description.trim(),
        budgetKobo,
        input.deadline || null,
        input.isUrgent || false,
        input.locationLabel || null,
        input.lat || null,
        input.lng || null,
        imageUrl,
        now,
      ],
    );

    // WHAT: Lock task budget in escrow
    // WHY: Ensures poster has funds, prevents unpaid tasks
    await lockEscrow(client, userId, budgetKobo, taskId);

    return result.rows[0];
  });

  // WHAT: Notify nearby available runners (non-blocking)
  // WHY: Immediately notify potentially interested runners without delaying task creation response
  notifyNearbyRunners(task).catch((err) =>
    console.warn("[Matching] notifyNearbyRunners error:", err),
  );

  return {
    id: task.id,
    title: task.title,
    budget: { kobo: task.budget_kobo, naira: task.budget_kobo / 100 },
    status: task.status,
    createdAt: task.created_at,
  };
}

// WHAT: Update task fields — only poster can update, only while status is 'open'
// WHY: Prevent fraudulent edits after work has started
export async function updateTask(
  taskId: string,
  userId: string,
  fields: Partial<{
    title: string;
    description: string;
    budgetNaira: number;
    deadline: string;
    isUrgent: boolean;
    locationLabel: string;
    lat: number;
    lng: number;
  }>,
): Promise<any> {
  // WHAT: Verify task exists, belongs to user, and is open
  const task = await queryOne<TaskRow>(
    `SELECT id, poster_id, status FROM tasks WHERE id = $1`,
    [taskId],
  );

  if (task.poster_id !== userId) {
    throw new Error("Only the task poster can update this task");
  }
  if (task.status !== "open") {
    throw new Error("Only open tasks can be updated");
  }

  // WHAT: Build dynamic UPDATE
  const setClauses: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;
  const now = new Date().toISOString();

  if (fields.title !== undefined) {
    setClauses.push(`title = $${paramIndex++}`);
    params.push(fields.title.trim());
  }
  if (fields.description !== undefined) {
    setClauses.push(`description = $${paramIndex++}`);
    params.push(fields.description.trim());
  }
  if (fields.budgetNaira !== undefined) {
    const budgetKobo = Math.floor(fields.budgetNaira * 100);
    if (budgetKobo < MIN_TASK_BUDGET_KOBO) {
      throw new Error(
        `Minimum task budget is ₦${(MIN_TASK_BUDGET_KOBO / 100).toFixed(0)}`,
      );
    }
    setClauses.push(`budget_kobo = $${paramIndex++}`);
    params.push(budgetKobo);
  }
  if (fields.deadline !== undefined) {
    setClauses.push(`deadline = $${paramIndex++}`);
    params.push(fields.deadline || null);
  }
  if (fields.isUrgent !== undefined) {
    setClauses.push(`is_urgent = $${paramIndex++}`);
    params.push(fields.isUrgent);
  }
  if (fields.locationLabel !== undefined) {
    setClauses.push(`location_label = $${paramIndex++}`);
    params.push(fields.locationLabel || null);
  }
  if (fields.lat !== undefined && fields.lng !== undefined) {
    setClauses.push(`location = ST_SetSRID(ST_MakePoint($${paramIndex}::float, $${paramIndex + 1}::float), 4326)::geography`);
    params.push(fields.lng, fields.lat);
    paramIndex += 2;
  } else if (fields.lat !== undefined) {
    setClauses.push(`location = ST_SetSRID(ST_MakePoint(COALESCE(ST_X(location::geometry), 0), $${paramIndex}::float), 4326)::geography`);
    params.push(fields.lat);
    paramIndex++;
  } else if (fields.lng !== undefined) {
    setClauses.push(`location = ST_SetSRID(ST_MakePoint($${paramIndex}::float, COALESCE(ST_Y(location::geometry), 0)), 4326)::geography`);
    params.push(fields.lng);
    paramIndex++;
  }

  if (setClauses.length === 0) {
    throw new Error("No fields to update");
  }

  setClauses.push(`updated_at = $${paramIndex++}`);
  params.push(now);
  params.push(taskId);

  const sql = `UPDATE tasks SET ${setClauses.join(", ")} WHERE id = $${paramIndex} RETURNING *`;
  const result = await queryOne<TaskRow>(sql, params);

  return {
    id: result.id,
    title: result.title,
    budget: { kobo: result.budget_kobo, naira: result.budget_kobo / 100 },
    status: result.status,
    updatedAt: result.updated_at,
  };
}

// WHAT: Cancel a task — poster or admin can cancel
// WHY: If in_progress, escrow must be refunded and runner notified
export async function cancelTask(
  taskId: string,
  userId: string,
  userRole: string,
): Promise<{ status: string; message: string }> {
  const task = await queryOne<TaskRow>(
    `SELECT id, poster_id, status, budget_kobo, assigned_to as runner_id, title
     FROM tasks WHERE id = $1`,
    [taskId],
  );

  // WHAT: Only poster or admin can cancel
  if (task.poster_id !== userId && userRole !== "admin") {
    throw new Error("Only the task poster or an admin can cancel this task");
  }

  // WHAT: Only open or in_progress tasks can be cancelled
  if (task.status !== "open" && task.status !== "in_progress") {
    throw new Error(
      `Task status is "${task.status}". Only open or in_progress tasks can be cancelled.`,
    );
  }

  await withTransaction(async (client) => {
    // WHAT: If in_progress, refund escrow to poster and notify runner
    if (task.status === "in_progress" && task.runner_id) {
      await refundEscrow(client, task.poster_id, task.budget_kobo, taskId);
    }

    await client.query(
      `UPDATE tasks SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
      [taskId],
    );
  });

  // WHAT: Notify runner if assigned
  if (task.status === "in_progress" && task.runner_id) {
    await notifyUser(task.runner_id, {
      type: "task_cancelled",
      title: "Task Cancelled",
      body: `The task "${task.title}" has been cancelled by the poster.`,
      taskId,
      conversationId: undefined,
      actorId: userId,
    });
  }

  // WHAT: Fire-and-forget trust recalculation for runner (task cancellation penalty)
  // WHY: Don't block response; trust score is eventually consistent
  if (task.runner_id) {
    onTrustEvent(task.runner_id, "task_cancelled").catch(console.error);
  }

  return { status: "cancelled", message: "Task has been cancelled" };
}

// WHAT: Confirm task completion — poster confirms, escrow released, both sides prompted for review
// WHY: Final step in task lifecycle — triggers payment and reputation update
export async function confirmCompletion(
  taskId: string,
  userId: string,
): Promise<any> {
  const task = await queryOne<TaskRow>(
    `SELECT id, poster_id, assigned_to as runner_id, budget_kobo, title
     FROM tasks WHERE id = $1`,
    [taskId],
  );

  // WHAT: Only poster can confirm
  if (task.poster_id !== userId) {
    throw new Error("Only the task poster can confirm completion");
  }

  // WHAT: Must be in_progress
  if (task.status !== "in_progress") {
    throw new Error(
      `Task status is "${task.status}". Task must be in_progress to confirm completion.`,
    );
  }

  if (!task.runner_id) {
    throw new Error("No runner assigned to this task");
  }

  // WHAT: Atomic completion — release escrow, update status, update stats
  await withTransaction(async (client) => {
    // WHAT: Release escrow to runner (platform fee deducted internally)
    await releaseEscrow(
      client,
      task.poster_id,
      task.runner_id!,
      task.budget_kobo,
      taskId,
    );

    // WHAT: Update task status
    await client.query(
      `UPDATE tasks SET status = 'completed', updated_at = NOW() WHERE id = $1`,
      [taskId],
    );

    // WHAT: Increment poster's tasks_completed
    await client.query(
      `UPDATE users SET tasks_completed = tasks_completed + 1, updated_at = NOW() WHERE id = $1`,
      [task.poster_id],
    );

    // WHAT: Increment runner's tasks_completed
    await client.query(
      `UPDATE users SET tasks_completed = tasks_completed + 1, updated_at = NOW() WHERE id = $1`,
      [task.runner_id],
    );
  });

  // WHAT: Prompt both sides for review (non-blocking)
  const promptReview = async (targetId: string, role: string) => {
    try {
      await notifyUser(targetId, {
        type: "review_prompt",
        title: "Rate Your Experience",
        body: `How was your experience with the task "${task.title}"? Please leave a review.`,
        taskId,
        conversationId: undefined,
        actorId: userId,
      });
    } catch (err) {
      console.warn(`[Task] Review prompt failed for ${role} ${targetId}:`, err);
    }
  };

  promptReview(task.poster_id, "poster").catch(() => {});
  promptReview(task.runner_id!, "runner").catch(() => {});

  // WHAT: Fire-and-forget trust recalculation for both users
  // WHY: Don't block response; trust score is eventually consistent and recalculated async
  onTrustEvent(task.poster_id, "task_completed").catch(console.error);
  onTrustEvent(task.runner_id!, "task_completed").catch(console.error);

  return {
    status: "completed",
    message: "Task completed successfully. Escrow has been released.",
    taskId,
  };
}

