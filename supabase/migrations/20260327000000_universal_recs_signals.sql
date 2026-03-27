-- ============================================================
-- Migration: Universal Recommendations & Signals
-- ============================================================
-- Allows capturing recommendations and signals for any 
-- professional, even those not registered on the platform.

-- 1. Alter recommendations table
ALTER TABLE recommendations 
  ALTER COLUMN professional_id DROP NOT NULL,
  ALTER COLUMN professional_slug DROP NOT NULL;

ALTER TABLE recommendations
  ADD COLUMN IF NOT EXISTS external_name TEXT,
  ADD COLUMN IF NOT EXISTS external_category TEXT,
  ADD COLUMN IF NOT EXISTS external_city TEXT,
  ADD COLUMN IF NOT EXISTS external_country TEXT;

-- 2. Alter signals table
ALTER TABLE signals 
  ALTER COLUMN professional_id DROP NOT NULL,
  ALTER COLUMN professional_slug DROP NOT NULL;

ALTER TABLE signals
  ADD COLUMN IF NOT EXISTS external_name TEXT,
  ADD COLUMN IF NOT EXISTS external_category TEXT,
  ADD COLUMN IF NOT EXISTS external_city TEXT,
  ADD COLUMN IF NOT EXISTS external_country TEXT;

-- 3. Update Indexes (already exist for professional_id, but good to know)
-- No changes needed to existing indexes as they still apply to non-null cases.

-- 4. Constraint (Optional: Ensure either pro_id or external_name is present)
ALTER TABLE recommendations 
  ADD CONSTRAINT check_rec_source 
  CHECK (professional_id IS NOT NULL OR external_name IS NOT NULL);

ALTER TABLE signals 
  ADD CONSTRAINT check_signal_source 
  CHECK (professional_id IS NOT NULL OR external_name IS NOT NULL);
