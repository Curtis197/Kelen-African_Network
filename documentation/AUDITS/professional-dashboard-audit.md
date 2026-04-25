# Professional Dashboard Audit

> Created: 2026-04-08
> Scope: Complete audit of every page, section, and interaction in the professional-facing dashboard
> Method: Route-by-route analysis of pages, components, server actions, and data flow

---

## Dashboard Navigation Map

The professional dashboard is structured around **8 navigation items** defined in `ProSidebar.tsx`:

```
/pro/dashboard          → Tableau de bord
/pro/projets            → Mes projets
/pro/profil             → Mon profil
/pro/realisations       → Mes réalisations
/pro/recommandations    → Recommandations
/pro/signal             → Signaux
/pro/abonnement         → Abonnement & Visibilité
/pro/analytique         → Analytique
```

Plus one **undocumented route** in the sidebar but present in the codebase:

```
/pro/documents          → Coffre-fort Numérique
```

---

## Route-by-Route Audit

---

### 1. `/pro/dashboard` — Tableau de bord

**File:** `app/(professional)/pro/dashboard/page.tsx`
**Type:** Server Component

#### What the professional sees

| Section | Content | Data Source |
|---|---|---|
| Header | Business name + StatusBadge | Hardcoded DEMO_PRO |
| Stats grid | Recommendations (7), Avg rating (4.8/5), Monthly views (342), Subscription (Premium) | Hardcoded DEMO_PRO |
| Pending actions | 1 recommendation to link, 1 signal requiring response | Hardcoded DEMO_PENDING |

#### How it's managed

**❌ Entirely hardcoded.** No live data is fetched. The page uses static demo objects:

```typescript
const DEMO_PRO = {
  business_name: "Kouadio Construction",
  status: "gold",
  recommendation_count: 7,
  signal_count: 0,
  avg_rating: 4.8,
  review_count: 12,
  monthly_views: 342,
  subscription_status: "Premium",
};
```

#### What's missing

- [ ] Real data fetch from `professionals` table
- [ ] Live recommendation count from `recommendations` table
- [ ] Live signal count from `signals` table
- [ ] Real monthly views from `profile_views` table
- [ ] Real subscription status from `subscriptions` table
- [ ] Real pending actions from verification queue
- [ ] Quick actions to create log, add project, share profile
- [ ] Recent activity feed (new recommendations, log approvals, etc.)

#### UX issues

- `bg-white` hardcoded — dark mode failure (flagged in FRONTEND_AUDIT.md)
- No loading state — instant render of demo data gives false impression of speed
- "Modifier mon profil" button goes to `/pro/profil` — correct but isolated

**Verdict:** ❌ Placeholder only. Zero functional data wiring.

---

### 2. `/pro/projets` — Mes projets

**Files:**
- Page: `app/(professional)/pro/projets/page.tsx`
- Component: `components/pro/ProProjectsPage.tsx`
- Server actions: `lib/actions/pro-projects.ts`
- Types: `lib/types/pro-projects.ts`

#### What the professional sees

| Section | Content | Status |
|---|---|---|
| Header | Title + "Nouveau projet" button | ✅ Functional |
| Filters | All / En cours / Terminés / En pause | ✅ Functional |
| Project list | Cards with status, category, location, dates, budget, client | ✅ Functional |
| Empty state | "Aucun projet" + CTA to create | ✅ Functional |
| Loading skeleton | 3 placeholder cards | ✅ Functional |

#### How it's managed

**✅ Fully functional.** The professional can:

1. **View** all their projects via `getProProjects()` server action
2. **Filter** by status (all, in_progress, completed, paused)
3. **Create** new projects → `/pro/projets/nouveau` → `ProProjectForm`
4. **View details** → `/pro/projets/[id]` → `ProProjectDetail`
5. **Toggle portfolio visibility** — `is_public` flag with Eye/EyeOff button
6. **Change status** — Mark as completed, pause
7. **Delete** projects (with confirmation via `alert()`)
8. **Access journal** — Link to `/pro/projets/[id]/journal`

#### Data flow

```
ProProjectsPage (client)
  └── getProProjects(status?) [server action]
        └── supabase.from("pro_projects")
              .eq("professional_id", proId)
              .order("created_at", { ascending: false })

createProProject(formData) [server action]
  └── supabase.from("pro_projects").insert(...)
        └── revalidatePath("/pro/projets")

deleteProProject(id) [server action]
  └── supabase.from("pro_projects").delete()
        └── revalidatePath("/pro/projets")
```

#### What's missing

- [ ] Journal summary stats on project cards (report count, total spending)
- [ ] Quick "Ajouter un rapport" button directly from project card
- [ ] Photo count per project
- [ ] Export project data (PDF/Excel)
- [ ] Bulk actions (select multiple, change status)
- [ ] Search/filter by client name or location
- [ ] Pagination for large project lists (currently renders all at once)

#### UX issues

- `confirm()` for delete instead of toast confirmation
- No error state — only loading and empty states implemented
- `ProProjectDetail` has "Quick Stats" section showing placeholder "—" values — not wired to actual log data

**Verdict:** ✅ Functional CRUD. Missing analytics integration and journal stats.

---

### 3. `/pro/projets/nouveau` — Nouveau projet

**File:** `app/(professional)/pro/projets/nouveau/page.tsx`
**Component:** `components/pro/ProProjectForm.tsx`

#### What the professional sees

| Section | Fields | Status |
|---|---|---|
| Informations du projet | Title*, Description, Category, Location | ✅ Functional |
| Informations client | Client name, Email (optional) | ✅ Functional |
| Planning & Budget | Start date, End date, Budget, Currency | ✅ Functional |
| Visibilité | Checkbox: "Afficher sur mon portfolio public" | ✅ Functional |

#### How it's managed

**✅ Fully functional.** Single-page form with:
- Zod validation via server action
- 9 category options (construction, rénovation, plomberie, etc.)
- XOF/EUR/USD currency selection
- `is_public` toggle for portfolio visibility
- Redirects to project detail on success

#### What's missing

- [ ] Photo upload section (project cover + gallery)
- [ ] Project steps creation (link to step management)
- [ ] Client phone field (exists in type but not in form)
- [ ] End date auto-calculation from start date + duration
- [ ] Budget currency formatting (XOF should show no decimals)

**Verdict:** ✅ Functional but minimal. Photo support missing.

---

### 4. `/pro/projets/[id]` — Projet détail

**Files:**
- Page: `app/(professional)/pro/projets/[id]/page.tsx`
- Component: `components/pro/ProProjectDetail.tsx`

#### What the professional sees

| Section | Content | Status |
|---|---|---|
| Header | Title, status badge, portfolio badge | ✅ Functional |
| Description | Full project description | ✅ Functional |
| Details grid | Location, dates, budget, client info | ✅ Functional |
| Résumé du journal | 4 stat placeholders (Reports, Total spending, Photos, Days worked) | ❌ Hardcoded "—" |
| Action buttons | "Journal" + "Modifier" | ✅ Functional (Journal links to `/pro/projets/[id]/journal`) |

#### How it's managed

**⚠️ Partially functional.** The project data is real (server-fetched via `getProProject`), but the journal summary stats are hardcoded placeholders:

```typescript
{ label: "Rapports", value: "—" },
{ label: "Dépenses totales", value: "—" },
{ label: "Photos", value: "—" },
{ label: "Jours travaillés", value: "—" },
```

#### What's missing

- [ ] Journal stats aggregation (count logs, sum money_spent, count media, count unique log dates)
- [ ] Quick link to create new log
- [ ] Timeline visualization (project phases)
- [ ] Assigned professionals list
- [ ] Budget consumption visualization
- [ ] Recent log activity feed

**Verdict:** ⚠️ Data display works, but journal integration is hollow.

---

### 5. `/pro/projets/[id]/journal` — Journal du projet (Pro)

**File:** `app/(professional)/pro/projets/[id]/journal/page.tsx`
**Component:** `components/pro/ProProjectJournal.tsx`

#### What the professional sees

| Section | Content | Status |
|---|---|---|
| Header | "Journal" + project title + "Nouveau rapport" button | ✅ Functional |
| Loading state | 3 skeleton cards | ✅ Functional |
| Log timeline | Chronological list of reports grouped by month | ✅ Functional |
| Empty state | Via `LogEmptyState` component | ✅ Functional |

#### How it's managed

**✅ Fully functional.** The professional can:
1. **View** all logs for their project via direct Supabase query (no server action)
2. **Create** new log → `LogForm` with `proProjectId` prop
3. **Click** any log card → `/pro/projets/[id]/journal/[logId]` detail page
4. **See real-time updates** via Supabase Realtime subscription

#### Data flow

```
ProProjectJournal (client)
  └── supabase.from("project_logs")
        .eq("pro_project_id", project.id)
        .order("log_date", { ascending: false })
  └── getMediaUrl() for each photo (signed URLs)
  └── Supabase Realtime channel `pro-journal:${project.id}`
```

#### What's missing

- [ ] Filter logs by status (pending/approved/contested)
- [ ] Filter by step
- [ ] Spending totals summary at top
- [ ] Export logs button (PDF)
- [ ] Share log button at timeline level
- [ ] Photo count per log in timeline cards

**Verdict:** ✅ Functional. Uses client-side Supabase directly (no server action abstraction).

---

### 6. `/pro/projets/[id]/journal/[logId]` — Détail du rapport (Pro)

**File:** `app/(professional)/pro/projets/[id]/journal/[logId]/page.tsx`

#### What the professional sees

| Section | Content | Status |
|---|---|---|
| Header | Back button + "Partager" button | ✅ Functional |
| Meta | Date, time, status badge, author label | ✅ Functional |
| Content | Title, description, author attribution | ✅ Functional |
| GPS | GPSDisplay component | ✅ Functional |
| Money | MoneyDisplay (conditional) | ✅ Functional |
| Weather | WeatherIcon (conditional) | ✅ Functional |
| Photos | PhotoGrid with signed URLs | ✅ Functional |
| Issues | Highlighted amber block (conditional) | ✅ Functional |
| Next steps | Highlighted block (conditional) | ✅ Functional |
| Comments | LogCommentThread | ✅ Functional |
| Actions | LogActions (approve/contest/resolve) | ✅ Functional |
| Share modal | ShareLogModal | ✅ Functional |

#### How it's managed

**✅ Fully functional.** All data loaded via:
- `getLogById(logId, proProjectId)` — server action
- `getMediaUrl()` — signed URLs for photos
- `getLogComments(logId)` — server action

Professional can:
- **Approve/Contest/Resolve** logs (via LogActions)
- **Share** logs via email/WhatsApp/SMS (via ShareLogModal)
- **View** comment history
- **See** GPS location, money spent, weather

**Verdict:** ✅ Most complete page in the entire dashboard. Fully wired.

---

### 7. `/pro/profil` — Mon profil

**File:** `app/(professional)/pro/profil/page.tsx`
**Component:** `components/forms/ProProfileForm.tsx`

#### What the professional sees

| Section | Content | Status |
|---|---|---|
| Header | "Mon profil" + description | ✅ Static |
| Form | ProProfileForm component | ✅ Functional |

#### How it's managed

**⚠️ Partially functional.** The `ProProfileForm` component exists and allows editing of:
- Business name
- Description/bio
- Location
- Specialty/category
- Contact info (phone, WhatsApp, email)
- Zone of operation
- Values and qualities (for AI copywriting questionnaire)
- Profile picture

But the page itself:
- Uses `bg-white` hardcoded (dark mode failure)
- Has no loading state
- Has no success feedback after save
- Has no preview of the public profile

#### What's missing

- [ ] AI copywriting generation button/trigger
- [ ] Logo upload for automatic branding
- [ ] Profile preview link (open public profile in new tab)
- [ ] Cover photo upload
- [ ] Slug/URL customization
- [ ] Save confirmation toast (form may handle it internally)

**Verdict:** ⚠️ Form works, but page wrapper is barebones. AI copywriting not wired.

---

### 8. `/pro/realisations` — Mes réalisations

**File:** `app/(professional)/pro/realisations/page.tsx`

#### What the professional sees

| Section | Content | Status |
|---|---|---|
| Header | Title + "Nouvelle réalisation" button | ✅ Functional |
| Count | "X projet(s) au total" | ✅ Functional |
| View toggle | Grid / List buttons (cosmetic) | ⚠️ Grid only, list button non-functional |
| Document cards | ProjectDocumentCard for each document | ✅ Functional |
| Empty state | "C'est encore vide ici!" + CTA | ✅ Functional |

#### How it's managed

**⚠️ Partially functional.** The page:
- Fetches `project_documents` from Supabase for the professional
- Renders cards via `ProjectDocumentCard` (repurposed from documents)
- Has "Nouvelle réalisation" link → `/pro/realisations/add`

But:
- View toggle (Grid/List) — List button doesn't switch the view mode
- Uses `ProjectDocumentCard` which is designed for documents, not realizations
- The term "réalisations" is confusing — it actually shows `project_documents`, not portfolio realizations

#### What's missing

- [ ] Clear distinction between "réalisations" (portfolio projects) and "documents" (contracts, plans)
- [ ] Proper realization card with photo gallery preview
- [ ] Edit/delete actions on cards
- [ ] Filtering by category or status
- [ ] Realization add form (`/pro/realisations/add` — needs verification)

**Verdict:** ⚠️ Exists but conceptually confused — mixes documents with portfolio realizations.

---

### 9. `/pro/realisations/add` — Nouvelle réalisation

**File:** `app/(professional)/pro/realisations/add/page.tsx`

#### What the professional sees

Not directly read, but inferred from form component pattern. Likely contains `RealizationForm` component.

**Verdict:** ⚠️ Not audited directly (file exists but content not read). Form component exists at `components/forms/RealizationForm.tsx`.

---

### 10. `/pro/recommandations` — Recommandations

**File:** `app/(professional)/pro/recommandations/page.tsx`

#### What the professional sees

| Section | Content | Status |
|---|---|---|
| Header | "Recommandations reçues" + description | ✅ Static |
| Loading state | 3 skeleton placeholders | ✅ Functional |
| Recommendation list | Project type, location, client name, completion date, status badge, link button | ✅ Functional |
| Empty state | "Aucune recommandation" + "Copier mon lien Pro" button | ⚠️ Button non-functional |

#### How it's managed

**⚠️ Partially functional.** The professional can:
1. **View** all recommendations linked to their profile
2. **See status** — pending, verified, rejected (with color-coded badges)
3. **Link** recommendations to their profile (sets `linked: true`, `linked_at`)

But:
- "Copier mon lien Pro" button has **no onClick handler** — does nothing
- Uses `bg-white`, `bg-stone-50`, `text-stone-900` hardcoded colors (dark mode failure)
- Uses Material Symbols inline (`<span className="material-symbols-outlined">`) — inconsistent with Lucide icons elsewhere
- `text-[10px]` font size below readability minimum

#### What's missing

- [ ] Functional "Copier mon lien Pro" button (copy profile URL to clipboard)
- [ ] Filter by status (pending/verified/rejected)
- [ ] Recommendation detail view (evidence, contract reference)
- [ ] Ability to dispute or flag fraudulent recommendations
- [ ] Share recommendation feature

**Verdict:** ⚠️ Core list + linking works. "Copier mon lien" is dead button.

---

### 11. `/pro/signal` — Signaux

**File:** `app/(professional)/pro/signal/page.tsx`

#### What the professional sees

| Section | Content | Status |
|---|---|---|
| Header | "Signalements & Litiges" + description | ✅ Static |
| Info banner | "Droit de réponse (15 jours)" warning | ✅ Static |
| Loading state | 2 skeleton placeholders | ✅ Functional |
| Signal list | Breach type, severity badge, description, countdown, response form | ✅ Functional |
| Empty state | "Score de confiance impeccable" + shield icon | ✅ Functional |

#### How it's managed

**⚠️ Partially functional.** The professional can:
1. **View** all signals against their profile
2. **See** breach type, severity (minor/major/critical), description
3. **See** countdown — days remaining to respond (15-day deadline)
4. **Submit** a response (sets `pro_response`, `pro_responded_at`, status → "disputed")

But:
- Uses `bg-white`, `text-stone-900`, `bg-stone-50` hardcoded (dark mode failure)
- Uses Material Symbols inline — inconsistent with Lucide
- Response directly sets status to "disputed" — no verification/approval workflow
- No evidence file viewing (description only)
- 15-day deadline is client-side calculation — should be server-enforced

#### What's missing

- [ ] Evidence file viewing (photos, contracts, documents attached to signal)
- [ ] Ability to upload counter-evidence
- [ ] Admin decision display (verified/rejected outcome)
- [ ] Email notification when signal is submitted
- [ ] Deadline enforcement on server side (not just UI countdown)

**Verdict:** ⚠️ Response workflow works but is simplistic. Evidence viewing missing.

---

### 12. `/pro/abonnement` — Abonnement & Visibilité

**File:** `app/(professional)/pro/abonnement/page.tsx`
**Type:** Server Component

#### What the professional sees

| Section | Content | Status |
|---|---|---|
| Header | "Abonnement & Visibilité" + "Gérer mon moyen de paiement" button | ⚠️ Button non-functional |
| Subscription card | Plan name, status, renewal date, progress bar | ⚠️ Mock data |
| Pricing comparison | Free vs Premium plan feature matrix | ✅ Static display |
| Billing history | "Aucune facture disponible" | ✅ Static placeholder |
| Visibility tip | "Astuce Visibilité" — cover photo advice | ✅ Static |

#### How it's managed

**⚠️ Partially functional.** The page:
- Fetches professional from Supabase
- Fetches subscription from `subscriptions` table
- Falls back to mock data if no subscription exists:

```typescript
const planName = subscription?.plan === 'pro_africa' ? 'Premium Kelen' :
                 subscription?.plan === 'pro_europe' ? 'Premium Europe' :
                 subscription?.plan === 'pro_intl' ? 'Premium International' : 'Gratuit';
```

But:
- "Gérer mon moyen de paiement" button has **no onClick or href** — does nothing
- "Gérer mon abonnement" button — **no onClick** — does nothing
- "S'abonner maintenant" button — **no onClick** — does nothing
- No Stripe/Wave/Orange Money integration
- No payment method management
- No actual subscription upgrade flow
- Billing history is hardcoded empty
- Uses `bg-white`, `bg-stone-50`, `text-stone-900` (dark mode failure)
- Has its own sticky header (duplicated from layout) — redundant

#### What's missing

- [ ] Payment integration (Stripe for EUR, Wave/Orange Money for XOF)
- [ ] Subscription upgrade/downgrade flow
- [ ] Payment method management UI
- [ ] Actual billing history with invoice downloads
- [ ] Subscription cancellation flow
- [ ] Trial period management
- [ ] Usage metrics (photos used, projects used vs. limits)

**Verdict:** ⚠️ Display-only. All action buttons are dead. No payment processing.

---

### 13. `/pro/analytique` — Analytique

**File:** `app/(professional)/pro/analytique/page.tsx`

#### What the professional sees

| Section | Content | Status |
|---|---|---|
| Header | "Performance & visibilité" + description | ✅ Static |
| Stats cards | Total views, Monthly views, Search appearances, Interactions, Contact clicks | ✅ Functional (real data) |
| Bar chart | Monthly views evolution (last 6 months) | ✅ Functional |
| Traffic sources | Acquisition channels with progress bars | ✅ Functional |

#### How it's managed

**✅ Functional with real data.** The page:
- Fetches `profile_views` from Supabase (total, monthly, search-filtered)
- Fetches `profile_interactions` (total interactions, contact clicks)
- Groups views by month for last 6 months → bar chart
- Calculates traffic source percentages (search vs. direct)
- Renders interactive bar chart with hover tooltips
- Renders horizontal progress bars for traffic sources

This is **one of the most functional pages** in the dashboard — it actually queries real data and visualizes it.

#### What's missing

- [ ] Date range selector (last 7 days, 30 days, 90 days, custom)
- [ ] Profile interaction breakdown (which elements clicked — phone, email, WhatsApp)
- [ ] Geographic breakdown of viewers (which countries/cities)
- [ ] Referral source breakdown (Google, social, direct)
- [ ] Conversion metrics (views → contact clicks → actual engagements)
- [ ] Export analytics report
- [ ] Comparison with previous period
- [ ] Chart type toggle (bar → line)

#### UX issues

- Uses `bg-white`, `text-stone-900` hardcoded (dark mode failure)
- Material Symbols used for stat icons — inconsistent
- `text-[10px]` font size for labels — below readability minimum
- No loading state — stats show "0" while loading, no spinner

**Verdict:** ✅ Actually functional. Real data, real visualization. Needs date range controls.

---

### 14. `/pro/documents` — Coffre-fort Numérique

**File:** `app/(professional)/pro/documents/page.tsx`

#### What the professional sees

| Section | Content | Status |
|---|---|---|
| Header | "Coffre-fort Numérique" + description | ✅ Static |
| Folders | 3 static folder cards (Contrats Fonciers, Plans Architecturaux, Preuves de Paiement) | ❌ Hardcoded |
| Document grid/list | Files with status badges, view toggle | ⚠️ Grid functional, list cosmetic |
| Upload zone | Drag & drop area with file input | ⚠️ Functional (uploads to Supabase Storage) |
| Detail sidebar | File preview, metadata, tags, actions | ⚠️ Functional for selected doc |

#### How it's managed

**⚠️ Partially functional.** The professional can:
1. **View** documents from `project_documents` table
2. **Upload** files via `uploadFile()` to Supabase Storage
3. **Toggle** between grid and list views
4. **Select** a document → detail sidebar slides in
5. **See** document status (pending_review, published, rejected)
6. **Open** document in new tab via `contract_url`

But:
- Folders section is **entirely hardcoded** (3 static folder cards with no data)
- List view has table headers but no meaningful data differentiation from grid
- Download button in list view has no href
- "Partager" button in sidebar has no onClick
- Tags section has static hardcoded tags (#Propriété, #Audit2024)
- "BitLocker SSL" security label is misleading (Supabase Storage, not BitLocker)
- File weight is hardcoded "1.2 MB" in sidebar
- View toggle state (`viewMode`) doesn't properly switch — both modes show similar data

#### What's missing

- [ ] Functional folder system (create, organize, move documents)
- [ ] Document download
- [ ] Document sharing with external parties
- [ ] Document verification status tracking
- [ ] Bulk upload support
- [ ] Document search/filter
- [ ] Proper list view with sortable columns
- [ ] Document edit metadata (rename, re-categorize)

**Verdict:** ⚠️ Upload + display works. Folders, sharing, and downloads are cosmetic.

---

## Server Action Inventory

### Pro Projects (`lib/actions/pro-projects.ts`)

| Action | Purpose | Status |
|---|---|---|
| `getProfessionalId()` | Helper — get current user's professional ID | ✅ |
| `getProProjects(status?)` | Fetch all projects, optional status filter | ✅ |
| `getProProject(id)` | Fetch single project by ID | ✅ |
| `createProProject(data)` | Create new project | ✅ |
| `updateProProject(id, data)` | Update project fields | ✅ |
| `updateProProjectStatus(id, status)` | Change status (auto-sets actual_end_date for completed) | ✅ |
| `updateProProjectPhotos(id, urls)` | Update photo gallery | ✅ |
| `deleteProProject(id)` | Delete project | ✅ |
| `getPublicProProjects(slug)` | Fetch public projects for profile page | ✅ |

### Daily Logs (`lib/actions/daily-logs.ts`)

| Action | Purpose | Status |
|---|---|---|
| `createLog(data)` | Create log entry with role detection | ✅ |
| `updateLog(logId, data)` | Update existing log | ✅ |
| `deleteLog(logId)` | Delete log | ✅ |
| `getProjectLogs(projectId)` | Fetch all logs for project | ✅ |
| `getLogById(logId, projectId?)` | Fetch single log with media + comments | ✅ |
| `getLogsByStep(stepId)` | Fetch logs filtered by step | ✅ |

### Log Comments (`lib/actions/log-comments.ts`)

| Action | Purpose | Status |
|---|---|---|
| `approveLog(logId, comment)` | Approve log + insert comment + send email | ✅ |
| `contestLog(logId, comment, evidenceUrls)` | Contest log + insert comment | ✅ |
| `resolveLog(logId, comment)` | Resolve contested log | ✅ |
| `getLogComments(logId)` | Fetch comments with author info | ✅ |

### Log Media (`lib/actions/log-media.ts`)

| Action | Purpose | Status |
|---|---|---|
| `uploadLogMedia(logId, projectId, files)` | Upload photos to Supabase Storage | ✅ |
| `deleteLogMedia(mediaId, projectId)` | Delete photo | ✅ |
| `getMediaUrl(storagePath)` | Generate signed URL (1h expiry) | ✅ |
| `getLogMedia(logId)` | Fetch all media for log | ✅ |

### Log Shares (`lib/actions/log-shares.ts`)

| Action | Purpose | Status |
|---|---|---|
| `shareLog(logId, options)` | Create share token + record share | ✅ |
| `getSharedLogByToken(token)` | Fetch shared log for public view | ✅ |
| `recordShareView(token, ip, ua)` | Track view of shared log | ✅ |
| `getShareStats(logId)` | Get view count + first viewed date | ✅ |
| `getShareUrl(logId)` | Get existing share URL if any | ✅ |

---

## Data Flow Architecture

```
Professional User
├── Auth (Supabase Auth)
│   └── Session → getUser() → professional_id
│
├── Dashboard (hardcoded — NOT wired)
│
├── Projects CRUD
│   ├── getProProjects() → pro_projects WHERE professional_id
│   ├── createProProject() → INSERT pro_projects
│   ├── updateProProject() → UPDATE pro_projects
│   └── deleteProProject() → DELETE pro_projects
│
├── Project Journal
│   ├── project_logs WHERE pro_project_id (client-side Supabase)
│   ├── project_log_media → signed URLs
│   ├── Supabase Realtime → auto-refresh on changes
│   ├── approveLog/contestLog/resolveLog → project_log_comments
│   └── shareLog → project_log_shares → public /journal/[token]
│
├── Profile
│   ├── ProProfileForm → UPDATE professionals
│   └── (AI copywriting — NOT wired)
│
├── Realisations
│   └── project_documents WHERE professional_id
│
├── Recommendations
│   ├── recommendations WHERE professional_id
│   └── UPDATE linked = true
│
├── Signals
│   ├── signals WHERE professional_id
│   └── UPDATE pro_response, status = 'disputed'
│
├── Subscription
│   ├── subscriptions WHERE professional_id
│   └── (Payment flow — NOT wired)
│
├── Analytics
│   ├── profile_views WHERE professional_id
│   └── profile_interactions WHERE professional_id
│
└── Documents
    ├── project_documents WHERE professional_id
    └── uploadFile() → Supabase Storage
```

---

## Design Consistency Issues

### Color System

| Issue | Affected Pages | Severity |
|---|---|---|
| `bg-white` instead of `bg-surface` | Dashboard, Profil, Recommandations, Signaux, Abonnement, Analytique | 🔴 HIGH |
| `text-stone-900`, `text-stone-500` instead of `text-on-surface` | Recommandations, Signaux, Abonnement, Analytique | 🔴 HIGH |
| `bg-stone-50`, `bg-stone-100` instead of `bg-surface-container` | Recommandations, Signaux, Abonnement | 🔴 HIGH |
| Dual icon systems (Lucide + Material Symbols) | Recommandations, Signaux, Abonnement, Documents | 🟡 MEDIUM |
| `text-[10px]`, `text-[9px]` below readability minimum | Recommandations, Signaux, Documents | 🟡 MEDIUM |

### Component Consistency

| Pattern | Inconsistency |
|---|---|
| Card styling | Dashboard uses `border border-border bg-white`, Pro projects uses `bg-surface-container-low rounded-2xl` |
| Empty states | Some use `bg-stone-50 rounded-3xl border-2 border-dashed`, others use `bg-surface-container-low rounded-2xl` |
| Status badges | 4+ different inline badge styles across pages |
| Loading states | Some pages have skeletons, some don't (Dashboard, Abonnement) |
| Button styling | Each page uses different button class combinations |

---

## Accessibility Audit

| Issue | Affected Pages | Count |
|---|---|---|
| Missing `aria-label` on icon buttons | Projets (togglePublic, delete), Documents (grid/list toggle, download) | 5+ |
| `confirm()` instead of accessible dialog | Projets (delete) | 1 |
| Non-semantic clickable elements | Recommandations (link button is OK), Abonnement (buttons have no handlers) | 2 |
| Missing form labels | Profil (ProProfileForm inputs) | 8+ |
| Color-only status indication | Recommandations (color badge without text alternative) | 1 |

---

## Performance Observations

| Concern | Detail |
|---|---|
| **N+1 queries** | `ProProjectJournal` calls `getMediaUrl()` in a loop for each photo — each call is a separate Supabase Storage request |
| **Client-side Supabase** | Journal pages use client-side `createClient()` instead of server actions — loses SSR benefits |
| **No pagination** | `getProProjects()` returns ALL projects — no cursor or offset pagination |
| **No caching** | Analytics page re-fetches all data on mount — no React Query or SWR |
| **Signed URL generation** | Each photo requires a separate signed URL — no batch endpoint |

---

## Summary: Feature Management Matrix

| Feature | Can Professional View? | Can Professional Create? | Can Professional Edit? | Can Professional Delete? | Is Data Real? |
|---|---|---|---|---|---|
| Projects | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| Project Journal | ✅ Yes | ✅ Yes | ❌ No | ❌ No | ✅ Yes |
| Log Comments | ✅ Yes | ✅ Yes (approve/contest) | ❌ No | ❌ No | ✅ Yes |
| Log Sharing | ✅ Yes | ✅ Yes | ❌ N/A | ❌ N/A | ✅ Yes |
| Profile | ✅ Yes | N/A | ✅ Yes | ❌ No | ✅ Yes |
| Realisations | ✅ Yes | ✅ Yes (via add page) | ⚠️ Unknown | ⚠️ Unknown | ✅ Yes |
| Recommendations | ✅ Yes | ❌ No (received from clients) | ✅ Link to profile | ❌ No | ✅ Yes |
| Signals | ✅ Yes | ❌ No (received from clients) | ✅ Respond | ❌ No | ✅ Yes |
| Subscription | ✅ Yes | ❌ No upgrade flow | ❌ No | ❌ No | ⚠️ Mock fallback |
| Analytics | ✅ Yes | ❌ No (passive) | ❌ No | ❌ No | ✅ Yes |
| Documents | ✅ Yes | ✅ Yes (upload) | ❌ No | ❌ No | ✅ Yes |
| Dashboard | ✅ Yes (demo) | ❌ No | ❌ No | ❌ No | ❌ Hardcoded |
| AI Copywriting | ❌ No UI | ❌ No | ❌ No | ❌ No | ❌ Not implemented |
| Auto Branding | ❌ No UI | ❌ No | ❌ No | ❌ No | ❌ Not implemented |
| Payment | ❌ No UI | ❌ No | ❌ No | ❌ No | ❌ Not implemented |

---

## Priority Recommendations

### 🔴 Critical (broken user flows)
1. **Wire the dashboard** — Replace hardcoded demo data with real queries
2. **Implement payment flow** — Abonnement page has zero functional buttons
3. **Fix dark mode** — 6+ pages use hardcoded `bg-white` / `text-stone-*`
4. **Implement AI copywriting** — Questionnaire exists but Claude API not integrated
5. **Fix "Copier mon lien Pro"** — Dead button on Recommendations page

### 🟡 High Priority (missing functionality)
6. **Wire journal stats** — Project detail shows "—" for all 4 stat fields
7. **Implement subscription enforcement** — No tier gating anywhere
8. **Add photo upload to project creation** — Projects created without visuals
9. **Fix Documents folder system** — 3 hardcoded folder cards with no data
10. **Add loading state to Analytics** — Stats show "0" while loading

### 🟢 Medium Priority (polish)
11. **Unify icon system** — Replace all Material Symbols with Lucide (or vice versa)
12. **Add pagination to Projects** — All projects load at once
13. **Fix view toggle on Realisations** — List button doesn't switch mode
14. **Add date range selector to Analytics** — Only shows last 6 months
15. **Implement document sharing** — "Partager" button in Documents sidebar is dead

### 🔵 Low Priority (cleanup)
16. **Remove duplicate sticky header** on Abonnement page
17. **Standardize empty states** — Different patterns across pages
18. **Add toast confirmations** — Replace `confirm()` for project deletion
19. **Implement batch signed URLs** — Reduce N+1 storage requests for photos
20. **Add error boundaries** — No error handling on any dashboard page

---

## Files Audited

### Pages
- `app/(professional)/pro/dashboard/page.tsx`
- `app/(professional)/pro/projets/page.tsx`
- `app/(professional)/pro/projets/nouveau/page.tsx`
- `app/(professional)/pro/projets/[id]/page.tsx`
- `app/(professional)/pro/projets/[id]/journal/page.tsx`
- `app/(professional)/pro/projets/[id]/journal/[logId]/page.tsx`
- `app/(professional)/pro/profil/page.tsx`
- `app/(professional)/pro/realisations/page.tsx`
- `app/(professional)/pro/recommandations/page.tsx`
- `app/(professional)/pro/signal/page.tsx`
- `app/(professional)/pro/abonnement/page.tsx`
- `app/(professional)/pro/analytique/page.tsx`
- `app/(professional)/pro/documents/page.tsx`

### Components
- `components/layout/ProSidebar.tsx`
- `components/pro/ProProjectsPage.tsx`
- `components/pro/ProProjectForm.tsx`
- `components/pro/ProProjectDetail.tsx`
- `components/pro/ProProjectJournal.tsx`
- `components/forms/ProProfileForm.tsx`

### Server Actions
- `lib/actions/pro-projects.ts`
- `lib/actions/daily-logs.ts`
- `lib/actions/log-comments.ts`
- `lib/actions/log-media.ts`
- `lib/actions/log-shares.ts`

### Types
- `lib/types/pro-projects.ts`
- `lib/types/daily-logs.ts`
