-- ============================================================
-- Migration: Fix status calculation to match spec
-- ============================================================
-- Spec (kelen_positioning.md):
--   Gold:   3+ verified recommendations, zero signals
--   Silver: 1-2 verified recommendations, zero signals
--   White:  No verified history (default)
--   Red:    1+ verified signals — permanent, irreversible
--   Black:  Platform ban — NOT automatic, only set by admin
--
-- Old function had:
--   Gold:   5+ recs AND rating >= 4.5 AND positive_pct >= 90%
--   Silver: 1+ rec AND rating >= 4.0 AND positive_pct >= 80%
--   Red:    1+ signals (reversible — not permanent)
--   Black:  3+ signals (should be admin-only ban)

CREATE OR REPLACE FUNCTION compute_professional_status(prof_id UUID)
RETURNS void AS $$
DECLARE
  sig_count  INTEGER;
  rec_count  INTEGER;
  new_status TEXT;
  current_status TEXT;
BEGIN
  -- Get current status (for Red permanence check)
  SELECT status INTO current_status
  FROM professionals WHERE id = prof_id;

  -- ── Step 1: Count verified signals ────────────────────────
  SELECT COUNT(*) INTO sig_count
  FROM signals
  WHERE professional_id = prof_id AND verified = TRUE;

  -- ── Step 2: Count verified + linked recommendations ────────
  SELECT COUNT(*) INTO rec_count
  FROM recommendations
  WHERE professional_id = prof_id
    AND verified = TRUE
    AND linked = TRUE;

  -- ── Step 3: Apply status rules ─────────────────────────────

  -- Red is permanent — once set, only admin can remove it
  -- (Admin must manually UPDATE professionals SET status = 'white' to forgive)
  IF current_status = 'red' THEN
    -- Keep red unless admin manually changed it
    new_status := 'red';
  ELSIF sig_count >= 1 THEN
    -- New signal → permanent Red
    new_status := 'red';
  ELSIF rec_count >= 3 THEN
    new_status := 'gold';
  ELSIF rec_count >= 1 THEN
    new_status := 'silver';
  ELSE
    new_status := 'white';
  END IF;

  -- ── Step 4: Persist ───────────────────────────────────────
  UPDATE professionals SET
    status               = new_status,
    recommendation_count = COALESCE(rec_count, 0),
    signal_count         = COALESCE(sig_count, 0)
  WHERE id = prof_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Update triggers to fire on status column changes ────────
-- The old triggers fire on UPDATE OF verified, linked on recommendations.
-- Keep those, but also add triggers for the new 'status' column.

-- Drop old triggers if they exist (idempotent)
DROP TRIGGER IF EXISTS on_recommendation_change ON recommendations;
DROP TRIGGER IF EXISTS on_signal_change ON signals;
DROP TRIGGER IF EXISTS on_review_change ON reviews;

-- Re-create with broader triggers
CREATE TRIGGER on_recommendation_change
  AFTER INSERT OR UPDATE ON recommendations
  FOR EACH ROW EXECUTE FUNCTION trigger_compute_status();

CREATE TRIGGER on_signal_change
  AFTER INSERT OR UPDATE ON signals
  FOR EACH ROW EXECUTE FUNCTION trigger_compute_status();

-- Review changes still update status (via review metrics — kept for reference)
CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION trigger_compute_status();
