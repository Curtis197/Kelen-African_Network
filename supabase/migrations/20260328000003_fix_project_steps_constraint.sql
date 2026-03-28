-- Fix project_steps status constraint
-- The original table was manually created with French status values.
-- Drop old constraint with French values and replace with correct English values.

ALTER TABLE project_steps DROP CONSTRAINT IF EXISTS project_steps_status_check;

ALTER TABLE project_steps
  ADD CONSTRAINT project_steps_status_check
  CHECK (status IN ('pending', 'in_progress', 'completed', 'on_hold', 'cancelled', 'approved', 'rejected'));

ALTER TABLE project_steps ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE project_steps ALTER COLUMN project_id SET NOT NULL;
