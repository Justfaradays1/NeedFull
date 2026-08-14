-- 022_budget_proposals.sql
-- Budget negotiation: auditable proposal records + per-task escrow tracking.
-- Proposals are SEPARATE from tasks: the original poster budget is never
-- overwritten. proposed_amount_kobo is negotiated on top of original_amount_kobo.

CREATE TABLE IF NOT EXISTS task_budget_proposals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    application_id uuid REFERENCES task_applications(id) ON DELETE CASCADE,
    proposer_id uuid NOT NULL REFERENCES users(id),
    -- Authoritative task budget at proposal time (snapshot — never mutated)
    original_amount_kobo integer NOT NULL,
    proposed_amount_kobo integer NOT NULL,
    difference_kobo integer NOT NULL,
    reason text,
    -- pending | accepted | rejected | cancelled | expired
    status text NOT NULL DEFAULT 'pending',
    created_at timestamptz NOT NULL DEFAULT NOW(),
    responded_at timestamptz,
    expires_at timestamptz NOT NULL DEFAULT (NOW() + interval '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_task_budget_proposals_task ON task_budget_proposals(task_id);
CREATE INDEX IF NOT EXISTS idx_task_budget_proposals_status ON task_budget_proposals(status);
CREATE INDEX IF NOT EXISTS idx_task_budget_proposals_proposer ON task_budget_proposals(proposer_id);

-- Per-task escrow mirror: how much of THIS task's budget is currently locked.
-- Kept in sync atomically with every wallet escrow movement (same transaction).
-- Backfills existing rows: createTask always locks budget immediately.
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS escrow_amount_kobo integer;
UPDATE tasks SET escrow_amount_kobo = budget_kobo WHERE escrow_amount_kobo IS NULL;
ALTER TABLE tasks ALTER COLUMN escrow_amount_kobo SET NOT NULL;
ALTER TABLE tasks ALTER COLUMN escrow_amount_kobo SET DEFAULT 0;

-- Hard idempotency guarantee for all wallet operations (deposits, funding,
-- withdrawals). Application-level dedupe already exists; this makes duplicate
-- financial operations impossible at the database level.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'uq_wallet_transactions_idempotency') THEN
        IF EXISTS (
            SELECT 1 FROM wallet_transactions
            WHERE idempotency_key IS NOT NULL
            GROUP BY wallet_id, idempotency_key HAVING COUNT(*) > 1
            LIMIT 1
        ) THEN
            RAISE NOTICE 'wallet_transactions has duplicate idempotency_key rows; unique index skipped — dedupe manually before re-running';
        ELSE
            CREATE UNIQUE INDEX uq_wallet_transactions_idempotency
                ON wallet_transactions(wallet_id, idempotency_key)
                WHERE idempotency_key IS NOT NULL;
        END IF;
    END IF;
END $$;

-- One rating per (reviewer, task) — defends against duplicate ratings even
-- under concurrent requests (reviews currently dedupe only in app code).
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'uq_reviews_reviewer_task') THEN
        IF EXISTS (
            SELECT 1 FROM reviews
            GROUP BY reviewer_id, task_id HAVING COUNT(*) > 1
            LIMIT 1
        ) THEN
            RAISE NOTICE 'reviews has duplicate (reviewer_id, task_id) rows; unique index skipped — dedupe manually before re-running';
        ELSE
            CREATE UNIQUE INDEX uq_reviews_reviewer_task ON reviews(reviewer_id, task_id);
        END IF;
    END IF;
END $$;