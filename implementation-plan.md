# Implementation Plan — Kelen Platform

> Created: 2026-04-08
> Sources: `feature-implementation-audit.md`, `professional-dashboard-audit.md`, `professional-portfolio-audit.md`, `FRONTEND_AUDIT.md`, `BLUEPRINT.md`, `backend-plan.md`
> Strategy: **Fix broken → Wire data → Build missing → Polish**

---

## Guiding Principles

1. **Revenue first** — Payment flow must work before anything else is polished
2. **Data over demo** — Every hardcoded page gets real queries before new features
3. **Dark mode as default** — All fixes use semantic tokens (`bg-surface`, `text-on-surface`), never raw colors
4. **One page per commit** — Each route fix is atomic and testable independently
5. **Server actions over client queries** — Migrate client-side Supabase calls to server actions where possible

---

## Phase 0 — Quick Wins & Cleanup (Day 1)

*Low-risk fixes that unblock everything else. No new dependencies.*

### 0.1 Replace all `bg-white` → `bg-surface` across dashboard pages

**Files affected (12+):**
- `app/(professional)/pro/dashboard/page.tsx`
- `app/(professional)/pro/profil/page.tsx`
- `app/(professional)/pro/recommandations/page.tsx`
- `app/(professional)/pro/signal/page.tsx`
- `app/(professional)/pro/analytique/page.tsx`
- `app/(professional)/pro/abonnement/page.tsx`
- `components/forms/ProProfileForm.tsx`
- `components/forms/LoginForm.tsx`
- `components/forms/RegisterForm.tsx`
- `components/projects/AddStepDialog.tsx`
- `components/projects/AssignStepProDialog.tsx`
- `components/projects/AddToProjectDialog.tsx`

**Fix:** Global search-replace `bg-white` → `bg-surface` (or `bg-background` where appropriate). Same for `text-stone-*` → `text-on-surface*` tokens.

### 0.2 Replace all `text-stone-*` → semantic tokens

**Files affected (5+):**
- `components/projects/ProjectStepCard.tsx` — `text-stone-900`, `text-stone-500`, `text-stone-400`, `text-stone-300`
- `components/projects/ProjectStepsSection.tsx` — `text-stone-900`, `text-stone-500`, `text-stone-600`, `text-stone-200`
- `components/forms/SignalForm.tsx`
- `components/forms/RecommendationForm.tsx`

**Fix:** `text-stone-900` → `text-on-surface`, `text-stone-500` → `text-on-surface-variant`, `text-stone-400` → `text-on-surface-variant/60`, `text-stone-300` → `text-on-surface-variant/40`.

### 0.3 Remove debug `console.log` statements

**Files:**
- `components/forms/RegisterForm.tsx` — lines 94, 106, 112, 119, 128
- `lib/actions/project-steps.ts` — line 8
- `lib/actions/projects.ts` — line 9
- `lib/actions/daily-logs.ts` — `log()` function (keep but switch to proper logger)

### 0.4 Replace `alert()` with `sonner` toast

**Files:**
- `components/forms/RegisterForm.tsx` — lines 66, 75
- `components/forms/RealizationForm.tsx` — line 119
- `components/forms/ProProfileForm.tsx` — line 106
- `components/shared/ProfessionalCard.tsx` — lines 66, 75
- `components/pro/ProProjectsPage.tsx` — `confirm()` for delete

### 0.5 Replace emoji icons with Lucide icons in sidebars

**Files:**
- `components/layout/AdminSidebar.tsx` — 📊, 📋, 📜, 👤
- `components/layout/ProSidebar.tsx` — 🏗️, ✓, ⚠️, 💎, 📈
- `components/layout/DashboardSidebar.tsx` — same pattern

### 0.6 Replace inline status badges with `<StatusBadge>` component

**Locations:**
- `app/(client)/projets/page.tsx:125`
- `components/projects/DevelopmentAreaRow.tsx:160`
- `components/projects/ProjectStepCard.tsx:93`

### 0.7 Remove duplicate `cn()` utility

**Files:**
- `components/projects/ProjectWizard.tsx:8-12`
- `components/projects/ProjectStepCard.tsx:5-9`

**Fix:** Import from `@/lib/utils` instead.

### 0.8 Add dark mode toggle to Navbar

**File:** `components/layout/Navbar.tsx`
**Fix:** Add theme toggle component that sets/removes `.dark` class on `<html>` and persists in localStorage.

**Acceptance criteria:** All 12+ pages render correctly in dark mode. No `bg-white` or `text-stone-*` visible. Toast replaces all `alert()`. Sidebar icons are Lucide.

---

## Phase 1 — Wire the Dashboard (Day 2–3)

*Replace every hardcoded demo value with real Supabase queries.*

### 1.1 Wire `/pro/dashboard` — Real Data

**File:** `app/(professional)/pro/dashboard/page.tsx`

**Tasks:**
- [ ] Fetch professional profile from Supabase (`professionals` table)
- [ ] Count recommendations (`recommendations WHERE professional_id`)
- [ ] Count signals (`signals WHERE professional_id`)
- [ ] Calculate avg rating from `reviews` table
- [ ] Count monthly views (`profile_views WHERE created_at > 30 days`)
- [ ] Fetch subscription status (`subscriptions WHERE professional_id`)
- [ ] Fetch pending verification queue items
- [ ] Add loading skeleton
- [ ] Replace `bg-white` → `bg-surface`

**New server action:** `lib/actions/dashboard-stats.ts`

```typescript
export async function getProDashboardStats(professionalId: string)
// Returns: { recommendations, signals, avgRating, monthlyViews, subscription, pendingActions }
```

### 1.2 Wire journal stats in `/pro/projets/[id]`

**File:** `components/pro/ProProjectDetail.tsx`

**Tasks:**
- [ ] Add server action `getProjectJournalStats(projectId)` that:
  - Counts logs (`project_logs WHERE pro_project_id`)
  - Sums `money_spent` across all logs
  - Counts media (`project_log_media WHERE log_id IN (...)`)
  - Counts unique `log_date` values (days worked)
- [ ] Replace placeholder "—" values with real numbers
- [ ] Add "Nouveau rapport" quick action button

### 1.3 Wire ProSidebar with real user data

**File:** `components/layout/ProSidebar.tsx`

**Tasks:**
- [ ] Already fetches `business_name` and email — verify it works
- [ ] Add status badge next to business name
- [ ] Remove any remaining hardcoded fallbacks

**Acceptance criteria:** Dashboard shows real numbers. Project detail shows journal stats. Sidebar shows real user info.

---

## Phase 2 — Payment & Subscription Flow (Day 4–7)

*Revenue blocker. Must work before launch.*

### 2.1 Install payment dependencies

```bash
npm install @stripe/stripe-js stripe
# Wave/Orange Money: need SDKs or API integrations
```

### 2.2 Database: Add subscription enforcement fields

**Migration:** Add to `professionals` table:
```sql
ALTER TABLE professionals
  ADD COLUMN subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro_africa', 'pro_europe')),
  ADD COLUMN subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('inactive', 'active', 'past_due', 'cancelled')),
  ADD COLUMN subscription_period_end TIMESTAMPTZ,
  ADD COLUMN payment_method TEXT,
  ADD COLUMN brand_primary TEXT,
  ADD COLUMN brand_secondary TEXT,
  ADD COLUMN brand_accent TEXT,
  ADD COLUMN logo_storage_path TEXT;
```

### 2.3 Stripe integration (EUR)

**New files:**
- `lib/actions/stripe.ts` — Create checkout session, handle webhook
- `app/api/stripe/webhook/route.ts` — Stripe webhook handler
- `components/pro/StripeCheckout.tsx` — Client component for checkout

**Server actions:**
```typescript
export async function createStripeCheckoutSession(professionalId: string)
export async function handleStripeWebhook(signature: string, payload: string)
export async function getSubscriptionStatus(professionalId: string)
```

**Flow:**
1. Professional clicks "S'abonner maintenant" on `/pro/abonnement`
2. Server action creates Stripe Checkout Session
3. Redirect to Stripe hosted checkout
4. Webhook receives `checkout.session.completed`
5. Updates `subscriptions` table + `professionals.subscription_tier`
6. Revalidates profile page → SSR mode activates

### 2.4 Wave/Orange Money integration (XOF)

**Approach:** Use mobile money API or payment aggregator (e.g., CinetPay, Fedapay).

**New files:**
- `lib/actions/mobile-money.ts` — Payment initiation, callback handling
- `app/api/mobile-money/callback/route.ts` — Payment callback handler

### 2.5 Wire `/pro/abonnement` — Functional buttons

**File:** `app/(professional)/pro/abonnement/page.tsx`

**Tasks:**
- [ ] "S'abonner maintenant" → triggers checkout (Stripe or Wave based on region)
- [ ] "Gérer mon abonnement" → Stripe Customer Portal or cancellation flow
- [ ] "Gérer mon moyen de paiement" → update payment method
- [ ] Show real billing history from `subscriptions` + payment records
- [ ] Remove duplicate sticky header
- [ ] Replace `bg-white` → `bg-surface`

### 2.6 Subscription tier enforcement

**New utility:** `lib/utils/subscription-gate.ts`

```typescript
export function checkTierLimit(professional: Professional, limit: 'projects' | 'photos' | 'videos')
// Returns: { allowed: boolean, current: number, limit: number }
```

**Apply enforcement to:**
- [ ] `ProProjectForm` — Block creation if project count >= 3 (free tier)
- [ ] `RealizationForm` — Block upload if photo count >= 15 (free tier)
- [ ] Profile rendering — SSG for free, SSR for paid
- [ ] `is_public` toggle — Disable for free tier

**Acceptance criteria:** Professional can subscribe via Stripe. Subscription status reflects in DB. Free tier limits enforced. Paid profiles get SSR + indexing.

---

## Phase 3 — SEO & Visibility (Day 8–9)

*Paid professionals need to be findable.*

### 3.1 XML Sitemap

**New files:**
- `app/sitemap.ts` — Next.js sitemap generation
- `app/robots.ts` — Next.js robots.txt generation

**Logic:**
```typescript
// sitemap.ts
export default async function sitemap() {
  // Only paid professionals
  const pros = await getActivePaidProfessionals()
  return pros.map(pro => ({
    url: `https://kelen.africa/pro/${pro.slug}`,
    lastModified: pro.updated_at,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))
}
```

### 3.2 Dynamic metadata for profile pages

**File:** `app/pro/[slug]/page.tsx`

**Tasks:**
- [ ] `generateMetadata()` with subscription check
- [ ] Paid profiles: full Open Graph tags, Twitter Card, canonical URL
- [ ] Free profiles: basic meta only, noindex
- [ ] Add `<meta name="robots" content="noindex">` for free profiles

### 3.3 Google Analytics (GA4)

**New files:**
- `app/layout.tsx` — Add GA4 script (conditional on paid profile or dashboard)
- `lib/utils/analytics.ts` — Track profile views, interactions

**Tasks:**
- [ ] Add GA4 Measurement ID to env
- [ ] Script loads only for paid profiles + pro dashboard
- [ ] Track: profile_view, contact_click, whatsapp_click, email_click

### 3.4 SSG vs SSR rendering

**File:** `app/pro/[slug]/page.tsx`

**Tasks:**
- [ ] Free profiles: export as static pages (`generateStaticParams` for known slugs)
- [ ] Paid profiles: dynamic SSR with real-time metadata
- [ ] Revalidate paid profiles on profile update (via `revalidatePath`)

**Acceptance criteria:** Paid professionals appear in sitemap. Profile pages have proper OG tags. GA4 tracks views. Free profiles are noindex.

---

## Phase 4 — AI Copywriting & Auto Branding (Day 10–11)

*Premium features that differentiate Kelen.*

### 4.1 Install Anthropic SDK

```bash
npm install @anthropic-ai/sdk
```

### 4.2 AI Copywriting Server Action

**New file:** `lib/actions/ai-copywriting.ts`

```typescript
export async function generateBioCopy(questionnaire: {
  values: string[]
  qualities: string[]
  relationshipStyle: string
  communicationFrequency: string
  proudestProject?: string
  limitsRefused?: string[]
}): Promise<{ bio_accroche: string; bio_presentation: string }>
```

**Prompt design:**
- System prompt: "You are a professional copywriter for a African construction/renovation professional..."
- Output: 1-sentence hero tagline + 3-5 sentence about section
- Language: French (matching professional's locale)

### 4.3 Wire AI Copywriting to Profile Form

**File:** `components/forms/ProProfileForm.tsx`

**Tasks:**
- [ ] Add "Générer avec IA" button in bio section
- [ ] Button opens modal with questionnaire
- [ ] On submit → call `generateBioCopy` → fill bio fields
- [ ] Professional can edit generated copy before saving
- [ ] Store `bio_accroche` and `bio_presentation` in `professionals` table

### 4.4 Automatic Branding

**New file:** `lib/actions/branding.ts`

**Tasks:**
- [ ] Install `color-thief` (npm)
- [ ] Logo upload → extract dominant colors client-side
- [ ] Save `brand_primary`, `brand_secondary`, `brand_accent` to database
- [ ] Apply colors to profile page: buttons, overlays, badges
- [ ] WCAG contrast verification for all color combinations
- [ ] Fallback to Kelen defaults if colors fail

**Database:** Already added fields in Phase 2.2 migration.

**Acceptance criteria:** Professional can generate bio copy via AI questionnaire. Logo upload triggers color extraction. Profile page uses brand colors.

---

## Phase 5 — Portfolio Page Restructure (Day 12–13)

*Align with stitch design — structural changes to public profile.*

### 5.1 Hero: Full-bleed + Overlap Card

**File:** `app/(marketing)/professionnels/[slug]/page.tsx`

**Tasks:**
- [ ] Change hero to `h-[80vh]` full-bleed image
- [ ] Overlay: `bg-on-surface/30`
- [ ] Separate overlap card section with `-mt-[16vh]`
- [ ] Card: `surface-container-lowest`, `rounded-2xl`, `shadow-lifting`
- [ ] 2-column layout inside card: title/tagline left, stats grid right
- [ ] Stats grid: Experience, Location, Specialty, Status
- [ ] Use stitch typography scale: `text-4xl md:text-6xl font-headline font-extrabold tracking-tighter`

### 5.2 Portfolio Section: Featured + 50/50 Secondary

**Tasks:**
- [ ] Change from 8/4 asymmetric split to 100% featured + 50/50 secondary grid
- [ ] Featured: `h-[600px]` full-width
- [ ] Secondary: 2 cards side-by-side at `h-80` each
- [ ] Hover effect: `scale-105` + overlay
- [ ] Replace `bg-white` cards with `bg-surface-container-low`

### 5.3 About Section: Token Alignment

**Tasks:**
- [ ] Replace `bg-stone-50` → `bg-surface-container-low`
- [ ] Replace value cards with inline bordered items (stitch style)
- [ ] Add divider line between title and description (`h-px bg-outline-variant/20`)
- [ ] Add italic description paragraph ("Une sélection de projets...")
- [ ] Grayscale-to-color transition on image (`grayscale hover:grayscale-0`)

### 5.4 Contact Section: Mobile Avatar

**Tasks:**
- [ ] Add profile avatar with verified badge for mobile layout
- [ ] Replace `bg-white` → `bg-surface-container-lowest`
- [ ] Remove green gradient top bar
- [ ] Switch button hover from chevron icon to opacity-reveal chevron
- [ ] Add `selection:bg-primary-container selection:text-on-primary-container`

### 5.5 Footer

**Tasks:**
- [ ] Add simple desktop footer: brand + links + copyright
- [ ] Skip mobile bottom nav (per user note — irrelevant)

**Acceptance criteria:** Portfolio page matches stitch layout. Hero is full-bleed with overlap card. Portfolio is 100% + 50/50. All color tokens aligned.

---

## Phase 6 — Offline Sync Fix (Day 14)

*Critical bug: drafts are deleted without syncing.*

### 6.1 Fix `handleSync` in Journal Page

**File:** `app/(client)/projets/[id]/journal/page.tsx`

**Current bug:**
```typescript
// TODO: Implement actual draft sync - requires server action to sync draft
// For now, just mark as synced and delete
await markDraftPendingSync(draftId, false);
await deleteDraft(draftId);
```

**Fix:**
- [ ] Create server action `syncDraftToServer(draftId)`
- [ ] Action reads draft from IndexedDB (passed from client)
- [ ] Calls `createLog()` with draft data
- [ ] On success → delete draft from IndexedDB
- [ ] On failure → keep draft, show error toast

### 6.2 Add Service Worker (PWA)

**New files:**
- `public/manifest.json` — PWA manifest
- `app/sw.ts` — Service worker registration
- `public/icons/` — App icons

**Tasks:**
- [ ] Add `next-pwa` or custom service worker
- [ ] Cache journal form page for offline access
- [ ] Background sync API for draft submission
- [ ] `manifest.json` with name, icons, theme colors

**Acceptance criteria:** Offline drafts sync correctly when connectivity returns. PWA installable on mobile.

---

## Phase 7 — Status Calculation Engine (Day 15)

*Automate reputation status — tamper-proof.*

### 7.1 Database Trigger

**Migration:** `supabase/migrations/20260415000001_status_calculation_trigger.sql`

```sql
CREATE OR REPLACE FUNCTION calculate_professional_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Count verified recommendations
  -- Count verified signals
  -- Apply business rules
  -- Update professionals.status
  -- Handle Gold (3+ recs, 0 signals), Silver (1-2 recs), White (0), Red (1+ signals)
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_recalc_status
  AFTER INSERT OR UPDATE ON recommendations
  FOR EACH ROW EXECUTE FUNCTION calculate_professional_status();

-- Same trigger on signals table
```

### 7.2 Server Action for Manual Recalculation

**File:** `lib/actions/status.ts`

```typescript
export async function recalculateStatus(professionalId: string)
// Returns: { oldStatus, newStatus, recommendationCount, signalCount }
```

### 7.3 Wire Status to Dashboard & Profile

**Tasks:**
- [ ] Dashboard reads status from `professionals.status` (no longer computed client-side)
- [ ] Profile page StatusBadge reads from same field
- [ ] Admin verification queue triggers status recalculation on approve/reject

**Acceptance criteria:** Status updates automatically when recommendation/signal is verified. Tamper-proof (database-level). Dashboard shows real status.

---

## Phase 8 — Notification System (Day 16–17)

*Complete the communication loop.*

### 8.1 Expand Email Notifications

**File:** `lib/utils/email-notifications.ts`

**New templates:**
- [ ] "Vous avez été ajouté au projet {title}" — project assignment
- [ ] "Nouvelle recommandation reçue" — recommendation received
- [ ] "Un signalement a été enregistré" — signal received
- [ ] "Rapport de chantier — projet {title}" — log shared
- [ ] "Un rapport a été contesté — action requise" — log contested (already partially done)

### 8.2 In-App Notification Bell

**New files:**
- `components/layout/NotificationBell.tsx` — Bell icon with count badge
- `components/layout/NotificationDropdown.tsx` — Dropdown with recent notifications
- `app/(professional)/pro/notifications/page.tsx` — Full notification inbox (optional)

**Database:**
```sql
CREATE TABLE notifications (
  id UUID PK,
  user_id UUID FK → users(id),
  type TEXT,
  title TEXT,
  body TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Server actions:**
- `getNotifications(userId, limit)`
- `markNotificationRead(notificationId)`
- `markAllNotificationsRead(userId)`

### 8.3 Wire Notifications to Events

**Triggers:**
- New log created → notify project client
- Log approved → notify log author
- Log contested → notify log author
- New recommendation → notify professional
- New signal → notify professional
- Project assignment → notify professional

**Acceptance criteria:** Professional receives emails for key events. Notification bell shows unread count. Clicking notification navigates to relevant page.

---

## Phase 9 — PDF/Excel Export (Day 18–19)

*Professional needs to share project data externally.*

### 9.1 Install Export Libraries

```bash
npm install jspdf jspdf-autotable xlsx
```

### 9.2 PDF Export Server Action

**New file:** `lib/actions/export.ts`

```typescript
export async function generateProjectPdf(projectId: string): Promise<Blob>
// Generates PDF with:
// - Project overview (title, description, budget, location)
// - Journal timeline (all logs with dates, descriptions, money spent)
// - Photo thumbnails
// - Spending summary
// - Professional assignments per step
```

### 9.3 Excel Export Server Action

```typescript
export async function generateProjectExcel(projectId: string): Promise<Blob>
// Generates XLSX with sheets:
// - Project overview
// - Journal logs (date, title, money, issues, next_steps)
// - Spending by step
// - Professional assignments
```

### 9.4 Wire Export Dropdown

**File:** `components/projects/ProjectStepsSection.tsx`

**Tasks:**
- [ ] Wire "Rapport PDF (.pdf)" button onClick → call `generateProjectPdf` → download
- [ ] Wire "Export Excel (.xlsx)" button onClick → call `generateProjectExcel` → download
- [ ] Add loading state during generation

**Acceptance criteria:** Professional can download PDF and Excel reports from project page. Files open correctly. Data is complete and formatted.

---

## Phase 10 — Polish & Edge Cases (Day 20–21)

*Final pass for quality, accessibility, and performance.*

### 10.1 Accessibility Fixes

**Tasks:**
- [ ] Add `aria-label` to all icon buttons (20+ elements across 8 files)
- [ ] Add `htmlFor`/`id` associations to all form labels (SignalForm, RecommendationForm, ProfessionalDirectory, FilterPanel)
- [ ] Make star rating accessible (`role="radiogroup"`, `aria-label` on each star)
- [ ] Make `ProfessionalCard` keyboard-navigable (change `<span>` to `<button>`)
- [ ] Fix modal focus trapping (use `DialogContent` from shared dialog)
- [ ] Fix color contrast failures (`text-[9px]` with `/40` opacity)

### 10.2 Performance Optimizations

**Tasks:**
- [ ] Batch signed URL generation (single server action returns all URLs at once)
- [ ] Add pagination to `getProProjects()` (cursor-based)
- [ ] Add React Query or SWR for analytics page caching
- [ ] Convert client-side Supabase journal queries to server actions
- [ ] Add `loading="lazy"` to all non-critical images
- [ ] Replace `<img>` with Next.js `<Image>` in ProfileHero, ProfessionalCard, DevelopmentAreaRow

### 10.3 UX Polish

**Tasks:**
- [ ] Add date range selector to Analytics (7d, 30d, 90d, custom)
- [ ] Add loading state to Analytics (stats show "0" while loading)
- [ ] Fix "Copier mon lien Pro" button on Recommendations page
- [ ] Add filter by status to Recommendations page
- [ ] Fix view toggle on Réalisations page (list mode non-functional)
- [ ] Add photo upload to project creation form
- [ ] Add journal stats summary to project journal timeline
- [ ] Add search/filter to Projects page (by client name, location)

### 10.4 Remove Hardcoded Data

**Final sweep:**
- [ ] `AdminSidebar.tsx` — `admin@kelen.africa`
- [ ] `ProSidebar.tsx` — `Kouadio Construction`, `contact@kouadio-construction.ci`
- [ ] `DashboardSidebar.tsx` — `demo@kelen.africa`
- [ ] `ProfileHero.tsx` — hardcoded placeholder image URL
- [ ] `DevelopmentAreaRow.tsx` — hardcoded Unsplash fallback URL
- [ ] Documents page — hardcoded folders, hardcoded tags, hardcoded file weight
- [ ] Abonnement page — hardcoded billing history

**Acceptance criteria:** Zero hardcoded data in production. All forms accessible. Analytics has loading states. Pagination works. Performance improved.

---

## Implementation Order Summary

```
Phase 0:  Quick Wins (color tokens, alerts, emojis, badges, dark mode toggle)
Phase 1:  Wire Dashboard (real data queries, journal stats)
Phase 2:  Payment & Subscription (Stripe, Wave, tier enforcement)  ← REVENUE BLOCKER
Phase 3:  SEO & Visibility (sitemap, OG tags, GA4, SSG/SSR)
Phase 4:  AI Copywriting + Auto Branding (Anthropic, color-thief)
Phase 5:  Portfolio Restructure (stitch alignment, hero, portfolio layout)
Phase 6:  Offline Sync Fix (draft → server sync, PWA)
Phase 7:  Status Calculation Engine (DB trigger, tamper-proof)
Phase 8:  Notification System (email templates, in-app bell, event wiring)
Phase 9:  PDF/Excel Export (jspdf, xlsx, wire dropdown)
Phase 10: Polish (a11y, performance, UX, remove all hardcoded data)
```

---

## File Creation/Modification Summary

### New Files to Create (~30)

| File | Purpose | Phase |
|---|---|---|
| `lib/actions/dashboard-stats.ts` | Dashboard data aggregation | 1 |
| `lib/actions/stripe.ts` | Stripe checkout + webhook | 2 |
| `app/api/stripe/webhook/route.ts` | Stripe webhook endpoint | 2 |
| `components/pro/StripeCheckout.tsx` | Stripe checkout button | 2 |
| `lib/actions/mobile-money.ts` | Wave/Orange Money payment | 2 |
| `app/api/mobile-money/callback/route.ts` | Mobile money callback | 2 |
| `lib/utils/subscription-gate.ts` | Tier enforcement utility | 2 |
| `app/sitemap.ts` | XML sitemap generation | 3 |
| `app/robots.ts` | Robots.txt generation | 3 |
| `lib/utils/analytics.ts` | GA4 tracking utility | 3 |
| `lib/actions/ai-copywriting.ts` | Anthropic Claude bio generation | 4 |
| `lib/actions/branding.ts` | Logo upload + color extraction | 4 |
| `lib/actions/status.ts` | Manual status recalculation | 7 |
| `supabase/migrations/20260415000001_status_calculation_trigger.sql` | Status trigger | 7 |
| `lib/utils/email-notifications.ts` (expand) | New email templates | 8 |
| `components/layout/NotificationBell.tsx` | Bell icon with badge | 8 |
| `components/layout/NotificationDropdown.tsx` | Notification dropdown | 8 |
| `lib/actions/notifications.ts` | Notification CRUD | 8 |
| `lib/actions/export.ts` | PDF/Excel generation | 9 |
| `public/manifest.json` | PWA manifest | 6 |
| `app/sw.ts` | Service worker | 6 |
| `public/icons/` | PWA app icons | 6 |

### Existing Files to Modify (~40)

| File | Change | Phase |
|---|---|---|
| `app/(professional)/pro/dashboard/page.tsx` | Wire real data | 1 |
| `components/pro/ProProjectDetail.tsx` | Wire journal stats | 1 |
| `app/(professional)/pro/abonnement/page.tsx` | Wire payment buttons | 2 |
| `app/pro/[slug]/page.tsx` | Dynamic metadata, SSG/SSR | 3 |
| `app/layout.tsx` | Add GA4 script | 3 |
| `components/forms/ProProfileForm.tsx` | Add AI copywriting, logo upload | 4 |
| `app/(marketing)/professionnels/[slug]/page.tsx` | Restructure hero + portfolio | 5 |
| `app/(client)/projets/[id]/journal/page.tsx` | Fix offline sync | 6 |
| `components/projects/ProjectStepsSection.tsx` | Wire export dropdown | 9 |
| 12+ dashboard pages | Replace `bg-white` → `bg-surface` | 0 |
| 5+ form/sidebar pages | Replace `text-stone-*` → semantic tokens | 0 |
| 3 sidebar components | Replace emoji → Lucide icons | 0 |
| 4 alert()-using components | Replace with sonner toast | 0 |
| 3 inline-badge locations | Use StatusBadge component | 0 |
| 2 duplicate cn() files | Import from @/lib/utils | 0 |
| `components/layout/Navbar.tsx` | Add dark mode toggle | 0 |

### Database Migrations to Create (~3)

| Migration | Purpose | Phase |
|---|---|---|
| `20260410000001_subscription_fields.sql` | Subscription enforcement fields | 2 |
| `20260415000001_status_calculation_trigger.sql` | Auto status recalculation | 7 |
| `20260417000001_notifications_table.sql` | In-app notification system | 8 |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Stripe webhook fails in production | Low | High | Test with Stripe CLI locally, log all webhook events |
| AI copywriting generates inappropriate content | Medium | Medium | Add content filter prompt, allow professional to edit before saving |
| color-thief extracts poor colors | Medium | Low | WCAG contrast check, fallback to defaults |
| Status trigger creates infinite loop | Low | High | Use `UPDATE ... WHERE status <> new_status` to prevent recursion |
| Offline sync conflicts | Medium | Medium | Last-write-wins strategy, show conflict resolution UI |
| PDF export memory exhaustion on large projects | Medium | Low | Limit to 100 logs per PDF, paginate if needed |

---

## Testing Strategy

### Per-Phase Testing

| Phase | Test |
|---|---|
| 0 | Visual regression — compare dark mode before/after |
| 1 | Dashboard loads with real data for test professional account |
| 2 | End-to-end Stripe test payment → subscription active in DB |
| 3 | Paid profile appears in sitemap.xml, free profile has noindex |
| 4 | AI generates bio copy from questionnaire, colors extracted from logo |
| 5 | Portfolio page matches stitch layout on desktop + mobile |
| 6 | Create draft offline → go online → draft syncs to server |
| 7 | Add 3rd recommendation → status auto-changes to Gold |
| 8 | Trigger notification → email received + bell badge increments |
| 9 | Download PDF → opens with correct data, formatting intact |
| 10 | Lighthouse audit: a11y score > 90, performance > 80 |

### Manual Test Scenarios

1. **New professional signup** → register → create profile → create first project → add log → share log
2. **Client journey** → browse directory → view professional → add to project → approve log → contest log
3. **Payment flow** → free professional clicks subscribe → Stripe checkout → subscription active → profile indexed
4. **Offline scenario** → professional on construction site → draft log without wifi → reconnect → log syncs
5. **Admin moderation** → review pending recommendation → verify → status recalculates → professional notified

---

## Dependencies Graph

```
Phase 0 (Cleanup)
  └── No dependencies — can start immediately

Phase 1 (Dashboard Wire)
  └── Depends on: Phase 0 (color token fixes)

Phase 2 (Payment)
  └── Depends on: Phase 0
  └── Required for: Phase 3 (SEO — only paid profiles indexed)

Phase 3 (SEO)
  └── Depends on: Phase 2 (subscription status)

Phase 4 (AI + Branding)
  └── Depends on: Phase 0
  └── Independent of: Phases 2, 3

Phase 5 (Portfolio Restructure)
  └── Depends on: Phase 0 (color tokens)
  └── Independent of: Phases 2, 3, 4

Phase 6 (Offline Sync)
  └── Depends on: Phase 1 (dashboard wiring — journal must work)
  └── Independent of: Phases 2–5

Phase 7 (Status Engine)
  └── Depends on: Database migration
  └── Required for: Phase 2 (subscription — status affects pricing)

Phase 8 (Notifications)
  └── Depends on: Phase 2 (email infrastructure)
  └── Independent of: Phases 3–7

Phase 9 (Export)
  └── Depends on: Phase 1 (journal stats — data must exist)
  └── Independent of: Phases 2–8

Phase 10 (Polish)
  └── Depends on: ALL previous phases
  └── Final gate before launch
```

---

## Estimated Effort

| Phase | Complexity | Risk | Effort |
|---|---|---|---|
| 0 — Quick Wins | Low | Low | 4–6 hours |
| 1 — Wire Dashboard | Medium | Low | 6–8 hours |
| 2 — Payment | High | High | 16–24 hours |
| 3 — SEO | Medium | Low | 6–8 hours |
| 4 — AI + Branding | Medium | Medium | 8–12 hours |
| 5 — Portfolio Restructure | Medium | Low | 8–10 hours |
| 6 — Offline Sync | Medium | Medium | 4–6 hours |
| 7 — Status Engine | Medium | High | 4–6 hours |
| 8 — Notifications | Medium | Low | 8–10 hours |
| 9 — Export | Low | Low | 4–6 hours |
| 10 — Polish | Low | Low | 8–12 hours |
| **Total** | | | **76–108 hours** |

---

## Related Documents

- `professional-journey-reference.md` — Complete feature reference for professional journey
- `feature-implementation-audit.md` — Code-level feature implementation status (60% done)
- `professional-dashboard-audit.md` — Route-by-route dashboard audit
- `professional-portfolio-audit.md` — Stitch vs current portfolio comparison (5.6/10)
- `FRONTEND_AUDIT.md` — Responsiveness, accessibility, design audit
- `BLUEPRINT.md` — Overall project architecture
- `backend-plan.md` — Backend development plan
- `kelen_positioning.md` — Master positioning document
- `kelen_value_proposition.md` — Pricing and feature matrix
- `daily-log-spec.md` — Daily log full specification
