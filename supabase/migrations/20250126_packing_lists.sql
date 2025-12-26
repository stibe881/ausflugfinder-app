-- Migration: Add packing_lists table
-- Description: Stores packing list items for plans with categories and packed status

CREATE TABLE IF NOT EXISTS packing_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL, -- 'clothing', 'documents', 'toiletries', 'electronics', 'medication', 'other'
  item_name VARCHAR(255) NOT NULL,
  quantity INT DEFAULT 1,
  is_packed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_packing_lists_plan_id ON packing_lists(plan_id);
CREATE INDEX idx_packing_lists_category ON packing_lists(plan_id, category);

-- RLS Policies
ALTER TABLE packing_lists ENABLE ROW LEVEL SECURITY;

-- Users can view packing lists for their own plans
CREATE POLICY "Users can view own packing lists"
ON packing_lists FOR SELECT
USING (
  plan_id IN (
    SELECT id FROM plans WHERE creator_id IN (
      SELECT id FROM users WHERE open_id = auth.uid()::text
    )
  )
);

-- Users can insert packing items for their own plans
CREATE POLICY "Users can insert packing items"
ON packing_lists FOR INSERT
WITH CHECK (
  plan_id IN (
    SELECT id FROM plans WHERE creator_id IN (
      SELECT id FROM users WHERE open_id = auth.uid()::text
    )
  )
);

-- Users can update their own packing items
CREATE POLICY "Users can update packing items"
ON packing_lists FOR UPDATE
USING (
  plan_id IN (
    SELECT id FROM plans WHERE creator_id IN (
      SELECT id FROM users WHERE open_id = auth.uid()::text
    )
  )
);

-- Users can delete their own packing items
CREATE POLICY "Users can delete packing items"
ON packing_lists FOR DELETE
USING (
  plan_id IN (
    SELECT id FROM plans WHERE creator_id IN (
      SELECT id FROM users WHERE open_id = auth.uid()::text
    )
  )
);

-- Trigger to update updated_at
CREATE TRIGGER update_packing_lists_updated_at
BEFORE UPDATE ON packing_lists
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
