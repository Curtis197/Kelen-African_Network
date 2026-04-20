-- Add attachments metadata to newsletter campaigns
ALTER TABLE public.newsletter_campaigns
  ADD COLUMN IF NOT EXISTS attachments_json text;
