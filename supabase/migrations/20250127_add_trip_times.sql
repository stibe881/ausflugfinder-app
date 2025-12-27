-- Add start and end time columns to plan_trips

ALTER TABLE plan_trips 
ADD COLUMN IF NOT EXISTS start_time TIME,
ADD COLUMN IF NOT EXISTS end_time TIME;

-- Add comments
COMMENT ON COLUMN plan_trips.start_time IS 'Start time for this trip (HH:MM format)';
COMMENT ON COLUMN plan_trips.end_time IS 'End time for this trip (HH:MM format)';

-- Add index for queries filtering by time
CREATE INDEX IF NOT EXISTS idx_plan_trips_start_time ON plan_trips(start_time);
