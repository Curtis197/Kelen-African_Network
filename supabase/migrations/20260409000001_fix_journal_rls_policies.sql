-- ============================================================
-- Migration: Fix Journal RLS Policies for Professional Projects
-- ============================================================
-- Issue: Professionals cannot read journal logs on their pro_projects
-- because the current logs_pro_read policy only allows reading
-- logs where author_id = auth.uid()
-- 
-- This migration adds policies to allow professionals to:
-- 1. READ all logs on their pro_projects (via pro_project_id)
-- 2. UPDATE logs on their pro_projects
-- 3. DELETE logs on their pro_projects
-- 4. Access media and comments on their pro_project logs

-- ── project_logs: Professional access to pro_project logs ──

-- Drop the old restrictive read policy
DROP POLICY IF EXISTS "logs_pro_read" ON project_logs;

-- Drop the old insert policy if it exists
DROP POLICY IF EXISTS "logs_pro_create" ON project_logs;

-- Create new comprehensive read policy for professionals
-- Professionals can read ALL logs on their pro_projects
CREATE POLICY "logs_pro_read_own_projects" ON project_logs
  FOR SELECT USING (
    pro_project_id IN (
      SELECT pp.id FROM pro_projects pp
      JOIN professionals p ON pp.professional_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- Allow professionals to INSERT (create) logs on their pro_projects
CREATE POLICY "logs_pro_create_own_projects" ON project_logs
  FOR INSERT WITH CHECK (
    pro_project_id IN (
      SELECT pp.id FROM pro_projects pp
      JOIN professionals p ON pp.professional_id = p.id
      WHERE p.user_id = auth.uid()
    )
    OR project_id IN (
      SELECT up.id FROM user_projects up
      JOIN project_professionals ppj ON up.id = ppj.project_id
      JOIN professionals p ON ppj.professional_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- Allow professionals to update logs on their pro_projects
DROP POLICY IF EXISTS "logs_pro_update" ON project_logs;

CREATE POLICY "logs_pro_update_own_projects" ON project_logs
  FOR UPDATE USING (
    pro_project_id IN (
      SELECT pp.id FROM pro_projects pp
      JOIN professionals p ON pp.professional_id = p.id
      WHERE p.user_id = auth.uid()
    )
    OR author_id = auth.uid()
  )
  WITH CHECK (
    pro_project_id IN (
      SELECT pp.id FROM pro_projects pp
      JOIN professionals p ON pp.professional_id = p.id
      WHERE p.user_id = auth.uid()
    )
    OR author_id = auth.uid()
  );

-- Allow professionals to delete logs on their pro_projects
CREATE POLICY "logs_pro_delete_own_projects" ON project_logs
  FOR DELETE USING (
    pro_project_id IN (
      SELECT pp.id FROM pro_projects pp
      JOIN professionals p ON pp.professional_id = p.id
      WHERE p.user_id = auth.uid()
    )
    OR author_id = auth.uid()
  );

-- ── project_log_media: Professional access to media on pro_projects ──

DROP POLICY IF EXISTS "media_pro_own" ON project_log_media;

CREATE POLICY "media_pro_own_projects" ON project_log_media
  FOR ALL USING (
    log_id IN (
      SELECT pl.id FROM project_logs pl
      WHERE pl.pro_project_id IN (
        SELECT pp.id FROM pro_projects pp
        JOIN professionals p ON pp.professional_id = p.id
        WHERE p.user_id = auth.uid()
      )
      OR pl.author_id = auth.uid()
    )
  )
  WITH CHECK (
    log_id IN (
      SELECT pl.id FROM project_logs pl
      WHERE pl.pro_project_id IN (
        SELECT pp.id FROM pro_projects pp
        JOIN professionals p ON pp.professional_id = p.id
        WHERE p.user_id = auth.uid()
      )
      OR pl.author_id = auth.uid()
    )
  );

-- ── project_log_comments: Professional access to comments on pro_projects ──

DROP POLICY IF EXISTS "comments_pro_read" ON project_log_comments;

CREATE POLICY "comments_pro_read_own_projects" ON project_log_comments
  FOR SELECT USING (
    log_id IN (
      SELECT pl.id FROM project_logs pl
      WHERE pl.pro_project_id IN (
        SELECT pp.id FROM pro_projects pp
        JOIN professionals p ON pp.professional_id = p.id
        WHERE p.user_id = auth.uid()
      )
      OR pl.author_id = auth.uid()
    )
  );

-- Allow professionals to create comments on their pro_project logs
CREATE POLICY "comments_pro_create_own_projects" ON project_log_comments
  FOR INSERT WITH CHECK (
    log_id IN (
      SELECT pl.id FROM project_logs pl
      WHERE pl.pro_project_id IN (
        SELECT pp.id FROM pro_projects pp
        JOIN professionals p ON pp.professional_id = p.id
        WHERE p.user_id = auth.uid()
      )
      OR pl.author_id = auth.uid()
    )
  );

-- Allow professionals to update/delete their own comments
CREATE POLICY "comments_pro_manage_own" ON project_log_comments
  FOR ALL USING (author_id = auth.uid());
