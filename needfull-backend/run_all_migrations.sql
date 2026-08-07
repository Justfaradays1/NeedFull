-- WHAT: Run ALL pending migrations in order
-- WHY: The /auth/me endpoint (and others) reference columns like trust_score,
--      roles, active_role, google_id that may not exist in the DB yet.
-- RUN THIS in Supabase SQL Editor → https://supabase.com/dashboard
-- Then restart the backend server.

-- 1. Migration 007 — verification tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE student_id_verifications ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id);
ALTER TABLE trust_score_log ADD COLUMN IF NOT EXISTS rating_points INTEGER DEFAULT 0;
ALTER TABLE trust_score_log ADD COLUMN IF NOT EXISTS completion_points INTEGER DEFAULT 0;
ALTER TABLE trust_score_log ADD COLUMN IF NOT EXISTS verification_points INTEGER DEFAULT 0;
ALTER TABLE trust_score_log ADD COLUMN IF NOT EXISTS report_penalty INTEGER DEFAULT 0;
ALTER TABLE trust_score_log ADD COLUMN IF NOT EXISTS tenure_points INTEGER DEFAULT 0;

-- 2. Migration 008 — multi-role architecture
ALTER TABLE users ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT '{poster}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS active_role TEXT DEFAULT 'poster';
ALTER TABLE users ADD COLUMN IF NOT EXISTS runner_status TEXT DEFAULT 'none'
  CHECK (runner_status IN ('none', 'pending', 'approved', 'suspended'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_status TEXT DEFAULT 'none'
  CHECK (business_status IN ('none', 'pending', 'approved', 'suspended'));
UPDATE users SET roles = ARRAY['poster', 'runner'], runner_status = 'approved'
WHERE is_runner = true AND (roles IS NULL OR roles = ARRAY[]::text[]);
UPDATE users SET roles = ARRAY['poster'] WHERE roles IS NULL OR roles = ARRAY[]::text[];
UPDATE users SET active_role = 'runner'
WHERE is_runner = true AND (active_role IS NULL OR active_role NOT IN ('poster', 'runner'));
UPDATE users SET active_role = 'poster' WHERE active_role IS NULL;

-- 3. Migration 009 — user preferences (table creation)
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'system',
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  push_notifications BOOLEAN NOT NULL DEFAULT true,
  preferred_role TEXT DEFAULT 'poster',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Migration 010 — Google OAuth
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT;
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users (google_id) WHERE google_id IS NOT NULL;

-- 5. Migration 011 — purchase escrow system
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_purchase BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS delivery_instruction TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS delivery_image_url TEXT;
CREATE TABLE IF NOT EXISTS purchase_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL UNIQUE REFERENCES tasks(id) ON DELETE CASCADE,
  poster_id UUID NOT NULL REFERENCES users(id),
  runner_id UUID REFERENCES users(id),
  item_name TEXT NOT NULL DEFAULT '',
  item_description TEXT,
  estimated_cost INTEGER NOT NULL DEFAULT 0,
  excess_amount INTEGER NOT NULL DEFAULT 0,
  excess_approved BOOLEAN NOT NULL DEFAULT false,
  excess_requested_by TEXT,
  receipt_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'purchased', 'delivered', 'completed', 'cancelled', 'disputed', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS purchase_escrow_kobo INTEGER NOT NULL DEFAULT 0;
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS purchase_task_id UUID REFERENCES purchase_tasks(id);
CREATE TABLE IF NOT EXISTS purchase_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_task_id UUID NOT NULL REFERENCES purchase_tasks(id),
  raised_by UUID NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. add_missing_columns — trust_score, bio, department, etc.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS level TEXT,
  ADD COLUMN IF NOT EXISTS hostel TEXT,
  ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS location_label TEXT,
  ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
  ADD COLUMN IF NOT EXISTS trust_score INTEGER NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS tasks_completed INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_runner BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_verified_student BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
UPDATE users SET email_verified = true WHERE email_verified_at IS NOT NULL AND email_verified = false;

-- 7. wallet_transactions.reference (used by wallet controller)
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS reference TEXT;

-- 8. wallets.pending_balance (used by wallet service, removed from queries but kept for schema completeness)
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS pending_balance INTEGER NOT NULL DEFAULT 0;

-- 9. Migration 012 — runner_done_at (Mark as Done flow)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS runner_done_at TIMESTAMPTZ;

-- 10. Migration 019 — task state machine columns
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS work_mode TEXT NOT NULL DEFAULT 'on_site'
  CHECK (work_mode IN ('on_site', 'remote'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS runner_phase TEXT;
CREATE INDEX IF NOT EXISTS idx_tasks_work_mode ON tasks (work_mode);
CREATE INDEX IF NOT EXISTS idx_tasks_runner_phase ON tasks (runner_phase)
  WHERE runner_phase IS NOT NULL;
