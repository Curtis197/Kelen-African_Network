-- ============================================================
-- Migration: Remove NOT NULL constraint on project_logs.project_id
-- ============================================================
-- Issue: project_logs.project_id has NOT NULL constraint which
-- prevents inserting pro_project logs (where project_id should be NULL)
--
-- Solution: Drop NOT NULL constraint to allow NULL values
-- for pro_project logs that use pro_project_id instead

-- ── Remove NOT NULL constraint on project_id ──

ALTER TABLE project_logs
  ALTER COLUMN project_id DROP NOT NULL;
