-- Migration: Allow professionals to SELECT their own realization videos
-- Date: 2026-04-14
-- Problem: realization_videos only has a public SELECT policy gated on p.is_visible = true.
--          Professionals with is_visible = false cannot read their own videos, breaking the
--          edit form and management pages.
-- Fix: Add a dedicated SELECT policy (matching the pattern of realization_images_pro_manage)
--      so pros can always read videos on their own realizations regardless of visibility.

CREATE POLICY "realization_videos_pro_select_own"
  ON realization_videos
  FOR SELECT
  TO authenticated
  USING (
    realization_id IN (
      SELECT pr.id
      FROM   professional_realizations pr
      JOIN   professionals p ON p.id = pr.professional_id
      WHERE  p.user_id = auth.uid()
    )
  );
