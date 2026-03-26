-- ============================================================
-- Migration 009: Analytics Tables
-- ============================================================
-- Profile views and contact interactions for analytics.
-- CPM billing is removed — cost_deducted is always 0.
-- These tables are INSERT-only from the server (service role).
-- No UPDATE or DELETE is ever performed.

CREATE TABLE profile_views (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id   UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,

  -- ── Viewer fingerprint (GDPR-compliant, no raw IP stored) ──
  viewer_ip_hash    TEXT NOT NULL,    -- SHA-256 of IP address
  viewer_country    TEXT,
  viewer_city       TEXT,

  -- ── Context ────────────────────────────────────────────────
  source            TEXT NOT NULL
                      CHECK (source IN ('search','browse','category','direct')),
  search_query      TEXT,             -- query that led to profile
  referrer          TEXT,             -- HTTP referrer URL

  -- ── Billing (always 0 — CPM removed, kept for schema compat) ─
  cost_deducted     NUMERIC(10,4) NOT NULL DEFAULT 0.0000,

  -- ── Engagement ─────────────────────────────────────────────
  view_duration     INTEGER,          -- seconds on page, sent client-side

  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profile_views_professional ON profile_views(professional_id, created_at DESC);
CREATE INDEX idx_profile_views_source       ON profile_views(source, created_at DESC);

-- ── Contact button clicks ──────────────────────────────────

CREATE TABLE profile_interactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id   UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,

  type              TEXT NOT NULL
                      CHECK (type IN ('contact_click','phone_click','whatsapp_click','email_click')),
  viewer_ip_hash    TEXT NOT NULL,
  viewer_country    TEXT,

  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profile_interactions_professional ON profile_interactions(professional_id, created_at DESC);

-- ── Row Level Security ─────────────────────────────────────

ALTER TABLE profile_views        ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_interactions ENABLE ROW LEVEL SECURITY;

-- Pro: read own analytics
CREATE POLICY "views_pro_own" ON profile_views
  FOR SELECT USING (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
  );

CREATE POLICY "interactions_pro_own" ON profile_interactions
  FOR SELECT USING (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
  );

-- Admin: full access
CREATE POLICY "views_admin_all" ON profile_views
  FOR ALL USING (
    public.has_role('admin')
  );

CREATE POLICY "interactions_admin_all" ON profile_interactions
  FOR ALL USING (
    public.has_role('admin')
  );

-- Note: INSERT is done via service role only (track_profile_view function).
-- No INSERT policy for authenticated users intentionally.
