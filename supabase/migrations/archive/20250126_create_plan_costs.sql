-- Create plan_costs table

CREATE TABLE plan_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_plan_costs_plan ON plan_costs(plan_id);
CREATE INDEX idx_plan_costs_category ON plan_costs(category);

-- Enable RLS
ALTER TABLE plan_costs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view costs for their plans"
    ON plan_costs FOR SELECT
    USING (
        plan_id IN (
            SELECT id FROM plans 
            WHERE creator_id IN (
                SELECT id FROM users WHERE open_id = auth.uid()::text
            )
        )
    );

CREATE POLICY "Users can add costs to their plans"
    ON plan_costs FOR INSERT
    WITH CHECK (
        plan_id IN (
            SELECT id FROM plans 
            WHERE creator_id IN (
                SELECT id FROM users WHERE open_id = auth.uid()::text
            )
        )
    );

CREATE POLICY "Users can update costs in their plans"
    ON plan_costs FOR UPDATE
    USING (
        plan_id IN (
            SELECT id FROM plans 
            WHERE creator_id IN (
                SELECT id FROM users WHERE open_id = auth.uid()::text
            )
        )
    );

CREATE POLICY "Users can delete costs from their plans"
    ON plan_costs FOR DELETE
    USING (
        plan_id IN (
            SELECT id FROM plans 
            WHERE creator_id IN (
                SELECT id FROM users WHERE open_id = auth.uid()::text
            )
        )
    );

-- Add comment
COMMENT ON TABLE plan_costs IS 'Costs/expenses for planning trips, supports budget tracking and splitting';
