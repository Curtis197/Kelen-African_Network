-- Migration: 20260422000003_payments_whatsapp.sql
-- Adds payment and WhatsApp notification tables for MVP

-- Stripe Connect account per professional
CREATE TABLE IF NOT EXISTS stripe_connect_accounts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id   uuid UNIQUE NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  stripe_account_id text UNIQUE NOT NULL,
  onboarded         boolean NOT NULL DEFAULT false,
  payment_mode      text NOT NULL DEFAULT 'both',   -- 'booking' | 'invoice' | 'both'
  deposit_type      text NOT NULL DEFAULT 'fixed',  -- 'fixed' | 'percent'
  deposit_amount    numeric(10,2),
  deposit_percent   integer CHECK (deposit_percent BETWEEN 1 AND 100),
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE stripe_connect_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stripe_connect_select_own"
  ON stripe_connect_accounts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM professionals p
      WHERE p.id = professional_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "stripe_connect_insert_own"
  ON stripe_connect_accounts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM professionals p
      WHERE p.id = professional_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "stripe_connect_update_own"
  ON stripe_connect_accounts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM professionals p
      WHERE p.id = professional_id AND p.user_id = auth.uid()
    )
  );

-- Payment records (booking deposits + invoices)
CREATE TABLE IF NOT EXISTS payments (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id         uuid NOT NULL REFERENCES professionals(id),
  stripe_payment_intent   text UNIQUE,
  stripe_checkout_session text,
  type                    text NOT NULL CHECK (type IN ('booking_deposit', 'invoice')),
  amount                  numeric(10,2) NOT NULL,
  currency                text NOT NULL DEFAULT 'eur',
  status                  text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'refunded')),
  client_name             text,
  client_phone            text,
  client_email            text,
  service_name            text,
  appointment_id          uuid REFERENCES pro_appointments(id),
  payment_link_url        text,
  paid_at                 timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select_own"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM professionals p
      WHERE p.id = professional_id AND p.user_id = auth.uid()
    )
  );

-- WhatsApp notification log
CREATE TABLE IF NOT EXISTS whatsapp_notifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES professionals(id),
  recipient       text NOT NULL CHECK (recipient IN ('client', 'pro')),
  phone           text NOT NULL,
  template        text NOT NULL,
  status          text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
  twilio_sid      text,
  payment_id      uuid REFERENCES payments(id),
  appointment_id  uuid REFERENCES pro_appointments(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE whatsapp_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_notifications_select_own"
  ON whatsapp_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM professionals p
      WHERE p.id = professional_id AND p.user_id = auth.uid()
    )
  );

-- Add WhatsApp phone and onboarding flag to professionals
ALTER TABLE professionals
  ADD COLUMN IF NOT EXISTS whatsapp_phone text,
  ADD COLUMN IF NOT EXISTS stripe_onboarded boolean NOT NULL DEFAULT false;
