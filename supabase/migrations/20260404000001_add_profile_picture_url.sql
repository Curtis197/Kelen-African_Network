-- Migration: Add missing profile_picture_url column to professionals
-- This column was added manually and is now documented here.

ALTER TABLE professionals
  ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
