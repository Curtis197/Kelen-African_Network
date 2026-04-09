-- ============================================================
-- Migration: Fix portfolios RLS policy folder index
-- ============================================================
-- The storage.objects `name` column stores the full path including
-- the bucket folder name. For example:
--   portfolios/<user_id>/<uuid>.png
-- 
-- storage.foldername(name) returns ['portfolios', '<user_id>', '<uuid>.png']
-- In PostgreSQL, array indexing is 1-based, so:
--   [1] = 'portfolios' (bucket name)
--   [2] = '<user_id>'   (actual user folder)
--
-- The original policy checked [1] = auth.uid() which would NEVER match.
-- This fixes it to check [2].

DROP POLICY IF EXISTS "portfolios_upload_own" ON storage.objects;
DROP POLICY IF EXISTS "portfolios_update_own" ON storage.objects;
DROP POLICY IF EXISTS "portfolios_delete_own" ON storage.objects;

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

-- Also fix contracts and evidence read policies that have the same bug
DROP POLICY IF EXISTS "contracts_read_own" ON storage.objects;
DROP POLICY IF EXISTS "evidence_read_own" ON storage.objects;

CREATE POLICY "contracts_read_own_v2" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'contracts'
    AND (storage.foldername(name))[2] = auth.uid()::TEXT
  );

CREATE POLICY "evidence_read_own_v2" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'evidence-photos'
    AND (storage.foldername(name))[2] = auth.uid()::TEXT
  );

-- Also fix verification-docs and project-docs policies
DROP POLICY IF EXISTS "verdocs_upload_own" ON storage.objects;
DROP POLICY IF EXISTS "verdocs_admin" ON storage.objects;

CREATE POLICY "verdocs_upload_own_v2" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'verification-docs'
    AND (storage.foldername(name))[2] = auth.uid()::TEXT
  );

CREATE POLICY "verdocs_admin_v2" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'verification-docs'
    AND public.has_role('admin')
  );

DROP POLICY IF EXISTS "projdocs_upload_own" ON storage.objects;
DROP POLICY IF EXISTS "projdocs_read_own" ON storage.objects;
DROP POLICY IF EXISTS "projdocs_admin" ON storage.objects;

CREATE POLICY "projdocs_upload_own_v2" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'project-docs'
    AND (storage.foldername(name))[2] = auth.uid()::TEXT
  );

CREATE POLICY "projdocs_read_own_v2" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'project-docs'
    AND (storage.foldername(name))[2] = auth.uid()::TEXT
  );

CREATE POLICY "projdocs_admin_v2" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'project-docs'
    AND public.has_role('admin')
  );
