-- Migration: Add collaboration notification types
-- Created: 2026-04-14
-- Purpose: Extend notifications enum to include collaboration events

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type = ANY (ARRAY[
    'log_created'::text,
    'log_approved'::text,
    'log_contested'::text,
    'log_resolved'::text,
    'project_assigned'::text,
    'new_recommendation'::text,
    'new_signal'::text,
    'status_changed'::text,
    'subscription_activated'::text,
    'subscription_expired'::text,
    'finalist_selected'::text,
    'proposal_submitted'::text,
    'revision_requested'::text,
    'proposal_accepted'::text,
    'proposal_declined'::text,
    'collaboration_declined'::text,
    'collaboration_activated'::text,
    'collaboration_terminated'::text
  ]));
