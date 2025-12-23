-- Add timeline and schedule fields to plan_trips
ALTER TABLE plan_trips
  ADD COLUMN departure_time TIMESTAMPTZ,
  ADD COLUMN arrival_time TIMESTAMPTZ,
  ADD COLUMN notes TEXT,
  ADD COLUMN buffer_time_minutes INTEGER DEFAULT 0;

-- Create trip_activities table for activity scheduling
CREATE TABLE IF NOT EXISTS trip_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_trip_id UUID NOT NULL REFERENCES plan_trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  category TEXT, -- e.g., 'activity', 'meal', 'transport', 'break'
  sequence INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies for trip_activities
ALTER TABLE trip_activities ENABLE ROW LEVEL SECURITY;

-- Users can view activities for plans they have access to
CREATE POLICY "Users can view trip activities for accessible plans"
  ON trip_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM plan_trips pt
      JOIN plans p ON p.id = pt.plan_id
      JOIN plan_participants pp ON pp.plan_id = p.id
      WHERE pt.id = plan_trip_id
        AND (p.creator_id IN (SELECT id FROM users WHERE open_id = auth.uid()::text) OR pp.user_id = auth.uid())
    )
  );

-- Users can insert activities for their plans
CREATE POLICY "Users can insert trip activities for their plans"
  ON trip_activities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM plan_trips pt
      JOIN plans p ON p.id = pt.plan_id
      WHERE pt.id = plan_trip_id
        AND p.creator_id IN (SELECT id FROM users WHERE open_id = auth.uid()::text)
    )
  );

-- Users can update activities for their plans
CREATE POLICY "Users can update trip activities for their plans"
  ON trip_activities FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM plan_trips pt
      JOIN plans p ON p.id = pt.plan_id
      WHERE pt.id = plan_trip_id
        AND p.creator_id IN (SELECT id FROM users WHERE open_id = auth.uid()::text)
    )
  );

-- Users can delete activities for their plans
CREATE POLICY "Users can delete trip activities for their plans"
  ON trip_activities FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM plan_trips pt
      JOIN plans p ON p.id = pt.plan_id
      WHERE pt.id = plan_trip_id
        AND p.creator_id IN (SELECT id FROM users WHERE open_id = auth.uid()::text)
    )
  );

-- Create index for faster queries
CREATE INDEX idx_trip_activities_plan_trip_id ON trip_activities(plan_trip_id);
CREATE INDEX idx_trip_activities_start_time ON trip_activities(start_time);

-- Add updated_at trigger for trip_activities
CREATE TRIGGER update_trip_activities_updated_at
  BEFORE UPDATE ON trip_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
