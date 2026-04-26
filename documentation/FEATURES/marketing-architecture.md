# Marketing Architecture & Copywriting Implementation

> Created: 2026-04-26
> Status: Active — maps copywriting corpus to codebase implementation
> Purpose: Single reference for translating copywriting documents into pages, components, routes, and metadata.

---

## 1. Current State Audit

### What exists in `app/(marketing)/`

| Route | File | State |
|-------|------|-------|
| `/` | `page.tsx` | ✅ Implemented — SearchHubPage (browser paradigm) |
| `/pour-les-pros` | `pour-les-pros/page.tsx` | ⚠️ Stale — contains blacklist/signals copy, old 5-tier status system, old feature list |
| `/tarifs` | `tarifs/page.tsx` | ⚠️ Review needed — likely reflects old model |
| `/comment-ca-marche` | `comment-ca-marche/page.tsx` | ⚠️ Review needed — client or mixed? |
| `/faq` | `faq/page.tsx` | ⚠️ Review needed |
| `/contact` | `contact/page.tsx` | ⚠️ Review needed |
| `/a-propos` | `a-propos/page.tsx` | ⚠️ Review needed |
| `/cgu` | `cgu/page.tsx` | ✅ Legal — stable |
| `/mentions-legales` | `mentions-legales/page.tsx` | ✅ Legal — stable |
| `/confidentialite` | `confidentialite/page.tsx` | ✅ Legal — stable |

### Critical issues in existing code

1. **`/pour-les-pros/page.tsx`** — contains:
   - `"Droit de réponse aux signaux"` — signals/blacklist system removed
   - `statusOrder: { gold, silver, white, red, black }` — old 5-tier system, replaced by Or/Argent/Non classé
   - Feature list does not match current model (no PDF, no GMB, no SSR/SSG split)
   - URL is `/pour-les-pros` — corpus uses `/pour-les-professionnels`

2. **`app/(marketing)/page.tsx`** (homepage):
   - References `status: "black"` filter — must be removed
   - `statusOrder` with red/black — old system

3. **Shared layout** — `app/(marketing)/layout.tsx` uses a single `<Navbar>` for all marketing pages. The corpus requires distinct navigation for client space vs pro space. This needs to be split.

---

## 2. Target Architecture

### Routing groups

```
app/
├── (marketing)/                    Client space — shared Navbar (client) + Footer
│   ├── page.tsx                    /              → homepage.md
│   ├── comment-ca-marche/          /comment-ca-marche  → marketing-client.md
│   ├── faq/                        /faq                → marketing-client.md
│   ├── contact/                    /contact            → marketing-client.md
│   ├── a-propos/                                → 06-legal-contact.md
│   ├── cgu/                                     → 06-legal-contact.md
│   ├── mentions-legales/                        → 06-legal-contact.md
│   └── confidentialite/                         → 06-legal-contact.md
│
├── (marketing-pro)/                Pro space — distinct Navbar (pro) + Footer
│   ├── pour-les-professionnels/    /pour-les-professionnels     → marketing-pro.md
│   ├── pour-les-professionnels/
│   │   ├── comment-ca-marche/      /…/comment-ca-marche         → pro-pages.md
│   │   ├── tarifs/                 /…/tarifs                    → pro-pages.md
│   │   ├── faq/                    /…/faq                       → pro-pages.md
│   │   └── contact/                /…/contact                   → pro-pages.md
│
├── (professional)/                 Pro dashboard — authenticated
│   └── pro/…                                    → 03-pro-journey.md
│
├── (client)/                       Client dashboard — authenticated
│   └── …                                        → 02-user-journey-client.md
│
└── (pro-site)/                     Public professional profiles
    └── professionnels/[slug]/…                  → public profile pages
```

### URL decisions

| Current | Target | Action |
|---------|--------|--------|
| `/pour-les-pros` | `/pour-les-professionnels` | Rename + add redirect |
| `/tarifs` (generic) | `/pour-les-professionnels/tarifs` (pro-specific) | Move to pro space |
| `/comment-ca-marche` | Two separate pages: `/comment-ca-marche` (client) + `/pour-les-professionnels/comment-ca-marche` (pro) | Keep client page, create pro page |
| `/faq` | Two separate: `/faq` (client) + `/pour-les-professionnels/faq` (pro) | Keep client page, create pro page |
| `/contact` | Two separate: `/contact` (client) + `/pour-les-professionnels/contact` (pro) | Keep client page, create pro page |

Add redirect in `next.config.ts`:
```ts
redirects: async () => [
  { source: '/pour-les-pros', destination: '/pour-les-professionnels', permanent: true },
  { source: '/tarifs', destination: '/pour-les-professionnels/tarifs', permanent: true },
]
```

---

## 3. Navigation Components

### Client Navbar — `components/layout/NavbarClient.tsx`

```
Kelen  [______ Rechercher ______]  Comment ça marche · FAQ · Contact  [Se connecter]  [Créer un compte]
```

- Search bar persistent on all client marketing pages
- No link to pro space in client nav
- "Créer un compte" is secondary CTA — searching comes first
- Mobile: search bar full width below logo, nav collapses to hamburger
- Source: `marketing-client.md` → Navigation section

### Pro Navbar — `components/layout/NavbarPro.tsx`

```
Kelen     Comment ça marche · Tarifs · FAQ · Contact      [Se connecter]  [Créer mon profil →]
```

- No search bar
- "Créer mon profil →" is sticky CTA on desktop
- Logo links to `/pour-les-professionnels`, not `/`
- Mobile: hamburger, CTA stays visible top-right
- Source: `marketing-pro.md` → Navigation section

### Layout split

```tsx
// app/(marketing)/layout.tsx — client space
import { NavbarClient } from "@/components/layout/NavbarClient"

// app/(marketing-pro)/layout.tsx — pro space (new routing group)
import { NavbarPro } from "@/components/layout/NavbarPro"
```

---

## 4. Page-by-Page Implementation Map

### 4.1 Homepage — `/`

**Source:** `homepage.md`
**File:** `app/(marketing)/page.tsx`
**Rendering:** SSG with `revalidate = 3600` (professionals grid refreshes hourly)

**Sections to implement:**

| Section | Component | Data source |
|---------|-----------|-------------|
| Search bar hero | `components/landing/SearchBar.tsx` | Static — no data |
| Sector tiles | `components/landing/SectorGrid.tsx` | Static list from `homepage.md` |
| Professionals grid | `components/landing/ProfessionalDirectory.tsx` | Supabase — `professionals` table |
| Pro bloc (bottom) | `components/landing/ProCtaBloc.tsx` | Static |
| Footer | `components/layout/Footer.tsx` | Static |

**Status filter fix** — current code filters `neq("status", "black")` and sorts by `{ gold, silver, white, red, black }`. Replace with:
```ts
// New: no status exclusion filter (non classé pros appear)
// Sort: no status-based sort — by recommendation_count only, then created_at
const { data: professionals } = await supabase
  .from("professionals")
  .select("*")
  .order("recommendation_count", { ascending: false })
  .limit(12);
```

**Metadata:**
```ts
export const metadata: Metadata = {
  title: "Kelen — Trouvez le professionnel de confiance",
  description: "Trouvez des professionnels africains, consultez leurs réalisations réelles et gérez votre projet directement en ligne.",
  openGraph: { ... }
}
```

---

### 4.2 Pro SaaS Landing — `/pour-les-professionnels`

**Source:** `marketing-pro.md`
**File:** `app/(marketing-pro)/pour-les-professionnels/page.tsx`
**Rendering:** Static (`export const revalidate = false`)

**Sections to implement:**

| Section | Component | Notes |
|---------|-----------|-------|
| Hero (triade) | `components/marketing-pro/Hero.tsx` | Headline: triade. Sous-titre. CTA. Mockup image. |
| Reassurance band | `components/marketing-pro/ReassuranceBand.tsx` | 5 checkmarks inline |
| Problem | `components/marketing-pro/ProblemSection.tsx` | "Vous avez des années de travail…" |
| Features (5) | `components/marketing-pro/FeatureSection.tsx` | Reusable — alternating image/text |
| How it works | `components/marketing-pro/HowItWorks.tsx` | 3-step vertical |
| Reputation/Status | `components/marketing-pro/ReputationSection.tsx` | 3 statuts displayed |
| Pricing table | `components/marketing-pro/PricingTable.tsx` | Free vs Abonnement comparison |
| Objections | `components/marketing-pro/ObjectionsSection.tsx` | FAQ accordion style |
| Final CTA | `components/marketing-pro/FinalCta.tsx` | Headline + 2 CTAs |

**Stale content to replace in current `pour-les-pros/page.tsx`:**
- Remove all signal/blacklist references
- Replace `PLAN_FEATURES_FREE` and `PLAN_FEATURES_PREMIUM` arrays with current model
- Replace `BENEFITS` array with the 5 feature sections from `marketing-pro.md`
- Update metadata title and description

**Metadata:**
```ts
export const metadata: Metadata = {
  title: "Kelen pour les professionnels — Montrez votre travail. Construisez la confiance.",
  description: "Créez votre site web professionnel, votre portfolio PDF et votre fiche Google My Business en quelques minutes. Sans designer, sans agence.",
}
```

---

### 4.3 Pro — Comment ça marche — `/pour-les-professionnels/comment-ca-marche`

**Source:** `pro-pages.md` → Section `/comment-ca-marche`
**File:** `app/(marketing-pro)/pour-les-professionnels/comment-ca-marche/page.tsx`
**Rendering:** Static

**Sections:** 7 accordions or stacked sections
1. Le profil — votre source unique
2. Le site web (free vs paid distinction)
3. Le portfolio PDF
4. La fiche Google My Business
5. Le copywriting par l'IA
6. Les recommandations et le statut
7. La collaboration client

**Bottom CTAs:** `[Créer mon profil gratuitement →]` + `[Voir les tarifs →]`

---

### 4.4 Pro — Tarifs — `/pour-les-professionnels/tarifs`

**Source:** `pro-pages.md` → Section `/tarifs`
**File:** `app/(marketing-pro)/pour-les-professionnels/tarifs/page.tsx`
**Rendering:** Static

**Sections:**
- Headline + principe
- Full comparison table (5 categories: présence, visibilité, contenu, sorties, analytics, collaboration, commun)
- Ce que l'abonnement ne change jamais
- Modalités de paiement (Wave / Orange Money / Stripe)
- FAQ tarifs (6 questions)
- CTA

**Pricing component** reuses `PricingTable.tsx` from the landing, or is extracted as `PricingComparison.tsx` with full detail.

---

### 4.5 Pro — FAQ — `/pour-les-professionnels/faq`

**Source:** `pro-pages.md` → Section `/faq`
**File:** `app/(marketing-pro)/pour-les-professionnels/faq/page.tsx`
**Rendering:** Static

**Structure:** 5 categories of questions, each as an expandable accordion group.
- Avant de s'inscrire (4 questions)
- Profil et visibilité (5 questions)
- Portfolio et contenu (4 questions)
- Recommandations et statut (6 questions)
- Abonnement et paiement (4 questions)
- Technique (3 questions)

**Component:** `components/ui/FaqAccordion.tsx` — reusable, takes `{ category: string, items: { q: string, a: string }[] }[]`

---

### 4.6 Pro — Contact — `/pour-les-professionnels/contact`

**Source:** `pro-pages.md` → Section `/contact`
**File:** `app/(marketing-pro)/pour-les-professionnels/contact/page.tsx`
**Rendering:** Static

**Sections:** 6 contact channels, each a card with situation description + email + delay.
No form — email links only.

---

### 4.7 Client — Comment ça marche — `/comment-ca-marche`

**Source:** `marketing-client.md` → Section `/comment-ca-marche`
**File:** `app/(marketing)/comment-ca-marche/page.tsx`
**Rendering:** Static

**Sections:** 7 stacked sections
1. Chercher un professionnel
2. Lire un profil
3. Comprendre le statut
4. Créer un projet
5. Collaborer avec un professionnel
6. Soumettre une recommandation
7. Ce que Kelen fait — et ne fait pas

**Bottom CTA:** `[Rechercher un professionnel →]`

---

### 4.8 Client — FAQ — `/faq`

**Source:** `marketing-client.md` → Section `/faq`
**File:** `app/(marketing)/faq/page.tsx`
**Rendering:** Static

**5 categories:** Trouver un professionnel, Comprendre les profils et le statut, Projets et collaboration, Recommandations, Compte et données.

Reuses `FaqAccordion.tsx`.

---

### 4.9 Client — Contact — `/contact`

**Source:** `marketing-client.md` → Section `/contact`
**File:** `app/(marketing)/contact/page.tsx`
**Rendering:** Static

**5 channels:** Avant inscription, Profil/recommandation problème, Recommandation en vérification, Compte/données, RGPD.

---

## 5. Shared Marketing Components

```
components/
├── layout/
│   ├── NavbarClient.tsx        Client nav — search bar + links
│   ├── NavbarPro.tsx           Pro nav — sticky CTA
│   └── Footer.tsx              Shared footer
│
├── landing/
│   ├── SearchBar.tsx           Homepage search
│   ├── SectorGrid.tsx          Sector tiles
│   └── ProfessionalDirectory.tsx  Pro grid with filters
│
├── marketing-pro/
│   ├── Hero.tsx                Triade headline + CTA + mockup
│   ├── ReassuranceBand.tsx     5 checkmarks
│   ├── ProblemSection.tsx      Problem narrative
│   ├── FeatureSection.tsx      Reusable feature block (image + text, alternating sides)
│   ├── HowItWorks.tsx          3-step flow
│   ├── ReputationSection.tsx   Status tiers display
│   ├── PricingTable.tsx        Free vs paid — compact (landing)
│   ├── PricingComparison.tsx   Full detailed table (tarifs page)
│   ├── ObjectionsSection.tsx   FAQ accordion for objections
│   └── FinalCta.tsx            Bottom CTA block
│
└── ui/
    └── FaqAccordion.tsx        Generic expandable FAQ — used by both pro and client spaces
```

---

## 6. SEO Implementation

### Per-page metadata

Each marketing page exports `metadata` with:
- `title` — from copywriting doc, format: `"[Page topic] — Kelen"`
- `description` — from intro/subtitle of the page, 150 chars max
- `openGraph.title` / `openGraph.description`
- `openGraph.url` — canonical URL
- `robots: { index: true, follow: true }` for all marketing pages

### Structured data (JSON-LD)

**Homepage:** `WebSite` schema with `SearchAction` pointing to the search endpoint.

**Pro landing:** `Product` or `Service` schema describing the Kelen subscription.

**FAQ pages:** `FAQPage` schema — each Q/A pair as a `Question` entity. This enables Google's FAQ rich results.

```tsx
// app/(marketing-pro)/pour-les-professionnels/faq/page.tsx
export default function ProFaqPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": FAQ_ITEMS.map(({ q, a }) => ({
            "@type": "Question",
            "name": q,
            "acceptedAnswer": { "@type": "Answer", "text": a }
          }))
        })
      }} />
      <FaqAccordion items={FAQ_ITEMS} />
    </>
  )
}
```

---

## 7. Email Template Implementation

### Current infrastructure
- `app/api/notifications/whatsapp/route.ts` — WhatsApp outbound
- Email sending: check `lib/actions/` for email action patterns

### Lifecycle emails — mapping to templates

Each stage in `emails-lifecycle-pro.md` and `emails-lifecycle-client.md` maps to:
- A trigger condition (event in the system)
- An email template (HTML, with Kelen styling)
- A WhatsApp template (plain text, pre-approved by Meta)

**Template file structure:**
```
lib/
└── email-templates/
    ├── pro/
    │   ├── welcome.ts              Étape 1
    │   ├── activation-no-photos.ts  Étape 2
    │   ├── activation-incomplete.ts Étape 3
    │   ├── conversion-j7.ts        Étape 4
    │   ├── conversion-j14.ts       Étape 5
    │   ├── conversion-j30.ts       Étape 6
    │   ├── subscription-active.ts  Étape 7
    │   ├── indexation-confirmed.ts Étape 8
    │   ├── monthly-summary.ts      Étape 9
    │   ├── inactivity-60d.ts       Étape 10
    │   ├── renewal-reminder.ts     Étape 11
    │   ├── payment-failed.ts       Étape 12
    │   └── post-cancellation.ts    Étape 13
    └── client/
        ├── welcome.ts              Étape 1
        ├── activation-no-search.ts Étape 2
        ├── engagement-no-project.ts Étape 3
        ├── project-created.ts      Étape 4
        ├── pro-no-response.ts      Étape 5
        ├── pro-accepted.ts         Étape 6
        ├── recommendation-nudge.ts Étape 7
        ├── recommendation-received.ts Étape 8
        ├── recommendation-published.ts Étape 9
        └── reengagement-90d.ts     Étape 10
```

### Template structure
Each template exports:
```ts
export function proWelcomeEmail(data: { firstName: string; slug: string; dashboardUrl: string }) {
  return {
    subject: "Votre profil Kelen est créé",
    html: `...`, // styled HTML
    text: `...`, // plain text fallback
  }
}

export function proWelcomeWhatsApp(data: { firstName: string; slug: string; dashboardUrl: string }) {
  return {
    // Meta pre-approved template body
    body: `Bonjour ${data.firstName} 👋\n\nVotre profil Kelen est en ligne :\nkelen.com/${data.slug}\n\nAjoutez vos premières photos de réalisations pour l'activer complètement.\n2 photos suffisent pour commencer.\n\n→ ${data.dashboardUrl}`,
  }
}
```

### Trigger implementation
Lifecycle triggers are implemented as:
- **Immediate** (welcome, subscription confirmed): called directly in the relevant server action
- **Scheduled** (J+1, J+7, J+14, J+30, monthly): Supabase Edge Function + cron, or Vercel Cron Jobs
- **Event-based** (indexation confirmed, project accepted, payment failed): called from the relevant webhook handler

**Stop conditions** must be enforced at the trigger level — check the state before sending:
```ts
// Before sending J+7 conversion email:
const { data: pro } = await supabase
  .from("professionals")
  .select("subscription_status, photo_count")
  .eq("id", professionalId)
  .single();

if (pro.subscription_status === 'active') return; // already subscribed
if (pro.photo_count === 0) return;               // not yet activated
```

---

## 8. Content Management — Copywriting → Code

### Static content strategy

All marketing copy is **hardcoded in components**, not stored in a CMS. Rationale:
- Copy changes are infrequent and intentional
- Changes go through git — version controlled, reviewable
- No CMS dependency, no extra latency

### Updating copy in production

1. Update the relevant copywriting doc (source of truth)
2. Update the corresponding component or page
3. PR review → merge → deploy

### Copywriting document → component mapping

| Copywriting doc | Component / page file |
|----------------|----------------------|
| `homepage.md` | `app/(marketing)/page.tsx` + `components/landing/` |
| `marketing-pro.md` | `app/(marketing-pro)/pour-les-professionnels/page.tsx` + `components/marketing-pro/` |
| `pro-pages.md` | `app/(marketing-pro)/pour-les-professionnels/[page]/page.tsx` |
| `marketing-client.md` | `app/(marketing)/[comment-ca-marche|faq|contact]/page.tsx` |
| `emails-lifecycle-pro.md` | `lib/email-templates/pro/` |
| `emails-lifecycle-client.md` | `lib/email-templates/client/` |
| `06-legal-contact.md` | `app/(marketing)/[cgu|mentions-legales|confidentialite|a-propos]/page.tsx` |
| `04-emails-notifications.md` | Transactional email handlers in `lib/actions/` |

---

## 9. Implementation Sequence

### Phase 1 — Fix stale content (no new routes)
```
□ app/(marketing)/page.tsx
  — Remove .neq("status", "black") filter
  — Remove statusOrder with red/black/white
  — Fix professional grid sorting (recommendation_count only)

□ app/(marketing)/pour-les-pros/page.tsx
  — Replace all signal/blacklist copy
  — Replace PLAN_FEATURES arrays with current model
  — Replace BENEFITS with 5-feature structure from marketing-pro.md
  — Update metadata
```

### Phase 2 — Navigation split
```
□ Create NavbarClient.tsx (search bar + client links)
□ Create NavbarPro.tsx (sticky CTA + pro links)
□ Create app/(marketing-pro)/layout.tsx using NavbarPro
□ Update app/(marketing)/layout.tsx to use NavbarClient
```

### Phase 3 — Pro space pages
```
□ Rename/move pour-les-pros → pour-les-professionnels
□ Add redirect: /pour-les-pros → /pour-les-professionnels
□ Create /pour-les-professionnels/comment-ca-marche
□ Create /pour-les-professionnels/tarifs
  — Move and update existing /tarifs
□ Create /pour-les-professionnels/faq
□ Create /pour-les-professionnels/contact
```

### Phase 4 — Component library
```
□ Extract marketing-pro components from landing page into components/marketing-pro/
□ Build FaqAccordion.tsx (shared)
□ Add JSON-LD structured data to FAQ pages
```

### Phase 5 — Email template library
```
□ Create lib/email-templates/ structure
□ Implement pro lifecycle templates (13)
□ Implement client lifecycle templates (10)
□ Wire triggers to server actions and webhooks
□ Implement stop conditions
```

### Phase 6 — SEO audit
```
□ Audit metadata on all marketing pages
□ Verify robots.ts allows all marketing pages
□ Verify sitemap.ts includes all marketing pages
□ Verify pro profile pages: noindex for free, index for paid
```
