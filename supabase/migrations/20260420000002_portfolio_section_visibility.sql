-- ============================================================
-- Migration: Add section visibility toggles to professional_portfolio
-- ============================================================
-- Allows professionals to show/hide individual portfolio sections
-- (realizations, services, products, about) from their public page.

ALTER TABLE professional_portfolio
  ADD COLUMN IF NOT EXISTS show_realizations_section BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS show_services_section     BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS show_products_section     BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS show_about_section        BOOLEAN DEFAULT TRUE;
