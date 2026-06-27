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
  if (!task.lat || !task.lng) return;

  const runners = await db.query<{ id: string }>(
    `SELECT u.id FROM users u
     WHERE u.id != $1
       AND u.is_runner = true
       AND u.is_available = true
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

  if (runners.rows.length === 0) return;

  await Promise.allSettled(
    runners.rows.map((runner) =>
      notifyUser(runner.id, {
        type: "new_nearby_task",
        title: task.is_urgent ? "🔥 Urgent task near you!" : "New task near you",
        body: `${task.title} · ₦${(task.budget_kobo / 100).toLocaleString()}`,
        taskId: task.id,
      }),
    ),
  );

  console.log(`[Matching] Notified ${runners.rows.length} runners for task ${task.id}`);
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
