# Performance Summary — Kelen African Network

## Africa-First Baseline (Audited April 2026)

**Target environment:** Sub-Saharan Africa — 2G/3G (50-500 KB/s), 300-800ms RTT, expensive data, mid-range Android devices.

At these network conditions, **every sequential server round-trip adds 300-800ms to page load**. This compounds: a page with 8 sequential DB queries is 2.4-6.4 seconds slower than a page with 1, before any bytes of HTML arrive.

---

## Current State vs Target

### Dashboard (Pro & Client) — CRITICAL PATH

| Step | Current (Africa, 500ms RTT) | After Phase 1 | After Phase 1+2 |
|------|-----------------------------|----------------|-----------------|
| DB queries (dashboard stats) | 8 sequential → **4000ms minimum** | 1 parallel batch → **500ms** | 1 parallel batch → **500ms** |
| Font render block | 3 Google CDN requests → **1500ms** | 0 (self-hosted) → **0ms** | 0ms |
| Total time to first content | **~5500ms on 3G** | **~700ms** | **~500ms** |
| **Improvement** | baseline | **~87% faster** | **~91% faster** |

### Public Pages (Landing, Professional Profiles)

| Metric | Current | After Phase 1 | After Phase 1+2 |
|--------|---------|----------------|-----------------|
| DB queries per profile load | 6-12 (dynamic, every request) | 0 (ISR cache hit) | 0 |
| First visitor experience | 600-1200ms + font block | 400-700ms | 150-300ms |
| Repeat visitor (< 5 min) | 600-1200ms (always fresh) | **~30-80ms** (served from cache) | ~30ms |
| Data transferred per page | All columns (est. 80-150KB HTML) | Cached HTML + selected columns | Cached + optimized images |
| **Improvement (repeat visitors)** | baseline | **~90-95% faster** | **~95% faster** |

### Map Pages (Pro Listing, Location Features)

| Metric | Current | After Phase 1 |
|--------|---------|----------------|
| Google Maps script download | Synchronous, ~200KB, blocks render | Lazy (IntersectionObserver), loads only when visible |
| Time to interactive (users who don't scroll to map) | +1000ms for Maps load | **0ms** (never loads) |
| Time to interactive (users who scroll to map) | Maps blocks initial render | Maps loads after content is visible |
| **Savings for typical user** | — | **500-1000ms** |

### Image-Heavy Pages (Portfolio, Journal, Proposals)

| Metric | Current | After Phase 2 |
|--------|---------|----------------|
| Below-fold images | Load immediately (no lazy load) | Load only when scrolled into view |
| Mobile image size | Full-size (1920px) served to 375px screen | Correctly sized (375px-level) |
| WebP compression | ✅ Already active on upload | ✅ + AVIF planned (Phase 3) |
| Estimated bandwidth saving on portfolio page | baseline | **40-60% less** |

### Heavy Feature Pages (PDF Export, Excel, Charts)

| Metric | Current | After Phase 2 |
|--------|---------|----------------|
| Initial JS bundle (jspdf + xlsx + recharts + tiptap) | ~650KB raw / ~200KB gzipped | **Not in initial bundle** |
| PDF/Excel/Chart download | On page load (wasted if unused) | On first use only |
| Time to Interactive improvement | +2s on 3G from unused JS | **~1-2s saved** |

---

## Aggregate Impact (All Phases)

### Database Query Reduction

| Area | Before | After Phase 1 | After Phase 1+2 |
|------|--------|----------------|-----------------|
| Dashboard stats queries | 8 sequential | 1 parallel batch | 1 parallel batch |
| Public profile page (repeat visit) | 6-12 queries | **0** (ISR cache) | 0 |
| Middleware custom domain lookup | 1 per request | 1 per request | **0** (cached) |
| Reviews average | Fetch all rows + JS avg | Server-side AVG() | Server-side AVG() |
| **Effective queries per user session** | ~20-30 | **~5-8** | **~3-5** |
| **Reduction** | baseline | **~70-75% fewer** | **~80-85% fewer** |

### Latency Reduction (Africa, 500ms RTT baseline)

| Scenario | Before | After Phase 1 | Gain |
|----------|--------|----------------|------|
| Dashboard (Pro) — cold load | ~5500ms | ~700ms | **-87%** |
| Professional profile — first visit | ~1500ms | ~600ms | **-60%** |
| Professional profile — repeat visit | ~1500ms | ~50ms | **-97%** |
| Page with Google Maps — no scroll | +1000ms Maps overhead | 0ms | **-100%** |
| Any page — font render block | +1500ms | 0ms | **-100%** |
| PDF/Excel export — initial page load penalty | +2s bundle parse | 0ms | **-100%** |

### Bandwidth Reduction

| Content Type | Before | After | Saving |
|-------------|--------|-------|--------|
| Fonts | 3 CDN requests + WOFF2 files | Self-hosted, pre-cached by Next.js | **First load: same; repeat: 100% cached** |
| Images (below fold) | All load immediately | Load on demand | **Up to 60% fewer bytes on short sessions** |
| Initial JS bundle | +200KB gzipped (heavy libs) | Heavy libs deferred | **~200KB saved on initial load** |
| DB response data (reviews) | N rows × row size | 1 number (AVG) | **Negligible now, critical at scale** |

---

## Realistic Expectations by Scale

### Now (< 50 users)
The improvements that matter most:
- **Dashboard parallelization** — felt immediately by every Pro logging in
- **Font fix** — felt by every visitor, every page
- **ISR on profiles** — felt after the first visitor warms the cache
- **Google Maps lazy** — felt on any page with a map widget

Improvements that are "infrastructure":
- Column selection, pagination — DB is fast at small scale, but patterns are correct for growth

### At 500+ professionals, 2000+ users
The improvements become existential:
- Without ISR: 2000 users viewing 500 profiles = 1M+ DB queries per day
- Without parallel dashboard queries: every Pro login takes 5+ seconds as tables grow
- Without pagination: a professional with 500 project logs downloads all 500 on every visit
- Without lazy images: a portfolio with 30 realisations downloads all 30 images on load

---

## Implementation Cost vs Return

| Task | Effort | Latency Saved (Africa) | Status |
|------|--------|------------------------|--------|
| Parallelize dashboard queries | 1h | **-3500ms on dashboard** | Not done |
| Self-host fonts (next/font) | 2h | **-1500ms every page** | Not done |
| ISR on 5 public pages | 30min | **-1400ms repeat visits** | Not done |
| Lazy-load Google Maps | 1h | **-1000ms on map pages** | Not done |
| Fix reviews aggregation | 30min | -bandwidth at scale | Not done |
| Replace img → Next.js Image | 2h | -bandwidth on image pages | Not done |
| Dynamic imports (jspdf/xlsx/recharts) | 3h | **-2s initial JS parse** | Not done |
| Cache middleware domain lookup | 2h | -1 DB query/request | Not done |
| Paginate remaining list queries | 2h | -bandwidth at scale | Not done |
| **Total Phase 1 (5h)** | **5h** | **~5-6 seconds saved** | — |
| **Total Phase 1+2 (14h)** | **14h** | **~7-8 seconds saved** | — |

---

## What Was Already Done Well

| Area | Status |
|------|--------|
| Image compression (sharp + WebP + quality tiers) | ✅ Complete |
| Client-side pre-compression before upload | ✅ Complete |
| Server Actions for all data fetching (no useEffect+fetch) | ✅ Complete |
| Proper viewport meta tags | ✅ Complete |
| GA with `afterInteractive` strategy | ✅ Complete |
| Pagination on notifications and recommendations | ✅ Complete |
| Admin dashboard uses Promise.all | ✅ Complete |
| File validation before upload | ✅ Complete |

---

## Bottom Line

**The single most impactful 5 hours of work for African users:**

1. Parallelize dashboard queries → -3500ms dashboard load
2. Switch to next/font (self-host) → -1500ms every page
3. Add ISR to 5 public pages → -1400ms repeat profile visits
4. Lazy-load Google Maps → -1000ms map pages

**Combined: ~7-8 seconds removed from common user journeys on African 3G connections.**

At 500ms RTT, these aren't polish — they are the difference between an app that works and one that doesn't.
