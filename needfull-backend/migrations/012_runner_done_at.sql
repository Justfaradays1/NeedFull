-- Migration 012: Add runner_done_at column for "Mark as Done" flow
-- Runner can mark task as complete, poster then confirms to release escrow

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS runner_done_at TIMESTAMPTZ;
