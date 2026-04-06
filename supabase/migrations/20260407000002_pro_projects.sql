-- ============================================================
-- Migration: Professional Project Management
-- ============================================================
-- Professionals can create and manage their own projects,
-- independent of client accounts. Completed projects can be
-- published as portfolio items (réalisations).

-- ── pro_projects ────────────────────────────────────────────
-- Projects owned and managed by professionals.
-- Can exist without a client on the platform.

CREATE TABLE pro_projects (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id   UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,

  -- Basic info
  title             TEXT NOT NULL,
  description       TEXT,
  category          TEXT NOT NULL,
  location          TEXT,

  -- Client info (optional — pro can log even without client on platform)
  client_name       TEXT,
  client_email      TEXT,
  client_phone      TEXT,

  -- Timeline
  start_date        DATE,
  end_date          DATE,
  actual_end_date   DATE,

  -- Budget
  budget            NUMERIC(14,2),
  currency          TEXT DEFAULT 'XOF' CHECK (currency IN ('XOF','EUR','USD')),

  -- Status
  status            TEXT NOT NULL DEFAULT 'in_progress'
                      CHECK (status IN ('in_progress','completed','paused','cancelled')),

  -- Portfolio / Realization
  -- When status = 'completed' and is_public = TRUE, appears on pro's public page
  is_public         BOOLEAN NOT NULL DEFAULT FALSE,
  featured_photo    TEXT,
  photo_urls        TEXT[],
  completion_notes  TEXT,

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pro_projects_professional ON pro_projects(professional_id);
CREATE INDEX idx_pro_projects_status ON pro_projects(professional_id, status);
CREATE INDEX idx_pro_projects_public ON pro_projects(professional_id, is_public)
  WHERE is_public = TRUE;

CREATE TRIGGER set_updated_at_pro_projects
  BEFORE UPDATE ON pro_projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Link project_logs to pro_projects ───────────────────────
-- Existing project_logs links to user_projects (client-side).
-- Now add pro_project_id for professional-side projects.

ALTER TABLE project_logs
  ADD COLUMN pro_project_id UUID REFERENCES pro_projects(id) ON DELETE CASCADE;

-- Add index for the new column
CREATE INDEX idx_project_logs_pro_project ON project_logs(pro_project_id, log_date DESC);

-- Relax the NOT NULL constraint on gps fields for pro-created logs
-- (we keep GPS required for client projects, but pros may not always have GPS data)
-- Actually, keep GPS required per spec. No change needed.

-- ── Link project_documents to pro_projects ──────────────────
-- When a realization is linked to a project, fetch data from pro_projects.

ALTER TABLE project_documents
  ADD COLUMN pro_project_id UUID REFERENCES pro_projects(id) ON DELETE SET NULL;

CREATE INDEX idx_project_docs_pro_project ON project_documents(pro_project_id);

-- ── Row Level Security ─────────────────────────────────────

ALTER TABLE pro_projects ENABLE ROW LEVEL SECURITY;

-- Public: browse public (portfolio) projects of visible professionals
CREATE POLICY "pro_projects_public_browse" ON pro_projects
  FOR SELECT USING (
    is_public = TRUE
    AND professional_id IN (
      SELECT id FROM professionals WHERE is_visible = TRUE AND status != 'black'
    )
  );

-- Pro: manage own projects
CREATE POLICY "pro_projects_own" ON pro_projects
  FOR ALL USING (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
  )
  WITH CHECK (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
  );

-- Admin: full access
CREATE POLICY "pro_projects_admin" ON pro_projects
  FOR ALL USING (public.has_role('admin'));
