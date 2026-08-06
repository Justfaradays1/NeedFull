// WHAT: Matching service — notify nearby available runners when a task is posted
// WHY: Real-time task matching improves time-to-application for new tasks
// FUTURE: Add skill-based scoring to rank runners by relevance
// FUTURE: Add category preference matching

import db from "../config/db";
import { notifyUser } from "./notification.service";

// WHAT: Runner profile returned by getAvailableRunnersNear
export interface RunnerProfile {
  id: string;
  fullName: string;
  distanceKm: number;
  lat: number;
  lng: number;
}

// WHAT: Notify nearby available runners about a new task
// WHY: Increases task visibility to qualified runners within 3km radius
// This is called non-blocking after task creation — never await
export async function notifyNearbyRunners(task: {
  id: string;
  poster_id: string;
  title: string;
  budget_kobo: number;
  lat: number | null;
  lng: number | null;
  is_urgent: boolean;
  category_id: string;
}): Promise<void> {
  const notified = new Set<string>();

  // Tier 1: runners with an active availability post in this task's category
  // within their declared travel range (up to 10km). These are the best matches.
  if (task.category_id) {
    const categoryMatches = await db.query<{ id: string }>(
      `SELECT DISTINCT u.id FROM runner_availability a
       JOIN users u ON u.id = a.runner_id
       WHERE a.is_active = true
         AND a.category_id = $1
         AND (a.available_until IS NULL OR a.available_until > now())
         AND u.id != $2
         AND u.is_runner = true
         AND u.is_available = true
         AND u.runner_busy = false
         AND u.is_banned = false
         AND u.trust_score >= 30
         AND (
           $3::float8 IS NULL OR $4::float8 IS NULL
           OR (a.location IS NOT NULL AND ST_DWithin(
             a.location,
             ST_SetSRID(ST_MakePoint($4::float, $3::float), 4326)::geography,
             LEAST(COALESCE(a.max_travel_km, 5) * 1000, 10000)
           ))
         )
       LIMIT 20`,
      [task.category_id, task.poster_id, task.lat, task.lng],
    );
    categoryMatches.rows.forEach((r) => notified.add(r.id));
  }

  // Tier 2: generic nearby available runners (no category preference declared)
  if (task.lat && task.lng) {
    const nearby = await db.query<{ id: string }>(
      `SELECT u.id FROM users u
       WHERE u.id != $1
         AND u.is_runner = true
         AND u.is_available = true
         AND u.runner_busy = false
         AND u.is_banned = false
         AND u.trust_score >= 30
         AND u.location IS NOT NULL
         AND ST_DWithin(
           u.location,
           ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography,
           3000
         )
       LIMIT 20`,
      [task.poster_id, task.lng, task.lat],
    );
    nearby.rows.forEach((r) => notified.add(r.id));
  }

  if (notified.size === 0) return;

  await Promise.allSettled(
    [...notified].map((runnerId) =>
      notifyUser(runnerId, {
        type: "new_nearby_task",
        title: task.is_urgent ? "🔥 Urgent task near you!" : "New task near you",
        body: `${task.title} · ₦${(task.budget_kobo / 100).toLocaleString()}`,
        taskId: task.id,
      }),
    ),
  );

  console.log(`[Matching] Notified ${notified.size} runners for task ${task.id}`);
}

// WHAT: Get available runner profiles near given coordinates
// WHY: Map display for task posters to see who's nearby
export async function getAvailableRunnersNear(
  lat: number,
  lng: number,
  radiusKm: number,
): Promise<RunnerProfile[]> {
  const result = await db.query<any>(
    `SELECT u.id, u.full_name,
        ST_X(u.location::geometry) as lat, ST_Y(u.location::geometry) as lng,
        ROUND(
          ST_Distance(
            u.location,
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
          )::numeric, 2
        )::float as distance_meters
     FROM users u
     WHERE u.is_runner = true
       AND u.is_available = true
       AND u.runner_busy = false
       AND u.is_banned = false
       AND u.trust_score >= 30
       AND u.location IS NOT NULL
       AND ST_DWithin(
         u.location,
         ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
         $3
       )
     ORDER BY distance_meters ASC
     LIMIT 20`,
    [lng, lat, radiusKm * 1000],
  );

  return result.rows.map((r: any) => ({
    id: r.id,
    fullName: r.full_name,
    distanceKm: parseFloat((r.distance_meters / 1000).toFixed(2)),
    lat: r.lat,
    lng: r.lng,
  }));
}
