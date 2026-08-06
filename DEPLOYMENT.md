# NeedFull — Deployment Checklist

Run migrations in order against the Supabase database **before** deploying the
backend. Migrations are written with `IF NOT EXISTS` where the schema permits,
so the column additions below are safe to re-run. Apply them in a Supabase SQL
editor or via `psql`, oldest first.

## Current deployment

Live backend: `https://needfull.onrender.com` · DB: Supabase Postgres · Frontend: Vercel.

## Migration order (apply ALL, top to bottom)

| # | File | Applies | Notes |
|---|------|---------|-------|
| 012 | `migrations/012_runner_done_at.sql` | **NEW** | `tasks.runner_done_at` — powers "Mark as Done" → pending → to confirm. |
| 013 | `migrations/013_manual_transfers_fix.sql` | **NEW** | Manual transfer schema fixes. |
| 014 | `migrations/014_runner_earnings.sql` | **NEW** | Adds `wallets.pending_earnings`, `wallets.earnings`, `withdrawal_requests.source`. Powers the earnings/funded two-bucket wallet. |
| 015 | `migrations/015_runner_busy.sql` | **NEW** | Adds `users.runner_busy`. Powers OFF / ONLINE / BUSY availability. |
| 016 | `migrations/016_task_applications_runner_id.sql` | **NEW** | Adds `task_applications.runner_id` + `updated_at`. Live schema used `applicant_id` while the codebase uses `runner_id`. |
| 017 | `migrations/017_wallet_tx_enum.sql` | **NEW** | Adds `earnings`, `earnings_withdrawal`, `withdrawal_failed_refund` to the `wallet_tx_type` enum (required by the two-bucket ledger). |

> The **012 → 013 → … → 017** sequence above matches the files in `migrations/`.
> The whole set can be applied in one shot with:
> `cd needfull-backend && npx tsx scripts/apply-migrations.ts`

## Migration SQL (copy + run)

### 014 — runner earnings separation

```sql
ALTER TABLE wallets
  ADD COLUMN IF NOT EXISTS pending_earnings INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS earnings INTEGER NOT NULL DEFAULT 0;

ALTER TABLE withdrawal_requests
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'balance';
```

### 015 — runner busy/availability state

```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS runner_busy BOOLEAN NOT NULL DEFAULT false;
```

## After migrations

1. Re-deploy backend to Render (picks up new columns + query changes).
2. Frontend (Vercel) can deploy at any point — it tolerates missing fields via
   `?? 0` fallbacks, but deploy together for the full experience.
3. Smoke-test the money rules on a test account:
   - Fund ₦2,000 as a poster → only the poster "Available Balance" moves.
   - Switch to Runner mode → withdraw shows "Available Earnings" (₦0), not the
     funded balance.
   - Complete a task → escrow releases into **earnings**, not balance.
   - Withdraw as runner debits earnings only; a failed transfer refunds back
     into earnings.
   - Toggle Go Online, accept a task → status shows "Working on a task" (busy),
     and the poster's task detail no longer lists you under nearby runners.

4. Repeatable end-to-end assertion of the whole flow (throwaway users, auto-cleanup):
   `cd needfull-backend && npx tsx scripts/test-runner-architecture.ts`