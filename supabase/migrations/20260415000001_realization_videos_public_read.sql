-- Migration: Public read access for realization videos
-- Date: 2026-04-15
-- Problem: realization_videos had no equivalent of the "Public read for realization images"
--          policy (USING true) that exists on realization_images. This caused videos to be
--          invisible whenever professionals.is_visible = false, even though images on the
--          same realizations were fully accessible.
-- Fix: Add the same permissive public SELECT policy so videos are equally accessible.

CREATE POLICY "Public read for realization videos"
  ON realization_videos
  FOR SELECT
  TO public
  USING (true);
