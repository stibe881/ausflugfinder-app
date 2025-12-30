-- Add is_bookmarked column to user_trips table
ALTER TABLE user_trips ADD COLUMN IF NOT EXISTS is_bookmarked BOOLEAN DEFAULT FALSE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_trips_bookmarked ON user_trips(user_id, is_bookmarked) WHERE is_bookmarked = TRUE;
