-- Migration: Add due_date and assigned_to to plan_tasks
-- Description: Enhance tasks with due dates and assignment capabilities
-- NOTE: This migration requires plan_tasks table to exist. Run ALL previous migrations first!

-- Check if plan_tasks exists, if not skip (user needs to run previous migrations first)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'plan_tasks') THEN
        -- Add columns if they don't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'plan_tasks' AND column_name = 'due_date') THEN
            ALTER TABLE plan_tasks ADD COLUMN due_date DATE;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'plan_tasks' AND column_name = 'assigned_to') THEN
            ALTER TABLE plan_tasks ADD COLUMN assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL;
        END IF;
        
        -- Create indexes if they don't exist
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_plan_tasks_due_date') THEN
            CREATE INDEX idx_plan_tasks_due_date ON plan_tasks(due_date);
        END IF;
        
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_plan_tasks_assigned_to') THEN
            CREATE INDEX idx_plan_tasks_assigned_to ON plan_tasks(assigned_to);
        END IF;
    ELSE
        RAISE NOTICE 'Table plan_tasks does not exist. Please run the base planning migrations first (create_plan_details.sql or 20250123_*.sql)';
    END IF;
END $$;
