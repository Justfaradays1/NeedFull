-- 024_task_status_awaiting_funding.sql
-- WHAT: Extend the task_status enum with 'awaiting_funding'.
-- WHY:  A negotiated hire (agreed amount > escrow) parks the task in
--       awaiting_funding until the poster secures the difference. The
--       task_status enum predates that state and PG rejects unknown
--       enum labels — hiring failed with
--       'invalid input value for enum task_status: "awaiting_funding"'.
-- NOTE: run OUTSIDE any transaction (ALTER TYPE ... ADD VALUE cannot run in
--       one on older PG); the DO block makes re-runs a no-op.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumtypid = 'task_status'::regtype
          AND enumlabel = 'awaiting_funding'
    ) THEN
        ALTER TYPE task_status ADD VALUE 'awaiting_funding';
    END IF;
END $$;