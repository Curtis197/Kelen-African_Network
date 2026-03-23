-- ============================================================
-- Migration 014: Triggers
-- ============================================================
-- All application triggers. Depends on Migration 013 (functions).

-- ── Slug generation ────────────────────────────────────────
-- Generates slug from business_name + city before first INSERT.
-- If pro provides a slug manually it is overwritten.

CREATE TRIGGER generate_slug_before_insert
  BEFORE INSERT ON professionals
  FOR EACH ROW EXECUTE FUNCTION generate_professional_slug();

-- ── Subscription → visibility sync ────────────────────────
-- Any INSERT or status UPDATE on subscriptions updates
-- professionals.is_visible accordingly.

CREATE TRIGGER on_subscription_change
  AFTER INSERT OR UPDATE OF status ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_professional_visibility();

-- ── Status recalculation — recommendations ─────────────────
-- Fires after admin verifies a recommendation OR
-- after a pro links/unlinks a recommendation.

CREATE TRIGGER on_recommendation_change
  AFTER UPDATE OF verified, linked ON recommendations
  FOR EACH ROW EXECUTE FUNCTION trigger_compute_status();

-- ── Status recalculation — signals ─────────────────────────
-- Fires after admin verifies a signal.
-- May transition pro from white/silver/gold → red or black.

CREATE TRIGGER on_signal_change
  AFTER UPDATE OF verified ON signals
  FOR EACH ROW EXECUTE FUNCTION trigger_compute_status();

-- ── Status recalculation — reviews ────────────────────────
-- Fires after any INSERT or when rating/is_hidden changes.
-- Recomputes avg_rating, positive_review_pct, review_count.

CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OF rating, is_hidden ON reviews
  FOR EACH ROW EXECUTE FUNCTION trigger_compute_status();

-- ── Auto-populate verification queue ──────────────────────
-- Every new recommendation → queue item of type 'recommendation'

CREATE TRIGGER add_to_queue_recommendation
  AFTER INSERT ON recommendations
  FOR EACH ROW EXECUTE FUNCTION add_to_verification_queue('recommendation');

-- Every new signal → queue item of type 'signal'

CREATE TRIGGER add_to_queue_signal
  AFTER INSERT ON signals
  FOR EACH ROW EXECUTE FUNCTION add_to_verification_queue('signal');

-- ── Pro snapshot for client dashboard ─────────────────────
-- Captures Kelen pro data into pro_snapshot before INSERT.
-- Runs even if professional later deactivates.

CREATE TRIGGER snapshot_pro_on_add
  BEFORE INSERT ON project_professionals
  FOR EACH ROW EXECUTE FUNCTION snapshot_professional_on_add();

-- ── Review history audit trail ─────────────────────────────
-- Saves previous values before any rating/comment update.

CREATE TRIGGER save_review_history
  BEFORE UPDATE OF rating, comment ON reviews
  FOR EACH ROW EXECUTE FUNCTION save_review_history();
