# Kelen — MVP Architecture

> **Learning objective:** Mastering Supabase backend (SQL functions, RLS, Edge Functions). Frontend (Next.js 14) handled separately by Claude Code.

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [The Two Systems](#2-the-two-systems)
3. [Tech Stack](#3-tech-stack)
4. [Database Schema](#4-database-schema)
5. [Database Functions](#5-database-functions)
6. [Database Triggers](#6-database-triggers)
7. [Row Level Security (RLS)](#7-row-level-security-rls)
8. [Storage Buckets](#8-storage-buckets)
9. [Materialized Views](#9-materialized-views)
10. [External Integrations](#10-external-integrations)
11. [Build Phases](#11-build-phases)

---

## 1. Platform Overview

Kelen is a **permanent accountability platform** for diaspora-professional collaborations in Africa.

**Core principle:** A verified pattern of contract breaches ends your career. Sustained excellence builds absolute trust.

| Actor | Problem | Kelen Solution |
|---|---|---|
| Diaspora (users) | Sending €20k–100k with no way to verify trust | Free permanent lookup of any professional by name |
| Professionals | Can't reach diaspora clients, reputation doesn't travel | Paid discovery via CPM model, status earned through track record |

---

## 2. The Two Systems

### System 1 — Validation (Free, Public, Permanent)

- Search any professional by **exact name**
- See their **Gold / Red / Grey** status
- View verified recommendations and signals
- Submit evidence-based recommendations or signals
- **Cannot be paid to remove or hide**

### System 2 — Advertisement (CPM-Based Discovery)

- Professionals pay **€5 per 1,000 profile views**
- Appear in browse/search/category listings
- Contact info and portfolio visible when credit > 0
- No subscription — pay only for actual visibility
- Profile removed from discovery when credit = 0 (validation still works)

### Status Tiers (5 levels)

| Status | Criteria | Search visibility |
|---|---|---|
| 🟡 Liste Or | ≥ 5 rec. vérifiées + rating ≥ 4.5 + 90% positifs + 0 signal | ✅ Visible |
| ⚪ Liste Argent | 1–4 rec. vérifiées + rating ≥ 4.0 + 80% positifs + 0 signal | ✅ Visible |
| 🤍 Liste Blanche | 0 rec. vérifiées ou critères Argent non atteints + 0 signal | ✅ Visible |
| 🔴 Liste Rouge | 1–2 signaux vérifiés | ✅ Visible (alerte rouge) |
| ⚫ Liste Noire | ≥ 3 signaux vérifiés | ❌ Invisible (profil direct accessible) |

**Rating** = note 1–5 étoiles laissée par n'importe quel utilisateur authentifié (non vérifié, comme Google Reviews). Visible publiquement. Non retirable sauf contenu illégal.

**Ancienneté** (critère optionnel, activation prévue à 3 ans de plateforme) : Or exigera ≥ 3 ans de présence, Argent ≥ 1 an. Voir `STATUS_SYSTEM.md` pour la logique complète.

> Référence complète : voir `STATUS_SYSTEM.md`

---

## 3. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | Next.js 14 + TypeScript | SSR, RSC, Vercel integration |
| Styling | Tailwind CSS + shadcn/ui | Fast, accessible, customizable |
| Backend | Supabase (Postgres + Auth + Storage) | RLS, Realtime, all-in-one |
| Hosting | Vercel | Auto-deploy, CDN, preview environments |
| Payments (EU) | Stripe | Cards, SEPA, Apple/Google Pay |
| Payments (Africa) | Wave + Orange Money | Mobile money, XOF |
| Email | Resend | Transactional, React templates |
| SMS/OTP | Twilio | Phone auth for Africa |
| Errors | Sentry | Production monitoring |

**Currency rule:** All balances stored in EUR. Display in XOF based on user location at runtime.

---

## 4. Database Schema

### `users`

Central registry. `id` mirrors `auth.users.id` from Supabase Auth.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'professional', 'admin')),
  country TEXT NOT NULL, -- ISO 3166-1 alpha-2
  phone TEXT,
  email_notifications BOOLEAN DEFAULT TRUE,
  language TEXT DEFAULT 'fr' CHECK (language IN ('fr', 'en')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);
```

---

### `professionals`

One per user. Exists even with zero credit (free validation). Visibility is a generated column.

```sql
CREATE TABLE professionals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- Identity
  business_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- e.g. kouadio-construction-abidjan

  -- Business info
  category TEXT NOT NULL,
  subcategories TEXT[],
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT NOT NULL,

  -- Profile content
  description TEXT,
  services_offered TEXT[],
  years_experience INTEGER,
  team_size INTEGER,
  portfolio_photos TEXT[],
  portfolio_videos TEXT[],

  -- Status (computed — never set manually)
  status TEXT NOT NULL DEFAULT 'white' CHECK (status IN ('gold', 'silver', 'white', 'red', 'black')),
  recommendation_count INTEGER DEFAULT 0,
  signal_count INTEGER DEFAULT 0,
  avg_rating NUMERIC(3,2),           -- computed from reviews table
  positive_review_pct NUMERIC(5,2),  -- % of reviews with rating >= 4
  review_count INTEGER DEFAULT 0,

  -- CPM advertisement
  credit_balance NUMERIC(10,2) DEFAULT 0.00 CHECK (credit_balance >= 0),
  total_views INTEGER DEFAULT 0,
  monthly_view_cap INTEGER,        -- NULL = uncapped
  current_month_views INTEGER DEFAULT 0,
  last_view_reset TIMESTAMPTZ,
  auto_reload_enabled BOOLEAN DEFAULT FALSE,
  auto_reload_amount NUMERIC(10,2),
  auto_reload_threshold NUMERIC(10,2),

  -- Verification
  verified BOOLEAN DEFAULT FALSE,
  verification_documents TEXT[],
  verified_at TIMESTAMPTZ,

  -- Visibility
  is_active BOOLEAN DEFAULT TRUE,
  is_visible BOOLEAN GENERATED ALWAYS AS (credit_balance > 0 AND is_active) STORED,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### `recommendations`

Submitted by clients, claimed (linked) by professionals. Both `verified` AND `linked` must be TRUE to count toward Gold status.

```sql
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  professional_slug TEXT NOT NULL, -- denormalized

  -- Submitter snapshot
  submitter_id UUID NOT NULL REFERENCES users(id),
  submitter_name TEXT NOT NULL,
  submitter_country TEXT NOT NULL,
  submitter_email TEXT NOT NULL,

  -- Project
  project_type TEXT NOT NULL,
  project_description TEXT NOT NULL,
  completion_date DATE NOT NULL,
  budget_range TEXT NOT NULL CHECK (budget_range IN ('0-10k','10k-25k','25k-50k','50k-100k','100k+')),
  location TEXT NOT NULL,

  -- Evidence
  contract_url TEXT NOT NULL,
  photo_urls TEXT[] NOT NULL,
  before_photos TEXT[],
  after_photos TEXT[],

  -- Linking (pro claims ownership)
  linked BOOLEAN DEFAULT FALSE,
  linked_at TIMESTAMPTZ,

  -- Verification (admin review)
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id),
  verification_notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
  rejection_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### `signals`

Contract breach reports. One verified signal = RED forever.

```sql
CREATE TABLE signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  professional_slug TEXT NOT NULL,

  -- Submitter snapshot
  submitter_id UUID NOT NULL REFERENCES users(id),
  submitter_name TEXT NOT NULL,
  submitter_country TEXT NOT NULL,
  submitter_email TEXT NOT NULL,

  -- Breach
  breach_type TEXT NOT NULL CHECK (breach_type IN ('timeline','budget','quality','abandonment','fraud')),
  breach_description TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('minor','major','critical')),

  -- Timeline evidence
  agreed_start_date DATE NOT NULL,
  agreed_end_date DATE NOT NULL,
  actual_start_date DATE,
  actual_end_date DATE,
  timeline_deviation TEXT,

  -- Budget evidence
  agreed_budget NUMERIC(10,2),
  actual_budget NUMERIC(10,2),
  budget_deviation TEXT,

  -- Evidence
  contract_url TEXT NOT NULL,
  evidence_urls TEXT[] NOT NULL,
  communication_logs TEXT[],

  -- Professional response (cannot remove, can only respond)
  pro_response TEXT,
  pro_evidence_urls TEXT[],
  pro_responded_at TIMESTAMPTZ,

  -- Verification
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id),
  verification_notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected','disputed')),
  rejection_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### `credit_transactions`

Immutable financial ledger. No updates or deletes — corrections use `adjustment` type.

```sql
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id UUID NOT NULL REFERENCES professionals(id),

  type TEXT NOT NULL CHECK (type IN ('purchase','deduction','refund','adjustment')),
  amount NUMERIC(10,2) NOT NULL,        -- positive for purchase/refund, negative for deduction
  balance_after NUMERIC(10,2) NOT NULL, -- running balance snapshot
  description TEXT NOT NULL,

  payment_method TEXT CHECK (payment_method IN ('stripe','wave','orange_money')),
  payment_id TEXT,   -- external payment reference
  currency TEXT CHECK (currency IN ('EUR','XOF')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET
);
```

---

### `profile_views`

Analytics — one row per view. Immutable.

```sql
CREATE TABLE profile_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id UUID NOT NULL REFERENCES professionals(id),

  viewer_ip_hash TEXT NOT NULL, -- SHA-256 hash (GDPR compliant)
  viewer_country TEXT,
  viewer_city TEXT,

  source TEXT NOT NULL CHECK (source IN ('search','browse','category','direct')),
  search_query TEXT,
  referrer TEXT,
  cost_deducted NUMERIC(10,4) NOT NULL DEFAULT 0.0050,
  view_duration INTEGER, -- seconds, tracked client-side

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### `profile_interactions`

Contact button click events. Feeds conversion funnel analytics.

```sql
CREATE TABLE profile_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id UUID NOT NULL REFERENCES professionals(id),

  type TEXT NOT NULL CHECK (type IN ('contact_click','phone_click','whatsapp_click','email_click')),
  viewer_ip_hash TEXT NOT NULL,
  viewer_country TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### `verification_queue`

Admin workflow. Auto-populated by triggers on insert to `recommendations` and `signals`.

```sql
CREATE TABLE verification_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  item_type TEXT NOT NULL CHECK (item_type IN ('recommendation','signal')),
  item_id UUID NOT NULL,
  professional_id UUID NOT NULL REFERENCES professionals(id),

  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_review','completed')),
  assigned_to UUID REFERENCES users(id),
  review_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);
```

---

## 5. Database Functions

### `compute_professional_status(prof_id UUID)`

Recalculates and persists the 5-tier status. Called by triggers on recommendations, signals, and reviews. Signals always take priority.

**Logic:**
1. Count `signals` where `verified = TRUE`
   - If ≥ 3 → `black` (stop)
   - If 1 or 2 → `red` (stop)
2. Count `recommendations` where `verified = TRUE AND linked = TRUE`
3. Compute `avg_rating` and `positive_review_pct` from `reviews` (excluding `is_hidden = TRUE`)
4. If NULL ratings (no reviews yet) → rating criteria are skipped (not blocking)
5. Try `gold`: rec ≥ 5 AND avg_rating ≥ 4.5 AND pct ≥ 90
6. Try `silver`: rec ≥ 1 AND avg_rating ≥ 4.0 AND pct ≥ 80
7. Otherwise → `white`
8. UPDATE `professionals` with new status + all computed metrics

---

### `track_profile_view(prof_id, viewer_ip, viewer_country, source, search_query)`

Atomic function: records view, deducts credit, handles cap logic.

**Logic:**
1. Lock professional row
2. Abort if `credit_balance <= 0`
3. Check monthly cap — reset counter if new month, abort if cap reached
4. Insert into `profile_views` (IP hashed with SHA-256)
5. Insert into `credit_transactions` (type = `deduction`, amount = -0.005)
6. Update `credit_balance`, `total_views`, `current_month_views`
7. Set `is_active = FALSE` if balance hits zero
8. Trigger auto-reload check if threshold reached

---

### `reset_monthly_views()`

Cron job (nightly). Resets `current_month_views = 0` and `last_view_reset = NOW()` for all capped accounts where the month has rolled over.

---

## 6. Database Triggers

| Trigger | When | Action |
|---|---|---|
| `on_recommendation_verified` | After recommendations `verified = TRUE` or `linked` changes | Call `compute_professional_status`, notify pro + submitter, mark queue complete |
| `on_signal_verified` | After signals `verified = TRUE` | Call `compute_professional_status` → sets Red (1–2) or Black (3+), send urgent notification to pro, notify submitter |
| `on_review_submitted` | After INSERT or UPDATE `rating`/`is_hidden` on reviews | Call `compute_professional_status` to recompute avg_rating + pct |
| `on_credit_depleted` | After `credit_balance` drops to 0 | Set `is_active = FALSE`, send "visibility ended" email |
| `add_to_queue_on_recommendation` | After INSERT on recommendations | Auto-create `verification_queue` row |
| `add_to_queue_on_signal` | After INSERT on signals | Auto-create `verification_queue` row |
| `generate_professional_slug` | Before INSERT on professionals | Slugify `business_name + city`, append number if not unique |
| `set_updated_at` | Before UPDATE on any table | Set `updated_at = NOW()` |

---

## 7. Row Level Security (RLS)

### `users`
- Own row: SELECT + UPDATE (cannot change own role)
- Admins: SELECT all

### `professionals`
- Public: SELECT if `is_visible = TRUE`
- Authenticated: SELECT all (for name-lookup / validation)
- Own row: UPDATE (cannot modify `status`, `recommendation_count`, `signal_count`)
- Admins: ALL

### `recommendations`
- Public: SELECT if `verified = TRUE`
- Submitter: SELECT own + INSERT
- Professional: UPDATE own (only `linked` + `linked_at` fields)
- Admins: UPDATE (to verify/reject)

### `signals`
- Public: SELECT if `verified = TRUE`
- Submitter: SELECT own + INSERT
- Professional: UPDATE own (only `pro_response`, `pro_evidence_urls`, `pro_responded_at`)
- Admins: UPDATE (to verify/reject)

### `credit_transactions`
- Professional: SELECT own
- System only: INSERT (via service role from functions)
- Admins: SELECT all
- No UPDATE / DELETE for anyone

### `profile_views` / `profile_interactions`
- Professional: SELECT own
- Admins: SELECT all
- No UPDATE / DELETE for anyone

### `verification_queue`
- Admins only: ALL operations

---

## 8. Storage Buckets

| Bucket | Contents | Upload | Read |
|---|---|---|---|
| `contracts` | PDF contracts (recommendations + signals) | Authenticated users | Public if parent verified |
| `evidence-photos` | Before/after photos, WhatsApp screenshots | Authenticated users | Public if parent verified |
| `portfolios` | Professional showcase photos + videos | Professional (own only) | Public if pro is visible |
| `verification-docs` | Business registration docs | Professional (own only) | Admin only |

### File constraints

| Type | Formats | Max size |
|---|---|---|
| Contracts | PDF | 10 MB |
| Evidence photos | JPG, PNG | 5 MB |
| Portfolio photos | JPG, PNG | 5 MB |
| Portfolio videos | MP4 | 50 MB |
| Verification docs | PDF | 10 MB |

**Security pipeline on upload:**
1. Client validates type + size before upload
2. Supabase Storage webhook triggers Edge Function
3. Edge Function: re-validates MIME type, runs ClamAV virus scan
4. If infected → delete file, notify user
5. Private files served via signed URLs (1-hour expiry)

---

## 9. Materialized Views

### `professional_analytics_view`
Pre-aggregated per-professional metrics. Refreshed hourly.

Provides: `views_this_month`, `clicks_this_month`, `views_last_30_days`, `clicks_last_30_days`, `conversion_rate_30d`, `top_source`, `top_viewer_country`.

### `platform_metrics_view`
Platform-wide admin dashboard metrics. Refreshed every 15 minutes.

Provides: total users/professionals, Gold/Red/Grey counts, verification queue size, revenue this month, views/clicks last 30 days, new users this week.

---

## 10. External Integrations

| Service | Role |
|---|---|
| **Stripe** | EUR payments from diaspora (cards, SEPA, Apple/Google Pay) |
| **Wave** | XOF mobile money (Senegal, Côte d'Ivoire, Mali, Burkina Faso) |
| **Orange Money** | XOF backup (pan-African coverage) |
| **Resend** | Transactional email (verification, credit alerts, signal notifications) |
| **Twilio** | SMS/OTP for phone authentication in Africa |
| **Sentry** | Production error tracking |
| **Cloudflare** | DNS, DDoS protection, SSL |
| **ClamAV** | Virus scanning for file uploads |

**Webhook flows:**
- Stripe → `/api/webhooks/stripe` → add credit to `professionals.credit_balance`
- Wave/Orange Money → `/api/webhooks/wave` → same
- File upload → Supabase Edge Function → ClamAV scan

---

## 11. Build Phases

### Phase 1 — Validation Core (Weeks 1–2)
- Tables: `users`, `professionals`, `recommendations`, `signals`, `verification_queue`
- Functions: `compute_professional_status`
- Triggers: `on_recommendation_verified`, `on_signal_verified`, `add_to_queue_*`
- RLS policies for all tables
- Storage buckets: `contracts`, `evidence-photos`
- Manual verification queue (admin reviews evidence)
- Public name-lookup search

### Phase 2 — Advertisement System (Weeks 3–4)
- CPM credit system: `credit_transactions`, `profile_views`, `profile_interactions`
- Function: `track_profile_view`
- Trigger: `on_credit_depleted`
- Stripe + Wave payment integration
- Storage bucket: `portfolios`
- Professional dashboard (credit, views, conversion)

### Phase 3 — Scale & Automation (Month 2–3)
- Materialized views + cron jobs
- Function: `reset_monthly_views`
- Auto-reload system
- `verification-docs` bucket + verification badge flow
- Edge Functions for async tasks (email, virus scan)
- Analytics dashboard (admin)

---

*Backend: Supabase (Postgres, Auth, Storage, Edge Functions) — Frankfurt region (GDPR)*
*Frontend: Next.js 14 + TypeScript — handled separately*
*Payments: Stripe (EUR) + Wave/Orange Money (XOF)*
