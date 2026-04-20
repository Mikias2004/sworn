-- ============================================================
-- Migration 002: Social features + settings + billing updates
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. friendships table
CREATE TABLE IF NOT EXISTS friendships (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS friendships_follower_idx  ON friendships (follower_id);
CREATE INDEX IF NOT EXISTS friendships_following_idx ON friendships (following_id);

-- RLS
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own friendships" ON friendships
  FOR ALL USING (follower_id = auth.uid() OR following_id = auth.uid());

-- 2. goals table additions (social discovery tracking)
ALTER TABLE goals
  ADD COLUMN IF NOT EXISTS started_via_goal_id uuid REFERENCES goals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS started_via_type     text CHECK (started_via_type IN ('friend_feed', 'discover', 'profile'));

-- 3. users table — notification preferences
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS notification_time_midday          text    DEFAULT '12:00',
  ADD COLUMN IF NOT EXISTS notification_streak_celebrations  boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notification_miss_notifications   boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notification_weekly_summary       boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notification_friends_activity     boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS notification_quiet_hours_enabled  boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS notification_quiet_from           text    DEFAULT '22:00',
  ADD COLUMN IF NOT EXISTS notification_quiet_to             text    DEFAULT '07:00',
  ADD COLUMN IF NOT EXISTS timezone                          text    DEFAULT 'America/New_York';

-- 4. charges table — refund status + updated_at for archived_at
ALTER TABLE charges
  ADD COLUMN IF NOT EXISTS status       text DEFAULT 'charged' CHECK (status IN ('charged', 'refunded')),
  ADD COLUMN IF NOT EXISTS refunded_at  timestamptz;

-- goals: add updated_at for archived_at tracking
ALTER TABLE goals
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Auto-update updated_at on goals
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
