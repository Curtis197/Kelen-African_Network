-- Fix unique_kelen_pro_per_project: drop NULLS NOT DISTINCT constraint,
-- replace with partial index (WHERE professional_id IS NOT NULL)
-- so multiple external professionals (professional_id = NULL) are allowed per project.

ALTER TABLE project_professionals DROP CONSTRAINT IF EXISTS unique_kelen_pro_per_project;
DROP INDEX IF EXISTS unique_kelen_pro_per_project;

CREATE UNIQUE INDEX unique_kelen_pro_per_project
  ON project_professionals (project_id, professional_id)
  WHERE professional_id IS NOT NULL;

-- Create project_areas table for persistent development area storage
CREATE TABLE IF NOT EXISTS project_areas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES user_projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (project_id, name)
);

CREATE INDEX IF NOT EXISTS idx_project_areas_project ON project_areas(project_id, created_at ASC);

-- Link project_professionals to project_areas
ALTER TABLE project_professionals
  ADD COLUMN IF NOT EXISTS project_area_id UUID REFERENCES project_areas(id) ON DELETE SET NULL;

-- Migrate existing development_area text data into project_areas rows
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

-- RLS
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
