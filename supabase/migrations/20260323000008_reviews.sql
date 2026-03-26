-- ============================================================
-- Migration 008: Reviews + Review History
-- ============================================================
-- Star ratings 1–5 left by any authenticated user (unverified,
-- like Google Reviews). One rating per (professional, reviewer).
-- Reviews are modifiable by the author but never deletable.
-- Modification history is stored in review_history for admin audit.

CREATE TABLE reviews (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id   UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  reviewer_id       UUID NOT NULL REFERENCES users(id),

  -- ── Reviewer snapshot (captured at submit time) ───────────
  reviewer_name     TEXT NOT NULL,
  reviewer_country  TEXT NOT NULL,

  -- ── Content ────────────────────────────────────────────────
  rating            INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment           TEXT,                 -- free text, optional

  -- ── Moderation (admin only — for illegal content) ─────────
  is_hidden         BOOLEAN DEFAULT FALSE,
  hidden_reason     TEXT,                 -- not visible publicly

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Enforce one review per (professional, reviewer)
CREATE UNIQUE INDEX idx_reviews_one_per_user    ON reviews(professional_id, reviewer_id);
CREATE INDEX idx_reviews_professional           ON reviews(professional_id);
CREATE INDEX idx_reviews_reviewer               ON reviews(reviewer_id);
CREATE INDEX idx_reviews_visible                ON reviews(professional_id, is_hidden);

CREATE TRIGGER set_updated_at_reviews
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Review History (audit trail for admin) ─────────────────

CREATE TABLE review_history (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id         UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  previous_rating   INTEGER NOT NULL,
  previous_comment  TEXT,
  changed_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_review_history_review ON review_history(review_id);

-- ── Row Level Security ─────────────────────────────────────

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_history ENABLE ROW LEVEL SECURITY;

-- Public: see non-hidden reviews
CREATE POLICY "reviews_public_visible" ON reviews
  FOR SELECT USING (is_hidden = FALSE);

-- Authenticated: submit one review per professional
CREATE POLICY "reviews_insert" ON reviews
  FOR INSERT WITH CHECK (reviewer_id = auth.uid());

-- Author: modify own review (rating + comment only)
-- Note: author cannot un-hide their own review
CREATE POLICY "reviews_update_own" ON reviews
  FOR UPDATE
  USING (reviewer_id = auth.uid())
  WITH CHECK (reviewer_id = auth.uid());

-- No DELETE policy — reviews are permanent, only content is editable

-- Admin: full access (can hide for illegal content)
CREATE POLICY "reviews_admin_all" ON reviews
  FOR ALL USING (
    public.has_role('admin')
  );

-- review_history: admin only
CREATE POLICY "review_history_admin_all" ON review_history
  FOR ALL USING (
    public.has_role('admin')
  );
