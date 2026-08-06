// WHAT: Runner availability posts — "I am available if you need this service"
// WHY: Lets runners signal what they can do right now and lets posters discover
//      nearby runners by service. This is discovery only — task creation,
//      escrow, payment, completion, and rating flows are completely unchanged.

import { v4 as uuidv4 } from "uuid";
import db from "../config/db";

export interface CreateAvailabilityInput {
  categoryId: string;
  note?: string;
  availableUntil?: string | null;
  maxTravelKm?: number;
  isOnlineToday?: boolean;
  lat?: number | null;
  lng?: number | null;
  locationLabel?: string | null;
}

export interface AvailabilityFilters {
  categoryId?: string;
  runnerId?: string;
  lat?: number;
  lng?: number;
  radiusMeters?: number;
}

const MAX_NOTE_LENGTH = 200;

function shapeRow(row: any): any {
  return {
    id: row.id,
    runnerId: row.runner_id,
    categoryId: row.category_id,
    note: row.note,
    availableUntil: row.available_until,
    maxTravelKm: Number(row.max_travel_km),
    isOnlineToday: row.is_online_today,
    locationLabel: row.location_label,
    category: row.category,
    runner: row.runner,
    distance: row.distance ?? null,
    createdAt: row.created_at,
  };
}

// WHAT: Create a new availability post for the current user
// WHY: One offer per service type is enough; reuse is handled by the UI
export async function createAvailability(
  userId: string,
  input: CreateAvailabilityInput,
): Promise<any> {
  const id = uuidv4();
  const now = new Date().toISOString();
  const note = (input.note || "").trim().slice(0, MAX_NOTE_LENGTH);
  const maxTravelKm = Math.min(Math.max(input.maxTravelKm || 5, 1), 50);
  const hasLocation =
    typeof input.lat === "number" && typeof input.lng === "number";

  const result = await db.query<any>(
    `INSERT INTO runner_availability
       (id, runner_id, category_id, note, available_until, max_travel_km,
        is_online_today, location_label, location, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8,
       CASE WHEN $9::float8 IS NOT NULL AND $10::float8 IS NOT NULL
         THEN ST_SetSRID(ST_MakePoint($10::float, $9::float), 4326)::geography
         ELSE NULL END,
       $11, $11)
     RETURNING id`,
    [
      id,
      userId,
      input.categoryId,
      note,
      input.availableUntil || null,
      maxTravelKm,
      input.isOnlineToday ?? true,
      input.locationLabel || null,
      hasLocation ? input.lat : null,
      hasLocation ? input.lng : null,
      now,
    ],
  );

  return { id: result.rows[0].id };
}

// WHAT: List the current user's active (non-expired) availability posts
export async function listMyAvailability(userId: string): Promise<any[]> {
  const result = await db.query<any>(
    `SELECT a.id, a.runner_id, a.category_id, a.note, a.available_until,
            a.max_travel_km, a.is_online_today, a.location_label, a.created_at,
            jsonb_build_object('id', c.id, 'name', c.name, 'icon', c.icon) as category
     FROM runner_availability a
     JOIN categories c ON c.id = a.category_id
     WHERE a.runner_id = $1
       AND a.is_active = true
       AND (a.available_until IS NULL OR a.available_until > now())
     ORDER BY a.created_at DESC
     LIMIT 20`,
    [userId],
  );
  return result.rows.map(shapeRow);
}

// WHAT: End an availability post (soft delete)
// WHY: Runner changes their mind or is now busy elsewhere
export async function deactivateAvailability(
  userId: string,
  availabilityId: string,
): Promise<boolean> {
  const result = await db.query<any>(
    `UPDATE runner_availability
     SET is_active = false, updated_at = now()
     WHERE id = $1 AND runner_id = $2`,
    [availabilityId, userId],
  );
  return (result.rowCount ?? 0) > 0;
}

// WHAT: Discover active availability posts (poster-facing)
// WHY: Browse/search surfaces: filter by category and/or distance from the poster
export async function listAvailability(
  filters: AvailabilityFilters,
): Promise<any[]> {
  const categoryId = filters.categoryId || null;
  const runnerId = filters.runnerId || null;
  const lat = typeof filters.lat === "number" ? filters.lat : null;
  const lng = typeof filters.lng === "number" ? filters.lng : null;
  const radiusMeters = filters.radiusMeters ?? 5000;

  const result = await db.query<any>(
    `SELECT a.id, a.runner_id, a.category_id, a.note, a.available_until,
            a.max_travel_km, a.is_online_today, a.location_label, a.created_at,
            CASE WHEN $3::float8 IS NULL THEN NULL
              ELSE ROUND(ST_Distance(a.location, ST_SetSRID(ST_MakePoint($4::float, $3::float), 4326)::geography)::numeric, 0)::float
            END as distance,
            jsonb_build_object(
              'id', u.id,
              'fullName', u.full_name,
              'trustScore', u.trust_score,
              'avatarUrl', u.avatar_url,
              'isVerifiedStudent', u.is_verified_student
            ) as runner,
            jsonb_build_object('id', c.id, 'name', c.name, 'icon', c.icon) as category
     FROM runner_availability a
     JOIN users u ON u.id = a.runner_id
     JOIN categories c ON c.id = a.category_id
     WHERE a.is_active = true
       AND (a.available_until IS NULL OR a.available_until > now())
       AND u.is_banned = false
       AND u.is_available = true
       AND ($1::uuid IS NULL OR a.category_id = $1::uuid)
       AND ($2::uuid IS NULL OR a.runner_id = $2::uuid)
       AND (
         $3::float8 IS NULL OR $4::float8 IS NULL
         OR (a.location IS NOT NULL AND ST_DWithin(
           a.location,
           ST_SetSRID(ST_MakePoint($4::float, $3::float), 4326)::geography,
           $5
         ))
       )
     ORDER BY distance ASC NULLS LAST, a.created_at DESC
     LIMIT 30`,
    [categoryId, runnerId, lat, lng, radiusMeters],
  );

  return result.rows.map(shapeRow);
}