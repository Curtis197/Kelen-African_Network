-- Migration: Add client access to project_documents
-- Date: 2026-04-12
-- Issue: Clients can't INSERT documents into project_documents (only pros can)
-- Fix: Add policies for clients to manage documents on their own projects

-- Allow clients to INSERT documents for their own projects
CREATE POLICY "pdocs_client_insert" ON project_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT id FROM user_projects WHERE user_id = auth.uid()
    )
    OR
    professional_id IN (
      SELECT id FROM professionals WHERE user_id = auth.uid()
    )
  );

-- Allow clients to SELECT documents from their own projects
CREATE POLICY "pdocs_client_select" ON project_documents
  FOR SELECT TO authenticated
  USING (
    project_id IN (
      SELECT id FROM user_projects WHERE user_id = auth.uid()
    )
    OR
    professional_id IN (
      SELECT id FROM professionals WHERE user_id = auth.uid()
    )
  );

-- Allow clients to UPDATE documents they own
CREATE POLICY "pdocs_client_update" ON project_documents
  FOR UPDATE TO authenticated
  USING (
    project_id IN (
      SELECT id FROM user_projects WHERE user_id = auth.uid()
    )
    OR
    professional_id IN (
      SELECT id FROM professionals WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM user_projects WHERE user_id = auth.uid()
    )
    OR
    professional_id IN (
      SELECT id FROM professionals WHERE user_id = auth.uid()
    )
  );

-- Allow clients to DELETE documents they own
CREATE POLICY "pdocs_client_delete" ON project_documents
  FOR DELETE TO authenticated
  USING (
    project_id IN (
      SELECT id FROM user_projects WHERE user_id = auth.uid()
    )
    OR
    professional_id IN (
      SELECT id FROM professionals WHERE user_id = auth.uid()
    )
  );
