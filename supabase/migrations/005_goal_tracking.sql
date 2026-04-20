-- ============================================================
-- Migration 005: Enhanced goal tracking columns
-- Run this in the Supabase SQL editor.
-- ============================================================

-- tracking_method: how progress is logged (timer, connected app, or manual)
-- connected_app: the specific app connected for tracking
-- target_duration_seconds: timer target (e.g. 1800 = 30 min)
ALTER TABLE goals
  ADD COLUMN IF NOT EXISTS tracking_method text CHECK (tracking_method IN ('timer', 'connected', 'manual')),
  ADD COLUMN IF NOT EXISTS connected_app text,
  ADD COLUMN IF NOT EXISTS target_duration_seconds integer;

-- Backfill tracking_method from existing tracking_app data
UPDATE goals
  SET tracking_method = CASE
    WHEN tracking_app IS NOT NULL THEN 'connected'
    ELSE 'manual'
  END
WHERE tracking_method IS NULL;

-- user_id on datapoints for simpler RLS queries
-- started_at / stopped_at for timer sessions
ALTER TABLE datapoints
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS stopped_at timestamptz;

-- Backfill user_id from the parent goal
UPDATE datapoints d
  SET user_id = g.user_id
  FROM goals g
  WHERE d.goal_id = g.id
    AND d.user_id IS NULL;
