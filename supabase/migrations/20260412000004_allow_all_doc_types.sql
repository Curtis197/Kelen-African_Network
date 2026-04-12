-- Migration: Allow all file types in project-docs bucket
-- Date: 2026-04-12
-- Issue: PDFs and other documents rejected by project-docs bucket
-- Fix: Remove MIME type restrictions to allow any document type

-- Set allowed_mime_types to empty array = allow all types
UPDATE storage.buckets
SET allowed_mime_types = '{}'
WHERE id = 'project-docs';

-- Also update portfolios bucket to be consistent (allow all types)
UPDATE storage.buckets
SET allowed_mime_types = '{}'
WHERE id = 'portfolios';

-- Verify both buckets
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id IN ('project-docs', 'portfolios');
