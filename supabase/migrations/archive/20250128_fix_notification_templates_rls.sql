-- Fix notification_templates RLS policies to work with email-based admin system
-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all templates" ON notification_templates;
DROP POLICY IF EXISTS "Admins can create templates" ON notification_templates;
DROP POLICY IF EXISTS "Admins can update templates" ON notification_templates;
DROP POLICY IF EXISTS "Admins can delete non-system templates" ON notification_templates;

-- Create new policies based on email check instead of role
CREATE POLICY "Admins can view all templates"
  ON notification_templates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.open_id = auth.uid()::text
      AND users.email IN ('stefan.gross@hotmail.ch')
    )
  );

CREATE POLICY "Admins can create templates"
  ON notification_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.open_id = auth.uid()::text
      AND users.email IN ('stefan.gross@hotmail.ch')
    )
  );

CREATE POLICY "Admins can update templates"
  ON notification_templates
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.open_id = auth.uid()::text
      AND users.email IN ('stefan.gross@hotmail.ch')
    )
  );

CREATE POLICY "Admins can delete non-system templates"
  ON notification_templates
  FOR DELETE
  TO authenticated
  USING (
    is_system = false AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.open_id = auth.uid()::text
      AND users.email IN ('stefan.gross@hotmail.ch')
    )
  );
