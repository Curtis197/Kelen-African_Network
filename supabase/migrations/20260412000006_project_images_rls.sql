-- Migration: 20260412000006
-- Purpose: Add RLS policies for project_images INSERT/UPDATE/DELETE operations
-- Date: 2026-04-12
-- Issue: project_images table only had SELECT policy (public read), no write policies
-- Fix: Add INSERT/UPDATE/DELETE policies for professionals and admin

-- Enable RLS on project_images if not already enabled
ALTER TABLE public.project_images ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (except public read)
DROP POLICY IF EXISTS "project_images_professional_insert" ON public.project_images;
DROP POLICY IF EXISTS "project_images_professional_update" ON public.project_images;
DROP POLICY IF EXISTS "project_images_professional_delete" ON public.project_images;
DROP POLICY IF EXISTS "pimages_admin_all" ON public.project_images;

-- Policy 1: Professionals can INSERT images on their own project_documents
CREATE POLICY "pimages_professional_insert"
ON public.project_images
FOR INSERT
TO authenticated
WITH CHECK (
  professional_id IN (
    SELECT id FROM public.professionals
    WHERE user_id = auth.uid()
  )
);

-- Policy 2: Professionals can UPDATE images on their own project_documents
CREATE POLICY "pimages_professional_update"
ON public.project_images
FOR UPDATE
TO authenticated
USING (
  professional_id IN (
    SELECT id FROM public.professionals
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  professional_id IN (
    SELECT id FROM public.professionals
    WHERE user_id = auth.uid()
  )
);

-- Policy 3: Professionals can DELETE images on their own project_documents
CREATE POLICY "pimages_professional_delete"
ON public.project_images
FOR DELETE
TO authenticated
USING (
  professional_id IN (
    SELECT id FROM public.professionals
    WHERE user_id = auth.uid()
  )
);

-- Policy 4: Admin can do ALL operations on project_images
CREATE POLICY "pimages_admin_all"
ON public.project_images
FOR ALL
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  )
);

-- Note: Public SELECT policy already exists (created in migration 20260410000005)
-- Verify it's still in place
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'project_images' 
    AND policyname LIKE '%public%' 
    AND cmd = 'SELECT'
  ) THEN
    -- Create public read policy if missing
    CREATE POLICY "pimages_public_read"
    ON public.project_images
    FOR SELECT
    TO public
    USING (true);
  END IF;
END $$;
