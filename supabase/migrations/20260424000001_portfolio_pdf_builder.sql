-- ============================================================
-- Portfolio PDF Builder
-- Adds cover page title and per-item PDF inclusion flags
-- ============================================================

-- Cover title for the PDF front cover (separate from hero_subtitle)
ALTER TABLE professional_portfolio
  ADD COLUMN IF NOT EXISTS cover_title text;

-- Per-item inclusion flags for the PDF portfolio
-- Realizations: included by default (backward compatible)
ALTER TABLE professional_realizations
  ADD COLUMN IF NOT EXISTS is_pdf_included boolean NOT NULL DEFAULT true;

-- Services and products: excluded by default (opt-in)
ALTER TABLE professional_services
  ADD COLUMN IF NOT EXISTS is_pdf_included boolean NOT NULL DEFAULT false;

ALTER TABLE professional_products
  ADD COLUMN IF NOT EXISTS is_pdf_included boolean NOT NULL DEFAULT false;
