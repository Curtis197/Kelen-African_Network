-- ============================================================
-- Migration 010: Verification Queue
-- ============================================================
-- Admin workflow queue for reviewing recommendations and signals.
-- Populated automatically by triggers on recommendations and signals.
-- FIFO ordering (created_at ASC) for fair review order.

CREATE TABLE verification_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type       TEXT NOT NULL CHECK (item_type IN ('recommendation', 'signal')),
  item_id         UUID NOT NULL,                              -- FK to recommendations or signals
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,

  -- ── Admin workflow ─────────────────────────────────────────
  status          TEXT DEFAULT 'pending'
                    CHECK (status IN ('pending','in_review','completed')),
  assigned_to     UUID REFERENCES users(id),                 -- admin assigned
  review_notes    TEXT,                                      -- internal notes

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at     TIMESTAMPTZ
);

-- FIFO queue index — pending items ordered by submission time
CREATE INDEX idx_vqueue_pending  ON verification_queue(status, created_at ASC)
  WHERE status = 'pending';
CREATE INDEX idx_vqueue_item     ON verification_queue(item_type, item_id);
CREATE INDEX idx_vqueue_assigned ON verification_queue(assigned_to) WHERE assigned_to IS NOT NULL;

CREATE TRIGGER set_updated_at_vqueue
  BEFORE UPDATE ON verification_queue
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Row Level Security ─────────────────────────────────────

ALTER TABLE verification_queue ENABLE ROW LEVEL SECURITY;

-- Admin only — no public or pro access
CREATE POLICY "vqueue_admin_all" ON verification_queue
  FOR ALL USING (
    public.has_role('admin')
  );
