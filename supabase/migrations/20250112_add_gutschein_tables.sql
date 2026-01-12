-- Migration: Add Gutschein tables to Ausflugfinder database
-- This replaces the separate Gutschein Supabase database with tables in the main Ausflugfinder DB

-- Clean up old tables if migration was partially run before
DROP TABLE IF EXISTS einloesungen CASCADE;
DROP TABLE IF EXISTS gutscheine CASCADE;
DROP TABLE IF EXISTS trip_vouchers CASCADE;

-- ==================== GUTSCHEINE TABLE ====================

CREATE TABLE gutscheine (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Info
  titel TEXT NOT NULL,
  beschreibung TEXT,
  
  -- Type
  typ TEXT NOT NULL CHECK (typ IN ('wert', 'anzahl')),
  
  -- For value-based vouchers (typ = 'wert')
  original_wert DECIMAL(10,2),
  aktueller_wert DECIMAL(10,2),
  waehrung TEXT DEFAULT 'CHF',
  
  -- For quantity-based vouchers (typ = 'anzahl')
  original_anzahl INTEGER,
  aktuelle_anzahl INTEGER,
  anzahl_einheit TEXT,
  
  -- Validity
  gueltig_ab TIMESTAMP WITH TIME ZONE,
  gueltig_bis TIMESTAMP WITH TIME ZONE,
  ist_eingeloest BOOLEAN DEFAULT FALSE,
  eingeloest_am TIMESTAMP WITH TIME ZONE,
  
  -- Details
  code TEXT,
  pin TEXT,
  anbieter TEXT,
  kategorie TEXT,
  bild_url TEXT,
  notizen TEXT,
  
  -- Link to Ausflug (direct foreign key - no separate table needed!)
  ausflug_id INTEGER REFERENCES ausfluege(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gutscheine_user_id ON gutscheine(user_id);
CREATE INDEX IF NOT EXISTS idx_gutscheine_ausflug_id ON gutscheine(ausflug_id);
CREATE INDEX IF NOT EXISTS idx_gutscheine_ist_eingeloest ON gutscheine(ist_eingeloest) WHERE ist_eingeloest = FALSE;

-- ==================== EINLOESUNGEN TABLE ====================

CREATE TABLE einloesungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gutschein_id UUID NOT NULL REFERENCES gutscheine(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Redemption amounts
  betrag DECIMAL(10,2),  -- For value vouchers
  anzahl INTEGER,         -- For quantity vouchers
  notiz TEXT,
  
  -- Metadata
  eingeloest_am TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_einloesungen_gutschein_id ON einloesungen(gutschein_id);
CREATE INDEX IF NOT EXISTS idx_einloesungen_user_id ON einloesungen(user_id);

-- ==================== ROW LEVEL SECURITY ====================

-- Enable RLS
ALTER TABLE gutscheine ENABLE ROW LEVEL SECURITY;
ALTER TABLE einloesungen ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own gutscheine" ON gutscheine;
DROP POLICY IF EXISTS "Users can insert own gutscheine" ON gutscheine;
DROP POLICY IF EXISTS "Users can update own gutscheine" ON gutscheine;
DROP POLICY IF EXISTS "Users can delete own gutscheine" ON gutscheine;
DROP POLICY IF EXISTS "Users can view own einloesungen" ON einloesungen;
DROP POLICY IF EXISTS "Users can insert own einloesungen" ON einloesungen;

-- Gutscheine RLS Policies
CREATE POLICY "Users can view own gutscheine"
  ON gutscheine FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own gutscheine"
  ON gutscheine FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own gutscheine"
  ON gutscheine FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own gutscheine"
  ON gutscheine FOR DELETE
  USING (user_id = auth.uid());

-- Einloesungen RLS Policies  
CREATE POLICY "Users can view own einloesungen"
  ON einloesungen FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own einloesungen"
  ON einloesungen FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ==================== TRIGGERS ====================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_gutscheine_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_gutscheine_updated_at_trigger ON gutscheine;
CREATE TRIGGER update_gutscheine_updated_at_trigger
  BEFORE UPDATE ON gutscheine
  FOR EACH ROW
  EXECUTE FUNCTION update_gutscheine_updated_at();

-- ==================== FAMILY MANAGEMENT TABLES ====================

-- Families table
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Family members table
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(family_id, user_id)
);

-- Family invites table
CREATE TABLE family_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')),
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Indexes for families
CREATE INDEX IF NOT EXISTS idx_families_created_by ON families(created_by);
CREATE INDEX IF NOT EXISTS idx_family_members_family_id ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_invites_family_id ON family_invites(family_id);
CREATE INDEX IF NOT EXISTS idx_family_invites_email ON family_invites(email);
CREATE INDEX IF NOT EXISTS idx_family_invites_token ON family_invites(token);

-- RLS for families
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view families they belong to" ON families;
DROP POLICY IF EXISTS "Users can create families" ON families;
DROP POLICY IF EXISTS "Family owners can update" ON families;
DROP POLICY IF EXISTS "Family owners can delete" ON families;

CREATE POLICY "Users can view families they belong to"
  ON families FOR SELECT
  USING (id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can create families"
  ON families FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Family owners can update"
  ON families FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Family owners can delete"
  ON families FOR DELETE
  USING (created_by = auth.uid());

-- RLS for family_members
DROP POLICY IF EXISTS "Users can view members of their families" ON family_members;
DROP POLICY IF EXISTS "Users can insert own membership" ON family_members;
DROP POLICY IF EXISTS "Family owners can add members" ON family_members;
DROP POLICY IF EXISTS "Family owners can remove members" ON family_members;

-- Allow users to see all family_members (filtered by families they can see)
CREATE POLICY "Users can view all family members"
  ON family_members FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert their own membership when accepting invites
CREATE POLICY "Users can insert own membership"
  ON family_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Family owners can add members
CREATE POLICY "Family owners can add members"
  ON family_members FOR INSERT
  WITH CHECK (family_id IN (SELECT id FROM families WHERE created_by = auth.uid()));

-- Family owners can remove members
CREATE POLICY "Family owners can remove members"
  ON family_members FOR DELETE
  USING (family_id IN (SELECT id FROM families WHERE created_by = auth.uid()));

-- RLS for family_invites
DROP POLICY IF EXISTS "Users can view their own invites" ON family_invites;
DROP POLICY IF EXISTS "Family owners can view invites" ON family_invites;
DROP POLICY IF EXISTS "Family owners can create invites" ON family_invites;
DROP POLICY IF EXISTS "Family owners can delete invites" ON family_invites;
DROP POLICY IF EXISTS "Users can update their own invite status" ON family_invites;

CREATE POLICY "Users can view their own invites"
  ON family_invites FOR SELECT
  USING (email = auth.jwt() ->> 'email');

CREATE POLICY "Family owners can view invites"
  ON family_invites FOR SELECT
  USING (family_id IN (SELECT id FROM families WHERE created_by = auth.uid()));

CREATE POLICY "Family owners can create invites"
  ON family_invites FOR INSERT
  WITH CHECK (family_id IN (SELECT id FROM families WHERE created_by = auth.uid()));

CREATE POLICY "Family owners can delete invites"
  ON family_invites FOR DELETE
  USING (family_id IN (SELECT id FROM families WHERE created_by = auth.uid()));
  
CREATE POLICY "Users can update their own invite status"
  ON family_invites FOR UPDATE
  USING (email = auth.jwt() ->> 'email');

-- Add family_id to gutscheine table (for family sharing)
ALTER TABLE gutscheine ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES families(id) ON DELETE SET NULL;
ALTER TABLE gutscheine ADD COLUMN IF NOT EXISTS shared_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX IF NOT EXISTS idx_gutscheine_family_id ON gutscheine(family_id);

-- Trigger to auto-update families updated_at
CREATE OR REPLACE FUNCTION update_families_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_families_updated_at_trigger ON families;
CREATE TRIGGER update_families_updated_at_trigger
  BEFORE UPDATE ON families
  FOR EACH ROW
  EXECUTE FUNCTION update_families_updated_at();

-- ==================== CLEANUP ====================

-- NOTE: Storage bucket 'gutschein-bilder' should be created manually in Supabase Dashboard
-- with public read access for voucher images
