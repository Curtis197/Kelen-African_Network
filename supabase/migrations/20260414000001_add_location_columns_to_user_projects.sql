-- Migration: Add structured location columns to user_projects
-- Date: 2026-04-14
-- Issue: EditClientProjectPage was failing because location_lat, location_lng, location_country, location_formatted columns didn't exist

ALTER TABLE public.user_projects
  ADD COLUMN IF NOT EXISTS location_lat numeric,
  ADD COLUMN IF NOT EXISTS location_lng numeric,
  ADD COLUMN IF NOT EXISTS location_country text,
  ADD COLUMN IF NOT EXISTS location_formatted text;

-- Add comments for documentation
COMMENT ON COLUMN public.user_projects.location_lat IS 'GPS latitude coordinate';
COMMENT ON COLUMN public.user_projects.location_lng IS 'GPS longitude coordinate';
COMMENT ON COLUMN public.user_projects.location_country IS 'Country name from geocoding';
COMMENT ON COLUMN public.user_projects.location_formatted IS 'Full formatted address from Google Maps';
