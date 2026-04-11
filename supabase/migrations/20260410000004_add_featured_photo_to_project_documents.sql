-- ============================================================
-- Migration: Add featured_photo to project_documents
-- ============================================================
-- Adds a featured_photo column to allow professionals to select
-- a main/cover image for their realisations.

ALTER TABLE project_documents
  ADD COLUMN IF NOT EXISTS featured_photo TEXT;

-- Set featured_photo to the first photo by default for existing records
UPDATE project_documents
SET featured_photo = photo_urls[1]
WHERE featured_photo IS NULL
  AND photo_urls IS NOT NULL
  AND array_length(photo_urls, 1) > 0;
