-- ============================================================
-- Migration 005: Subscriptions
-- ============================================================
-- Flat-rate Stripe subscriptions replace the removed CPM model.
--   pro_africa → 3 000 FCFA/month
--   pro_europe → €15/month
--
-- INSERT/UPDATE is managed exclusively by the Stripe webhook
-- handler (service role). Frontend only reads.

CREATE TABLE subscriptions (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id        UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,

  -- Stripe references
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id     TEXT,

  -- Plan and status
  plan                   TEXT NOT NULL CHECK (plan IN ('pro_africa', 'pro_europe')),
  status                 TEXT NOT NULL DEFAULT 'trialing'
                           CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),

  -- Billing period
  current_period_start   TIMESTAMPTZ,
  current_period_end     TIMESTAMPTZ,
  cancel_at_period_end   BOOLEAN DEFAULT FALSE,
  canceled_at            TIMESTAMPTZ,

  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_professional ON subscriptions(professional_id);
CREATE INDEX idx_subscriptions_stripe       ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status       ON subscriptions(status);

CREATE TRIGGER set_updated_at_subscriptions
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Row Level Security ─────────────────────────────────────

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Pro: read own subscription
CREATE POLICY "subscriptions_select_own" ON subscriptions
  FOR SELECT USING (
    professional_id IN (
      SELECT id FROM professionals WHERE user_id = auth.uid()
    )
  );

-- Admin: full access
CREATE POLICY "subscriptions_admin_all" ON subscriptions
  FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Note: INSERT and UPDATE are performed via service role by the Stripe webhook.
-- No frontend INSERT/UPDATE policy is defined intentionally.
