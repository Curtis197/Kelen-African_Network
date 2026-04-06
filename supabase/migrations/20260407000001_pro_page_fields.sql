-- ============================================================
-- Migration: Professional page customization fields
-- ============================================================
-- Adds hero image, hero tagline, about text, and profile picture
-- for professional landing page customization.

ALTER TABLE professionals
  ADD COLUMN IF NOT EXISTS hero_image_url TEXT,
  ADD COLUMN IF NOT EXISTS hero_tagline TEXT,
  ADD COLUMN IF NOT EXISTS about_text TEXT;
