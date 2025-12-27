-- Create plan_bookings table

CREATE TABLE plan_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- accommodation, activity, restaurant, event, other
    name TEXT NOT NULL,
    booking_reference TEXT,
    date DATE NOT NULL,
    time TEXT,
    location TEXT,
    address TEXT,
    cost NUMERIC(10, 2),
    confirmation_file_path TEXT,
    confirmation_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_plan_bookings_plan ON plan_bookings(plan_id);
CREATE INDEX idx_plan_bookings_date ON plan_bookings(date);

-- Enable RLS
ALTER TABLE plan_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view bookings for their plans"
    ON plan_bookings FOR SELECT
    USING (
        plan_id IN (
            SELECT id FROM plans 
            WHERE creator_id IN (
                SELECT id FROM users WHERE open_id = auth.uid()::text
            )
        )
    );

CREATE POLICY "Users can add bookings to their plans"
    ON plan_bookings FOR INSERT
    WITH CHECK (
        plan_id IN (
            SELECT id FROM plans 
            WHERE creator_id IN (
                SELECT id FROM users WHERE open_id = auth.uid()::text
            )
        )
    );

CREATE POLICY "Users can update bookings in their plans"
    ON plan_bookings FOR UPDATE
    USING (
        plan_id IN (
            SELECT id FROM plans 
            WHERE creator_id IN (
                SELECT id FROM users WHERE open_id = auth.uid()::text
            )
        )
    );

CREATE POLICY "Users can delete bookings from their plans"
    ON plan_bookings FOR DELETE
    USING (
        plan_id IN (
            SELECT id FROM plans 
            WHERE creator_id IN (
                SELECT id FROM users WHERE open_id = auth.uid()::text
            )
        )
    );

-- Add comment
COMMENT ON TABLE plan_bookings IS 'Bookings for accommodations, activities, restaurants, and events';
