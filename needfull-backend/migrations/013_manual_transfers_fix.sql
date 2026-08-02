-- WHAT: Fix manual_transfers schema — add columns the backend code requires
-- WHY: manualTransfer.service.ts INSERT/SELECT statements reference amount_naira and
--      updated_at, but those columns were never added to the table. Every submission
--      failed with "column ... does not exist" → API returned HTTP 400.
-- WHEN: Run once in the Supabase SQL Editor (already applied if you're reading this after the fix)

ALTER TABLE manual_transfers
  ADD COLUMN IF NOT EXISTS amount_naira numeric(14, 2);

ALTER TABLE manual_transfers
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- WHAT: Backfill naira values for rows created before the column existed
-- WHY: Legacy rows have NULL amount_naira and crash consumers (e.g. admin deposits page)
UPDATE manual_transfers
SET amount_naira = amount_kobo::numeric / 100
WHERE amount_naira IS NULL;

-- WHAT: Lock the column so NULLs can never return
ALTER TABLE manual_transfers
  ALTER COLUMN amount_naira SET NOT NULL;
