# Implementation Plan — Kelen Platform ✅ COMPLETE

> Created: 2026-04-08
> Completed: 2026-04-08
> Status: **All 11 phases implemented and pushed**
> Branch: `feat/professional-dashboard`
> Total commits: 12

---

## Implementation Summary

```
Phase 0:  ✅ Quick Wins          — 2 commits  (dark mode, ThemeToggle, toasts, cleanup)
Phase 1:  ✅ Wire Dashboard      — 1 commit   (real data queries, journal stats)
Phase 2:  ✅ Payment             — 1 commit   (Stripe checkout, webhook, tier enforcement)
Phase 3:  ✅ SEO & Visibility    — 1 commit   (sitemap, robots, OG tags, GA4)
Phase 4:  ✅ AI + Branding       — 1 commit   (Claude Sonnet 4, logo/brand infrastructure)
Phase 5:  ⏭️ Portfolio           — SKIPPED    (user confirmed /professionnels/[slug] is good)
Phase 6:  ✅ Offline Sync Fix    — 1 commit   (draft→server sync, PWA manifest + SW)
Phase 7:  ✅ Status Engine       — 1 commit   (fixed thresholds, admin override)
Phase 8:  ✅ Notifications       — 1 commit   (in-app bell, 5 email templates, DB table)
Phase 9:  ✅ PDF/Excel Export    — 1 commit   (jspdf + xlsx, multi-page PDF, 4-sheet Excel)
Phase 10: ✅ Polish              — 1 commit   (a11y labels, loading states, dead buttons)
```

---

## Phase 0 — Quick Wins ✅ COMPLETE

**Commit:** `f1cdf21`, `8988e04`

### What was done

| Task | Files Modified | Status |
|---|---|---|
| `bg-white` → `bg-surface-container-low` | 8 files | ✅ |
| `text-stone-*` → `text-on-surface*` | 6+ files | ✅ |
| Remove `console.log` debug | RegisterForm.tsx | ✅ |
| `alert()` → `sonner` toast | 3 files | ✅ |
| Emoji → Lucide icons in sidebars | Already done | ✅ |
| Inline badges → StatusBadge | N/A (different status types) | ✅ |
| Duplicate `cn()` utility | Already done | ✅ |
| Dark mode toggle in Navbar | ThemeToggle.tsx created | ✅ |

**New files:** `components/layout/ThemeToggle.tsx`

---

## Phase 1 — Wire Dashboard ✅ COMPLETE

**Commit:** `6f3de8b`

### What was done

| Task | Files Created | Status |
|---|---|---|
| Dashboard stats server action | `lib/actions/dashboard-stats.ts` | ✅ |
| Journal stats server action | `lib/actions/journal-stats.ts` | ✅ |
| Wire `/pro/dashboard` with real data | `app/(professional)/pro/dashboard/page.tsx` | ✅ |
| Wire journal stats in project detail | `components/pro/ProProjectDetail.tsx` | ✅ |

**Dashboard now shows:**
- Real recommendation count from `recommendations` table
- Real signal count from `signals` table
- Real avg rating from `reviews` table
- Real monthly views from `profile_views` table
- Real subscription status from `subscriptions` table
- Empty state when professional profile not found
- Dynamic pending actions from verification queue

**Project detail now shows:**
- Report count, total spending, photo count, days worked
- Empty state with CTA when no reports exist

---

## Phase 2 — Payment & Subscription ✅ COMPLETE

**Commit:** `ca5a213`

### What was done

| Task | Files Created | Status |
|---|---|---|
| Stripe checkout session | `lib/actions/stripe.ts` | ✅ |
| Stripe webhook handler | `app/api/stripe/webhook/route.ts` | ✅ |
| Subscription tier enforcement | `lib/utils/subscription-gate.ts` | ✅ |
| Wire abonnement buttons | `app/(professional)/pro/abonnement/page.tsx` | ✅ |

**Payment flow:**
- "S'abonner maintenant" → Stripe Checkout → webhook → subscription active
- "Gérer mon abonnement" → Stripe Customer Portal
- "Gérer mon moyen de paiement" → Stripe Customer Portal
- Webhook handles: checkout.completed, subscription.updated, subscription.deleted, payment.failed

**Tier enforcement:**
- Free: 3 projects max, 15 photos max, no video/SSR/SEO
- Paid: unlimited projects, unlimited photos, video support, SSR, SEO

---

## Phase 3 — SEO & Visibility ✅ COMPLETE

**Commit:** `31f128e`

### What was done

| Task | Files Created | Status |
|---|---|---|
| XML Sitemap | `app/sitemap.ts` | ✅ |
| Robots.txt | `app/robots.ts` | ✅ |
| Dynamic metadata + OG tags | Modified `professionnels/[slug]/page.tsx` | ✅ |
| GA4 integration | `components/analytics/GoogleAnalytics.tsx` | ✅ |
| Analytics tracking utility | `lib/utils/analytics.ts` | ✅ |
| .env.example template | `.env.example` | ✅ |

**SEO features:**
- Paid professionals indexed (gold/silver status), free profiles noindex
- Full Open Graph tags, Twitter Card, canonical URL
- GA4 with profile view, contact click, search appearance tracking

---

## Phase 4 — AI Copywriting + Auto Branding ✅ COMPLETE

**Commit:** `3b28495`

### What was done

| Task | Files Created | Status |
|---|---|---|
| Install dependencies | `@anthropic-ai/sdk`, `colorthief` | ✅ |
| AI copywriting server action | `lib/actions/ai-copywriting.ts` | ✅ |
| AI copywriting dialog (4-step) | `components/forms/AICopywritingDialog.tsx` | ✅ |
| Branding server actions | `lib/actions/branding.ts` | ✅ |
| Wire AI to ProProfileForm | Modified `ProProfileForm.tsx` | ✅ |
| DB migration | `20260408000001_ai_copywriting_branding.sql` | ✅ |

**AI questionnaire covers:**
- Personal values (max 3 of 8 options)
- Professional qualities (max 3 of 8 options)
- Client relationship style (single select, 4 options)
- Communication frequency (single select, 4 options)
- Proudest project (optional free text)
- Limits refused (optional)

**Branding infrastructure:**
- Logo upload to Supabase Storage
- Brand color fields: primary, secondary, accent
- Client-side color extraction (colorthief) ready

---

## Phase 5 — Portfolio Restructure ⏭️ SKIPPED

User confirmed `/professionnels/[slug]` is good as-is.

---

## Phase 6 — Offline Sync Fix ✅ COMPLETE

**Commit:** `8d85c71`

### What was done

| Task | Files Created | Status |
|---|---|---|
| Fix draft sync in journal page | Modified `journal/page.tsx` | ✅ |
| PWA manifest | `public/manifest.json` | ✅ |
| Service worker | `public/sw.js` | ✅ |
| SW registration utility | `lib/utils/register-sw.ts` | ✅ |
| SW registration component | `components/pwa/ServiceWorkerRegistration.tsx` | ✅ |

**Fix:** Drafts now actually sync to server via `createLog()` server action instead of being silently deleted.

**PWA:** Installable on mobile, caches app shell, network-first fetch strategy.

---

## Phase 7 — Status Calculation Engine ✅ COMPLETE

**Commit:** `f077369`

### What was done

| Task | Files Created | Status |
|---|---|---|
| Fix status thresholds migration | `20260408000002_fix_status_calculation.sql` | ✅ |
| Status server actions | `lib/actions/status.ts` | ✅ |

**Spec-compliant thresholds:**
| Status | Criteria |
|---|---|
| Gold | 3+ verified + linked recommendations, zero signals |
| Silver | 1-2 verified + linked recommendations, zero signals |
| White | No verified history (default) |
| Red | 1+ verified signals — **permanent, irreversible** |
| Black | NOT automatic — admin ban only |

**Triggers:** Fire on ALL INSERT/UPDATE on recommendations, signals, reviews.

**Server actions:** `recalculateStatus()`, `forceSetStatus()` (admin-only)

---

## Phase 8 — Notification System ✅ COMPLETE

**Commit:** `172f2d6`

### What was done

| Task | Files Created | Status |
|---|---|---|
| Notifications DB table | `20260408000003_notifications.sql` | ✅ |
| Notification server actions | `lib/actions/notifications.ts` | ✅ |
| Notification bell component | `components/layout/NotificationBell.tsx` | ✅ |
| Notification dropdown component | `components/layout/NotificationDropdown.tsx` | ✅ |
| Expand email templates (2→5) | `lib/utils/email-notifications.ts` | ✅ |

**Email templates:**
- `sendNewLogEmail` — New log created
- `sendLogActionEmail` — Log approved/contested/resolved
- `sendSharedLogEmail` — Log shared via email
- `sendProjectAssignmentEmail` — Professional assigned to project
- `sendReputationNotificationEmail` — New recommendation or new signal

**In-app:** Bell icon with unread badge, dropdown with 10 recent notifications, mark-all-read, time-ago display.

---

## Phase 9 — PDF/Excel Export ✅ COMPLETE

**Commit:** `8f5b021`

### What was done

| Task | Files Created | Status |
|---|---|---|
| Install libraries | `jspdf`, `jspdf-autotable`, `xlsx` | ✅ |
| Export data server action | `lib/actions/export-data.ts` | ✅ |
| PDF generator utility | `lib/utils/project-export.ts` | ✅ |
| Wire export dropdown | `components/projects/ProjectStepsSection.tsx` | ✅ |

**PDF:** A4 cover page, project overview, steps table, journal logs table, financial summary, page numbers.

**Excel:** 4 sheets — Résumé (overview), Étapes (steps), Journal (logs), Finances (spending).

---

## Phase 10 — Polish & Edge Cases ✅ COMPLETE

**Commit:** `c677a15`

### What was done

| Task | Files Modified | Status |
|---|---|---|
| Fix "Copier mon lien Pro" dead button | `recommandations/page.tsx` | ✅ |
| Add loading skeletons to Analytics | `analytique/page.tsx` | ✅ |
| Add aria-labels to buttons/inputs | FilterPanel, ProfessionalDirectory, RealizationCard, DevelopmentAreaRow | ✅ |
| Fix hardcoded fallback in ProSidebar | `ProSidebar.tsx` | ✅ |
| Dark mode in ProjectStepsSection | `ProjectStepsSection.tsx` | ✅ |

---

## Complete File Inventory

### New Files Created (24)

| File | Phase | Purpose |
|---|---|---|
| `lib/actions/dashboard-stats.ts` | 1 | Dashboard data aggregation |
| `lib/actions/journal-stats.ts` | 1 | Journal stats for project detail |
| `lib/actions/stripe.ts` | 2 | Stripe checkout, webhook, subscription management |
| `app/api/stripe/webhook/route.ts` | 2 | Stripe webhook endpoint |
| `lib/utils/subscription-gate.ts` | 2 | Tier enforcement (3 projects, 15 photos) |
| `app/sitemap.ts` | 3 | XML sitemap generation |
| `app/robots.ts` | 3 | Robots.txt generation |
| `components/analytics/GoogleAnalytics.tsx` | 3 | GA4 script loading |
| `lib/utils/analytics.ts` | 3 | Tracking utility |
| `lib/actions/ai-copywriting.ts` | 4 | Claude Sonnet 4 bio generation |
| `lib/actions/branding.ts` | 4 | Logo upload + brand color persistence |
| `components/forms/AICopywritingDialog.tsx` | 4 | 4-step AI questionnaire wizard |
| `lib/actions/status.ts` | 7 | Manual status recalculation + admin override |
| `lib/utils/email-notifications.ts` (expanded) | 8 | 5 email templates with refactored helpers |
| `components/layout/NotificationBell.tsx` | 8 | Bell icon with unread badge |
| `components/layout/NotificationDropdown.tsx` | 8 | Dropdown panel with notification list |
| `lib/actions/notifications.ts` | 8 | Notification CRUD server actions |
| `lib/actions/export-data.ts` | 9 | Fetch full project data for export |
| `lib/utils/project-export.ts` | 9 | PDF + Excel generation utilities |
| `public/manifest.json` | 6 | PWA manifest |
| `public/sw.js` | 6 | Service worker |
| `lib/utils/register-sw.ts` | 6 | SW registration utility |
| `components/pwa/ServiceWorkerRegistration.tsx` | 6 | Client component for SW registration |
| `components/layout/ThemeToggle.tsx` | 0 | Light/dark/system theme toggle |

### Existing Files Modified (25+)

| File | Phase | Change |
|---|---|---|
| `app/(professional)/pro/dashboard/page.tsx` | 1 | Replaced hardcoded demo with real queries |
| `app/(professional)/pro/profil/page.tsx` | 0 | bg-white → semantic tokens |
| `app/(professional)/pro/recommandations/page.tsx` | 0,10 | Dark mode, fix dead "Copier mon lien Pro" button |
| `app/(professional)/pro/signal/page.tsx` | 0 | Dark mode tokens |
| `app/(professional)/pro/analytique/page.tsx` | 0,10 | Dark mode, add loading skeletons |
| `app/(professional)/pro/abonnement/page.tsx` | 0,2 | Dark mode, wire Stripe buttons |
| `app/layout.tsx` | 0,3,6 | ThemeProvider, GoogleAnalytics, SW registration |
| `components/layout/Navbar.tsx` | 0,8 | ThemeToggle, NotificationDropdown |
| `components/layout/ProSidebar.tsx` | 8,10 | NotificationDropdown, fix hardcoded fallback |
| `components/forms/ProProfileForm.tsx` | 4 | Added AI copywriting button + dialog |
| `components/forms/RegisterForm.tsx` | 0 | Removed debug console.log |
| `components/forms/RealizationForm.tsx` | 0 | alert() → toast |
| `components/shared/ProfessionalCard.tsx` | 0 | alert() → toast |
| `components/pro/RealizationCard.tsx` | 0,10 | alert() → toast, aria-labels |
| `components/projects/AddStepDialog.tsx` | 0 | Dark mode tokens |
| `components/projects/ProjectStepsSection.tsx` | 0,9,10 | Wire export, dark mode |
| `components/pro/ProProjectDetail.tsx` | 1 | Converted to server component, journal stats |
| `components/landing/ProfessionalDirectory.tsx` | 10 | Add htmlFor/id labels |
| `components/shared/FilterPanel.tsx` | 10 | Add sr-only labels |
| `components/projects/DevelopmentAreaRow.tsx` | 10 | Add aria-labels |
| `app/(marketing)/professionnels/[slug]/page.tsx` | 3 | Full OG tags, noindex for free profiles |
| `app/(client)/projets/[id]/journal/page.tsx` | 6 | Fix offline draft sync |
| `supabase/migrations/20260408000001_...` | 4 | AI fields + brand colors |
| `supabase/migrations/20260408000002_...` | 7 | Fix status calculation thresholds |
| `supabase/migrations/20260408000003_...` | 8 | Notifications table |

### Database Migrations (3)

| Migration | Purpose |
|---|---|
| `20260408000001_ai_copywriting_branding.sql` | AI questionnaire fields, bio fields, brand colors, logo path |
| `20260408000002_fix_status_calculation.sql` | Fix status thresholds to match spec, expand triggers |
| `20260408000003_notifications.sql` | In-app notifications table with RLS |

---

## Commits Summary

| Commit | Phase | Description |
|---|---|---|
| `f1cdf21` | 0 | Dark mode tokens + debug cleanup |
| `8988e04` | 0 | Alerts → toast, ThemeToggle |
| `6f3de8b` | 1 | Wire dashboard + journal stats |
| `ca5a213` | 2 | Stripe integration + tier enforcement |
| `31f128e` | 3 | SEO + GA4 |
| `3b28495` | 4 | AI copywriting + branding |
| `8d85c71` | 6 | Offline sync fix + PWA |
| `f077369` | 7 | Status calculation engine fix |
| `172f2d6` | 8 | Notification system |
| `8f5b021` | 9 | PDF/Excel export |
| `c677a15` | 10 | Polish (a11y, loading, dead buttons) |

---

## Remaining TODOs (Deferred)

| Item | Reason |
|---|---|
| Portfolio page restructure (Phase 5) | User confirmed current version is good |
| Wave/Orange Money integration (Phase 2) | Stripe covers EUR; African mobile money deferred |
| Client-side color extraction UI (Phase 4) | Infrastructure ready; UI component deferred |
| Background Sync API for offline photos (Phase 6) | Draft text sync works; photo sync needs base64 |
| Realization comments moderation UI (Phase 10) | Server actions exist; no UI built |
