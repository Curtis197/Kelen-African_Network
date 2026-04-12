-- ============================================================
-- Google Business Profile Integration
-- Migration: 20260412000001_google_business_integration.sql
-- ============================================================

-- Table: pro_google_tokens
-- Stores OAuth tokens and GBP location identifiers per professional
CREATE TABLE IF NOT EXISTS pro_google_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pro_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expiry_date BIGINT,
  gbp_account_name TEXT,       -- e.g. "accounts/123456789"
  gbp_location_name TEXT,      -- e.g. "accounts/123456789/locations/987654321"
  gbp_place_id TEXT,           -- Google Maps Place ID for review links
  verification_status TEXT DEFAULT 'PENDING', -- PENDING | VERIFIED | FAILED
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ,
  UNIQUE(pro_id)
);

ALTER TABLE pro_google_tokens ENABLE ROW LEVEL SECURITY;

-- Only the authenticated pro can read their own tokens
CREATE POLICY "pro_google_tokens_select_own"
  ON pro_google_tokens FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM professionals p
      WHERE p.id = pro_id
        AND p.user_id = auth.uid()
    )
  );

-- Only the authenticated pro can insert their own tokens
CREATE POLICY "pro_google_tokens_insert_own"
  ON pro_google_tokens FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM professionals p
      WHERE p.id = pro_id
        AND p.user_id = auth.uid()
    )
  );

-- Only the authenticated pro can update their own tokens
CREATE POLICY "pro_google_tokens_update_own"
  ON pro_google_tokens FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM professionals p
      WHERE p.id = pro_id
        AND p.user_id = auth.uid()
    )
  );

-- Admins can read all tokens
CREATE POLICY "pro_google_tokens_admin_select"
  ON pro_google_tokens FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role = 'admin'
    )
  );

-- ============================================================

-- Table: pro_google_reviews_cache
-- Caches Google Places API reviews to avoid API calls on every page load
CREATE TABLE IF NOT EXISTS pro_google_reviews_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pro_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  place_id TEXT NOT NULL,
  rating DECIMAL(2,1),
  total_reviews INTEGER DEFAULT 0,
  reviews JSONB DEFAULT '[]',
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pro_id)
);

ALTER TABLE pro_google_reviews_cache ENABLE ROW LEVEL SECURITY;

-- Reviews cache is public (portfolio pages are public)
CREATE POLICY "pro_google_reviews_cache_public_select"
  ON pro_google_reviews_cache FOR SELECT
  USING (true);

-- Only service role or the pro themselves can upsert cache
CREATE POLICY "pro_google_reviews_cache_insert_own"
  ON pro_google_reviews_cache FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM professionals p
      WHERE p.id = pro_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "pro_google_reviews_cache_update_own"
  ON pro_google_reviews_cache FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM professionals p
      WHERE p.id = pro_id
        AND p.user_id = auth.uid()
    )
  );
