-- Migration: Add bookings table
-- Description: Stores all bookings (accommodations will reference this, plus activities, restaurants)

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'accommodation', 'activity', 'restaurant', 'event', 'other'
  name VARCHAR(255) NOT NULL,
  booking_reference VARCHAR(100),
  date DATE,
  time TIME,
  location VARCHAR(255),
  address TEXT,
  cost DECIMAL(10, 2),
  confirmation_file_path TEXT, -- Path in Supabase Storage
  confirmation_url TEXT, -- External URL to booking confirmation
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_bookings_plan_id ON bookings(plan_id);
CREATE INDEX idx_bookings_type ON bookings(plan_id, type);
CREATE INDEX idx_bookings_date ON bookings(plan_id, date);

-- RLS Policies
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
ON bookings FOR SELECT
USING (
  plan_id IN (
    SELECT id FROM plans WHERE creator_id IN (
      SELECT id FROM users WHERE open_id = auth.uid()::text
    )
  )
);

CREATE POLICY "Users can insert bookings"
ON bookings FOR INSERT
WITH CHECK (
  plan_id IN (
    SELECT id FROM plans WHERE creator_id IN (
      SELECT id FROM users WHERE open_id = auth.uid()::text
    )
  )
);

CREATE POLICY "Users can update bookings"
ON bookings FOR UPDATE
USING (
  plan_id IN (
    SELECT id FROM plans WHERE creator_id IN (
      SELECT id FROM users WHERE open_id = auth.uid()::text
    )
  )
);

CREATE POLICY "Users can delete bookings"
ON bookings FOR DELETE
USING (
  plan_id IN (
    SELECT id FROM plans WHERE creator_id IN (
      SELECT id FROM users WHERE open_id = auth.uid()::text
    )
  )
);

-- Trigger to update updated_at
CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
