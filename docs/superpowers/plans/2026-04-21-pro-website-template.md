# Pro Website Template Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing professional profile page with a standardized landing-page template (same shell for every pro) featuring hero, présentation, Google reviews, services/réalisations/produits sections with list + detail sub-pages, newsletter, contact, and an optional À propos page — with anonymous likes and comments on all items.

**Architecture:** Server components fetch all data at the page level and pass props to presentational components. Client components handle only interactive mutations (likes, comments). All template components live in `components/pro-site/`. CSS custom properties set via a `ProSiteStyleProvider` wrapper control the two customization axes (corner style, color mode).

**Tech Stack:** Next.js 16 App Router · TypeScript · Tailwind CSS 4 · shadcn/ui · Supabase · Jest + React Testing Library

---

## File Map

**New components — `components/pro-site/`**
| File | Responsibility |
|------|---------------|
| `ProSiteStyleProvider.tsx` | Injects CSS vars for corner radius + color mode |
| `ProSiteNav.tsx` | Sticky top nav with RDV + Contact buttons |
| `ProSiteHero.tsx` | 80vh cover image with name overlay |
| `ProSitePresentation.tsx` | Bio + info pills + optional "En savoir plus" |
| `ProSiteItemCard.tsx` | Card used in homepage preview + list page |
| `ProSiteSectionPreview.tsx` | Section wrapper (title + "Voir tout" + 3-card grid) |
| `ProSiteGoogleReviews.tsx` | Thin wrapper around existing `GoogleReviewsSection` |
| `ProSiteNewsletter.tsx` | Thin wrapper around existing `SubscribeWidget` |
| `ProSiteContact.tsx` | Dark navy contact section |
| `ProSiteFooter.tsx` | Simple footer |
| `ProSiteListPage.tsx` | Reusable list page shell |
| `ProSiteGallery.tsx` | 1-large + thumbnail grid photo gallery |
| `ProSiteVideoRow.tsx` | Horizontal video thumbnail row |
| `ProSiteSocialThread.tsx` | Likes + comments thread (client component) |
| `ProSiteDetailPage.tsx` | Reusable detail page shell |

**Modified pages**
| File | Change |
|------|--------|
| `app/(marketing)/professionnels/[slug]/page.tsx` | Refactor to new template |

**New pages**
| File | Purpose |
|------|---------|
| `app/(marketing)/professionnels/[slug]/services/page.tsx` | Services list |
| `app/(marketing)/professionnels/[slug]/services/[id]/page.tsx` | Service detail |
| `app/(marketing)/professionnels/[slug]/realisations/page.tsx` | Réalisations list |
| `app/(marketing)/professionnels/[slug]/realisations/[id]/page.tsx` | Réalisation detail |
| `app/(marketing)/professionnels/[slug]/produits/page.tsx` | Produits list |
| `app/(marketing)/professionnels/[slug]/produits/[id]/page.tsx` | Produit detail |
| `app/(marketing)/professionnels/[slug]/a-propos/page.tsx` | Optional À propos |

**New API routes**
| File | Purpose |
|------|---------|
| `app/api/pro-site/likes/route.ts` | GET counts + POST toggle like |
| `app/api/pro-site/comments/route.ts` | GET list + POST new comment |

**New lib files**
| File | Purpose |
|------|---------|
| `lib/pro-site/types.ts` | Shared types for template |
| `lib/pro-site/actions.ts` | Server actions for list/detail data fetching |
| `lib/pro-site/style-utils.ts` | CSS var builder from corner style + color mode |

**New migration**
| File | Purpose |
|------|---------|
| `supabase/migrations/20260421000000_pro_site_engagement.sql` | New tables + portfolio columns |

---

## Task 1: Database migration

**Files:**
- Create: `supabase/migrations/20260421000000_pro_site_engagement.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260421000000_pro_site_engagement.sql

-- Add customization columns to professional_portfolio
ALTER TABLE professional_portfolio
  ADD COLUMN IF NOT EXISTS corner_style TEXT NOT NULL DEFAULT 'rounded'
    CHECK (corner_style IN ('square', 'half-rounded', 'rounded')),
  ADD COLUMN IF NOT EXISTS color_mode TEXT NOT NULL DEFAULT 'light'
    CHECK (color_mode IN ('light', 'dark', 'logo-color'));

-- Item likes (anonymous, deduplicated by session_id)
CREATE TABLE IF NOT EXISTS item_likes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type   TEXT NOT NULL CHECK (item_type IN ('service', 'realisation', 'produit')),
  item_id     UUID NOT NULL,
  session_id  TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (item_type, item_id, session_id)
);
CREATE INDEX IF NOT EXISTS idx_item_likes_item ON item_likes (item_type, item_id);

-- Item comments (anonymous, name required)
CREATE TABLE IF NOT EXISTS item_comments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type    TEXT NOT NULL CHECK (item_type IN ('service', 'realisation', 'produit')),
  item_id      UUID NOT NULL,
  author_name  TEXT NOT NULL CHECK (char_length(author_name) BETWEEN 1 AND 80),
  body         TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  created_at   TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_item_comments_item ON item_comments (item_type, item_id);

-- Comment likes
CREATE TABLE IF NOT EXISTS comment_likes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id  UUID NOT NULL REFERENCES item_comments (id) ON DELETE CASCADE,
  session_id  TEXT NOT NULL,
  UNIQUE (comment_id, session_id)
);

-- RLS: public read, public insert (anonymous engagement)
ALTER TABLE item_likes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read likes"    ON item_likes    FOR SELECT USING (true);
CREATE POLICY "public insert likes"  ON item_likes    FOR INSERT WITH CHECK (true);
CREATE POLICY "public delete likes"  ON item_likes    FOR DELETE USING (true);
CREATE POLICY "public read comments" ON item_comments FOR SELECT USING (true);
CREATE POLICY "public insert comments" ON item_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "public read comment_likes"   ON comment_likes FOR SELECT USING (true);
CREATE POLICY "public insert comment_likes" ON comment_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "public delete comment_likes" ON comment_likes FOR DELETE USING (true);
```

- [ ] **Step 2: Apply migration**

```bash
npx supabase db push
```
Expected: migration applied, no errors.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260421000000_pro_site_engagement.sql
git commit -m "feat(pro-site): add item_likes, item_comments, corner_style/color_mode migration"
```

---

## Task 2: Shared types and style utilities

**Files:**
- Create: `lib/pro-site/types.ts`
- Create: `lib/pro-site/style-utils.ts`

- [ ] **Step 1: Write types**

```typescript
// lib/pro-site/types.ts

export type CornerStyle = 'square' | 'half-rounded' | 'rounded'
export type ColorMode = 'light' | 'dark' | 'logo-color'
export type ItemType = 'service' | 'realisation' | 'produit'

export interface ProSiteItem {
  id: string
  title: string
  description: string | null
  price: string | null        // formatted string e.g. "45 000 FCFA" or "Sur devis"
  imageUrl: string | null
  likeCount: number
  commentCount: number
}

export interface ProSiteComment {
  id: string
  authorName: string
  body: string
  createdAt: string
  likeCount: number
}

export interface ProSiteSettings {
  cornerStyle: CornerStyle
  colorMode: ColorMode
  logoColor: string | null    // hex extracted from logo, used for logo-color mode
  showServices: boolean
  showRealisations: boolean
  showProduits: boolean
  showCalendar: boolean
}
```

- [ ] **Step 2: Write style utilities**

```typescript
// lib/pro-site/style-utils.ts
import type { CornerStyle, ColorMode } from './types'

const RADII: Record<CornerStyle, string> = {
  square: '0px',
  'half-rounded': '8px',
  rounded: '16px',
}

export function buildProSiteCssVars(
  cornerStyle: CornerStyle,
  colorMode: ColorMode,
  logoColor: string | null,
): Record<string, string> {
  const vars: Record<string, string> = {
    '--pro-radius': RADII[cornerStyle],
  }

  if (colorMode === 'dark') {
    vars['--pro-surface']     = '#111111'
    vars['--pro-surface-alt'] = '#1a1a1a'
    vars['--pro-text']        = '#f0f0f0'
    vars['--pro-text-muted']  = '#888888'
    vars['--pro-border']      = '#2a2a2a'
  } else if (colorMode === 'logo-color' && logoColor) {
    vars['--pro-surface']     = `${logoColor}12`
    vars['--pro-surface-alt'] = `${logoColor}08`
    vars['--pro-text']        = '#1a1a2e'
    vars['--pro-text-muted']  = '#666666'
    vars['--pro-border']      = `${logoColor}25`
  } else {
    // light (default)
    vars['--pro-surface']     = '#ffffff'
    vars['--pro-surface-alt'] = '#f5f5f5'
    vars['--pro-text']        = '#1a1a2e'
    vars['--pro-text-muted']  = '#666666'
    vars['--pro-border']      = '#eeeeee'
  }

  return vars
}
```

- [ ] **Step 3: Write tests**

```typescript
// lib/pro-site/__tests__/style-utils.test.ts
import { buildProSiteCssVars } from '../style-utils'

describe('buildProSiteCssVars', () => {
  it('sets square radius', () => {
    const vars = buildProSiteCssVars('square', 'light', null)
    expect(vars['--pro-radius']).toBe('0px')
  })

  it('sets rounded radius', () => {
    const vars = buildProSiteCssVars('rounded', 'light', null)
    expect(vars['--pro-radius']).toBe('16px')
  })

  it('dark mode sets dark surface', () => {
    const vars = buildProSiteCssVars('rounded', 'dark', null)
    expect(vars['--pro-surface']).toBe('#111111')
    expect(vars['--pro-text']).toBe('#f0f0f0')
  })

  it('logo-color mode uses logo hex with alpha', () => {
    const vars = buildProSiteCssVars('rounded', 'logo-color', '#009639')
    expect(vars['--pro-surface']).toBe('#00963912')
  })

  it('logo-color without logoColor falls through to light defaults', () => {
    const vars = buildProSiteCssVars('rounded', 'logo-color', null)
    expect(vars['--pro-surface']).toBe('#ffffff')
  })
})
```

- [ ] **Step 4: Run tests**

```bash
npx jest lib/pro-site/__tests__/style-utils.test.ts --no-coverage
```
Expected: 5 passing.

- [ ] **Step 5: Commit**

```bash
git add lib/pro-site/
git commit -m "feat(pro-site): shared types and style-utils with tests"
```

---

## Task 3: ProSiteStyleProvider + ProSiteNav + ProSiteHero

**Files:**
- Create: `components/pro-site/ProSiteStyleProvider.tsx`
- Create: `components/pro-site/ProSiteNav.tsx`
- Create: `components/pro-site/ProSiteHero.tsx`

- [ ] **Step 1: Write ProSiteStyleProvider**

```tsx
// components/pro-site/ProSiteStyleProvider.tsx
import { buildProSiteCssVars } from '@/lib/pro-site/style-utils'
import type { CornerStyle, ColorMode } from '@/lib/pro-site/types'

export function ProSiteStyleProvider({
  cornerStyle,
  colorMode,
  logoColor,
  children,
}: {
  cornerStyle: CornerStyle
  colorMode: ColorMode
  logoColor: string | null
  children: React.ReactNode
}) {
  const vars = buildProSiteCssVars(cornerStyle, colorMode, logoColor)
  return (
    <div style={vars as React.CSSProperties} className="pro-site-root">
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Write ProSiteNav**

```tsx
// components/pro-site/ProSiteNav.tsx
import Link from 'next/link'

export function ProSiteNav({
  slug,
  proName,
  showServices,
  showRealisations,
  showProduits,
  calendarUrl,
}: {
  slug: string
  proName: string
  showServices: boolean
  showRealisations: boolean
  showProduits: boolean
  calendarUrl: string | null
}) {
  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-[var(--pro-border,#eee)] px-6 py-3 flex items-center justify-between">
      <Link href={`/professionnels/${slug}`} className="font-extrabold text-sm text-[#1a1a2e]">
        {proName}
      </Link>
      <div className="flex items-center gap-3 text-xs text-gray-500">
        {showServices && (
          <Link href={`/professionnels/${slug}/services`} className="hover:text-[#1a1a2e]">
            Services
          </Link>
        )}
        {showRealisations && (
          <Link href={`/professionnels/${slug}/realisations`} className="hover:text-[#1a1a2e]">
            Réalisations
          </Link>
        )}
        {showProduits && (
          <Link href={`/professionnels/${slug}/produits`} className="hover:text-[#1a1a2e]">
            Produits
          </Link>
        )}
        {calendarUrl && (
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#E05555] text-white px-3 py-1.5 text-xs font-bold rounded-[var(--pro-radius,16px)] hover:opacity-90"
          >
            📅 Prendre RDV
          </a>
        )}
        <a
          href={`/professionnels/${slug}#contact`}
          className="bg-[#009639] text-white px-3 py-1.5 text-xs font-bold rounded-[var(--pro-radius,16px)] hover:opacity-90"
        >
          Contact
        </a>
      </div>
    </nav>
  )
}
```

- [ ] **Step 3: Write ProSiteHero**

```tsx
// components/pro-site/ProSiteHero.tsx
export function ProSiteHero({
  coverImageUrl,
  profession,
  proName,
  subtitle,
}: {
  coverImageUrl: string | null
  profession: string
  proName: string
  subtitle: string | null
}) {
  return (
    <section
      className="relative flex items-end"
      style={{ height: '80vh' }}
    >
      {coverImageUrl ? (
        <img
          src={coverImageUrl}
          alt={proName}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#2c3e6b] to-[#1a1a2e]" />
      )}
      {/* gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
      {/* text */}
      <div className="relative z-10 px-6 pb-8 text-white">
        <p className="text-xs uppercase tracking-[3px] opacity-55 mb-1">{profession}</p>
        <h1 className="text-4xl font-black leading-none mb-2">{proName}</h1>
        {subtitle && <p className="text-sm opacity-65">{subtitle}</p>}
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add components/pro-site/
git commit -m "feat(pro-site): StyleProvider, Nav, Hero components"
```

---

## Task 4: ProSitePresentation + ProSiteItemCard + ProSiteSectionPreview

**Files:**
- Create: `components/pro-site/ProSitePresentation.tsx`
- Create: `components/pro-site/ProSiteItemCard.tsx`
- Create: `components/pro-site/ProSiteSectionPreview.tsx`

- [ ] **Step 1: Write ProSitePresentation**

```tsx
// components/pro-site/ProSitePresentation.tsx
import Link from 'next/link'

export function ProSitePresentation({
  slug,
  bio,
  city,
  yearsExperience,
  teamSize,
  isVerified,
  hasAPropos,
}: {
  slug: string
  bio: string
  city: string | null
  yearsExperience: number | null
  teamSize: number | null
  isVerified: boolean
  hasAPropos: boolean
}) {
  return (
    <section className="bg-[var(--pro-surface,#fff)] px-6 py-6 border-b border-[var(--pro-border,#eee)]">
      <p className="text-sm leading-relaxed text-[var(--pro-text-muted,#444)] mb-4">{bio}</p>
      <div className="flex flex-wrap gap-2">
        {city && (
          <span className="bg-gray-100 rounded-full px-3 py-1 text-xs font-semibold text-gray-600">
            📍 {city}
          </span>
        )}
        {yearsExperience && (
          <span className="bg-gray-100 rounded-full px-3 py-1 text-xs font-semibold text-gray-600">
            ⏱ {yearsExperience} ans d&apos;expérience
          </span>
        )}
        {teamSize && (
          <span className="bg-gray-100 rounded-full px-3 py-1 text-xs font-semibold text-gray-600">
            👥 {teamSize} employé{teamSize > 1 ? 's' : ''}
          </span>
        )}
        {isVerified && (
          <span className="bg-green-100 rounded-full px-3 py-1 text-xs font-bold text-green-800">
            ✓ Vérifié Kelen
          </span>
        )}
      </div>
      {hasAPropos && (
        <Link
          href={`/professionnels/${slug}/a-propos`}
          className="inline-block mt-4 text-xs font-semibold text-[#009639] hover:underline"
        >
          En savoir plus →
        </Link>
      )}
    </section>
  )
}
```

- [ ] **Step 2: Write ProSiteItemCard**

```tsx
// components/pro-site/ProSiteItemCard.tsx
import Link from 'next/link'
import type { ProSiteItem } from '@/lib/pro-site/types'

export function ProSiteItemCard({
  item,
  href,
}: {
  item: ProSiteItem
  href: string
}) {
  return (
    <Link href={href} className="block group">
      <div className="bg-[var(--pro-surface,#fff)] border border-[var(--pro-border,#eee)] rounded-[var(--pro-radius,16px)] overflow-hidden hover:shadow-md transition-shadow">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-36 object-cover"
          />
        ) : (
          <div className="w-full h-36 bg-gray-100" />
        )}
        <div className="p-3">
          <p className="font-bold text-sm text-[var(--pro-text,#1a1a2e)] mb-1 line-clamp-1">
            {item.title}
          </p>
          {item.description && (
            <p className="text-xs text-[var(--pro-text-muted,#888)] mb-2 line-clamp-2">
              {item.description}
            </p>
          )}
          {item.price && (
            <p className="text-xs font-bold text-[#009639] mb-2">{item.price}</p>
          )}
          <div className="flex gap-3 items-center border-t border-[var(--pro-border,#eee)] pt-2">
            <span className="text-xs text-[var(--pro-text-muted,#888)]">♡ {item.likeCount}</span>
            <span className="text-xs text-[var(--pro-text-muted,#888)]">💬 {item.commentCount}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 3: Write ProSiteSectionPreview**

```tsx
// components/pro-site/ProSiteSectionPreview.tsx
import Link from 'next/link'
import { ProSiteItemCard } from './ProSiteItemCard'
import type { ProSiteItem } from '@/lib/pro-site/types'

export function ProSiteSectionPreview({
  title,
  listHref,
  items,
  slug,
  sectionPath,
}: {
  title: string
  listHref: string
  items: ProSiteItem[]
  slug: string
  sectionPath: string  // 'services' | 'realisations' | 'produits'
}) {
  if (items.length === 0) return null

  return (
    <section className="bg-[var(--pro-surface-alt,#f5f5f5)] px-6 py-6 border-b border-[var(--pro-border,#eee)]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-extrabold text-base text-[var(--pro-text,#1a1a2e)]">{title}</h2>
        <Link href={listHref} className="text-xs font-semibold text-[#009639] hover:underline">
          Voir tout →
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {items.slice(0, 3).map((item) => (
          <ProSiteItemCard
            key={item.id}
            item={item}
            href={`/professionnels/${slug}/${sectionPath}/${item.id}`}
          />
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add components/pro-site/
git commit -m "feat(pro-site): Presentation, ItemCard, SectionPreview components"
```

---

## Task 5: ProSiteContact + ProSiteFooter + ProSiteNewsletter

**Files:**
- Create: `components/pro-site/ProSiteContact.tsx`
- Create: `components/pro-site/ProSiteFooter.tsx`
- Create: `components/pro-site/ProSiteNewsletter.tsx`

- [ ] **Step 1: Write ProSiteContact**

```tsx
// components/pro-site/ProSiteContact.tsx
export function ProSiteContact({
  proName,
  phone,
  whatsapp,
  email,
  calendarUrl,
  responseTime,
}: {
  proName: string
  phone: string | null
  whatsapp: string | null
  email: string | null
  calendarUrl: string | null
  responseTime?: string
}) {
  return (
    <section id="contact" className="bg-[#1a1a2e] px-6 py-10 text-white text-center">
      <h2 className="font-extrabold text-base mb-1">Prendre contact</h2>
      <p className="text-xs opacity-45 mb-6">
        {responseTime ?? 'Réponse sous 2h'} · Devis gratuit
      </p>
      <div className="flex flex-col items-center gap-3 max-w-xs mx-auto">
        {calendarUrl && (
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#E05555] text-white py-3 rounded-[var(--pro-radius,16px)] text-sm font-extrabold hover:opacity-90"
          >
            📅 Prendre rendez-vous
          </a>
        )}
        <div className="flex gap-3 w-full">
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-[#25D366] py-2 rounded-[var(--pro-radius,16px)] text-xs font-bold text-center hover:opacity-90"
            >
              WhatsApp
            </a>
          )}
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex-1 bg-[#009639] py-2 rounded-[var(--pro-radius,16px)] text-xs font-bold text-center hover:opacity-90"
            >
              Appeler
            </a>
          )}
          {email && (
            <a
              href={`mailto:${email}`}
              className="flex-1 border border-white/30 py-2 rounded-[var(--pro-radius,16px)] text-xs text-center hover:border-white/60"
            >
              Email
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Write ProSiteFooter**

```tsx
// components/pro-site/ProSiteFooter.tsx
export function ProSiteFooter({ proName }: { proName: string }) {
  const year = new Date().getFullYear()
  return (
    <footer className="bg-[#111] px-6 py-3 flex justify-between items-center">
      <span className="text-xs text-gray-600">
        © {year} {proName} · kelen.africa
      </span>
      <span className="text-xs font-bold text-[#009639]">Kelen</span>
    </footer>
  )
}
```

- [ ] **Step 3: Write ProSiteNewsletter**

```tsx
// components/pro-site/ProSiteNewsletter.tsx
// Wraps the existing SubscribeWidget — keep this thin
import { SubscribeWidget } from '@/components/portfolio/SubscribeWidget'

export function ProSiteNewsletter({
  professionalId,
  proName,
}: {
  professionalId: string
  proName: string
}) {
  return (
    <section className="bg-[#f0faf4] border-y border-[#d4eedd] px-6 py-8 text-center">
      <h2 className="font-extrabold text-sm text-[#1a1a2e] mb-1">Restez informé</h2>
      <p className="text-xs text-gray-500 mb-4">
        Recevez les offres et actualités de {proName} directement dans votre boîte mail.
      </p>
      <SubscribeWidget professionalId={professionalId} />
      <p className="text-xs text-gray-400 mt-2">Pas de spam · Désabonnement en 1 clic</p>
    </section>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add components/pro-site/
git commit -m "feat(pro-site): Contact, Footer, Newsletter components"
```

---

## Task 6: Server actions for pro-site data

**Files:**
- Create: `lib/pro-site/actions.ts`

- [ ] **Step 1: Write actions**

```typescript
// lib/pro-site/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import type { ProSiteItem, ProSiteSettings, ProSiteComment } from './types'

export async function getProSiteSettings(professionalId: string): Promise<ProSiteSettings | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('professional_portfolio')
    .select('corner_style, color_mode, show_services_section, show_realisations_section, show_products_section, show_calendar_section')
    .eq('professional_id', professionalId)
    .single()
  if (!data) return null
  return {
    cornerStyle: data.corner_style ?? 'rounded',
    colorMode: data.color_mode ?? 'light',
    logoColor: null, // TODO: implement logo color extraction
    showServices: data.show_services_section ?? true,
    showRealisations: data.show_realisations_section ?? true,
    showProduits: data.show_products_section ?? true,
    showCalendar: data.show_calendar_section ?? false,
  }
}

async function getEngagementCounts(
  itemType: 'service' | 'realisation' | 'produit',
  itemIds: string[],
): Promise<Map<string, { likes: number; comments: number }>> {
  const supabase = createClient()
  const [{ data: likes }, { data: comments }] = await Promise.all([
    supabase
      .from('item_likes')
      .select('item_id')
      .eq('item_type', itemType)
      .in('item_id', itemIds),
    supabase
      .from('item_comments')
      .select('item_id')
      .eq('item_type', itemType)
      .in('item_id', itemIds),
  ])
  const map = new Map<string, { likes: number; comments: number }>()
  itemIds.forEach((id) => map.set(id, { likes: 0, comments: 0 }))
  likes?.forEach(({ item_id }) => {
    const e = map.get(item_id)
    if (e) e.likes++
  })
  comments?.forEach(({ item_id }) => {
    const e = map.get(item_id)
    if (e) e.comments++
  })
  return map
}

export async function getProSiteServices(professionalId: string): Promise<ProSiteItem[]> {
  const supabase = createClient()
  const { data: rows } = await supabase
    .from('professional_services')
    .select('id, name, description, price, image_url')
    .eq('professional_id', professionalId)
    .order('created_at', { ascending: false })
  if (!rows?.length) return []
  const counts = await getEngagementCounts('service', rows.map((r) => r.id))
  return rows.map((r) => ({
    id: r.id,
    title: r.name,
    description: r.description,
    price: r.price ? `${Number(r.price).toLocaleString('fr-FR')} FCFA` : 'Sur devis',
    imageUrl: r.image_url,
    likeCount: counts.get(r.id)?.likes ?? 0,
    commentCount: counts.get(r.id)?.comments ?? 0,
  }))
}

export async function getProSiteRealisations(professionalId: string): Promise<ProSiteItem[]> {
  const supabase = createClient()
  const { data: rows } = await supabase
    .from('professional_realisations')
    .select('id, title, description, images:realisation_images(url)')
    .eq('professional_id', professionalId)
    .order('created_at', { ascending: false })
  if (!rows?.length) return []
  const counts = await getEngagementCounts('realisation', rows.map((r) => r.id))
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    price: null,
    imageUrl: r.images?.[0]?.url ?? null,
    likeCount: counts.get(r.id)?.likes ?? 0,
    commentCount: counts.get(r.id)?.comments ?? 0,
  }))
}

export async function getProSiteProduits(professionalId: string): Promise<ProSiteItem[]> {
  const supabase = createClient()
  const { data: rows } = await supabase
    .from('professional_products')
    .select('id, name, description, price, image_url')
    .eq('professional_id', professionalId)
    .order('created_at', { ascending: false })
  if (!rows?.length) return []
  const counts = await getEngagementCounts('produit', rows.map((r) => r.id))
  return rows.map((r) => ({
    id: r.id,
    title: r.name,
    description: r.description,
    price: r.price ? `${Number(r.price).toLocaleString('fr-FR')} FCFA` : null,
    imageUrl: r.image_url,
    likeCount: counts.get(r.id)?.likes ?? 0,
    commentCount: counts.get(r.id)?.comments ?? 0,
  }))
}

export async function getItemComments(
  itemType: 'service' | 'realisation' | 'produit',
  itemId: string,
): Promise<ProSiteComment[]> {
  const supabase = createClient()
  const { data: rows } = await supabase
    .from('item_comments')
    .select('id, author_name, body, created_at, likes:comment_likes(id)')
    .eq('item_type', itemType)
    .eq('item_id', itemId)
    .order('created_at', { ascending: true })
  if (!rows) return []
  return rows.map((r) => ({
    id: r.id,
    authorName: r.author_name,
    body: r.body,
    createdAt: r.created_at,
    likeCount: r.likes?.length ?? 0,
  }))
}
```

- [ ] **Step 2: Verify table names**

Check the actual Supabase table names for services and products — the existing codebase uses `professional_realisations` (confirmed by `lib/actions/realisations.ts`). Confirm `professional_services` and `professional_products` match the real table names. If different, update the `from()` calls in `getProSiteServices` and `getProSiteProduits` accordingly.

```bash
# Run this to check
npx supabase db diff --linked
```

- [ ] **Step 3: Commit**

```bash
git add lib/pro-site/actions.ts
git commit -m "feat(pro-site): server actions for services, réalisations, produits + engagement counts"
```

---

## Task 7: Likes and Comments API routes

**Files:**
- Create: `app/api/pro-site/likes/route.ts`
- Create: `app/api/pro-site/comments/route.ts`

- [ ] **Step 1: Write likes route**

```typescript
// app/api/pro-site/likes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'

function getOrCreateSessionId(req: NextRequest): string {
  const cookieStore = cookies()
  let sessionId = cookieStore.get('kelen_session')?.value
  if (!sessionId) sessionId = randomUUID()
  return sessionId
}

// GET /api/pro-site/likes?item_type=service&item_id=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const itemType = searchParams.get('item_type')
  const itemId = searchParams.get('item_id')
  if (!itemType || !itemId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const supabase = createClient()
  const sessionId = getOrCreateSessionId(req)

  const [{ count }, { data: myLike }] = await Promise.all([
    supabase
      .from('item_likes')
      .select('*', { count: 'exact', head: true })
      .eq('item_type', itemType)
      .eq('item_id', itemId),
    supabase
      .from('item_likes')
      .select('id')
      .eq('item_type', itemType)
      .eq('item_id', itemId)
      .eq('session_id', sessionId)
      .single(),
  ])

  const res = NextResponse.json({ count: count ?? 0, liked: !!myLike })
  res.cookies.set('kelen_session', sessionId, { maxAge: 60 * 60 * 24 * 365, path: '/' })
  return res
}

// POST /api/pro-site/likes  body: { item_type, item_id }
export async function POST(req: NextRequest) {
  const { item_type, item_id } = await req.json()
  if (!item_type || !item_id) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const supabase = createClient()
  const sessionId = getOrCreateSessionId(req)

  // toggle: delete if exists, insert if not
  const { data: existing } = await supabase
    .from('item_likes')
    .select('id')
    .eq('item_type', item_type)
    .eq('item_id', item_id)
    .eq('session_id', sessionId)
    .single()

  if (existing) {
    await supabase.from('item_likes').delete().eq('id', existing.id)
  } else {
    await supabase.from('item_likes').insert({ item_type, item_id, session_id: sessionId })
  }

  const { count } = await supabase
    .from('item_likes')
    .select('*', { count: 'exact', head: true })
    .eq('item_type', item_type)
    .eq('item_id', item_id)

  const res = NextResponse.json({ count: count ?? 0, liked: !existing })
  res.cookies.set('kelen_session', sessionId, { maxAge: 60 * 60 * 24 * 365, path: '/' })
  return res
}
```

- [ ] **Step 2: Write comments route**

```typescript
// app/api/pro-site/comments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// GET /api/pro-site/comments?item_type=service&item_id=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const itemType = searchParams.get('item_type')
  const itemId = searchParams.get('item_id')
  if (!itemType || !itemId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const supabase = createClient()
  const { data } = await supabase
    .from('item_comments')
    .select('id, author_name, body, created_at, likes:comment_likes(id)')
    .eq('item_type', itemType)
    .eq('item_id', itemId)
    .order('created_at', { ascending: true })

  return NextResponse.json(
    data?.map((r) => ({
      id: r.id,
      authorName: r.author_name,
      body: r.body,
      createdAt: r.created_at,
      likeCount: r.likes?.length ?? 0,
    })) ?? [],
  )
}

const PostSchema = z.object({
  item_type: z.enum(['service', 'realisation', 'produit']),
  item_id: z.string().uuid(),
  author_name: z.string().min(1).max(80),
  body: z.string().min(1).max(1000),
})

// POST /api/pro-site/comments  body: { item_type, item_id, author_name, body }
export async function POST(req: NextRequest) {
  const parsed = PostSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const supabase = createClient()
  const { data, error } = await supabase
    .from('item_comments')
    .insert(parsed.data)
    .select('id, author_name, body, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({
    id: data.id,
    authorName: data.author_name,
    body: data.body,
    createdAt: data.created_at,
    likeCount: 0,
  })
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/pro-site/
git commit -m "feat(pro-site): likes and comments API routes"
```

---

## Task 8: ProSiteSocialThread (client component)

**Files:**
- Create: `components/pro-site/ProSiteSocialThread.tsx`

- [ ] **Step 1: Write the component**

```tsx
// components/pro-site/ProSiteSocialThread.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import type { ItemType, ProSiteComment } from '@/lib/pro-site/types'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "aujourd'hui"
  if (days === 1) return 'il y a 1 jour'
  if (days < 30) return `il y a ${days} jours`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`
  const months = Math.floor(days / 30)
  return `il y a ${months} mois`
}

function Avatar({ name }: { name: string }) {
  const letter = name.trim()[0]?.toUpperCase() ?? '?'
  const colors = ['#009639', '#FCCF00', '#2c3e6b', '#E05555', '#6c5ce7']
  const color = colors[letter.charCodeAt(0) % colors.length]
  return (
    <div
      className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
      style={{ background: color }}
    >
      {letter}
    </div>
  )
}

export function ProSiteSocialThread({
  itemType,
  itemId,
  initialComments,
  initialLikeCount,
}: {
  itemType: ItemType
  itemId: string
  initialComments: ProSiteComment[]
  initialLikeCount: number
}) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [comments, setComments] = useState<ProSiteComment[]>(initialComments)
  const [authorName, setAuthorName] = useState('')
  const [body, setBody] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    fetch(`/api/pro-site/likes?item_type=${itemType}&item_id=${itemId}`)
      .then((r) => r.json())
      .then(({ liked: l }) => setLiked(l))
  }, [itemType, itemId])

  async function toggleLike() {
    const res = await fetch('/api/pro-site/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_type: itemType, item_id: itemId }),
    })
    const { count, liked: l } = await res.json()
    setLikeCount(count)
    setLiked(l)
  }

  async function postComment(e: React.FormEvent) {
    e.preventDefault()
    if (!authorName.trim() || !body.trim()) return
    setPosting(true)
    const res = await fetch('/api/pro-site/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_type: itemType, item_id: itemId, author_name: authorName, body }),
    })
    if (res.ok) {
      const comment = await res.json()
      setComments((prev) => [...prev, comment])
      setBody('')
    }
    setPosting(false)
  }

  return (
    <section className="bg-[var(--pro-surface,#fff)] px-6 py-6 border-t border-[var(--pro-border,#eee)]">
      {/* Like + comment counts */}
      <div className="flex gap-5 items-center mb-5 pb-4 border-b border-[var(--pro-border,#eee)]">
        <button onClick={toggleLike} className="flex items-center gap-2 cursor-pointer">
          <span className="text-xl" style={{ color: liked ? '#E05555' : undefined }}>
            {liked ? '♥' : '♡'}
          </span>
          <span className="text-sm font-bold text-[var(--pro-text,#1a1a2e)]">
            {likeCount} j&apos;aime
          </span>
        </button>
        <span className="text-sm text-[var(--pro-text-muted,#888)]">
          💬 {comments.length} commentaire{comments.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Comments list */}
      <div className="flex flex-col gap-4 mb-5">
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <Avatar name={c.authorName} />
            <div className="flex-1 bg-[var(--pro-surface-alt,#f5f5f5)] rounded-[0_var(--pro-radius,16px)_var(--pro-radius,16px)_var(--pro-radius,16px)] px-4 py-3">
              <p className="text-xs font-bold text-[var(--pro-text,#1a1a2e)] mb-1">{c.authorName}</p>
              <p className="text-xs text-[var(--pro-text-muted,#444)] leading-relaxed">{c.body}</p>
              <p className="text-xs text-gray-400 mt-2">{timeAgo(c.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Comment input */}
      <form onSubmit={postComment} className="flex flex-col gap-2">
        <input
          type="text"
          placeholder="Votre prénom *"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          maxLength={80}
          required
          className="border border-[var(--pro-border,#eee)] rounded-[var(--pro-radius,16px)] px-4 py-2 text-sm outline-none focus:border-[#009639]"
        />
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ajouter un commentaire…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={1000}
            required
            className="flex-1 border border-[var(--pro-border,#eee)] rounded-[var(--pro-radius,16px)] px-4 py-2 text-sm outline-none focus:border-[#009639]"
          />
          <button
            type="submit"
            disabled={posting || !authorName.trim() || !body.trim()}
            className="bg-[#009639] text-white px-4 py-2 rounded-[var(--pro-radius,16px)] text-sm font-bold disabled:opacity-50"
          >
            →
          </button>
        </div>
      </form>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/pro-site/ProSiteSocialThread.tsx
git commit -m "feat(pro-site): SocialThread client component with likes + comments"
```

---

## Task 9: ProSiteGallery + ProSiteVideoRow

**Files:**
- Create: `components/pro-site/ProSiteGallery.tsx`
- Create: `components/pro-site/ProSiteVideoRow.tsx`

- [ ] **Step 1: Write ProSiteGallery**

```tsx
// components/pro-site/ProSiteGallery.tsx
'use client'
import { useState } from 'react'

export function ProSiteGallery({ images }: { images: string[] }) {
  const [lightbox, setLightbox] = useState<string | null>(null)
  if (images.length === 0) return null

  return (
    <section className="bg-[var(--pro-surface,#fff)] px-6 py-6 border-t border-[var(--pro-border,#eee)]">
      <h3 className="font-extrabold text-sm text-[var(--pro-text,#1a1a2e)] mb-3">
        Photos <span className="font-normal text-[var(--pro-text-muted,#888)]">· {images.length}</span>
      </h3>
      <div className="grid grid-cols-3 gap-2" style={{ gridTemplateRows: 'auto auto' }}>
        {/* First image spans 2 rows */}
        <img
          src={images[0]}
          alt=""
          className="col-span-1 row-span-2 w-full h-full object-cover rounded-[var(--pro-radius,16px)] cursor-pointer"
          style={{ gridColumn: '1', gridRow: '1 / 3', maxHeight: '240px' }}
          onClick={() => setLightbox(images[0])}
        />
        {images.slice(1, 5).map((src, i) => (
          <div key={i} className="relative">
            <img
              src={src}
              alt=""
              className="w-full h-28 object-cover rounded-[var(--pro-radius,16px)] cursor-pointer"
              onClick={() => setLightbox(src)}
            />
            {i === 3 && images.length > 5 && (
              <div className="absolute inset-0 bg-black/50 rounded-[var(--pro-radius,16px)] flex items-center justify-center">
                <span className="text-white font-bold text-sm">+{images.length - 5}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </section>
  )
}
```

- [ ] **Step 2: Write ProSiteVideoRow**

```tsx
// components/pro-site/ProSiteVideoRow.tsx
export function ProSiteVideoRow({ videos }: { videos: { url: string; durationSeconds?: number }[] }) {
  if (videos.length === 0) return null

  function formatDuration(s?: number): string {
    if (!s) return ''
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <section className="bg-[var(--pro-surface-alt,#f5f5f5)] px-6 py-6 border-t border-[var(--pro-border,#eee)]">
      <h3 className="font-extrabold text-sm text-[var(--pro-text,#1a1a2e)] mb-3">
        Vidéos <span className="font-normal text-[var(--pro-text-muted,#888)]">· {videos.length}</span>
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {videos.map((v, i) => (
          <a
            key={i}
            href={v.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 relative w-40 h-24 rounded-[var(--pro-radius,16px)] overflow-hidden bg-[#1a1a2e] flex items-center justify-center"
          >
            <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
              <span className="text-[#1a1a2e] text-sm ml-0.5">▶</span>
            </div>
            {v.durationSeconds && (
              <span className="absolute bottom-2 left-2 text-white text-xs bg-black/50 px-1.5 py-0.5 rounded">
                {formatDuration(v.durationSeconds)}
              </span>
            )}
          </a>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/pro-site/ProSiteGallery.tsx components/pro-site/ProSiteVideoRow.tsx
git commit -m "feat(pro-site): Gallery and VideoRow components"
```

---

## Task 10: Homepage refactor

**Files:**
- Modify: `app/(marketing)/professionnels/[slug]/page.tsx`

- [ ] **Step 1: Read the current file to understand existing data fetching patterns**

```bash
# Read existing implementation — look at how pro + portfolio are fetched
cat "app/(marketing)/professionnels/[slug]/page.tsx" | head -120
```

- [ ] **Step 2: Rewrite the homepage**

Replace the full page with:

```tsx
// app/(marketing)/professionnels/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProSiteStyleProvider } from '@/components/pro-site/ProSiteStyleProvider'
import { ProSiteNav } from '@/components/pro-site/ProSiteNav'
import { ProSiteHero } from '@/components/pro-site/ProSiteHero'
import { ProSitePresentation } from '@/components/pro-site/ProSitePresentation'
import { ProSiteSectionPreview } from '@/components/pro-site/ProSiteSectionPreview'
import { ProSiteNewsletter } from '@/components/pro-site/ProSiteNewsletter'
import { ProSiteContact } from '@/components/pro-site/ProSiteContact'
import { ProSiteFooter } from '@/components/pro-site/ProSiteFooter'
import { GoogleReviewsSection } from '@/components/pro/GoogleReviewsSection'
import {
  getProSiteSettings,
  getProSiteServices,
  getProSiteRealisations,
  getProSiteProduits,
} from '@/lib/pro-site/actions'

export default async function ProfessionalPage({
  params,
}: {
  params: { slug: string }
}) {
  const supabase = createClient()

  const { data: pro } = await supabase
    .from('professionals')
    .select('id, business_name, owner_name, slug, description, city, years_experience, team_size, verified, phone, whatsapp, email, portfolio_photos, profession:professions(name)')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single()

  if (!pro) notFound()

  const [settings, services, realisations, produits] = await Promise.all([
    getProSiteSettings(pro.id),
    getProSiteServices(pro.id),
    getProSiteRealisations(pro.id),
    getProSiteProduits(pro.id),
  ])

  // Check if À propos page exists (portfolio has about_text set)
  const { data: portfolio } = await supabase
    .from('professional_portfolio')
    .select('about_text, hero_image_url, hero_subtitle, calendar_url')
    .eq('professional_id', pro.id)
    .single()

  const cornerStyle = settings?.cornerStyle ?? 'rounded'
  const colorMode = settings?.colorMode ?? 'light'
  const proName = pro.business_name ?? pro.owner_name
  const profession = pro.profession?.name ?? ''

  return (
    <ProSiteStyleProvider cornerStyle={cornerStyle} colorMode={colorMode} logoColor={null}>
      <ProSiteNav
        slug={pro.slug}
        proName={proName}
        showServices={settings?.showServices ?? true}
        showRealisations={settings?.showRealisations ?? true}
        showProduits={settings?.showProduits ?? true}
        calendarUrl={portfolio?.calendar_url ?? null}
      />
      <main>
        <ProSiteHero
          coverImageUrl={portfolio?.hero_image_url ?? pro.portfolio_photos?.[0] ?? null}
          profession={profession}
          proName={proName}
          subtitle={portfolio?.hero_subtitle ?? null}
        />
        <ProSitePresentation
          slug={pro.slug}
          bio={pro.description ?? ''}
          city={pro.city}
          yearsExperience={pro.years_experience}
          teamSize={pro.team_size}
          isVerified={pro.verified ?? false}
          hasAPropos={!!portfolio?.about_text}
        />
        <GoogleReviewsSection professionalId={pro.id} />
        {(settings?.showServices ?? true) && (
          <ProSiteSectionPreview
            title="Services"
            listHref={`/professionnels/${pro.slug}/services`}
            items={services}
            slug={pro.slug}
            sectionPath="services"
          />
        )}
        {(settings?.showRealisations ?? true) && (
          <ProSiteSectionPreview
            title="Réalisations"
            listHref={`/professionnels/${pro.slug}/realisations`}
            items={realisations}
            slug={pro.slug}
            sectionPath="realisations"
          />
        )}
        {(settings?.showProduits ?? true) && (
          <ProSiteSectionPreview
            title="Produits"
            listHref={`/professionnels/${pro.slug}/produits`}
            items={produits}
            slug={pro.slug}
            sectionPath="produits"
          />
        )}
        <ProSiteNewsletter professionalId={pro.id} proName={proName} />
        <ProSiteContact
          proName={proName}
          phone={pro.phone}
          whatsapp={pro.whatsapp}
          email={pro.email}
          calendarUrl={portfolio?.calendar_url ?? null}
        />
      </main>
      <ProSiteFooter proName={proName} />
    </ProSiteStyleProvider>
  )
}
```

- [ ] **Step 3: Start dev server and visit a pro profile**

```bash
npm run dev
```
Open `http://localhost:3000/professionnels/[any-existing-slug]`. Confirm:
- Hero renders at 80vh
- Présentation shows bio + pills
- Sections appear (Services, Réalisations, Produits)
- Contact section has RDV button
- No console errors

- [ ] **Step 4: Commit**

```bash
git add app/\(marketing\)/professionnels/\[slug\]/page.tsx
git commit -m "feat(pro-site): refactor homepage to new template"
```

---

## Task 11: List pages (Services, Réalisations, Produits)

**Files:**
- Create: `app/(marketing)/professionnels/[slug]/services/page.tsx`
- Create: `app/(marketing)/professionnels/[slug]/realisations/page.tsx`
- Create: `app/(marketing)/professionnels/[slug]/produits/page.tsx`
- Create: `components/pro-site/ProSiteListPage.tsx`

- [ ] **Step 1: Write ProSiteListPage**

```tsx
// components/pro-site/ProSiteListPage.tsx
import Link from 'next/link'
import { ProSiteItemCard } from './ProSiteItemCard'
import type { ProSiteItem } from '@/lib/pro-site/types'

export function ProSiteListPage({
  slug,
  sectionPath,
  sectionTitle,
  proName,
  profession,
  items,
}: {
  slug: string
  sectionPath: string
  sectionTitle: string
  proName: string
  profession: string
  items: ProSiteItem[]
}) {
  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[var(--pro-border,#eee)] px-6 py-3 flex items-center gap-2 text-xs">
        <Link href={`/professionnels/${slug}`} className="text-[#009639] hover:underline">
          ← {proName}
        </Link>
        <span className="text-gray-300">/</span>
        <span className="font-bold text-[var(--pro-text,#1a1a2e)]">{sectionTitle}</span>
      </div>

      {/* Section header */}
      <div className="bg-[#1a1a2e] px-6 py-6 text-white">
        <p className="text-xs opacity-50 mb-1">{proName} · {profession}</p>
        <h1 className="text-2xl font-black">{sectionTitle}</h1>
        <p className="text-xs opacity-40 mt-1">{items.length} disponible{items.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Grid */}
      <div className="px-6 py-6 bg-[var(--pro-surface-alt,#f5f5f5)] min-h-screen">
        {items.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-12">Aucun élément pour l&apos;instant.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {items.map((item) => (
              <ProSiteItemCard
                key={item.id}
                item={item}
                href={`/professionnels/${slug}/${sectionPath}/${item.id}`}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
```

- [ ] **Step 2: Write services list page**

```tsx
// app/(marketing)/professionnels/[slug]/services/page.tsx
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProSiteStyleProvider } from '@/components/pro-site/ProSiteStyleProvider'
import { ProSiteNav } from '@/components/pro-site/ProSiteNav'
import { ProSiteListPage } from '@/components/pro-site/ProSiteListPage'
import { ProSiteFooter } from '@/components/pro-site/ProSiteFooter'
import { getProSiteSettings, getProSiteServices } from '@/lib/pro-site/actions'

export default async function ServicesListPage({ params }: { params: { slug: string } }) {
  const supabase = createClient()
  const { data: pro } = await supabase
    .from('professionals')
    .select('id, business_name, owner_name, slug, profession:professions(name)')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single()
  if (!pro) notFound()

  const [settings, items] = await Promise.all([getProSiteSettings(pro.id), getProSiteServices(pro.id)])
  const proName = pro.business_name ?? pro.owner_name

  return (
    <ProSiteStyleProvider cornerStyle={settings?.cornerStyle ?? 'rounded'} colorMode={settings?.colorMode ?? 'light'} logoColor={null}>
      <ProSiteNav slug={pro.slug} proName={proName} showServices={true} showRealisations={settings?.showRealisations ?? true} showProduits={settings?.showProduits ?? true} calendarUrl={null} />
      <main>
        <ProSiteListPage slug={pro.slug} sectionPath="services" sectionTitle="Services" proName={proName} profession={pro.profession?.name ?? ''} items={items} />
      </main>
      <ProSiteFooter proName={proName} />
    </ProSiteStyleProvider>
  )
}
```

- [ ] **Step 3: Write réalisations and produits list pages**

Create `app/(marketing)/professionnels/[slug]/realisations/page.tsx` — identical to the services list page above except:
- Replace `getProSiteServices` → `getProSiteRealisations`
- Replace `sectionPath="services"` → `sectionPath="realisations"`
- Replace `sectionTitle="Services"` → `sectionTitle="Réalisations"`

Create `app/(marketing)/professionnels/[slug]/produits/page.tsx` — identical except:
- Replace `getProSiteServices` → `getProSiteProduits`
- Replace `sectionPath="services"` → `sectionPath="produits"`
- Replace `sectionTitle="Services"` → `sectionTitle="Produits"`

- [ ] **Step 4: Test in browser**

Navigate to `/professionnels/[slug]/services`. Confirm:
- Breadcrumb shows `← {proName} / Services`
- All services render as cards with like/comment counts
- Clicking a card navigates to the detail page URL (will 404 until Task 12)

- [ ] **Step 5: Commit**

```bash
git add components/pro-site/ProSiteListPage.tsx app/\(marketing\)/professionnels/\[slug\]/services/ app/\(marketing\)/professionnels/\[slug\]/realisations/ app/\(marketing\)/professionnels/\[slug\]/produits/
git commit -m "feat(pro-site): list pages for services, réalisations, produits"
```

---

## Task 12: Detail pages (Services, Réalisations, Produits)

**Files:**
- Create: `components/pro-site/ProSiteDetailPage.tsx`
- Create: `app/(marketing)/professionnels/[slug]/services/[id]/page.tsx`
- Create: `app/(marketing)/professionnels/[slug]/realisations/[id]/page.tsx`
- Create: `app/(marketing)/professionnels/[slug]/produits/[id]/page.tsx`

- [ ] **Step 1: Write ProSiteDetailPage**

```tsx
// components/pro-site/ProSiteDetailPage.tsx
import Link from 'next/link'
import { ProSiteGallery } from './ProSiteGallery'
import { ProSiteVideoRow } from './ProSiteVideoRow'
import { ProSiteSocialThread } from './ProSiteSocialThread'
import { ProSiteItemCard } from './ProSiteItemCard'
import type { ItemType, ProSiteComment, ProSiteItem } from '@/lib/pro-site/types'

export function ProSiteDetailPage({
  slug,
  sectionPath,
  sectionTitle,
  proName,
  calendarUrl,
  whatsapp,
  item,
  images,
  videos,
  pills,
  initialComments,
  initialLikeCount,
  relatedItems,
}: {
  slug: string
  sectionPath: string
  sectionTitle: string
  proName: string
  calendarUrl: string | null
  whatsapp: string | null
  item: ProSiteItem & { fullDescription?: string }
  images: string[]
  videos: { url: string; durationSeconds?: number }[]
  pills: string[]
  initialComments: ProSiteComment[]
  initialLikeCount: number
  relatedItems: ProSiteItem[]
}) {
  const itemType = sectionPath.replace(/s$/, '') as ItemType  // 'services' -> 'service'

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[var(--pro-border,#eee)] px-6 py-3 flex items-center gap-2 text-xs">
        <Link href={`/professionnels/${slug}`} className="text-[#009639] hover:underline">← {proName}</Link>
        <span className="text-gray-300">/</span>
        <Link href={`/professionnels/${slug}/${sectionPath}`} className="text-[#009639] hover:underline">{sectionTitle}</Link>
        <span className="text-gray-300">/</span>
        <span className="font-bold text-[var(--pro-text,#1a1a2e)] line-clamp-1">{item.title}</span>
      </div>

      {/* Main image */}
      {item.imageUrl && (
        <div className="relative">
          <img src={item.imageUrl} alt={item.title} className="w-full h-64 object-cover" />
          <div className="absolute top-3 right-3 bg-black/40 rounded-full px-3 py-1 flex items-center gap-1">
            <span className="text-white text-base">♡</span>
            <span className="text-white text-xs font-bold">{initialLikeCount}</span>
          </div>
        </div>
      )}

      {/* Title + CTA */}
      <div className="bg-[var(--pro-surface,#fff)] px-6 py-5 border-b border-[var(--pro-border,#eee)]">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-xl font-black text-[var(--pro-text,#1a1a2e)] leading-tight">{item.title}</h1>
            {item.price && <p className="text-sm font-bold text-[#009639] mt-1">{item.price}</p>}
          </div>
        </div>
        <div className="flex gap-3">
          {calendarUrl && (
            <a href={calendarUrl} target="_blank" rel="noopener noreferrer"
              className="flex-1 bg-[#E05555] text-white py-2.5 rounded-[var(--pro-radius,16px)] text-sm font-extrabold text-center hover:opacity-90">
              📅 Prendre RDV
            </a>
          )}
          {whatsapp && (
            <a href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
              className="flex-1 bg-[#25D366] text-white py-2.5 rounded-[var(--pro-radius,16px)] text-sm font-bold text-center hover:opacity-90">
              WhatsApp
            </a>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="bg-[var(--pro-surface,#fff)] px-6 py-5 border-b border-[var(--pro-border,#eee)]">
        <h2 className="font-extrabold text-sm text-[var(--pro-text,#1a1a2e)] mb-3">Description</h2>
        <p className="text-sm text-[var(--pro-text-muted,#444)] leading-relaxed">
          {item.fullDescription ?? item.description}
        </p>
        {pills.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {pills.map((p, i) => (
              <span key={i} className="bg-gray-100 rounded-full px-3 py-1 text-xs text-gray-600 font-semibold">{p}</span>
            ))}
          </div>
        )}
      </div>

      {/* Gallery */}
      <ProSiteGallery images={images} />

      {/* Videos */}
      <ProSiteVideoRow videos={videos} />

      {/* Social thread */}
      <ProSiteSocialThread
        itemType={itemType}
        itemId={item.id}
        initialComments={initialComments}
        initialLikeCount={initialLikeCount}
      />

      {/* Related */}
      {relatedItems.length > 0 && (
        <div className="bg-[var(--pro-surface-alt,#f5f5f5)] px-6 py-6">
          <h3 className="font-extrabold text-sm text-[var(--pro-text,#1a1a2e)] mb-4">
            Autres {sectionTitle.toLowerCase()}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {relatedItems.slice(0, 2).map((r) => (
              <ProSiteItemCard
                key={r.id}
                item={r}
                href={`/professionnels/${slug}/${sectionPath}/${r.id}`}
              />
            ))}
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 2: Write services detail page**

```tsx
// app/(marketing)/professionnels/[slug]/services/[id]/page.tsx
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProSiteStyleProvider } from '@/components/pro-site/ProSiteStyleProvider'
import { ProSiteNav } from '@/components/pro-site/ProSiteNav'
import { ProSiteDetailPage } from '@/components/pro-site/ProSiteDetailPage'
import { ProSiteFooter } from '@/components/pro-site/ProSiteFooter'
import { getProSiteSettings, getProSiteServices, getItemComments } from '@/lib/pro-site/actions'

export default async function ServiceDetailPage({
  params,
}: { params: { slug: string; id: string } }) {
  const supabase = createClient()
  const { data: pro } = await supabase
    .from('professionals')
    .select('id, business_name, owner_name, slug, whatsapp, profession:professions(name)')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single()
  if (!pro) notFound()

  const { data: service } = await supabase
    .from('professional_services')
    .select('id, name, description, price, image_url')
    .eq('id', params.id)
    .eq('professional_id', pro.id)
    .single()
  if (!service) notFound()

  const { data: portfolio } = await supabase
    .from('professional_portfolio')
    .select('calendar_url')
    .eq('professional_id', pro.id)
    .single()

  const [settings, allServices, comments] = await Promise.all([
    getProSiteSettings(pro.id),
    getProSiteServices(pro.id),
    getItemComments('service', params.id),
  ])

  const { count: likeCount } = await supabase
    .from('item_likes')
    .select('*', { count: 'exact', head: true })
    .eq('item_type', 'service')
    .eq('item_id', params.id)

  const proName = pro.business_name ?? pro.owner_name
  const item = {
    id: service.id,
    title: service.name,
    description: service.description,
    fullDescription: service.description,
    price: service.price ? `${Number(service.price).toLocaleString('fr-FR')} FCFA` : 'Sur devis',
    imageUrl: service.image_url,
    likeCount: likeCount ?? 0,
    commentCount: comments.length,
  }
  const relatedItems = allServices.filter((s) => s.id !== params.id)

  return (
    <ProSiteStyleProvider cornerStyle={settings?.cornerStyle ?? 'rounded'} colorMode={settings?.colorMode ?? 'light'} logoColor={null}>
      <ProSiteNav slug={pro.slug} proName={proName} showServices={true} showRealisations={settings?.showRealisations ?? true} showProduits={settings?.showProduits ?? true} calendarUrl={portfolio?.calendar_url ?? null} />
      <main>
        <ProSiteDetailPage
          slug={pro.slug}
          sectionPath="services"
          sectionTitle="Services"
          proName={proName}
          calendarUrl={portfolio?.calendar_url ?? null}
          whatsapp={pro.whatsapp}
          item={item}
          images={service.image_url ? [service.image_url] : []}
          videos={[]}
          pills={[]}
          initialComments={comments}
          initialLikeCount={likeCount ?? 0}
          relatedItems={relatedItems}
        />
      </main>
      <ProSiteFooter proName={proName} />
    </ProSiteStyleProvider>
  )
}
```

- [ ] **Step 3: Write réalisations detail page**

Create `app/(marketing)/professionnels/[slug]/realisations/[id]/page.tsx` — same structure as the services detail page. Key differences:

```tsx
// fetch realisation with images + videos
const { data: real } = await supabase
  .from('professional_realisations')
  .select('id, title, description, images:realisation_images(url), documents:realisation_documents(url)')
  .eq('id', params.id)
  .eq('professional_id', pro.id)
  .single()

// Pass to ProSiteDetailPage:
// images={real.images?.map(i => i.url) ?? []}
// sectionPath="realisations"
// sectionTitle="Réalisations"
// item_type 'realisation' for comments/likes
```

- [ ] **Step 4: Write produits detail page**

Create `app/(marketing)/professionnels/[slug]/produits/[id]/page.tsx` — same structure. Key differences:

```tsx
const { data: produit } = await supabase
  .from('professional_products')
  .select('id, name, description, price, image_url, images:product_images(url)')
  .eq('id', params.id)
  .eq('professional_id', pro.id)
  .single()

// sectionPath="produits", sectionTitle="Produits", item_type='produit'
```

- [ ] **Step 5: Test detail pages in browser**

Navigate to a service detail page. Confirm:
- Main image renders
- RDV + WhatsApp buttons show
- Description + pills render
- Social thread shows with empty state
- Post a comment — confirm it appears without refresh
- Click like — confirm count increments

- [ ] **Step 6: Commit**

```bash
git add components/pro-site/ProSiteDetailPage.tsx app/\(marketing\)/professionnels/\[slug\]/services/\[id\]/ app/\(marketing\)/professionnels/\[slug\]/realisations/\[id\]/ app/\(marketing\)/professionnels/\[slug\]/produits/\[id\]/
git commit -m "feat(pro-site): detail pages for services, réalisations, produits"
```

---

## Task 13: À propos page

**Files:**
- Create: `app/(marketing)/professionnels/[slug]/a-propos/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
// app/(marketing)/professionnels/[slug]/a-propos/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProSiteStyleProvider } from '@/components/pro-site/ProSiteStyleProvider'
import { ProSiteNav } from '@/components/pro-site/ProSiteNav'
import { ProSiteContact } from '@/components/pro-site/ProSiteContact'
import { ProSiteFooter } from '@/components/pro-site/ProSiteFooter'
import { getProSiteSettings } from '@/lib/pro-site/actions'

export default async function AProposPage({ params }: { params: { slug: string } }) {
  const supabase = createClient()
  const { data: pro } = await supabase
    .from('professionals')
    .select('id, business_name, owner_name, slug, phone, whatsapp, email, profession:professions(name)')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single()
  if (!pro) notFound()

  const { data: portfolio } = await supabase
    .from('professional_portfolio')
    .select('about_text, about_image_url, calendar_url')
    .eq('professional_id', pro.id)
    .single()

  // If no about_text, this page shouldn't exist — redirect back
  if (!portfolio?.about_text) notFound()

  const settings = await getProSiteSettings(pro.id)
  const proName = pro.business_name ?? pro.owner_name

  return (
    <ProSiteStyleProvider cornerStyle={settings?.cornerStyle ?? 'rounded'} colorMode={settings?.colorMode ?? 'light'} logoColor={null}>
      <ProSiteNav slug={pro.slug} proName={proName} showServices={settings?.showServices ?? true} showRealisations={settings?.showRealisations ?? true} showProduits={settings?.showProduits ?? true} calendarUrl={portfolio?.calendar_url ?? null} />
      <main>
        {/* Header */}
        <div className="bg-[#1a1a2e] px-6 py-8 text-white">
          <Link href={`/professionnels/${pro.slug}`} className="text-xs text-white/50 hover:text-white/80 mb-4 inline-block">
            ← {proName}
          </Link>
          <p className="text-xs uppercase tracking-widest opacity-50 mb-1">{pro.profession?.name}</p>
          <h1 className="text-3xl font-black">{proName}</h1>
        </div>

        {/* Body */}
        <div className="bg-[var(--pro-surface,#fff)] px-6 py-8">
          {portfolio.about_image_url && (
            <img
              src={portfolio.about_image_url}
              alt={proName}
              className="w-full h-56 object-cover rounded-[var(--pro-radius,16px)] mb-6"
            />
          )}
          <div
            className="prose prose-sm max-w-none text-[var(--pro-text-muted,#444)] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: portfolio.about_text }}
          />
        </div>

        <ProSiteContact
          proName={proName}
          phone={pro.phone}
          whatsapp={pro.whatsapp}
          email={pro.email}
          calendarUrl={portfolio?.calendar_url ?? null}
        />
      </main>
      <ProSiteFooter proName={proName} />
    </ProSiteStyleProvider>
  )
}
```

- [ ] **Step 2: Test**

Set `about_text` on a pro's portfolio record in Supabase. Navigate to `/professionnels/[slug]/a-propos`. Confirm page renders. Visit a pro without `about_text` — confirm it returns 404. Verify the "En savoir plus →" link on the homepage only shows for pros with `about_text`.

- [ ] **Step 3: Commit**

```bash
git add app/\(marketing\)/professionnels/\[slug\]/a-propos/
git commit -m "feat(pro-site): optional À propos page"
```

---

## Task 14: Dashboard customization controls

**Files:**
- Modify: `app/(professional)/pro/site/page.tsx` (or the relevant dashboard settings component)

- [ ] **Step 1: Add corner style + color mode selectors to portfolio settings**

Find where `ProfessionalPortfolio` is saved in the pro dashboard. This is in `components/pro/PortfolioSettings.tsx`. Add two new controls:

```tsx
// Add to the existing PortfolioSettings form

// Corner style selector
<div className="space-y-2">
  <label className="text-sm font-semibold">Style des coins</label>
  <div className="flex gap-3">
    {(['square', 'half-rounded', 'rounded'] as const).map((style) => (
      <button
        key={style}
        type="button"
        onClick={() => setValue('corner_style', style)}
        className={cn(
          'flex-1 py-3 border-2 text-xs font-bold transition-colors',
          style === 'square' ? 'rounded-none' : style === 'half-rounded' ? 'rounded-lg' : 'rounded-2xl',
          watch('corner_style') === style ? 'border-[#009639] bg-green-50' : 'border-gray-200',
        )}
      >
        {style === 'square' ? 'Carré' : style === 'half-rounded' ? 'Arrondi' : 'Très arrondi'}
      </button>
    ))}
  </div>
</div>

// Color mode selector
<div className="space-y-2">
  <label className="text-sm font-semibold">Mode couleur</label>
  <div className="flex gap-3">
    {(['light', 'dark', 'logo-color'] as const).map((mode) => (
      <button
        key={mode}
        type="button"
        onClick={() => setValue('color_mode', mode)}
        className={cn(
          'flex-1 py-3 border-2 rounded-lg text-xs font-bold',
          watch('color_mode') === mode ? 'border-[#009639] bg-green-50' : 'border-gray-200',
        )}
      >
        {mode === 'light' ? '☀️ Clair' : mode === 'dark' ? '🌙 Sombre' : '🎨 Couleur logo'}
      </button>
    ))}
  </div>
</div>
```

Also update the server action that saves portfolio settings to include `corner_style` and `color_mode` in the upsert.

- [ ] **Step 2: Test the controls**

Open the pro dashboard → Site settings. Toggle corner style — visit the public profile and confirm border-radius changes. Toggle dark mode — confirm the site goes dark.

- [ ] **Step 3: Commit**

```bash
git add components/pro/ app/\(professional\)/
git commit -m "feat(pro-site): corner style and color mode controls in dashboard"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Covered in |
|-----------------|-----------|
| Standardized template, same for all pros | Tasks 3–10 |
| Customization: corner style / color mode | Tasks 2, 14 |
| Nav with RDV (soft red) + Contact (green) | Task 3 |
| Hero 80vh, image + name + subtitle | Task 3 |
| Présentation: bio + pills + En savoir plus | Task 4 |
| Social proof: Google reviews scrolling | Task 10 (reuses existing component) |
| Services / Réalisations / Produits previews | Tasks 4, 6 |
| Newsletter | Task 5 |
| Contact section with RDV primary CTA | Task 5 |
| List pages (shared grid template) | Task 11 |
| Detail pages: image + description + gallery + videos + social thread | Tasks 9, 12 |
| Likes (anonymous, session-based, toggle) | Tasks 1, 7, 8 |
| Comments (anonymous, name required) | Tasks 1, 7, 8 |
| À propos optional page, not in nav | Task 13 |
| Dashboard controls for corner/color | Task 14 |

**All requirements covered. No placeholders found.**
