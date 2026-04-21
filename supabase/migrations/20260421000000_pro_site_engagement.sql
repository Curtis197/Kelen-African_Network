-- Add customization columns to professional_portfolio
ALTER TABLE professional_portfolio
  ADD COLUMN IF NOT EXISTS corner_style TEXT NOT NULL DEFAULT 'rounded'
    CHECK (corner_style IN ('square', 'half-rounded', 'rounded')),
  ADD COLUMN IF NOT EXISTS color_mode TEXT NOT NULL DEFAULT 'light'
    CHECK (color_mode IN ('light', 'dark', 'logo-color'));

-- Item likes (anonymous, deduplicated by session_id)
CREATE TABLE IF NOT EXISTS item_likes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type   TEXT NOT NULL CHECK (item_type IN ('service', 'realisation', 'produit')),
  item_id     UUID NOT NULL,
  session_id  TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (item_type, item_id, session_id)
);
CREATE INDEX IF NOT EXISTS idx_item_likes_item ON item_likes (item_type, item_id);

-- Item comments (anonymous, name required)
CREATE TABLE IF NOT EXISTS item_comments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type    TEXT NOT NULL CHECK (item_type IN ('service', 'realisation', 'produit')),
  item_id      UUID NOT NULL,
  author_name  TEXT NOT NULL CHECK (char_length(author_name) BETWEEN 1 AND 80),
  body         TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  created_at   TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_item_comments_item ON item_comments (item_type, item_id);

-- Comment likes
CREATE TABLE IF NOT EXISTS comment_likes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id  UUID NOT NULL REFERENCES item_comments (id) ON DELETE CASCADE,
  session_id  TEXT NOT NULL,
  UNIQUE (comment_id, session_id)
);

-- RLS: public read, public insert (anonymous engagement)
ALTER TABLE item_likes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read likes"    ON item_likes    FOR SELECT USING (true);
CREATE POLICY "public insert likes"  ON item_likes    FOR INSERT WITH CHECK (true);
CREATE POLICY "public delete likes"  ON item_likes    FOR DELETE USING (true);
CREATE POLICY "public read comments" ON item_comments FOR SELECT USING (true);
CREATE POLICY "public insert comments" ON item_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "public read comment_likes"   ON comment_likes FOR SELECT USING (true);
CREATE POLICY "public insert comment_likes" ON comment_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "public delete comment_likes" ON comment_likes FOR DELETE USING (true);
