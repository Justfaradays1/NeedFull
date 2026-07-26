-- Run this in Supabase SQL Editor to add the missing `pending_balance` column
ALTER TABLE wallets
ADD COLUMN IF NOT EXISTS pending_balance INTEGER NOT NULL DEFAULT 0;
