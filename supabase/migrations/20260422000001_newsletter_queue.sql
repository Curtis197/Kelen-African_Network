-- Newsletter send queue: decouple campaign dispatch from immediate Resend calls.
-- A pg_cron job fires every hour, calling the process-newsletter Edge Function
-- which groups pending items by subscriber and sends individual or digest emails.

-- Extensions (already enabled on Supabase Pro; no-op if already present)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Add 'queued' to campaign statuses
ALTER TABLE public.newsletter_campaigns
  DROP CONSTRAINT IF EXISTS newsletter_campaigns_status_check;
ALTER TABLE public.newsletter_campaigns
  ADD CONSTRAINT newsletter_campaigns_status_check
  CHECK (status IN ('draft', 'queued', 'sending', 'sent', 'failed'));

-- Queue table: one row per (campaign × subscriber)
CREATE TABLE IF NOT EXISTS public.newsletter_send_queue (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   uuid NOT NULL REFERENCES public.newsletter_campaigns(id) ON DELETE CASCADE,
  subscriber_id uuid NOT NULL REFERENCES public.client_newsletter(id)    ON DELETE CASCADE,
  status        text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
  scheduled_for timestamptz NOT NULL DEFAULT now(),
  sent_at       timestamptz,
  attempts      int  NOT NULL DEFAULT 0,
  error         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT queue_campaign_subscriber_unique UNIQUE (campaign_id, subscriber_id)
);

CREATE INDEX idx_queue_pending ON public.newsletter_send_queue (scheduled_for)
  WHERE status = 'pending';

ALTER TABLE public.newsletter_send_queue ENABLE ROW LEVEL SECURITY;

-- Only service role (Edge Function) can touch the queue
CREATE POLICY queue_service_only ON public.newsletter_send_queue
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- claim_newsletter_queue(batch_size)
-- Atomically marks up to batch_size pending rows as 'sending' and returns
-- all data the Edge Function needs to build and dispatch emails.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.claim_newsletter_queue(batch_size int DEFAULT 500)
RETURNS TABLE (
  queue_id         uuid,
  campaign_id      uuid,
  subscriber_id    uuid,
  subject          text,
  body_html        text,
  attachments_json text,
  professional_id  uuid,
  business_name    text,
  pro_email        text,
  subscriber_email text,
  unsubscribe_token text,
  subscriber_name  text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH claimed AS (
    UPDATE public.newsletter_send_queue
    SET status = 'sending', attempts = attempts + 1
    WHERE id IN (
      SELECT q.id
      FROM   public.newsletter_send_queue q
      WHERE  q.status = 'pending'
        AND  q.scheduled_for <= now()
      ORDER  BY q.scheduled_for
      FOR UPDATE SKIP LOCKED
      LIMIT  batch_size
    )
    RETURNING id, campaign_id, subscriber_id
  )
  SELECT
    cl.id,
    cl.campaign_id,
    cl.subscriber_id,
    cam.subject,
    cam.body_html,
    cam.attachments_json,
    cam.professional_id,
    p.business_name,
    p.email,
    s.email,
    s.unsubscribe_token,
    s.name
  FROM  claimed cl
  JOIN  public.newsletter_campaigns cam ON cam.id = cl.campaign_id
  JOIN  public.professionals         p   ON p.id   = cam.professional_id
  JOIN  public.client_newsletter     s   ON s.id   = cl.subscriber_id;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- pg_cron: fire the Edge Function every hour
--
-- SETUP REQUIRED (run once in Supabase SQL editor after this migration):
--
--   ALTER DATABASE postgres SET app.newsletter_cron_secret = 'YOUR_SECRET';
--
-- Then add the same value as a Supabase Edge Function secret:
--   supabase secrets set NEWSLETTER_CRON_SECRET=YOUR_SECRET
-- ─────────────────────────────────────────────────────────────────────────────
SELECT cron.schedule(
  'process-newsletter-queue',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://rtbfzpgklmbizznhwodg.supabase.co/functions/v1/process-newsletter',
    headers := jsonb_build_object(
      'Content-Type',    'application/json',
      'x-cron-secret',   current_setting('app.newsletter_cron_secret', true)
    ),
    body    := '{}'::jsonb
  );
  $$
);
