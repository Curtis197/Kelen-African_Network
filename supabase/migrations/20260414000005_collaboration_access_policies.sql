-- Migration: Add collaboration RLS policies to existing tables
-- Created: 2026-04-14
-- Purpose: Grant professionals access to client projects based on collaboration status

-- user_projects: pro read (pending, negotiating, active)
CREATE POLICY user_projects_collab_pro_read ON public.user_projects
  FOR SELECT
  USING (
    id IN (
      SELECT pc.project_id FROM public.project_collaborations pc
      WHERE pc.professional_id IN (
        SELECT id FROM public.professionals WHERE user_id = auth.uid()
      )
      AND pc.status IN ('pending', 'negotiating', 'active')
    )
  );

-- user_projects: pro write (active only)
CREATE POLICY user_projects_collab_pro_write ON public.user_projects
  FOR ALL
  USING (
    id IN (
      SELECT pc.project_id FROM public.project_collaborations pc
      WHERE pc.professional_id IN (
        SELECT id FROM public.professionals WHERE user_id = auth.uid()
      )
      AND pc.status = 'active'
    )
  )
  WITH CHECK (
    id IN (
      SELECT pc.project_id FROM public.project_collaborations pc
      WHERE pc.professional_id IN (
        SELECT id FROM public.professionals WHERE user_id = auth.uid()
      )
      AND pc.status = 'active'
    )
  );

-- project_logs: pro access
CREATE POLICY project_logs_collab_pro ON public.project_logs
  FOR ALL
  USING (
    project_id IN (
      SELECT pc.project_id FROM public.project_collaborations pc
      WHERE pc.professional_id IN (
        SELECT id FROM public.professionals WHERE user_id = auth.uid()
      )
      AND pc.status IN ('pending', 'negotiating', 'active')
    )
    OR author_id = auth.uid()
  )
  WITH CHECK (
    project_id IN (
      SELECT pc.project_id FROM public.project_collaborations pc
      WHERE pc.professional_id IN (
        SELECT id FROM public.professionals WHERE user_id = auth.uid()
      )
      AND pc.status = 'active'
    )
    OR author_id = auth.uid()
  );

-- project_steps: pro access
CREATE POLICY project_steps_collab_pro ON public.project_steps
  FOR ALL
  USING (
    project_id IN (
      SELECT pc.project_id FROM public.project_collaborations pc
      WHERE pc.professional_id IN (
        SELECT id FROM public.professionals WHERE user_id = auth.uid()
      )
      AND pc.status IN ('pending', 'negotiating', 'active')
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT pc.project_id FROM public.project_collaborations pc
      WHERE pc.professional_id IN (
        SELECT id FROM public.professionals WHERE user_id = auth.uid()
      )
      AND pc.status = 'active'
    )
  );

-- project_documents: pro access
CREATE POLICY project_documents_collab_pro ON public.project_documents
  FOR ALL
  USING (
    project_id IN (
      SELECT pc.project_id FROM public.project_collaborations pc
      WHERE pc.professional_id IN (
        SELECT id FROM public.professionals WHERE user_id = auth.uid()
      )
      AND pc.status IN ('pending', 'negotiating', 'active')
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT pc.project_id FROM public.project_collaborations pc
      WHERE pc.professional_id IN (
        SELECT id FROM public.professionals WHERE user_id = auth.uid()
      )
      AND pc.status = 'active'
    )
  );

-- project_areas: pro read only
CREATE POLICY project_areas_collab_pro_read ON public.project_areas
  FOR SELECT
  USING (
    project_id IN (
      SELECT pc.project_id FROM public.project_collaborations pc
      WHERE pc.professional_id IN (
        SELECT id FROM public.professionals WHERE user_id = auth.uid()
      )
      AND pc.status IN ('pending', 'negotiating', 'active')
    )
  );

-- project_payments: pro read only (active only)
CREATE POLICY project_payments_collab_pro_read ON public.project_payments
  FOR SELECT
  USING (
    project_id IN (
      SELECT pc.project_id FROM public.project_collaborations pc
      WHERE pc.professional_id IN (
        SELECT id FROM public.professionals WHERE user_id = auth.uid()
      )
      AND pc.status = 'active'
    )
  );

-- project_professionals: active pros see only other active pros
CREATE POLICY project_professionals_collab_view ON public.project_professionals
  FOR SELECT
  USING (
    project_id IN (SELECT id FROM public.user_projects WHERE user_id = auth.uid())
    OR (
      project_id IN (
        SELECT pc.project_id FROM public.project_collaborations pc
        WHERE pc.professional_id IN (
          SELECT id FROM public.professionals WHERE user_id = auth.uid()
        )
        AND pc.status = 'active'
      )
      AND selection_status = 'agreed'
    )
  );
