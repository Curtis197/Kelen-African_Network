-- ============================================================
-- Migration: Add public read policy for portfolios bucket
-- ============================================================
-- This allows anyone to view images in the portfolios bucket.
-- Images are only uploaded by authenticated users, but the
-- resulting URLs should be publicly viewable (like any image).

-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "portfolios_public_read" ON storage.objects;

-- Create public read policy for portfolios bucket
CREATE POLICY "portfolios_public_read" ON storage.objects
  FOR SELECT TO public
  USING (
    bucket_id = 'portfolios'
  );
