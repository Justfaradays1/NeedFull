-- WHAT: Multi-role architecture — roles[], active_role, status columns
-- WHY: Users need multiple roles (poster, runner, future business) with active role switching

-- Add roles array column (default every user is a poster)
ALTER TABLE users ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT '{poster}';

-- Add active role (the role currently driving the UI/UX)
ALTER TABLE users ADD COLUMN IF NOT EXISTS active_role TEXT DEFAULT 'poster';

-- Add runner status for the runner application flow
ALTER TABLE users ADD COLUMN IF NOT EXISTS runner_status TEXT DEFAULT 'none'
  CHECK (runner_status IN ('none', 'pending', 'approved', 'suspended'));

-- Add business status for future NeedWork
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_status TEXT DEFAULT 'none'
  CHECK (business_status IN ('none', 'pending', 'approved', 'suspended'));

-- Migrate existing users: anyone with is_runner=true gets runner role
UPDATE users SET roles = ARRAY['poster', 'runner'], runner_status = 'approved'
WHERE is_runner = true AND (roles IS NULL OR roles = ARRAY[]::text[]);

-- Ensure existing users have at least poster role
UPDATE users SET roles = ARRAY['poster'] WHERE roles IS NULL OR roles = ARRAY[]::text[];

-- Set active_role for existing users (prefer runner if they are one, else poster)
UPDATE users SET active_role = 'runner'
WHERE is_runner = true AND (active_role IS NULL OR active_role NOT IN ('poster', 'runner'));

UPDATE users SET active_role = 'poster' WHERE active_role IS NULL;
