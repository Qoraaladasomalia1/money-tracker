-- MoneyTrack schema for Supabase (PostgreSQL)
-- Run in: Supabase Dashboard → SQL Editor → New query → Run

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  currency text not null default 'USD',
  theme text not null default 'light',
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('expense', 'received')),
  created_at timestamptz not null default now(),
  unique (user_id, name, type)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  type text not null check (type in ('received', 'expense')),
  amount numeric(12, 2) not null check (amount > 0),
  category text not null,
  description text not null default '',
  received_from text,
  note text default '',
  date date not null,
  time time not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_transactions_user_date
  on public.transactions (user_id, date, time);

create index if not exists idx_categories_user
  on public.categories (user_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_transactions_updated_at on public.transactions;
create trigger trg_transactions_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Express API must use the SERVICE ROLE key (secret) — it bypasses RLS.
-- Do NOT put the publishable/anon key in server/.env or registration will fail:
--   "new row violates row-level security policy for table users"
-- ---------------------------------------------------------------------------

alter table public.users enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;

-- Revoke direct table access from anon/authenticated (browser keys).
-- Service role still has full access and bypasses RLS.
revoke all on table public.users from anon, authenticated;
revoke all on table public.categories from anon, authenticated;
revoke all on table public.transactions from anon, authenticated;

grant all on table public.users to service_role;
grant all on table public.categories to service_role;
grant all on table public.transactions to service_role;

-- Drop any leftover open policies that might confuse debugging
drop policy if exists "users_no_anon" on public.users;
drop policy if exists "categories_no_anon" on public.categories;
drop policy if exists "transactions_no_anon" on public.transactions;
drop policy if exists "Allow public insert users" on public.users;
drop policy if exists "Enable insert for anon" on public.users;
