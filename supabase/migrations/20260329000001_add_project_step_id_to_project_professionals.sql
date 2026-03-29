-- Add project_step_id directly on project_professionals so each team member
-- can be assigned to a specific project step without a junction table.
ALTER TABLE project_professionals
  ADD COLUMN IF NOT EXISTS project_step_id UUID REFERENCES project_steps(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pp_step ON project_professionals(project_step_id);

-- Migrate existing assignments from the junction table
UPDATE project_professionals pp
SET project_step_id = psp.step_id
FROM project_step_professionals psp
WHERE psp.project_professional_id = pp.id;
