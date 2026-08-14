// WHAT: Task service — all task CRUD operations with geo-filtering, escrow management, and smart matching trigger
// WHY: Centralized task logic ensures consistent budget handling, status transitions, and wallet integration
// FUTURE: Add task templates, add recurring tasks, add AI-based budget suggestions

import db, { queryOne, withTransaction } from "../config/db";
import { uploadImage } from "./cloudinary.service";
import { lockEscrow, releaseEscrow, refundEscrow } from "./wallet.service";
import { notifyUser } from "./notification.service";
import { onTrustEvent } from "./trust.service";
import { notifyNearbyRunners } from "./matching.service";
import {
  TaskStatus,
  canonicalStatus,
  assertValidTransition,
  assertTransitionFromStorage,
  storageForStatus,
  RunnerPhase,
} from "./task-states";
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
  lat: number | null;
  lng: number | null;
  image_url: string | null;
  assigned_to: string | null;
  runner_id: string | null;
  runner_done_at: string | null;
  work_mode: string | null;
  runner_phase: string | null;
  agreed_amount_kobo: number | null;
  escrow_amount_kobo: number;
  created_at: string;
  updated_at: string;
}

// WHAT: Per-task capabilities — computed server-side, authoritative for UI
// WHY: Never trust client-side role flags; these tell the frontend exactly
//      what buttons to show/enable for the current user on this task
export interface TaskCapabilities {
  canEdit: boolean;
  canCancel: boolean;
  canViewApplications: boolean;
  canHireApplicant: boolean;
  canApply: boolean;
  canWithdrawApplication: boolean;
  canConfirmCompletion: boolean;
  canChat: boolean;
  canRate: boolean;
  canMarkAsDone: boolean;
  canStartWork: boolean;
  canSeeExactLocation: boolean;
}

// WHAT: Compute what the current user is allowed to do on a given task
// WHY: Single source of truth for permission checks — used by both server-side
//      services and returned to the frontend for UI rendering. Uses the task
//      state machine so permission rules track lifecycle phases.
type TaskCapabilityArg = {
  posterId: string;
  assignedRunnerId: string | null;
  status: string;
  runnerDoneAt: string | null;
  runnerPhase?: string | null;
};

export function getTaskCapabilities(
  userId: string,
  task: TaskCapabilityArg,
): TaskCapabilities {
  const isPoster = task.posterId === userId;
  const isRunner = task.assignedRunnerId === userId;
  const canonical = canonicalStatus(task.status, {
    runnerDoneAt: task.runnerDoneAt,
    runnerPhase: task.runnerPhase,
  });
  const s = canonical;
  const hasRunner = !!task.assignedRunnerId;
  const runnerDone = !!task.runnerDoneAt;
  const active = s === TaskStatus.MATCHED
    || s === TaskStatus.ACCEPTED
    || s === TaskStatus.RUNNER_EN_ROUTE
    || s === TaskStatus.STARTED
    || (s === TaskStatus.COMPLETED);
  const finished = s === TaskStatus.PAYMENT_RELEASED || s === TaskStatus.RATED;

  return {
    canEdit: isPoster && s === TaskStatus.PUBLISHED,
    canCancel: isPoster && (
      s === TaskStatus.PUBLISHED || active
    ),
    canViewApplications: isPoster && (s === TaskStatus.PUBLISHED || active),
    canHireApplicant: isPoster && s === TaskStatus.PUBLISHED && hasRunner === false,
    canApply: !isPoster && s === TaskStatus.PUBLISHED && !hasRunner,
    canWithdrawApplication: !isPoster && s === TaskStatus.PUBLISHED,
    canConfirmCompletion: isPoster && s === TaskStatus.COMPLETED && hasRunner,
    canMarkAsDone: isRunner && s === TaskStatus.STARTED && !runnerDone,
    canStartWork: isRunner && (
      s === TaskStatus.MATCHED || s === TaskStatus.ACCEPTED || s === TaskStatus.RUNNER_EN_ROUTE
    ),
    canChat: (isPoster || isRunner) && hasRunner,
    canRate: (isPoster || isRunner) && finished,
    canSeeExactLocation:
      isPoster || isRunner || s === TaskStatus.PAYMENT_RELEASED || s === TaskStatus.RATED,
  };
}

// WHAT: Filters accepted by listTasks
export interface TaskFilters {
  categoryId?: string;
  status?: string;
  isUrgent?: boolean;
  search?: string;
  sortBy?:
    | "newest"
    | "nearest"
    | "budget_high"
    | "budget_low"
    | "urgent_first"
    | "ending_soon";
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
  workMode?: "on_site" | "remote";
  locationLabel?: string;
  lat?: number;
  lng?: number;
  image?: Express.Multer.File;
  inviteRunnerId?: string;
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

  // WHAT: Text search across title, description, poster name, location, and category
  // WHY: Runners search for tasks by keyword, but also by who posted it and where
  if (search && search.trim()) {
    whereClauses.push(
      `(t.title ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex} OR u.full_name ILIKE $${paramIndex} OR t.location_label ILIKE $${paramIndex} OR c.name ILIKE $${paramIndex})`,
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
    case "ending_soon":
      orderSQL = "ORDER BY t.deadline ASC NULLS LAST, t.created_at DESC";
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
      t.is_urgent, t.status, t.location_label, t.runner_done_at,
      t.work_mode, t.runner_phase,
      ST_X(t.location::geometry) as lat, ST_Y(t.location::geometry) as lng,
      t.image_url, t.assigned_to as runner_id, t.created_at, t.updated_at,
      ${distanceSelect},
      (SELECT COUNT(*) FROM task_applications WHERE task_id = t.id)::int as application_count,
      jsonb_build_object(
        'id', u.id,
        'fullName', u.full_name,
        'email', u.email,
        'trustScore', u.trust_score,
        'avatarUrl', u.avatar_url,
        'isVerifiedStudent', u.is_verified_student
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

  const data = result.rows.map((row: any) => {
    const capabilities = currentUserId
      ? getTaskCapabilities(currentUserId, {
          posterId: row.poster.id,
          assignedRunnerId: row.runner_id,
          status: row.status,
          runnerDoneAt: row.runner_done_at,
          runnerPhase: row.runner_phase,
        })
      : undefined;

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      budget: { kobo: row.budget_kobo, naira: row.budget_kobo / 100 },
      deadline: row.deadline,
      isUrgent: row.is_urgent,
      status: row.status,
      workMode: row.work_mode || "on_site",
      runnerPhase: row.runner_phase,
      locationLabel: row.location_label,
      lat: row.lat,
      lng: row.lng,
      imageUrl: row.image_url,
      runnerId: row.runner_id,
      runnerDoneAt: row.runner_done_at,
      distance: row.distance,
      applicationCount: row.application_count,
      poster: row.poster,
      category: row.category,
      capabilities,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });

  return {
    data,
    total,
    page,
    hasMore: offset + perPage < total,
  };
}

// WHAT: Get a single task by ID with full details
// WHY: Detail view needs poster profile, category, distance, and capabilities
export async function getTask(
  taskId: string,
  currentLat?: number,
  currentLng?: number,
  currentUserId?: string,
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
      t.is_urgent, t.status, t.location_label, t.runner_done_at,
      t.work_mode, t.runner_phase, t.agreed_amount_kobo, t.escrow_amount_kobo,
      ST_X(t.location::geometry) as lat, ST_Y(t.location::geometry) as lng,
      t.image_url, t.assigned_to as runner_id, t.created_at, t.updated_at,
      ${distanceSelect},
      (SELECT COUNT(*) FROM task_applications WHERE task_id = t.id)::int as application_count,
      jsonb_build_object(
        'id', u.id,
        'fullName', u.full_name,
        'email', u.email,
        'phone', u.phone,
        'trustScore', u.trust_score,
        'department', u.department,
        'level', u.level,
        'hostel', u.hostel,
        'school', u.school,
        'avatarUrl', u.avatar_url,
        'profilePictureUrl', u.avatar_url,
        'tasksCompleted', u.tasks_completed,
        'tasksPosted', (SELECT COUNT(*) FROM tasks tp WHERE tp.poster_id = u.id),
        'isVerifiedStudent', u.is_verified_student,
        'memberSince', u.created_at,
        'averageRating', (SELECT ROUND(AVG(r.rating)::numeric, 1) FROM reviews r WHERE r.reviewee_id = u.id)
      ) as poster,
      CASE WHEN t.assigned_to IS NULL THEN NULL ELSE jsonb_build_object(
        'id', ru.id,
        'fullName', ru.full_name,
        'avatarUrl', ru.avatar_url,
        'profilePictureUrl', ru.avatar_url,
        'trustScore', ru.trust_score,
        'department', ru.department,
        'level', ru.level,
        'tasksCompleted', ru.tasks_completed,
        'isVerifiedStudent', ru.is_verified_student,
        'averageRating', (SELECT ROUND(AVG(r.rating)::numeric, 1) FROM reviews r WHERE r.reviewee_id = ru.id)
      ) END as runner,
      jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'icon', c.icon
      ) as category
    FROM tasks t
    JOIN users u ON t.poster_id = u.id
    LEFT JOIN users ru ON ru.id = t.assigned_to
    JOIN categories c ON t.category_id = c.id
    WHERE t.id = $1
  `;

  const row = await queryOne<any>(sql, params);

  const capabilities = currentUserId
    ? getTaskCapabilities(currentUserId, {
        posterId: row.poster_id,
        assignedRunnerId: row.runner_id,
        status: row.status,
        runnerDoneAt: row.runner_done_at,
        runnerPhase: row.runner_phase,
      })
    : undefined;

  return {
    id: row.id,
    posterId: row.poster_id,
    title: row.title,
    description: row.description,
    budget: { kobo: row.budget_kobo, naira: row.budget_kobo / 100 },
    agreedAmount: row.agreed_amount_kobo
      ? { kobo: row.agreed_amount_kobo, naira: row.agreed_amount_kobo / 100 }
      : null,
    // WHAT: Server-calculated escrow + funding summary — the UI never derives
    //       these numbers itself (original budget, agreed amount, escrow and
    //       the additional amount required must always agree)
    escrowAmount: {
      kobo: row.escrow_amount_kobo,
      naira: row.escrow_amount_kobo / 100,
    },
    additionalFundingRequired: {
      kobo: Math.max(0, (row.agreed_amount_kobo ?? row.escrow_amount_kobo) - row.escrow_amount_kobo),
      naira: Math.max(0, (row.agreed_amount_kobo ?? row.escrow_amount_kobo) - row.escrow_amount_kobo) / 100,
    },
    deadline: row.deadline,
    isUrgent: row.is_urgent,
    status: row.status,
    workMode: row.work_mode || "on_site",
    runnerPhase: row.runner_phase,
    locationLabel: row.location_label,
    lat: row.lat,
    lng: row.lng,
    imageUrl: row.image_url,
    runnerId: row.runner_id,
    runner: row.runner || null,
    runnerDoneAt: row.runner_done_at,
    distance: row.distance,
    applicationCount: row.application_count,
    poster: row.poster,
    category: row.category,
    capabilities,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(currentUserId ? { myApplication: await getMyApplicationOnTask(taskId, currentUserId) } : {}),
    acceptedProposal: await getAcceptedProposal(taskId),
  };
}

// WHAT: Load the latest budget proposal attached to the task's accepted
//       application — the amount the poster agreed to and must (fully) fund
// WHY: The poster's funding banner needs the accepted proposal id + amounts
async function getAcceptedProposal(taskId: string): Promise<any> {
  const result = await db.query<any>(
    `SELECT p.id, p.proposed_amount_kobo, p.difference_kobo, p.status, p.accepted_year
     FROM task_budget_proposals p
     JOIN task_applications a ON a.id = p.application_id
     WHERE a.task_id = $1 AND a.status = 'accepted'
     ORDER BY p.created_at DESC
     LIMIT 1`,
    [taskId],
  );
  const p = result.rows[0];
  if (!p) return null;
  return {
    id: p.id,
    proposedAmount: { kobo: p.proposed_amount_kobo, naira: p.proposed_amount_kobo / 100 },
    difference: { kobo: p.difference_kobo, naira: p.difference_kobo / 100 },
    status: p.status,
    acceptedYear: p.accepted_year,
  };
}

// WHAT: Load the calling user's application (with its latest proposal) on a task
// WHY: The task detail UI shows "Your application" status and the negotiated
//      amount from this single source instead of merging data client-side
async function getMyApplicationOnTask(taskId: string, runnerId: string): Promise<any> {
  const result = await db.query<any>(
    `SELECT a.id, a.status, a.proposed_amount_kobo, a.is_counter_offer,
            p.id AS proposal_id, p.proposed_amount_kobo AS proposal_amount_kobo,
            p.difference_kobo, p.status AS proposal_status
     FROM task_applications a
     LEFT JOIN task_budget_proposals p ON p.application_id = a.id
     WHERE a.task_id = $1 AND a.runner_id = $2
     ORDER BY p.created_at DESC NULLS LAST
     LIMIT 1`,
    [taskId, runnerId],
  );
  const app = result.rows[0];
  if (!app) return null;
  return {
    id: app.id,
    status: app.status,
    isCounterOffer: app.is_counter_offer,
    proposedAmount: app.proposed_amount_kobo
      ? { kobo: app.proposed_amount_kobo, naira: app.proposed_amount_kobo / 100 }
      : null,
    ...(app.proposal_id
      ? {
          proposal: {
            id: app.proposal_id,
            proposedAmount: {
              kobo: app.proposal_amount_kobo,
              naira: app.proposal_amount_kobo / 100,
            },
            difference: {
              kobo: app.difference_kobo,
              naira: app.difference_kobo / 100,
            },
            status: app.proposal_status,
          },
        }
      : {}),
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
        work_mode, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9,
        CASE WHEN $10::float8 IS NOT NULL AND $11::float8 IS NOT NULL THEN ST_SetSRID(ST_MakePoint($11::float, $10::float), 4326)::geography ELSE NULL END,
        $12, $13, $14, $15, $15)
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
        input.workMode || "on_site",
        storageForStatus(TaskStatus.PUBLISHED),
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

  // WHAT: Notify a directly invited runner (poster picked this runner from a
  //      profile/availability page). Task stays a normal open task — the invite
  //      is a nudge, escrow/apply flow is unchanged.
  if (input.inviteRunnerId && input.inviteRunnerId !== userId) {
    const inviter = await queryOne<any>(
      "SELECT full_name FROM users WHERE id = $1",
      [userId],
    ).catch(() => null);
    notifyUser(input.inviteRunnerId, {
      type: "task_invite",
      title: "A poster wants you",
      body: `${inviter?.full_name || "A poster"} posted "${task.title}" and invited you to apply first.`,
      taskId: task.id,
      actorId: userId,
    }).catch((err) =>
      console.warn("[Task] invite notification error:", err),
    );
  }

  return {
    id: task.id,
    title: task.title,
    budget: { kobo: task.budget_kobo, naira: task.budget_kobo / 100 },
    status: task.status,
    capabilities: getTaskCapabilities(userId, {
      posterId: userId,
      assignedRunnerId: null,
      status: task.status,
      runnerDoneAt: null,
    }),
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
    `SELECT id, poster_id, status, budget_kobo, escrow_amount_kobo FROM tasks WHERE id = $1`,
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
  // WHAT: Escrow adjustment needed when the posted budget changes
  // WHY: The published budget is locked in escrow at creation — changing it
  //      without re-locking would silently drift wallet escrow from the task
  let budgetDeltaKobo: number | null = null;

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
    budgetDeltaKobo = budgetKobo - task.budget_kobo;
    if (budgetDeltaKobo !== 0) {
      setClauses.push(`budget_kobo = $${paramIndex++}`);
      params.push(budgetKobo);
    }
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

  // WHAT: Budget changes adjust escrow atomically with the row update
  // WHY: Lock the extra (balance check inside) or refund the difference —
  //      never silently (that was the drift bug)
  const result = budgetDeltaKobo
    ? await withTransaction(async (client) => {
        if (budgetDeltaKobo! > 0) {
          await lockEscrow(client, userId, budgetDeltaKobo, taskId, {
            note: `Task budget increased to ₦${((task.budget_kobo + budgetDeltaKobo) / 100).toLocaleString()}`,
          });
        } else {
          await refundEscrow(client, userId, -budgetDeltaKobo!, taskId, {
            note: `Task budget reduced to ₦${((task.budget_kobo + budgetDeltaKobo!) / 100).toLocaleString()}`,
          });
        }
        const r = await client.query<TaskRow>(sql, params);
        return r.rows[0];
      })
    : await queryOne<TaskRow>(sql, params);

  console.info(
    `[Task] updateTask task=${taskId} by=${userId} budgetDelta=${budgetDeltaKobo ?? 0}`,
  );

  return {
    id: result.id,
    title: result.title,
    budget: { kobo: result.budget_kobo, naira: result.budget_kobo / 100 },
    status: result.status,
    capabilities: getTaskCapabilities(userId, {
      posterId: userId,
      assignedRunnerId: result.assigned_to,
      status: result.status,
      runnerDoneAt: result.runner_done_at,
    }),
    updatedAt: result.updated_at,
  };
}

// WHAT: Runner starts work — transitions canonical MATCHED / ACCEPTED / RUNNER_EN_ROUTE → STARTED
// WHY: Gives the runner agency to signal they've begun; moves the task into the
//      active phase and notifies the poster.
export async function startWork(
  taskId: string,
  userId: string,
): Promise<void> {
  const task = await queryOne<TaskRow>(
    `SELECT id, poster_id, assigned_to, status, runner_phase, runner_done_at, title
     FROM tasks WHERE id = $1`,
    [taskId],
  );

  if (!task) throw new Error("Task not found");
  if (task.assigned_to !== userId) throw new Error("Only the assigned runner can start this task");
  // WHAT: Guarded by state machine — ACCEPTED or RUNNER_EN_ROUTE → STARTED
  assertTransitionFromStorage(
    task.status,
    TaskStatus.STARTED,
    { runnerDoneAt: task.runner_done_at, runnerPhase: task.runner_phase },
    "start work",
  );

  await db.query(
    `UPDATE tasks
     SET runner_phase = $1, updated_at = NOW() WHERE id = $2`,
    [RunnerPhase.WORKING, taskId],
  );

  await notifyUser(task.poster_id, {
    type: "task_started",
    title: "Work Started",
    body: `"${task.title}" has been started by the runner.`,
    taskId,
    conversationId: undefined,
    actorId: userId,
  });
}

// WHAT: Runner marks task as done — sets runner_done_at, notifies poster to confirm
// WHY: Gives runner agency to signal completion; poster still controls escrow release
export async function markAsDone(
  taskId: string,
  userId: string,
): Promise<void> {
  const task = await queryOne<TaskRow>(
    `SELECT id, poster_id, assigned_to, status, runner_phase, runner_done_at, title
     FROM tasks WHERE id = $1`,
    [taskId],
  );

  if (!task) throw new Error("Task not found");
  if (task.assigned_to !== userId) throw new Error("Only the assigned runner can mark this task as done");
  // WHAT: Runner marking done moves the task to canonical COMPLETED
  //      (storage stays in_progress + runner_done_at). Guarded by state machine.
  assertTransitionFromStorage(
    task.status,
    TaskStatus.COMPLETED,
    { runnerDoneAt: task.runner_done_at, runnerPhase: task.runner_phase },
    "mark as done",
  );

  await db.query(
    `UPDATE tasks
     SET runner_done_at = NOW(), runner_phase = $1, updated_at = NOW() WHERE id = $2`,
    [RunnerPhase.AWAITING_CONFIRMATION, taskId],
  );

  await notifyUser(task.poster_id, {
    type: "task_marked_done",
    title: "Task Marked Complete",
    body: `"${task.title}" has been marked as done by the runner. Confirm completion or report an issue.`,
    taskId,
    conversationId: undefined,
    actorId: userId,
  });
}

// WHAT: Cancel a task — poster or admin can cancel
// WHY: If in_progress, escrow must be refunded and runner notified
export async function cancelTask(
  taskId: string,
  userId: string,
  userRole: string,
): Promise<{ status: string; message: string }> {
  const task = await queryOne<TaskRow>(
    `SELECT id, poster_id, status, budget_kobo, escrow_amount_kobo, assigned_to as runner_id, title,
            runner_phase, runner_done_at
     FROM tasks WHERE id = $1`,
    [taskId],
  );

  // WHAT: Only poster or admin can cancel
  if (task.poster_id !== userId && userRole !== "admin") {
    throw new Error("Only the task poster or an admin can cancel this task");
  }

  // WHAT: Only discovery/active phase tasks can be cancelled — guarded by state machine
  const canonical = canonicalStatus(task.status, {
    runnerDoneAt: task.runner_done_at,
    runnerPhase: task.runner_phase,
  });
  assertValidTransition(canonical, TaskStatus.CANCELLED, "cancel task");

  await withTransaction(async (client) => {
    // WHAT: Lock the task row — serializes duplicate cancellation requests
    const locked = await client.query<any>(
      `SELECT id, status, escrow_amount_kobo, assigned_to as runner_id
       FROM tasks WHERE id = $1 FOR UPDATE`,
      [taskId],
    );
    const taskLocked = locked.rows[0];
    if (!taskLocked) throw new Error("Task not found");
    const lockedCanonical = canonicalStatus(taskLocked.status, {
      runnerDoneAt: task.runner_done_at,
      runnerPhase: task.runner_phase,
    });
    assertValidTransition(lockedCanonical, TaskStatus.CANCELLED, "cancel task");

    // WHAT: Refund whatever is currently escrowed for this task — the FULL
    //       amount (original + any additional funding), never just the budget
    if (taskLocked.escrow_amount_kobo > 0) {
      await refundEscrow(client, task.poster_id, taskLocked.escrow_amount_kobo, taskId, {
        idempotencyKey: `cancel_${taskId}`,
        note: `Escrow refunded for cancelled task ${taskId}`,
      });
    }

    await client.query(
      `UPDATE tasks SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
      [taskId],
    );

    // WHAT: Free the runner if one was assigned — cancelled task, no more busy
    // WHY: An in_progress cancellation releases the runner slot for matching
    if (taskLocked.runner_id) {
      await client.query(
        `UPDATE users SET runner_busy = false, updated_at = NOW()
         WHERE id = $1 AND runner_busy = true`,
        [taskLocked.runner_id],
      );
    }
  });

  console.info(
    `[Task] cancelTask task=${taskId} by=${userId} role=${userRole} refunded=${task.escrow_amount_kobo}`,
  );

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
// WHY: Final step in task lifecycle — triggers payment and reputation update.
//      Releases the AGREED amount (never the original budget when they differ),
//      refunds any excess escrow (lower-proposal settlement), and is guarded
//      by a task row lock so duplicate confirmations can never double-release.
export async function confirmCompletion(
  taskId: string,
  userId: string,
): Promise<any> {
  const task = await queryOne<TaskRow>(
    `SELECT id, poster_id, assigned_to as runner_id, budget_kobo, escrow_amount_kobo,
            agreed_amount_kobo, title, status, runner_phase, runner_done_at
     FROM tasks WHERE id = $1`,
    [taskId],
  );

  // WHAT: Only poster can confirm
  if (task.poster_id !== userId) {
    throw new Error("Only the task poster can confirm completion");
  }

  // WHAT: Poster confirming completion releases escrow → canonical PAYMENT_RELEASED
  // WHY: Requires the runner to have marked done (runner_done_at) first, per the
  //      Awaiting Confirmation → Completed → Payment Released lifecycle.
  assertTransitionFromStorage(
    task.status,
    TaskStatus.PAYMENT_RELEASED,
    { runnerDoneAt: task.runner_done_at, runnerPhase: task.runner_phase },
    "confirm completion",
  );

  if (!task.runner_id) {
    throw new Error("No runner assigned to this task");
  }

  // WHAT: Settlement amount — the agreed amount when negotiated, else escrow
  const releaseAmountKobo = task.agreed_amount_kobo ?? task.escrow_amount_kobo;
  const excessKobo = Math.max(0, task.escrow_amount_kobo - releaseAmountKobo);

  // WHAT: Atomic completion — release escrow, update status, update stats
  await withTransaction(async (client) => {
    // WHAT: Lock the task row — serializes duplicate confirmations
    const locked = await client.query<any>(
      `SELECT id, status, runner_done_at, assigned_to as runner_id,
              agreed_amount_kobo, escrow_amount_kobo
       FROM tasks WHERE id = $1 FOR UPDATE`,
      [taskId],
    );
    const taskLocked = locked.rows[0];
    if (!taskLocked) throw new Error("Task not found");
    // WHAT: Re-validate inside the lock — a concurrent confirmation fails here
    if (taskLocked.status !== "in_progress" || !taskLocked.runner_done_at) {
      throw new Error("Task is not awaiting confirmation");
    }

    const releaseKobo = taskLocked.agreed_amount_kobo ?? taskLocked.escrow_amount_kobo;
    const excess = Math.max(0, taskLocked.escrow_amount_kobo - releaseKobo);

    // WHAT: Release escrow to runner (platform fee deducted internally)
    //       Idempotency key → a retried request can never pay twice
    await releaseEscrow(
      client,
      task.poster_id,
      taskLocked.runner_id,
      releaseKobo,
      taskId,
      undefined,
      { idempotencyKey: `settle_${taskId}` },
    );

    // WHAT: Refund EXCESS escrow (agreed < originally secured) back to the
    //       poster at settlement — it is never paid to the runner
    if (excess > 0) {
      await refundEscrow(client, task.poster_id, excess, taskId, {
        idempotencyKey: `settle_excess_${taskId}`,
        note: `Excess escrow refunded after settlement (agreed ₦${(releaseKobo / 100).toLocaleString()}, secured ₦${(taskLocked.escrow_amount_kobo / 100).toLocaleString()})`,
      });
    }

    // WHAT: Update task status
    await client.query(
      `UPDATE tasks SET status = 'completed', updated_at = NOW() WHERE id = $1`,
      [taskId],
    );

    // WHAT: Runner is free again — task resolved, resume new-task matching
    await client.query(
      `UPDATE users SET runner_busy = false, updated_at = NOW()
       WHERE id = $1 AND runner_busy = true`,
      [taskLocked.runner_id],
    );

    // WHAT: Increment poster's tasks_completed
    await client.query(
      `UPDATE users SET tasks_completed = tasks_completed + 1, updated_at = NOW() WHERE id = $1`,
      [task.poster_id],
    );

    // WHAT: Increment runner's tasks_completed
    await client.query(
      `UPDATE users SET tasks_completed = tasks_completed + 1, updated_at = NOW() WHERE id = $1`,
      [taskLocked.runner_id],
    );
  });

  console.info(
    `[Task] confirmCompletion task=${taskId} poster=${task.poster_id} runner=${task.runner_id} release=${releaseAmountKobo} excess=${excessKobo}`,
  );

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

