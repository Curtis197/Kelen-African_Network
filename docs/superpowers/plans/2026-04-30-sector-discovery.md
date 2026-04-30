# Sector-Based Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the home-page dropdown filter bar with a mobile-first sector grid, add dedicated `/secteur/[slug]` pages, and delete the legacy `/recherche` page.

**Architecture:** A shared `SectorGrid` component on the home page links to server-rendered sector pages. Each sector page has a client shell for chip + location filtering. Two A/B branches (Tasks 8A / 8B) test filter-in-place vs. profession sub-pages — both share the same sector page shell from Task 6.

**Tech Stack:** Next.js App Router (server + client components), Supabase JS v2, Lucide React, Vitest, Tailwind CSS, TypeScript.

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `lib/utils/sector-icons.ts` | Shared Lucide icon map for sector slugs |
| Create | `components/landing/SectorGrid.tsx` | 2-col grid of sector tiles with show-all toggle |
| Create | `app/(marketing)/secteur/[slug]/page.tsx` | Server component, generates static params |
| Create | `app/(marketing)/secteur/[slug]/SectorPageClient.tsx` | Client shell: chips, location filter, pro cards |
| Modify | `lib/actions/taxonomy.ts` | Add `getAreasSortedByPopularity()` |
| Modify | `lib/actions/professionals.ts` | Add `getProfessionalsByArea()` |
| Modify | `app/(marketing)/page.tsx` | Replace directory with SectorGrid + featured block |
| Modify | `components/landing/ProfessionalDirectory.tsx` | Strip filter controls, display-only |
| Modify | `components/shared/SearchBar.tsx` | Change submit target to `/?q=...` |
| Modify | `next.config.ts` | Add `301 /recherche → /` |
| Modify | `lib/utils/constants.ts` | Update `FOOTER_LINKS[plateforme]` to point to `/` |
| Delete | `app/(validation)/recherche/page.tsx` | Replaced by sector discovery |
| Delete | `components/shared/FilterPanel.tsx` | Only consumer was recherche/page.tsx |
| Create (branch A) | `app/(marketing)/secteur/[slug]/SectorPageClient.tsx` | Chips filter in place, `?profession=slug` URL |
| Create (branch B) | `app/(marketing)/secteur/[slug]/[profession-slug]/page.tsx` | Profession sub-page with SEO metadata |

> **Note on `CATEGORIES`:** The constant is kept in `lib/utils/constants.ts` — it is still used by `ProProjectForm.tsx`, `ProProjectEditForm.tsx`, `EditClientProjectPage.tsx`, and admin pages. Only `FilterPanel.tsx` (which we're deleting) is removed.

> **Note on selection mode:** `ProfessionalDirectory` currently supports a project-selection flow (`?projectId=xxx&areaId=yyy`). This plan strips that from the home page. Migration of selection mode to sector pages is a follow-up PR.

---

## Task 1: Tombstone `/recherche` and fix `SearchBar`

**Files:**
- Modify: `next.config.ts`
- Modify: `components/shared/SearchBar.tsx`
- Modify: `lib/utils/constants.ts`
- Delete: `app/(validation)/recherche/page.tsx`
- Delete: `components/shared/FilterPanel.tsx`

- [ ] **Step 1: Add redirect in next.config.ts**

Open `next.config.ts` and add to the `redirects()` array:

```typescript
{
  source: "/recherche",
  destination: "/",
  permanent: true,
},
```

Full file after change:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/pour-les-pros",
        destination: "/pour-les-professionnels",
        permanent: true,
      },
      {
        source: "/tarifs",
        destination: "/pour-les-professionnels/tarifs",
        permanent: true,
      },
      {
        source: "/recherche",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
```

- [ ] **Step 2: Update SearchBar submit target**

In `components/shared/SearchBar.tsx`, change line 28:

Old:
```typescript
router.push(`/recherche?${params.toString()}`);
```

New:
```typescript
router.push(`/?${params.toString()}`);
```

- [ ] **Step 3: Update FOOTER_LINKS in constants.ts**

In `lib/utils/constants.ts`, change the `plateforme` entry that points to `/recherche`:

Old:
```typescript
{ href: "/recherche", label: "Rechercher" },
```

New:
```typescript
{ href: "/", label: "Rechercher" },
```

- [ ] **Step 4: Delete the recherche page**

Delete the file `app/(validation)/recherche/page.tsx`.

- [ ] **Step 5: Verify FilterPanel has no other consumers**

Run:
```bash
grep -r "FilterPanel" app components lib --include="*.tsx" --include="*.ts" -l
```

Expected output: only `components/shared/FilterPanel.tsx` itself (since recherche/page.tsx is deleted). If no other consumers appear, delete `components/shared/FilterPanel.tsx`.

- [ ] **Step 6: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add next.config.ts components/shared/SearchBar.tsx lib/utils/constants.ts
git rm app/\(validation\)/recherche/page.tsx components/shared/FilterPanel.tsx
git commit -m "feat: redirect /recherche to / and remove legacy search page"
```

---

## Task 2: Add `getAreasSortedByPopularity()` server action

**Files:**
- Modify: `lib/actions/taxonomy.ts`
- Create: `__tests__/lib/actions/taxonomy.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/actions/taxonomy.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { getAreasSortedByPopularity } from '@/lib/actions/taxonomy'

const mockAreas = [
  { id: '1', name: 'Construction', slug: 'batiment-travaux-publics', sort_order: 1 },
  { id: '2', name: 'Santé', slug: 'sante-bien-etre', sort_order: 2 },
  { id: '3', name: 'Digital', slug: 'digital-tech', sort_order: 3 },
  { id: '4', name: 'Juridique', slug: 'juridique-administratif', sort_order: 4 },
  { id: '5', name: 'Éducation', slug: 'education-formation', sort_order: 5 },
  { id: '6', name: 'Architecture', slug: 'architecture-design', sort_order: 6 },
  { id: '7', name: 'Mécanique', slug: 'mecanique-reparation', sort_order: 7 },
]

const mockProfessionalRows = [
  { area_id: '1' }, { area_id: '1' }, { area_id: '1' }, // 3 for id:1
  { area_id: '2' }, { area_id: '2' },                   // 2 for id:2
  { area_id: '7' }, { area_id: '7' }, { area_id: '7' }, { area_id: '7' }, // 4 for id:7
]

function makeMockSupabase() {
  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'professional_areas') {
        return { select: vi.fn().mockResolvedValue({ data: mockAreas, error: null }) }
      }
      if (table === 'professionals') {
        return {
          select: vi.fn().mockReturnValue({
            neq: vi.fn().mockResolvedValue({ data: mockProfessionalRows, error: null }),
          }),
        }
      }
    }),
  }
}

describe('getAreasSortedByPopularity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(createClient as any).mockResolvedValue(makeMockSupabase())
  })

  it('returns top 6 areas sorted by professional count descending', async () => {
    const result = await getAreasSortedByPopularity()
    expect(result).toHaveLength(6)
    expect(result[0].slug).toBe('mecanique-reparation')
    expect(result[0].professionalCount).toBe(4)
    expect(result[1].slug).toBe('batiment-travaux-publics')
    expect(result[1].professionalCount).toBe(3)
  })

  it('returns all areas when passed { all: true }', async () => {
    const result = await getAreasSortedByPopularity({ all: true })
    expect(result).toHaveLength(7)
  })

  it('returns [] when supabase returns no areas', async () => {
    ;(createClient as any).mockResolvedValue({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'professional_areas') {
          return { select: vi.fn().mockResolvedValue({ data: null, error: null }) }
        }
        if (table === 'professionals') {
          return {
            select: vi.fn().mockReturnValue({
              neq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }
        }
      }),
    })
    const result = await getAreasSortedByPopularity()
    expect(result).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/lib/actions/taxonomy.test.ts
```

Expected: FAIL — `getAreasSortedByPopularity` is not exported from `taxonomy.ts`.

- [ ] **Step 3: Implement `getAreasSortedByPopularity` in `lib/actions/taxonomy.ts`**

Add after the `getAllProfessions` function (before the `// Admin actions` comment):

```typescript
export type AreaWithCount = ProfessionalArea & { professionalCount: number };

export async function getAreasSortedByPopularity(
  options?: { all?: boolean }
): Promise<AreaWithCount[]> {
  const supabase = await createClient();

  const [{ data: areas }, { data: counts }] = await Promise.all([
    supabase.from("professional_areas").select("*"),
    supabase.from("professionals").select("area_id").neq("status", "black"),
  ]);

  if (!areas) return [];

  const countMap = (counts || []).reduce<Record<string, number>>((acc, row) => {
    if (row.area_id) acc[row.area_id] = (acc[row.area_id] ?? 0) + 1;
    return acc;
  }, {});

  const sorted = areas
    .map((area) => ({ ...area, professionalCount: countMap[area.id] ?? 0 }))
    .sort((a, b) => b.professionalCount - a.professionalCount);

  return options?.all ? sorted : sorted.slice(0, 6);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run __tests__/lib/actions/taxonomy.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/actions/taxonomy.ts __tests__/lib/actions/taxonomy.test.ts
git commit -m "feat: add getAreasSortedByPopularity server action"
```

---

## Task 3: Add `getProfessionalsByArea()` server action

**Files:**
- Modify: `lib/actions/professionals.ts`
- Create: `__tests__/lib/actions/professionals.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/actions/professionals.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { getProfessionalsByArea } from '@/lib/actions/professionals'

const mockArea = { id: 'area-uuid-1', slug: 'sante-bien-etre' }
const mockProfession = { id: 'prof-uuid-1', slug: 'medecin', area_id: 'area-uuid-1' }
const mockProfessionals = [
  { id: 'p1', slug: 'dr-koné', business_name: 'Cabinet Koné', area_id: 'area-uuid-1', status: 'gold', recommendation_count: 5, signal_count: 3, avg_rating: 4.8, review_count: 10 },
]

function makeMockSupabase() {
  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'professional_areas') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockArea, error: null }),
            }),
          }),
        }
      }
      if (table === 'professions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockProfession, error: null }),
              }),
            }),
          }),
        }
      }
      if (table === 'professionals') {
        return {
          select: vi.fn().mockReturnValue({
            count: 1,
            neq: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            ilike: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            range: vi.fn().mockResolvedValue({ data: mockProfessionals, count: 1, error: null }),
          }),
        }
      }
    }),
  }
}

describe('getProfessionalsByArea', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(createClient as any).mockResolvedValue(makeMockSupabase())
  })

  it('returns professionals filtered by area slug', async () => {
    const result = await getProfessionalsByArea('sante-bien-etre')
    expect(result.professionals).toHaveLength(1)
    expect(result.professionals[0].slug).toBe('dr-koné')
  })

  it('returns empty when area slug not found', async () => {
    ;(createClient as any).mockResolvedValue({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'professional_areas') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
              }),
            }),
          }
        }
      }),
    })
    const result = await getProfessionalsByArea('does-not-exist')
    expect(result.professionals).toEqual([])
    expect(result.totalCount).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/lib/actions/professionals.test.ts
```

Expected: FAIL — `getProfessionalsByArea` is not exported.

- [ ] **Step 3: Implement `getProfessionalsByArea` in `lib/actions/professionals.ts`**

Add at the end of the file:

```typescript
export async function getProfessionalsByArea(
  areaSlug: string,
  professionSlug?: string,
  location?: string
): Promise<ProfessionalsData> {
  const supabase = await createClient();

  const { data: area, error: areaError } = await supabase
    .from("professional_areas")
    .select("id")
    .eq("slug", areaSlug)
    .single();

  if (areaError || !area) return { professionals: [], totalCount: 0 };

  const filter: ProfessionalsFilter = {
    areaId: area.id,
    page: 1,
    pageSize: 12,
  };

  if (professionSlug) {
    const { data: profession } = await supabase
      .from("professions")
      .select("id")
      .eq("slug", professionSlug)
      .eq("area_id", area.id)
      .single();
    if (profession) filter.professionId = profession.id;
  }

  if (location) {
    filter.city = location;
  }

  return getProfessionals(filter);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run __tests__/lib/actions/professionals.test.ts
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/actions/professionals.ts __tests__/lib/actions/professionals.test.ts
git commit -m "feat: add getProfessionalsByArea server action"
```

---

## Task 4: Create shared sector icon map and `SectorGrid` component

**Files:**
- Create: `lib/utils/sector-icons.ts`
- Create: `components/landing/SectorGrid.tsx`

- [ ] **Step 1: Create `lib/utils/sector-icons.ts`**

```typescript
import {
  HardHat, Stethoscope, Laptop, Scale, GraduationCap, PenRuler,
  Wrench, ShoppingBag, Building2, PaintRoller, Cog, HeartHandshake,
  Megaphone, LineChart, LayoutGrid,
} from "lucide-react";
import type { LucideProps } from "lucide-react";

type IconComponent = React.ComponentType<LucideProps>;

const SECTOR_ICONS: Record<string, IconComponent> = {
  "batiment-travaux-publics": HardHat,
  "sante-bien-etre": Stethoscope,
  "digital-tech": Laptop,
  "juridique-administratif": Scale,
  "education-formation": GraduationCap,
  "architecture-design": PenRuler,
  "mecanique-reparation": Wrench,
  "commerce-vente": ShoppingBag,
  "immobilier-foncier": Building2,
  "renovation-finitions": PaintRoller,
  "ingenierie-genie-civil": Cog,
  "services-personne": HeartHandshake,
  "marketing-evenementiel": Megaphone,
  "expertise-conseil": LineChart,
  "autre": LayoutGrid,
};

export function getSectorIcon(slug: string): IconComponent {
  return SECTOR_ICONS[slug] ?? LayoutGrid;
}
```

- [ ] **Step 2: Create `components/landing/SectorGrid.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSectorIcon } from "@/lib/utils/sector-icons";
import type { AreaWithCount } from "@/lib/actions/taxonomy";

interface SectorGridProps {
  areas: AreaWithCount[];
}

export function SectorGrid({ areas }: SectorGridProps) {
  const router = useRouter();
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? areas : areas.slice(0, 6);

  return (
    <div className="mb-16">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map((area) => {
          const Icon = getSectorIcon(area.slug);
          return (
            <button
              key={area.id}
              onClick={() => router.push(`/secteur/${area.slug}`)}
              className="flex flex-col items-start gap-3 rounded-2xl bg-surface-container-low p-4 text-left transition-all hover:bg-kelen-green-50 hover:ring-1 hover:ring-kelen-green-200 active:scale-95"
            >
              <div className="rounded-xl bg-surface-container-lowest p-2.5">
                <Icon className="h-6 w-6 text-kelen-green-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface leading-tight">{area.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {area.professionalCount} professionnel{area.professionalCount !== 1 ? "s" : ""}
                </p>
              </div>
            </button>
          );
        })}
      </div>
      {areas.length > 6 && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="mt-4 text-sm font-black uppercase tracking-widest text-kelen-green-600 hover:text-kelen-green-700"
        >
          {showAll ? "Voir moins" : `Voir tous les secteurs (${areas.length})`}
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/utils/sector-icons.ts components/landing/SectorGrid.tsx
git commit -m "feat: add SectorGrid component and sector icon map"
```

---

## Task 5: Update home page and simplify `ProfessionalDirectory`

**Files:**
- Modify: `app/(marketing)/page.tsx`
- Modify: `components/landing/ProfessionalDirectory.tsx`

- [ ] **Step 1: Replace `app/(marketing)/page.tsx`**

```tsx
export const revalidate = 3600;

import { SectorGrid } from "@/components/landing/SectorGrid";
import { ProfessionalDirectory } from "@/components/landing/ProfessionalDirectory";
import { createClient } from "@/lib/supabase/server";
import { getAreasSortedByPopularity } from "@/lib/actions/taxonomy";

export default async function SearchHubPage() {
  const supabase = await createClient();

  const [areas, { data: featured }] = await Promise.all([
    getAreasSortedByPopularity({ all: true }),
    supabase
      .from("professionals")
      .select("*")
      .order("recommendation_count", { ascending: false })
      .limit(12),
  ]);

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface sm:text-5xl lg:text-6xl font-display">
            Trouvez le bon professionnel.
            <br />Construisez en confiance.
          </h1>
          <p className="mt-4 text-xl text-muted-foreground leading-relaxed">
            Un électricien, un médecin, un développeur, un avocat — vérifiés sur Kelen.
          </p>
        </div>
        <SectorGrid areas={areas} />
        <ProfessionalDirectory initialPros={featured || []} />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Replace `components/landing/ProfessionalDirectory.tsx` with a display-only version**

```tsx
"use client";

import { Professional } from "@/lib/supabase/types";
import { ProfessionalCard } from "@/components/shared/ProfessionalCard";

interface ProfessionalDirectoryProps {
  initialPros: Professional[];
}

export function ProfessionalDirectory({ initialPros }: ProfessionalDirectoryProps) {
  if (initialPros.length === 0) return null;

  return (
    <section>
      <h2 className="mb-6 text-2xl font-bold text-on-surface">
        Professionnels en vedette
      </h2>
      <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {initialPros.map((pro) => {
          const portfolio = (pro as any).professional_portfolio?.[0];
          const customDomain =
            portfolio?.domain_status === "active" ? portfolio.custom_domain : null;
          return (
            <ProfessionalCard
              key={`${pro.id}-${pro.slug}`}
              id={pro.id}
              slug={pro.slug}
              businessName={pro.business_name}
              ownerName={pro.owner_name}
              category={pro.category}
              city={pro.city}
              country={pro.country}
              status={pro.status}
              recommendationCount={pro.recommendation_count}
              signalCount={pro.signal_count}
              avgRating={pro.avg_rating}
              reviewCount={pro.review_count}
              profilePictureUrl={pro.portfolio_photos?.[0]}
              customDomain={customDomain}
            />
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/\(marketing\)/page.tsx components/landing/ProfessionalDirectory.tsx
git commit -m "feat: replace home page filter bar with SectorGrid"
```

---

## Task 6: Build sector page shell (shared by both A/B branches)

**Files:**
- Create: `app/(marketing)/secteur/[slug]/page.tsx`
- Create: `app/(marketing)/secteur/[slug]/SectorPageClient.tsx`

- [ ] **Step 1: Create `app/(marketing)/secteur/[slug]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAreas, getProfessionsByArea } from "@/lib/actions/taxonomy";
import { getProfessionalsByArea } from "@/lib/actions/professionals";
import { SectorPageClient } from "./SectorPageClient";

interface SectorPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const areas = await getAreas();
  return areas.map((area) => ({ slug: area.slug }));
}

export async function generateMetadata({ params }: SectorPageProps): Promise<Metadata> {
  const { slug } = await params;
  const areas = await getAreas();
  const area = areas.find((a) => a.slug === slug);
  if (!area) return {};
  return {
    title: `${area.name} — Kelen`,
    description: `Trouvez des professionnels en ${area.name} sur Kelen.`,
  };
}

export default async function SectorPage({ params }: SectorPageProps) {
  const { slug } = await params;
  const areas = await getAreas();
  const area = areas.find((a) => a.slug === slug);
  if (!area) notFound();

  const [professions, { professionals, totalCount }] = await Promise.all([
    getProfessionsByArea(area.id),
    getProfessionalsByArea(slug),
  ]);

  return (
    <SectorPageClient
      area={area}
      professions={professions}
      initialProfessionals={professionals}
      initialTotalCount={totalCount}
    />
  );
}
```

- [ ] **Step 2: Create `app/(marketing)/secteur/[slug]/SectorPageClient.tsx`**

This is the **Branch A (filter-in-place) version** — see Task 8A to swap it for Branch B.

```tsx
"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { ProfessionalCard } from "@/components/shared/ProfessionalCard";
import { getProfessionalsByArea } from "@/lib/actions/professionals";
import { getSectorIcon } from "@/lib/utils/sector-icons";
import type { ProfessionalArea, Profession } from "@/lib/types/taxonomy";
import type { Professional } from "@/lib/supabase/types";

interface SectorPageClientProps {
  area: ProfessionalArea;
  professions: Profession[];
  initialProfessionals: Professional[];
  initialTotalCount: number;
}

export function SectorPageClient({
  area,
  professions,
  initialProfessionals,
  initialTotalCount,
}: SectorPageClientProps) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [professionals, setProfessionals] = useState(initialProfessionals);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [isPending, startTransition] = useTransition();

  const Icon = getSectorIcon(area.slug);

  const refresh = (professionSlug: string | null, loc: string) => {
    startTransition(async () => {
      const result = await getProfessionalsByArea(
        area.slug,
        professionSlug ?? undefined,
        loc || undefined
      );
      setProfessionals(result.professionals);
      setTotalCount(result.totalCount);
    });
  };

  const handleChipSelect = (slug: string | null) => {
    setSelectedSlug(slug);
    refresh(slug, location);
  };

  const handleLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    refresh(selectedSlug, location);
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="rounded-2xl bg-surface-container-low p-3">
          <Icon className="h-10 w-10 text-kelen-green-600" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">{area.name}</h1>
          <p className="text-sm text-muted-foreground">
            {totalCount} professionnel{totalCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Profession chips */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => handleChipSelect(null)}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-all ${
            selectedSlug === null
              ? "bg-kelen-green-600 text-white"
              : "bg-surface-container-low text-on-surface hover:bg-kelen-green-50"
          }`}
        >
          Tous
        </button>
        {professions.map((p) => (
          <button
            key={p.id}
            onClick={() => handleChipSelect(p.slug)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-all ${
              selectedSlug === p.slug
                ? "bg-kelen-green-600 text-white"
                : "bg-surface-container-low text-on-surface hover:bg-kelen-green-50"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Location filter */}
      <form onSubmit={handleLocationSubmit} className="mb-8 flex max-w-sm gap-2">
        <input
          type="text"
          placeholder="Ville ou pays"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="flex-1 rounded-2xl border-none bg-surface-container-low px-4 py-3 text-sm shadow-sm focus:ring-2 focus:ring-kelen-green-500 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-2xl bg-kelen-green-600 px-4 py-3 text-sm font-bold text-white hover:bg-kelen-green-700"
        >
          OK
        </button>
      </form>

      {/* Results */}
      {isPending ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-kelen-green-600" />
        </div>
      ) : professionals.length > 0 ? (
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {professionals.map((pro) => {
            const portfolio = (pro as any).professional_portfolio?.[0];
            const customDomain =
              portfolio?.domain_status === "active" ? portfolio.custom_domain : null;
            return (
              <ProfessionalCard
                key={`${pro.id}-${pro.slug}`}
                id={pro.id}
                slug={pro.slug}
                businessName={pro.business_name}
                ownerName={pro.owner_name}
                category={pro.category}
                city={pro.city}
                country={pro.country}
                status={pro.status}
                recommendationCount={pro.recommendation_count}
                signalCount={pro.signal_count}
                avgRating={pro.avg_rating}
                reviewCount={pro.review_count}
                profilePictureUrl={pro.portfolio_photos?.[0]}
                customDomain={customDomain}
              />
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="text-lg font-bold text-on-surface">Aucun professionnel dans cette catégorie</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Essayez une autre ville ou retirez le filtre de profession.
          </p>
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Run all tests to confirm nothing regressed**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/\(marketing\)/secteur/
git commit -m "feat: add sector page with profession chips and location filter"
```

---

## Task 7: Cleanup — verify CATEGORIES and FilterPanel are safe to leave

**Files:**
- Read-only verification

- [ ] **Step 1: Confirm CATEGORIES remaining consumers are all non-discovery**

Run:
```bash
grep -r "CATEGORIES" app components lib --include="*.tsx" --include="*.ts" -l
```

Expected files (non-discovery, keep as-is):
- `lib/utils/constants.ts` — definition
- `app/(client)/projets/[id]/modifier/EditClientProjectPage.tsx` — project form
- `app/(admin)/admin/client-projects/page.tsx` — admin view
- `components/pro/ProProjectEditForm.tsx` — pro form
- `components/pro/ProProjectForm.tsx` — pro form
- `app/(marketing)/faq/page.tsx` — FAQ content
- `app/(marketing-pro)/pour-les-professionnels/faq/page.tsx` — FAQ content

If `FilterPanel.tsx` does NOT appear in this list (you deleted it in Task 1), proceed. If any unexpected discovery-related file still imports CATEGORIES, clean it up now.

- [ ] **Step 2: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 3: Build check**

```bash
npx next build
```

Expected: build succeeds. The `/recherche` redirect will appear in the build output under "Redirects".

- [ ] **Step 4: Commit**

```bash
git commit -m "chore: verify cleanup — no dangling CATEGORIES or FilterPanel imports"
```

If there was nothing to commit, that is fine — no commit needed.

---

## Task 8A: Branch A — Filter in place (A/B test)

> **Create this branch from the commit after Task 7:**
> ```bash
> git checkout -b feat/sector-filter-inplace
> ```
>
> The `SectorPageClient.tsx` written in Task 6 already implements filter-in-place. Task 8A only adds URL param reflection so the filtered state is shareable.

**Files:**
- Modify: `app/(marketing)/secteur/[slug]/SectorPageClient.tsx`

- [ ] **Step 1: Add URL param sync to SectorPageClient**

Replace the `handleChipSelect` function and add `useSearchParams` / `usePathname` imports:

At the top of `SectorPageClient.tsx`, update imports:

```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ProfessionalCard } from "@/components/shared/ProfessionalCard";
import { getProfessionalsByArea } from "@/lib/actions/professionals";
import { getSectorIcon } from "@/lib/utils/sector-icons";
import type { ProfessionalArea, Profession } from "@/lib/types/taxonomy";
import type { Professional } from "@/lib/supabase/types";
```

Replace the component body's state + handlers with:

```tsx
  const router = useRouter();
  const pathname = usePathname();
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [professionals, setProfessionals] = useState(initialProfessionals);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [isPending, startTransition] = useTransition();

  const Icon = getSectorIcon(area.slug);

  const refresh = (professionSlug: string | null, loc: string) => {
    const params = new URLSearchParams();
    if (professionSlug) params.set("profession", professionSlug);
    if (loc) params.set("city", loc);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });

    startTransition(async () => {
      const result = await getProfessionalsByArea(
        area.slug,
        professionSlug ?? undefined,
        loc || undefined
      );
      setProfessionals(result.professionals);
      setTotalCount(result.totalCount);
    });
  };

  const handleChipSelect = (slug: string | null) => {
    setSelectedSlug(slug);
    refresh(slug, location);
  };

  const handleLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    refresh(selectedSlug, location);
  };
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit on the A branch**

```bash
git add app/\(marketing\)/secteur/\[slug\]/SectorPageClient.tsx
git commit -m "feat(ab-a): sector page chips filter in place with URL params"
```

---

## Task 8B: Branch B — Profession sub-pages (A/B test)

> **Create this branch from the same commit after Task 7 (NOT from branch A):**
> ```bash
> git checkout feat/professional-dashboard  # or whichever base branch Task 7 ended on
> git checkout -b feat/sector-profession-page
> ```

**Files:**
- Modify: `app/(marketing)/secteur/[slug]/SectorPageClient.tsx`
- Create: `app/(marketing)/secteur/[slug]/[profession-slug]/page.tsx`

- [ ] **Step 1: Update SectorPageClient chips to navigate**

Replace the `handleChipSelect` function in `app/(marketing)/secteur/[slug]/SectorPageClient.tsx`.

Add `useRouter` import (already present from Task 6 — confirm it's there). Then replace the chip handler:

```tsx
  const router = useRouter();

  const handleChipSelect = (professionSlug: string | null) => {
    if (professionSlug === null) {
      router.push(`/secteur/${area.slug}`);
    } else {
      router.push(`/secteur/${area.slug}/${professionSlug}`);
    }
  };
```

Keep `initialProfessionals` and the results grid — the sector page still shows all professionals by default. Only the chip `onClick` changes: instead of filtering in place, it navigates to the profession sub-page. Remove `useTransition`, `setProfessionals`, and `setPendingstate` since the sector page no longer re-fetches:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { getSectorIcon } from "@/lib/utils/sector-icons";
import { ProfessionalCard } from "@/components/shared/ProfessionalCard";
import type { ProfessionalArea, Profession } from "@/lib/types/taxonomy";
import type { Professional } from "@/lib/supabase/types";

interface SectorPageClientProps {
  area: ProfessionalArea;
  professions: Profession[];
  initialProfessionals: Professional[];
  initialTotalCount: number;
}

export function SectorPageClient({
  area,
  professions,
  initialProfessionals,
  initialTotalCount,
}: SectorPageClientProps) {
  const router = useRouter();
  const Icon = getSectorIcon(area.slug);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-4">
        <div className="rounded-2xl bg-surface-container-low p-3">
          <Icon className="h-10 w-10 text-kelen-green-600" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">{area.name}</h1>
          <p className="text-sm text-muted-foreground">
            {initialTotalCount} professionnel{initialTotalCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => router.push(`/secteur/${area.slug}`)}
          className="shrink-0 rounded-full bg-kelen-green-600 px-4 py-2 text-sm font-bold text-white"
        >
          Tous
        </button>
        {professions.map((p) => (
          <button
            key={p.id}
            onClick={() => router.push(`/secteur/${area.slug}/${p.slug}`)}
            className="shrink-0 rounded-full bg-surface-container-low px-4 py-2 text-sm font-bold text-on-surface hover:bg-kelen-green-50 transition-all"
          >
            {p.name}
          </button>
        ))}
      </div>

      {initialProfessionals.length > 0 ? (
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {initialProfessionals.map((pro) => {
            const portfolio = (pro as any).professional_portfolio?.[0];
            const customDomain =
              portfolio?.domain_status === "active" ? portfolio.custom_domain : null;
            return (
              <ProfessionalCard
                key={`${pro.id}-${pro.slug}`}
                id={pro.id}
                slug={pro.slug}
                businessName={pro.business_name}
                ownerName={pro.owner_name}
                category={pro.category}
                city={pro.city}
                country={pro.country}
                status={pro.status}
                recommendationCount={pro.recommendation_count}
                signalCount={pro.signal_count}
                avgRating={pro.avg_rating}
                reviewCount={pro.review_count}
                profilePictureUrl={pro.portfolio_photos?.[0]}
                customDomain={customDomain}
              />
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="text-lg font-bold text-on-surface">Aucun professionnel dans cette catégorie</p>
        </div>
      )}
    </main>
  );
}
```

The sector page server component (`app/(marketing)/secteur/[slug]/page.tsx`) keeps the same props as Task 6 — no changes needed.

- [ ] **Step 2: Create `app/(marketing)/secteur/[slug]/[profession-slug]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAreas, getProfessionsByArea } from "@/lib/actions/taxonomy";
import { getProfessionalsByArea } from "@/lib/actions/professionals";
import { ProfessionalCard } from "@/components/shared/ProfessionalCard";
import { getSectorIcon } from "@/lib/utils/sector-icons";
import Link from "next/link";

interface ProfessionPageProps {
  params: Promise<{ slug: string; "profession-slug": string }>;
}

export async function generateStaticParams() {
  const areas = await getAreas();
  const params: { slug: string; "profession-slug": string }[] = [];
  for (const area of areas) {
    const professions = await getProfessionsByArea(area.id);
    for (const p of professions) {
      params.push({ slug: area.slug, "profession-slug": p.slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: ProfessionPageProps): Promise<Metadata> {
  const { slug, "profession-slug": professionSlug } = await params;
  const areas = await getAreas();
  const area = areas.find((a) => a.slug === slug);
  if (!area) return {};
  const professions = await getProfessionsByArea(area.id);
  const profession = professions.find((p) => p.slug === professionSlug);
  if (!profession) return {};
  return {
    title: `${profession.name} — ${area.name} | Kelen`,
    description: `Trouvez un ${profession.name} sur Kelen. Professionnels vérifiés en ${area.name}.`,
  };
}

export default async function ProfessionPage({ params }: ProfessionPageProps) {
  const { slug, "profession-slug": professionSlug } = await params;
  const areas = await getAreas();
  const area = areas.find((a) => a.slug === slug);
  if (!area) notFound();

  const professions = await getProfessionsByArea(area.id);
  const profession = professions.find((p) => p.slug === professionSlug);
  if (!profession) notFound();

  const { professionals, totalCount } = await getProfessionalsByArea(slug, professionSlug);

  const Icon = getSectorIcon(area.slug);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          href={`/secteur/${area.slug}`}
          className="text-sm font-bold text-kelen-green-600 hover:text-kelen-green-700"
        >
          ← {area.name}
        </Link>
      </div>

      <div className="mb-8 flex items-center gap-4">
        <div className="rounded-2xl bg-surface-container-low p-3">
          <Icon className="h-10 w-10 text-kelen-green-600" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">{profession.name}</h1>
          <p className="text-sm text-muted-foreground">
            {totalCount} professionnel{totalCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {professionals.length > 0 ? (
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {professionals.map((pro) => {
            const portfolio = (pro as any).professional_portfolio?.[0];
            const customDomain =
              portfolio?.domain_status === "active" ? portfolio.custom_domain : null;
            return (
              <ProfessionalCard
                key={`${pro.id}-${pro.slug}`}
                id={pro.id}
                slug={pro.slug}
                businessName={pro.business_name}
                ownerName={pro.owner_name}
                category={pro.category}
                city={pro.city}
                country={pro.country}
                status={pro.status}
                recommendationCount={pro.recommendation_count}
                signalCount={pro.signal_count}
                avgRating={pro.avg_rating}
                reviewCount={pro.review_count}
                profilePictureUrl={pro.portfolio_photos?.[0]}
                customDomain={customDomain}
              />
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="text-lg font-bold text-on-surface">Aucun professionnel pour cette profession</p>
          <p className="mt-2 text-sm text-muted-foreground">
            <Link href={`/secteur/${area.slug}`} className="text-kelen-green-600 hover:underline">
              Voir tous les professionnels en {area.name}
            </Link>
          </p>
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Run all tests**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 5: Commit on the B branch**

```bash
git add app/\(marketing\)/secteur/
git commit -m "feat(ab-b): sector profession sub-pages with SEO metadata"
```

---

## Self-Review Checklist (do not skip)

Before claiming this plan is complete, verify:

- [ ] `getAreasSortedByPopularity` — defined in Task 2, used in Task 5 home page. Signature matches: `(): Promise<AreaWithCount[]>` and `({ all: true }): Promise<AreaWithCount[]>`.
- [ ] `AreaWithCount` — exported from `lib/actions/taxonomy.ts` in Task 2, imported by `SectorGrid` in Task 4.
- [ ] `getProfessionalsByArea` — defined in `lib/actions/professionals.ts` (Task 3), used in sector page (Task 6). Both use `(areaSlug, professionSlug?, location?)` signature.
- [ ] `getProfessionsByArea` (taxonomy) vs `getProfessionalsByArea` (professionals) — different functions, different files. One returns profession types, the other returns people. Confirm imports are correct in sector page.
- [ ] `SectorPageClient` props differ between Branch A and Branch B — Branch A: `{ area, professions, initialProfessionals, initialTotalCount }`. Branch B: `{ area, professions, totalCount }`. The sector page server component must pass the right props on each branch.
- [ ] Footer link `/recherche` updated to `/` in Task 1 (constants.ts `FOOTER_LINKS`).
- [ ] `/recherche` redirect added to `next.config.ts` in Task 1.
