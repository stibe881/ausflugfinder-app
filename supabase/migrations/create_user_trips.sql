-- Create user_trips table
CREATE TABLE IF NOT EXISTS user_trips (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trip_id INTEGER NOT NULL REFERENCES ausfluege(id) ON DELETE CASCADE,
  is_favorite BOOLEAN DEFAULT FALSE,
  is_done BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, trip_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_trips_user_id ON user_trips(user_id);
CREATE INDEX IF NOT EXISTS idx_user_trips_favorites ON user_trips(user_id, is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_trips_done ON user_trips(user_id, is_done) WHERE is_done = TRUE;

-- Enable RLS
ALTER TABLE user_trips ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own trips" ON user_trips;
DROP POLICY IF EXISTS "Users can insert own trips" ON user_trips;
DROP POLICY IF EXISTS "Users can update own trips" ON user_trips;
DROP POLICY IF EXISTS "Users can delete own trips" ON user_trips;

-- Users can view their own trips (fixed: cast auth.uid() to text)
CREATE POLICY "Users can view own trips"
  ON user_trips FOR SELECT
  USING (user_id = (
    SELECT id FROM users WHERE open_id = auth.uid()::text
  ));

-- Users can insert their own trips
CREATE POLICY "Users can insert own trips"
  ON user_trips FOR INSERT
  WITH CHECK (user_id = (
    SELECT id FROM users WHERE open_id = auth.uid()::text
  ));

-- Users can update their own trips
CREATE POLICY "Users can update own trips"
  ON user_trips FOR UPDATE
  USING (user_id = (
    SELECT id FROM users WHERE open_id = auth.uid()::text
  ));

-- Users can delete their own trips
CREATE POLICY "Users can delete own trips"
  ON user_trips FOR DELETE
  USING (user_id = (
    SELECT id FROM users WHERE open_id = auth.uid()::text
  ));

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_trips_updated_at ON user_trips;
CREATE TRIGGER update_user_trips_updated_at
  BEFORE UPDATE ON user_trips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
