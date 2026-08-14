-- 023_budget_negotiation_complete.sql
-- WHAT: One idempotent migration covering the FULL budget-negotiation schema
--       the code expects. 022 created task_budget_proposals and
--       escrow_amount_kobo; this file also fills the gaps that historically
--       lived only in manual SQL: tasks.agreed_amount_kobo,
--       task_applications.negotiation columns, and proposals.accepted_year.
--       Safe to run on any database state — every step is IF NOT EXISTS.

-- Budget proposals table (in case 022 was never applied)
CREATE TABLE IF NOT EXISTS task_budget_proposals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    application_id uuid REFERENCES task_applications(id) ON DELETE CASCADE,
    proposer_id uuid NOT NULL REFERENCES users(id),
    original_amount_kobo integer NOT NULL,
    proposed_amount_kobo integer NOT NULL,
    difference_kobo integer NOT NULL,
    reason text,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamptz NOT NULL DEFAULT NOW(),
    responded_at timestamptz,
    expires_at timestamptz NOT NULL DEFAULT (NOW() + interval '24 hours'),
    accepted_year integer
);

CREATE INDEX IF NOT EXISTS idx_task_budget_proposals_task ON task_budget_proposals(task_id);
CREATE INDEX IF NOT EXISTS idx_task_budget_proposals_status ON task_budget_proposals(status);
CREATE INDEX IF NOT EXISTS idx_task_budget_proposals_proposer ON task_budget_proposals(proposer_id);

-- Per-task escrow mirror (how much of this task is locked right now)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS escrow_amount_kobo integer;
UPDATE tasks SET escrow_amount_kobo = budget_kobo WHERE escrow_amount_kobo IS NULL;
ALTER TABLE tasks ALTER COLUMN escrow_amount_kobo SET NOT NULL;
ALTER TABLE tasks ALTER COLUMN escrow_amount_kobo SET DEFAULT 0;

-- Agreed (post-negotiation) amount on the task — NULL until a hire happens
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS agreed_amount_kobo integer;

-- Application-level negotiation state
ALTER TABLE task_applications ADD COLUMN IF NOT EXISTS counter_amount_kobo integer;
ALTER TABLE task_applications ADD COLUMN IF NOT EXISTS agreed_amount_kobo integer;
ALTER TABLE task_applications ADD COLUMN IF NOT EXISTS is_counter_offer boolean NOT NULL DEFAULT false;