-- ============================================================
-- Migration 001: Add username column + password reset tokens
-- Run this in the Supabase SQL editor.
-- ============================================================

-- Add username to users (nullable so existing rows aren't broken)
ALTER TABLE users ADD COLUMN IF NOT EXISTS username text unique;
CREATE INDEX IF NOT EXISTS users_username_idx ON users (username);

-- ----------------------------------------------------------------
-- password_reset_tokens
-- Stores short-lived tokens for the "forgot password" flow.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users (id) on delete cascade,
  token      text not null unique,
  expires_at timestamptz not null,
  used_at    timestamptz,
  created_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS prt_token_idx   ON password_reset_tokens (token);
CREATE INDEX IF NOT EXISTS prt_user_id_idx ON password_reset_tokens (user_id);

-- RLS (service role bypasses this, but good defence-in-depth)
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prt: own rows" ON password_reset_tokens
  FOR ALL USING (auth.uid() = user_id);
