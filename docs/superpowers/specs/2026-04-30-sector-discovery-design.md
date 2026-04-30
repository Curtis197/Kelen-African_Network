# Sector-Based Discovery — Design Spec
**Date:** 2026-04-30  
**Branch strategy:** Two A/B branches off `feat/professional-dashboard`  
**Status:** Approved, ready for implementation

---

## Problem

The current home page uses a chained dropdown filter (area → profession) that is slow and hostile on mobile. The `/recherche` page runs on a disconnected legacy category list. Together they make the platform read as a construction app and bury the 15-sector, 50+ profession breadth from users arriving via ads with intent.

---

## Goals

- Mobile-first fast discovery for ad-traffic users who already know they need a professional
- Communicate the full breadth of sectors (not just construction) on first glance
- Unify the two disconnected search surfaces into one coherent flow
- Set up an A/B test on the post-sector navigation pattern

---

## Approach: Sector Grid + Sector Pages (Option A)

Replace the dropdown filter bar with a visual sector grid. Each sector tile links to a dedicated sector page. The `/recherche` page is deleted and redirected to `/`.

---

## Section 1: Home Page

### Changes
- **Remove** the 4-field filter bar from `ProfessionalDirectory` component entirely
- **Add** `SectorGrid` component — 2-column grid of sector cards
- **Keep** `SearchBar` at top — update its submit target from `/recherche?q=...` to `/?q=...` since `/recherche` is being deleted. The home page will not yet render full-text results for `q` — it is a placeholder until a dedicated name-search page is built (out of scope here)
- **Keep** the professional cards below as a social proof "Featured professionals" block (no filter controls)

### SectorGrid behaviour
- Shows top 6 sectors by default, ordered by professional count (most populated first)
- "Voir tous les secteurs" toggle below reveals all 15 — client-side, no navigation
- Each card: Lucide icon (32px) + sector name + pro count (e.g. "14 professionnels")
- Tapping a card navigates to `/secteur/[slug]`

### Lucide icon mapping

| Sector | Slug | Icon |
|---|---|---|
| Bâtiment & Travaux Publics | batiment-travaux-publics | `HardHat` |
| Santé & Bien-être | sante-bien-etre | `Stethoscope` |
| Digital & Tech | digital-tech | `Laptop` |
| Juridique & Administratif | juridique-administratif | `Scale` |
| Éducation & Formation | education-formation | `GraduationCap` |
| Architecture & Design | architecture-design | `PenRuler` |
| Mécanique & Réparation | mecanique-reparation | `Wrench` |
| Commerce & Vente | commerce-vente | `ShoppingBag` |
| Immobilier & Foncier | immobilier-foncier | `Building2` |
| Rénovation & Finitions | renovation-finitions | `PaintRoller` |
| Ingénierie & Génie Civil | ingenierie-genie-civil | `Cog` |
| Services à la personne | services-personne | `HeartHandshake` |
| Marketing & Événementiel | marketing-evenementiel | `Megaphone` |
| Expertise & Conseil | expertise-conseil | `LineChart` |
| Autre | autre | `LayoutGrid` |

---

## Section 2: Sector Page (`/secteur/[slug]`)

**Route:** `app/(marketing)/secteur/[slug]/page.tsx`  
**Rendering:** Server component, statically generated at build time via `generateStaticParams()` for all 15 sector slugs.

### Page structure (mobile, top to bottom)
1. **Header** — large sector icon (40px) + sector name + total pro count
2. **Profession chips** — horizontal scrollable row of pill buttons, one per profession in the sector. "Tous" chip selected by default.
3. **Location filter** — single text input "Ville ou pays", filters results by city/country
4. **Professional cards** — `ProfessionalCard` component, same as currently used

### A/B Test — two branches

| Branch | Chip behaviour | URL pattern |
|---|---|---|
| `feat/sector-filter-inplace` | Chips filter card list in place | `/secteur/[slug]?profession=[profession-slug]` |
| `feat/sector-profession-page` | Chip navigates to profession sub-page | `/secteur/[slug]/[profession-slug]` |

Both branches share the same sector page shell. Only the chip `onClick` handler and URL structure differ. The profession sub-page branch adds `app/(marketing)/secteur/[slug]/[profession-slug]/page.tsx` with its own H1 and meta description for SEO.

---

## Section 3: Data Layer

### New server actions

**`getAreasSortedByPopularity(options?: { all?: boolean })`** — `lib/actions/taxonomy.ts`
- Joins `professional_areas` with `professionals` on `area_id`
- Groups by area, orders by `COUNT(*) DESC`
- Returns top 6 by default; all 15 when `{ all: true }`
- Cached with `unstable_cache`, revalidates every 3600 seconds

**`getProfessionalsByArea(areaSlug: string, professionSlug?: string, location?: string)`** — `lib/actions/professionals.ts`
- Resolves `areaSlug` → `area_id` via `professional_areas` table
- Optionally filters by `profession_id` (resolved from `professionSlug`) and by `city`/`country` text match
- Extends existing `getProfessionals()` filter logic

**`generateStaticParams()`** on sector page
- Calls `getAreas()` and maps to `{ slug }` array
- Pre-renders all 15 sector pages at build time

### Deletions
- `app/(validation)/recherche/page.tsx` — deleted; `301 /recherche → /` redirect added to `next.config`
- `FilterPanel.tsx` usage on the recherche page — file can be deleted if no other consumers exist
- Legacy `CATEGORIES` constant in `lib/utils/constants.ts` — deleted after confirming no remaining usages
- 4-field filter logic inside `ProfessionalDirectory.tsx` — stripped; component kept as display-only social proof block

### No schema changes
`professional_areas` and `professions` tables already exist and are fully populated.

---

## Out of scope
- Profession-level landing pages for SEO (covered by the B branch of the A/B test if it wins)
- Hero copy changes ("Un électricien, un médecin, un développeur…") — can follow as a separate PR
- Name/business full-text search page — current `SearchBar` UX is unchanged for now
