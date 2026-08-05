-- Migration 014: Separate Runner earnings from Poster funded balance
--
-- Poster wallet:
--   balance          — fillable spendable money (funded via bank/card)
--   escrow           — money locked on active tasks
-- Runner wallet:
--   pending_earnings — earned money awaiting release (reserved for a future
--                      review-window; today "pending" is shown while a task
--                      is marked done but not yet confirmed by the poster)
--   earnings         — withdrawable earnings
--
-- Rule: funded money can only be withdrawn in Poster mode; earned money only
-- in Runner mode. The two buckets never mix, so a funded ₦20,000 deposit can
-- never be drained through the Runner's withdraw flow.

ALTER TABLE wallets
  ADD COLUMN IF NOT EXISTS pending_earnings INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS earnings INTEGER NOT NULL DEFAULT 0;

-- Track which bucket a withdrawal was debited from so a failed transfer
-- that is auto-refunded lands back in the same bucket.
ALTER TABLE withdrawal_requests
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'balance';