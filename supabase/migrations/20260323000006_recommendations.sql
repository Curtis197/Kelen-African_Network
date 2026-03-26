-- ============================================================
-- Migration 006: Recommendations
-- ============================================================
-- Submitted by clients (role = client), claimed by the
-- professional (linked = TRUE), verified by admin.
-- Counts toward Gold/Silver status ONLY when:
--   verified = TRUE AND linked = TRUE

CREATE TABLE recommendations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id     UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  professional_slug   TEXT NOT NULL,   -- denormalized for display without join

  -- ── Submitter snapshot (captured at submit time) ──────────
  submitter_id        UUID NOT NULL REFERENCES users(id),
  submitter_name      TEXT NOT NULL,
  submitter_country   TEXT NOT NULL,
  submitter_email     TEXT NOT NULL,

  -- ── Project details ────────────────────────────────────────
  project_type        TEXT NOT NULL,
  project_description TEXT NOT NULL,
  completion_date     DATE NOT NULL,
  budget_range        TEXT NOT NULL
                        CHECK (budget_range IN ('0-10k','10k-25k','25k-50k','50k-100k','100k+')),
  location            TEXT NOT NULL,

  -- ── Evidence (required at submission) ─────────────────────
  contract_url        TEXT NOT NULL,   -- Storage URL, PDF
  photo_urls          TEXT[] NOT NULL, -- Storage URLs, at least 1
  before_photos       TEXT[],
  after_photos        TEXT[],

  -- ── Pro linking (pro acknowledges ownership) ──────────────
  linked              BOOLEAN DEFAULT FALSE,
  linked_at           TIMESTAMPTZ,

  -- ── Admin verification ─────────────────────────────────────
  status              TEXT DEFAULT 'pending'
                        CHECK (status IN ('pending', 'verified', 'rejected')),
  verified            BOOLEAN DEFAULT FALSE,
  verified_at         TIMESTAMPTZ,
  verified_by         UUID REFERENCES users(id),
  verification_notes  TEXT,
  rejection_reason    TEXT,

  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recommendations_professional ON recommendations(professional_id);
CREATE INDEX idx_recommendations_submitter    ON recommendations(submitter_id);
CREATE INDEX idx_recommendations_verified     ON recommendations(professional_id, verified, linked);
CREATE INDEX idx_recommendations_status       ON recommendations(status);

CREATE TRIGGER set_updated_at_recommendations
  BEFORE UPDATE ON recommendations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Row Level Security ─────────────────────────────────────

ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

-- Public: see verified recommendations
CREATE POLICY "recommendations_public_verified" ON recommendations
  FOR SELECT USING (verified = TRUE);

-- Submitter: see own submissions (all statuses)
CREATE POLICY "recommendations_submitter_own" ON recommendations
  FOR SELECT USING (submitter_id = auth.uid());

-- Authenticated clients: submit recommendations
CREATE POLICY "recommendations_insert" ON recommendations
  FOR INSERT WITH CHECK (submitter_id = auth.uid());

-- Pro: link/unlink own recommendations (linked + linked_at only)
CREATE POLICY "recommendations_pro_link" ON recommendations
  FOR UPDATE USING (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
  )
  WITH CHECK (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
  );

-- Admin: full access
CREATE POLICY "recommendations_admin_all" ON recommendations
  FOR ALL USING (
    public.has_role('admin')
  );
