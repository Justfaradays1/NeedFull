-- WHAT: Task state machine columns — work_mode (On-site/Remote) and runner_phase
-- WHY: 1) Task cards must show an On-site / Remote badge; tasks had no such field.
--      2) The task lifecycle state machine needs a granular runner progress
--         phase (Matched → Accepted → Travelling → Arrived → Working →
--         Awaiting Confirmation) without rewriting legacy task statuses.
-- NOTE: tasks.status keeps its legacy vocabulary (open / in_progress / completed /
--       cancelled) — canonical states are mapped in task-states.ts.

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS work_mode TEXT NOT NULL DEFAULT 'on_site'
  CHECK (work_mode IN ('on_site', 'remote'));

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS runner_phase TEXT;

CREATE INDEX IF NOT EXISTS idx_tasks_work_mode ON tasks (work_mode);
CREATE INDEX IF NOT EXISTS idx_tasks_runner_phase ON tasks (runner_phase)
  WHERE runner_phase IS NOT NULL;
