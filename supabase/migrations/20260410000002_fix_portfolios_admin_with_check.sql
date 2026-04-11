-- ============================================================
-- Migration: Fix portfolios_admin_v2 WITH CHECK clause
-- ============================================================
-- The portfolios_admin_v2 policy has WITH CHECK = null, which
-- causes INSERT operations to fail for non-admins.
-- This fixes it by adding a proper WITH CHECK clause.

DROP POLICY IF EXISTS "portfolios_admin_v2" ON storage.objects;

CREATE POLICY "portfolios_admin_v2" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'portfolios'
    AND public.has_role('admin')
  )
  WITH CHECK (
    bucket_id = 'portfolios'
    AND public.has_role('admin')
  );
