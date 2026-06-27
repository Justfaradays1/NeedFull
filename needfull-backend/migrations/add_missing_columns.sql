-- WHAT: Add columns to users table that were referenced in code but never migrated
-- WHY: These columns are expected by users.controller.ts, admin.controller.ts, and various services

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

-- Update email_verified from email_verified_at for existing rows
UPDATE users SET email_verified = true WHERE email_verified_at IS NOT NULL AND email_verified = false;
