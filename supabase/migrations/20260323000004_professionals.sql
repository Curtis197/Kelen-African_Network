-- ============================================================
-- Migration 004: Professionals
-- ============================================================
-- One row per professional. CPM columns removed entirely —
-- visibility is now subscription-based (is_visible maintained
-- by trigger on the subscriptions table).

CREATE TABLE professionals (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- ── Identity (set at registration, not editable by pro) ──
  business_name          TEXT NOT NULL,
  owner_name             TEXT NOT NULL,
  slug                   TEXT UNIQUE NOT NULL,    -- e.g. kouadio-construction-abidjan

  -- ── Business info (editable by pro) ──────────────────────
  category               TEXT NOT NULL,           -- e.g. 'construction', 'plomberie'
  subcategories          TEXT[],
  country                TEXT NOT NULL,           -- ISO 3166-1 alpha-2
  city                   TEXT NOT NULL,
  address                TEXT,
  phone                  TEXT NOT NULL,
  whatsapp               TEXT,
  email                  TEXT NOT NULL,

  -- ── Profile content (visible only when is_visible = TRUE) ─
  description            TEXT,
  services_offered       TEXT[],
  years_experience       INTEGER,
  team_size              INTEGER,
  portfolio_photos       TEXT[],                  -- Supabase Storage URLs
  portfolio_videos       TEXT[],                  -- Supabase Storage URLs

  -- ── Status (computed by trigger — never write manually) ──
  status                 TEXT NOT NULL DEFAULT 'white'
                           CHECK (status IN ('gold', 'silver', 'white', 'red', 'black')),
  recommendation_count   INTEGER DEFAULT 0,
  signal_count           INTEGER DEFAULT 0,
  avg_rating             NUMERIC(3,2),            -- NULL when no reviews yet
  positive_review_pct    NUMERIC(5,2),            -- % reviews with rating >= 4
  review_count           INTEGER DEFAULT 0,

  -- ── Visibility (subscription-based) ──────────────────────
  -- is_active: set FALSE manually (admin) or by subscription webhook
  -- is_visible: maintained by trigger on subscriptions table
  --             TRUE when subscription.status = 'active' AND is_active = TRUE
  is_active              BOOLEAN DEFAULT TRUE,
  is_visible             BOOLEAN DEFAULT FALSE,

  -- ── Identity verification ─────────────────────────────────
  verified               BOOLEAN DEFAULT FALSE,
  verification_documents TEXT[],                  -- Storage URLs, admin-read only
  verified_at            TIMESTAMPTZ,

  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_professionals_user_id  ON professionals(user_id);
CREATE INDEX idx_professionals_slug     ON professionals(slug);
CREATE INDEX idx_professionals_status   ON professionals(status);
CREATE INDEX idx_professionals_visible  ON professionals(is_visible) WHERE is_visible = TRUE;
CREATE INDEX idx_professionals_category ON professionals(category, country, city);

-- Full-text search on name (used for validation lookup by clients)
CREATE INDEX idx_professionals_fts ON professionals
  USING gin(to_tsvector('simple', business_name || ' ' || owner_name));

-- Auto-update updated_at
CREATE TRIGGER set_updated_at_professionals
  BEFORE UPDATE ON professionals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Row Level Security ─────────────────────────────────────

ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;

-- Public: browse visible + non-black (category pages, discovery)
CREATE POLICY "professionals_public_browse" ON professionals
  FOR SELECT USING (is_visible = TRUE AND status != 'black');

-- Authenticated: name-based validation lookup (all non-black)
CREATE POLICY "professionals_auth_lookup" ON professionals
  FOR SELECT USING (auth.uid() IS NOT NULL AND status != 'black');

-- Direct slug URL: all statuses including black (transparency)
CREATE POLICY "professionals_direct_slug" ON professionals
  FOR SELECT USING (TRUE);

-- Pro: update own editable fields (computed cols protected by trigger)
CREATE POLICY "professionals_update_own" ON professionals
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admin: full access
CREATE POLICY "professionals_admin_all" ON professionals
  FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );
