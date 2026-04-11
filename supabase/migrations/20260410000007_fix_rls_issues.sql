-- ============================================================
-- Migration: Fix remaining RLS issues from April 10 audit
-- ============================================================
-- 1. Enable RLS on pro_project_images (HIGH)
-- 2. Fix notifications_system_insert WITH CHECK (MEDIUM)
-- 3. Fix project_log_comments INSERT WITH CHECK (MEDIUM)

-- ── 1. Enable RLS on pro_project_images ────────────────────

ALTER TABLE public.pro_project_images ENABLE ROW LEVEL SECURITY;

-- Public: read images from visible professionals with public projects
CREATE POLICY "pro_images_public_read" ON public.pro_project_images
  FOR SELECT TO public
  USING (
    pro_project_id IN (
      SELECT pp.id FROM pro_projects pp
      JOIN professionals p ON pp.professional_id = p.id
      WHERE p.is_visible = true AND pp.is_public = true
    )
  );

-- Pro: manage images on their own projects
CREATE POLICY "pro_images_pro_own" ON public.pro_project_images
  FOR ALL TO public
  USING (
    pro_project_id IN (
      SELECT pp.id FROM pro_projects pp
      JOIN professionals p ON pp.professional_id = p.id
      WHERE p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    pro_project_id IN (
      SELECT pp.id FROM pro_projects pp
      JOIN professionals p ON pp.professional_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- Admin: full access
CREATE POLICY "pro_images_admin" ON public.pro_project_images
  FOR ALL TO public
  USING (has_role('admin'::text))
  WITH CHECK (has_role('admin'::text));

-- ── 2. Fix notifications_system_insert WITH CHECK ─────────
-- INSERT policies need WITH CHECK, not USING. The current policy
-- has USING = null which means nothing to evaluate — replace it.

DROP POLICY IF EXISTS notifications_system_insert ON public.notifications;

CREATE POLICY "notifications_system_insert" ON public.notifications
  FOR INSERT TO public
  WITH CHECK (true);

-- ── 3. Fix project_log_comments INSERT WITH CHECK ─────────
-- comments_pro_create_own_projects has USING = null for INSERT.
-- Replace WITH explicit WITH CHECK clause.

DROP POLICY IF EXISTS comments_pro_create_own_projects ON public.project_log_comments;

CREATE POLICY "comments_pro_create_own_projects" ON public.project_log_comments
  FOR INSERT TO public
  WITH CHECK (
    log_id IN (
      SELECT pl.id FROM project_logs pl
      WHERE pl.pro_project_id IN (
        SELECT pp.id FROM pro_projects pp
        JOIN professionals p ON pp.professional_id = p.id
        WHERE p.user_id = auth.uid()
      )
    )
  );
