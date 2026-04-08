-- Migration: In-app notification system
-- Created: 2026-04-08

CREATE TABLE IF NOT EXISTS notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN (
    'log_created', 'log_approved', 'log_contested', 'log_resolved',
    'project_assigned', 'new_recommendation', 'new_signal',
    'status_changed', 'subscription_activated', 'subscription_expired'
  )),
  title         TEXT NOT NULL,
  body          TEXT NOT NULL,
  link          TEXT,                      -- Internal route to navigate to
  icon          TEXT DEFAULT 'bell',       -- Lucide icon name
  is_read       BOOLEAN DEFAULT FALSE,
  metadata      JSONB DEFAULT '{}',        -- Extra context (project_id, log_id, etc.)
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read, created_at DESC);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "notifications_user_own" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- Users can mark their own notifications as read
CREATE POLICY "notifications_user_update" ON notifications
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- System/trigger can insert notifications for any user
CREATE POLICY "notifications_system_insert" ON notifications
  FOR INSERT WITH CHECK (true);

-- Admin: full access
CREATE POLICY "notifications_admin" ON notifications
  FOR ALL USING (public.has_role('admin'));
