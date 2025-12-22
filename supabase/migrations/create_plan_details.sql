-- Create day_plan_activities table
CREATE TABLE IF NOT EXISTS day_plan_activities (
  id SERIAL PRIMARY KEY,
  plan_id INTEGER NOT NULL REFERENCES day_plans(id) ON DELETE CASCADE,
  ausflug_id INTEGER NOT NULL REFERENCES ausfluege(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  scheduled_time TIME,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(plan_id, ausflug_id)
);

CREATE INDEX IF NOT EXISTS idx_plan_activities_plan ON day_plan_activities(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_activities_ausflug ON day_plan_activities(ausflug_id);

-- Create day_plan_checklist table
CREATE TABLE IF NOT EXISTS day_plan_checklist (
  id SERIAL PRIMARY KEY,
  plan_id INTEGER NOT NULL REFERENCES day_plans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_done BOOLEAN DEFAULT FALSE,
  category TEXT DEFAULT 'general',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plan_checklist_plan ON day_plan_checklist(plan_id);

-- Add notes and cover_image_url to day_plans table
ALTER TABLE day_plans ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE day_plans ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Enable RLS on new tables
ALTER TABLE day_plan_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_plan_checklist ENABLE ROW LEVEL SECURITY;

-- RLS Policies for day_plan_activities
DROP POLICY IF EXISTS "Users can view own plan activities" ON day_plan_activities;
CREATE POLICY "Users can view own plan activities"
  ON day_plan_activities FOR SELECT
  USING (plan_id IN (
    SELECT id FROM day_plans WHERE user_id = (
      SELECT id FROM users WHERE open_id = auth.uid()::text
    )
  ));

DROP POLICY IF EXISTS "Users can insert own plan activities" ON day_plan_activities;
CREATE POLICY "Users can insert own plan activities"
  ON day_plan_activities FOR INSERT
  WITH CHECK (plan_id IN (
    SELECT id FROM day_plans WHERE user_id = (
      SELECT id FROM users WHERE open_id = auth.uid()::text
    )
  ));

DROP POLICY IF EXISTS "Users can update own plan activities" ON day_plan_activities;
CREATE POLICY "Users can update own plan activities"
  ON day_plan_activities FOR UPDATE
  USING (plan_id IN (
    SELECT id FROM day_plans WHERE user_id = (
      SELECT id FROM users WHERE open_id = auth.uid()::text
    )
  ));

DROP POLICY IF EXISTS "Users can delete own plan activities" ON day_plan_activities;
CREATE POLICY "Users can delete own plan activities"
  ON day_plan_activities FOR DELETE
  USING (plan_id IN (
    SELECT id FROM day_plans WHERE user_id = (
      SELECT id FROM users WHERE open_id = auth.uid()::text
    )
  ));

-- RLS Policies for day_plan_checklist
DROP POLICY IF EXISTS "Users can view own plan checklist" ON day_plan_checklist;
CREATE POLICY "Users can view own plan checklist"
  ON day_plan_checklist FOR SELECT
  USING (plan_id IN (
    SELECT id FROM day_plans WHERE user_id = (
      SELECT id FROM users WHERE open_id = auth.uid()::text
    )
  ));

DROP POLICY IF EXISTS "Users can insert own plan checklist" ON day_plan_checklist;
CREATE POLICY "Users can insert own plan checklist"
  ON day_plan_checklist FOR INSERT
  WITH CHECK (plan_id IN (
    SELECT id FROM day_plans WHERE user_id = (
      SELECT id FROM users WHERE open_id = auth.uid()::text
    )
  ));

DROP POLICY IF EXISTS "Users can update own plan checklist" ON day_plan_checklist;
CREATE POLICY "Users can update own plan checklist"
  ON day_plan_checklist FOR UPDATE
  USING (plan_id IN (
    SELECT id FROM day_plans WHERE user_id = (
      SELECT id FROM users WHERE open_id = auth.uid()::text
    )
  ));

DROP POLICY IF EXISTS "Users can delete own plan checklist" ON day_plan_checklist;
CREATE POLICY "Users can delete own plan checklist"
  ON day_plan_checklist FOR DELETE
  USING (plan_id IN (
    SELECT id FROM day_plans WHERE user_id = (
      SELECT id FROM users WHERE open_id = auth.uid()::text
    )
  ));

-- Update trigger for day_plan_checklist
DROP TRIGGER IF EXISTS update_day_plan_checklist_updated_at ON day_plan_checklist;
CREATE TRIGGER update_day_plan_checklist_updated_at
  BEFORE UPDATE ON day_plan_checklist
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
