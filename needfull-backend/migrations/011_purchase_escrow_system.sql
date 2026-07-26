-- WHAT: Purchase escrow system — secure escrow-based purchase and delivery
-- WHY: Posters fund escrow before task goes live; runners never receive direct payments
-- FUTURE: Add auto-release cron job for unconfirmed deliveries

-- Purchase Tasks (extends tasks table via task_id FK)
CREATE TABLE IF NOT EXISTS purchase_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  estimated_item_cost INT NOT NULL,              -- in kobo
  runner_fee INT NOT NULL,                       -- in kobo
  platform_fee INT NOT NULL,                     -- in kobo
  max_additional_spending INT NOT NULL DEFAULT 0,-- in kobo (buffer)
  total_escrow INT NOT NULL,                     -- estimated_item_cost + runner_fee + platform_fee
  store_name TEXT,
  receipt_url TEXT,
  receipt_amount INT,                            -- in kobo
  receipt_notes TEXT,
  receipt_uploaded_at TIMESTAMPTZ,
  delivery_otp VARCHAR(6),
  otp_generated_at TIMESTAMPTZ,
  otp_verified_at TIMESTAMPTZ,
  status VARCHAR(50) NOT NULL DEFAULT 'pending_payment',
  -- pending_payment, funded, accepted, at_store, shopping, receipt_uploaded,
  -- needs_budget_approval, heading_to_delivery, delivered, confirmed,
  -- disputed, refunded, completed, cancelled
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Budget approvals (when runner exceeds estimated + buffer)
CREATE TABLE IF NOT EXISTS purchase_budget_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_task_id UUID NOT NULL REFERENCES purchase_tasks(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES users(id),
  excess_amount INT NOT NULL,                    -- how much over the approved buffer (kobo)
  actual_receipt_amount INT NOT NULL,            -- what the receipt actually was (kobo)
  reason TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, approved, rejected, cancelled
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Disputes
CREATE TABLE IF NOT EXISTS purchase_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_task_id UUID NOT NULL REFERENCES purchase_tasks(id) ON DELETE CASCADE,
  opened_by UUID NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'open',    -- open, under_review, resolved, closed
  resolution VARCHAR(50),                        -- release_to_runner, refund_poster, split
  admin_id UUID REFERENCES users(id),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Dispute evidence files
CREATE TABLE IF NOT EXISTS purchase_dispute_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES purchase_disputes(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  file_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Purchase audit log
CREATE TABLE IF NOT EXISTS purchase_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_task_id UUID NOT NULL REFERENCES purchase_tasks(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  actor_id UUID REFERENCES users(id),
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_purchase_tasks_task_id ON purchase_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_purchase_tasks_status ON purchase_tasks(status);
CREATE INDEX IF NOT EXISTS idx_purchase_budget_approvals_purchase_task_id ON purchase_budget_approvals(purchase_task_id);
CREATE INDEX IF NOT EXISTS idx_purchase_budget_approvals_status ON purchase_budget_approvals(status);
CREATE INDEX IF NOT EXISTS idx_purchase_disputes_purchase_task_id ON purchase_disputes(purchase_task_id);
CREATE INDEX IF NOT EXISTS idx_purchase_disputes_status ON purchase_disputes(status);
CREATE INDEX IF NOT EXISTS idx_purchase_audit_logs_purchase_task_id ON purchase_audit_logs(purchase_task_id);
CREATE INDEX IF NOT EXISTS idx_purchase_audit_logs_created ON purchase_audit_logs(created_at);

-- Add is_purchase flag to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_purchase BOOLEAN NOT NULL DEFAULT false;

-- Add pending_balance column to wallets (for funds in transit)
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS pending_balance INT NOT NULL DEFAULT 0;
