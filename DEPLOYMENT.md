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
| 012 | `migrations/012_*.sql` | already applied | `runner_done_at` timestamp |
| 014 | `migrations/014_runner_earnings.sql` | **NEW** | Adds `wallets.pending_earnings`, `wallets.earnings`, `withdrawal_requests.source`. Powers the earnings/funded two-bucket wallet. |
| 015 | `migrations/015_runner_busy.sql` | **NEW** | Adds `users.runner_busy`. Powers OFF / ONLINE / BUSY availability. |

> There is **no 013** — 014 was the next number assigned after the last applied migration.

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