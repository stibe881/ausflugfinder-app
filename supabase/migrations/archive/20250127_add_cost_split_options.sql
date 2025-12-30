-- Add split options to plan_costs table

-- Add split_type enum
CREATE TYPE cost_split_type AS ENUM ('all', 'adults_only', 'specific');

-- Add columns to plan_costs
ALTER TABLE plan_costs
ADD COLUMN split_type cost_split_type DEFAULT 'all',
ADD COLUMN split_participant_ids TEXT[]; -- Array of participant IDs for 'specific' split

-- Add comments
COMMENT ON COLUMN plan_costs.split_type IS 'How the cost should be split: all (everyone), adults_only, or specific (selected participants)';
COMMENT ON COLUMN plan_costs.split_participant_ids IS 'Array of participant IDs when split_type is specific';
