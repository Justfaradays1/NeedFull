-- Run this in Supabase SQL Editor to add the missing `reference` column
ALTER TABLE wallet_transactions
ADD COLUMN IF NOT EXISTS reference TEXT;

-- Also update the idempotency check that uses it
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_reference
ON wallet_transactions (reference);
