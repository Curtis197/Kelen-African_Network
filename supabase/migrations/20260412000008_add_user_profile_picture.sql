-- ============================================================
-- Migration: Add profile_picture_url to users table
-- ============================================================
-- Allows storing Google OAuth avatar URLs for client users
-- (professionals already have this field in their table)

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Add index for faster queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_users_profile_picture ON public.users(profile_picture_url) 
WHERE profile_picture_url IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.users.profile_picture_url IS 'Profile picture/avatar URL from OAuth provider (Google) or uploaded image';
