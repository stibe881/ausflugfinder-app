-- Create trip_vouchers table for Gutschein app integration
CREATE TABLE IF NOT EXISTS trip_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  trip_id INTEGER NOT NULL REFERENCES ausfluege(id) ON DELETE CASCADE,
  voucher_code TEXT NOT NULL,
  voucher_title TEXT NOT NULL,
  deep_link TEXT NOT NULL,
  external_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_trip_vouchers_trip_id ON trip_vouchers(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_vouchers_user_email ON trip_vouchers(user_email);
CREATE INDEX IF NOT EXISTS idx_trip_vouchers_external_id ON trip_vouchers(external_id);

-- Enable Row Level Security
ALTER TABLE trip_vouchers ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can view vouchers for their trips" ON trip_vouchers;

-- Allow users to read vouchers for their trips
CREATE POLICY "Users can view vouchers for their trips"
  ON trip_vouchers
  FOR SELECT
  USING (
    user_email = auth.jwt() ->> 'email'
    OR
    trip_id IN (
      SELECT trip_id 
      FROM user_trips 
      WHERE user_id = (
        SELECT id FROM users WHERE open_id = auth.uid()::text
      )
    )
  );

-- Allow Edge Function to manage vouchers (using service role)
-- Edge Functions will use service role key for insert/delete operations
