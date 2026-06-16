// WHAT: Trust score calculation engine with bayesian rating, completion rate, verification, and report penalties
// WHY: Quantify user reputation across 6 factors; core to matching and platform safety
// CRITICAL: Trust score is used for access control, matching, and display — recalculate on every trust event

import db, { queryOne } from '../config/db';

// WHAT: Define all possible trust-affecting events
type TrustEvent =
  | 'review_received'
  | 'task_completed'
  | 'task_cancelled'
  | 'report_filed'
  | 'report_resolved'
  | 'student_verified'
  | 'email_verified'
  | 'phone_verified';

// WHAT: Trust level mapping for UI display
interface TrustLevelInfo {
  label: string;
  color: string; // Text color (Tailwind)
  bg: string; // Background color (Tailwind)
  icon: string; // Icon name
  minScore: number;
}

const TRUST_LEVELS: Record<string, TrustLevelInfo> = {
  trusted: {
    label: 'Trusted',
    color: 'text-green-700',
    bg: 'bg-green-50',
    icon: 'shield-check',
    minScore: 85,
  },
  reliable: {
    label: 'Reliable',
    color: 'text-green-600',
    bg: 'bg-green-50',
    icon: 'check-circle',
    minScore: 65,
  },
  building: {
    label: 'Building',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    icon: 'trending-up',
    minScore: 45,
  },
  new: {
    label: 'New',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    icon: 'user-plus',
    minScore: 25,
  },
  atRisk: {
    label: 'At Risk',
    color: 'text-red-700',
    bg: 'bg-red-50',
    icon: 'alert-triangle',
    minScore: 0,
  },
};

// WHAT: Calculate trust score from 6 independent factors
// WHY: Quantify reputation; used for access control and user matching
// FORMULA: Bayesian rating (40pts) + completion (20pts) + response (15pts) + verification (15pts) + reports (−20 max) + tenure (10pts)
export async function recalculateTrustScore(userId: string): Promise<number> {
  try {
    // WHAT: Fetch all trust factors in one query
    // WHY: Atomic view; prevents score drift from concurrent events
    const factors = await queryOne<any>(
      `
      SELECT
        -- RATING: Bayesian average with prior (3.5 stars, 3 reviews)
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COALESCE(COUNT(r.id), 0) as rating_count,
        
        -- COMPLETION: Tasks completed vs total accepted
        COALESCE(SUM(CASE WHEN t.status IN ('completed', 'disputed') THEN 1 ELSE 0 END), 0) as tasks_completed,
        COALESCE(COUNT(DISTINCT ta.id), 0) as tasks_total,
        
        -- CANCELLATION: Tasks cancelled as runner
        COALESCE(SUM(CASE WHEN t.status = 'cancelled' AND t.runner_id = $1 THEN 1 ELSE 0 END), 0) as tasks_cancelled,
        
        -- VERIFICATION: Email, phone, student ID verified
        COALESCE(u.email_verified, false) as email_verified,
        COALESCE(u.phone_verified, false) as phone_verified,
        COALESCE((u.metadata->>'studentIdVerified')::boolean, false) as student_id_verified,
        
        -- REPORTS: Open reports against this user
        COALESCE(SUM(CASE WHEN rep.status = 'open' THEN 1 ELSE 0 END), 0) as open_report_count,
        
        -- TENURE: Account age in months
        u.created_at
      FROM users u
      LEFT JOIN reviews r ON r.reviewed_user_id = $1 AND r.is_deleted = false
      LEFT JOIN task_applications ta ON ta.runner_id = $1
      LEFT JOIN tasks t ON t.id = ta.task_id
      LEFT JOIN reports rep ON rep.reported_user_id = $1
      WHERE u.id = $1
      GROUP BY u.id, u.email_verified, u.phone_verified, u.metadata, u.created_at
      `,
      [userId],
    );

    if (!factors) {
      console.warn(`[Trust] User ${userId} not found`);
      return 0;
    }

    // WHAT: Calculate tenure in months
    // WHY: Reward long-standing users (1pt per month, max 10pts)
    const createdDate = new Date(factors.created_at);
    const nowDate = new Date();
    const tenureMonths = Math.floor(
      (nowDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 30),
    );
    const tenurePoints = Math.min(tenureMonths, 10);

    // WHAT: Calculate bayesian average rating (40pts max)
    // WHY: Weighted average prevents manipulation by new users; prior anchors new users at 3.5 stars
    const priorRating = 3.5;
    const priorCount = 3;
    const bayesianRating =
      (factors.avg_rating * factors.rating_count + priorRating * priorCount) /
      (factors.rating_count + priorCount);
    // Map 0–5 star range to 0–40 points
    const ratingPoints = Math.max(0, Math.min(40, (bayesianRating / 5) * 40));

    // WHAT: Calculate completion rate with volume boost (20pts max)
    // WHY: Incentivize task completion; require min tasks to avoid gaming
    let completionPoints = 0;
    if (factors.tasks_total > 0) {
      const completionRate = factors.tasks_completed / factors.tasks_total;
      // Base: 0–15 points for completion rate
      completionPoints = completionRate * 15;
      // Volume bonus: +5 points if >= 10 tasks (shows consistency)
      if (factors.tasks_total >= 10) {
        completionPoints += 5;
      }
      completionPoints = Math.min(20, completionPoints);
    }

    // WHAT: Cancellation penalty (built into completion rate)
    // WHY: Completion rate already penalizes cancellations; no separate penalty needed
    // Note: tasks_cancelled are counted as non-completion in tasks_completed sum

    // WHAT: Calculate verification points (15pts max)
    // WHY: Verified users are more trustworthy; stacked benefits
    let verificationPoints = 0;
    if (factors.email_verified) verificationPoints += 5;
    if (factors.phone_verified) verificationPoints += 4;
    if (factors.student_id_verified) verificationPoints += 6;
    verificationPoints = Math.min(15, verificationPoints);

    // WHAT: Calculate response/report penalty (−20pts max)
    // WHY: Open reports significantly harm trust; max penalty prevents permanent ban
    const reportPenalty = Math.max(-20, -7 * factors.open_report_count);

    // WHAT: Calculate total trust score
    // WHY: Combine all factors into 0–100 scale
    let trustScore =
      ratingPoints + completionPoints + verificationPoints + reportPenalty + tenurePoints;

    // WHAT: Clamp to 0–100
    trustScore = Math.max(0, Math.min(100, Math.round(trustScore)));

    // WHAT: Update user's trust score in database
    const now = new Date().toISOString();
    await db.query(
      `UPDATE users 
       SET trust_score = $1, updated_at = $2 
       WHERE id = $3`,
      [trustScore, now, userId],
    );

    // WHAT: UPSERT trust_score_log for audit trail
    // WHY: Track score changes over time; understand what affects each user's score
    await db.query(
      `INSERT INTO trust_score_log 
       (user_id, score, rating_points, completion_points, verification_points, report_penalty, tenure_points, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_id, created_at::date) DO UPDATE 
       SET score = EXCLUDED.score, 
           rating_points = EXCLUDED.rating_points,
           completion_points = EXCLUDED.completion_points,
           verification_points = EXCLUDED.verification_points,
           report_penalty = EXCLUDED.report_penalty,
           tenure_points = EXCLUDED.tenure_points`,
      [
        userId,
        trustScore,
        Math.round(ratingPoints),
        Math.round(completionPoints),
        Math.round(verificationPoints),
        Math.round(reportPenalty),
        Math.round(tenurePoints),
        now,
      ],
    );

    return trustScore;
  } catch (error) {
    // WHAT: Log error but don't throw
    // WHY: Trust score recalculation failure should not break the main flow
    console.error(
      `[Trust] Failed to recalculate score for ${userId}:`,
      error instanceof Error ? error.message : 'Unknown error',
    );
    return 0;
  }
}

// WHAT: Trigger trust score recalculation on reputation-affecting events
// WHY: Keep trust score fresh after every action that should impact reputation
export async function onTrustEvent(userId: string, event: TrustEvent): Promise<void> {
  try {
    // WHAT: Log the event for debugging
    console.log(`[Trust] Event ${event} for user ${userId}`);

    // WHAT: Recalculate score — all events trigger same logic
    // WHY: Atomic update prevents score drift; simpler than per-event rules
    await recalculateTrustScore(userId);
  } catch (error) {
    console.error(
      `[Trust] onTrustEvent failed for ${userId}/${event}:`,
      error instanceof Error ? error.message : 'Unknown error',
    );
  }
}

// WHAT: Map trust score to UI label, color, and icon
// WHY: Provide consistent user-facing trust status across all pages
export function trustLevel(score: number): TrustLevelInfo {
  if (score >= 85) return TRUST_LEVELS.trusted;
  if (score >= 65) return TRUST_LEVELS.reliable;
  if (score >= 45) return TRUST_LEVELS.building;
  if (score >= 25) return TRUST_LEVELS.new;
  return TRUST_LEVELS.atRisk;
}

// WHAT: Export trust event type for use in other services
export type { TrustEvent };
