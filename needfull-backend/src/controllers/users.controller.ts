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
        u.roles, u.active_role, u.runner_status,
        jsonb_build_object('id', w.id, 'balanceKobo', (w.balance)::int, 'escrowKobo', (w.escrow)::int) as wallet
      FROM users u
      JOIN wallets w ON w.user_id = u.id
      WHERE u.id = $1`,
      [userId],
    );
    if (result.rows.length === 0) { res.status(404).json({ success: false, message: "User not found" }); return; }
    const r = result.rows[0];
    res.json({ success: true, data: {
      id: r.id, fullName: r.full_name, email: r.email, phone: r.phone, bio: r.bio,
      department: r.department, level: r.level, hostel: r.hostel, skills: r.skills,
      locationLabel: r.location_label, profilePictureUrl: r.profile_picture_url,
      trustScore: r.trust_score, tasksCompleted: r.tasks_completed,
      isAvailable: r.is_available, isRunner: r.is_runner,
      emailVerified: r.email_verified, isVerifiedStudent: r.is_verified_student,
      createdAt: r.created_at, wallet: r.wallet,
      roles: r.roles || ["poster"], activeRole: r.active_role || "poster", runnerStatus: r.runner_status || "none",
    } });
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
      const u = await db.query<any>("SELECT trust_score, runner_status FROM users WHERE id = $1", [req.user!.id]);
      if (u.rows.length === 0) { res.status(404).json({ success: false, message: "User not found" }); return; }
      if (u.rows[0].trust_score < 30) { res.status(400).json({ success: false, message: "Build your trust score first. Minimum 30 required to become a runner." }); return; }
      if (u.rows[0].runner_status !== 'approved') { res.status(400).json({ success: false, message: "You must apply for runner status and be approved first." }); return; }
    }
    const result = await db.query<any>(
      `UPDATE users SET
        is_runner = $1,
        roles = CASE WHEN $1 THEN array_append(array_remove(roles, 'runner'), 'runner') ELSE array_remove(roles, 'runner') END,
        active_role = CASE WHEN $1 AND active_role NOT IN ('poster', 'runner') THEN 'runner' ELSE active_role END,
        updated_at = NOW()
       WHERE id = $2 RETURNING is_runner`,
      [isRunner, req.user!.id],
    );
    res.json({ success: true, data: { isRunner: result.rows[0].is_runner } });
  } catch (error) {
    console.error("[Users] toggleRunnerMode error:", error);
    res.status(500).json({ success: false, message: "Failed to toggle runner mode" });
  }
}

// WHAT: Switch active role
export async function switchActiveRole(req: Request, res: Response): Promise<void> {
  try {
    const { role } = req.body;
    if (!role || !['poster', 'runner', 'business'].includes(role)) {
      res.status(400).json({ success: false, message: "Invalid role. Must be one of: poster, runner, business" });
      return;
    }
    const u = await db.query<any>("SELECT roles FROM users WHERE id = $1", [req.user!.id]);
    if (u.rows.length === 0) { res.status(404).json({ success: false, message: "User not found" }); return; }
    const roles: string[] = u.rows[0].roles || ['poster'];
    if (!roles.includes(role)) {
      res.status(403).json({ success: false, message: `You don't have the "${role}" role. Apply for it first.` });
      return;
    }
    await db.query("UPDATE users SET active_role = $1, updated_at = NOW() WHERE id = $2", [role, req.user!.id]);
    res.json({ success: true, data: { activeRole: role } });
  } catch (error) {
    console.error("[Users] switchActiveRole error:", error);
    res.status(500).json({ success: false, message: "Failed to switch role" });
  }
}

// WHAT: Apply for runner status
export async function applyForRunner(req: Request, res: Response): Promise<void> {
  try {
    const u = await db.query<any>("SELECT runner_status FROM users WHERE id = $1", [req.user!.id]);
    if (u.rows.length === 0) { res.status(404).json({ success: false, message: "User not found" }); return; }
    const current = u.rows[0].runner_status;
    if (current === 'pending') { res.status(400).json({ success: false, message: "You already have a pending runner application." }); return; }
    if (current === 'approved') { res.status(400).json({ success: false, message: "You are already a runner." }); return; }
    await db.query("UPDATE users SET runner_status = 'pending', updated_at = NOW() WHERE id = $1", [req.user!.id]);
    res.json({ success: true, message: "Runner application submitted for review." });
  } catch (error) {
    console.error("[Users] applyForRunner error:", error);
    res.status(500).json({ success: false, message: "Failed to submit runner application" });
  }
}

// WHAT: Get public profile — safe fields only, trust history, recent reviews
export async function getPublicProfile(req: Request, res: Response): Promise<void> {
  try {
    const targetId = req.params.userId;

    const userResult = await db.query<any>(
      "SELECT id, full_name, bio, department, level, hostel, school, location_label, profile_picture_url, trust_score, tasks_completed, is_available, is_runner, is_verified_student, created_at, (SELECT ROUND(AVG(r.rating)::numeric, 1) FROM reviews r WHERE r.reviewee_id = users.id) as average_rating FROM users WHERE id = $1",
      [targetId],
    );
    if (userResult.rows.length === 0) { res.status(404).json({ success: false, message: "User not found" }); return; }
    const u = userResult.rows[0];

    let trustHistory: any[] = [];
    try {
      const trustLog = await db.query<any>("SELECT * FROM trust_score_log WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10", [targetId]);
      trustHistory = trustLog.rows.map((r: any) => ({
        score: r.score,
        ratingPoints: r.rating_points ?? r.rating_pts,
        completionPoints: r.completion_points ?? r.completion_pts,
        verificationPoints: r.verification_points ?? r.verification_pts,
        reportPenalty: r.report_penalty ?? r.report_penalty_pts,
        tenurePoints: r.tenure_points ?? r.tenure_pts,
        createdAt: r.created_at,
      }));
    } catch { /* trust_score_log table may not exist yet */ }

    const reviews = await db.query<any>("SELECT r.id, r.rating, r.comment, r.created_at, jsonb_build_object('id', rev.id, 'fullName', rev.full_name) as reviewer FROM reviews r JOIN users rev ON r.reviewer_id = rev.id WHERE r.reviewee_id = $1 ORDER BY r.created_at DESC LIMIT 5", [targetId]);

    const data: Record<string, any> = { id: u.id, fullName: u.full_name, bio: u.bio, department: u.department, level: u.level, hostel: u.hostel, school: u.school, locationLabel: u.location_label, profilePictureUrl: u.profile_picture_url, trustScore: u.trust_score, tasksCompleted: u.tasks_completed, isAvailable: u.is_available, isRunner: u.is_runner, isVerifiedStudent: u.is_verified_student, averageRating: u.average_rating, memberSince: u.created_at };
    if (trustHistory.length > 0) data.trustHistory = trustHistory;
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

    // Prevent duplicate pending submissions
    const existing = await db.query(
      "SELECT id FROM student_id_verifications WHERE user_id = $1 AND status = 'pending'",
      [userId],
    );
    if (existing.rows.length > 0) {
      res.status(400).json({ success: false, message: "You already have a pending verification request" });
      return;
    }

    const imageUrl = await uploadImage(req.file.buffer, "verifications");
    const now = new Date().toISOString();
    await db.query("INSERT INTO student_id_verifications (user_id, image_url, photo_url, status, created_at, updated_at) VALUES ($1, $2, $2, 'pending', $3, $3)", [userId, imageUrl, now]);

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

// WHAT: Get verification status for the authenticated user
// WHY: Frontend needs email/phone/studentId verification state in one call
export async function getVerificationStatus(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const user = await db.query<any>(
      `SELECT email_verified, phone, is_verified_student FROM users WHERE id = $1`,
      [userId],
    );
    if (user.rows.length === 0) { res.status(404).json({ success: false, message: "User not found" }); return; }
    const u = user.rows[0];

    const sv = await db.query<any>(
      `SELECT status, rejection_note, image_url, created_at, reviewed_at
       FROM student_id_verifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [userId],
    );

    let studentIdStatus: 'not_submitted' | 'pending' | 'approved' | 'rejected' = 'not_submitted';
    let submittedAt: string | undefined;
    let rejectionReason: string | undefined;
    let documentUrl: string | undefined;

    if (sv.rows.length > 0) {
      const s = sv.rows[0];
      studentIdStatus = s.status === 'pending' ? 'pending' : s.status === 'approved' ? 'approved' : 'rejected';
      submittedAt = s.created_at;
      documentUrl = s.image_url;
      if (s.status === 'rejected') rejectionReason = s.rejection_note;
    }

    res.json({
      success: true,
      data: {
        email: { verified: u.email_verified },
        phone: { verified: !!u.phone, phone: u.phone },
        studentId: { status: studentIdStatus, submittedAt, rejectionReason, documentUrl },
      },
    });
  } catch (error) {
    console.error("[Users] getVerificationStatus error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch verification status" });
  }
}

// WHAT: Get trust score breakdown for the authenticated user
// WHY: Frontend needs per-factor breakdown to display in trust score card
export async function getTrustBreakdown(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const result = await db.query<any>(
      `SELECT trust_score, email_verified, phone_verified, is_verified_student,
              COALESCE(tasks_completed, 0) as tasks_completed
       FROM users WHERE id = $1`,
      [userId],
    );
    if (result.rows.length === 0) { res.status(404).json({ success: false, message: "User not found" }); return; }
    const u = result.rows[0];

    const verification = (u.email_verified ? 5 : 0) + (u.phone_verified ? 4 : 0) + (u.is_verified_student ? 6 : 0);

    res.json({
      success: true,
      data: {
        rating: 0, completion: 0, verification: Math.min(verification, 15), reports: 0, tenure: 0,
        total: u.trust_score,
      },
    });
  } catch (error) {
    console.error("[Users] getTrustBreakdown error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch trust breakdown" });
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
       WHERE u.is_runner = true AND u.is_available = true AND u.runner_busy = false AND u.is_banned = false AND u.location IS NOT NULL
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
