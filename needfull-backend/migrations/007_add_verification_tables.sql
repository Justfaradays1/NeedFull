-- WHAT: Add admin_audit_log table, phone_verified column, and student_id_verifications constraints
-- WHY: Support for admin verification audit trail, phone verification flag, and data integrity

-- Add phone_verified column if missing
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT false;

-- Create admin_audit_log table
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target ON admin_audit_log(target_type, target_id);

-- Ensure student_id_verifications has all expected columns
ALTER TABLE student_id_verifications ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE student_id_verifications ADD COLUMN IF NOT EXISTS rejection_note TEXT;
ALTER TABLE student_id_verifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE student_id_verifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE student_id_verifications ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id);
ALTER TABLE student_id_verifications ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Fix photo_url NOT NULL — code uses image_url instead
ALTER TABLE student_id_verifications ALTER COLUMN photo_url DROP NOT NULL;
ALTER TABLE student_id_verifications ALTER COLUMN photo_url SET DEFAULT NULL;

-- Migrate data from old column names if they exist and new columns are empty
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_id_verifications' AND column_name = 'id_url') THEN
    UPDATE student_id_verifications SET image_url = id_url WHERE image_url IS NULL AND id_url IS NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_id_verifications' AND column_name = 'note') THEN
    UPDATE student_id_verifications SET rejection_note = note WHERE rejection_note IS NULL AND note IS NOT NULL;
  END IF;
END $$;

-- Add indexes for student_id_verifications
CREATE INDEX IF NOT EXISTS idx_siv_user_id ON student_id_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_siv_status ON student_id_verifications(status);
CREATE INDEX IF NOT EXISTS idx_siv_user_status ON student_id_verifications(user_id, status);

-- Ensure no duplicate pending verifications per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_siv_pending_per_user
  ON student_id_verifications(user_id) WHERE status = 'pending';

-- Fix trust_score_log column naming (code uses rating_points but table may use rating_pts)
ALTER TABLE trust_score_log ADD COLUMN IF NOT EXISTS rating_points INTEGER DEFAULT 0;
ALTER TABLE trust_score_log ADD COLUMN IF NOT EXISTS completion_points INTEGER DEFAULT 0;
ALTER TABLE trust_score_log ADD COLUMN IF NOT EXISTS verification_points INTEGER DEFAULT 0;
ALTER TABLE trust_score_log ADD COLUMN IF NOT EXISTS report_penalty INTEGER DEFAULT 0;
ALTER TABLE trust_score_log ADD COLUMN IF NOT EXISTS tenure_points INTEGER DEFAULT 0;

-- Migrate data from old column names
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trust_score_log' AND column_name = 'rating_pts') THEN
    UPDATE trust_score_log SET rating_points = rating_pts WHERE rating_points = 0 AND rating_pts IS NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trust_score_log' AND column_name = 'completion_pts') THEN
    UPDATE trust_score_log SET completion_points = completion_pts WHERE completion_points = 0 AND completion_pts IS NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trust_score_log' AND column_name = 'verification_pts') THEN
    UPDATE trust_score_log SET verification_points = verification_pts WHERE verification_points = 0 AND verification_pts IS NOT NULL;
  END IF;
END $$;
