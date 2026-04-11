-- ============================================================
-- Migration: Remove hero_title from professional_portfolio
-- ============================================================
-- This column is no longer used in the UI.
-- hero_subtitle and hero_image_url remain for customization.

ALTER TABLE professional_portfolio DROP COLUMN IF EXISTS hero_title;
