-- Migration: Create project_collaborations table
-- Created: 2026-04-14
-- Purpose: Track collaboration pipeline between clients and professionals

CREATE TABLE public.project_collaborations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  professional_id uuid NOT NULL,
  project_professional_id uuid NOT NULL,
  pro_project_id uuid,
  status text NOT NULL DEFAULT 'pending'::text
    CHECK (status = ANY (ARRAY['pending','negotiating','active','declined','not_picked','suspended','terminated'])),
  proposal_text text,
  proposal_budget numeric,
  proposal_currency text DEFAULT 'XOF'::text,
  proposal_timeline text,
  proposal_submitted_at timestamp with time zone,
  agreed_price numeric,
  agreed_start_date date,
  agreed_end_date date,
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  decline_reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT project_collaborations_pkey PRIMARY KEY (id),
  CONSTRAINT fk_collab_project FOREIGN KEY (project_id) REFERENCES public.user_projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_collab_professional FOREIGN KEY (professional_id) REFERENCES public.professionals(id) ON DELETE CASCADE,
  CONSTRAINT fk_collab_project_prof FOREIGN KEY (project_professional_id) REFERENCES public.project_professionals(id) ON DELETE CASCADE,
  CONSTRAINT fk_collab_pro_project FOREIGN KEY (pro_project_id) REFERENCES public.pro_projects(id) ON DELETE SET NULL
);

CREATE INDEX idx_collab_project ON public.project_collaborations(project_id);
CREATE INDEX idx_collab_professional ON public.project_collaborations(professional_id);
CREATE INDEX idx_collab_status ON public.project_collaborations(status);

ALTER TABLE public.project_collaborations ENABLE ROW LEVEL SECURITY;

CREATE POLICY collab_client_all ON public.project_collaborations
  FOR ALL
  USING (project_id IN (SELECT id FROM public.user_projects WHERE user_id = auth.uid()))
  WITH CHECK (project_id IN (SELECT id FROM public.user_projects WHERE user_id = auth.uid()));

CREATE POLICY collab_pro_read ON public.project_collaborations
  FOR SELECT
  USING (professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid()));

CREATE POLICY collab_pro_update ON public.project_collaborations
  FOR UPDATE
  USING (professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid()))
  WITH CHECK (professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid()));
