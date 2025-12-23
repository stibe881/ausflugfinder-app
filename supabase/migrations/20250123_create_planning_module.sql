-- Planning Module Database Schema (Simplified for initial deployment)
-- Create all tables for trip planning functionality

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE plan_status AS ENUM ('idea', 'planning', 'confirmed', 'completed', 'cancelled');
CREATE TYPE plan_date_type AS ENUM ('fullday', 'timeslots');
CREATE TYPE participant_role AS ENUM ('organizer', 'co_planner', 'participant');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined');

-- ============================================================================
-- MAIN TABLES
-- ============================================================================

-- Plans table
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trip_id INTEGER REFERENCES ausfluege(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status plan_status NOT NULL DEFAULT 'idea',
  date_type plan_date_type NOT NULL DEFAULT 'fullday',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  meeting_point TEXT,
  meeting_point_lat DOUBLE PRECISION,
  meeting_point_lng DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plan participants
CREATE TABLE plan_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  email TEXT,
  role participant_role NOT NULL DEFAULT 'participant',
  adults_count INTEGER NOT NULL DEFAULT 1,
  children_count INTEGER NOT NULL DEFAULT 0,
  invitation_status invitation_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT participant_user_or_email CHECK (user_id IS NOT NULL OR email IS NOT NULL)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_plans_creator ON plans(creator_id);
CREATE INDEX idx_plans_status ON plans(status);
CREATE INDEX idx_plans_start_date ON plans(start_date);
CREATE INDEX idx_participants_plan ON plan_participants(plan_id);
CREATE INDEX idx_participants_user ON plan_participants(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_participants ENABLE ROW LEVEL SECURITY;

-- Simple RLS: Users can see their own plans
CREATE POLICY "Users can view their plans"
  ON plans FOR SELECT
  USING (auth.uid()::text IN (SELECT open_id FROM users WHERE id = creator_id));

CREATE POLICY "Users can create plans"
  ON plans FOR INSERT
  WITH CHECK (auth.uid()::text IN (SELECT open_id FROM users WHERE id = creator_id));

CREATE POLICY "Users can update their plans"
  ON plans FOR UPDATE
  USING (auth.uid()::text IN (SELECT open_id FROM users WHERE id = creator_id));

CREATE POLICY "Users can delete their plans"
  ON plans FOR DELETE
  USING (auth.uid()::text IN (SELECT open_id FROM users WHERE id = creator_id));

-- Participants: Visible to plan members
CREATE POLICY "View plan participants"
  ON plan_participants FOR SELECT
  USING (
    plan_id IN (SELECT id FROM plans WHERE creator_id IN (SELECT id FROM users WHERE open_id = auth.uid()::text))
  );

CREATE POLICY "Add participants to own plans"
  ON plan_participants FOR INSERT
  WITH CHECK (
    plan_id IN (SELECT id FROM plans WHERE creator_id IN (SELECT id FROM users WHERE open_id = auth.uid()::text))
  );
