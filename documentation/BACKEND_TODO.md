# Kelen — Backend Work To Do

> **Owner:** You (learning backend mastery)
> **Frontend status:** All pages built with demo data, ready to connect
> **Each section lists what the frontend expects**

---

## 1. Supabase Project Setup

- [ ] Create Supabase project
- [ ] Get project URL and anon key
- [ ] Create `.env.local` with:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
  ```
- [ ] Add these env vars to Vercel project settings

---

## 2. Database Tables

Create all tables as defined in `documentation/Architecture/DATABASE_REFERENCE.md`:

- [ ] `users` — id, email, first_name, last_name, role, country, language, email_notifications, created_at
- [ ] `professionals` — id, user_id, slug, business_name, owner_name, category, city, country, phone, whatsapp, email, description, services_offered, years_experience, team_size, is_visible, verified, created_at
- [ ] `recommendations` — id, professional_id, submitter_id, project_type, project_description, completion_date, budget_range, location, photo_urls, linked, status, admin_notes, verified_at, created_at
- [ ] `signals` — id, professional_id, submitter_id, breach_type, breach_description, severity, agreed_start_date, agreed_end_date, timeline_deviation, budget_deviation, evidence_urls, pro_response, pro_responded_at, status, admin_notes, verified_at, created_at
- [ ] `reviews` — id, professional_id, reviewer_id, rating, comment, created_at
- [ ] `admin_logs` — id, admin_id, action, target_type, target_id, details, created_at
- [ ] `credits` — id, professional_id, amount, price, payment_method, payment_id, created_at
- [ ] `credit_usage` — id, professional_id, views_consumed, period_start, period_end
- [ ] `profile_views` — id, professional_id, viewer_id, source, created_at

### Materialized Views
- [ ] `professional_stats` — recommendation_count, signal_count, avg_rating, positive_review_pct, review_count (per professional)
- [ ] `search_index` — denormalized view for fast search queries

---

## 3. Database Functions

- [ ] `compute_professional_status(professional_id)` — Returns gold/silver/white/red/black based on:
  - **Gold:** 3+ verified recs, avg_rating ≥ 4.0, 0 verified signals
  - **Silver:** 1-2 verified recs, avg_rating ≥ 3.5, 0 verified signals
  - **White:** 0 verified recs, 0 verified signals
  - **Red:** 1 verified signal
  - **Black:** 2+ verified signals
- [ ] `track_profile_view(professional_id, viewer_id, source)` — Inserts into profile_views, increments monthly counter
- [ ] `reset_monthly_views()` — Resets monthly view counters (called by cron)
- [ ] `refresh_professional_stats()` — Refreshes the materialized view

---

## 4. Database Triggers

- [ ] After insert/update on `recommendations` (when status changes to 'verified') → recalculate professional status
- [ ] After insert/update on `signals` (when status changes to 'verified') → recalculate professional status
- [ ] After insert on `reviews` → refresh professional stats
- [ ] After insert on `recommendations` → notify professional (if linked)
- [ ] After insert on `signals` → notify professional (start 15-day response window)

---

## 5. Row Level Security (RLS)

### `users`
- [ ] Users can read/update their own row
- [ ] Admins can read all

### `professionals`
- [ ] Public can read where `is_visible = true`
- [ ] Professional can update their own row
- [ ] Admins can read/update all

### `recommendations`
- [ ] Public can read where `status = 'verified'`
- [ ] Submitter can read their own (any status)
- [ ] Submitter can insert (authenticated)
- [ ] Professional can read recommendations linked to them
- [ ] Admins can read/update all

### `signals`
- [ ] Public can read where `status = 'verified'`
- [ ] Submitter can read their own
- [ ] Submitter can insert (authenticated)
- [ ] Professional can read signals about them + update `pro_response`
- [ ] Admins can read/update all

### `reviews`
- [ ] Public can read all
- [ ] Authenticated users can insert
- [ ] Admins can delete

### `admin_logs`
- [ ] Only admins can read/insert

### `credits` / `credit_usage`
- [ ] Professional can read their own
- [ ] Admins can read all

### `profile_views`
- [ ] Professional can read aggregate stats for their profile
- [ ] Admins can read all

---

## 6. Authentication

- [ ] Enable Email/Password auth in Supabase dashboard
- [ ] Configure email templates (French):
  - Confirmation email
  - Password reset email
  - Magic link email (optional)
- [ ] Set up redirect URLs for password reset
- [ ] **Frontend connection points:**
  - `components/forms/LoginForm.tsx` → `supabase.auth.signInWithPassword()`
  - `components/forms/RegisterForm.tsx` → `supabase.auth.signUp()` + insert into `users`/`professionals`
  - `components/forms/PasswordResetForm.tsx` → `supabase.auth.resetPasswordForEmail()`
  - `middleware.ts` → `supabase.auth.getSession()` + role check

---

## 7. Storage Buckets

- [ ] Create `evidence` bucket — for signal evidence files (photos, PDFs, contracts)
  - Max 5 MB per file
  - Accepted types: JPG, PNG, PDF
  - Max 10 files per signal
- [ ] Create `photos` bucket — for recommendation project photos
  - Max 5 MB per file
  - Accepted types: JPG, PNG
  - Max 5 files per recommendation
- [ ] Storage policies:
  - Authenticated users can upload to their own folder
  - Public can read verified content
  - Admins can read/delete all

---

## 8. Edge Functions

- [ ] `process-payment` — Handle Stripe checkout session creation
  - Input: professional_id, credit_package (amount, price)
  - Creates Stripe checkout session
  - Returns checkout URL
  - **Frontend calls:** `app/(professional)/pro/credit/page.tsx` buy buttons

---

## 9. Webhooks

- [ ] Stripe webhook handler (`app/api/webhooks/stripe/route.ts`)
  - Listen for `checkout.session.completed`
  - Insert into `credits` table
  - Update professional's credit balance
- [ ] Wave webhook handler (`app/api/webhooks/wave/route.ts`) — if using Wave for African payments

---

## 10. Cron Jobs

- [ ] Monthly: `reset_monthly_views()` — reset view counters for credit consumption
- [ ] Daily: `refresh_professional_stats()` — refresh materialized views
- [ ] Daily: Check for signals past 15-day response deadline → auto-publish

---

## 11. Frontend Connection Points

Every page with `// TODO` comments shows exactly where to replace demo data. Here's a quick reference:

| Page | What to connect |
|---|---|
| `/recherche` | `supabase.from('search_index').select()` with filters |
| `/pro/[slug]` | `supabase.from('professionals').select()` + recommendations + signals + reviews |
| `/connexion` | `supabase.auth.signInWithPassword()` |
| `/inscription` | `supabase.auth.signUp()` + insert user/professional |
| `/mot-de-passe` | `supabase.auth.resetPasswordForEmail()` |
| `/dashboard` | `supabase.from('recommendations').select()` where submitter = current user |
| `/recommandation/[slug]` | `supabase.from('recommendations').insert()` |
| `/signal/[slug]` | `supabase.from('signals').insert()` + file upload to storage |
| `/avis/[slug]` | `supabase.from('reviews').insert()` |
| `/pro/dashboard` | `supabase.from('professional_stats').select()` + pending items |
| `/pro/profil` | `supabase.from('professionals').update()` |
| `/pro/recommandations` | `supabase.from('recommendations').select()` + link action |
| `/pro/signal` | `supabase.from('signals').select()` + `update({ pro_response })` |
| `/pro/credit` | `supabase.from('credits').select()` + Stripe checkout |
| `/pro/analytique` | `supabase.from('profile_views').select()` aggregated |
| `/admin` | Count queries on all tables |
| `/admin/queue` | `supabase.from('recommendations').select().eq('status', 'pending')` + signals |
| `/admin/queue/[id]` | Full detail query + `update({ status, admin_notes })` |
| `/admin/journal` | `supabase.from('admin_logs').select()` |
| `middleware.ts` | Uncomment Supabase session check + role redirect |

---

## Suggested Order

1. **Supabase project + env vars** — unblocks everything
2. **Tables + RLS** — database foundation
3. **Authentication** — enables login/register/middleware
4. **SQL functions + triggers** — status computation, stats refresh
5. **Storage buckets** — enables file uploads in signal/recommendation forms
6. **Connect frontend pages** — replace demo data one page at a time
7. **Stripe + Edge Functions** — credit purchase flow
8. **Cron jobs** — monthly resets, auto-publish
9. **Materialized views** — search optimization
