-- Migration: add featured_review_ids to pro_google_reviews_cache
-- Allows professionals to pin which Google reviews appear on their public profile and portfolio.
-- featured_review_ids is a JSONB array of author_name strings (empty = show all).

ALTER TABLE pro_google_reviews_cache
  ADD COLUMN IF NOT EXISTS featured_review_ids JSONB DEFAULT '[]'::jsonb;
