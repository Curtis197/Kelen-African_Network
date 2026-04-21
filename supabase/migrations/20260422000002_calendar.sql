-- ============================================================
-- Google Calendar Integration
-- Migration: 20260422000002_calendar.sql
-- ============================================================

-- Table: pro_calendar_tokens
-- Stores OAuth tokens + booking settings per professional
CREATE TABLE IF NOT EXISTS pro_calendar_tokens (
  pro_id        UUID PRIMARY KEY REFERENCES professionals(id) ON DELETE CASCADE,
  access_token  TEXT NOT NULL,
  refresh_token TEXT,
  expiry_date   BIGINT,
  calendar_id   TEXT NOT NULL DEFAULT 'primary',
  google_email  TEXT,
  slot_duration INTEGER NOT NULL DEFAULT 60,
  buffer_time   INTEGER NOT NULL DEFAULT 15,
  advance_days  INTEGER NOT NULL DEFAULT 14,
  working_hours JSONB NOT NULL DEFAULT '{
    "mon": {"start": "09:00", "end": "18:00"},
    "tue": {"start": "09:00", "end": "18:00"},
    "wed": {"start": "09:00", "end": "18:00"},
    "thu": {"start": "09:00", "end": "18:00"},
    "fri": {"start": "09:00", "end": "18:00"},
    "sat": null,
    "sun": null
  }',
  connected_at  TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ
);

ALTER TABLE pro_calendar_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "calendar_tokens_select_own"
  ON pro_calendar_tokens FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM professionals p
      WHERE p.id = pro_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "calendar_tokens_insert_own"
  ON pro_calendar_tokens FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM professionals p
      WHERE p.id = pro_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "calendar_tokens_update_own"
  ON pro_calendar_tokens FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM professionals p
      WHERE p.id = pro_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "calendar_tokens_delete_own"
  ON pro_calendar_tokens FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM professionals p
      WHERE p.id = pro_id AND p.user_id = auth.uid()
    )
  );

-- ============================================================

-- Table: pro_appointments
-- Records all bookings made via the Calendar widget
CREATE TABLE IF NOT EXISTS pro_appointments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id          UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  google_event_id TEXT NOT NULL,
  client_name     TEXT NOT NULL,
  client_email    TEXT NOT NULL,
  client_phone    TEXT,
  reason          TEXT,
  starts_at       TIMESTAMPTZ NOT NULL,
  ends_at         TIMESTAMPTZ NOT NULL,
  status          TEXT NOT NULL DEFAULT 'confirmed',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pro_appointments ENABLE ROW LEVEL SECURITY;

-- Pro can view their own appointments
CREATE POLICY "appointments_select_own"
  ON pro_appointments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM professionals p
      WHERE p.id = pro_id AND p.user_id = auth.uid()
    )
  );

-- Anyone can insert (anonymous booking) — insert is handled by API route with service role
-- Service role bypasses RLS, so this policy covers authenticated users only
CREATE POLICY "appointments_insert_own"
  ON pro_appointments FOR INSERT
  WITH CHECK (true);

-- ============================================================

-- Add show_calendar_section toggle to professional_portfolio
ALTER TABLE professional_portfolio
  ADD COLUMN IF NOT EXISTS show_calendar_section BOOLEAN DEFAULT TRUE;
