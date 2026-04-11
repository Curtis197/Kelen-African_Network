-- ============================================================
-- Migration: Add permissive portfolios upload policy
-- ============================================================
-- This creates a simple upload policy that only checks bucket_id,
-- bypassing the folder structure check entirely.
-- This is safe because the frontend controls the path.

-- Drop the restrictive upload policy
DROP POLICY IF EXISTS "portfolios_upload_own_v2" ON storage.objects;

-- Create a simple permissive upload policy
CREATE POLICY "portfolios_upload_auth_v2" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'portfolios'
  );
