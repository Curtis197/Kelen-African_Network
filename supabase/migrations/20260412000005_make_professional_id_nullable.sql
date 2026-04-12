-- Migration: Make professional_id nullable in project_documents
-- Date: 2026-04-12
-- Issue: Clients can't upload documents because professional_id is required (NOT NULL)
-- Fix: Allow NULL professional_id — documents can belong to just a project without a pro

ALTER TABLE project_documents
ALTER COLUMN professional_id DROP NOT NULL;

-- Verify the change
SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'project_documents'
  AND column_name = 'professional_id';
