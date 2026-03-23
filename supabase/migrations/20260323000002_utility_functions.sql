-- ============================================================
-- Migration 002: Utility Functions
-- ============================================================

-- Reusable trigger function: auto-sets updated_at to NOW() on UPDATE.
-- Applied to every mutable table via individual triggers.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
