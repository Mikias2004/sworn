-- ============================================================
-- Migration 007: Add all columns required by the app
-- Run this once in the Supabase SQL editor.
-- Safe to re-run (IF NOT EXISTS on every ALTER).
-- ============================================================

-- From migration 002 (social features)
ALTER TABLE goals
  ADD COLUMN IF NOT EXISTS started_via_goal_id uuid REFERENCES goals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS started_via_type     text CHECK (started_via_type IN ('friend_feed', 'discover', 'profile')),
  ADD COLUMN IF NOT EXISTS updated_at           timestamptz DEFAULT now();

-- From migration 004 (notifications + streaks)
ALTER TABLE goals
  ADD COLUMN IF NOT EXISTS tracking_app        text,
  ADD COLUMN IF NOT EXISTS streak_count        integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_completed_date date,
  ADD COLUMN IF NOT EXISTS last_notified_at    timestamptz;

-- From migration 005 (goal tracking)
ALTER TABLE goals
  ADD COLUMN IF NOT EXISTS tracking_method          text CHECK (tracking_method IN ('timer', 'connected', 'manual')),
  ADD COLUMN IF NOT EXISTS connected_app            text,
  ADD COLUMN IF NOT EXISTS target_duration_seconds  integer;

-- From migration 006 (extended tracking — for future use)
ALTER TABLE goals
  ADD COLUMN IF NOT EXISTS target_count   integer,
  ADD COLUMN IF NOT EXISTS target_unit    text,
  ADD COLUMN IF NOT EXISTS period_target  integer,
  ADD COLUMN IF NOT EXISTS custom_schedule jsonb,
  ADD COLUMN IF NOT EXISTS start_date     timestamptz;

-- Backfill tracking_method for existing goals
UPDATE goals
  SET tracking_method = CASE
    WHEN tracking_app IS NOT NULL THEN 'connected'
    ELSE 'manual'
  END
WHERE tracking_method IS NULL;

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS goals_updated_at ON goals;
CREATE TRIGGER goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_goals_updated_at();
