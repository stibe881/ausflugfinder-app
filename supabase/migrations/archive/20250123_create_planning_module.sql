-- Planning Module Database Schema (Enhanced for multi-trip support)

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

-- Plans table (simplified - no single trip_id)
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status plan_status NOT NULL DEFAULT 'idea',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plan trips - links plans to one or more trips with individual dates
CREATE TABLE plan_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  trip_id INTEGER REFERENCES ausfluege(id) ON DELETE CASCADE,
  custom_location TEXT,
  planned_date TIMESTAMP WITH TIME ZONE NOT NULL,
  sequence INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT trip_or_custom_location CHECK (trip_id IS NOT NULL OR custom_location IS NOT NULL)
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
CREATE INDEX idx_plan_trips_plan ON plan_trips(plan_id);
CREATE INDEX idx_plan_trips_trip ON plan_trips(trip_id);
CREATE INDEX idx_plan_trips_date ON plan_trips(planned_date);
CREATE INDEX idx_participants_plan ON plan_participants(plan_id);
CREATE INDEX idx_participants_user ON plan_participants(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_participants ENABLE ROW LEVEL SECURITY;

-- Plans: Simple RLS - users can see their own plans
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

-- Plan trips: Visible to plan members
CREATE POLICY "View plan trips"
  ON plan_trips FOR SELECT
  USING (
    plan_id IN (SELECT id FROM plans WHERE creator_id IN (SELECT id FROM users WHERE open_id = auth.uid()::text))
  );

CREATE POLICY "Add trips to own plans"
  ON plan_trips FOR INSERT
  WITH CHECK (
    plan_id IN (SELECT id FROM plans WHERE creator_id IN (SELECT id FROM users WHERE open_id = auth.uid()::text))
  );

CREATE POLICY "Update trips in own plans"
  ON plan_trips FOR UPDATE
  USING (
    plan_id IN (SELECT id FROM plans WHERE creator_id IN (SELECT id FROM users WHERE open_id = auth.uid()::text))
  );

CREATE POLICY "Delete trips from own plans"
  ON plan_trips FOR DELETE
  USING (
    plan_id IN (SELECT id FROM plans WHERE creator_id IN (SELECT id FROM users WHERE open_id = auth.uid()::text))
  );

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
