-- Allow the same professional to be added to multiple areas in the same project.
-- Old index was (project_id, professional_id) — too restrictive.
-- New index is (project_id, professional_id, development_area) — one entry per pro per area.
DROP INDEX IF EXISTS unique_kelen_pro_per_project;

CREATE UNIQUE INDEX unique_kelen_pro_per_project
  ON project_professionals (project_id, professional_id, development_area)
  WHERE professional_id IS NOT NULL;
