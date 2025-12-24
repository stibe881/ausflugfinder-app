-- Multi-Day Trip Planning: Accommodation Support
-- Extends plan_trips to support accommodations between days

-- Add is_accommodation flag and accommodation-specific fields to plan_trips
ALTER TABLE plan_trips
  ADD COLUMN IF NOT EXISTS is_accommodation BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS accommodation_name TEXT,
  ADD COLUMN IF NOT EXISTS accommodation_address TEXT,
  ADD COLUMN IF NOT EXISTS accommodation_link TEXT,
  ADD COLUMN IF NOT EXISTS accommodation_check_in_date DATE,
  ADD COLUMN IF NOT EXISTS accommodation_check_out_date DATE,
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Create index for efficient day grouping
CREATE INDEX IF NOT EXISTS idx_plan_trips_planned_date ON plan_trips(plan_id, planned_date);

-- Create index for accommodation filtering
CREATE INDEX IF NOT EXISTS idx_plan_trips_accommodation ON plan_trips(plan_id, is_accommodation);

-- Add updated_at trigger for plan_trips if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_plan_trips_updated_at ON plan_trips;
CREATE TRIGGER update_plan_trips_updated_at
    BEFORE UPDATE ON plan_trips
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create table for caching Google Maps distance results
CREATE TABLE IF NOT EXISTS distance_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  origin_lat DOUBLE PRECISION NOT NULL,
  origin_lng DOUBLE PRECISION NOT NULL,
  dest_lat DOUBLE PRECISION NOT NULL,
  dest_lng DOUBLE PRECISION NOT NULL,
  distance_text TEXT NOT NULL,
  distance_meters INTEGER NOT NULL,
  duration_text TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- Create composite index for distance cache lookups
CREATE INDEX IF NOT EXISTS idx_distance_cache_coords 
  ON distance_cache(origin_lat, origin_lng, dest_lat, dest_lng);

-- Create index for expiration cleanup
CREATE INDEX IF NOT EXISTS idx_distance_cache_expires 
  ON distance_cache(expires_at);

-- RLS policies for distance_cache (everyone can read, only authenticated can write)
ALTER TABLE distance_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read distance cache"
  ON distance_cache FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert distance cache"
  ON distance_cache FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to auto-cleanup expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_distance_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM distance_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Create a scheduled job to cleanup cache (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-distance-cache', '0 2 * * *', 'SELECT cleanup_expired_distance_cache();');
