-- Newsletter feature: subscriber list + campaign history

CREATE TABLE public.client_newsletter (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id   uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  email             text NOT NULL,
  name              text,
  unsubscribe_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  subscribed_at     timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at   timestamptz,
  is_active         boolean NOT NULL DEFAULT true,
  source            text NOT NULL DEFAULT 'public_profile'
                    CHECK (source IN ('public_profile', 'manual')),
  CONSTRAINT client_newsletter_email_pro_unique UNIQUE (professional_id, email)
);

CREATE INDEX idx_newsletter_pro_active
  ON public.client_newsletter (professional_id, is_active);

CREATE TABLE public.newsletter_campaigns (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  subject         text NOT NULL,
  body_html       text NOT NULL,
  status          text NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
  recipient_count int NOT NULL DEFAULT 0,
  sent_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaigns_pro_sent
  ON public.newsletter_campaigns (professional_id, sent_at DESC);

-- RLS ────────────────────────────────────────────────────────────

ALTER TABLE public.client_newsletter ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_campaigns ENABLE ROW LEVEL SECURITY;

-- Anyone (anon or auth) can subscribe
CREATE POLICY newsletter_public_insert ON public.client_newsletter
  FOR INSERT TO public WITH CHECK (true);

-- Anyone can unsubscribe by token: active rows only → must become inactive
CREATE POLICY newsletter_public_unsubscribe ON public.client_newsletter
  FOR UPDATE TO public
  USING (is_active = true)
  WITH CHECK (is_active = false);

-- Pro owner: full access to their own subscribers
CREATE POLICY newsletter_pro_own ON public.client_newsletter
  FOR ALL TO public
  USING (
    professional_id IN (
      SELECT id FROM public.professionals WHERE user_id = auth.uid()
    )
  );

-- Pro owner: full access to their own campaigns
CREATE POLICY campaigns_pro_own ON public.newsletter_campaigns
  FOR ALL TO public
  USING (
    professional_id IN (
      SELECT id FROM public.professionals WHERE user_id = auth.uid()
    )
  );
