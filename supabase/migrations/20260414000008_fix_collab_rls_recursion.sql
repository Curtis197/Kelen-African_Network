-- Migration: Fix infinite RLS recursion on project_collaborations
-- Created: 2026-04-14
-- Problem: 42P17 "infinite recursion detected in policy for relation project_collaborations"
--
-- Root cause (cycle):
--   project_logs_collab_pro       → SELECT project_collaborations
--   collab_client_all (on collab) → SELECT user_projects WHERE user_id = auth.uid()
--   user_projects_collab_pro_read → SELECT project_collaborations (loop!)
--
-- Fix: Replace the user_projects policies that reference project_collaborations
-- with calls to a SECURITY DEFINER function, which bypasses RLS on that table
-- and breaks the cycle.

-- ── HELPER FUNCTION ────────────────────────────────────────────────────────────
-- Runs as the function definer (superuser), so RLS on project_collaborations is
-- bypassed → no recursive policy evaluation.
CREATE OR REPLACE FUNCTION public.get_collab_project_ids_for_pro(statuses text[])
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT pc.project_id
  FROM   project_collaborations pc
  JOIN   professionals p ON p.id = pc.professional_id
  WHERE  p.user_id  = auth.uid()
  AND    pc.status  = ANY(statuses)
$$;

-- ── user_projects: drop & recreate offending policies ─────────────────────────
DROP POLICY IF EXISTS user_projects_collab_pro_read  ON public.user_projects;
DROP POLICY IF EXISTS user_projects_collab_pro_write ON public.user_projects;

-- Pros can read a project when they have an active/negotiating/pending collab
CREATE POLICY user_projects_collab_pro_read ON public.user_projects
  FOR SELECT
  USING (
    id IN (
      SELECT get_collab_project_ids_for_pro(ARRAY['pending', 'negotiating', 'active'])
    )
  );

-- Pros can write (logs, steps, docs) only on active collabs
CREATE POLICY user_projects_collab_pro_write ON public.user_projects
  FOR ALL
  USING (
    id IN (
      SELECT get_collab_project_ids_for_pro(ARRAY['active'])
    )
  )
  WITH CHECK (
    id IN (
      SELECT get_collab_project_ids_for_pro(ARRAY['active'])
    )
  );

-- ── project_professionals: same fix ───────────────────────────────────────────
-- The original policy mixed user_projects (which itself hits the cycle) with
-- project_collaborations. Rewrite to use the helper for the pro branch.
DROP POLICY IF EXISTS project_professionals_collab_view ON public.project_professionals;

CREATE POLICY project_professionals_collab_view ON public.project_professionals
  FOR SELECT
  USING (
    -- clients see all rows for their own projects
    project_id IN (SELECT id FROM public.user_projects WHERE user_id = auth.uid())
    OR (
      -- pros see fellow active pros on shared projects
      project_id IN (
        SELECT get_collab_project_ids_for_pro(ARRAY['active'])
      )
      AND selection_status = 'agreed'
    )
  );
