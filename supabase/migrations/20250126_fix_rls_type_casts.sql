-- QUICK FIX for Type Mismatch Errors in RLS Policies
-- Run this AFTER the other migrations if you get "operator does not exist: character varying = uuid" errors

-- This fixes potential type mismatches in the RLS policies

-- Drop and recreate packing_lists policies with proper casts
DROP POLICY IF EXISTS "Users can view own packing lists" ON packing_lists;
DROP POLICY IF EXISTS "Users can insert packing items" ON packing_lists;
DROP POLICY IF EXISTS "Users can update packing items" ON packing_lists;
DROP POLICY IF EXISTS "Users can delete packing items" ON packing_lists;

CREATE POLICY "Users can view own packing lists"
ON packing_lists FOR SELECT
USING (
  plan_id::text IN (
    SELECT id::text FROM plans WHERE creator_id IN (
      SELECT id FROM users WHERE open_id = auth.uid()::text
    )
  )
);

CREATE POLICY "Users can insert packing items"
ON packing_lists FOR INSERT
WITH CHECK (
  plan_id::text IN (
    SELECT id::text FROM plans WHERE creator_id IN (
      SELECT id FROM users WHERE open_id = auth.uid()::text
    )
  )
);

CREATE POLICY "Users can update packing items"
ON packing_lists FOR UPDATE
USING (
  plan_id::text IN (
    SELECT id::text FROM plans WHERE creator_id IN (
      SELECT id FROM users WHERE open_id = auth.uid()::text
    )
  )
);

CREATE POLICY "Users can delete packing items"
ON packing_lists FOR DELETE
USING (
  plan_id::text IN (
    SELECT id::text FROM plans WHERE creator_id IN (
      SELECT id FROM users WHERE open_id = auth.uid()::text
    )
  )
);

-- Same for tickets
DROP POLICY IF EXISTS "Users can view own tickets" ON tickets;
DROP POLICY IF EXISTS "Users can insert tickets" ON tickets;
DROP POLICY IF EXISTS "Users can update tickets" ON tickets;
DROP POLICY IF EXISTS "Users can delete tickets" ON tickets;

CREATE POLICY "Users can view own tickets"
ON tickets FOR SELECT
USING (
  plan_id::text IN (
    SELECT id::text FROM plans WHERE creator_id IN (
      SELECT id FROM users WHERE open_id = auth.uid()::text
    )
  )
);

CREATE POLICY "Users can insert tickets"
ON tickets FOR INSERT
WITH CHECK (
  plan_id::text IN (
    SELECT id::text FROM plans WHERE creator_id IN (
      SELECT id FROM users WHERE open_id = auth.uid()::text
    )
  )
);

CREATE POLICY "Users can update tickets"
ON tickets FOR UPDATE
USING (
  plan_id::text IN (
    SELECT id::text FROM plans WHERE creator_id IN (
      SELECT id FROM users WHERE open_id = auth.uid()::text
    )
  )
);

CREATE POLICY "Users can delete tickets"
ON tickets FOR DELETE
USING (
  plan_id::text IN (
    SELECT id::text FROM plans WHERE creator_id IN (
      SELECT id FROM users WHERE open_id = auth.uid()::text
    )
  )
);

-- Same for bookings
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can insert bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update bookings" ON bookings;
DROP POLICY IF EXISTS "Users can delete bookings" ON bookings;

CREATE POLICY "Users can view own bookings"
ON bookings FOR SELECT
USING (
  plan_id::text IN (
    SELECT id::text FROM plans WHERE creator_id IN (
      SELECT id FROM users WHERE open_id = auth.uid()::text
    )
  )
);

CREATE POLICY "Users can insert bookings"
ON bookings FOR INSERT
WITH CHECK (
  plan_id::text IN (
    SELECT id::text FROM plans WHERE creator_id IN (
      SELECT id FROM users WHERE open_id = auth.uid()::text
    )
  )
);

CREATE POLICY "Users can update bookings"
ON bookings FOR UPDATE
USING (
  plan_id::text IN (
    SELECT id::text FROM plans WHERE creator_id IN (
      SELECT id FROM users WHERE open_id = auth.uid()::text
    )
  )
);

CREATE POLICY "Users can delete bookings"
ON bookings FOR DELETE
USING (
  plan_id::text IN (
    SELECT id::text FROM plans WHERE creator_id IN (
      SELECT id FROM users WHERE open_id = auth.uid()::text
    )
  )
);
