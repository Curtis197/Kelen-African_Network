-- ============================================================
-- Pro Newsletters
-- Migration: 20260412000002_pro_newsletters.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS pro_newsletters (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pro_id        UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  subject       TEXT NOT NULL,
  body          TEXT NOT NULL,
  recipient_count INTEGER DEFAULT 0,
  sent_at       TIMESTAMPTZ DEFAULT NOW(),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pro_newsletters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pro_newsletters_select_own"
  ON pro_newsletters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM professionals p
      WHERE p.id = pro_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "pro_newsletters_insert_own"
  ON pro_newsletters FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM professionals p
      WHERE p.id = pro_id AND p.user_id = auth.uid()
    )
  );
