-- Migration: Add video support to professional realizations
-- Date: 2026-04-13
-- Description: Create realization_videos table to store video URLs for professional realizations

-- Create realization_videos table
CREATE TABLE IF NOT EXISTS realization_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  realization_id uuid NOT NULL REFERENCES professional_realizations(id) ON DELETE CASCADE,
  url text NOT NULL,
  thumbnail_url text, -- Optional thumbnail generated from video
  duration integer, -- Duration in seconds
  order_index integer DEFAULT 0, -- Order for multiple videos
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_realization_videos_realization_id ON realization_videos(realization_id);
CREATE INDEX IF NOT EXISTS idx_realization_videos_order ON realization_videos(realization_id, order_index);

-- Add RLS policies
ALTER TABLE realization_videos ENABLE ROW LEVEL SECURITY;

-- Policy: Professionals can insert videos for their own realizations
CREATE POLICY "realization_videos_insert_own"
  ON realization_videos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM professional_realizations pr
      JOIN professionals p ON pr.professional_id = p.id
      WHERE pr.id = realization_videos.realization_id
      AND p.user_id = auth.uid()
    )
  );

-- Policy: Professionals can update videos for their own realizations
CREATE POLICY "realization_videos_update_own"
  ON realization_videos
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM professional_realizations pr
      JOIN professionals p ON pr.professional_id = p.id
      WHERE pr.id = realization_videos.realization_id
      AND p.user_id = auth.uid()
    )
  );

-- Policy: Professionals can delete videos for their own realizations
CREATE POLICY "realization_videos_delete_own"
  ON realization_videos
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM professional_realizations pr
      JOIN professionals p ON pr.professional_id = p.id
      WHERE pr.id = realization_videos.realization_id
      AND p.user_id = auth.uid()
    )
  );

-- Policy: Public can view videos (for public portfolio pages)
CREATE POLICY "realization_videos_public_view"
  ON realization_videos
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM professional_realizations pr
      JOIN professionals p ON pr.professional_id = p.id
      WHERE pr.id = realization_videos.realization_id
      AND p.is_visible = true
    )
  );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_realization_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_realization_videos_updated_at
  BEFORE UPDATE ON realization_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_realization_videos_updated_at();
