-- ============================================================
-- Migration: Daily Log System
-- ============================================================
-- Tables for professionals and clients to log daily project progress
-- with photos, GPS tracking, approve/contest workflow, and shareable links.

-- ── project_logs ────────────────────────────────────────────────────────
-- Main log entry table. One row = one daily log.

CREATE TABLE IF NOT EXISTS project_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID NOT NULL REFERENCES user_projects(id) ON DELETE CASCADE,
  step_id           UUID REFERENCES project_steps(id) ON DELETE SET NULL,
  author_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_role       TEXT NOT NULL CHECK (author_role IN ('client', 'professional')),
  log_date          DATE NOT NULL DEFAULT NOW(),
  title             TEXT NOT NULL,
  description       TEXT NOT NULL,
  money_spent       NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (money_spent >= 0),
  money_currency    TEXT NOT NULL DEFAULT 'XOF' CHECK (money_currency IN ('XOF','EUR','USD')),
  payment_id        UUID REFERENCES project_payments(id) ON DELETE SET NULL,
  issues            TEXT,
  next_steps        TEXT,
  weather           TEXT CHECK (weather IN ('sunny','cloudy','rainy','stormy','cold')),
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','contested','resolved')),
  gps_latitude      NUMERIC(10,7) NOT NULL,
  gps_longitude     NUMERIC(10,7) NOT NULL,
  is_synced         BOOLEAN NOT NULL DEFAULT TRUE,
  synced_at         TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_project_logs_project ON project_logs(project_id, log_date DESC);
CREATE INDEX idx_project_logs_step ON project_logs(step_id);
CREATE INDEX idx_project_logs_author ON project_logs(author_id);
CREATE INDEX idx_project_logs_date ON project_logs(log_date DESC);
CREATE INDEX idx_project_logs_status ON project_logs(project_id, status);

CREATE TRIGGER set_updated_at_project_logs
  BEFORE UPDATE ON project_logs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── project_log_media ───────────────────────────────────────────────────
-- Photos attached to a log (MVP: photos only).

CREATE TABLE IF NOT EXISTS project_log_media (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id            UUID NOT NULL REFERENCES project_logs(id) ON DELETE CASCADE,
  media_type        TEXT NOT NULL CHECK (media_type IN ('photo')),
  storage_path      TEXT NOT NULL,
  file_name         TEXT NOT NULL,
  file_size         BIGINT,
  mime_type         TEXT NOT NULL,
  caption           TEXT,
  exif_timestamp    TIMESTAMPTZ,
  exif_latitude     NUMERIC(10,7),
  exif_longitude    NUMERIC(10,7),
  is_primary        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_log_media_log ON project_log_media(log_id);
CREATE INDEX idx_log_media_type ON project_log_media(log_id, media_type);

-- ── project_log_comments ────────────────────────────────────────────────
-- Client responses: approve with comment or contest with evidence.

CREATE TABLE IF NOT EXISTS project_log_comments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id            UUID NOT NULL REFERENCES project_logs(id) ON DELETE CASCADE,
  author_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_type      TEXT NOT NULL CHECK (comment_type IN ('approval','contest')),
  comment_text      TEXT NOT NULL,
  evidence_urls     TEXT[] NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_log_comments_log ON project_log_comments(log_id);
CREATE INDEX idx_log_comments_type ON project_log_comments(log_id, comment_type);

-- ── project_log_shares ──────────────────────────────────────────────────
-- Shareable links for non-subscribed clients.

CREATE TABLE IF NOT EXISTS project_log_shares (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id            UUID NOT NULL REFERENCES project_logs(id) ON DELETE CASCADE,
  share_token       TEXT NOT NULL UNIQUE,
  recipient_email   TEXT,
  recipient_phone   TEXT,
  share_method      TEXT CHECK (share_method IN ('email','whatsapp','sms')),
  shared_by_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared_at         TIMESTAMPTZ DEFAULT NOW(),
  first_viewed_at   TIMESTAMPTZ,
  view_count        INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX idx_log_shares_token ON project_log_shares(share_token);
CREATE INDEX idx_log_shares_log ON project_log_shares(log_id);
CREATE INDEX idx_log_shares_email ON project_log_shares(recipient_email);

-- ── project_log_views ───────────────────────────────────────────────────
-- Tracks individual views of shared logs.

CREATE TABLE IF NOT EXISTS project_log_views (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id          UUID NOT NULL REFERENCES project_log_shares(id) ON DELETE CASCADE,
  viewed_at         TIMESTAMPTZ DEFAULT NOW(),
  viewer_ip         TEXT,
  viewer_user_agent TEXT
);

CREATE INDEX idx_log_views_share ON project_log_views(share_id);

-- ── Row Level Security ──────────────────────────────────────────────────

ALTER TABLE project_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_log_media   ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_log_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_log_shares  ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_log_views   ENABLE ROW LEVEL SECURITY;

-- project_logs: client owns their projects
CREATE POLICY "logs_client_own" ON project_logs
  FOR ALL USING (
    project_id IN (SELECT id FROM user_projects WHERE user_id = auth.uid())
  )
  WITH CHECK (
    project_id IN (SELECT id FROM user_projects WHERE user_id = auth.uid())
  );

-- project_logs: professionals can create logs for projects they're assigned to
CREATE POLICY "logs_pro_create" ON project_logs
  FOR INSERT WITH CHECK (
    author_id = auth.uid()
    AND project_id IN (
      SELECT pp.project_id FROM project_professionals pp
      WHERE pp.professional_id IN (
        SELECT id FROM professionals WHERE user_id = auth.uid()
      )
    )
  );

-- project_logs: professionals can read/update their own logs
CREATE POLICY "logs_pro_read" ON project_logs
  FOR SELECT USING (author_id = auth.uid());

CREATE POLICY "logs_pro_update" ON project_logs
  FOR UPDATE USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Admin: full access
CREATE POLICY "logs_admin" ON project_logs
  FOR ALL USING (public.has_role('admin'));

-- project_log_media: client access via project ownership
CREATE POLICY "media_client_own" ON project_log_media
  FOR ALL USING (
    log_id IN (
      SELECT pl.id FROM project_logs pl
      JOIN user_projects up ON up.id = pl.project_id
      WHERE up.user_id = auth.uid()
    )
  )
  WITH CHECK (
    log_id IN (
      SELECT pl.id FROM project_logs pl
      JOIN user_projects up ON up.id = pl.project_id
      WHERE up.user_id = auth.uid()
    )
  );

-- project_log_media: professional access to own logs
CREATE POLICY "media_pro_own" ON project_log_media
  FOR ALL USING (
    log_id IN (SELECT pl.id FROM project_logs pl WHERE pl.author_id = auth.uid())
  )
  WITH CHECK (
    log_id IN (SELECT pl.id FROM project_logs pl WHERE pl.author_id = auth.uid())
  );

CREATE POLICY "media_admin" ON project_log_media
  FOR ALL USING (public.has_role('admin'));

-- project_log_comments: client access via project ownership
CREATE POLICY "comments_client_own" ON project_log_comments
  FOR ALL USING (
    log_id IN (
      SELECT pl.id FROM project_logs pl
      JOIN user_projects up ON up.id = pl.project_id
      WHERE up.user_id = auth.uid()
    )
  )
  WITH CHECK (
    log_id IN (
      SELECT pl.id FROM project_logs pl
      JOIN user_projects up ON up.id = pl.project_id
      WHERE up.user_id = auth.uid()
    )
  );

-- project_log_comments: professional read own log comments
CREATE POLICY "comments_pro_read" ON project_log_comments
  FOR SELECT USING (
    log_id IN (SELECT pl.id FROM project_logs pl WHERE pl.author_id = auth.uid())
  );

CREATE POLICY "comments_admin" ON project_log_comments
  FOR ALL USING (public.has_role('admin'));

-- project_log_shares: user manages own shares
CREATE POLICY "shares_user_own" ON project_log_shares
  FOR ALL USING (shared_by_id = auth.uid())
  WITH CHECK (shared_by_id = auth.uid());

-- project_log_shares: public read via token (for shared links)
CREATE POLICY "shares_public_read" ON project_log_shares
  FOR SELECT USING (true);

CREATE POLICY "shares_admin" ON project_log_shares
  FOR ALL USING (public.has_role('admin'));

-- project_log_views: anyone can insert a view (public endpoint)
CREATE POLICY "views_public_insert" ON project_log_views
  FOR INSERT WITH CHECK (true);

-- project_log_views: user reads own share views
CREATE POLICY "views_user_read" ON project_log_views
  FOR SELECT USING (
    share_id IN (SELECT id FROM project_log_shares WHERE shared_by_id = auth.uid())
  );

CREATE POLICY "views_admin" ON project_log_views
  FOR ALL USING (public.has_role('admin'));
