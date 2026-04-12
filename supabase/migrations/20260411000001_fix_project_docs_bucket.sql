-- Migration: Fix project-docs bucket MIME types
-- Date: 2026-04-11
-- Issue: Bucket "project-docs" n'a pas de règles de type de fichier configurées

-- Update the bucket to ensure allowed_mime_types is properly set
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['application/pdf','image/jpeg','image/png','image/webp']
WHERE id = 'project-docs';

-- Verify the bucket configuration
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'project-docs';
