-- Add location coordinate columns to user_projects table
ALTER TABLE user_projects 
  ADD COLUMN IF NOT EXISTS location_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS location_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS location_country TEXT,
  ADD COLUMN IF NOT EXISTS location_formatted TEXT;

-- Add location coordinate columns to professionals table
ALTER TABLE professionals 
  ADD COLUMN IF NOT EXISTS location_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS location_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS location_country TEXT,
  ADD COLUMN IF NOT EXISTS location_formatted TEXT;

-- Add index for location-based queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_projects_location ON user_projects(location_lat, location_lng);
CREATE INDEX IF NOT EXISTS idx_Professionals_location ON professionals(location_lat, location_lng);
