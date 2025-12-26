-- Migration: Add tickets table
-- Description: Stores transport tickets (flight, train, bus, ferry) with file uploads

CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'flight', 'train', 'bus', 'ferry', 'other'
  provider VARCHAR(255), -- Airline/Company name (e.g., 'Swiss', 'SBB')
  booking_reference VARCHAR(100),
  departure_location VARCHAR(255) NOT NULL,
  arrival_location VARCHAR(255) NOT NULL,
  departure_time TIMESTAMPTZ,
  arrival_time TIMESTAMPTZ,
  seat_number VARCHAR(50),
  ticket_file_path TEXT, -- Path in Supabase Storage
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_tickets_plan_id ON tickets(plan_id);
CREATE INDEX idx_tickets_departure_time ON tickets(plan_id, departure_time);

-- RLS Policies
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tickets"
ON tickets FOR SELECT
USING (
  plan_id IN (
    SELECT id FROM plans WHERE creator_id IN (
      SELECT id FROM users WHERE open_id = auth.uid()::text
    )
  )
);

CREATE POLICY "Users can insert tickets"
ON tickets FOR INSERT
WITH CHECK (
  plan_id IN (
    SELECT id FROM plans WHERE creator_id IN (
      SELECT id FROM users WHERE open_id = auth.uid()::text
    )
  )
);

CREATE POLICY "Users can update tickets"
ON tickets FOR UPDATE
USING (
  plan_id IN (
    SELECT id FROM plans WHERE creator_id IN (
      SELECT id FROM users WHERE open_id = auth.uid()::text
    )
  )
);

CREATE POLICY "Users can delete tickets"
ON tickets FOR DELETE
USING (
  plan_id IN (
    SELECT id FROM plans WHERE creator_id IN (
      SELECT id FROM users WHERE open_id = auth.uid()::text
    )
  )
);

-- Trigger to update updated_at
CREATE TRIGGER update_tickets_updated_at
BEFORE UPDATE ON tickets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
