-- Migration: Add new selection statuses to project_professionals
-- Created: 2026-04-14
-- Purpose: Add 'agreed' and 'not_selected' to selection_status constraint

ALTER TABLE public.project_professionals
  DROP CONSTRAINT IF EXISTS project_professionals_selection_status_check;

ALTER TABLE public.project_professionals
  ADD CONSTRAINT project_professionals_selection_status_check
  CHECK (selection_status = ANY (ARRAY[
    'candidate'::text,
    'shortlisted'::text,
    'finalist'::text,
    'agreed'::text,
    'not_selected'::text
  ]));
