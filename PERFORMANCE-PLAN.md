# Performance Improvement Plan — Kelen African Network

## Context

**Africa-first mandate.** The primary users are in sub-Saharan Africa where:
- **Bandwidth:** 2G/3G is common (50-500 KB/s), data is expensive per MB
- **Latency:** 300-800ms RTT is typical (vs 20-80ms in Europe/US)
- **Devices:** Mid-range Android phones, limited RAM, throttled CPUs
- **Connectivity:** Intermittent — connections drop and resume frequently

In this environment, **every sequential network request compounds brutally.** A page with 8 sequential DB calls at 500ms RTT = 4 seconds minimum before content. A page with 3 font files from Google = 1.5 seconds before text renders.

Performance here is not a nice-to-have — it is the product.

---

## Current State (Audited April 2026)

### Already Done ✅
- Image compression pipeline: sharp server-side (WebP), canvas client-side pre-compression
- Different quality tiers per bucket (portfolios 80%, log-media 70%, evidence-photos 75%)
- Server Actions for all data fetching (no client-side `useEffect + fetch`)
- Proper viewport meta tags
- GA with `afterInteractive` strategy (non-blocking)
- Pagination on notifications, recommendations (using `.range()`)
- Admin dashboard uses `Promise.all` for 6 concurrent count queries

### Critical Gaps ❌
- **Zero ISR** — all 95 pages are dynamic, every visit hits the DB
- **8 sequential DB queries** in dashboard-stats (at 500ms RTT = up to 4s wait)
- **Google Fonts CDN** blocks text render (3 separate requests = 900-2400ms)
- **Google Maps loads synchronously** on pages that use it (~200KB, blocks render)
- **No Next.js Image** on 7+ `<img>` tags (no lazy load, no responsive sizing)
- **No dynamic imports** for heavy libraries: jspdf, xlsx, recharts, tiptap (~650KB total)
- **Reviews query has no limit** — fetches ALL review rows then averages in JS

---

## Phase 1: Africa-Critical — Do Immediately

### 1.1 Parallelize Dashboard Stats Queries
**Problem:** `lib/actions/dashboard-stats.ts` runs 8 independent queries sequentially.
At 500ms African RTT: **8 × 500ms = 4 seconds minimum** before dashboard content loads.

**Current pattern:**
```typescript
const { count: recs }   = await supabase.from('recommendations')...   // 500ms
const { count: signals } = await supabase.from('signals')...           // 500ms
const { data: reviews }  = await supabase.from('reviews')...           // 500ms
// ... 5 more sequential queries
// Total: up to 4000ms on African networks
```

**Fix — group independent queries with Promise.all:**
```typescript
const [
  { count: recsCount },
  { count: signalsCount },
  { data: reviews },
  { count: monthlyViews },
  { data: subscription },
  { count: pendingRecs },
  { count: pendingSignals },
  { data: gbpTokens }
] = await Promise.all([
  supabase.from('recommendations').select('*', { count: 'exact', head: true })...,
  supabase.from('signals').select('*', { count: 'exact', head: true })...,
  supabase.from('reviews').select('rating').eq('professional_id', pro.id).limit(500),
  // ... all 8 in parallel
])
```

**Africa impact:** 4000ms → 500-800ms. Single biggest win per-dollar-of-effort.

**Files:** `lib/actions/dashboard-stats.ts`
**Cost:** ~1 hour

---

### 1.2 Fix Font Loading — Eliminate Google Fonts CDN
**Problem:** `app/layout.tsx` loads fonts from Google Fonts CDN via 3 `<link>` tags:
- `Manrope:wght@400;700;800`
- `Inter:wght@400;500;600`
- `Material Symbols Outlined`

Each is a round-trip to Google's CDN. On 500ms RTT: **3 × 500ms = 1.5 seconds minimum** before text is legible. With CSS parse delay and font file download, real-world render block is 2-4 seconds on 3G.

The `next/font` imports (`Geist`, `Geist_Mono`) are already configured in `layout.tsx` but unused because the raw link tags override them.

**Fix — use next/font exclusively:**
```typescript
// app/layout.tsx
import { Manrope, Inter } from 'next/font/google'

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '700', '800'],
  display: 'swap',
  variable: '--font-manrope',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-inter',
})
// Remove all <link> tags pointing to fonts.googleapis.com
// next/font self-hosts fonts at build time — zero runtime CDN requests
```

For `Material Symbols Outlined`: Replace with inline SVG icons or `lucide-react` (already a dependency). Material Symbols is 200KB+ for the variable font file.

**Africa impact:** Eliminates 1.5-4 seconds of render-blocking. Text appears instantly.

**Files:** `app/layout.tsx`, replace Material Symbols usage site-wide
**Cost:** ~2 hours

---

### 1.3 Add ISR to All Public Pages
**Problem:** 0 out of 95 pages use ISR. Every visitor to a professional's portfolio page triggers 6-12 DB queries — even if 1000 people view the same profile in the same minute.

**Fix — add revalidation exports to read-heavy pages:**

| Page | File | Revalidate | Rationale |
|------|------|-----------|-----------|
| Landing | `app/(marketing)/page.tsx` | `3600` | Platform stats, very stable |
| Pro listing | `app/(marketing)/professionnels/page.tsx` | `300` | Search results, semi-static |
| Pro profile | `app/(marketing)/professionnels/[slug]/page.tsx` | `300` | Profile data changes rarely |
| Portfolio item | `app/(marketing)/professionnels/[slug]/realisations/[id]/page.tsx` | `600` | Realisations never change post-publish |
| Public portfolio | Custom domain pages | `600` | Custom domain portfolio pages |

```typescript
// Add to top of each file:
export const revalidate = 300  // 5 minutes
```

Mutations already call `revalidatePath()` — those will bypass the cache immediately when data changes. No extra work needed.

**Africa impact:** After first visitor, 99% of subsequent visitors get cached HTML with zero DB queries. Page arrives in <100ms instead of 600-1000ms.

**Files:** 5 page files listed above
**Cost:** ~30 minutes

---

### 1.4 Lazy-Load Google Maps
**Problem:** Google Maps JS API (~200KB) loads synchronously on any page that uses it. On 3G at 200KB/s: **1 second just to download the script**, blocking all rendering.

**Fix — load only when the map enters the viewport:**
```typescript
// components/location/GoogleMapsScript.tsx
// Replace polling interval with IntersectionObserver
const containerRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        loadGoogleMapsScript()  // only now
        observer.disconnect()
      }
    },
    { threshold: 0.1 }
  )
  if (containerRef.current) observer.observe(containerRef.current)
  return () => observer.disconnect()
}, [])
```

Also: remove the 100ms polling interval that checks if maps loaded — use the existing callback pattern instead.

**Africa impact:** Users who never scroll to the map never download 200KB. Map-heavy pages become 1 second faster on first load.

**Files:** `components/location/GoogleMapsScript.tsx`
**Cost:** ~1 hour

---

### 1.5 Fix Reviews Query — Server-Side Aggregation
**Problem:** `lib/actions/dashboard-stats.ts` fetches ALL review rows to compute the average in JavaScript:
```typescript
const { data: reviews } = await supabase
  .from('reviews')
  .select('rating')
  .eq('professional_id', pro.id)  // no limit — could be thousands of rows
// then loops through all reviews in JS to compute avg
```

At 500 reviews, this transfers unnecessary data over a slow connection.

**Fix — compute AVG in Postgres:**
```typescript
const { data } = await supabase
  .from('reviews')
  .select('rating.avg()')  // Supabase aggregate
  .eq('professional_id', pro.id)
  .single()
```
Or use the existing `avg_rating` column on the `professionals` table if it's kept in sync.

**Africa impact:** Transfers 1 number instead of N rows. Negligible at 5 reviews, important at 500+.

**Files:** `lib/actions/dashboard-stats.ts`
**Cost:** ~30 minutes

---

## Phase 2: Before Launch

### 2.1 Replace Raw `<img>` with Next.js Image
**Problem:** 7+ raw `<img>` tags bypass:
- Lazy loading (images load even if below fold)
- Responsive sizing (full-size image served to mobile)
- AVIF/WebP conversion at delivery time
- Layout shift prevention (no `width`/`height`)

**Files with raw img tags:**
- `app/(client)/projets/[id]/pros/proposal/[proId]/page.tsx`
- `app/(professional)/pro/collaborations/[id]/page.tsx`
- `app/(professional)/pro/google/page.tsx`
- `app/(professional)/pro/portfolio/[id]/page.tsx`

**Fix:**
```typescript
import Image from 'next/image'

// Before
<img src={avatarUrl} className="w-16 h-16 rounded-full" />

// After
<Image
  src={avatarUrl}
  alt="Profile photo"
  width={64}
  height={64}
  className="rounded-full"
  loading="lazy"
  sizes="64px"
/>
```

**Africa impact:** Images load only when visible (no wasted bandwidth below fold). Mobile gets correctly-sized images.

**Cost:** ~1-2 hours

---

### 2.2 Dynamic Imports for Heavy Libraries
**Problem:** `jspdf`, `xlsx`, `recharts`, and `@tiptap/*` are bundled into the initial JS payload even for users who never use PDF export, Excel export, or charts.

Estimated bundle weight of these unused-at-load-time libraries: **~650KB raw, ~200KB gzipped**. On 3G at 100KB/s gzipped: 2 seconds of extra parse/download time on first load.

**Fix — lazy load heavy features:**
```typescript
// PDF export button
const handleExport = async () => {
  const { generatePDF } = await import('@/lib/pdf/generator')
  await generatePDF(data)
}

// Charts component
const RechartsChart = dynamic(() => import('@/components/charts/RechartsChart'), {
  ssr: false,
  loading: () => <div className="h-48 animate-pulse bg-muted rounded" />
})

// Tiptap editor
const RichTextEditor = dynamic(() => import('@/components/editor/RichTextEditor'), {
  ssr: false,
  loading: () => <textarea className="w-full h-32 border rounded p-2" />
})
```

**Africa impact:** Initial page JS shrinks by ~200KB gzipped. Faster Time to Interactive for all users. Heavy libraries only download when the feature is actually used.

**Files:** All components importing `jspdf`, `xlsx`, `recharts`, `@tiptap/*`
**Cost:** ~3 hours

---

### 2.3 Cache Custom Domain Middleware Lookup
**Problem:** `middleware.ts` queries `professional_portfolio` on every request for custom-domain routing. This DB round-trip fires before any page logic runs.

**Fix — cache the result in a Next.js rewrite or use edge config:**
```typescript
// Option A: Use Next.js unstable_cache or a short-lived in-memory map
// Option B: Move custom domain lookup to next.config.ts rewrites if domains are known at build time
// Option C: Cache in middleware using a Set with TTL header-based invalidation
```

Short-term quickest fix: Add a `Cache-Control: s-maxage=3600` approach or check if the custom domain is in a header set by Vercel's edge network.

**Files:** `middleware.ts`
**Cost:** ~2 hours

---

### 2.4 Pagination on Remaining Unbounded Queries
**Problem:** Some list queries still fetch all rows:
- Project logs (returns all logs for a project)
- Pro projects (returns all projects)
- Portfolio realisations (no explicit limit in some paths)

**Fix:** Add `.range(offset, offset + limit - 1)` and expose pagination UI (already done for notifications — use same pattern).

**Files:** `lib/actions/daily-logs.ts`, `lib/actions/pro-projects.ts`, `lib/actions/portfolio.ts`
**Cost:** ~2 hours

---

## Phase 3: When You Have 100+ Users

### 3.1 Upstash Redis for Application Caching
Cache professional profiles, platform stats, and session data with a 5-minute TTL. Upstash Redis is serverless, pay-per-use, ~$0 at early stage.

### 3.2 Service Worker + Offline Strategy
For intermittent connectivity (common in Africa), a service worker that caches shell HTML and static assets lets the app remain partially usable when connections drop.

**Strategy:**
- Cache app shell (layout, navigation, icons) with cache-first
- Cache recently-viewed professional profiles with stale-while-revalidate
- Queue mutations (form submissions) when offline, replay when connection returns

### 3.3 Database Index Audit
When query times increase with data growth, run `EXPLAIN ANALYZE` on slow queries. Priority columns to index: `professional_portfolio.custom_domain`, `project_logs.project_id + date`, `reviews.professional_id`.

### 3.4 AVIF Image Generation
Add AVIF output alongside WebP in the sharp pipeline. AVIF is 50% smaller than WebP at equivalent quality. Critical for 2G users.

---

## What NOT to Do Now

| Technique | Why Wait |
|-----------|----------|
| Redis / Upstash | Overkill for <100 users, adds cost and ops complexity |
| React Query / SWR | Server Actions with ISR handle caching better for this stack |
| Edge Functions for data routes | Supabase is in specific regions — edge doesn't help if DB isn't edge |
| Streaming (Suspense + loading.tsx) | Useful at scale, complex to add, low priority now |
| Per-component ISR granularity | Page-level ISR is sufficient and much simpler |

---

## Priority Order

| # | Task | Effort | Africa Impact | When |
|---|------|--------|---------------|------|
| 1 | **Parallelize 8 dashboard queries** | 1h | -2000ms on dashboard | **Now** |
| 2 | **Switch to next/font (self-hosted fonts)** | 2h | -1500ms render block | **Now** |
| 3 | **Add ISR to 5 public pages** | 30min | 99% cache hit on profiles | **Now** |
| 4 | **Lazy-load Google Maps** | 1h | -1000ms on map pages | **Now** |
| 5 | **Fix reviews query (server AVG)** | 30min | Less data on slow connections | **Now** |
| 6 | **Replace img tags with Next.js Image** | 2h | Lazy loading + correct sizes | Before launch |
| 7 | **Dynamic imports for jspdf/xlsx/recharts** | 3h | -200KB initial JS | Before launch |
| 8 | **Cache middleware domain lookup** | 2h | -1 DB query per request | Before launch |
| 9 | **Paginate remaining list queries** | 2h | Future-proofs for data growth | Before launch |
| 10 | **Service Worker offline strategy** | 1 day | Works on intermittent connections | After 100 users |
