-- Run this in Supabase SQL Editor to verify schema matches

-- 1. List all tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. List all enum types and their values
SELECT t.typname, e.enumlabel
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
ORDER BY t.typname, e.enumsortorder;

-- 3. List all triggers
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY trigger_name;

-- 4. Check if PostGIS is installed
SELECT PostGIS_Version();

-- 5. Check task columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tasks'
ORDER BY ordinal_position;

-- 6. Check if wallet_transactions has fk_wtx_task constraint
SELECT conname, contype
FROM pg_constraint
WHERE conname = 'fk_wtx_task';

-- 7. Check for any missing columns (example: balance vs balance_kobo in wallets)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'wallets'
ORDER BY ordinal_position;
