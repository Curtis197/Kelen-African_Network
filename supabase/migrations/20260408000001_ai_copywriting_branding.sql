-- Migration: Add AI copywriting questionnaire fields + brand color fields
-- Created: 2026-04-08

ALTER TABLE professionals
  -- AI copywriting questionnaire
  ADD COLUMN IF NOT EXISTS ai_values TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_qualities TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_relationship_style TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ai_communication_freq TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ai_proudest_project TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ai_limits_refused TEXT[] DEFAULT '{}',

  -- AI-generated copy
  ADD COLUMN IF NOT EXISTS bio_accroche TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS bio_presentation TEXT DEFAULT NULL,

  -- Brand colors (from logo)
  ADD COLUMN IF NOT EXISTS brand_primary TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS brand_secondary TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS brand_accent TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS logo_storage_path TEXT DEFAULT NULL;
