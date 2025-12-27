-- Add custom_address column to plan_trips table

ALTER TABLE plan_trips 
ADD COLUMN custom_address TEXT;

-- Add comment
COMMENT ON COLUMN plan_trips.custom_address IS 'Address for custom trips (used for route planning and maps)';
