-- Migration: Create push_tokens table for storing Expo push notification tokens
-- This allows admins to send broadcast notifications to all users

CREATE TABLE IF NOT EXISTS push_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    device_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);

-- Index for token lookups
CREATE INDEX IF NOT EXISTS idx_push_tokens_token ON push_tokens(token);

-- Enable RLS
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Users can insert/update their own tokens
DROP POLICY IF EXISTS "Users can manage their own push tokens" ON push_tokens;
CREATE POLICY "Users can manage their own push tokens"
    ON push_tokens
    FOR ALL
    TO authenticated
    USING (auth.uid()::text = (SELECT open_id FROM users WHERE id = user_id))
    WITH CHECK (auth.uid()::text = (SELECT open_id FROM users WHERE id = user_id));

-- Admins can read all tokens (for broadcast)
-- Note: Admin status is checked in app code via email, not in database
DROP POLICY IF EXISTS "Authenticated users can read all push tokens" ON push_tokens;
CREATE POLICY "Authenticated users can read all push tokens"
    ON push_tokens
    FOR SELECT
    TO authenticated
    USING (true);
