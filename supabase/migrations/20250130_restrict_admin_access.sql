-- Add is_admin column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Reset all users to non-admin
UPDATE users SET is_admin = false;

-- Set specific user as admin
UPDATE users 
SET is_admin = true 
WHERE email = 'stefan.gross@hotmail.ch';

-- Create policy function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid()::integer 
    AND is_admin = true
  );
-- Fallback for if auth.uid() is not mapped to integer id yet or using uuid lookup
EXCEPTION WHEN OTHERS THEN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE open_id = auth.uid()::text 
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Update RLS policies for ausfluege table
ALTER TABLE ausfluege ENABLE ROW LEVEL SECURITY;

-- 1. Everyone can view
DROP POLICY IF EXISTS "Anyone can view ausfluege" ON ausfluege;
CREATE POLICY "Anyone can view ausfluege" ON ausfluege
    FOR SELECT USING (true);

-- 2. Only admins can insert
DROP POLICY IF EXISTS "Authenticated users can insert ausfluege" ON ausfluege;
DROP POLICY IF EXISTS "Admins can insert ausfluege" ON ausfluege;
CREATE POLICY "Admins can insert ausfluege" ON ausfluege
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE open_id = auth.uid()::text 
            AND is_admin = true
        )
    );

-- 3. Only admins can update
DROP POLICY IF EXISTS "Authenticated users can update ausfluege" ON ausfluege;
DROP POLICY IF EXISTS "Admins can update ausfluege" ON ausfluege;
CREATE POLICY "Admins can update ausfluege" ON ausfluege
    FOR UPDATE
    USING (
         EXISTS (
            SELECT 1 FROM users 
            WHERE open_id = auth.uid()::text 
            AND is_admin = true
        )
    );

-- 4. Only admins can delete
DROP POLICY IF EXISTS "Authenticated users can delete ausfluege" ON ausfluege;
DROP POLICY IF EXISTS "Admins can delete ausfluege" ON ausfluege;
CREATE POLICY "Admins can delete ausfluege" ON ausfluege
    FOR DELETE
    USING (
         EXISTS (
            SELECT 1 FROM users 
            WHERE open_id = auth.uid()::text 
            AND is_admin = true
        )
    );
