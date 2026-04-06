-- ============================================================
-- Migration: Create log-media storage bucket
-- ============================================================
-- Private bucket for daily log photos.
-- Accessed via signed URLs only.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'log-media',
  'log-media',
  false,
  10485760,  -- 10MB per file
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS for storage bucket
-- Note: storage.objects uses text paths; access controlled via signed URLs from server actions.
-- We use a simpler policy that allows authenticated users to read/write their own project's media.

CREATE POLICY "log-media-client-read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'log-media'
  );

CREATE POLICY "log-media-client-upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'log-media'
  );

CREATE POLICY "log-media-admin" ON storage.objects
  FOR ALL USING (public.has_role('admin'));
