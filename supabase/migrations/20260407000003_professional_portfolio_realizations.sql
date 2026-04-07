-- ============================================================
-- Professional Portfolio & Realizations Tables
-- ============================================================

-- Portfolio info (about text, philosophy, etc.)
CREATE TABLE IF NOT EXISTS professional_portfolio (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id        UUID NOT NULL UNIQUE REFERENCES professionals(id) ON DELETE CASCADE,
  
  about_text             TEXT,                      -- Philosophy / About section
  hero_tagline           TEXT,                      -- Hero section tagline
  hero_image_url         TEXT,                      -- Hero background image
  
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

-- Individual realizations / projects
CREATE TABLE IF NOT EXISTS professional_realizations (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id        UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  
  title                  TEXT NOT NULL,
  description            TEXT,
  location               TEXT,
  year                   INTEGER,
  category               TEXT,
  photo_urls             TEXT[],                    -- Array of image URLs
  is_featured            BOOLEAN DEFAULT FALSE,     -- Highlight in portfolio
  
  order_index            INTEGER DEFAULT 0,         -- Custom ordering
  
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_realizations_professional_id ON professional_realizations(professional_id);
CREATE INDEX IF NOT EXISTS idx_realizations_featured ON professional_realizations(professional_id, is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_realizations_order ON professional_realizations(professional_id, order_index);
CREATE INDEX IF NOT EXISTS idx_portfolio_professional_id ON professional_portfolio(professional_id);

-- Auto-update triggers
CREATE TRIGGER set_updated_at_portfolio
  BEFORE UPDATE ON professional_portfolio
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_realizations
  BEFORE UPDATE ON professional_realizations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Row Level Security ─────────────────────────────────────

ALTER TABLE professional_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_realizations ENABLE ROW LEVEL SECURITY;

-- Public: browse portfolio and realizations of visible professionals
CREATE POLICY "portfolio_public_browse" ON professional_portfolio
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM professionals 
      WHERE professionals.id = professional_portfolio.professional_id 
      AND professionals.is_visible = TRUE
    )
  );

CREATE POLICY "realizations_public_browse" ON professional_realizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM professionals 
      WHERE professionals.id = professional_realizations.professional_id 
      AND professionals.is_visible = TRUE
    )
  );

-- Pro: manage own portfolio and realizations
CREATE POLICY "portfolio_pro_manage" ON professional_portfolio
  FOR ALL USING (
    professional_id IN (
      SELECT id FROM professionals WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "realizations_pro_manage" ON professional_realizations
  FOR ALL USING (
    professional_id IN (
      SELECT id FROM professionals WHERE user_id = auth.uid()
    )
  );

-- Admin: full access
CREATE POLICY "portfolio_admin_all" ON professional_portfolio
  FOR ALL USING (public.has_role('admin'));

CREATE POLICY "realizations_admin_all" ON professional_realizations
  FOR ALL USING (public.has_role('admin'));
