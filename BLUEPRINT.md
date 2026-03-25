# Kelen — Frontend Blueprint

> **Owner:** Claude Code (frontend only)
> **Backend:** Handled separately by project owner (Supabase SQL, Edge Functions, RLS, triggers, storage policies)
> **Last updated:** 2026-02-17
> **Status:** Initial version — no code implemented yet
> **Environment constraint:** No Node.js locally. Claude Code writes all files manually. Owner installs packages from external environment (Firebase Studio / other). Testing via Vercel deployment.

---

## 1. Scope & Boundaries

### What I build (Frontend)
- All Next.js pages, layouts, components
- Styling (Tailwind CSS + shadcn/ui)
- Client-side form validation
- Supabase client integration (queries, auth calls, realtime subscriptions)
- File upload UI (to Supabase Storage)
- Stripe checkout redirect flow (client-side)
- Middleware (auth guards, role-based redirects)
- SEO metadata, Open Graph tags
- Responsive design (mobile-first)
- Accessibility (A11Y)

### What I do NOT touch (Backend)
- SQL table creation / migrations
- Database functions (`compute_professional_status`, `track_profile_view`, `reset_monthly_views`)
- Database triggers
- RLS policies
- Edge Functions (`process-payment`)
- Storage bucket creation & policies
- Materialized views
- Cron jobs
- Stripe/Wave webhook handlers

### Integration contract
Frontend calls backend via:
- `supabase.from('table').select/insert/update()` — governed by RLS
- `supabase.rpc('function_name', params)` — for SQL functions
- `fetch('/functions/v1/edge-function')` — for Edge Functions
- `supabase.auth.*` — for authentication
- `supabase.storage.from('bucket').*` — for file uploads

I write the calls. Backend owner ensures tables, functions, RLS, and buckets exist.

---

## 2. Tech Stack (Frontend)

| Layer | Choice | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.x |
| Language | TypeScript | 5.x |
| React | React | 19.x |
| Styling | Tailwind CSS | 4.x |
| UI Components | shadcn/ui | latest |
| Icons | Lucide React (via shadcn) | latest |
| Supabase Client | @supabase/supabase-js + @supabase/ssr | latest |
| Forms | React Hook Form + Zod | latest |
| Date Handling | date-fns | latest |
| Charts (Phase 2) | Recharts | latest |
| Toasts | sonner (via shadcn) | latest |
| Payments (Phase 2) | @stripe/stripe-js | latest |

**Testing:** Cannot run dev server locally. Deploy to Vercel to verify builds and preview.

---

## 3. Project Structure

```
app/
├── (marketing)/                    → Public static pages
│   ├── layout.tsx                  → Marketing layout (navbar + footer)
│   ├── page.tsx                    → / (Home)
│   ├── pour-les-pros/
│   │   └── page.tsx                → /pour-les-pros
│   ├── comment-ca-marche/
│   │   └── page.tsx                → /comment-ca-marche
│   ├── tarifs/
│   │   └── page.tsx                → /tarifs
│   ├── a-propos/
│   │   └── page.tsx                → /a-propos
│   ├── faq/
│   │   └── page.tsx                → /faq
│   └── contact/
│       └── page.tsx                → /contact
│
├── (validation)/                   → Public dynamic pages
│   ├── layout.tsx                  → Same navbar, minimal footer
│   ├── recherche/
│   │   └── page.tsx                → /recherche
│   └── pro/
│       └── [slug]/
│           └── page.tsx            → /pro/[slug]
│
├── (auth)/                         → Auth pages (no index)
│   ├── layout.tsx                  → Centered card layout
│   ├── connexion/
│   │   └── page.tsx                → /connexion
│   ├── inscription/
│   │   └── page.tsx                → /inscription
│   └── mot-de-passe/
│       └── page.tsx                → /mot-de-passe
│
├── (diaspora)/                     → Authenticated (role: user)
│   ├── layout.tsx                  → Dashboard layout + sidebar
│   ├── dashboard/
│   │   └── page.tsx                → /dashboard
│   ├── recommandation/
│   │   ├── page.tsx                → /recommandation (select pro)
│   │   └── [slug]/
│   │       └── page.tsx            → /recommandation/[slug] (form)
│   ├── signal/
│   │   ├── page.tsx                → /signal (select pro)
│   │   └── [slug]/
│   │       └── page.tsx            → /signal/[slug] (form)
│   └── avis/
│       └── [slug]/
│           └── page.tsx            → /avis/[slug] (review form)
│
├── (professional)/                 → Authenticated (role: professional)
│   ├── layout.tsx                  → Pro dashboard layout + sidebar
│   └── pro/
│       ├── dashboard/
│       │   └── page.tsx            → /pro/dashboard
│       ├── profil/
│       │   └── page.tsx            → /pro/profil
│       ├── recommandations/
│       │   └── page.tsx            → /pro/recommandations
│       ├── signal/
│       │   └── page.tsx            → /pro/signal
│       ├── credit/
│       │   └── page.tsx            → /pro/credit
│       └── analytique/
│           └── page.tsx            → /pro/analytique
│
├── (admin)/                        → Authenticated (role: admin)
│   ├── layout.tsx                  → Admin layout + sidebar
│   └── admin/
│       ├── page.tsx                → /admin
│       ├── queue/
│       │   ├── page.tsx            → /admin/queue
│       │   └── [id]/
│       │       └── page.tsx        → /admin/queue/[id]
│       └── journal/
│           └── page.tsx            → /admin/journal
│
├── (legal)/                        → Static legal pages
│   ├── mentions-legales/
│   │   └── page.tsx
│   ├── confidentialite/
│   │   └── page.tsx
│   └── cgu/
│       └── page.tsx
│
├── api/                            → API routes
│   └── webhooks/
│       ├── stripe/route.ts         → Stripe webhook (backend owner writes logic)
│       └── wave/route.ts           → Wave webhook (backend owner writes logic)
│
├── globals.css
├── layout.tsx                      → Root layout (fonts, metadata, providers)
└── not-found.tsx                   → 404 page

components/
├── ui/                             → shadcn/ui primitives (button, card, input, etc.)
├── layout/
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── DashboardSidebar.tsx
│   ├── ProSidebar.tsx
│   └── AdminSidebar.tsx
├── marketing/
│   ├── HeroSection.tsx
│   ├── HowItWorks.tsx
│   ├── StatusExplainer.tsx
│   ├── ProCTABanner.tsx
│   ├── PricingCalculator.tsx
│   └── ScrollSection.tsx
├── shared/
│   ├── StatusBadge.tsx             → Gold/Silver/White/Red/Black badge
│   ├── ProfessionalCard.tsx        → Card used in search results
│   ├── RecommendationCard.tsx      → Verified recommendation display
│   ├── SignalCard.tsx              → Verified signal display
│   ├── ReviewCard.tsx              → Public review display
│   ├── SearchBar.tsx
│   ├── FilterPanel.tsx
│   ├── FileUpload.tsx              → Reusable upload component
│   ├── EmptyState.tsx
│   └── ConfirmDialog.tsx
├── forms/
│   ├── RecommendationForm.tsx      → Multi-step recommendation form
│   ├── SignalForm.tsx              → Multi-step signal form
│   ├── ReviewForm.tsx              → Star rating + comment
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   ├── ContactForm.tsx
│   └── ProProfileForm.tsx
├── pro/
│   ├── CreditBlock.tsx             → Real-time credit display
│   ├── PendingRecommendations.tsx
│   ├── LinkRecommendationCard.tsx
│   ├── SignalResponseForm.tsx
│   ├── VisibilitySettings.tsx
│   └── TransactionHistory.tsx
├── admin/
│   ├── QueueCard.tsx
│   ├── ReviewScreen.tsx
│   ├── VerificationChecklist.tsx
│   ├── PlatformMetrics.tsx
│   └── AuditLogEntry.tsx
└── providers/
    ├── SupabaseProvider.tsx
    └── ThemeProvider.tsx

lib/
├── supabase/
│   ├── client.ts                   → Browser client
│   ├── server.ts                   → Server component client
│   ├── middleware.ts               → Auth middleware helper
│   └── types.ts                    → Generated DB types (from supabase gen types)
├── utils/
│   ├── format.ts                   → Currency, dates, slugs
│   ├── constants.ts                → Categories, countries, budget ranges
│   └── validators.ts               → Zod schemas for all forms
└── hooks/
    ├── useUser.ts
    ├── useProfessional.ts
    └── useRealtime.ts

middleware.ts                        → Auth guard + role-based redirects
```

---

## 4. Page Inventory — Build Order

### Phase 1 — Validation Core (P0)

These pages ship first. They represent the free validation system.

| # | Page | Route | Rendering | Auth | Dependencies |
|---|---|---|---|---|---|
| 1 | Home | `/` | SSG | No | None |
| 2 | Search / Browse | `/recherche` | SSR | No | `professionals` table |
| 3 | Public Profile | `/pro/[slug]` | SSR + ISR | No | `professionals`, `recommendations`, `signals`, `reviews` tables + `track_profile_view` RPC |
| 4 | Login | `/connexion` | Client | No | Supabase Auth |
| 5 | Register | `/inscription` | Client | No | Supabase Auth + `users` + `professionals` tables |
| 6 | Diaspora Dashboard | `/dashboard` | SSR | user | `recommendations`, `signals` tables |
| 7 | Submit Recommendation | `/recommandation/[slug]` | Client | user | `professionals`, `recommendations` tables + `contracts`, `evidence-photos` buckets |
| 8 | Submit Signal | `/signal/[slug]` | Client | user | `professionals`, `signals` tables + `contracts`, `evidence-photos` buckets |
| 9 | For Professionals | `/pour-les-pros` | SSG | No | None |
| 10 | Pro Dashboard | `/pro/dashboard` | SSR + RT | professional | `professionals`, `recommendations`, `signals` tables + `professional_analytics_view` |
| 11 | Link Recommendations | `/pro/recommandations` | SSR | professional | `recommendations` table |
| 12 | Respond to Signal | `/pro/signal` | SSR + Client | professional | `signals` table + `evidence-photos` bucket |
| 13 | Admin Dashboard | `/admin` | SSR | admin | `platform_metrics_view` |
| 14 | Verification Queue | `/admin/queue` | SSR + RT | admin | `verification_queue`, `recommendations`, `signals` tables |
| 15 | Review Screen | `/admin/queue/[id]` | SSR | admin | Same + admin UPDATE permissions |

### Phase 2 — Advertisement + Polish (P1)

| # | Page | Route | Rendering | Auth | Dependencies |
|---|---|---|---|---|---|
| 16 | Buy Credit | `/pro/credit` | Client | professional | `credit_transactions` table + `process-payment` Edge Function + Stripe |
| 17 | Edit Profile | `/pro/profil` | Client | professional | `professionals` table + `portfolios` bucket |
| 18 | Analytics | `/pro/analytique` | SSR | professional | `professional_analytics_view`, `profile_views` table |
| 19 | How It Works | `/comment-ca-marche` | SSG | No | None |
| 20 | Pricing | `/tarifs` | SSG | No | None |
| 21 | Password Reset | `/mot-de-passe` | Client | No | Supabase Auth |
| 22 | Leave Review | `/avis/[slug]` | Client | user | `reviews` table |
| 23 | Audit Log | `/admin/journal` | SSR | admin | `verification_queue` table |
| 24 | Legal Notice | `/mentions-legales` | SSG | No | None |
| 25 | Privacy Policy | `/confidentialite` | SSG | No | None |
| 26 | Terms of Use | `/cgu` | SSG | No | None |

### Phase 3 — Post-Launch (P2)

| # | Page | Route |
|---|---|---|
| 27 | About | `/a-propos` |
| 28 | FAQ | `/faq` |
| 29 | Contact | `/contact` |

---

## 5. Design System

### Color Palette — West African Flag Inspired

Inspired by Pan-African flag colors (Senegal, Mali, Côte d'Ivoire, Guinea, Burkina Faso).
White background keeps the interface clean and lets the three colors carry meaning.

#### Core Colors

| Token | Hex | Tailwind | Usage |
|---|---|---|---|
| `kelen-green` | `#009639` | Custom | Primary CTAs, success states, Gold/Silver badges, trust indicators |
| `kelen-yellow` | `#FCCF00` | Custom | Highlights, accents, hover states, Gold status glow |
| `kelen-red` | `#CE1126` | Custom | Signals, Red/Black status, destructive actions, alerts |
| `white` | `#FFFFFF` | `white` | Page background |
| `foreground` | `#1A1A1A` | Custom | Body text |
| `muted` | `#F5F5F4` | `stone-100` | Card backgrounds, subtle sections |
| `muted-foreground` | `#78716C` | `stone-500` | Secondary text, placeholders |
| `border` | `#E7E5E4` | `stone-200` | Borders, dividers |

#### Extended Palette (shades for depth)

| Shade | Green | Yellow | Red |
|---|---|---|---|
| 50 (lightest bg) | `#ECFDF3` | `#FEFCE8` | `#FEF2F2` |
| 100 | `#D1FAE5` | `#FEF9C3` | `#FEE2E2` |
| 500 (base) | `#009639` | `#FCCF00` | `#CE1126` |
| 600 (hover) | `#007A2E` | `#D4AD00` | `#A80E1F` |
| 700 (active) | `#006124` | `#AB8C00` | `#860B18` |
| 800 (text on light bg) | `#004D1C` | `#7A6400` | `#6B0913` |

#### Semantic Mapping

| Semantic Role | Color Used |
|---|---|
| Primary buttons, links | `kelen-green-500` → hover `kelen-green-600` |
| Secondary buttons | `white` bg + `kelen-green-500` border |
| Destructive buttons | `kelen-red-500` → hover `kelen-red-600` |
| Warning/attention | `kelen-yellow-500` bg with `kelen-yellow-800` text |
| Success messages | `kelen-green-50` bg with `kelen-green-800` text |
| Error messages | `kelen-red-50` bg with `kelen-red-800` text |
| Navbar | `white` bg, `kelen-green-500` logo accent |
| Footer | `foreground` (dark) bg, `white` text, `kelen-green-500` links |
| Active nav link | `kelen-green-500` underline or text |
| Sidebar active | `kelen-green-50` bg with `kelen-green-700` text |

### Status Badge Specifications

| Status | Label (FR) | Emoji | BG Color | Border | Text Color |
|---|---|---|---|---|---|
| `gold` | Liste Or | 🟡 | `kelen-yellow-50` | `kelen-yellow-500` | `kelen-yellow-800` |
| `silver` | Liste Argent | ⚪ | `stone-50` | `stone-300` | `stone-700` |
| `white` | Liste Blanche | 🤍 | `stone-50` | `stone-200` | `stone-500` |
| `red` | Liste Rouge | 🔴 | `kelen-red-50` | `kelen-red-500` | `kelen-red-800` |
| `black` | Liste Noire | ⚫ | `#1A1A1A` | `#1A1A1A` | `white` |

### Status Display Text

```
Gold:   "🟡 Liste Or · X projets vérifiés · ★ X.X"
Silver: "⚪ Liste Argent · X projets vérifiés · ★ X.X"
White:  "🤍 Liste Blanche · Aucun historique Kelen"
Red:    "🔴 Liste Rouge · X signal(s) documenté(s)"
Black:  "⚫ Liste Noire · X signaux documentés"
```

### Typography

| Element | Font | Size | Weight |
|---|---|---|---|
| Hero headline | Geist Sans | 4xl–6xl | Bold |
| Section headline | Geist Sans | 2xl–3xl | Semibold |
| Card title | Geist Sans | lg | Semibold |
| Body | Geist Sans | base | Regular |
| Small/meta | Geist Sans | sm | Regular |
| Code/data | Geist Mono | sm | Regular |

### Spacing & Layout

- Max content width: `max-w-7xl` (1280px)
- Page padding: `px-4 sm:px-6 lg:px-8`
- Section spacing: `py-16 sm:py-24`
- Card padding: `p-6`
- Form field spacing: `space-y-4`

### Responsive Breakpoints

| Breakpoint | Min width | Layout |
|---|---|---|
| Mobile | 0 | Single column, stacked |
| sm | 640px | Minor adjustments |
| md | 768px | Two-column where needed |
| lg | 1024px | Full sidebar layouts |
| xl | 1280px | Max width content |

---

## 6. Component Specifications

### StatusBadge

Most reused component. Appears on search cards, profiles, dashboards, admin queue.

```tsx
interface StatusBadgeProps {
  status: 'gold' | 'silver' | 'white' | 'red' | 'black'
  recommendationCount: number
  signalCount: number
  avgRating: number | null
  size?: 'sm' | 'md' | 'lg'        // sm = inline, md = card, lg = profile header
  showDetails?: boolean              // show counts and rating
}
```

### ProfessionalCard

Used in `/recherche` results.

```tsx
interface ProfessionalCardProps {
  slug: string
  businessName: string
  ownerName: string
  category: string
  city: string
  country: string
  status: ProfessionalStatus
  recommendationCount: number
  signalCount: number
  avgRating: number | null
  reviewCount: number
  portfolioPhotos?: string[]        // first photo as thumbnail, only if is_visible
}
```

### RecommendationCard

Used on public profile and admin review screen.

```tsx
interface RecommendationCardProps {
  projectType: string
  projectDescription: string
  completionDate: string
  budgetRange: string
  location: string
  photoUrls: string[]
  beforePhotos?: string[]
  afterPhotos?: string[]
  submitterName: string
  submitterCountry: string
  linked: boolean
  // Admin-only:
  contractUrl?: string
  verificationNotes?: string
}
```

### SignalCard

Used on public profile and admin review screen.

```tsx
interface SignalCardProps {
  breachType: 'timeline' | 'budget' | 'quality' | 'abandonment' | 'fraud'
  breachDescription: string
  severity?: 'minor' | 'major' | 'critical'
  agreedStartDate: string
  agreedEndDate: string
  timelineDeviation?: string
  budgetDeviation?: string
  proResponse?: string
  proRespondedAt?: string
  createdAt: string
}
```

### FileUpload

Reusable across recommendation, signal, profile, and signal-response forms.

```tsx
interface FileUploadProps {
  bucket: 'contracts' | 'evidence-photos' | 'portfolios' | 'verification-docs'
  accept: string                    // e.g. '.pdf' or '.jpg,.png'
  maxSize: number                   // bytes
  maxFiles: number
  required: boolean
  label: string
  description?: string
  onUploadComplete: (urls: string[]) => void
}
```

---

## 7. Form Specifications

### Recommendation Form (4 steps)

**Step 1 — Professional confirmation**
- Display pro card (name, city, category)
- "Is this the right professional?" yes/no

**Step 2 — Project details**
- `project_type`: dropdown (construction, rénovation, plomberie, électricité, menuiserie, carrelage, peinture, architecture, ingénierie, autre)
- `project_description`: textarea (required)
- `completion_date`: date picker (required, must be past)
- `budget_range`: select (0-10k / 10k-25k / 25k-50k / 50k-100k / 100k+)
- `location`: text input (required)

**Step 3 — Evidence upload**
- Contract: PDF, required, max 10MB, single file
- After photos: JPG/PNG, required, min 2, max 10, max 5MB each
- Before photos: JPG/PNG, optional, max 10, max 5MB each

**Step 4 — Confirmation**
- Summary of all entered data
- Checkbox: "Les informations soumises sont authentiques à ma connaissance."
- Submit button
- Note: "Délai de vérification : 2 à 5 jours ouvrés."

### Signal Form (5 steps)

**Step 1 — Professional confirmation** (same as above)

**Step 2 — Breach details**
- `breach_type`: dropdown (timeline / budget / quality / abandonment / fraud)
- `breach_description`: textarea (required, min 100 chars)
- `severity`: select (minor / major / critical)
- `agreed_start_date`, `agreed_end_date`: date pickers (required)
- `actual_start_date`, `actual_end_date`: date pickers (optional)
- `timeline_deviation`: textarea
- `agreed_budget`, `actual_budget`: number inputs
- `budget_deviation`: textarea

**Step 3 — Evidence upload**
- Contract: PDF, required, max 10MB
- Evidence photos: JPG/PNG, required, min 2, max 5MB each
- Communication logs: JPG/PNG, optional (WhatsApp screenshots)

**Step 4 — Legal warnings**
- Red alert box explaining permanence of signals
- Three checkboxes (all required):
  1. "Les informations soumises sont authentiques."
  2. "La soumission d'un faux signal constitue une faute grave."
  3. "Le professionnel sera notifié et disposera d'un délai de 7 jours pour répondre."

**Step 5 — Final confirmation**
- Full summary
- Submit

### Registration Form

**Path A — Diaspora user (2 steps)**
- Step 1: first name, last name, email, password (8+ chars), country
- Step 2: language (fr/en), email notification preferences, terms acceptance

**Path B — Professional (3 steps)**
- Step 1: same as Path A
- Step 2: business_name, category, country, city, phone, whatsapp (optional), description (optional, max 300 chars)
- Step 3: three commitment checkboxes (terms, signal permanence understanding, privacy policy)

---

## 8. Authentication & Middleware

### middleware.ts logic

```
/dashboard*         → redirect /connexion if !authenticated OR role ≠ 'user'
/recommandation*    → redirect /connexion if !authenticated OR role ≠ 'user'
/signal*            → redirect /connexion if !authenticated OR role ≠ 'user'
/avis*              → redirect /connexion if !authenticated OR role ≠ 'user'
/pro/*              → redirect /connexion if !authenticated OR role ≠ 'professional'
/admin/*            → redirect /connexion if !authenticated OR role ≠ 'admin'
```

### Post-login redirects

| Role | Redirect to |
|---|---|
| `user` | `/dashboard` |
| `professional` | `/pro/dashboard` |
| `admin` | `/admin` |

### Session management

- Use `@supabase/ssr` for server-side session handling
- Supabase auth cookies for SSR pages
- `useUser()` hook for client components
- Refresh session on every server request via middleware

---

## 9. Supabase Client Calls Reference

### How to call (pattern)

```tsx
// Server Component
import { createServerClient } from '@/lib/supabase/server'
const supabase = await createServerClient()
const { data, error } = await supabase.from('table').select('...')

// Client Component
import { createBrowserClient } from '@/lib/supabase/client'
const supabase = createBrowserClient()

// RPC call (server-side only for sensitive functions)
await supabase.rpc('track_profile_view', { prof_id, viewer_ip, ... })

// Edge Function call
await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/process-payment`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${session.access_token}` },
  body: JSON.stringify({ ... })
})
```

### Calls by page

Detailed in `documentation/Architecture/BACKEND_INVOCATION.md` — that file is the authoritative reference for every Supabase call per page.

---

## 10. Copywriting Reference

### Language
- Primary: French (all UI text in French)
- Code: English (variable names, component names, file names)

### Key UI Strings

| Context | Text |
|---|---|
| Homepage headline | "Vous investissez en Afrique. Sachez à qui vous pouvez faire confiance." |
| Homepage subtitle | "Kelen répertorie les professionnels africains dont les clients ont documenté chaque projet. Cherchez un nom. Voyez son historique. Décidez en connaissance de cause." |
| CTA — check | "Vérifier un professionnel" |
| CTA — find | "Trouver un professionnel" |
| Search placeholder | "Nom d'un professionnel ou d'une entreprise" |
| Founding phrase | "La confiance ne se promet pas. Elle se documente." |
| Pricing phrase | "La visibilité s'achète. La réputation se construit." |
| No results | "Ce professionnel n'est pas encore référencé sur Kelen. L'absence de résultat ne constitue ni une recommandation, ni un avertissement." |
| Red alert banner | "Ce professionnel est sur Liste Rouge. Un manquement contractuel documenté a été vérifié." |
| Black alert banner | "Ce professionnel est sur Liste Noire. Plusieurs manquements contractuels documentés ont été vérifiés." |

### Tone rules
- Institutional, sober, factual
- Never: artificial urgency, gamification, paternalism, competitor comparisons, ROI promises
- Forbidden words on public pages: escroquerie/scam → "manquement contractuel", fraude → "signal vérifié", victime → "soumetteur", escroc → "professionnel Liste Rouge"

### Permanence mention — only in these locations
1. Terms of Service §6
2. Professional registration Step 3
3. "Signal verified" email to professional
4. Signal response page (`/pro/signal`)
5. Settings — account deletion note

---

## 11. SEO & Metadata

### Priority pages for SEO

| Page | Title | Description |
|---|---|---|
| `/` | "Kelen — Vérifiez les professionnels africains avant d'investir" | "Registre permanent de collaborations vérifiées entre diaspora et professionnels en Afrique. Cherchez un nom, voyez son historique." |
| `/pro/[slug]` | "[Business Name] — Profil Kelen" | Dynamic from professional data |
| `/recherche` | "Rechercher un professionnel — Kelen" | "Vérifiez le parcours documenté de tout professionnel référencé sur Kelen." |
| `/pour-les-pros` | "Professionnels — Rejoignez Kelen" | "Accédez à la clientèle diaspora. Prouvez que vous le méritez." |

### Images
All image requests are documented in `IMAGE_REQUESTS.md` at project root. Owner provides the files in `public/images/`. Claude Code updates the request file whenever a new image is needed during development.

### robots.txt exclusions
- `/dashboard*`
- `/pro/dashboard*`, `/pro/profil*`, `/pro/credit*`, `/pro/analytique*`
- `/admin*`
- `/connexion`, `/inscription`, `/mot-de-passe`

---

## 12. Environment Variables (Frontend)

```env
NEXT_PUBLIC_SUPABASE_URL=           # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=      # Supabase anonymous key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY= # Stripe publishable key
NEXT_PUBLIC_SITE_URL=               # Production URL (for redirects)
```

Server-only (never exposed to client):
```env
SUPABASE_SERVICE_ROLE_KEY=          # For server-side operations
STRIPE_SECRET_KEY=                  # For Stripe server-side
STRIPE_WEBHOOK_SECRET=              # For webhook verification
```

---

## 13. Dependencies to Install

### Foundation (install first)
```
npx shadcn@latest init
npm install @supabase/supabase-js @supabase/ssr
npm install react-hook-form @hookform/resolvers zod
npm install date-fns sonner
```

### shadcn/ui components to add
```
npx shadcn@latest add button input textarea select card badge
npx shadcn@latest add dialog alert-description separator
npx shadcn@latest add dropdown-menu tabs avatar toast
npx shadcn@latest add form label checkbox radio-group
npx shadcn@latest add table pagination skeleton
```

### Phase 2 additions
```
npm install recharts @stripe/stripe-js
```

---

## 14. Implementation Checklist

### Foundation (before any pages)
- [ ] Install dependencies (supabase, shadcn/ui, react-hook-form, zod, date-fns, sonner)
- [ ] Initialize shadcn/ui with Kelen color theme
- [ ] Set up Tailwind custom colors (kelen-green, kelen-yellow, kelen-red) in globals.css
- [ ] Set up Supabase client (`lib/supabase/client.ts`, `lib/supabase/server.ts`)
- [ ] Set up root layout (fonts, metadata, providers)
- [ ] Set up SupabaseProvider
- [ ] Create TypeScript types for all tables (`lib/supabase/types.ts`)
- [ ] Create constants file (categories, countries, budget ranges) (`lib/utils/constants.ts`)
- [ ] Create Zod validation schemas (`lib/utils/validators.ts`)
- [ ] Create formatting utilities (`lib/utils/format.ts`)
- [ ] Build StatusBadge component
- [ ] Build Navbar component
- [ ] Build Footer component
- [ ] Build FileUpload component
- [ ] Set up middleware.ts (auth guard skeleton — activates when Supabase is connected)

### Phase 1 pages
- [ ] Home `/`
- [ ] Search `/recherche`
- [ ] Public profile `/pro/[slug]`
- [ ] Login `/connexion`
- [ ] Register `/inscription`
- [ ] Diaspora dashboard `/dashboard`
- [ ] Submit recommendation `/recommandation/[slug]`
- [ ] Submit signal `/signal/[slug]`
- [ ] For professionals `/pour-les-pros`
- [ ] Pro dashboard `/pro/dashboard`
- [ ] Link recommendations `/pro/recommandations`
- [ ] Respond to signal `/pro/signal`
- [ ] Admin dashboard `/admin`
- [ ] Verification queue `/admin/queue`
- [ ] Review screen `/admin/queue/[id]`

### Phase 2 pages
- [ ] Buy credit `/pro/credit`
- [ ] Edit profile `/pro/profil`
- [ ] Analytics `/pro/analytique`
- [ ] How it works `/comment-ca-marche`
- [ ] Pricing `/tarifs`
- [ ] Password reset `/mot-de-passe`
- [ ] Leave review `/avis/[slug]`
- [ ] Audit log `/admin/journal`
- [ ] Legal pages (3)

### Phase 3 pages
- [ ] About `/a-propos`
- [ ] FAQ `/faq`
- [ ] Contact `/contact`

---

## 15. Conventions

### File naming
- Components: PascalCase (`StatusBadge.tsx`)
- Pages/layouts: lowercase (`page.tsx`, `layout.tsx`)
- Utilities/hooks: camelCase (`useUser.ts`, `format.ts`)
- Constants: camelCase file, SCREAMING_SNAKE for values

### Component patterns
- Server Components by default (no `'use client'` unless needed)
- `'use client'` only for: forms, interactive UI, realtime subscriptions, browser APIs
- Keep client components as leaf nodes
- Co-locate data fetching in Server Components

### Import aliases
- `@/components/*` → `components/*`
- `@/lib/*` → `lib/*`
- `@/app/*` → `app/*`

### Git
- **Branch:** `claude-code` (all frontend work goes here)
- **Main branch:** `main` (merges after review)
- Commit prefix: `feat:`, `fix:`, `style:`, `refactor:`, `chore:`
- Example: `feat: add search page with name lookup and browse modes`

---

*This document is the primary reference for all frontend work on Kelen. Updated as implementation progresses.*
