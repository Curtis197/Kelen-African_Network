-- Migration: Replace Stripe with Flutterwave + Orange Money
-- Renames stripe_* tables/columns to provider-agnostic names.

-- ── 1. payment_accounts (was stripe_connect_accounts) ─────────────────
ALTER TABLE stripe_connect_accounts RENAME TO payment_accounts;
ALTER TABLE payment_accounts RENAME COLUMN stripe_account_id TO flw_subaccount_id;

-- Allow NULL on old NOT NULL column so account can exist before FLW subaccount is created
ALTER TABLE payment_accounts ALTER COLUMN flw_subaccount_id DROP NOT NULL;

-- Orange Money merchant phone number (for receiving split payouts)
ALTER TABLE payment_accounts ADD COLUMN IF NOT EXISTS orange_merchant_number text;

-- ── 2. payments table ─────────────────────────────────────────────────
ALTER TABLE payments RENAME COLUMN stripe_payment_intent   TO provider_tx_id;
ALTER TABLE payments RENAME COLUMN stripe_checkout_session TO provider_session_id;

-- Track which gateway handled the payment
ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'flutterwave'
  CHECK (provider IN ('flutterwave', 'orange_money'));

-- ── 3. subscriptions table ────────────────────────────────────────────
ALTER TABLE subscriptions RENAME COLUMN stripe_subscription_id TO provider_subscription_id;
ALTER TABLE subscriptions RENAME COLUMN stripe_customer_id     TO provider_customer_id;

-- Rename the index that referenced the old column name
DROP INDEX IF EXISTS idx_subscriptions_stripe;
CREATE INDEX IF NOT EXISTS idx_subscriptions_provider ON subscriptions(provider_subscription_id);

-- ── 4. professionals table ────────────────────────────────────────────
ALTER TABLE professionals RENAME COLUMN stripe_onboarded TO payments_onboarded;

-- ── 5. Update RLS policies that referenced old table name ─────────────
-- (Policies move automatically with the table rename; no action needed.)
-- Rename policies for clarity (best-effort, ignore if names differ):
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payment_accounts' AND policyname = 'stripe_connect_select_own'
  ) THEN
    ALTER POLICY stripe_connect_select_own ON payment_accounts RENAME TO payment_accounts_select_own;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payment_accounts' AND policyname = 'stripe_connect_insert_own'
  ) THEN
    ALTER POLICY stripe_connect_insert_own ON payment_accounts RENAME TO payment_accounts_insert_own;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payment_accounts' AND policyname = 'stripe_connect_update_own'
  ) THEN
    ALTER POLICY stripe_connect_update_own ON payment_accounts RENAME TO payment_accounts_update_own;
  END IF;
END $$;
