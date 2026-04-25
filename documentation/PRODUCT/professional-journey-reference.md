# Professional Journey — Feature Reference

> Created: 2026-04-08 — Updated: 2026-04-25 (Version 2.0)
> Purpose: Complete reference for all features available to professionals on the Kelen platform
> Audience: Product, Engineering, and Stakeholder teams

---

## Overview

The **Professional Journey** encompasses every touchpoint, tool, and workflow a professional experiences on Kelen — from onboarding to growth. This document catalogs each feature, explains its purpose, and details how professionals interact with it in practice.

Kelen is a **professional digitalization and visibility platform**. Professionals pay for visibility. Reputation is earned through verified recommendations. The product is the professional's digital presence: website, PDF portfolio, Google My Business listing.

---

## 1. Onboarding & Account Setup

### 1.1 Registration & Authentication
**What it is:** Secure account creation and session management for professionals.

**How it applies:**
- Professional signs up with email, password, and role selection ("professional")
- Supabase Auth handles session management, password reset, and email verification
- Route protection ensures only authenticated professionals access sensitive areas (dashboards, profile management)
- Professionals can log in, log out, and reset passwords securely

**Key files:** `components/forms/RegisterForm.tsx`, `components/forms/LoginForm.tsx`, `components/forms/PasswordResetForm.tsx`

### 1.2 Role Differentiation
**What it is:** The platform distinguishes between "client" and "professional" roles at the auth level.

**How it applies:**
- Upon registration, the user is flagged as a professional
- This role determines which dashboard they see (ProSidebar vs. ClientBottomNav)
- Role-based access control protects client-only areas and admin functions
- Future refinement: RBAC for professional assistants (planned)

---

## 2. Profile Management

### 2.1 Professional Profile — A Commercial Landing Page
**What it is:** Every professional gets a public-facing profile page at `kelen.com/pro/[slug]`. This is not a CV — it's a conversion-optimized landing page.

**Profile structure (in order):**
1. **Hero** — Full-width photo of best work · Name · AI-generated one-liner tagline
2. **Portfolio** — Immersive project gallery
3. **About** — Short AI-generated presentation text · Values badges
4. **Contact** — Profile photo · Specialty · Zone · Phone · WhatsApp · Email · Kelen status badge

**How it applies:**
- The professional's work appears first (hero photo), not their face
- The face appears in the contact section — building personal connection after credibility is established
- Profile is accessible via direct URL for all professionals
- Paid professionals are indexed by Google and included in the XML sitemap

**Key files:** `components/shared/ProfileHero.tsx`

### 2.2 Profile Editing (ProProfileForm)
**What it is:** Professionals can update their editable profile information through a dedicated form.

**How it applies:**
- Bio, location, specialty, contact information (phone, WhatsApp, email)
- Portfolio management: upload and delete portfolio items
- Zone of operation (geographic coverage)
- All changes are validated server-side and persisted to Supabase

**Key files:** `components/forms/ProProfileForm.tsx`

### 2.3 Portfolio Management
**What it is:** Professionals showcase their work through a curated portfolio of projects and photos.

**How it applies:**
- **Free tier:** Up to 3 projects, 15 photos total
- **Paid tier:** Unlimited projects, unlimited photos, video support
- Photos are stored in Supabase Storage buckets
- Portfolio items can be deleted by the professional
- Each project can include descriptions, categories, and references

**Key files:** `components/forms/RealizationForm.tsx`, `components/pro/RealizationCard.tsx`

### 2.4 AI Copywriting Generation
**What it is:** Automatically generated bio text (hero tagline + about section) from a structured questionnaire.

**How it applies:**
- Professional completes a questionnaire covering:
  - Personal values (max 3): Honesty, Rigor, Punctuality, Transparency, Excellence, Discretion, Commitment, Simplicity
  - Professional qualities (max 3): Punctuality, Quality of finish, Listening, Guidance, Responsiveness, Budget respect, Advice, Reliability
  - Client relationship style (single select)
  - Communication frequency (single select)
  - Project they're most proud of (optional free text)
  - Limits they refuse (optional multi-select + free text)
- Two outputs generated via Anthropic Claude API:
  - `bio_accroche` — 1 sentence for the hero section
  - `bio_presentation` — 3–5 sentences for the About section
- Triggered manually by the professional when ready — not automatic

**Technical stack:** Anthropic API (`claude-sonnet-4-20250514`)

---

## 3. Automatic Branding (Paid Only)

**What it is:** Paid professional profiles automatically adopt the professional's brand colors.

**How it applies:**
- Professional uploads their logo
- `color-thief` library extracts dominant color palette client-side
- Profile adopts brand colors: buttons, overlays, badges
- WCAG contrast verification ensures readability
- Three fields stored in database: `brand_primary`, `brand_secondary`, `brand_accent` (hex)
- Falls back to Kelen default colors silently if no logo uploaded

**Key files:** Color extraction logic (client-side)

---

## 4. Visibility & SEO

### 4.1 Rendering Modes
**What it is:** Free and paid profiles use different rendering strategies.

**How it applies:**
- **Free profiles:** SSG (Static Site Generation) — accessible via direct URL, not indexed
- **Paid profiles:** SSR (Server-Side Rendering) — dynamic, indexed by Google, included in sitemap
- Same route (`kelen.com/pro/[slug]`), conditional behavior based on subscription status

### 4.2 SEO Features (Paid Only)
**What it is:** Paid profiles receive full SEO optimization for organic discovery.

**How it applies:**
- Full dynamic metadata and Open Graph tags
- XML Sitemap inclusion
- Google Analytics (GA4) integration
- Advanced in-app analytics dashboard
- Indexed for geo + trade queries ("électricien Dakar rénovation", "villa construction Cocody")

### 4.3 Professional Directory Discovery
**What it is:** A searchable, filterable directory where clients can find professionals.

**How it applies:**
- Professionals appear in the directory based on category, location, and status
- FilterPanel allows clients to filter by mode, category, and other criteria
- Professionals are grouped by Functional Development Areas (e.g., Law, Architecture, Education)
- Ranking system within each domain prioritizes candidates
- Pagination with dynamic page generation

**Key files:** `components/landing/ProfessionalDirectory.tsx`, `components/shared/FilterPanel.tsx`, `components/shared/SearchBar.tsx`, `components/projects/DevelopmentAreaRow.tsx`

---

## 5. Project Assignment & Comparison

### 5.1 Add-to-Project Workflow
**What it is:** Professionals can be assigned to client projects directly from their profile pages or the search engine.

**How it applies:**
- Client views professional profile → clicks "Add to Project"
- Professional can be added as a candidate, shortlisted, or finalist
- Both platform-registered and external professionals can be added
- Multi-professional management: clients can add several pros for side-by-side comparison
- Seamless assignment workflow

**Key files:** `components/projects/AddToProjectDialog.tsx`, `components/projects/AddExternalProModal.tsx`

### 5.2 Project Step Association
**What it is:** Professionals can be linked to specific phases of a project.

**How it applies:**
- Project is broken into discrete steps (e.g., Foundation, Walls, Roof, Wiring)
- Client assigns specific professionals to specific steps (e.g., Mason → Walls, Electrician → Wiring)
- Professional receives notification of assignment
- Professional can view their assigned steps and contribute to them

**Key files:** `components/projects/AssignStepProDialog.tsx`, `components/projects/ProjectStepCard.tsx`

### 5.3 Comparison Engine
**What it is:** Clients can compare professionals side-by-side within a project.

**How it applies:**
- Professionals are grouped by Functional Development Area
- Row-based comparison layout
- Visual ranking system within each domain
- Status tracking: Candidate → Shortlisted → Finalist
- Comparison includes portfolio, status badge, and verified recommendations

**Key files:** `components/projects/DevelopmentAreaRow.tsx`

---

## 6. Project Management (Professional Side)

### 6.1 Pro Projects Dashboard
**What it is:** Professionals can view and manage projects they've been assigned to.

**How it applies:**
- Dedicated pro navigation (ProSidebar) with project management section
- List of all projects the professional is involved in
- Status overview: pending, in progress, completed, on hold, cancelled
- Quick access to project details and daily log creation

**Key files:** `components/pro/ProProjectsPage.tsx`, `components/layout/ProSidebar.tsx`

### 6.2 Pro Project Detail
**What it is:** Detailed view of a single project from the professional's perspective.

**How it applies:**
- Project overview: title, description, category, budget, location, duration
- Assigned steps for this professional
- Daily log creation and management
- Technical vault access (project documents)
- Budget analysis and timeline visualization

**Key files:** `components/pro/ProProjectDetail.tsx`

---

## 7. Daily Journal (Transparency Layer)

### 7.1 Log Creation
**What it is:** Professionals can create daily progress reports for any project they're assigned to.

**How it applies:**
- Professional navigates to project detail → clicks "Journal" tab
- Clicks "Ajouter un rapport" button
- Form includes:
  - Date picker (defaults to today)
  - Title input (short summary)
  - Rich text description (detailed work done)
  - Money spent (amount + currency: XOF/EUR/USD)
  - Issues encountered (optional)
  - Next steps planned (optional)
  - Weather conditions (optional: sunny/cloudy/rainy/stormy)
  - GPS auto-detect (browser geolocation API)
- Media upload zone:
  - Drag & drop or file picker (photos only in MVP)
  - Accepts: JPEG, PNG, WebP
  - Auto-extracts EXIF GPS + timestamp from images
  - Preview thumbnails in uniform grid
  - Mark one as primary/cover
- Unlimited logs per day (morning site photos, material delivery receipts, end-of-day summary)
- **Offline support:** Professionals can draft logs offline and sync when connectivity returns (IndexedDB)

**Key files:** `components/journal/LogForm.tsx`, `components/journal/PhotoUpload.tsx`, `components/journal/GPSInput.tsx`, `components/journal/WeatherIcon.tsx`, `components/journal/OfflineIndicator.tsx`

### 7.2 Log Timeline & Cards
**What it is:** Chronological view of all log entries for a project.

**How it applies:**
- Professional sees existing logs in reverse chronological order
- Each log card shows: date, author badge, title, short description, primary photo thumbnail, money spent indicator, status badge (pending/approved/contested/resolved), issues flag
- Vertical timeline with dots (like Git history graph)
- Click to expand full log view with media gallery

**Key files:** `components/journal/LogTimeline.tsx`, `components/journal/LogCard.tsx`, `components/journal/LogStatusBadge.tsx`, `components/journal/PhotoGrid.tsx`

### 7.3 GPS & Timestamp Enforcement
**What it is:** Every log requires GPS coordinates — evidence over claims.

**How it applies:**
- GPS auto-detect via browser Geolocation API
- If EXIF GPS available from photos: auto-populated
- If no EXIF GPS: professional must manually pin location on map before submitting
- Timestamp extracted from photo EXIF data or server timestamp
- GPS displayed on log (optional map visualization)
- Flagged as "GPS not verified" if manual entry

**Key files:** `components/journal/GPSInput.tsx`, `components/journal/GPSDisplay.tsx`

### 7.4 Client Review Flow (Professional Receives Feedback)
**What it is:** Clients can approve or contest logs. Professionals receive and respond to feedback.

**How it applies:**
- Professional receives notification when client approves or contests a log
- If contested: professional can respond with comment, upload clarifying evidence, or mark as "resolved" with explanation
- Full audit trail preserved in `project_log_comments`
- Contest resolution is purely between client and professional — Kelen does not arbitrate
- Status transitions: pending → approved/contested → resolved

**Key files:** `components/journal/LogActions.tsx`, `components/journal/LogCommentThread.tsx`

### 7.5 Shareable Logs
**What it is:** Professionals can share logs with non-subscribed clients via email, WhatsApp, or SMS.

**How it applies:**
- Professional opens a log → clicks "Partager"
- Modal offers: Email, WhatsApp, SMS
- Token generated: 32-character cryptographically random string
- Share URL: `kelen.africa/journal/{share_token}`
- Non-subscribed client receives link → views read-only log → can approve or contest (requires email entry)
- View tracking: first_viewed_at, view_count, recipient identity
- Links never expire by default

**Key files:** `components/journal/ShareLogModal.tsx`

### 7.6 Real-Time Sync
**What it is:** Supabase Realtime pushes log changes to all connected users.

**How it applies:**
- When a professional publishes a log, client sees it appear in real-time
- "Live Sync" pulsing indicator shows connection status
- No page refresh needed

**Key files:** Supabase Realtime subscription on project detail page

---

## 8. Reputation & Status System

### 8.1 Recommendations
**What it is:** Verified positive reviews submitted by clients, linked to contracts and evidence.

**How it applies:**
- Clients submit recommendations with descriptive text and evidence files (contracts, photos, etc.)
- Recommendation is linked to both the submitting client and the reviewed professional
- Status: pending → verified/rejected (admin review process)
- Verified recommendations count toward professional's status tier
- Recommendations are permanent and cannot be purchased or removed

**Key files:** `components/forms/RecommendationForm.tsx`, `components/shared/RecommendationCard.tsx`, `components/recommandations/RecommandationScrollRow.tsx`

### 8.2 Status Tiers (3 Levels)
**What it is:** Automated, server-side status calculation based on verified recommendations.

**How it applies:**
| Status | Criteria |
|---|---|
| 🟡 **Or** | 3+ verified recommendations, rating ≥ 4.5/5, 90%+ positive |
| ⚪ **Argent** | 1–2 verified recommendations, rating ≥ 4.0/5, 80%+ positive |
| — **Non classé** | No verified history yet |

- Status badge appears on the professional's profile
- Calculated automatically whenever recommendation data changes
- Tamper-proof — professionals cannot influence the calculation
- Status is never sold — subscription does not affect the status tier
- Kelen never says "this professional is reliable" — it shows documented evidence and lets the user conclude

**Key files:** `components/shared/StatusBadge.tsx`

### 8.3 Status Calculation Engine
**What it is:** Automated backend process that calculates professional status tiers.

**How it applies:**
- Runs server-side whenever a professional's verified recommendations change
- Counts total verified recommendations, aggregate rating, and positive ratio
- Applies business rules to assign correct status tier
- Result is displayed on the professional's profile via StatusBadge component

---

## 9. Analytics & Statistics

### 9.1 Profile View Tracking
**What it is:** Lightweight analytics to track how many times a professional's profile is viewed.

**How it applies:**
- Each profile view is logged server-side
- Professional can retrieve their analytics data from their dashboard
- Data includes: view count, date ranges, referral sources (future)
- Free professionals receive basic statistics
- Paid professionals receive advanced in-app analytics

### 9.2 Pro Dashboard Statistics
**What it is:** High-level metrics displayed on the professional's dashboard.

**How it applies:**
- Profile views over time
- Number of projects assigned
- Number of logs created
- Recommendation count and status tier
- Subscription status

**Key files:** `components/layout/ProSidebar.tsx`

---

## 10. Subscription & Payments

### 10.1 Pricing Tiers
**What it is:** Two-tier model — free and paid.

| Feature | Free | Paid — 3,000 XOF / €15/month |
|---|---|---|
| Full mini website | ✓ | ✓ |
| AI copywriting generation | ✓ | ✓ |
| Basic statistics | ✓ | ✓ |
| Projects | 3 max | Unlimited |
| Photos | 15 total | Unlimited |
| Videos | — | ✓ |
| Automatic logo branding | — | ✓ |
| Rendering | SSG — static | SSR — dynamic |
| Google indexing | — | ✓ |
| XML Sitemap | — | ✓ |
| Google Analytics (GA4) | — | ✓ |
| Advanced in-app analytics | — | ✓ |

### 10.2 Payment Integration
**What it is:** Professionals purchase subscriptions via regional payment methods.

**How it applies:**
- **West Africa (3,000 XOF/month):** Wave, Orange Money, MTN Mobile Money
- **Europe (€15/month):** Stripe
- No engagement required — cancel anytime
- Advertising credits correctly allocated upon successful payment
- Payment status reflected in profile rendering mode (SSG vs. SSR)

**Technical stack:** Stripe (EUR) + Wave/Orange Money (XOF)

### 10.3 Free Tier Logic
**What it is:** Free accounts are accessible via direct URL but not indexed by Google.

**How it applies:**
- Free tier is generous enough to be a real showcase (3 projects, 15 photos)
- Insufficient to document a career — encourages upgrade
- Free profiles are not findable organically — they exist but aren't searchable
- Paid profiles are server-side rendered with full dynamic metadata and Open Graph tags

---

## 11. Notifications

### 11.1 Email Notifications (via Resend)
**What it is:** Automated email triggers for key professional events.

| Trigger | Template |
|---|---|
| Assigned to a project | "Vous avez été ajouté au projet {title}" |
| Log approved by client | "Votre rapport a été approuvé" |
| Log contested by client | "Un rapport a été contesté — action requise" |
| Contest response from client | "Réponse à votre contestation" |
| New recommendation received | "Nouvelle recommandation reçue" |
| Project invitation received | "Invitation à rejoindre le projet {title}" |

### 11.2 In-App Notifications
**What it is:** Real-time push notifications via Supabase Realtime.

**How it applies:**
- Professional receives in-app notifications for project assignments, log approvals/contests, and reputation changes
- Subscribe to relevant database channels (project_logs, project_log_comments, etc.)
- Update UI in real-time without page refresh

---

## 12. Professional Navigation Structure

### 12.1 ProSidebar (Mobile Bottom Nav + Desktop Sidebar)
**What it is:** The primary navigation for authenticated professionals.

**Navigation items:**
1. **Dashboard** — Overview, statistics, quick actions
2. **Projects** — List of assigned projects, step management
3. **Portfolio** — Manage realizations, photos, videos
4. **Ma présence** — Site web, PDF portfolio, Google My Business
5. **Profile** — Edit profile information, AI copywriting
6. **Réputation** — View recommendations and status tier
7. **Analytics** — Profile views, engagement metrics (paid)
8. **Settings** — Account, subscription, branding

**Design notes:**
- Mobile: bottom navigation bar with icons and labels
- Desktop: persistent sidebar
- 7 items exceed recommended maximum of 5 — consolidation planned (see FRONTEND_AUDIT.md)

**Key files:** `components/layout/ProSidebar.tsx`

---

## 13. Admin & Moderation (Platform Side)

### 13.1 Admin Dashboard
**What it is:** Platform administrators can manage users, review reputation submissions, and moderate content.

**How it applies:**
- AdminSidebar provides navigation to admin functions
- Review queue for pending recommendations
- User management (search, suspend, ban)
- Evidence file review
- Status override capability (for edge cases)

**Key files:** `components/layout/AdminSidebar.tsx`

### 13.2 Verification Queue
**What it is:** Administrative review process for submitted recommendations.

**How it applies:**
- Recommendations enter "pending" status upon submission
- Admin reviews evidence files, contract references, and descriptions
- Admin marks as "verified" or "rejected"
- Status change triggers automatic status recalculation for the professional
- Full audit trail preserved

---

## 14. Progressive Capabilities (Planned)

### 14.1 PWA Offline Access
**What it is:** Progressive Web App capabilities for offline log drafting.

**How it applies (planned):**
- Professionals can draft logs without internet connectivity
- Logs stored in IndexedDB locally
- Auto-sync when connectivity returns
- "Synced" status indicator in UI

**Key files:** `components/journal/OfflineIndicator.tsx`

### 14.2 Export Engine
**What it is:** Generate Excel/PDF reports for project transparency.

**How it applies (planned):**
- Project-level report generation
- All logs, spending, and media compiled into downloadable document
- PDF for sharing with stakeholders
- Excel for financial analysis

**Key files:** `components/projects/ProjectStepsSection.tsx` (export dropdown — not yet functional)

### 14.3 Financial Dashboard Aggregation
**What it is:** Cross-project financial summaries and spending analytics.

**How it applies (planned):**
- Aggregate budget consumption across all project steps
- Spending trends over time
- Currency conversion (XOF/EUR/USD)
- Export-ready financial reports

---

## 15. Design System Integration

### 15.1 "Digital Diplomat" Design Language
**What it is:** Premium, editorial-grade design system applied to all professional-facing interfaces.

**Key characteristics:**
- **Typography:** `Manrope` for bold headlines, `Inter` for body text
- **Tonal layering:** Material Design 3 surface tokens (`surface`, `surface-container-low`, `surface-container-lowest`) instead of 1px borders
- **Organic radii:** Large corner radii (`24px` to `32px`)
- **Asymmetric layouts:** Bento-style grids for dashboards
- **Visual feedback:** "Live Sync" pulsing indicators, smooth `framer-motion` transitions

### 15.2 Status Badge Colors (Journal)
| Status | Color |
|---|---|
| pending | Amber |
| approved | Green |
| contested | Red |
| resolved | Blue |

**Key files:** `components/journal/LogStatusBadge.tsx`

---

## Feature Map Summary

```
Professional Journey
├── Onboarding
│   ├── Registration & Authentication
│   └── Role Differentiation
├── Profile Management
│   ├── Commercial Landing Page (Hero → Portfolio → About → Contact)
│   ├── Profile Editing (bio, location, contact)
│   ├── Portfolio Management (projects, photos, videos)
│   └── AI Copywriting Generation
├── Automatic Branding (Paid)
│   ├── Logo Upload & Color Extraction
│   └── WCAG-Compliant Theme Application
├── Visibility & SEO
│   ├── SSG (Free) vs SSR (Paid)
│   ├── Google Indexing & Sitemap (Paid)
│   └── Professional Directory Discovery
├── Project Assignment
│   ├── Add-to-Project Workflow
│   ├── Step Association
│   └── Comparison Engine
├── Project Management
│   ├── Pro Projects Dashboard
│   └── Pro Project Detail View
├── Daily Journal
│   ├── Log Creation (description, media, GPS, money)
│   ├── Log Timeline & Cards
│   ├── GPS & Timestamp Enforcement
│   ├── Client Review Flow (approve/contest/resolve)
│   ├── Shareable Links (email/WhatsApp/SMS)
│   └── Real-Time Sync
├── Reputation & Status
│   ├── Recommendations (verified reviews with evidence)
│   ├── Status Tiers (Or/Argent/Non classé)
│   └── Status Calculation Engine
├── Analytics & Statistics
│   ├── Profile View Tracking
│   └── Pro Dashboard Metrics
├── Subscription & Payments
│   ├── Pricing Tiers (Free vs Paid)
│   ├── Payment Integration (Stripe, Wave, Orange Money)
│   └── Free Tier Logic
├── Notifications
│   ├── Email (Resend)
│   └── In-App (Supabase Realtime)
├── Navigation
│   └── ProSidebar (8 items incl. Ma présence, mobile + desktop)
├── Admin & Moderation
│   ├── Admin Dashboard
│   └── Verification Queue
├── Planned Capabilities
│   ├── PWA Offline Access
│   ├── Export Engine (PDF/Excel)
│   └── Financial Dashboard Aggregation
└── Design System
    ├── Digital Diplomat (MD3, Manrope, Inter)
    └── Status Badge Color Tokens
```

---

## Related Documents

- `BLUEPRINT.md` — Overall project blueprint and architecture
- `backend-plan.md` — Backend development plan and data model
- `kelen_positioning.md` — Master positioning document (source of truth)
- `kelen_value_proposition.md` — Updated offer summary and pricing
- `daily-log-spec.md` — Full specification for the Daily Log feature
- `FRONTEND_AUDIT.md` — Frontend responsiveness and design audit

---

## Glossary

| Term | Definition |
|---|---|
| **Kelen** | Professional digitalization and visibility platform |
| **Digital Diplomat** | Premium, editorial-grade design system |
| **Functional Development Area** | Professional domain (e.g., Law, Architecture, Education) |
| **Recommendation** | Verified review linked to evidence (contract, photos, timeline) |
| **Status Tier** | Professional reputation level: Or / Argent / Non classé — earned through verified recommendations, never purchased |
| **SSG** | Static Site Generation (free profiles) |
| **SSR** | Server-Side Rendering (paid profiles) |
| **Daily Log** | Transparency layer for project progress tracking |
| **EXIF** | Exchangeable Image File Format — contains GPS and timestamp metadata |
| **RLS** | Row Level Security (Supabase access control) |
| **PWA** | Progressive Web App |
