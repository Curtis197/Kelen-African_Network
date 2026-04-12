-- Migration: Fix project-docs bucket MIME types
-- Date: 2026-04-12
-- Issue: Bucket "project-docs" n'a pas de règles de type de fichier configurées
-- Fix: Allow ALL file types (no MIME type restriction)

-- Supabase uses empty array {} to mean "allow all file types"
-- NULL might not work as expected, so we use '{}'
UPDATE storage.buckets
SET allowed_mime_types = '{}'
WHERE id = 'project-docs';

-- Verify the bucket configuration
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'project-docs';
