-- ============================================================
-- Migration: Fix portfolios_admin RLS policy
-- ============================================================
-- The portfolios_admin policy from 20260323000016_storage.sql
-- uses the broken [1] index. This drops it and creates a v2 version.
-- This also ensures the v2 policies from 20260409000006 are properly applied.

-- Drop the broken admin policy that uses [1]
DROP POLICY IF EXISTS "portfolios_admin" ON storage.objects;

-- Drop v2 admin policy if it exists (for re-run safety)
DROP POLICY IF EXISTS "portfolios_admin_v2" ON storage.objects;

-- Recreate all portfolios policies with correct [2] index
-- Drop old policies first
DROP POLICY IF EXISTS "portfolios_upload_own" ON storage.objects;
DROP POLICY IF EXISTS "portfolios_update_own" ON storage.objects;
DROP POLICY IF EXISTS "portfolios_delete_own" ON storage.objects;

DROP POLICY IF EXISTS "portfolios_upload_own_v2" ON storage.objects;
DROP POLICY IF EXISTS "portfolios_update_own_v2" ON storage.objects;
DROP POLICY IF EXISTS "portfolios_delete_own_v2" ON storage.objects;

-- Recreate with correct index
CREATE POLICY "portfolios_upload_own_v2" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'portfolios'
    AND (storage.foldername(name))[2] = auth.uid()::TEXT
  );

CREATE POLICY "portfolios_update_own_v2" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'portfolios'
    AND (storage.foldername(name))[2] = auth.uid()::TEXT
  );

CREATE POLICY "portfolios_delete_own_v2" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'portfolios'
    AND (storage.foldername(name))[2] = auth.uid()::TEXT
  );

CREATE POLICY "portfolios_admin_v2" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'portfolios'
    AND public.has_role('admin')
  );
