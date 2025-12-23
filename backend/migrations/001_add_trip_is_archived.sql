-- Migration: Add is_archived column to trips table
-- Date: 2025-12-23
-- Description: Allows trips to be marked as complete/archived

-- Add is_archived column with default false
ALTER TABLE trips ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;

-- Add index for efficient queries on archived status
CREATE INDEX IF NOT EXISTS ix_trips_owner_archived ON trips(owner_id, is_archived);
