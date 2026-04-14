-- Migration: Allow pros to read comments on their own realizations
-- Created: 2026-04-14
-- Purpose: Pro inbox needs to display pending/all comments for moderation
-- Gap: existing policy realization_comments_public_browse only allows SELECT for status='approved'
--      Pros need to see ALL statuses (pending, approved, rejected) on their own realizations

CREATE POLICY realization_comments_pro_read ON public.realization_comments
  FOR SELECT
  USING (
    realization_id IN (
      SELECT pr.id
      FROM   professional_realizations pr
      JOIN   professionals p ON p.id = pr.professional_id
      WHERE  p.user_id = auth.uid()
    )
  );
