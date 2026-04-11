-- ============================================================
-- Migration: Add RLS policies for realization_images and
--            realization_documents
-- ============================================================
-- These child tables were created without RLS policies, which
-- means they're fully accessible. We need to restrict access
-- so only the owning professional (or admin) can manage them.

-- ── realization_images ─────────────────────────────────────
ALTER TABLE realization_images ENABLE ROW LEVEL SECURITY;

-- Public: read images from visible professionals (for portfolio display)
CREATE POLICY "realization_images_public_browse" ON realization_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM professional_realizations pr
      JOIN professionals p ON p.id = pr.professional_id
      WHERE pr.id = realization_images.realization_id
      AND p.is_visible = TRUE
    )
  );

-- Pro: manage images on their own realizations
CREATE POLICY "realization_images_pro_manage" ON realization_images
  FOR ALL USING (
    realization_id IN (
      SELECT pr.id FROM professional_realizations pr
      JOIN professionals p ON p.id = pr.professional_id
      WHERE p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    realization_id IN (
      SELECT pr.id FROM professional_realizations pr
      JOIN professionals p ON p.id = pr.professional_id
      WHERE p.user_id = auth.uid()
    )
  );

-- Admin: full access
CREATE POLICY "realization_images_admin_all" ON realization_images
  FOR ALL USING (public.has_role('admin'));

-- ── realization_documents ──────────────────────────────────
ALTER TABLE realization_documents ENABLE ROW LEVEL SECURITY;

-- Public: read documents from visible professionals
CREATE POLICY "realization_documents_public_browse" ON realization_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM professional_realizations pr
      JOIN professionals p ON p.id = pr.professional_id
      WHERE pr.id = realization_documents.realization_id
      AND p.is_visible = TRUE
    )
  );

-- Pro: manage documents on their own realizations
CREATE POLICY "realization_documents_pro_manage" ON realization_documents
  FOR ALL USING (
    realization_id IN (
      SELECT pr.id FROM professional_realizations pr
      JOIN professionals p ON p.id = pr.professional_id
      WHERE p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    realization_id IN (
      SELECT pr.id FROM professional_realizations pr
      JOIN professionals p ON p.id = pr.professional_id
      WHERE p.user_id = auth.uid()
    )
  );

-- Admin: full access
CREATE POLICY "realization_documents_admin_all" ON realization_documents
  FOR ALL USING (public.has_role('admin'));
