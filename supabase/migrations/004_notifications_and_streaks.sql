-- Push notification subscription and timing preferences per user
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS push_subscription jsonb,
  ADD COLUMN IF NOT EXISTS notification_time_morning time DEFAULT '08:00',
  ADD COLUMN IF NOT EXISTS notification_time_deadline time DEFAULT '22:00';

-- Streak tracking and notification state per goal
ALTER TABLE goals
  ADD COLUMN IF NOT EXISTS streak_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_completed_date date,
  ADD COLUMN IF NOT EXISTS last_notified_at timestamptz,
  ADD COLUMN IF NOT EXISTS tracking_app text;
