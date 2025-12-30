-- Create notification_templates table for storing reusable push notification templates
CREATE TABLE IF NOT EXISTS notification_templates (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_system BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

-- Admins can view all templates
CREATE POLICY "Admins can view all templates"
  ON notification_templates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.open_id = auth.uid()::text
      AND users.role = 'admin'
    )
  );

-- Admins can create templates
CREATE POLICY "Admins can create templates"
  ON notification_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.open_id = auth.uid()::text
      AND users.role = 'admin'
    )
  );

-- Admins can update templates  
CREATE POLICY "Admins can update templates"
  ON notification_templates
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.open_id = auth.uid()::text
      AND users.role = 'admin'
    )
  );

-- Admins can delete non-system templates
CREATE POLICY "Admins can delete non-system templates"
  ON notification_templates
  FOR DELETE
  TO authenticated
  USING (
    is_system = false AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.open_id = auth.uid()::text
      AND users.role = 'admin'
    )
  );

-- Create index for faster queries
CREATE INDEX idx_notification_templates_created_by ON notification_templates(created_by);
CREATE INDEX idx_notification_templates_is_system ON notification_templates(is_system);

-- Insert some default system templates
INSERT INTO notification_templates (title, message, is_system) VALUES
('Neue Ausflugsziele', 'Wir haben neue spannende Ausflugsziele für dich hinzugefügt! Schau sie dir jetzt in der App an.', true),
('Wochenend-Tipp', 'Das Wetter wird am Wochenende super! Zeit für einen Ausflug - entdecke jetzt passende Ziele in deiner Nähe.', true),
('App-Update', 'Eine neue Version der AusflugFinder App ist verfügbar. Update jetzt für neue Features und Verbesserungen!', true),
('Event-Ankündigung', 'Spezielles Event: [Event-Name]. Markiere dir das Datum und verpasse nichts!', true);
