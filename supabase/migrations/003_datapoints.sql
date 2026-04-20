-- ============================================================
-- Migration 003: Add met_target and duration to datapoints
-- Run this in the Supabase SQL editor.
-- ============================================================

-- met_target: whether the logged session satisfied the goal's target
ALTER TABLE datapoints ADD COLUMN IF NOT EXISTS met_target boolean NOT NULL DEFAULT false;

-- duration: elapsed seconds for timer-based goals (null for count goals)
ALTER TABLE datapoints ADD COLUMN IF NOT EXISTS duration integer;
