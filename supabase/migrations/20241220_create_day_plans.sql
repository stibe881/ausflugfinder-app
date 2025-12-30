-- Migration: Create day_plans table for the Planer feature
-- Run this in Supabase SQL Editor if the table doesn't exist

CREATE TABLE IF NOT EXISTS day_plans (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    is_draft BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_day_plans_user_id ON day_plans(user_id);

-- Enable Row Level Security
ALTER TABLE day_plans ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own plans (or public plans)
-- Policy: Users can only see their own plans (or public plans)
DROP POLICY IF EXISTS "Users can view their own plans" ON day_plans;
CREATE POLICY "Users can view their own plans" ON day_plans
    FOR SELECT
    USING (auth.uid()::text = (SELECT open_id FROM users WHERE id = user_id) OR is_public = true);

-- Policy: Users can only insert their own plans
DROP POLICY IF EXISTS "Users can create their own plans" ON day_plans;
CREATE POLICY "Users can create their own plans" ON day_plans
    FOR INSERT
    WITH CHECK (auth.uid()::text = (SELECT open_id FROM users WHERE id = user_id));

-- Policy: Users can only update their own plans
DROP POLICY IF EXISTS "Users can update their own plans" ON day_plans;
CREATE POLICY "Users can update their own plans" ON day_plans
    FOR UPDATE
    USING (auth.uid()::text = (SELECT open_id FROM users WHERE id = user_id));

-- Policy: Users can only delete their own plans
DROP POLICY IF EXISTS "Users can delete their own plans" ON day_plans;
CREATE POLICY "Users can delete their own plans" ON day_plans
    FOR DELETE
    USING (auth.uid()::text = (SELECT open_id FROM users WHERE id = user_id));
