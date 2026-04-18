-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['log_created'::text, 'log_approved'::text, 'log_contested'::text, 'log_resolved'::text, 'project_assigned'::text, 'new_recommendation'::text, 'new_signal'::text, 'status_changed'::text, 'subscription_activated'::text, 'subscription_expired'::text, 'finalist_selected'::text, 'proposal_submitted'::text, 'revision_requested'::text, 'proposal_accepted'::text, 'proposal_declined'::text, 'collaboration_declined'::text, 'collaboration_activated'::text, 'collaboration_terminated'::text])),
  title text NOT NULL,
  body text NOT NULL,
  link text,
  icon text DEFAULT 'bell'::text,
  is_read boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.pro_project_clients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pro_project_id uuid NOT NULL,
  created_by_pro_id uuid NOT NULL,
  client_name text NOT NULL,
  client_email text NOT NULL,
  client_phone text,
  invitation_sent boolean NOT NULL DEFAULT false,
  invitation_sent_at timestamp with time zone,
  invitation_token text UNIQUE,
  invitation_verified boolean NOT NULL DEFAULT false,
  invitation_verified_at timestamp with time zone,
  linked_user_id uuid,
  linked_at timestamp with time zone,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'invited'::text, 'verified'::text, 'linked'::text, 'cancelled'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pro_project_clients_pkey PRIMARY KEY (id),
  CONSTRAINT pro_project_clients_pro_project_id_fkey FOREIGN KEY (pro_project_id) REFERENCES public.pro_projects(id),
  CONSTRAINT pro_project_clients_created_by_pro_id_fkey FOREIGN KEY (created_by_pro_id) REFERENCES public.professionals(id),
  CONSTRAINT pro_project_clients_linked_user_id_fkey FOREIGN KEY (linked_user_id) REFERENCES public.users(id)
);
CREATE TABLE public.pro_project_images (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pro_project_id uuid NOT NULL,
  url text NOT NULL,
  is_main boolean DEFAULT false,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pro_project_images_pkey PRIMARY KEY (id),
  CONSTRAINT pro_project_images_pro_project_id_fkey FOREIGN KEY (pro_project_id) REFERENCES public.pro_projects(id)
);
CREATE TABLE public.pro_projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  category text NOT NULL,
  location text,
  client_name text,
  client_email text,
  client_phone text,
  start_date date,
  end_date date,
  actual_end_date date,
  budget numeric,
  currency text DEFAULT 'XOF'::text CHECK (currency = ANY (ARRAY['XOF'::text, 'EUR'::text, 'USD'::text])),
  status text NOT NULL DEFAULT 'in_progress'::text CHECK (status = ANY (ARRAY['in_progress'::text, 'completed'::text, 'paused'::text, 'cancelled'::text])),
  is_public boolean NOT NULL DEFAULT false,
  completion_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pro_projects_pkey PRIMARY KEY (id),
  CONSTRAINT pro_projects_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.professionals(id)
);
CREATE TABLE public.professional_areas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT professional_areas_pkey PRIMARY KEY (id)
);
CREATE TABLE public.professional_portfolio (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL UNIQUE,
  hero_image_url text,
  hero_title text,
  hero_subtitle text,
  about_text text,
  about_image_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT professional_portfolio_pkey PRIMARY KEY (id),
  CONSTRAINT professional_portfolio_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.professionals(id)
);
CREATE TABLE public.professional_realizations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  location text,
  completion_date date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  price numeric,
  currency text DEFAULT 'XOF'::text,
  CONSTRAINT professional_realizations_pkey PRIMARY KEY (id),
  CONSTRAINT professional_realizations_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.professionals(id)
);
CREATE TABLE public.professionals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  business_name text NOT NULL,
  owner_name text NOT NULL,
  slug text NOT NULL UNIQUE,
  category text NOT NULL,
  subcategories ARRAY,
  country text NOT NULL,
  city text NOT NULL,
  address text,
  phone text NOT NULL,
  whatsapp text,
  email text NOT NULL,
  description text,
  services_offered ARRAY,
  years_experience integer,
  team_size integer,
  portfolio_photos ARRAY,
  portfolio_videos ARRAY,
  status text NOT NULL DEFAULT 'white'::text CHECK (status = ANY (ARRAY['gold'::text, 'silver'::text, 'white'::text, 'red'::text, 'black'::text])),
  recommendation_count integer DEFAULT 0,
  signal_count integer DEFAULT 0,
  avg_rating numeric,
  positive_review_pct numeric,
  review_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  is_visible boolean DEFAULT false,
  verified boolean DEFAULT false,
  verification_documents ARRAY,
  verified_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  profile_picture_url text,
  area_id uuid,
  profession_id uuid,
  hero_image_url text,
  hero_tagline text,
  about_text text,
  ai_values ARRAY DEFAULT '{}'::text[],
  ai_qualities ARRAY DEFAULT '{}'::text[],
  ai_relationship_style text,
  ai_communication_freq text,
  ai_proudest_project text,
  ai_limits_refused ARRAY DEFAULT '{}'::text[],
  bio_accroche text,
  bio_presentation text,
  brand_primary text,
  brand_secondary text,
  brand_accent text,
  logo_storage_path text,
  CONSTRAINT professionals_pkey PRIMARY KEY (id),
  CONSTRAINT professionals_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.professional_areas(id),
  CONSTRAINT professionals_profession_id_fkey FOREIGN KEY (profession_id) REFERENCES public.professions(id),
  CONSTRAINT professionals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.professions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  area_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT professions_pkey PRIMARY KEY (id),
  CONSTRAINT professions_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.professional_areas(id)
);
CREATE TABLE public.profile_interactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['contact_click'::text, 'phone_click'::text, 'whatsapp_click'::text, 'email_click'::text])),
  viewer_ip_hash text NOT NULL,
  viewer_country text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profile_interactions_pkey PRIMARY KEY (id),
  CONSTRAINT profile_interactions_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.professionals(id)
);
CREATE TABLE public.profile_views (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL,
  viewer_ip_hash text NOT NULL,
  viewer_country text,
  viewer_city text,
  source text NOT NULL CHECK (source = ANY (ARRAY['search'::text, 'browse'::text, 'category'::text, 'direct'::text])),
  search_query text,
  referrer text,
  cost_deducted numeric NOT NULL DEFAULT 0.0000,
  view_duration integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profile_views_pkey PRIMARY KEY (id),
  CONSTRAINT profile_views_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.professionals(id)
);
CREATE TABLE public.project_areas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT project_areas_pkey PRIMARY KEY (id),
  CONSTRAINT project_areas_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.user_projects(id)
);
CREATE TABLE public.project_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  professional_id uuid,                      -- NULLABLE (migration 20260412000005) — client docs don't require a pro
  project_title text NOT NULL,
  project_description text,
  project_date date,
  project_amount numeric,
  contract_url text NOT NULL,
  delivery_report_url text,
  status text DEFAULT 'pending_review'::text CHECK (status = ANY (ARRAY['pending_review'::text, 'published'::text, 'rejected'::text])),
  rejection_reason text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  client_email text,
  client_notified_at timestamp with time zone,
  client_confirmed boolean,
  client_responded_at timestamp with time zone,
  linked_recommendation_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  project_id uuid,
  pro_project_id uuid,
  CONSTRAINT project_documents_pkey PRIMARY KEY (id),
  CONSTRAINT project_documents_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.user_projects(id),
  CONSTRAINT project_documents_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.professionals(id),
  CONSTRAINT project_documents_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id),
  CONSTRAINT project_documents_linked_recommendation_id_fkey FOREIGN KEY (linked_recommendation_id) REFERENCES public.recommendations(id),
  CONSTRAINT project_documents_pro_project_id_fkey FOREIGN KEY (pro_project_id) REFERENCES public.pro_projects(id)
);
-- RLS Policies on project_documents (migration 20260412000003):
--   pdocs_admin_all: ALL for admin
--   pdocs_pro_own: ALL for professionals on their own projects
--   pdocs_public_published: SELECT for public when status='published'
--   pdocs_client_insert: INSERT for clients on their own projects (user_id match)
--   pdocs_client_select: SELECT for clients on their own projects
--   pdocs_client_update: UPDATE for clients on their own projects
--   pdocs_client_delete: DELETE for clients on their own projects
CREATE TABLE public.project_images (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL,
  project_document_id uuid,
  url text NOT NULL,
  is_main boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT project_images_pkey PRIMARY KEY (id),
  CONSTRAINT project_images_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.professionals(id),
  CONSTRAINT project_images_project_document_id_fkey FOREIGN KEY (project_document_id) REFERENCES public.project_documents(id)
);
CREATE TABLE public.user_project_images (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  url text NOT NULL,
  is_main boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_project_images_pkey PRIMARY KEY (id),
  CONSTRAINT user_project_images_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.user_projects(id) ON DELETE CASCADE
);
CREATE TABLE public.project_log_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  log_id uuid NOT NULL,
  author_id uuid NOT NULL,
  comment_type text NOT NULL CHECK (comment_type = ANY (ARRAY['approval'::text, 'contest'::text])),
  comment_text text NOT NULL,
  evidence_urls ARRAY NOT NULL DEFAULT '{}'::text[],
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT project_log_comments_pkey PRIMARY KEY (id),
  CONSTRAINT project_log_comments_log_id_fkey FOREIGN KEY (log_id) REFERENCES public.project_logs(id),
  CONSTRAINT project_log_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id)
);
CREATE TABLE public.project_log_media (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  log_id uuid NOT NULL,
  media_type text NOT NULL CHECK (media_type = 'photo'::text),
  storage_path text NOT NULL,
  file_name text NOT NULL,
  file_size bigint,
  mime_type text NOT NULL,
  caption text,
  exif_timestamp timestamp with time zone,
  exif_latitude numeric,
  exif_longitude numeric,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT project_log_media_pkey PRIMARY KEY (id),
  CONSTRAINT project_log_media_log_id_fkey FOREIGN KEY (log_id) REFERENCES public.project_logs(id)
);
CREATE TABLE public.project_log_shares (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  log_id uuid NOT NULL,
  share_token text NOT NULL UNIQUE,
  recipient_email text,
  recipient_phone text,
  share_method text CHECK (share_method = ANY (ARRAY['email'::text, 'whatsapp'::text, 'sms'::text])),
  shared_by_id uuid NOT NULL,
  shared_at timestamp with time zone DEFAULT now(),
  first_viewed_at timestamp with time zone,
  view_count integer NOT NULL DEFAULT 0,
  CONSTRAINT project_log_shares_pkey PRIMARY KEY (id),
  CONSTRAINT project_log_shares_log_id_fkey FOREIGN KEY (log_id) REFERENCES public.project_logs(id),
  CONSTRAINT project_log_shares_shared_by_id_fkey FOREIGN KEY (shared_by_id) REFERENCES public.users(id)
);
CREATE TABLE public.project_log_views (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  share_id uuid NOT NULL,
  viewed_at timestamp with time zone DEFAULT now(),
  viewer_ip text,
  viewer_user_agent text,
  CONSTRAINT project_log_views_pkey PRIMARY KEY (id),
  CONSTRAINT project_log_views_share_id_fkey FOREIGN KEY (share_id) REFERENCES public.project_log_shares(id)
);
CREATE TABLE public.project_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid,
  step_id uuid,
  author_id uuid NOT NULL,
  author_role text NOT NULL CHECK (author_role = ANY (ARRAY['client'::text, 'professional'::text])),
  log_date date NOT NULL DEFAULT now(),
  title text NOT NULL,
  description text NOT NULL,
  money_spent numeric NOT NULL DEFAULT 0 CHECK (money_spent >= 0::numeric),
  money_currency text NOT NULL DEFAULT 'XOF'::text CHECK (money_currency = ANY (ARRAY['XOF'::text, 'EUR'::text, 'USD'::text])),
  payment_id uuid,
  issues text,
  next_steps text,
  weather text CHECK (weather = ANY (ARRAY['sunny'::text, 'cloudy'::text, 'rainy'::text, 'stormy'::text, 'cold'::text])),
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'contested'::text, 'resolved'::text])),
  gps_latitude numeric NOT NULL,
  gps_longitude numeric NOT NULL,
  is_synced boolean NOT NULL DEFAULT true,
  synced_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  pro_project_id uuid,
  CONSTRAINT project_logs_pkey PRIMARY KEY (id),
  CONSTRAINT project_logs_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.user_projects(id),
  CONSTRAINT project_logs_step_id_fkey FOREIGN KEY (step_id) REFERENCES public.project_steps(id),
  CONSTRAINT project_logs_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id),
  CONSTRAINT project_logs_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.project_payments(id),
  CONSTRAINT project_logs_pro_project_id_fkey FOREIGN KEY (pro_project_id) REFERENCES public.pro_projects(id)
);
CREATE TABLE public.project_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  project_professional_id uuid,
  label text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0::numeric),
  currency text NOT NULL CHECK (currency = ANY (ARRAY['EUR'::text, 'XOF'::text, 'USD'::text])),
  paid_at date NOT NULL,
  payment_method text CHECK (payment_method = ANY (ARRAY['virement'::text, 'especes'::text, 'wave'::text, 'orange_money'::text, 'autre'::text])),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT project_payments_pkey PRIMARY KEY (id),
  CONSTRAINT project_payments_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.user_projects(id),
  CONSTRAINT project_payments_project_professional_id_fkey FOREIGN KEY (project_professional_id) REFERENCES public.project_professionals(id)
);
CREATE TABLE public.project_collaborations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  professional_id uuid NOT NULL,
  project_professional_id uuid NOT NULL,
  pro_project_id uuid,
  status text NOT NULL DEFAULT 'pending'::text
    CHECK (status = ANY (ARRAY['pending','negotiating','active','declined','not_picked','suspended','terminated'])),
  proposal_text text,
  proposal_budget numeric,
  proposal_currency text DEFAULT 'XOF'::text,
  proposal_timeline text,
  proposal_submitted_at timestamp with time zone,
  agreed_price numeric,
  agreed_start_date date,
  agreed_end_date date,
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  decline_reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT project_collaborations_pkey PRIMARY KEY (id),
  CONSTRAINT fk_collab_project FOREIGN KEY (project_id) REFERENCES public.user_projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_collab_professional FOREIGN KEY (professional_id) REFERENCES public.professionals(id) ON DELETE CASCADE,
  CONSTRAINT fk_collab_project_prof FOREIGN KEY (project_professional_id) REFERENCES public.project_professionals(id) ON DELETE CASCADE,
  CONSTRAINT fk_collab_pro_project FOREIGN KEY (pro_project_id) REFERENCES public.pro_projects(id) ON DELETE SET NULL
);
-- RLS Policies on project_collaborations (migration 20260414000003):
--   collab_client_all: ALL for clients on their own projects (user_projects.user_id = auth.uid())
--   collab_pro_read:   SELECT for pros on their own collaborations
--   collab_pro_update: UPDATE for pros on their own collaborations
--
-- ⚠️ RLS RECURSION FIX (migration 20260414000008):
-- The user_projects policies below used to reference project_collaborations directly,
-- creating a cycle: project_collaborations → user_projects → project_collaborations (42P17).
-- Fix: SECURITY DEFINER helper function bypasses RLS on project_collaborations.
CREATE OR REPLACE FUNCTION public.get_collab_project_ids_for_pro(statuses text[])
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT pc.project_id
  FROM   project_collaborations pc
  JOIN   professionals p ON p.id = pc.professional_id
  WHERE  p.user_id  = auth.uid()
  AND    pc.status  = ANY(statuses)
$$;
-- user_projects policies that use this function:
--   collab_pro_read:  SELECT WHERE id IN (get_collab_project_ids_for_pro(['pending','negotiating','active']))
--   collab_pro_write: ALL    WHERE id IN (get_collab_project_ids_for_pro(['active']))
-- project_professionals policy that uses this function:
--   project_professionals_collab_view: client branch = user_projects.user_id; pro branch = get_collab_project_ids_for_pro(['active']) AND selection_status='agreed'

CREATE TABLE public.collaboration_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  collaboration_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  sender_role text NOT NULL CHECK (sender_role = ANY (ARRAY['client','professional'])),
  message_type text NOT NULL CHECK (message_type = ANY (ARRAY['proposal','counter_offer','revision_request','acceptance','decline','general'])),
  content text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT collab_messages_pkey PRIMARY KEY (id),
  CONSTRAINT collab_messages_collab_id_fkey FOREIGN KEY (collaboration_id) REFERENCES public.project_collaborations(id) ON DELETE CASCADE,
  CONSTRAINT collab_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id)
);
CREATE TABLE public.project_professionals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  is_external boolean NOT NULL DEFAULT false,
  professional_id uuid,
  external_name text,
  external_phone text,
  external_category text,
  external_location text,
  role text DEFAULT 'contact'::text CHECK (role = ANY (ARRAY['contact'::text, 'liked'::text, 'picked'::text])),
  private_note text,
  pro_snapshot jsonb,
  added_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  development_area text,
  rank_order integer DEFAULT 0,
  selection_status text DEFAULT 'candidate'::text CHECK (selection_status = ANY (ARRAY['candidate'::text, 'shortlisted'::text, 'finalist'::text, 'agreed'::text, 'not_selected'::text])),
  project_area_id uuid,
  project_step_id uuid,
  CONSTRAINT project_professionals_pkey PRIMARY KEY (id),
  CONSTRAINT project_professionals_project_area_id_fkey FOREIGN KEY (project_area_id) REFERENCES public.project_areas(id),
  CONSTRAINT project_professionals_project_step_id_fkey FOREIGN KEY (project_step_id) REFERENCES public.project_steps(id),
  CONSTRAINT project_professionals_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.user_projects(id),
  CONSTRAINT project_professionals_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.professionals(id)
);
CREATE TABLE public.project_step_professionals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  step_id uuid,
  project_professional_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT project_step_professionals_pkey PRIMARY KEY (id),
  CONSTRAINT project_step_professionals_step_id_fkey FOREIGN KEY (step_id) REFERENCES public.project_steps(id),
  CONSTRAINT project_step_professionals_project_professional_id_fkey FOREIGN KEY (project_professional_id) REFERENCES public.project_professionals(id)
);
CREATE TABLE public.project_steps (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  title text NOT NULL,
  comment text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'on_hold'::text, 'cancelled'::text, 'approved'::text, 'rejected'::text])),
  budget numeric DEFAULT 0,
  expenditure numeric DEFAULT 0,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT project_steps_pkey PRIMARY KEY (id),
  CONSTRAINT project_steps_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.user_projects(id)
);
CREATE TABLE public.realization_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  realization_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT realization_comments_pkey PRIMARY KEY (id),
  CONSTRAINT realization_comments_realization_id_fkey FOREIGN KEY (realization_id) REFERENCES public.professional_realizations(id),
  CONSTRAINT realization_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.realization_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  realization_id uuid NOT NULL,
  url text NOT NULL,
  title text,
  type text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT realization_documents_pkey PRIMARY KEY (id),
  CONSTRAINT realization_documents_realization_id_fkey FOREIGN KEY (realization_id) REFERENCES public.professional_realizations(id)
);
CREATE TABLE public.realization_images (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  realization_id uuid NOT NULL,
  url text NOT NULL,
  is_main boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT realization_images_pkey PRIMARY KEY (id),
  CONSTRAINT realization_images_realization_id_fkey FOREIGN KEY (realization_id) REFERENCES public.professional_realizations(id)
);
CREATE TABLE public.realization_videos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  realization_id uuid NOT NULL,
  url text NOT NULL,
  thumbnail_url text,
  duration integer,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT realization_videos_pkey PRIMARY KEY (id),
  CONSTRAINT realization_videos_realization_id_fkey FOREIGN KEY (realization_id) REFERENCES public.professional_realizations(id)
);
CREATE TABLE public.realization_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  realization_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT realization_likes_pkey PRIMARY KEY (id),
  CONSTRAINT realization_likes_realization_id_fkey FOREIGN KEY (realization_id) REFERENCES public.professional_realizations(id),
  CONSTRAINT realization_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.recommendations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  professional_id uuid,
  professional_slug text,
  submitter_id uuid NOT NULL,
  submitter_name text NOT NULL,
  submitter_country text NOT NULL,
  submitter_email text NOT NULL,
  project_type text NOT NULL,
  project_description text NOT NULL,
  completion_date date NOT NULL,
  budget_range text NOT NULL CHECK (budget_range = ANY (ARRAY['0-10k'::text, '10k-25k'::text, '25k-50k'::text, '50k-100k'::text, '100k+'::text])),
  location text NOT NULL,
  contract_url text NOT NULL,
  photo_urls ARRAY NOT NULL,
  before_photos ARRAY,
  after_photos ARRAY,
  linked boolean DEFAULT false,
  linked_at timestamp with time zone,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'verified'::text, 'rejected'::text])),
  verified boolean DEFAULT false,
  verified_at timestamp with time zone,
  verified_by uuid,
  verification_notes text,
  rejection_reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  external_name text,
  external_category text,
  external_city text,
  external_country text,
  CONSTRAINT recommendations_pkey PRIMARY KEY (id),
  CONSTRAINT recommendations_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.professionals(id),
  CONSTRAINT recommendations_submitter_id_fkey FOREIGN KEY (submitter_id) REFERENCES public.users(id),
  CONSTRAINT recommendations_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id)
);
CREATE TABLE public.review_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL,
  previous_rating integer NOT NULL,
  previous_comment text,
  changed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT review_history_pkey PRIMARY KEY (id),
  CONSTRAINT review_history_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.reviews(id)
);
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL,
  reviewer_id uuid NOT NULL,
  reviewer_name text NOT NULL,
  reviewer_country text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  is_hidden boolean DEFAULT false,
  hidden_reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.professionals(id),
  CONSTRAINT reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id)
);
CREATE TABLE public.signals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  professional_id uuid,
  professional_slug text,
  submitter_id uuid NOT NULL,
  submitter_name text NOT NULL,
  submitter_country text NOT NULL,
  submitter_email text NOT NULL,
  breach_type text NOT NULL CHECK (breach_type = ANY (ARRAY['timeline'::text, 'budget'::text, 'quality'::text, 'abandonment'::text, 'fraud'::text])),
  breach_description text NOT NULL,
  severity text CHECK (severity = ANY (ARRAY['minor'::text, 'major'::text, 'critical'::text])),
  agreed_start_date date NOT NULL,
  agreed_end_date date NOT NULL,
  actual_start_date date,
  actual_end_date date,
  timeline_deviation text,
  agreed_budget numeric,
  actual_budget numeric,
  budget_deviation text,
  contract_url text NOT NULL,
  evidence_urls ARRAY NOT NULL,
  communication_logs ARRAY,
  pro_response text,
  pro_evidence_urls ARRAY,
  pro_responded_at timestamp with time zone,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'verified'::text, 'rejected'::text, 'disputed'::text])),
  verified boolean DEFAULT false,
  verified_at timestamp with time zone,
  verified_by uuid,
  verification_notes text,
  rejection_reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  external_name text,
  external_category text,
  external_city text,
  external_country text,
  CONSTRAINT signals_pkey PRIMARY KEY (id),
  CONSTRAINT signals_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.professionals(id),
  CONSTRAINT signals_submitter_id_fkey FOREIGN KEY (submitter_id) REFERENCES public.users(id),
  CONSTRAINT signals_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id)
);
CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL,
  stripe_subscription_id text UNIQUE,
  stripe_customer_id text,
  plan text NOT NULL CHECK (plan = ANY (ARRAY['pro_africa'::text, 'pro_europe'::text])),
  status text NOT NULL DEFAULT 'trialing'::text CHECK (status = ANY (ARRAY['active'::text, 'canceled'::text, 'past_due'::text, 'trialing'::text, 'incomplete'::text])),
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean DEFAULT false,
  canceled_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT subscriptions_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.professionals(id)
);
CREATE TABLE public.user_favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  professional_id uuid NOT NULL,
  added_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_favorites_pkey PRIMARY KEY (id),
  CONSTRAINT user_favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT user_favorites_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.professionals(id)
);
CREATE TABLE public.user_projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  category text,
  location text,
  location_lat numeric,
  location_lng numeric,
  location_country text,
  location_formatted text,
  budget_total numeric,
  budget_currency text DEFAULT 'EUR'::text CHECK (budget_currency = ANY (ARRAY['EUR'::text, 'XOF'::text, 'USD'::text])),
  start_date date,
  end_date date,
  status text DEFAULT 'en_preparation'::text CHECK (status = ANY (ARRAY['en_preparation'::text, 'en_cours'::text, 'en_pause'::text, 'termine'::text, 'annule'::text])),
  objectives jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_projects_pkey PRIMARY KEY (id),
  CONSTRAINT user_projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  display_name text NOT NULL,
  role text NOT NULL DEFAULT 'client'::text CHECK (role = ANY (ARRAY['client'::text, 'pro_africa'::text, 'pro_europe'::text, 'pro_intl'::text, 'admin'::text])),
  country text NOT NULL,
  phone text,
  email_notifications boolean DEFAULT true,
  language text DEFAULT 'fr'::text CHECK (language = ANY (ARRAY['fr'::text, 'en'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_login_at timestamp with time zone,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.verification_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  item_type text NOT NULL CHECK (item_type = ANY (ARRAY['recommendation'::text, 'signal'::text])),
  item_id uuid NOT NULL,
  professional_id uuid NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'in_review'::text, 'completed'::text])),
  assigned_to uuid,
  review_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone,
  CONSTRAINT verification_queue_pkey PRIMARY KEY (id),
  CONSTRAINT verification_queue_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.professionals(id),
  CONSTRAINT verification_queue_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id)
);
CREATE TABLE public.pro_google_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pro_id uuid NOT NULL UNIQUE,
  access_token text NOT NULL,
  refresh_token text,
  expiry_date bigint,
  gbp_account_name text,
  gbp_location_name text,
  gbp_place_id text,
  verification_status text DEFAULT 'PENDING'::text,
  connected_at timestamp with time zone DEFAULT now(),
  last_synced_at timestamp with time zone,
  CONSTRAINT pro_google_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT pro_google_tokens_pro_id_fkey FOREIGN KEY (pro_id) REFERENCES public.professionals(id)
);
CREATE TABLE public.pro_google_reviews_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pro_id uuid NOT NULL UNIQUE,
  place_id text,                          -- NULLABLE (migration make_reviews_cache_place_id_nullable) — place_id may not be assigned by Google yet when location is first created
  rating numeric(2,1),
  total_reviews integer DEFAULT 0,
  reviews jsonb DEFAULT '[]'::jsonb,
  cached_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pro_google_reviews_cache_pkey PRIMARY KEY (id),
  CONSTRAINT pro_google_reviews_cache_pro_id_fkey FOREIGN KEY (pro_id) REFERENCES public.professionals(id)
);
-- RLS Policies on pro_google_reviews_cache:
--   pro_google_reviews_cache_insert_own: INSERT — EXISTS (professionals where id = pro_id AND user_id = auth.uid())
--   pro_google_reviews_cache_public_select: SELECT — true (public read for portfolio display)
--   pro_google_reviews_cache_update_own: UPDATE — EXISTS (professionals where id = pro_id AND user_id = auth.uid())

-- ============================================================
-- Storage Buckets (supabase/storage)
-- Updated: 2026-04-12 — Removed MIME type restrictions on project-docs & portfolios
-- ============================================================
-- Bucket: contracts
--   file_size_limit: 10 MB
--   allowed_mime_types: application/pdf (restricted)
--   public: false

-- Bucket: evidence-photos
--   file_size_limit: 5 MB
--   allowed_mime_types: image/jpeg, image/png, image/webp (restricted)
--   public: false

-- Bucket: portfolios
--   file_size_limit: 50 MB
--   allowed_mime_types: {} (ALL types allowed — updated 2026-04-12)
--   public: true
--   RLS Policies:
--     - portfolios_upload_auth_v2 (INSERT) - authenticated users
--     - portfolios_admin_v2 (ALL) - admin role
--     - portfolios_public_read (SELECT) - public read access (added 2026-04-14)

-- Bucket: verification-docs
--   file_size_limit: 10 MB
--   allowed_mime_types: application/pdf (restricted)
--   public: false

-- Bucket: project-docs
--   file_size_limit: 10 MB
--   allowed_mime_types: {} (ALL types allowed — updated 2026-04-12)
--   public: false

-- Note: Storage bucket policies are defined in migrations, not here.
-- See: supabase/migrations/20260323000016_storage.sql
-- See: supabase/migrations/20260412000004_allow_all_doc_types.sql