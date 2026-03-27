-- Migration: Universal Project Comparison Engine
-- Relaxing existing category constraints and adding multi-area support

-- 1. Relax user_projects category constraint
ALTER TABLE public.user_projects DROP CONSTRAINT IF EXISTS user_projects_category_check;
-- No new constraint, allow any text for universal scope.

-- 2. Relax project_professionals external_category constraint
ALTER TABLE public.project_professionals DROP CONSTRAINT IF EXISTS project_professionals_external_category_check;

-- 3. Add development_area column to project_professionals
ALTER TABLE public.project_professionals ADD COLUMN IF NOT EXISTS development_area TEXT;

-- 4. Add rank_order column for comparison
ALTER TABLE public.project_professionals ADD COLUMN IF NOT EXISTS rank_order INTEGER DEFAULT 0;

-- 5. Add selection_status column
-- Allowed values: candidate, shortlisted, finalist
ALTER TABLE public.project_professionals ADD COLUMN IF NOT EXISTS selection_status TEXT DEFAULT 'candidate';
ALTER TABLE public.project_professionals DROP CONSTRAINT IF EXISTS project_professionals_selection_status_check;
ALTER TABLE public.project_professionals ADD CONSTRAINT project_professionals_selection_status_check 
    CHECK (selection_status IN ('candidate', 'shortlisted', 'finalist'));

-- 6. Update existing project_professionals to have a default development_area if missing
-- We can set it to the project category if it's currently null
UPDATE public.project_professionals pp
SET development_area = up.category
FROM public.user_projects up
WHERE pp.project_id = up.id AND pp.development_area IS NULL;

-- If still null, set to 'Autre'
UPDATE public.project_professionals
SET development_area = 'Autre'
WHERE development_area IS NULL;
