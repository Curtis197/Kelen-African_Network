-- ============================================================
-- Migration: Normalize image storage to proper tables
-- ============================================================
-- This migration:
-- 1. Creates pro_project_images table for pro projects
-- 2. Migrates existing data from photo_urls arrays to proper tables
-- 3. Drops photo_urls and featured_photo array columns from parent tables
-- 4. Cleans up project_images table

-- ── 1. Create pro_project_images table ──────────────────────
CREATE TABLE IF NOT EXISTS pro_project_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_project_id uuid NOT NULL REFERENCES pro_projects(id) ON DELETE CASCADE,
  url text NOT NULL,
  is_main boolean DEFAULT false,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── 2. Migrate existing data from arrays to rows ────────────

-- Migrate pro_projects photo_urls -> pro_project_images
INSERT INTO pro_project_images (pro_project_id, url, is_main, order_index)
SELECT 
  pp.id,
  photo_url,
  (photo_url = pp.featured_photo),
  idx
FROM pro_projects pp,
     unnest(pp.photo_urls) WITH ORDINALITY AS t(photo_url, idx)
WHERE pp.photo_urls IS NOT NULL 
  AND array_length(pp.photo_urls, 1) > 0;

-- Migrate project_documents photo_urls -> project_images
INSERT INTO project_images (project_document_id, professional_id, url, is_main)
SELECT 
  pd.id,
  pd.professional_id,
  photo_url,
  (photo_url = pd.featured_photo)
FROM project_documents pd,
     unnest(pd.photo_urls) AS t(photo_url)
WHERE pd.photo_urls IS NOT NULL 
  AND array_length(pd.photo_urls, 1) > 0;

-- ── 3. Drop array columns from parent tables ────────────────

-- Drop from pro_projects
ALTER TABLE pro_projects DROP COLUMN IF EXISTS photo_urls;
ALTER TABLE pro_projects DROP COLUMN IF EXISTS featured_photo;

-- Drop from project_documents
ALTER TABLE project_documents DROP COLUMN IF EXISTS photo_urls;
ALTER TABLE project_documents DROP COLUMN IF EXISTS featured_photo;

-- Note: professional_realizations doesn't have photo_urls column 
-- (it already uses realization_images table correctly)

-- ── 4. Clean up project_images table ───────────────────────
-- Remove unnecessary FK columns, keep only project_document_id
-- (The table has FKs to multiple parent tables which is messy)
ALTER TABLE project_images DROP COLUMN IF EXISTS project_id;
ALTER TABLE project_images DROP COLUMN IF EXISTS recommendation_id;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pro_project_images_pro_project_id ON pro_project_images(pro_project_id);
CREATE INDEX IF NOT EXISTS idx_project_images_document_id ON project_images(project_document_id) WHERE project_document_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_project_images_is_main ON project_images(is_main) WHERE is_main = true;
CREATE INDEX IF NOT EXISTS idx_pro_project_images_is_main ON pro_project_images(is_main) WHERE is_main = true;
