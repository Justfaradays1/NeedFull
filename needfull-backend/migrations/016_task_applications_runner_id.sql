-- WHAT: Add runner_id to task_applications and backfill from applicant_id
-- WHY:  The entire codebase (services/controllers) references runner_id, but the
--       live schema only has applicant_id. Reconcile without touching old column.

ALTER TABLE task_applications ADD COLUMN IF NOT EXISTS runner_id UUID REFERENCES users(id);
ALTER TABLE task_applications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE task_applications
SET runner_id = applicant_id
WHERE runner_id IS NULL AND applicant_id IS NOT NULL;

-- Enforce going forward — every insert path supplies runner_id explicitly
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'task_applications'
      AND column_name = 'runner_id'
      AND is_nullable = 'YES'
  ) AND NOT EXISTS (
    SELECT 1 FROM task_applications WHERE runner_id IS NULL
  ) THEN
    ALTER TABLE task_applications ALTER COLUMN runner_id SET NOT NULL;
  END IF;
END $$;
