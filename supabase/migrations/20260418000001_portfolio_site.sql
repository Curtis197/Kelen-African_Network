-- supabase/migrations/20260418000001_portfolio_site.sql

-- Style quiz result stored as CSS token map
ALTER TABLE professional_portfolio
  ADD COLUMN IF NOT EXISTS style_tokens      JSONB    NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS copy_quiz_answers JSONB    NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS hero_subtitle     TEXT,
  ADD COLUMN IF NOT EXISTS custom_domain     TEXT     UNIQUE,
  ADD COLUMN IF NOT EXISTS domain_status     TEXT     CHECK (domain_status IN (
    'pending_purchase', 'purchased', 'pending_dns', 'active', 'failed'
  )),
  ADD COLUMN IF NOT EXISTS domain_purchased_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS domain_activated_at  TIMESTAMPTZ;

-- Index for fast hostname lookup in middleware
CREATE INDEX IF NOT EXISTS idx_portfolio_custom_domain
  ON professional_portfolio(custom_domain)
  WHERE custom_domain IS NOT NULL;
