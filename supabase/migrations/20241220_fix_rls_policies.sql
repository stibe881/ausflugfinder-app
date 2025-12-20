-- Fix RLS policies for ausfluege_fotos table
-- Run this in Supabase SQL Editor

-- First, check if RLS is enabled
ALTER TABLE ausfluege_fotos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view photos" ON ausfluege_fotos;
DROP POLICY IF EXISTS "Authenticated users can insert photos" ON ausfluege_fotos;
DROP POLICY IF EXISTS "Authenticated users can update photos" ON ausfluege_fotos;
DROP POLICY IF EXISTS "Authenticated users can delete photos" ON ausfluege_fotos;

-- Policy: Anyone can view photos (public)
CREATE POLICY "Anyone can view photos" ON ausfluege_fotos
    FOR SELECT
    USING (true);

-- Policy: Authenticated users can insert photos
CREATE POLICY "Authenticated users can insert photos" ON ausfluege_fotos
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Policy: Authenticated users can update photos
CREATE POLICY "Authenticated users can update photos" ON ausfluege_fotos
    FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Policy: Authenticated users can delete photos
CREATE POLICY "Authenticated users can delete photos" ON ausfluege_fotos
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- Also fix ausfluege table policies for admin editing
ALTER TABLE ausfluege ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view ausfluege" ON ausfluege;
DROP POLICY IF EXISTS "Authenticated users can insert ausfluege" ON ausfluege;
DROP POLICY IF EXISTS "Authenticated users can update ausfluege" ON ausfluege;
DROP POLICY IF EXISTS "Authenticated users can delete ausfluege" ON ausfluege;

CREATE POLICY "Anyone can view ausfluege" ON ausfluege
    FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can insert ausfluege" ON ausfluege
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update ausfluege" ON ausfluege
    FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete ausfluege" ON ausfluege
    FOR DELETE
    USING (auth.role() = 'authenticated');
