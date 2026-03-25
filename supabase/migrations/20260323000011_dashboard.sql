-- ============================================================
-- Migration 011: Client Project Dashboard Tables
-- ============================================================
-- Private space for diaspora clients to organise their projects.
-- Strictly private — professionals never see these tables.
-- Payments are private notes only, not real transactions.

-- ── user_projects ──────────────────────────────────────────

CREATE TABLE user_projects (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Description
  title            TEXT NOT NULL,
  description      TEXT,
  category         TEXT CHECK (category IN ('construction','renovation','immobilier','amenagement','autre')),
  location         TEXT,                              -- e.g. "Abidjan, Côte d'Ivoire"

  -- Budget (private note — not a real transaction)
  budget_total     NUMERIC(14,2),
  budget_currency  TEXT DEFAULT 'EUR'
                     CHECK (budget_currency IN ('EUR','XOF','USD')),

  -- Timeline
  start_date       DATE,
  end_date         DATE,

  -- Status
  status           TEXT DEFAULT 'en_preparation'
                     CHECK (status IN ('en_preparation','en_cours','en_pause','termine','annule')),

  -- Milestones (JSONB — flexible, no separate table needed for MVP)
  -- Format: [{ "id": "uuid", "label": "Fondations coulées", "done": false }]
  objectives       JSONB DEFAULT '[]'::jsonb,

  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_projects_user   ON user_projects(user_id, created_at DESC);
CREATE INDEX idx_user_projects_status ON user_projects(user_id, status);

CREATE TRIGGER set_updated_at_user_projects
  BEFORE UPDATE ON user_projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── project_professionals ──────────────────────────────────
-- Links a project to a professional (Kelen or off-platform).

CREATE TABLE project_professionals (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id        UUID NOT NULL REFERENCES user_projects(id) ON DELETE CASCADE,

  -- ── Type: Kelen pro OR external pro ───────────────────────
  is_external       BOOLEAN NOT NULL DEFAULT FALSE,

  -- Kelen pro (when is_external = FALSE)
  professional_id   UUID REFERENCES professionals(id) ON DELETE SET NULL,

  -- External pro (when is_external = TRUE)
  external_name     TEXT,
  external_phone    TEXT,
  external_category TEXT CHECK (external_category IN
                      ('construction','renovation','immobilier','amenagement','autre')),
  external_location TEXT,

  -- Role in this project
  role              TEXT DEFAULT 'contact'
                      CHECK (role IN ('contact','liked','picked')),

  -- Private client note (never visible to pro)
  private_note      TEXT,

  -- Snapshot of Kelen pro data at time of addition
  -- (stable display even if pro later deactivates)
  -- Format: { "business_name", "category", "status", "slug", "city", "country" }
  -- NULL for external pros
  pro_snapshot      JSONB,

  added_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_kelen_pro_per_project
    UNIQUE NULLS NOT DISTINCT (project_id, professional_id),
  CONSTRAINT external_requires_name
    CHECK (is_external = FALSE OR external_name IS NOT NULL),
  CONSTRAINT kelen_pro_requires_id
    CHECK (is_external = TRUE OR professional_id IS NOT NULL)
);

CREATE INDEX idx_pp_project  ON project_professionals(project_id);
CREATE INDEX idx_pp_pro      ON project_professionals(professional_id);
CREATE INDEX idx_pp_role     ON project_professionals(project_id, role);

CREATE TRIGGER set_updated_at_pp
  BEFORE UPDATE ON project_professionals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── project_payments ───────────────────────────────────────
-- Private payment notes. Not real transactions.

CREATE TABLE project_payments (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id                UUID NOT NULL REFERENCES user_projects(id) ON DELETE CASCADE,

  -- Optional: link to a specific pro in this project
  project_professional_id   UUID REFERENCES project_professionals(id) ON DELETE SET NULL,

  -- Payment details
  label                     TEXT NOT NULL,    -- e.g. "Acompte gros œuvre"
  amount                    NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  currency                  TEXT NOT NULL CHECK (currency IN ('EUR','XOF','USD')),
  paid_at                   DATE NOT NULL,
  payment_method            TEXT CHECK (payment_method IN
                              ('virement','especes','wave','orange_money','autre')),
  notes                     TEXT,

  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_project ON project_payments(project_id, paid_at DESC);
CREATE INDEX idx_payments_pp      ON project_payments(project_professional_id);

CREATE TRIGGER set_updated_at_project_payments
  BEFORE UPDATE ON project_payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── user_favorites ─────────────────────────────────────────
-- Cross-project saved Kelen pros. Independent of any project.

CREATE TABLE user_favorites (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  professional_id  UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  added_at         TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, professional_id)
);

CREATE INDEX idx_favorites_user ON user_favorites(user_id, added_at DESC);

-- ── Row Level Security ─────────────────────────────────────

ALTER TABLE user_projects         ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_payments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites        ENABLE ROW LEVEL SECURITY;

-- user_projects: client owns their own
CREATE POLICY "uprojects_own" ON user_projects
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "uprojects_admin" ON user_projects
  FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- project_professionals: access via parent project ownership
CREATE POLICY "pp_own" ON project_professionals
  FOR ALL USING (
    project_id IN (SELECT id FROM user_projects WHERE user_id = auth.uid())
  )
  WITH CHECK (
    project_id IN (SELECT id FROM user_projects WHERE user_id = auth.uid())
  );

CREATE POLICY "pp_admin" ON project_professionals
  FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- project_payments: access via parent project ownership
CREATE POLICY "payments_own" ON project_payments
  FOR ALL USING (
    project_id IN (SELECT id FROM user_projects WHERE user_id = auth.uid())
  )
  WITH CHECK (
    project_id IN (SELECT id FROM user_projects WHERE user_id = auth.uid())
  );

CREATE POLICY "payments_admin" ON project_payments
  FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- user_favorites: client owns their own
CREATE POLICY "favorites_own" ON user_favorites
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "favorites_admin" ON user_favorites
  FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
