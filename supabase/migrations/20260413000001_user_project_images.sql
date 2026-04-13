-- Migration: user_project_images table
-- Date: 2026-04-13
-- Purpose: Enable client image management for their user_projects

-- ── 1. Create table ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_project_images (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  url text NOT NULL,
  is_main boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_project_images_pkey PRIMARY KEY (id),
  CONSTRAINT user_project_images_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.user_projects(id) ON DELETE CASCADE
);

-- ── 2. Indexes ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_user_project_images_project ON public.user_project_images(project_id);
CREATE INDEX IF NOT EXISTS idx_user_project_images_is_main ON public.user_project_images(is_main) WHERE is_main = true;

-- ── 3. Enable RLS ────────────────────────────────────────────────────────────
ALTER TABLE public.user_project_images ENABLE ROW LEVEL SECURITY;

-- ── 4. RLS Policies ──────────────────────────────────────────────────────────

-- Policy: users can read images for their own projects
CREATE POLICY "upimages_user_read_own"
  ON public.user_project_images
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.user_projects WHERE user_id = auth.uid()
    )
  );

-- Policy: users can insert images for their own projects
CREATE POLICY "upimages_user_insert_own"
  ON public.user_project_images
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.user_projects WHERE user_id = auth.uid()
    )
  );

-- Policy: users can update images for their own projects
CREATE POLICY "upimages_user_update_own"
  ON public.user_project_images
  FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM public.user_projects WHERE user_id = auth.uid()
    )
  );

-- Policy: users can delete images for their own projects
CREATE POLICY "upimages_user_delete_own"
  ON public.user_project_images
  FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM public.user_projects WHERE user_id = auth.uid()
    )
  );

-- Policy: public read (images are viewable by anyone with project access)
CREATE POLICY "upimages_public_read"
  ON public.user_project_images
  FOR SELECT
  USING (true);

-- Policy: admin full access
CREATE POLICY "upimages_admin_all"
  ON public.user_project_images
  FOR ALL
  TO authenticated
  USING (public.has_role('admin'::text))
  WITH CHECK (public.has_role('admin'::text));
