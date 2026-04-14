-- Migration: Create collaboration_messages table
-- Created: 2026-04-14
-- Purpose: Messaging system for collaboration negotiations

CREATE TABLE public.collaboration_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  collaboration_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  sender_role text NOT NULL CHECK (sender_role = ANY (ARRAY['client','professional'])),
  message_type text NOT NULL CHECK (message_type = ANY (ARRAY['proposal','counter_offer','revision_request','acceptance','decline','general'])),
  content text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT collab_messages_pkey PRIMARY KEY (id),
  CONSTRAINT collab_messages_collab_id_fkey FOREIGN KEY (collaboration_id) REFERENCES public.project_collaborations(id) ON DELETE CASCADE,
  CONSTRAINT collab_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id)
);

CREATE INDEX idx_collab_messages_collab ON public.collaboration_messages(collaboration_id);

ALTER TABLE public.collaboration_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY collab_messages_read ON public.collaboration_messages
  FOR SELECT
  USING (
    collaboration_id IN (
      SELECT id FROM public.project_collaborations
      WHERE project_id IN (SELECT id FROM public.user_projects WHERE user_id = auth.uid())
      OR professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid())
    )
  );

CREATE POLICY collab_messages_client_insert ON public.collaboration_messages
  FOR INSERT
  WITH CHECK (
    collaboration_id IN (
      SELECT id FROM public.project_collaborations
      WHERE project_id IN (SELECT id FROM public.user_projects WHERE user_id = auth.uid())
    )
  );

CREATE POLICY collab_messages_pro_insert ON public.collaboration_messages
  FOR INSERT
  WITH CHECK (
    collaboration_id IN (
      SELECT id FROM public.project_collaborations
      WHERE professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid())
    )
  );
