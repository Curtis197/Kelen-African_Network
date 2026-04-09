-- ============================================================
-- Migration: Add INSERT policy for professional journal logs
-- ============================================================
-- Issue: Missing INSERT policy causes "new row violates 
-- row-level security policy" error when professionals try 
-- to create new journal logs on their pro_projects

-- ── project_logs: Add INSERT policy for professionals ──

-- Drop the old insert policy if it still exists
DROP POLICY IF EXISTS "logs_pro_create" ON project_logs;

-- Create comprehensive INSERT policy for professionals
-- Professionals can create logs on:
-- 1. Their own pro_projects (via pro_project_id)
-- 2. Client projects they're assigned to (via project_id)
CREATE POLICY "logs_pro_create_on_projects" ON project_logs
  FOR INSERT WITH CHECK (
    -- Can create on their own pro_projects
    pro_project_id IN (
      SELECT pp.id FROM pro_projects pp
      JOIN professionals p ON pp.professional_id = p.id
      WHERE p.user_id = auth.uid()
    )
    OR
    -- Can create on client projects they're assigned to
    project_id IN (
      SELECT up.id FROM user_projects up
      JOIN project_professionals ppj ON up.id = ppj.project_id
      JOIN professionals p ON ppj.professional_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );
