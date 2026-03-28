-- Migration: Create project_steps and project_step_professionals tables
-- Handles the case where tables may already exist from manual creation.

-- ── project_steps ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS project_steps (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES user_projects(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  comment       TEXT,
  status        TEXT NOT NULL DEFAULT 'pending',
  budget        NUMERIC(14,2) NOT NULL DEFAULT 0,
  expenditure   NUMERIC(14,2) NOT NULL DEFAULT 0,
  order_index   INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Fix status constraint to include all valid values (drop and recreate)
ALTER TABLE project_steps DROP CONSTRAINT IF EXISTS project_steps_status_check;
ALTER TABLE project_steps
  ADD CONSTRAINT project_steps_status_check
  CHECK (status IN ('pending', 'in_progress', 'completed', 'on_hold', 'cancelled', 'approved', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_project_steps_project ON project_steps(project_id, order_index ASC);

-- Updated-at trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_project_steps'
  ) THEN
    CREATE TRIGGER set_updated_at_project_steps
      BEFORE UPDATE ON project_steps
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- ── project_step_professionals ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS project_step_professionals (
  step_id                  UUID NOT NULL REFERENCES project_steps(id) ON DELETE CASCADE,
  project_professional_id  UUID NOT NULL REFERENCES project_professionals(id) ON DELETE CASCADE,
  PRIMARY KEY (step_id, project_professional_id)
);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE project_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_step_professionals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies in case of re-run
DROP POLICY IF EXISTS "psteps_own" ON project_steps;
DROP POLICY IF EXISTS "psteps_admin" ON project_steps;
DROP POLICY IF EXISTS "pstep_pros_own" ON project_step_professionals;
DROP POLICY IF EXISTS "pstep_pros_admin" ON project_step_professionals;

CREATE POLICY "psteps_own" ON project_steps
  FOR ALL USING (
    project_id IN (SELECT id FROM user_projects WHERE user_id = auth.uid())
  )
  WITH CHECK (
    project_id IN (SELECT id FROM user_projects WHERE user_id = auth.uid())
  );

CREATE POLICY "psteps_admin" ON project_steps
  FOR ALL USING (public.has_role('admin'));

CREATE POLICY "pstep_pros_own" ON project_step_professionals
  FOR ALL USING (
    step_id IN (
      SELECT ps.id FROM project_steps ps
      JOIN user_projects up ON up.id = ps.project_id
      WHERE up.user_id = auth.uid()
    )
  )
  WITH CHECK (
    step_id IN (
      SELECT ps.id FROM project_steps ps
      JOIN user_projects up ON up.id = ps.project_id
      WHERE up.user_id = auth.uid()
    )
  );

CREATE POLICY "pstep_pros_admin" ON project_step_professionals
  FOR ALL USING (public.has_role('admin'));
