-- Migration: Fix unique constraint on external professionals and add project_areas table

-- ── 1. Fix unique_kelen_pro_per_project constraint ────────────────────────────
-- Current: UNIQUE NULLS NOT DISTINCT (project_id, professional_id)
-- Problem: NULLs treated as equal → only ONE external pro allowed per project.
-- Fix: drop constraint, replace with partial index on Kelen pros only.

ALTER TABLE project_professionals
  DROP CONSTRAINT IF EXISTS unique_kelen_pro_per_project;

DROP INDEX IF EXISTS unique_kelen_pro_per_project;

CREATE UNIQUE INDEX unique_kelen_pro_per_project
  ON project_professionals (project_id, professional_id)
  WHERE professional_id IS NOT NULL;

-- ── 2. Create project_areas table ─────────────────────────────────────────────
-- Stores development areas as persistent DB entities (not ephemeral local state).

CREATE TABLE IF NOT EXISTS project_areas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES user_projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (project_id, name)
);

CREATE INDEX IF NOT EXISTS idx_project_areas_project ON project_areas(project_id, created_at ASC);

-- ── 3. Add project_area_id FK to project_professionals ───────────────────────

ALTER TABLE project_professionals
  ADD COLUMN IF NOT EXISTS project_area_id UUID REFERENCES project_areas(id) ON DELETE SET NULL;

-- ── 4. Migrate existing development_area text → project_areas rows ────────────

INSERT INTO project_areas (project_id, name)
SELECT DISTINCT project_id, development_area
FROM project_professionals
WHERE development_area IS NOT NULL
ON CONFLICT (project_id, name) DO NOTHING;

UPDATE project_professionals pp
SET project_area_id = pa.id
FROM project_areas pa
WHERE pp.project_id = pa.project_id
  AND pp.development_area = pa.name
  AND pp.project_area_id IS NULL;

-- ── 5. RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE project_areas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "areas_own" ON project_areas;
DROP POLICY IF EXISTS "areas_admin" ON project_areas;

CREATE POLICY "areas_own" ON project_areas
  FOR ALL USING (
    project_id IN (SELECT id FROM user_projects WHERE user_id = auth.uid())
  )
  WITH CHECK (
    project_id IN (SELECT id FROM user_projects WHERE user_id = auth.uid())
  );

CREATE POLICY "areas_admin" ON project_areas
  FOR ALL USING (public.has_role('admin'));
