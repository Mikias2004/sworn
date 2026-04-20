-- ============================================================
-- Migration 006: Extended tracking columns
-- Run this in the Supabase SQL editor when ready to use
-- per-goal count/unit targets and custom schedules.
-- ============================================================

ALTER TABLE goals
  ADD COLUMN IF NOT EXISTS target_count integer,
  ADD COLUMN IF NOT EXISTS target_unit text,
  ADD COLUMN IF NOT EXISTS period_target integer,
  ADD COLUMN IF NOT EXISTS custom_schedule jsonb,
  ADD COLUMN IF NOT EXISTS start_date timestamptz;
