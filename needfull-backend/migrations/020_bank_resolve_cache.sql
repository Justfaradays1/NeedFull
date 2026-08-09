-- WHAT: Cache for bank account name resolutions
-- WHY: Paystack test mode only allows 3 real-bank resolves per day; caching
--      means each unique account is resolved once and reused forever after.

CREATE TABLE IF NOT EXISTS bank_account_cache (
  id SERIAL PRIMARY KEY,
  account_number TEXT NOT NULL,
  bank_code TEXT NOT NULL,
  account_name TEXT,
  failed_reason TEXT,
  resolved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (account_number, bank_code)
);