-- Migration: Setup Supabase Storage for trip documents
-- Description: Creates storage bucket and policies for ticket/booking files

-- Create storage bucket for trip documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'trip-documents', 
  'trip-documents', 
  false, -- Not public, requires auth
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Users can upload documents to their own plans
CREATE POLICY "Users can upload trip documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'trip-documents' AND
  (storage.foldername(name))[1]::uuid IN (
    SELECT id FROM plans WHERE creator_id IN (
      SELECT id FROM users WHERE open_id = auth.uid()::text
    )
  )
);

-- Policy: Users can read their own documents
CREATE POLICY "Users can read trip documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'trip-documents' AND
  (storage.foldername(name))[1]::uuid IN (
    SELECT id FROM plans WHERE creator_id IN (
      SELECT id FROM users WHERE open_id = auth.uid()::text
    )
  )
);

-- Policy: Users can update their own documents
CREATE POLICY "Users can update trip documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'trip-documents' AND
  (storage.foldername(name))[1]::uuid IN (
    SELECT id FROM plans WHERE creator_id IN (
      SELECT id FROM users WHERE open_id = auth.uid()::text
    )
  )
);

-- Policy: Users can delete their own documents
CREATE POLICY "Users can delete trip documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'trip-documents' AND
  (storage.foldername(name))[1]::uuid IN (
    SELECT id FROM plans WHERE creator_id IN (
      SELECT id FROM users WHERE open_id = auth.uid()::text
    )
  )
);
