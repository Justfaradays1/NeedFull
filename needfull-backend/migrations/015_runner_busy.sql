-- Migration 015: Runner availability states — OFF / ONLINE / BUSY
--
-- Augments the existing is_available boolean (the runner's "Go Online" toggle)
-- with a runner_busy flag. Combined semantics:
--   OFF    → is_available = false
--   ONLINE → is_available = true  AND runner_busy = false
--   BUSY   → is_available = true  AND runner_busy = true
--
-- Matching/notification queries exclude busy runners (they cannot take on new
-- tasks while working an in_progress one). Anonymous toggling is untouched:
-- PATCH /users/me/available only flips is_available.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS runner_busy BOOLEAN NOT NULL DEFAULT false;