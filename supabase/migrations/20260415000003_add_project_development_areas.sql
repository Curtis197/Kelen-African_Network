-- Migration: Add development_areas array to user_projects
-- Purpose: Allow users to pre-define areas for their project
-- Date: 2026-04-15

-- Add development_areas column (text array)
ALTER TABLE public.user_projects
ADD COLUMN IF NOT EXISTS development_areas TEXT[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN public.user_projects.development_areas IS 'Pre-defined development areas for the project (e.g., ["Architecture", "Construction"])';

-- Update existing projects with areas from project_professionals
UPDATE public.user_projects up
SET development_areas = (
  SELECT ARRAY(
    SELECT DISTINCT development_area
    FROM public.project_professionals pp
    WHERE pp.project_id = up.id
      AND pp.development_area IS NOT NULL
    ORDER BY 1
  )
)
WHERE EXISTS (
  SELECT 1
  FROM public.project_professionals pp
  WHERE pp.project_id = up.id
    AND pp.development_area IS NOT NULL
);

-- Create index for faster array lookups
CREATE INDEX IF NOT EXISTS idx_user_projects_development_areas
ON public.user_projects USING gin(development_areas);
