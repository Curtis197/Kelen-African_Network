# Supabase Implementation Audit

**Date:** 2026-04-04
**Status:** Migrations updated, frontend not yet connected

---

## 1. TypeScript Type Mismatches

### 1.1 `Professional` interface (`lib/supabase/types.ts:35-80`)

**Columns in types but NOT in database:**
- `subscription_plan` — does not exist in `professionals` table
- `subscription_status` — does not exist in `professionals` table
- `subscription_expires_at` — does not exist in `professionals` table
- `total_views` — does not exist in `professionals` table
- `current_month_views` — does not exist in `professionals` table
- `last_view_reset` — does not exist in `professionals` table

**Columns in database but NOT in types:**
- None — all actual DB columns are represented

**Fix:** Remove the 6 phantom columns from the `Professional` interface. Subscription data lives in the separate `subscriptions` table and should be joined when needed.

### 1.2 `Subscription` interface (`lib/supabase/types.ts:160-172`)

**Complete mismatch with actual DB schema:**

| Type field | Actual DB column | Notes |
|---|---|---|
| `plan: "free" \| "premium"` | `plan: "pro_africa" \| "pro_europe"` | Enum values are wrong |
| `status: "active" \| "expired" \| "canceled" \| "past_due"` | `status: "active" \| "canceled" \| "past_due" \| "trialing" \| "incomplete"` | Missing `trialing`, `incomplete`; `expired` doesn't exist |
| `amount` | ❌ does not exist | |
| `currency` | ❌ does not exist | |
| `payment_method` | ❌ does not exist | |
| `payment_id` | ❌ does not exist | |
| `starts_at` | ❌ does not exist | |
| `expires_at` | ❌ does not exist | |
| ❌ missing | `stripe_subscription_id` | |
| ❌ missing | `stripe_customer_id` | |
| ❌ missing | `current_period_start` | |
| ❌ missing | `current_period_end` | |
| ❌ missing | `cancel_at_period_end` | |
| ❌ missing | `canceled_at` | |

**Fix:** Rewrite the `Subscription` interface to match the actual Stripe-based schema.

### 1.3 `Recommendation` interface (`lib/supabase/types.ts:82-109`)

**Missing columns (added by universal recommendations migration):**
- `external_name` — for non-Kelen professionals
- `external_category` — for non-Kelen professionals
- `external_city` — for non-Kelen professionals
- `external_country` — for non-Kelen professionals

**Column type mismatch:**
- `professional_id: string` — should be `string | null` (nullable for external recommendations)

**Fix:** Add the 4 `external_*` fields and make `professional_id` nullable.

### 1.4 `Signal` interface (`lib/supabase/types.ts:111-144`)

**Missing columns (added by universal signals migration):**
- `external_name` — for non-Kelen professionals
- `external_category` — for non-Kelen professionals
- `external_city` — for non-Kelen professionals
- `external_country` — for non-Kelen professionals

**Column type mismatch:**
- `professional_id: string` — should be `string | null` (nullable for external signals)

**Fix:** Add the 4 `external_*` fields and make `professional_id` nullable.

### 1.5 Phantom table types (`lib/supabase/types.ts:237-264`)

These interfaces reference tables that **do not exist** in any migration:
- `ProfessionalRealization` — no `professional_realizations` table
- `RealizationImage` — no `realization_images` table
- `RealizationDocument` — no `realization_documents` table

**Fix:** Remove these three interfaces entirely.

### 1.6 Missing types for existing tables

The following database tables have **no TypeScript interface**:
- `UserProject` (`user_projects`)
- `ProjectProfessional` (`project_professionals`)
- `ProjectPayment` (`project_payments`)
- `UserFavorite` (`user_favorites`)
- `ProjectDocument` (`project_documents`)
- `ProjectStep` (`project_steps`)
- `ProjectStepProfessional` (`project_step_professionals`)
- `ProjectArea` (`project_areas`)
- `ProfessionalArea` (`professional_areas`)
- `Profession` (`professions`)
- `ReviewHistory` (`review_history`)

**Fix:** Add interfaces for all 11 missing tables.

### 1.7 Type enum mismatches

| Type | Issue |
|---|---|
| `SubscriptionPlan` | Values are `"free" \| "premium"` but DB uses `"pro_africa" \| "pro_europe"` |
| `SubscriptionStatus` | Includes `"expired"` (doesn't exist), missing `"trialing"` and `"incomplete"` |
| `PaymentMethod` | Includes `"stripe" \| "wave" \| "orange_money"` but `project_payments.payment_method` uses `"virement" \| "especes" \| "wave" \| "orange_money" \| "autre"` |

---

## 2. Code Referencing Non-Existent Tables/Columns

### 2.1 `lib/actions/realisations.ts`

- References `professional_realizations` table — **does not exist**
- The `deleteRealization()` function will fail at runtime
- No migration ever created this table

### 2.2 `lib/actions/reviews.ts`

- Queries `users` table for `first_name` and `last_name` columns — **do not exist**
- The actual column is `display_name`
- Will cause runtime query errors

### 2.3 Components querying wrong columns

Any component that reads `subscription_plan`, `subscription_status`, `total_views`, or `current_month_views` directly from the `professionals` table will get `null`/undefined since those columns don't exist.

---

## 3. Missing Implementations

### 3.1 API Routes (completely missing)

| Route | Purpose | Priority |
|---|---|---|
| `app/api/webhooks/stripe/route.ts` | Stripe webhook for subscription events | **Critical** |
| `app/api/webhooks/wave/route.ts` | Wave payment webhook | High |
| `app/api/analytics/track/route.ts` | Profile view tracking (`track_profile_view` function exists in DB but is never called) | High |
| `app/api/cron/refresh-views/route.ts` | Refresh materialized views | Medium |
| `app/api/cron/reset-monthly/route.ts` | Reset monthly analytics counters | Medium |

### 3.2 Stripe Integration (not implemented)

- No Stripe SDK initialization
- No checkout session creation
- No webhook handler for `invoice.payment_succeeded`, `customer.subscription.deleted`, etc.
- No sync logic to update `subscriptions` table from Stripe events
- The `update_professional_visibility()` trigger exists but no Stripe events will fire to activate it

### 3.3 African Payment Integration (not implemented)

- No Wave API integration
- No Orange Money API integration
- No payment flow for manual payment recording

### 3.4 Email Service (not implemented)

- No Resend/SendGrid setup
- No email templates for:
  - Account verification
  - Password reset
  - Professional verification status
  - Project document notifications (`project_documents.client_notified_at`)
  - Signal/rejection notifications

### 3.5 Cron Jobs (not implemented)

| Job | Purpose | DB dependency |
|---|---|---|
| Refresh `professional_analytics_view` | Keep materialized view current | `professional_analytics_view` |
| Refresh `platform_metrics_view` | Keep admin dashboard current | `platform_metrics_view` |
| Reset monthly view counters | If using monthly tracking | `profile_views` |
| Auto-publish verified documents | Move `pending_review` → `published` | `project_documents` |

### 3.6 Frontend Data Connections

Per `documentation/BACKEND_TODO.md` and `documentation/Frontend_WORK_DONE.md`, all pages use **demo/mock data** with `// TODO` comments. Forms submit to `console.log` instead of Supabase. Key pages:

- All project management pages
- Professional dashboard
- Search/results pages
- Review submission
- Recommendation submission
- Signal submission
- Admin verification queue

### 3.7 Middleware Auth (commented out)

The auth middleware logic is present but commented out. Needs to be activated once auth flow is tested.

---

## 4. Row Level Security (RLS) Status

### 4.1 RLS Policies

The migrations enable RLS on all tables (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`) but **no policies are defined** in the migration files. This means:

- **All tables are locked** — no user can read or write any data
- The website will return 403/permission errors on every query once connected
- Policies must be created before any frontend connection

### 4.2 Required RLS Policies (not implemented)

| Table | Needed Policies |
|---|---|
| `users` | Users can read own row; admins can read all |
| `professionals` | Public read for visible profiles; pros can update own |
| `subscriptions` | Pros can read own; admins can read all |
| `recommendations` | Submitters can read own; admins can read/update all; public read for verified |
| `signals` | Submitters can read own; admins can read/update all |
| `reviews` | Public read for non-hidden; users can create; admins can hide |
| `profile_views` | Pros can read own; system can insert |
| `profile_interactions` | Pros can read own; system can insert |
| `verification_queue` | Admins only |
| `user_projects` | Users can CRUD own |
| `project_professionals` | Users can CRUD on own projects |
| `project_payments` | Users can CRUD on own projects |
| `user_favorites` | Users can CRUD own |
| `project_documents` | Pros can create own; admins can review; clients can read published |
| `project_steps` | Users can CRUD on own projects |
| `project_areas` | Users can CRUD on own projects |
| `professional_areas` | Public read; admin CRUD |
| `professions` | Public read; admin CRUD |

---

## 5. Storage Bucket Issues

### 5.1 Bucket Name Mismatches

| BACKEND_TODO.md reference | Actual migration bucket | Status |
|---|---|---|
| `evidence` | `evidence-photos` | Name mismatch |
| `photos` | `portfolios` | Name mismatch |
| (not mentioned) | `contracts` | Missing from docs |
| (not mentioned) | `verification-docs` | Missing from docs |
| (not mentioned) | `project-docs` | Missing from docs |

### 5.2 Storage Policies

The storage migration (`20260323000016_storage.sql`) creates buckets but **storage policies** (who can upload/download) may need review:
- `contracts` bucket is private — correct
- `evidence-photos` bucket is private — correct
- `portfolios` bucket is public — correct
- `verification-docs` bucket is private — correct
- `project-docs` bucket is private — correct

### 5.3 No storage usage in frontend

The `lib/supabase/storage.ts` utilities exist but are not called by any form or component. All file upload flows are unimplemented.

---

## 6. Database Function Issues

### 6.1 `compute_professional_status()` 

This is the core business logic function. It references:
- `subscriptions` table — exists, but plan values may not match expected values
- `recommendations` table — exists with new `external_*` columns
- `signals` table — exists with new `external_*` columns
- `reviews` table — exists

**Potential issue:** If the function logic expects `professional_id` to always be non-null on recommendations/signals, it will break with the new universal (external) records.

### 6.2 `handle_new_user()` trigger

Creates both `users` and `professionals` rows on auth signup. The `professionals` insert may fail if:
- Required fields like `business_name`, `owner_name`, `country`, `city`, `phone`, `email` don't have defaults
- The trigger doesn't handle the case where a `client` role signs up (shouldn't create a `professionals` row)

### 6.3 `track_profile_view()` function

Exists in DB but is **never called** from the frontend. Profile view analytics are completely non-functional.

### 6.4 Materialized view refresh

No function or cron job exists to `REFRESH MATERIALIZED VIEW` for:
- `professional_analytics_view`
- `platform_metrics_view`

These views will show stale/empty data until manually refreshed.

---

## 7. Documentation Issues

### 7.1 `documentation/BACKEND_TODO.md`

- **Severely outdated** — references tables that don't exist (`credits`, `credit_usage`, `admin_logs`)
- References CPM-based billing that was removed
- Storage bucket names don't match migrations
- All items are unchecked despite migrations being complete
- Should be rewritten to reflect current state

### 7.2 `documentation/Architecture/DATABASE_REFERENCE.md`

Needs verification against actual migrations to ensure accuracy.

### 7.3 `backend-plan.md` and `gemini/backend-plan.md`

Likely outdated. Should be reviewed against current migration state.

---

## 8. Security Concerns

### 8.1 No RLS policies (critical)

As noted in section 4, all tables have RLS enabled but no policies defined. This is the single biggest blocker.

### 8.2 Auth callback route

`app/auth/callback/route.ts` exists but:
- No email template customization
- No post-signup redirect logic for different user roles
- No profile completion flow

### 8.3 Environment variables

- Supabase URL and anon key must be configured
- Supabase service role key needed for server-side operations
- Stripe secret key and webhook secret needed
- Email service API key needed
- None of these are documented with a `.env.example` file

### 8.4 No rate limiting

No rate limiting on:
- Review submission (could be spammed)
- Signal submission (could be abused)
- Profile view tracking (could be inflated)

---

## 9. Summary — Priority Action Items

### Critical (blocks all functionality)
1. **Create RLS policies** for all 18 tables
2. **Fix TypeScript types** to match actual database schema
3. **Fix `lib/actions/reviews.ts`** — wrong column names (`first_name`/`last_name` → `display_name`)
4. **Remove or fix `lib/actions/realisations.ts`** — references non-existent table

### High Priority (needed for core features)
5. **Implement Stripe webhook handler**
6. **Connect frontend forms to Supabase** (replace mock data)
7. **Activate auth middleware**
8. **Create storage upload flows** in forms
9. **Add missing TypeScript types** for 11 tables

### Medium Priority (needed for production)
10. **Implement email service** (Resend/SendGrid)
11. **Set up cron jobs** for materialized view refresh
12. **Implement `track_profile_view` calls** from frontend
13. **Add rate limiting** on user-submitted content
14. **Create `.env.example`** with all required variables

### Low Priority (cleanup)
15. **Update `BACKEND_TODO.md`** to reflect current state
16. **Remove phantom type interfaces** (`ProfessionalRealization`, etc.)
17. **Audit `DATABASE_REFERENCE.md`** against migrations
18. **Review `handle_new_user()` trigger** for client role handling
