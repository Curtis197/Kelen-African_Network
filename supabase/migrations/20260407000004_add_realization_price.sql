-- ============================================================
-- Add price column to professional_realizations
-- ============================================================

ALTER TABLE professional_realizations
  ADD COLUMN IF NOT EXISTS price DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'XOF';

-- Add comment for documentation
COMMENT ON COLUMN professional_realizations.price IS 'Project price/cost for client transparency';
COMMENT ON COLUMN professional_realizations.currency IS 'Currency code (XOF, EUR, USD)';

-- Index for price-based filtering
CREATE INDEX IF NOT EXISTS idx_realizations_price ON professional_realizations(professional_id, price) WHERE price IS NOT NULL;
