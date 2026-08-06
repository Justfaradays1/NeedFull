-- WHAT: Add earnings-bucket transaction types to the wallet_transactions enum
-- WHY:  releaseEscrow writes "earnings", runner withdrawals write
--       "earnings_withdrawal", and failed-transfer refunds write
--       "withdrawal_failed_refund" — none existed in wallet_tx_type.

ALTER TYPE wallet_tx_type ADD VALUE IF NOT EXISTS 'earnings';
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'wallet_tx_type' AND e.enumlabel = 'earnings_withdrawal'
  ) THEN
    ALTER TYPE wallet_tx_type ADD VALUE 'earnings_withdrawal';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'wallet_tx_type' AND e.enumlabel = 'withdrawal_failed_refund'
  ) THEN
    ALTER TYPE wallet_tx_type ADD VALUE 'withdrawal_failed_refund';
  END IF;
END $$;