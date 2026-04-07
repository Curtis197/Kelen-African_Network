-- ============================================================
-- Realization Likes & Comments + Recommendations UI
-- ============================================================

-- Realization Likes
CREATE TABLE IF NOT EXISTS realization_likes (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  realization_id         UUID NOT NULL REFERENCES professional_realizations(id) ON DELETE CASCADE,
  user_id                UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(realization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_realization_likes_realization ON realization_likes(realization_id);
CREATE INDEX IF NOT EXISTS idx_realization_likes_user ON realization_likes(user_id);

-- Realization Comments (moderated by professional)
CREATE TABLE IF NOT EXISTS realization_comments (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  realization_id         UUID NOT NULL REFERENCES professional_realizations(id) ON DELETE CASCADE,
  user_id                UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content                TEXT NOT NULL,
  status                 TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_realization_comments_realization ON realization_comments(realization_id);
CREATE INDEX IF NOT EXISTS idx_realization_comments_status ON realization_comments(realization_id, status);

-- Auto-update trigger for comments
CREATE TRIGGER set_updated_at_realization_comments
  BEFORE UPDATE ON realization_comments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Row Level Security ─────────────────────────────────────

ALTER TABLE realization_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE realization_comments ENABLE ROW LEVEL SECURITY;

-- Public: browse likes count
CREATE POLICY "realization_likes_public_count" ON realization_likes
  FOR SELECT USING (TRUE);

-- Authenticated: manage own likes
CREATE POLICY "realization_likes_manage_own" ON realization_likes
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Public: browse approved comments
CREATE POLICY "realization_comments_public_browse" ON realization_comments
  FOR SELECT USING (status = 'approved');

-- Authenticated: create own comments
CREATE POLICY "realization_comments_create" ON realization_comments
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Professional (via realization owner): moderate comments
CREATE POLICY "realization_comments_moderate" ON realization_comments
  FOR UPDATE USING (
    realization_id IN (
      SELECT pr.id FROM professional_realizations pr
      JOIN professionals p ON p.id = pr.professional_id
      WHERE p.user_id = auth.uid()
    )
  );

-- Admin: full access
CREATE POLICY "realization_likes_admin" ON realization_likes
  FOR ALL USING (public.has_role('admin'));

CREATE POLICY "realization_comments_admin" ON realization_comments
  FOR ALL USING (public.has_role('admin'));
