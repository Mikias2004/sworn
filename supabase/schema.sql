-- ============================================================
-- Sworn — Supabase schema
-- Run this in the Supabase SQL editor to set up your database.
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------
-- users
-- ----------------------------------------------------------------
create table if not exists users (
  id                        uuid primary key default gen_random_uuid(),
  email                     text not null unique,
  name                      text,
  password_hash             text not null,
  stripe_customer_id        text unique,
  stripe_payment_method_id  text,
  created_at                timestamptz not null default now()
);

-- Index for auth lookups
create index if not exists users_email_idx on users (email);

-- ----------------------------------------------------------------
-- goals
-- ----------------------------------------------------------------
create table if not exists goals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references users (id) on delete cascade,
  title          text not null,
  frequency      text not null,  -- e.g. 'daily', 'weekly'
  metric         text not null,  -- e.g. '4 sessions', '30 min'
  pledge_amount  numeric(10, 2) not null check (pledge_amount > 0),
  status         text not null default 'active'
                   check (status in ('active', 'completed', 'failed', 'archived')),
  created_at     timestamptz not null default now()
);

create index if not exists goals_user_id_idx on goals (user_id);
create index if not exists goals_status_idx  on goals (status);

-- ----------------------------------------------------------------
-- datapoints  (logged progress against a goal)
-- ----------------------------------------------------------------
create table if not exists datapoints (
  id         uuid primary key default gen_random_uuid(),
  goal_id    uuid not null references goals (id) on delete cascade,
  value      numeric not null,
  logged_at  timestamptz not null default now()
);

create index if not exists datapoints_goal_id_idx on datapoints (goal_id);

-- ----------------------------------------------------------------
-- charges  (payment records when a goal is missed)
-- ----------------------------------------------------------------
create table if not exists charges (
  id          uuid primary key default gen_random_uuid(),
  goal_id     uuid not null references goals (id) on delete cascade,
  user_id     uuid not null references users (id) on delete cascade,
  amount      numeric(10, 2) not null,
  reason      text not null,
  charged_at  timestamptz not null default now()
);

create index if not exists charges_user_id_idx on charges (user_id);
create index if not exists charges_goal_id_idx on charges (goal_id);

-- ----------------------------------------------------------------
-- Row Level Security
-- Enable RLS so users can only access their own rows.
-- The app uses the service role key (bypasses RLS) from server-side
-- API routes, so the policies here are a defence-in-depth measure.
-- ----------------------------------------------------------------
alter table users      enable row level security;
alter table goals      enable row level security;
alter table datapoints enable row level security;
alter table charges    enable row level security;

-- Users can read/update their own row
create policy "users: own row" on users
  for all using (auth.uid() = id);

-- Goals: own rows only
create policy "goals: own rows" on goals
  for all using (auth.uid() = user_id);

-- Datapoints: own rows only
create policy "datapoints: own rows" on datapoints
  for all using (
    auth.uid() = (select user_id from goals where id = goal_id)
  );

-- Charges: own rows only
create policy "charges: own rows" on charges
  for all using (auth.uid() = user_id);
