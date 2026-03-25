-- ============================================================
-- Migration 016: Storage Buckets + Policies
-- ============================================================
-- Five buckets. Public buckets serve files directly via CDN.
-- Private buckets require signed URLs (1-hour expiry).
--
-- File constraints (enforced in application layer + webhook):
--   Contracts / Verification docs : PDF, max 10 MB
--   Evidence / Portfolio photos   : JPG/PNG, max 5 MB
--   Portfolio videos              : MP4, max 50 MB
--   Project docs                  : PDF/JPG/PNG, max 10 MB

-- ── Bucket definitions ─────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'contracts',
    'contracts',
    false,
    10485760,          -- 10 MB
    ARRAY['application/pdf']
  ),
  (
    'evidence-photos',
    'evidence-photos',
    false,
    5242880,           -- 5 MB
    ARRAY['image/jpeg','image/png','image/webp']
  ),
  (
    'portfolios',
    'portfolios',
    true,              -- publicly accessible via CDN
    52428800,          -- 50 MB (covers videos)
    ARRAY['image/jpeg','image/png','image/webp','video/mp4']
  ),
  (
    'verification-docs',
    'verification-docs',
    false,
    10485760,          -- 10 MB
    ARRAY['application/pdf']
  ),
  (
    'project-docs',
    'project-docs',
    false,
    10485760,          -- 10 MB
    ARRAY['application/pdf','image/jpeg','image/png','image/webp']
  )
ON CONFLICT (id) DO NOTHING;

-- ── Storage RLS Policies ───────────────────────────────────

-- ── contracts bucket ───────────────────────────────────────
-- Upload: any authenticated user (for recommendations + signals)
-- Read:   public for files linked to verified rec/signal;
--         uploader always; admin always

CREATE POLICY "contracts_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'contracts');

CREATE POLICY "contracts_read_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'contracts'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "contracts_admin" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'contracts'
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- ── evidence-photos bucket ─────────────────────────────────
-- Same access pattern as contracts

CREATE POLICY "evidence_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'evidence-photos');

CREATE POLICY "evidence_read_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'evidence-photos'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "evidence_admin" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'evidence-photos'
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- ── portfolios bucket ──────────────────────────────────────
-- Upload: only the professional (files stored under their user_id folder)
-- Read:   public (bucket is public = CDN-served)

CREATE POLICY "portfolios_upload_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'portfolios'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "portfolios_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'portfolios'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "portfolios_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'portfolios'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "portfolios_admin" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'portfolios'
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- ── verification-docs bucket ───────────────────────────────
-- Upload: only the professional (their own folder)
-- Read:   admin only

CREATE POLICY "verdocs_upload_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'verification-docs'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "verdocs_admin" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'verification-docs'
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- ── project-docs bucket ────────────────────────────────────
-- Upload: only the professional (their own folder)
-- Read:   admin always; public for published project_documents

CREATE POLICY "projdocs_upload_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'project-docs'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "projdocs_read_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'project-docs'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "projdocs_admin" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'project-docs'
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );
