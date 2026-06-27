// WHAT: Users controller — profile CRUD, avatar, location, runner mode, verification, public profile
// WHY: Centralised handlers that delegate to services with consistent error formatting
// FUTURE: Add skill-based runner search

import { Request, Response } from "express";
import db from "../config/db";
import { uploadImage } from "../services/cloudinary.service";
import { notifyUser } from "../services/notification.service";

// WHAT: Get authenticated user's full profile with wallet and virtual account
export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const result = await db.query<any>(
      `SELECT
        u.id, u.full_name, u.email, u.phone, u.bio, u.department, u.level,
        u.hostel, u.skills, u.location_label, u.profile_picture_url,
        u.trust_score, u.tasks_completed, u.is_available, u.is_runner,
        u.email_verified, u.is_verified_student, u.created_at,
        jsonb_build_object('id', w.id, 'balanceKobo', w.balance, 'escrowKobo', w.escrow) as wallet,
        jsonb_build_object('accountNumber', va.account_number, 'bankName', va.bank_name, 'accountName', va.account_name) as virtual_account
      FROM users u
      JOIN wallets w ON w.user_id = u.id
      LEFT JOIN virtual_accounts va ON va.user_id = u.id AND va.is_active = true
      WHERE u.id = $1`,
      [userId],
    );
    if (result.rows.length === 0) { res.status(404).json({ success: false, message: "User not found" }); return; }
    const r = result.rows[0];
    res.json({ success: true, data: { id: r.id, fullName: r.full_name, email: r.email, phone: r.phone, bio: r.bio, department: r.department, level: r.level, hostel: r.hostel, skills: r.skills, locationLabel: r.location_label, profilePictureUrl: r.profile_picture_url, trustScore: r.trust_score, tasksCompleted: r.tasks_completed, isAvailable: r.is_available, isRunner: r.is_runner, emailVerified: r.email_verified, isVerifiedStudent: r.is_verified_student, createdAt: r.created_at, wallet: r.wallet, virtualAccount: r.virtual_account } });
  } catch (error) {
    console.error("[Users] getMe error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch profile" });
  }
}

const ALLOWED_UPDATE_FIELDS = ["fullName", "bio", "hostel", "locationLabel", "skills", "department", "level", "phone"] as const;
const FIELD_MAP: Record<string, string> = { fullName: "full_name", bio: "bio", hostel: "hostel", locationLabel: "location_label", skills: "skills", department: "department", level: "level", phone: "phone" };

// WHAT: Update allowed profile fields (dynamic SET)
export async function updateMe(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const setClauses: string[] = [];
    const params: any[] = [];
    let idx = 1;

    for (const field of ALLOWED_UPDATE_FIELDS) {
      if (req.body[field] !== undefined) {
        const col = FIELD_MAP[field];
        if (col === "skills") { setClauses.push(`${col} = $${idx++}::jsonb`); params.push(JSON.stringify(req.body[field])); }
        else { setClauses.push(`${col} = $${idx++}`); params.push(req.body[field]?.trim() ?? null); }
      }
    }

    if (setClauses.length === 0) { res.status(400).json({ success: false, message: "No valid fields to update" }); return; }

    setClauses.push("updated_at = NOW()");
    const result = await db.query<any>(`UPDATE users SET ${setClauses.join(", ")} WHERE id = $${idx} RETURNING id, full_name, email, phone, bio, department, level, hostel, skills, location_label, profile_picture_url, trust_score, tasks_completed, is_available, is_runner, email_verified, created_at, updated_at`, [...params, userId]);

    if (result.rows.length === 0) { res.status(404).json({ success: false, message: "User not found" }); return; }
    const u = result.rows[0];
    res.json({ success: true, data: { id: u.id, fullName: u.full_name, email: u.email, phone: u.phone, bio: u.bio, department: u.department, level: u.level, hostel: u.hostel, skills: u.skills, locationLabel: u.location_label, profilePictureUrl: u.profile_picture_url, trustScore: u.trust_score, tasksCompleted: u.tasks_completed, isAvailable: u.is_available, isRunner: u.is_runner, emailVerified: u.email_verified, createdAt: u.created_at, updatedAt: u.updated_at } });
  } catch (error) {
    console.error("[Users] updateMe error:", error);
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
}

// WHAT: Upload avatar to Cloudinary
export async function updateAvatar(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) { res.status(400).json({ success: false, message: "No image file provided" }); return; }
    const url = await uploadImage(req.file.buffer, "avatars", { width: 400, height: 400, crop: "fill" });
    await db.query("UPDATE users SET profile_picture_url = $1, updated_at = NOW() WHERE id = $2", [url, req.user!.id]);
    res.json({ success: true, data: { profilePictureUrl: url } });
  } catch (error) {
    console.error("[Users] updateAvatar error:", error);
    res.status(500).json({ success: false, message: "Failed to update avatar" });
  }
}

// WHAT: Update user's GPS location with PostGIS
// NOTE: PostGIS ST_MakePoint takes LNG first, LAT second
export async function updateLocation(req: Request, res: Response): Promise<void> {
  try {
    const { lat, lng, locationLabel } = req.body;
    await db.query(
      "UPDATE users SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, lat = $2, lng = $1, location_label = COALESCE($3, location_label), updated_at = NOW() WHERE id = $4",
      [lng, lat, locationLabel || null, req.user!.id],
    );
    res.json({ success: true, data: { lat, lng, locationLabel: locationLabel || null } });
  } catch (error) {
    console.error("[Users] updateLocation error:", error);
    res.status(500).json({ success: false, message: "Failed to update location" });
  }
}

// WHAT: Toggle is_available
export async function toggleAvailable(req: Request, res: Response): Promise<void> {
  try {
    const result = await db.query<any>("UPDATE users SET is_available = NOT is_available, updated_at = NOW() WHERE id = $1 RETURNING is_available", [req.user!.id]);
    res.json({ success: true, data: { isAvailable: result.rows[0].is_available } });
  } catch (error) {
    console.error("[Users] toggleAvailable error:", error);
    res.status(500).json({ success: false, message: "Failed to toggle availability" });
  }
}

// WHAT: Toggle is_runner — requires trust_score >= 30 to enable
export async function toggleRunnerMode(req: Request, res: Response): Promise<void> {
  try {
    const { isRunner } = req.body;
    if (isRunner) {
      const u = await db.query<any>("SELECT trust_score FROM users WHERE id = $1", [req.user!.id]);
      if (u.rows.length === 0) { res.status(404).json({ success: false, message: "User not found" }); return; }
      if (u.rows[0].trust_score < 30) { res.status(400).json({ success: false, message: "Build your trust score first. Minimum 30 required to become a runner." }); return; }
    }
    const result = await db.query<any>("UPDATE users SET is_runner = $1, updated_at = NOW() WHERE id = $2 RETURNING is_runner", [isRunner, req.user!.id]);
    res.json({ success: true, data: { isRunner: result.rows[0].is_runner } });
  } catch (error) {
    console.error("[Users] toggleRunnerMode error:", error);
    res.status(500).json({ success: false, message: "Failed to toggle runner mode" });
  }
}

// WHAT: Get public profile — safe fields only, trust history, recent reviews
export async function getPublicProfile(req: Request, res: Response): Promise<void> {
  try {
    const targetId = req.params.userId;

    const userResult = await db.query<any>(
      "SELECT id, full_name, bio, department, level, hostel, location_label, profile_picture_url, trust_score, tasks_completed, is_available, is_runner, created_at FROM users WHERE id = $1",
      [targetId],
    );
    if (userResult.rows.length === 0) { res.status(404).json({ success: false, message: "User not found" }); return; }
    const u = userResult.rows[0];

    const [trustLog, reviews] = await Promise.all([
      db.query<any>("SELECT score_before, score_after, reason, created_at FROM trust_score_log WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10", [targetId]),
      db.query<any>("SELECT r.id, r.rating, r.comment, r.created_at, jsonb_build_object('id', rev.id, 'fullName', rev.full_name) as reviewer FROM reviews r JOIN users rev ON r.reviewer_id = rev.id WHERE r.reviewee_id = $1 ORDER BY r.created_at DESC LIMIT 5", [targetId]),
    ]);

    const data: Record<string, any> = { id: u.id, fullName: u.full_name, bio: u.bio, department: u.department, level: u.level, hostel: u.hostel, locationLabel: u.location_label, profilePictureUrl: u.profile_picture_url, trustScore: u.trust_score, tasksCompleted: u.tasks_completed, isAvailable: u.is_available, isRunner: u.is_runner, memberSince: u.created_at };
    if (trustLog.rows.length > 0) data.trustHistory = trustLog.rows.map((r: any) => ({ scoreBefore: r.score_before, scoreAfter: r.score_after, reason: r.reason, createdAt: r.created_at }));
    if (reviews.rows.length > 0) data.recentReviews = reviews.rows.map((r: any) => ({ id: r.id, rating: r.rating, comment: r.comment, createdAt: r.created_at, reviewer: r.reviewer }));
    res.json({ success: true, data });
  } catch (error) {
    console.error("[Users] getPublicProfile error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch public profile" });
  }
}

// WHAT: Submit student ID card for verification
export async function submitStudentVerification(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) { res.status(400).json({ success: false, message: "No ID card image provided" }); return; }
    const userId = req.user!.id;
    const imageUrl = await uploadImage(req.file.buffer, "verifications");
    const now = new Date().toISOString();
    await db.query("INSERT INTO student_id_verifications (user_id, image_url, status, created_at, updated_at) VALUES ($1, $2, 'pending', $3, $3)", [userId, imageUrl, now]);

    const admins = await db.query<{ id: string }>("SELECT id FROM users WHERE role = 'admin'");
    if (admins.rows.length > 0) {
      const userInfo = await db.query<any>("SELECT full_name FROM users WHERE id = $1", [userId]);
      for (const admin of admins.rows) {
        notifyUser(admin.id, { type: "verification_request", title: "New ID Verification Request", body: `${userInfo.rows[0].full_name} submitted their student ID for verification.`, actorId: userId, conversationId: undefined, taskId: undefined }).catch(() => {});
      }
    }
    res.status(201).json({ success: true, message: "ID card submitted for verification. We'll notify you once reviewed.", data: { imageUrl } });
  } catch (error) {
    console.error("[Users] submitStudentVerification error:", error);
    res.status(500).json({ success: false, message: "Failed to submit verification" });
  }
}

// WHAT: Find available runners near a location
export async function getNearbyRunners(req: Request, res: Response): Promise<void> {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radiusMeters = req.query.radiusMeters ? parseFloat(req.query.radiusMeters as string) : 5000;

    const result = await db.query<any>(
      `SELECT u.id, u.full_name, u.bio, u.profile_picture_url, u.trust_score, u.tasks_completed, u.department, u.level, u.hostel, u.skills,
        ROUND(ST_Distance(u.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography)::numeric, 0)::float as distance_meters
       FROM users u
       WHERE u.is_runner = true AND u.is_available = true AND u.location IS NOT NULL
         AND ST_DWithin(u.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
       ORDER BY distance_meters ASC LIMIT 20`,
      [lng, lat, radiusMeters],
    );

    res.json({ success: true, data: result.rows.map((r: any) => ({ id: r.id, fullName: r.full_name, bio: r.bio, profilePictureUrl: r.profile_picture_url, trustScore: r.trust_score, tasksCompleted: r.tasks_completed, department: r.department, level: r.level, hostel: r.hostel, skills: r.skills, distanceMeters: r.distance_meters })) });
  } catch (error) {
    console.error("[Users] getNearbyRunners error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch nearby runners" });
  }
}
