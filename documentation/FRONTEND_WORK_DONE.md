# Kelen — Frontend Work Done

> **Branch:** claude-code
> **Last updated:** 2026-02-18

---

## Foundation

| File | Purpose |
|---|---|
| `package.json` | All dependencies declared (Next.js 16, React 19, Supabase, Zod, React Hook Form, Tailwind 4, Sonner, Lucide) |
| `app/globals.css` | Kelen color system — Pan-African palette (Green #009639, Yellow #FCCF00, Red #CE1126) via Tailwind `@theme inline` |
| `app/layout.tsx` | Root layout — French lang, Geist fonts, metadata with title template, Toaster |
| `middleware.ts` | Auth guard skeleton with protected route mapping — ready to activate with Supabase |
| `lib/supabase/types.ts` | Complete TypeScript types for all 10 database tables + 2 materialized views |
| `lib/supabase/client.ts` | Browser Supabase client (`createBrowserClient`) |
| `lib/supabase/server.ts` | Server Supabase client (`createServerClient` with cookies) |
| `lib/utils/constants.ts` | Categories, countries, budget ranges, breach types, status config, nav links, CPM pricing |
| `lib/utils/format.ts` | French locale formatters (dates, currency, ratings, country names, tenure) |
| `lib/utils/validators.ts` | Zod schemas for all 8 forms with French error messages + type exports |

---

## Layouts (6)

| Layout | Route Group | Description |
|---|---|---|
| `app/(marketing)/layout.tsx` | Marketing | Navbar + Footer |
| `app/(validation)/layout.tsx` | Validation | Navbar + Footer |
| `app/(auth)/layout.tsx` | Auth | Centered card, Kelen logo, founding phrase |
| `app/(diaspora)/layout.tsx` | Diaspora | DashboardSidebar + main content area |
| `app/(professional)/layout.tsx` | Professional | ProSidebar (with "Pro" badge) + main content area |
| `app/(admin)/layout.tsx` | Admin | AdminSidebar (with "Admin" badge) + main content area |

---

## Pages (22)

### Marketing (2)
| Route | File | Description |
|---|---|---|
| `/` | `app/(marketing)/page.tsx` | Home — Hero, How It Works, Status Tiers, Two Systems, Pro CTA |
| `/pour-les-pros` | `app/(marketing)/pour-les-pros/page.tsx` | Pro landing — Benefits, status system, pricing, CTA |

### Validation / Public (2)
| Route | File | Description |
|---|---|---|
| `/recherche` | `app/(validation)/recherche/page.tsx` | Search — Lookup/Browse modes, filters, ProfessionalCard results |
| `/pro/[slug]` | `app/(validation)/pro/[slug]/page.tsx` | Public profile — Status banner, stats, recommendations, signals, reviews, sidebar contact |

### Auth (3)
| Route | File | Description |
|---|---|---|
| `/connexion` | `app/(auth)/connexion/page.tsx` | Login with email/password |
| `/inscription` | `app/(auth)/inscription/page.tsx` | Register — Diaspora/Professional toggle with conditional fields |
| `/mot-de-passe` | `app/(auth)/mot-de-passe/page.tsx` | Password reset — email input, success confirmation |

### Diaspora Dashboard (5)
| Route | File | Description |
|---|---|---|
| `/dashboard` | `app/(diaspora)/dashboard/page.tsx` | Quick actions, stats, recent activity list |
| `/recommandation` | `app/(diaspora)/recommandation/page.tsx` | Select professional to recommend |
| `/recommandation/[slug]` | `app/(diaspora)/recommandation/[slug]/page.tsx` | 4-step recommendation form |
| `/signal` | `app/(diaspora)/signal/page.tsx` | Select professional to signal |
| `/signal/[slug]` | `app/(diaspora)/signal/[slug]/page.tsx` | 5-step signal form with legal checkboxes |
| `/avis/[slug]` | `app/(diaspora)/avis/[slug]/page.tsx` | Star rating + comment review form |

### Professional Dashboard (6)
| Route | File | Description |
|---|---|---|
| `/pro/dashboard` | `app/(professional)/pro/dashboard/page.tsx` | Stats, pending actions (link recs, respond to signals) |
| `/pro/profil` | `app/(professional)/pro/profil/page.tsx` | Edit profile — description, services, experience, WhatsApp |
| `/pro/recommandations` | `app/(professional)/pro/recommandations/page.tsx` | View & link recommendations to profile |
| `/pro/signal` | `app/(professional)/pro/signal/page.tsx` | View signals & respond (15-day deadline) |
| `/pro/credit` | `app/(professional)/pro/credit/page.tsx` | Buy credits, view balance & history |
| `/pro/analytique` | `app/(professional)/pro/analytique/page.tsx` | Views chart, traffic sources, key metrics |

### Admin (4)
| Route | File | Description |
|---|---|---|
| `/admin` | `app/(admin)/admin/page.tsx` | Platform overview — stats, recent submissions |
| `/admin/queue` | `app/(admin)/admin/queue/page.tsx` | Verification queue list with priority indicators |
| `/admin/queue/[id]` | `app/(admin)/admin/queue/[id]/page.tsx` | Review screen — details, approve/reject/request info |
| `/admin/journal` | `app/(admin)/admin/journal/page.tsx` | Activity log with action types |

---

## Components (21)

### Layout (5)
| Component | File | Description |
|---|---|---|
| `Navbar` | `components/layout/Navbar.tsx` | Responsive navbar, mobile hamburger, marketing nav, CTA buttons |
| `Footer` | `components/layout/Footer.tsx` | Dark footer, 4-column grid, founding phrase |
| `DashboardSidebar` | `components/layout/DashboardSidebar.tsx` | Diaspora sidebar — active state, user info, logout |
| `ProSidebar` | `components/layout/ProSidebar.tsx` | Professional sidebar — 6 nav items, "Pro" badge |
| `AdminSidebar` | `components/layout/AdminSidebar.tsx` | Admin sidebar — 3 nav items, "Admin" badge |

### Shared (8)
| Component | File | Description |
|---|---|---|
| `StatusBadge` | `components/shared/StatusBadge.tsx` | Gold/Silver/White/Red/Black badge, size variants (sm/md/lg) |
| `ProfessionalCard` | `components/shared/ProfessionalCard.tsx` | Search result card linking to /pro/[slug] |
| `RecommendationCard` | `components/shared/RecommendationCard.tsx` | Green card — project details, budget, submitter |
| `SignalCard` | `components/shared/SignalCard.tsx` | Red card — breach type, severity, pro response |
| `ReviewCard` | `components/shared/ReviewCard.tsx` | Star rating display, comment, reviewer info |
| `SearchBar` | `components/shared/SearchBar.tsx` | Client component, URL param management |
| `FilterPanel` | `components/shared/FilterPanel.tsx` | Mode toggle, category/country/status dropdowns |
| `EmptyState` | `components/shared/EmptyState.tsx` | Reusable empty state with optional action |

### Forms (7)
| Component | File | Description |
|---|---|---|
| `LoginForm` | `components/forms/LoginForm.tsx` | Email/password with Zod validation |
| `RegisterForm` | `components/forms/RegisterForm.tsx` | Diaspora/Pro toggle, conditional fields, 3 checkboxes |
| `PasswordResetForm` | `components/forms/PasswordResetForm.tsx` | Email input, success state |
| `RecommendationForm` | `components/forms/RecommendationForm.tsx` | 4-step multi-step form with step indicator |
| `SignalForm` | `components/forms/SignalForm.tsx` | 5-step form with severity, dates, file upload, legal |
| `ReviewForm` | `components/forms/ReviewForm.tsx` | Interactive star rating + comment |
| `ProProfileForm` | `components/forms/ProProfileForm.tsx` | Description, services tags, experience, team |

### UI (1)
| Component | File | Description |
|---|---|---|
| `Toaster` | `components/ui/Toaster.tsx` | Sonner toast wrapper |

---

## Other Files

| File | Purpose |
|---|---|
| `BLUEPRINT.md` | Master frontend reference document |
| `IMAGE_REQUESTS.md` | 3 images needed (hero, diaspora, OG) |

---

## Current State

- **All pages use demo/mock data** with `// TODO` comments marking where Supabase queries replace them
- **All forms have Zod validation** but submit to `console.log` — Supabase calls are commented out and ready
- **Middleware** has auth logic commented out — ready to activate
- **No local testing possible** — deploy to Vercel to verify builds
- **No `node_modules`** — Vercel runs `npm install` automatically
