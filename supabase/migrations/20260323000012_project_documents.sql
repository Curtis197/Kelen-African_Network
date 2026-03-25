-- ============================================================
-- Migration 012: Project Documents (Trust Layer - Level 2)
-- ============================================================
-- Professionals upload legal documents from real projects to prove
-- their track record. Kelen verifies, then notifies the client
-- via the email on the contract. If the client confirms, a
-- Verified Recommendation is automatically created.
--
-- "Kelen ne crée pas de nouveaux faits.
--  Elle documente des faits qui existent déjà."

CREATE TABLE project_documents (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id           UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,

  -- ── Project info ───────────────────────────────────────────
  project_title             TEXT NOT NULL,
  project_description       TEXT,
  project_date              DATE,
  project_amount            NUMERIC(14,2),      -- optional, for display

  -- ── Uploaded legal documents (required at submission) ─────
  contract_url              TEXT NOT NULL,      -- Storage URL, signed contract PDF
  delivery_report_url       TEXT,               -- Storage URL, PV de livraison
  photo_urls                TEXT[],             -- Storage URLs, timestamped photos

  -- ── Admin review ───────────────────────────────────────────
  status                    TEXT DEFAULT 'pending_review'
                              CHECK (status IN ('pending_review','published','rejected')),
  rejection_reason          TEXT,
  reviewed_by               UUID REFERENCES users(id),
  reviewed_at               TIMESTAMPTZ,

  -- ── Client notification flow ───────────────────────────────
  -- client_email: extracted from contract by admin and entered manually
  client_email              TEXT,
  client_notified_at        TIMESTAMPTZ,

  -- NULL  = no response yet → stays as "Projet documenté"
  -- TRUE  = client confirmed → auto-create Verified Recommendation
  -- FALSE = client contested → open dispute procedure
  client_confirmed          BOOLEAN,
  client_responded_at       TIMESTAMPTZ,

  -- ── Linked recommendation (auto-created on client confirmation) ─
  linked_recommendation_id  UUID REFERENCES recommendations(id),

  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_project_docs_professional ON project_documents(professional_id);
CREATE INDEX idx_project_docs_status       ON project_documents(status);
CREATE INDEX idx_project_docs_published    ON project_documents(professional_id, status)
  WHERE status = 'published';

CREATE TRIGGER set_updated_at_project_docs
  BEFORE UPDATE ON project_documents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Row Level Security ─────────────────────────────────────

ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;

-- Public: see published documents
CREATE POLICY "pdocs_public_published" ON project_documents
  FOR SELECT USING (status = 'published');

-- Pro: manage own documents
CREATE POLICY "pdocs_pro_own" ON project_documents
  FOR ALL USING (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
  )
  WITH CHECK (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
  );

-- Admin: full access (review, publish, set client_email, confirm)
CREATE POLICY "pdocs_admin_all" ON project_documents
  FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );
