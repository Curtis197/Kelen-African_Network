-- ============================================================
-- Migration 007: Signals
-- ============================================================
-- Contract breach reports submitted by clients.
-- Status impact on professional:
--   1–2 verified signals → Liste Rouge
--   ≥ 3 verified signals → Liste Noire (removed from discovery)
-- Signals are permanent — pros can only respond, not remove.

CREATE TABLE signals (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id     UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  professional_slug   TEXT NOT NULL,   -- denormalized

  -- ── Submitter snapshot ────────────────────────────────────
  submitter_id        UUID NOT NULL REFERENCES users(id),
  submitter_name      TEXT NOT NULL,
  submitter_country   TEXT NOT NULL,
  submitter_email     TEXT NOT NULL,

  -- ── Breach details ─────────────────────────────────────────
  breach_type         TEXT NOT NULL
                        CHECK (breach_type IN ('timeline','budget','quality','abandonment','fraud')),
  breach_description  TEXT NOT NULL,
  severity            TEXT CHECK (severity IN ('minor','major','critical')),

  -- ── Timeline evidence ──────────────────────────────────────
  agreed_start_date   DATE NOT NULL,
  agreed_end_date     DATE NOT NULL,
  actual_start_date   DATE,
  actual_end_date     DATE,
  timeline_deviation  TEXT,

  -- ── Budget evidence ────────────────────────────────────────
  agreed_budget       NUMERIC(10,2),
  actual_budget       NUMERIC(10,2),
  budget_deviation    TEXT,

  -- ── Evidence (required at submission) ─────────────────────
  contract_url        TEXT NOT NULL,   -- Storage URL, PDF
  evidence_urls       TEXT[] NOT NULL, -- Storage URLs
  communication_logs  TEXT[],          -- Storage URLs (optional)

  -- ── Professional response (cannot remove, can only respond) ─
  pro_response        TEXT,
  pro_evidence_urls   TEXT[],
  pro_responded_at    TIMESTAMPTZ,

  -- ── Admin verification ─────────────────────────────────────
  status              TEXT DEFAULT 'pending'
                        CHECK (status IN ('pending','verified','rejected','disputed')),
  verified            BOOLEAN DEFAULT FALSE,
  verified_at         TIMESTAMPTZ,
  verified_by         UUID REFERENCES users(id),
  verification_notes  TEXT,
  rejection_reason    TEXT,

  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_signals_professional ON signals(professional_id);
CREATE INDEX idx_signals_submitter    ON signals(submitter_id);
CREATE INDEX idx_signals_verified     ON signals(professional_id, verified);
CREATE INDEX idx_signals_status       ON signals(status);

CREATE TRIGGER set_updated_at_signals
  BEFORE UPDATE ON signals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Row Level Security ─────────────────────────────────────

ALTER TABLE signals ENABLE ROW LEVEL SECURITY;

-- Public: see verified signals
CREATE POLICY "signals_public_verified" ON signals
  FOR SELECT USING (verified = TRUE);

-- Submitter: see own submissions (all statuses)
CREATE POLICY "signals_submitter_own" ON signals
  FOR SELECT USING (submitter_id = auth.uid());

-- Authenticated clients: submit signals
CREATE POLICY "signals_insert" ON signals
  FOR INSERT WITH CHECK (submitter_id = auth.uid());

-- Pro: respond to signals against them (pro_response, pro_evidence_urls, pro_responded_at only)
CREATE POLICY "signals_pro_respond" ON signals
  FOR UPDATE USING (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
  )
  WITH CHECK (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
  );

-- Admin: full access
CREATE POLICY "signals_admin_all" ON signals
  FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );
