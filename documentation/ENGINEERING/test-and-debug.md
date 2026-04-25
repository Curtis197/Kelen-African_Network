# Test & Debug Document — Kelen Platform

> Created: 2026-04-08
> Scope: Test every implemented feature, document expected behavior, known issues, and debugging steps
> Audience: QA, Engineering, and Product teams

---

## How to Use This Document

Each feature has:
- **Test scenario** — Step-by-step actions to verify functionality
- **Expected result** — What should happen if working correctly
- **Known issues** — Bugs or gaps identified during implementation
- **Debug steps** — How to investigate if the test fails

---

## 1. Authentication & Onboarding

### 1.1 Professional Registration

**Test:**
1. Navigate to `/inscription`
2. Select "Professionnel" role
3. Fill email, password, business name, category, city, country
4. Submit

**Expected:**
- Account created in Supabase `users` and `professionals` tables
- Professional slug auto-generated (e.g., `kouadio-construction-dakar`)
- Redirect to `/pro/dashboard` or email confirmation page
- Toast: "Compte créé avec succès"

**Debug:**
- Check Supabase `users` table for new record
- Check `professionals` table for linked profile
- Check browser console for auth errors
- Verify `middleware.ts` allows redirect to `/pro/dashboard`

### 1.2 Login

**Test:**
1. Navigate to `/connexion`
2. Enter email + password
3. Submit

**Expected:**
- Session created, redirect to `/pro/dashboard`
- ProSidebar shows business name + email

**Debug:**
- Check `supabase.auth.getSession()` in browser dev tools
- Verify `professionals` table has matching `user_id`

### 1.3 Password Reset

**Test:**
1. Click "Mot de passe oublié"
2. Enter registered email
3. Submit

**Expected:**
- Password reset email sent (if Supabase email configured)
- Toast confirmation

---

## 2. Professional Dashboard (`/pro/dashboard`)

### 2.1 Real Data Display

**Test:**
1. Log in as a professional with existing data
2. View dashboard

**Expected:**
- Business name displays (not "Mon profil" fallback)
- StatusBadge shows correct status (Gold/Silver/White/Red)
- Recommendation count matches `recommendations` table
- Signal count matches `signals` table
- Monthly views shows real number from `profile_views` (last 30 days)
- Subscription shows "Premium" or "Gratuit" based on `subscriptions` table

**Known issues:**
- ❌ Avg rating shows "—" if no reviews exist (expected)
- ⚠️ If `professionals` table has no record, shows "Profil professionnel introuvable" with link to `/pro/profil`

**Debug:**
- Open Network tab → check `dashboard-stats` server action response
- Query Supabase directly: `SELECT * FROM professionals WHERE user_id = '<user_id>'`
- Check `recommendations WHERE professional_id = '<pro_id>' AND verified = TRUE`

### 2.2 Pending Actions

**Test:**
1. Create a pending recommendation or signal for the professional
2. View dashboard

**Expected:**
- "Actions requises" section shows count of pending items
- "Voir" link navigates to `/pro/recommandations`
- "Répondre" link navigates to `/pro/signal`
- If no pending items: "Aucune action requise pour le moment."

---

## 3. Projects Management (`/pro/projets`)

### 3.1 Create Project

**Test:**
1. Navigate to `/pro/projets`
2. Click "Nouveau projet"
3. Fill title, description, category, location, dates, budget, currency
4. Toggle "Afficher sur mon portfolio public"
5. Submit

**Expected:**
- Project created in `pro_projects` table
- Redirect to `/pro/projets/[id]`
- Toast: "Projet créé"
- Project appears in projects list

**Debug:**
- Check `pro_projects` table for new record with correct `professional_id`
- Check server action `createProProject` response

### 3.2 Project Detail + Journal Stats

**Test:**
1. Click "Voir détails" on any project
2. View project detail page

**Expected:**
- Title, status badge, portfolio badge display
- Description, location, dates, budget, client info display
- **Journal stats section shows real numbers:**
  - Rapports: count of logs for this project
  - Dépenses totales: sum of `money_spent` across all logs
  - Photos: count of media records linked to logs
  - Jours travaillés: count of unique `log_date` values
- "Journal" button navigates to `/pro/projets/[id]/journal`
- "Modifier" button navigates to `/pro/projets/[id]/edit`

**Known issues:**
- ⚠️ If no logs exist: shows empty state with "Créer le premier rapport" CTA

**Debug:**
- Check server action `getProjectJournalStats` response
- Query: `SELECT COUNT(*) FROM project_logs WHERE pro_project_id = '<project_id>'`

### 3.3 Delete Project

**Test:**
1. Click delete (trash icon) on a project
2. Confirm dialog
3. Verify toast and list update

**Expected:**
- Native confirm dialog appears
- On confirm: project deleted, toast "Projet supprimé"
- Project removed from list

**Debug:**
- Check `deleteProProject` server action
- Verify `pro_projects` table record deleted

---

## 4. Daily Journal (`/pro/projets/[id]/journal`)

### 4.1 Create Log

**Test:**
1. Navigate to project journal
2. Click "Nouveau rapport"
3. Fill date, title (min 1 char), description (min 50 chars), money spent, weather
4. Upload photos (drag & drop or file picker)
5. Click "Publier le rapport"

**Expected:**
- Log created in `project_logs` table
- Photos uploaded to `log-media` storage bucket
- Redirect to journal list
- Toast: "Rapport publié avec succès"
- Log appears in timeline grouped by month

**Debug:**
- Check `project_logs` table for new record
- Check `log-media` Supabase Storage bucket for uploaded files
- Check `project_log_media` table for media records

### 4.2 Offline Draft Sync

**Test:**
1. Go offline (disconnect network in DevTools)
2. Create a log, save as draft
3. Go back online
4. Click "Sync" button in OfflineIndicator

**Expected:**
- Draft reads from IndexedDB via `getDraft()`
- `createLog()` server action called with draft data
- On success: draft deleted from IndexedDB, toast "X brouillon(s) synchronisé(s)"
- Log appears in journal timeline

**Known issues:**
- ⚠️ Photos from offline drafts are NOT preserved during sync (File objects don't serialize to IndexedDB). Text data, GPS, money spent, weather all sync correctly.

**Debug:**
- Open Application tab → IndexedDB → check `draft-log-*` keys
- Check Network tab for `createLog` server action call
- Check console for sync errors

### 4.3 Log Detail + Actions

**Test:**
1. Click a log card in journal timeline
2. View log detail page

**Expected:**
- Title, description, date, time, author display
- GPS display with coordinates
- Money spent display (if > 0)
- Weather icon (if set)
- Photo gallery with signed URLs
- Issues section (amber highlight, if set)
- Next steps section (if set)
- Comment thread shows approvals/contests
- "Partager" button opens ShareLogModal
- Approve/Contest buttons functional

**Debug:**
- Check `getLogById` server action response
- Check `getMediaUrl` for signed URLs
- Verify photos load correctly (no broken images)

---

## 5. Profile Management (`/pro/profil`)

### 5.1 Edit Profile

**Test:**
1. Navigate to `/pro/profil`
2. Edit any field (description, services, experience, team, WhatsApp, hero image, tagline, about text, portfolio photos)
3. Submit

**Expected:**
- `professionals` table updated
- Toast: "Profil mis à jour avec succès"
- Changes reflect on public profile page

**Debug:**
- Check `professionals` table for updated fields
- Check Supabase Storage for uploaded images

### 5.2 AI Copywriting

**Test:**
1. Navigate to `/pro/profil`
2. Click "Générer avec l'IA"
3. Complete 4-step questionnaire:
   - Step 1: Select up to 3 personal values
   - Step 2: Select up to 3 professional qualities
   - Step 3: Select relationship style + communication frequency + optional proudest project
   - Step 4: Review + click "Générer mes textes"
4. Wait for generation

**Expected:**
- Dialog progresses through 4 steps
- API call to Anthropic Claude Sonnet 4
- On success: `bio_accroche` and `about_text` fields populated
- Toast: "Textes générés avec succès !"
- Hero tagline and about text update in form

**Known issues:**
- ⚠️ Requires `ANTHROPIC_API_KEY` in environment variables
- ❌ If API key not set: toast "Clé API non configurée"

**Debug:**
- Check `ANTHROPIC_API_KEY` in `.env.local`
- Check server action `generateBioCopy` response
- Check Anthropic API dashboard for request logs

### 5.3 Logo Upload + Branding

**Test:**
1. (Infrastructure ready — UI component not yet built)
2. Server action `uploadLogo()` accepts FormData with logo file
3. Server action `saveBrandColors()` stores hex colors

**Expected:**
- Logo uploads to `logos` storage bucket
- `logo_storage_path`, `brand_primary`, `brand_secondary`, `brand_accent` saved to `professionals` table

**Debug:**
- Check `logos` storage bucket
- Query: `SELECT logo_storage_path, brand_primary, brand_secondary, brand_accent FROM professionals WHERE id = '<pro_id>'`

---

## 6. Recommendations (`/pro/recommandations`)

### 6.1 View Recommendations

**Test:**
1. Navigate to `/pro/recommandations`

**Expected:**
- Loading skeleton appears, then loads
- List shows all recommendations linked to professional
- Each item: project type, location, client name, completion date, status badge
- "Lier au profil" button for unlinked recommendations
- "Publié" badge for linked recommendations

**Debug:**
- Check `recommendations WHERE professional_id = '<pro_id>'`
- Check network request in browser DevTools

### 6.2 Copy Profile Link

**Test:**
1. View recommendations with none linked
2. Click "Copier mon lien Pro"

**Expected:**
- Profile URL copied to clipboard
- Toast: "Lien de profil copié dans le presse-papiers"

**Previously known issue (FIXED):**
- ✅ Button was dead (no onClick) — now copies URL via `navigator.clipboard.writeText()`

---

## 7. Signals (`/pro/signal`)

### 7.1 View Signals

**Test:**
1. Navigate to `/pro/signal`

**Expected:**
- Loading skeleton, then signals list
- Each signal: breach type, severity badge, description, countdown (days remaining)
- 15-day response deadline warning banner
- Response form (textarea + submit) for unanswered signals
- Published response shown for answered signals

**Debug:**
- Check `signals WHERE professional_id = '<pro_id>'`
- Verify countdown calculation: `Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))`

### 7.2 Respond to Signal

**Test:**
1. Fill response textarea
2. Click "Envoyer ma réponse"

**Expected:**
- `signals` table updated: `pro_response`, `pro_responded_at`, `status = 'disputed'`
- Toast confirmation
- Response displayed in "Ma réponse publiée" section

**Debug:**
- Check `signals` table for updated fields
- Verify status changed to "disputed"

---

## 8. Subscription & Payments (`/pro/abonnement`)

### 8.1 View Subscription Status

**Test:**
1. Navigate to `/pro/abonnement`

**Expected:**
- Subscription card shows current plan name, status, renewal date
- Free vs Premium pricing comparison visible
- Billing history section (empty placeholder if no invoices)

**Debug:**
- Check `subscriptions WHERE professional_id = '<pro_id>'`
- Verify `planName` logic: `pro_africa → Premium Kelen`, `pro_europe → Premium Europe`, else `Gratuit`

### 8.2 Subscribe via Stripe

**Test:**
1. Click "S'abonner maintenant" (free tier)
2. Redirect to Stripe Checkout

**Expected:**
- Redirect to Stripe hosted checkout page
- On successful payment: webhook fires → `subscriptions` table updated → professional tier changed to active
- Redirect back to `/pro/abonnement?success=true`

**Known issues:**
- ⚠️ Requires Stripe price IDs configured in env (`STRIPE_PRICE_PRO_AFRICA`, `STRIPE_PRICE_PRO_EUROPE`)
- ⚠️ Requires `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in env
- ❌ Without these: toast "Plan non configuré"

**Debug:**
- Check Stripe Dashboard for checkout sessions and webhooks
- Check `app/api/stripe/webhook` logs in server console
- Verify `subscriptions` table updated after webhook fires
- Check `professionals.subscription_tier` and `subscription_status`

### 8.3 Manage Subscription

**Test:**
1. Click "Gérer mon abonnement" or "Gérer mon moyen de paiement" (active subscriber)

**Expected:**
- Redirect to Stripe Customer Portal
- Can view invoices, update payment method, cancel subscription

**Debug:**
- Check `subscriptions.stripe_customer_id` exists
- Check Stripe Dashboard for Customer Portal sessions

---

## 9. Analytics (`/pro/analytique`)

### 9.1 View Analytics

**Test:**
1. Navigate to `/pro/analytique`

**Expected:**
- Loading skeletons display, then real data loads
- Stats cards: total views, monthly views, search appearances, interactions, contact clicks
- Bar chart: last 6 months of profile views
- Traffic sources: breakdown by source (Recherche Kelen, Lien direct)

**Known issues:**
- ⚠️ No date range selector — always shows last 6 months
- ⚠️ No loading state between data fetches (shows "0" while loading — **FIXED**: now shows skeleton placeholders)

**Debug:**
- Check `profile_views WHERE professional_id = '<pro_id>'`
- Check `profile_interactions WHERE professional_id = '<pro_id>'`
- Verify chart data calculation groups views by month correctly

---

## 10. Notifications

### 10.1 In-App Notifications

**Test:**
1. Log in as professional
2. Check bell icon in ProSidebar or Navbar

**Expected:**
- Bell icon shows unread count badge (red dot with number)
- Click bell → dropdown opens with up to 10 recent notifications
- Each notification: icon, title, body, time-ago, click navigates to linked page
- "Tout marquer" button marks all as read
- Unread notifications highlighted with green tint

**Debug:**
- Check `notifications WHERE user_id = '<user_id>' ORDER BY created_at DESC`
- Check server action `getNotifications` response
- Check `getUnreadCount` returns correct number

### 10.2 Email Notifications

**Test:**
1. Trigger a notification event (e.g., create a log as professional, have client approve it)

**Expected:**
- Email received at professional's email address
- Email subject: "✅ Rapport approuvé pour '<project>'"
- Email body: project name, log title, comment, link to view detail
- Consistent Kelen branding (green header, footer with kelen.africa link)

**Known issues:**
- ⚠️ Requires `RESEND_API_KEY` in environment variables
- ❌ Without it: console warning "Resend not configured — skipping email notification"

**Debug:**
- Check `RESEND_API_KEY` in `.env.local`
- Check Resend Dashboard for sent emails
- Check server console for email send errors

---

## 11. PDF/Excel Export

### 11.1 PDF Export

**Test:**
1. Navigate to any project's step management page
2. Click "Exporter" dropdown
3. Click "Rapport PDF (.pdf)"

**Expected:**
- Loading state: button shows "Génération..."
- PDF downloads with filename `kelen-projet-<title>.pdf`
- PDF contents:
  - Cover page: Kelen header (green), project name, generated date
  - Project overview: category, location, client, status, budget, description
  - Steps table: Étape, Statut, Budget, Dépense, Experts
  - Journal logs table: Date, Titre, Auteur, Dépenses, Photos, Statut
  - Financial summary: total budget, total spent, remaining
  - Footer on each page: "Propulsé par Kelen — page X/Y"

**Debug:**
- Check server action `getProjectExportData` response
- Check browser download folder for PDF file
- Open PDF and verify all sections render correctly
- Check console for `jspdf` errors

### 11.2 Excel Export

**Test:**
1. Same as above, click "Tableau Excel (.xlsx)"

**Expected:**
- Excel file downloads with 4 sheets:
  - **Résumé**: project overview (key-value pairs)
  - **Étapes**: steps with budget, expenditure, assigned pros
  - **Journal**: all logs with dates, descriptions, money, photos, status
  - **Finances**: budget summary, step count, log count, total photos

**Debug:**
- Open Excel file and verify all 4 sheets exist
- Check sheet data matches database records
- Verify French formatting (date format, number separators)

---

## 12. Dark Mode

### 12.1 Theme Toggle

**Test:**
1. Click theme toggle in Navbar (sun/moon/monitor icons)
2. Switch between Light, Dark, System

**Expected:**
- Light mode: `bg-surface` = `#f9f9f8`, text dark
- Dark mode: `bg-surface` = dark, text light
- System mode: follows OS preference
- Preference persists in localStorage
- All dashboard pages render correctly in both modes

**Known issues:**
- ⚠️ Some components still use raw color values (`bg-stone-50`, `text-kelen-green-600`) without dark variants
- ⚠️ `html` element has `suppressHydrationWarning` to prevent class mismatch during SSR

**Debug:**
- Check `document.documentElement.classList` for `dark` class
- Check localStorage for `theme` key
- Inspect computed styles on dark mode elements

---

## 13. Status Calculation Engine

### 13.1 Automatic Status Recalculation

**Test:**
1. As admin, verify a recommendation for a professional
2. Check professional's status

**Expected:**
- Status recalculates automatically via database trigger
- If 3+ verified + linked recommendations, 0 signals → status = 'gold'
- If 1-2 verified + linked recommendations, 0 signals → status = 'silver'
- If 0 verified recommendations → status = 'white'
- If 1+ verified signals → status = 'red' (permanent)

**Known issues:**
- ⚠️ Red status is permanent once set — only admin can manually override via `forceSetStatus()`
- ⚠️ Black status is NOT automatic — only set by admin action

**Debug:**
- Check `professionals.status` field after verification
- Verify triggers fire: `on_recommendation_change`, `on_signal_change`, `on_review_change`
- Check database function `compute_professional_status()` logic

### 13.2 Manual Status Override (Admin)

**Test:**
1. Call `forceSetStatus(professionalId, 'white')` as admin
2. Check professional's status

**Expected:**
- Status updates to 'white' (or any specified tier)
- Bypasses automatic calculation

**Debug:**
- Verify admin role check in `forceSetStatus` server action
- Check `professionals.status` field updated

---

## 14. PWA (Progressive Web App)

### 14.1 Service Worker Registration

**Test:**
1. Open app in browser
2. Check DevTools → Application → Service Workers

**Expected:**
- Service worker registered at `/sw.js`
- Status: "Activated and is running"
- Cache populated with static assets

**Debug:**
- Check console for `[SW] Service worker registered` log
- Check Application tab → Cache Storage for `kelen-v1` cache
- Verify `manifest.json` accessible at `/manifest.json`

### 14.2 Offline Access

**Test:**
1. Go offline (DevTools → Network → Offline)
2. Reload page
3. Navigate to previously cached pages

**Expected:**
- Cached pages load from service worker
- Journal form accessible offline
- Draft saves to IndexedDB

**Debug:**
- Check IndexedDB for draft data
- Check service worker fetch handler responses
- Verify network-first strategy falls back to cache

---

## 15. SEO

### 15.1 Sitemap

**Test:**
1. Navigate to `/sitemap.xml`

**Expected:**
- XML file lists all static routes (/, /recherche, /comment-ca-marche, /a-propos, /pros)
- Lists all professional profile URLs (`/professionnels/<slug>`)
- Each entry has `<lastmod>`, `<changefreq>`, `<priority>`

**Debug:**
- Check `app/sitemap.ts` server component
- Verify `professionals` table query returns expected slugs

### 15.2 Robots.txt

**Test:**
1. Navigate to `/robots.txt`

**Expected:**
- Allows `/professionnels/` for Googlebot
- Blocks `/login`, `/register`, `/dashboard`, `/pro/`, `/admin/`, `/auth/`, `/api/`
- Sitemap URL points to `/sitemap.xml`

### 15.3 Open Graph Tags

**Test:**
1. View source of any `/professionnels/<slug>` page
2. Check `<meta>` tags in `<head>`

**Expected:**
- `<meta property="og:title" content="...">`
- `<meta property="og:description" content="...">`
- `<meta property="og:type" content="profile">`
- `<meta property="og:url" content="...">`
- `<meta property="og:image" content="...">` (if photo_url set)
- `<meta name="robots" content="index">` for gold/silver, `noindex` for white/red

**Debug:**
- Check `generateMetadata` function in `professionnels/[slug]/page.tsx`
- Verify `isPaid` logic: `pro.status === 'gold' || pro.status === 'silver'`

---

## Known Issues Summary

| Severity | Issue | Phase | Status |
|---|---|---|---|
| 🔴 High | Photos from offline drafts lost during sync | 6 | Known — needs base64 storage or Background Sync API |
| 🟡 Medium | AI copywriting requires `ANTHROPIC_API_KEY` env var | 4 | Expected — document in setup guide |
| 🟡 Medium | Stripe requires `STRIPE_SECRET_KEY` + price IDs configured | 2 | Expected — document in setup guide |
| 🟡 Medium | Email notifications require `RESEND_API_KEY` env var | 8 | Expected — document in setup guide |
| 🟡 Medium | Some components still use raw colors without dark variants | 0 | Partial — most dashboard pages fixed |
| 🟢 Low | No date range selector on Analytics (always last 6 months) | 10 | Deferred |
| 🟢 Low | Realization comments have server actions but no moderation UI | 10 | Deferred |
| 🟢 Low | Wave/Orange Money not integrated (Stripe only) | 2 | Deferred |

---

## Environment Variables Required

| Variable | Purpose | Required For |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | All features |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client key | All features |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side Supabase access | Server actions |
| `NEXT_PUBLIC_SITE_URL` | Base URL (default: https://kelen.africa) | SEO, emails, Stripe |
| `ANTHROPIC_API_KEY` | Claude Sonnet 4 API access | AI copywriting |
| `STRIPE_SECRET_KEY` | Stripe server API key | Payment processing |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature verification | Payment webhooks |
| `STRIPE_PRICE_PRO_AFRICA` | Stripe price ID for African plan (3000 XOF/mo) | Subscription |
| `STRIPE_PRICE_PRO_EUROPE` | Stripe price ID for European plan (€15/mo) | Subscription |
| `RESEND_API_KEY` | Resend email API key | Email notifications |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 Measurement ID | Analytics tracking |

---

## Supabase Storage Buckets Required

| Bucket | Purpose | Max File Size |
|---|---|---|
| `logos` | Professional logos (for branding) | 5MB |
| `log-media` | Daily log photos | 10MB |
| `photos` | Portfolio photos | 10MB |
| `videos` | Portfolio videos (paid) | 100MB |
| `avatars` | Profile pictures | 5MB |
| `covers` | Hero/cover images | 10MB |
| `contracts` | Contract documents | 10MB |
| `verification-docs` | Admin verification evidence | 10MB |

---

## Database Migrations Required

| Migration | Purpose |
|---|---|
| `20260323000003_users.sql` | Users table with role field |
| `20260323000004_professionals.sql` | Professionals table with status field |
| `20260323000005_subscriptions.sql` | Subscriptions table |
| `20260323000006_recommendations.sql` | Recommendations table |
| `20260323000007_signals.sql` | Signals table |
| `20260323000008_reviews.sql` | Reviews table |
| `20260323000009_analytics.sql` | Profile views + interactions tables |
| `20260323000010_verification_queue.sql` | Verification queue table |
| `20260323000013_functions.sql` | Status calculation function (old version) |
| `20260323000014_triggers.sql` | Status recalculation triggers |
| `20260406000001_daily_logs.sql` | Project logs + media + comments + shares + views tables |
| `20260406000002_log_media_bucket.sql` | Log media storage bucket |
| `20260407000002_pro_projects.sql` | Professional-owned projects table |
| `20260408000001_ai_copywriting_branding.sql` | AI questionnaire fields + brand colors |
| `20260408000002_fix_status_calculation.sql` | **Critical** — fixes status thresholds to match spec |
| `20260408000003_notifications.sql` | In-app notifications table |

---

## Smoke Test Checklist (Pre-Deploy)

Run this before every production deploy:

- [ ] Professional registration + login works
- [ ] Dashboard shows real data (not hardcoded)
- [ ] Create project → view detail → journal stats display
- [ ] Create journal log → upload photos → view in timeline
- [ ] Offline draft sync works (text data)
- [ ] Profile edit → changes reflect on public page
- [ ] AI copywriting generates bio (with API key)
- [ ] Recommendations list shows + "Copier mon lien Pro" works
- [ ] Signals list shows + response form works
- [ ] Subscription page loads + Stripe redirect works (with keys)
- [ ] Analytics loads with real data + loading skeletons
- [ ] Export PDF downloads + opens correctly
- [ ] Export Excel downloads + has 4 sheets
- [ ] Dark mode toggle works + all pages render in dark mode
- [ ] Notification bell shows + dropdown works
- [ ] Sitemap.xml accessible + lists professionals
- [ ] Robots.txt accessible + correct rules
- [ ] PWA installable on mobile (with icons)
- [ ] Status recalculates on recommendation verification
- [ ] Red status is permanent (cannot be removed automatically)
