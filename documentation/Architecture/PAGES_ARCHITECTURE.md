# Kelen — Website Pages Architecture

> **Purpose of this document:** Reference for Claude Code (frontend) and for backend planning. Describes every page of the application — its URL, user type, data requirements, key components, and Supabase calls.

---

## Route Structure (Next.js App Router)

```
app/
├── (marketing)/           → Public, static, SEO-optimized
│   ├── page.tsx           → / (Home)
│   ├── pour-les-pros/     → /pour-les-pros
│   ├── comment-ca-marche/ → /comment-ca-marche
│   ├── tarifs/            → /tarifs
│   ├── a-propos/          → /a-propos
│   ├── faq/               → /faq
│   └── contact/           → /contact
│
├── (validation)/          → Public, dynamic, SEO-critical
│   ├── recherche/         → /recherche
│   └── pro/[slug]/        → /pro/kouadio-construction-abidjan
│
├── (auth)/                → Public, no index
│   ├── connexion/         → /connexion
│   ├── inscription/       → /inscription
│   └── mot-de-passe/      → /mot-de-passe
│
├── (diaspora)/            → Authenticated (role: user)
│   ├── dashboard/         → /dashboard
│   ├── recommandation/    → /recommandation (select pro)
│   │   └── [slug]/        → /recommandation/[slug] (form)
│   └── signal/            → /signal (select pro)
│       └── [slug]/        → /signal/[slug] (form)
│
├── (professional)/        → Authenticated (role: professional)
│   ├── pro/dashboard/     → /pro/dashboard
│   ├── pro/profil/        → /pro/profil (edit)
│   ├── pro/recommandations/ → /pro/recommandations (link flow)
│   ├── pro/signal/        → /pro/signal (respond to signal)
│   ├── pro/abonnement/    → /pro/abonnement (manage subscription)
│   └── pro/analytique/    → /pro/analytique
│
└── (admin)/               → Authenticated (role: admin)
    ├── admin/             → /admin (dashboard)
    ├── admin/queue/       → /admin/queue
    ├── admin/queue/[id]/  → /admin/queue/[id] (review screen)
    └── admin/journal/     → /admin/journal
```

---

## Page Groups

---

## 1. (marketing) — Public Static Pages

### 1.1 Home — `/`

**User:** Everyone (unauthenticated by default)
**Rendering:** SSG (static, cached, CDN)
**SEO priority:** Maximum

**Purpose:** Explain the platform, convert visitors into searchers or registrations. Two equal CTAs for the two user types (diaspora checking, diaspora discovering).

**Key sections:**
- Hero: headline + two CTAs ("Vérifier un professionnel" / "Trouver un professionnel")
- How it works (3 steps: client submits → Kelen verifies → you see the truth)
- Status tiers explanation (Gold / Grey / Red)
- Secondary bloc for professionals ("Prouvez que vous le méritez")

**Supabase calls:** None — fully static.

**Components:** `HeroSection`, `HowItWorks`, `StatusExplainer`, `ProCTABanner`

---

### 1.2 For Professionals — `/pour-les-pros`

**User:** Professionals discovering the platform
**Rendering:** SSG
**SEO priority:** High (target: "trouver des clients diaspora")

**Purpose:** 7-screen scroll explaining the opportunity, Gold status, CPM model, and the standard (one signal = Red). Converts professionals to registration.

**Key sections:**
1. The opportunity (€47B sent to Africa annually)
2. The Gold status (built, not bought)
3. Abonnement Premium (€15/mois — visibilité illimitée)
4. What the profile contains (verified only, not editable)
5. The standard (one breach = permanent Red)
6. CTA to register

**Supabase calls:** None — fully static.

**Components:** `ScrollSection` × 7, `PricingCalculator` (static), `RegisterCTA`

---

### 1.3 How It Works — `/comment-ca-marche`

**User:** Everyone
**Rendering:** SSG

**Purpose:** Detailed explanation of the two systems (Validation free vs Advertisement CPM), the verification process, and the Gold / Red / Grey status logic.

**Key sections:**
- System 1: Validation (free, permanent, evidence-based)
- System 2: Advertisement (Subscription, optional, independent of validation)
- Verification process timeline (submit → 2–5 days → decision)
- Status rules (5 recommendations linked + 0 signals = Gold)
- What "linked" means (professional claims the recommendation)

**Supabase calls:** None.

---

### 1.4 Pricing — `/tarifs`

**User:** Professionals
**Rendering:** SSG

**Purpose:** Transparent subscription pricing. No hidden fees.

**Key sections:**
- Free Tier: Internal visibility (name search), 3 projects max.
- Premium Tier: €15 (3000 FCFA) / month.
- Unlimited project exposure, Google SEO indexability, video uploads.
- Payment methods (Stripe for EUR, Wave/Orange Money for XOF)
- No commission on projects.

**Supabase calls:** None.

---

### 1.5 About — `/a-propos`

**User:** Everyone
**Rendering:** SSG

**Key sections:** Mission, why Kelen exists, the permanence principle, team/contact, legal entity.

---

### 1.6 FAQ — `/faq`

**User:** Everyone
**Rendering:** SSG

**Key FAQ entries:**
- "Can a professional remove a signal?" → No, never.
- "Is checking a professional free?" → Yes, always.
- "What counts toward Gold status?" → Verified + linked recommendations (minimum 3).
- "What happens if I submit a false signal?" → Account suspension + legal liability.
- "Can I pay for my subscription with mobile money?" → Yes, Stripe (card), Wave, Orange Money.
- "Is my data GDPR compliant?" → Yes, Frankfurt servers, data never sold.

---

### 1.7 Contact — `/contact`

**User:** Everyone
**Rendering:** SSG + client form

**Key sections:** Contact form (name, email, subject, message), response time commitment (48h), legal email for GDPR requests.

**Supabase calls:** None (form sends to Resend directly or via API route).

---

## 2. (validation) — Public Dynamic Pages

### 2.1 Search / Results — `/recherche`

**User:** Everyone (no account required)
**Rendering:** SSR (dynamic, query-driven)
**SEO priority:** High

**Purpose:** The core free feature. User types a professional name or browses by category + location. Two modes:

**Mode A — Name lookup (Validation):**
- Exact name search
- Returns all professionals matching the name
- Shows status (Or / Argent / Blanc / Rouge) and recommendation count
- **Liste Noire profiles are excluded** even from direct name search
- "No result" message explains absence ≠ problem

**Mode B — Browse (Discovery):**
- Filter: category + country/city
- Only shows professionals with `subscription_status = 'active'` (Premium) AND `status != 'black'`
- Free profiles are searchable by name but only Premium profiles appear in Browse.
- Cards show status badge, verified project count, avg rating

**Supabase calls:**
```
Mode A (lookup):
SELECT id, business_name, owner_name, slug, status, recommendation_count,
       signal_count, category, country, city
FROM professionals
WHERE to_tsvector('french', business_name) @@ plainto_tsquery('french', :query)
ORDER BY status, recommendation_count DESC

Mode B (browse):
SELECT id, business_name, slug, status, recommendation_count,
       category, city, portfolio_photos
FROM professionals
WHERE is_visible = TRUE
  AND subscription_status = 'active'
  AND category = :category
  AND country = :country
  AND (:gold_only = FALSE OR status = 'gold')
ORDER BY recommendation_count DESC
LIMIT 20 OFFSET :offset
```

**Components:** `SearchBar`, `FilterPanel`, `ProfessionalCard`, `StatusBadge`, `EmptyState`

---

### 2.2 Public Professional Profile — `/pro/[slug]`

**User:** Everyone (no account required)
**Rendering:** SSR + ISR (revalidate on status change)
**SEO priority:** Maximum — this is the page people share and link to

**Purpose:** The professional's permanent public record. Shows everything verifiable. Contact info and portfolio only visible if `subscription_status = 'active'`.

**Page sections:**

**Always visible (regardless of credit):**
- Business name, owner name, category, city, country
- Status badge (Or / Argent / Blanc / Rouge / Noir) with explanation
- Recommendation count, signal count, avg rating, review count
- Verified recommendations list (project type, date, budget range, location, photos, before/after)
- Verified signals list (breach type, description, timeline deviation, professional response if any)
- Public reviews (rating + comment, newest first, hidden reviews excluded)

**Only visible if Premium (active subscription):**
- Phone number, WhatsApp link, email
- Portfolio photos / videos (Unlimited)
- Full business description
- SEO Indexability for search engines

**Liste Rouge special display:**
- Alert banner: "Ce professionnel est sur Liste Rouge. Un manquement contractuel documenté a été vérifié."
- Signal details expanded by default
- Professional response shown if submitted

**Liste Noire special display:**
- Profile accessible via direct URL only (not discoverable)
- Dark banner: "Ce professionnel est sur Liste Noire. Plusieurs manquements contractuels documentés ont été vérifiés."
- All signals shown, contact info hidden regardless of credit

**"Not found" state:**
- Slug doesn't match: "Ce professionnel n'est pas référencé sur Kelen."

**Supabase calls:**
```
SELECT p.*, 
       r.* (verified = TRUE),
       s.* (verified = TRUE)
FROM professionals p
LEFT JOIN recommendations r ON r.professional_id = p.id AND r.verified = TRUE
LEFT JOIN signals s ON s.professional_id = p.id AND s.verified = TRUE
WHERE p.slug = :slug

-- Also track the view (for analytics only, no cost deduction):
SELECT track_profile_view(:professional_id, :viewer_ip, :country, :source, :query)
```

**Components:** `StatusBanner`, `RecommendationCard`, `SignalCard`, `ContactBlock` (conditional), `PortfolioGrid` (conditional), `SubmitCTA`

---

## 3. (auth) — Authentication Pages

### 3.1 Login — `/connexion`

**User:** Unauthenticated
**Rendering:** Client

**Fields:** Email, password. Magic link option. Forgot password link.

**Post-login redirect:**
- role = `user` → `/dashboard`
- role = `professional` → `/pro/dashboard`
- role = `admin` → `/admin`

**Supabase calls:** `supabase.auth.signInWithPassword()` or `supabase.auth.signInWithOtp()`

---

### 3.2 Register — `/inscription`

**User:** Unauthenticated
**Rendering:** Client, 2-step form

**Step 1 — Identity:**
- First name, last name, email, password, country of residence

**Step 2 — Preferences:**
- Language (FR / EN)
- Email notifications opt-in
- Terms + Privacy acceptance

**Account type selection:** Two paths — "Je suis un client diaspora" / "Je suis un professionnel"
- Professional path adds: business name, category, city, phone

**Supabase calls:**
```
supabase.auth.signUp({ email, password })
-- Then on confirmation:
INSERT INTO users (id, email, display_name, role, country, ...)
-- If professional:
INSERT INTO professionals (user_id, business_name, category, city, ...)
```

---

### 3.3 Password Reset — `/mot-de-passe`

**User:** Unauthenticated
**Fields:** Email → receive reset link → new password form

**Supabase calls:** `supabase.auth.resetPasswordForEmail()` → `supabase.auth.updateUser()`

---

## 4. (diaspora) — Authenticated User Area

### 4.1 Diaspora Dashboard — `/dashboard`

**User:** Authenticated (role: user)
**Rendering:** SSR (server-side, personalized)

**Purpose:** Central hub for a diaspora member's activity on the platform.

**Sections:**

**Header:** "Bonjour, [Prénom]." + two quick-action buttons (Vérifier / Soumettre)

**My recommendations:** Cards for each submitted recommendation — status (pending / verified / rejected), link to professional profile, CTA to resubmit if rejected.

**My signals:** Cards for each submitted signal — status, professional response indicator, outcome.

**Saved searches:** Professionals the user bookmarked from search results, with current status shown.

**Supabase calls:**
```
SELECT * FROM recommendations WHERE submitter_id = auth.uid() ORDER BY created_at DESC
SELECT * FROM signals WHERE submitter_id = auth.uid() ORDER BY created_at DESC
-- Saved searches: stored in users.preferences JSONB or separate table
```

---

### 4.2 Submit Recommendation — `/recommandation/[slug]`

**User:** Authenticated (role: user)
**Rendering:** Client (multi-step form)

**Step 1 — Professional confirmation:** Show the professional's card (name, city, category). "Is this the right professional?" confirmation.

**Step 2 — Project details:**
- Project type (dropdown)
- Project description (textarea)
- Completion date (date picker)
- Budget range (select: 0–10k / 10k–25k / 25k–50k / 50k–100k / 100k+)
- Location (city where project happened)

**Step 3 — Evidence upload:**
- Contract (PDF, required, max 10MB)
- Before photos (JPG/PNG, optional, max 5MB each, up to 10)
- After photos (JPG/PNG, required, min 2, max 10)

**Step 4 — Confirmation + legal:**
- Summary of submission
- Checkbox: "Les informations soumises sont authentiques à ma connaissance."
- Submit button

**Supabase calls:**
```
-- Upload files to Storage
supabase.storage.from('contracts').upload(...)
supabase.storage.from('evidence-photos').upload(...)

-- Insert recommendation
INSERT INTO recommendations (
  professional_id, professional_slug,
  submitter_id, submitter_name, submitter_country, submitter_email,
  project_type, project_description, completion_date, budget_range, location,
  contract_url, photo_urls, before_photos, after_photos
)
-- Trigger auto-creates verification_queue row
```

---

### 4.3 Submit Signal — `/signal/[slug]`

**User:** Authenticated (role: user)
**Rendering:** Client (multi-step form)

**Step 1 — Professional confirmation:** Same as recommendation.

**Step 2 — Breach details:**
- Breach type (dropdown: timeline / budget / quality / abandonment / fraud)
- Breach description (textarea, detailed)
- Agreed start date / agreed end date
- Actual start date / actual end date (if applicable)
- Timeline deviation (text: "Promised 3 months, took 9 months")
- Agreed budget / actual budget
- Budget deviation (text: "Agreed €30k, demanded €48k")

**Step 3 — Evidence upload:**
- Contract (PDF, required)
- Evidence photos (JPG/PNG, required, min 2)
- Communication logs (WhatsApp screenshots, emails — JPG/PNG)

**Step 4 — Legal confirmation:**
- "Je comprends que les informations soumises sont authentiques."
- "Je comprends que la soumission d'un faux signal constitue une faute grave."
- "Je comprends que le professionnel sera notifié et disposera d'un délai pour répondre."

**Supabase calls:**
```
-- Upload to Storage
supabase.storage.from('contracts').upload(...)
supabase.storage.from('evidence-photos').upload(...)

-- Insert signal
INSERT INTO signals (
  professional_id, professional_slug,
  submitter_id, submitter_name, submitter_country, submitter_email,
  breach_type, breach_description,
  agreed_start_date, agreed_end_date, actual_start_date, actual_end_date,
  timeline_deviation, agreed_budget, actual_budget, budget_deviation,
  contract_url, evidence_urls, communication_logs
)
-- Trigger auto-creates verification_queue row
-- Trigger notifies professional
```

---

## 5. (professional) — Authenticated Professional Area

### 5.1 Professional Dashboard — `/pro/dashboard`

**User:** Authenticated (role: professional)
**Rendering:** SSR + Realtime (subscription status)

**Purpose:** Central hub. Subscription status is prominent. Pending recommendations to link. Analytics summary.

**Sections:**

**Subscription block (real-time via Supabase Realtime):**
- Current status (Premium / Free)
- Expiry date (if Premium)
- Visibility status (Active / Inactive)
- "Gérer mon abonnement" button

**Pending recommendations to link:**
- Cards for verified recommendations not yet linked
- "Lier ce projet à mon profil" CTA per card

**Analytics summary (30 days):**
- Views: X
- Contact clicks: X
- Top viewer country
- Top traffic source (search / browse / category / direct)

**Pending signal (if any):**
- Alert banner: "Un signal vous concernant est en cours d'examen. Délai de réponse : 5 jours."
- CTA to respond

**Supabase calls:**
```
SELECT * FROM professionals WHERE user_id = auth.uid()
SELECT * FROM recommendations WHERE professional_id = :id AND verified = TRUE AND linked = FALSE
SELECT * FROM signals WHERE professional_id = :id AND status = 'pending'
SELECT * FROM professional_analytics_view WHERE professional_id = :id
-- Realtime: subscribe to professionals.subscription_status
```

---

### 5.2 Edit Profile — `/pro/profil`

**User:** Authenticated (role: professional)
**Rendering:** Client (form)

**Editable fields:**
- Description
- Services offered (tag input)
- Years of experience
- Team size
- WhatsApp number
- Portfolio photos (upload / delete)
- Portfolio videos (upload / delete)

**Non-editable (shown read-only):** business name, owner name, category, city, status, recommendation count, signal count. (These are verified data — cannot be self-edited.)

**Supabase calls:**
```
UPDATE professionals SET description, services_offered, years_experience,
  team_size, whatsapp, portfolio_photos, portfolio_videos
WHERE user_id = auth.uid()

supabase.storage.from('portfolios').upload(...)
supabase.storage.from('portfolios').remove(...)
```

---

### 5.3 Link Recommendations — `/pro/recommandations`

**User:** Authenticated (role: professional)
**Rendering:** SSR

**Purpose:** Professional reviews verified recommendations submitted by their clients and "links" them to their profile. Linking increases recommendation count and can trigger Gold status.

**Cards show:** project type, client country, completion date, budget range, before/after photos, contract (signed URL).

**Action:** "Lier à mon profil" → sets `linked = TRUE`, `linked_at = NOW()` → triggers `compute_professional_status()`.

**Supabase calls:**
```
SELECT * FROM recommendations
WHERE professional_id = :id AND verified = TRUE
ORDER BY verified_at DESC

UPDATE recommendations SET linked = TRUE, linked_at = NOW()
WHERE id = :recommendation_id
AND professional_id = :id
-- Trigger recomputes status
```

---

### 5.4 Respond to Signal — `/pro/signal`

**User:** Authenticated (role: professional)
**Rendering:** SSR + Client (form)

**Purpose:** Professional views the verified or pending signal against them and can submit a written response with counter-evidence. Response does not remove the signal — it is displayed alongside it publicly.

**Sections:**
- Signal detail (breach type, description, timeline, budget, claimant's evidence)
- Response form: written response (textarea) + counter-evidence upload (photos/docs)
- Legal note: "Votre réponse sera visible publiquement aux côtés du signal."

**Supabase calls:**
```
SELECT * FROM signals WHERE professional_id = :id AND status IN ('pending', 'verified')

UPDATE signals SET
  pro_response = :text,
  pro_evidence_urls = :urls,
  pro_responded_at = NOW()
WHERE id = :signal_id
AND professional_id = :id
```

---

### 5.5 Subscription Management — `/pro/abonnement`

**User:** Authenticated (role: professional)
**Rendering:** Client (subscription flow)

**Purpose:** Manage subscription plan and billing.

**Sections:**
- Plan comparison (Free vs Premium)
- Current status display
- "Passer à Premium" or "Gérer mon abonnement" CTA
- Billing history (last 10 invoices)
- Payment method setup (Stripe, Wave, Orange Money)

**Supabase calls:**
```
-- Read:
SELECT subscription_plan, subscription_status, subscription_expires_at
FROM professionals WHERE user_id = auth.uid()

SELECT * FROM subscriptions
WHERE professional_id = :id
ORDER BY created_at DESC LIMIT 10

-- After successful Stripe/Wave webhook:
-- (handled server-side via process-subscription Edge Function)
```

---

### 5.6 Analytics — `/pro/analytique`

**User:** Authenticated (role: professional)
**Rendering:** SSR (from materialized view)

**Sections:**
- Views over time (30-day chart)
- Contact clicks over time
- Conversion rate (clicks / views × 100)
- Top viewer countries (bar chart)
- Top traffic sources (pie: search / browse / category / direct)
- Top search queries that led to profile
- Credit spend history (Legacy - hidden if balance is 0)

**Supabase calls:**
```
SELECT * FROM professional_analytics_view WHERE professional_id = :id

SELECT viewer_country, COUNT(*) as views
FROM profile_views
WHERE professional_id = :id AND created_at > NOW() - INTERVAL '30 days'
GROUP BY viewer_country ORDER BY views DESC LIMIT 5

SELECT search_query, COUNT(*) as hits
FROM profile_views
WHERE professional_id = :id AND search_query IS NOT NULL
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY search_query ORDER BY hits DESC LIMIT 10
```

---

## 6. (admin) — Admin-Only Area

### 6.1 Admin Dashboard — `/admin`

**User:** Authenticated (role: admin)
**Rendering:** SSR (from `platform_metrics_view`)

**Sections:**
- Platform metrics: total users, total professionals, active professionals
- Status breakdown: Gold / Red / Grey counts
- Revenue this month (sum of purchases)
- Queue size (pending items requiring review)
- Views last 30 days
- New users this week / new pros this week
- Quick link to queue

**Supabase calls:**
```
SELECT * FROM platform_metrics_view
-- (single row, refreshed every 15 min)
```

---

### 6.2 Verification Queue — `/admin/queue`

**User:** Authenticated (role: admin)
**Rendering:** SSR + Realtime

**Purpose:** List of all pending recommendations and signals awaiting review. Oldest first (FIFO).

**Filters:**
- All / Recommendations only / Signals only
- Pending / In review / Completed

**Each queue item card shows:**
- Item type (recommendation / signal) with color coding
- Submitter name + country
- Professional name + city + current status
- Submission date
- Assigned to (or "Non assigné")
- "Prendre en charge" button (assigns to current admin)

**Supabase calls:**
```
SELECT vq.*, p.business_name, p.status,
  COALESCE(r.submitter_name, s.submitter_name) as submitter_name,
  COALESCE(r.submitter_country, s.submitter_country) as submitter_country
FROM verification_queue vq
JOIN professionals p ON vq.professional_id = p.id
LEFT JOIN recommendations r ON vq.item_type = 'recommendation' AND vq.item_id = r.id
LEFT JOIN signals s ON vq.item_type = 'signal' AND vq.item_id = s.id
WHERE vq.status IN ('pending', 'in_review')
ORDER BY vq.created_at ASC

-- Claim item:
UPDATE verification_queue SET status = 'in_review', assigned_to = auth.uid()
WHERE id = :queue_id AND assigned_to IS NULL
```

---

### 6.3 Review Screen — `/admin/queue/[id]`

**User:** Authenticated (role: admin)
**Rendering:** SSR

**Purpose:** Full detail view for reviewing one recommendation or signal. All evidence visible. Admin can approve or reject.

**For recommendations, shows:**
- Submitter identity (name, email, country)
- Professional info (name, city, current status)
- Project details (type, date, budget, location)
- Contract PDF (signed URL)
- Before/after photos
- Current linked status
- Admin notes field
- Actions: "Vérifier et publier" / "Rejeter" (with reason field)

**For signals, shows:**
- All above + breach type, timeline deviation, budget deviation
- Communication logs (WhatsApp screenshots)
- Professional's response (if submitted)
- Professional's counter-evidence
- Actions: "Vérifier — Liste Rouge" / "Rejeter" / "Marquer comme contesté"

**Supabase calls:**
```
-- For recommendations:
UPDATE recommendations SET
  verified = TRUE, verified_at = NOW(), verified_by = auth.uid(),
  status = 'verified', verification_notes = :notes
WHERE id = :item_id
-- Trigger: compute_professional_status, notify submitter + pro, close queue item

-- For signals:
UPDATE signals SET
  verified = TRUE, verified_at = NOW(), verified_by = auth.uid(),
  status = 'verified', verification_notes = :notes
WHERE id = :item_id
-- Trigger: set professional status = RED, urgent notification to pro, notify submitter

-- For rejection:
UPDATE recommendations (or signals) SET
  status = 'rejected', rejection_reason = :reason
WHERE id = :item_id
-- Trigger: notify submitter with reason
```

---

### 6.4 Audit Log — `/admin/journal`

**User:** Authenticated (role: admin)
**Rendering:** SSR (paginated)

**Purpose:** Chronological log of all verification decisions. Who decided what, when.

**Columns:** Date, admin name, action (verified/rejected), item type, professional name, submitter name.

**Supabase calls:**
```
SELECT vq.reviewed_at, u.display_name as admin_name,
  r.status as decision, p.business_name,
  COALESCE(r.submitter_name, s.submitter_name) as submitter_name,
  vq.item_type
FROM verification_queue vq
JOIN users u ON vq.assigned_to = u.id
JOIN professionals p ON vq.professional_id = p.id
LEFT JOIN recommendations r ON vq.item_type = 'recommendation' AND vq.item_id = r.id
LEFT JOIN signals s ON vq.item_type = 'signal' AND vq.item_id = s.id
WHERE vq.status = 'completed'
ORDER BY vq.reviewed_at DESC
LIMIT 50 OFFSET :offset
```

---

## 7. Legal & Static Pages

| Page | URL | Notes |
|---|---|---|
| Legal notice | `/mentions-legales` | Required by French law. Static. |
| Privacy policy | `/confidentialite` | GDPR. Data retention, rights, contact. Static. |
| Terms of use | `/cgu` | User obligations, signal rules, professional obligations. Static. |

---

## Page Summary Table

| # | Page | URL | Auth | Rendering | Priority |
|---|---|---|---|---|---|
| 1 | Home | `/` | No | SSG | P0 |
| 2 | For professionals | `/pour-les-pros` | No | SSG | P0 |
| 3 | How it works | `/comment-ca-marche` | No | SSG | P1 |
| 4 | Pricing | `/tarifs` | No | SSG | P1 |
| 5 | About | `/a-propos` | No | SSG | P2 |
| 6 | FAQ | `/faq` | No | SSG | P2 |
| 7 | Contact | `/contact` | No | SSG + form | P2 |
| 8 | Search / Browse | `/recherche` | No | SSR | P0 |
| 9 | Public profile | `/pro/[slug]` | No | SSR + ISR | P0 |
| 10 | Login | `/connexion` | No | Client | P0 |
| 11 | Register | `/inscription` | No | Client | P0 |
| 12 | Password reset | `/mot-de-passe` | No | Client | P1 |
| 13 | Diaspora dashboard | `/dashboard` | user | SSR | P0 |
| 14 | Submit recommendation | `/recommandation/[slug]` | user | Client | P0 |
| 15 | Submit signal | `/signal/[slug]` | user | Client | P0 |
| 16 | Leave a review | `/avis/[slug]` | user | Client | P1 |
| 17 | Pro dashboard | `/pro/dashboard` | professional | SSR + RT | P0 |
| 18 | Edit profile | `/pro/profil` | professional | Client | P1 |
| 19 | Link recommendations | `/pro/recommandations` | professional | SSR | P0 |
| 20 | Respond to signal | `/pro/signal` | professional | SSR + Client | P0 |
| 21 | Buy credit | `/pro/credit` | professional | Client | P0 |
| 22 | Analytics | `/pro/analytique` | professional | SSR | P1 |
| 23 | Admin dashboard | `/admin` | admin | SSR | P0 |
| 24 | Verification queue | `/admin/queue` | admin | SSR + RT | P0 |
| 25 | Review screen | `/admin/queue/[id]` | admin | SSR | P0 |
| 26 | Audit log | `/admin/journal` | admin | SSR | P1 |
| 27 | Legal notice | `/mentions-legales` | No | SSG | P1 |
| 28 | Privacy policy | `/confidentialite` | No | SSG | P1 |
| 29 | Terms of use | `/cgu` | No | SSG | P1 |

**Priority:** P0 = MVP required / P1 = Launch required / P2 = Post-launch

---

## Notes for Claude Code

**Rendering conventions:**
- SSG = `generateStaticParams` or no dynamic data — build-time rendered, served from CDN
- SSR = `async` Server Component fetching Supabase at request time — no `use client`
- Client = `'use client'` — interactive forms, payment flows, real-time
- RT = Supabase Realtime subscription (credit balance, queue updates)

**Auth middleware (middleware.ts):**
- `/dashboard*` → redirect to `/connexion` if not authenticated or role ≠ `user`
- `/pro/*` → redirect if role ≠ `professional`
- `/admin/*` → redirect if role ≠ `admin`
- Auth state from Supabase session cookie

**Profile view tracking:**
- Call `track_profile_view()` SQL function on every visit to `/pro/[slug]`
- Only if `is_visible = TRUE`
- Pass hashed IP, country (from request headers), source, search query
- This is a server-side call (API route or Server Component) — never client-side

**Status badge component:**
- Reused across: search cards, public profile, admin queue, pro dashboard
- Props: `status: 'gold' | 'silver' | 'white' | 'red' | 'black'`, `rec_count: number`, `avg_rating: number | null`
- Gold: 🟡 "Liste Or · X projets vérifiés · ★ 4.8"
- Silver: ⚪ "Liste Argent · X projets vérifiés · ★ 4.2"
- White: 🤍 "Liste Blanche · Aucun historique Kelen"
- Red: 🔴 red alert banner, "Liste Rouge · X signal(s) documenté(s)"
- Black: ⚫ dark alert banner, "Liste Noire · X signaux documentés" (only visible on direct profile URL, never in search)
