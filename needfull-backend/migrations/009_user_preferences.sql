-- WHAT: Create user_preferences table
-- WHY: Stores per-user preferences (theme, notifications, preferred_role, etc.)

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  preferred_role TEXT NOT NULL DEFAULT 'poster' CHECK (preferred_role IN ('poster', 'runner', 'both')),
  sidebar_collapsed BOOLEAN NOT NULL DEFAULT false,
  preferred_language TEXT NOT NULL DEFAULT 'en',
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  notification_sound BOOLEAN NOT NULL DEFAULT true,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  task_radius_km INTEGER NOT NULL DEFAULT 5 CHECK (task_radius_km >= 1 AND task_radius_km <= 50),
  default_sort TEXT NOT NULL DEFAULT 'nearest' CHECK (default_sort IN ('nearest', 'newest', 'budget', 'urgent')),
  available_on_login BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create preferences row when a user is created
CREATE OR REPLACE FUNCTION auto_create_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_create_user_preferences ON users;
CREATE TRIGGER trg_auto_create_user_preferences
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_user_preferences();

-- Create preferences for existing users who don't have one yet
INSERT INTO user_preferences (user_id)
SELECT id FROM users u
WHERE NOT EXISTS (SELECT 1 FROM user_preferences up WHERE up.user_id = u.id);
