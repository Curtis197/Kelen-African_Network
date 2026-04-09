-- ============================================================
-- Migration: Fix RLS SELECT policy for pro_project logs
-- ============================================================
-- Issue: getLogById returns no data for pro_project logs
-- The current policy may not be matching correctly

-- Drop the existing read policy for professionals
DROP POLICY IF EXISTS "logs_pro_read_own_projects" ON project_logs;

-- Recreate with simplified logic that checks both ownership and assignment
CREATE POLICY "logs_pro_read_own_projects_v2" ON project_logs
  FOR SELECT USING (
    -- Can read logs on their own pro_projects
    pro_project_id IN (
      SELECT pp.id FROM pro_projects pp
      JOIN professionals p ON pp.professional_id = p.id
      WHERE p.user_id = auth.uid()
    )
    OR
    -- Can read logs they authored (on client projects)
    author_id = auth.uid()
    OR
    -- Can read logs on client projects they're assigned to
    project_id IN (
      SELECT up.id FROM user_projects up
      JOIN project_professionals ppj ON up.id = ppj.project_id
      JOIN professionals p ON ppj.professional_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );
