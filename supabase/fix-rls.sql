-- Fix: "new row violates row-level security policy for table users"
--
-- Cause: server/.env has the publishable/anon key instead of the service_role secret.
--
-- Correct fix (recommended):
--   1. Supabase → Project Settings → API
--   2. Copy "service_role" (secret) — NOT "anon" / "publishable"
--   3. Put it in server/.env as SUPABASE_SERVICE_ROLE_KEY=...
--   4. Restart: npm run dev
--
-- This script only tightens grants. Service role bypasses RLS automatically.
-- Run it in SQL Editor after schema.sql if you want.

revoke all on table public.users from anon, authenticated;
revoke all on table public.categories from anon, authenticated;
revoke all on table public.transactions from anon, authenticated;

grant all on table public.users to service_role;
grant all on table public.categories to service_role;
grant all on table public.transactions to service_role;
