# Performance Improvement Plan — Kelen African Network

## Context
Early-stage platform with few users. No caching exists. Every request hits the database directly. Goal: build solid foundations now that scale gracefully, without over-engineering for current low traffic.

---

## Phase 1: Foundational — Do Now (Low Effort, High Long-Term Value)

### 1.1 Move Role from DB Query to JWT Claim
**Problem:** `middleware.ts` queries the `users` table on every protected route request. This adds a Supabase round-trip before page rendering even begins.

**Solution:** Store `role` in a custom Supabase JWT claim during signup/login. Middleware reads it from the session token instead of hitting the database.

**Files affected:**
- `middleware.ts` — remove `users` table query
- `lib/supabase/server.ts` — parse role from session
- Auth flow (signup/login actions) — ensure role is embedded in JWT

**Why now:** Eliminates a DB query on every single page load. Simple change with compounding benefit.

**Cost:** ~1-2 hours

---

### 1.2 Add Revalidation to Static-Like Pages
**Problem:** Professional profile pages (`/professionnels/[slug]`) make 6+ queries per load. Data rarely changes (profiles, reviews, realizations). Currently re-fetched on every request.

**Solution:** Add `export const revalidate = 300` (5 minutes) to pages with semi-static data. Combine with existing `revalidatePath()` calls in mutations for automatic invalidation.

**Pages to target:**
| Page | Revalidate | Reason |
|------|-----------|--------|
| `/professionnels/[slug]` | 300s | Profile data changes rarely |
| `/` (landing) | 300s | Platform metrics, not user-critical |
| `/professionnels` (listing) | 300s | Search results, semi-static |
| Portfolio pages | 300s | Realizations change infrequently |

**Files affected:**
- `app/(marketing)/professionnels/[slug]/page.tsx`
- `app/(marketing)/professionnels/page.tsx`
- `app/(marketing)/page.tsx`
- Mutation actions already call `revalidatePath()` — no changes needed there

**Why now:** Zero-cost optimization. Next.js handles it. Cuts DB load by ~80% on public pages.

**Cost:** ~30 min (add exports, test)

---

### 1.3 Select Only Needed Columns
**Problem:** Queries use `.select("*")` everywhere, fetching all columns even when only 2-3 fields are needed.

**Solution:** Specify columns explicitly in high-traffic queries.

**Examples:**
```typescript
// Before (wasteful)
const { data } = await supabase.from('professionals').select('*').eq('id', id)

// After (lean)
const { data } = await supabase
  .from('professionals')
  .select('id, business_name, slug, status, category, city, avg_rating, review_count')
  .eq('id', id)
```

**Priority queries to optimize:**
- Professional listing (fetches all columns, only needs ~8 fields)
- Navbar/sidebar user profile (only needs `display_name`, `role`, `avatar`)
- Project listing (doesn't need `objectives` JSON on list view)

**Why now:** Reduces bandwidth and DB work. No architectural change needed.

**Cost:** ~2 hours

---

## Phase 2: Structural — Do Before Launch (Prevents Future Pain)

### 2.1 Add Pagination to List Queries
**Problem:** `getProjectLogs`, `getProProjects`, `getNotifications` fetch ALL rows. With 10 logs it's fine. With 500 logs it won't be.

**Solution:** Add `limit` and `offset` parameters (or cursor-based pagination for large datasets).

**Functions to update:**
| Function | Default Limit | File |
|----------|--------------|------|
| `getProjectLogs` | 50 | `lib/actions/daily-logs.ts` |
| `getProProjects` | 50 | `lib/actions/pro-projects.ts` |
| `getNotifications` | 50 | `lib/actions/notifications.ts` |
| `getRealizations` | 20 | `lib/actions/portfolio.ts` |
| `getReviews` | 20 | `lib/actions/reviews.ts` |

**Pattern:**
```typescript
export async function getProjectLogs(projectId: string, options?: { limit?: number; offset?: number }) {
  const limit = options?.limit ?? 50
  const offset = options?.offset ?? 0
  
  const { data, count, error } = await supabase
    .from('project_logs')
    .select('*', { count: 'exact' })
    .eq('project_id', projectId)
    .order('date', { ascending: false })
    .range(offset, offset + limit - 1)
  
  return { data, count, error }
}
```

**Why before launch:** Data growth is invisible until it bites. Pagination is easy to add now, painful to retrofit.

**Cost:** ~3 hours

---

### 2.2 Batch Signed URL Generation
**Problem:** Journal page calls `getMediaUrl()` sequentially for every media item. 10 media items = 10 sequential Supabase API calls.

**Solution:** Use `Promise.all()` to generate signed URLs in parallel.

**Files affected:**
- `app/(client)/projets/[id]/journal/page.tsx` — client-side sequential awaits
- `app/api/journal-pdf/route.ts` — server-side sequential awaits

**Pattern:**
```typescript
// Before (sequential — N round trips)
for (const media of mediaItems) {
  const url = await getMediaUrl(media.path)
  media.signedUrl = url
}

// After (parallel — 1 round trip batch)
const urls = await Promise.all(
  mediaItems.map(m => getMediaUrl(m.path))
)
mediaItems.forEach((m, i) => m.signedUrl = urls[i])
```

**Why before launch:** Users will notice slow journal loads. Parallel requests are 5-10x faster.

**Cost:** ~1 hour

---

### 2.3 Centralize Scattered DB Queries
**Problem:** Some components query Supabase directly from `useEffect`, bypassing the Server Action layer:
- `ValidationPage.tsx`
- `ProjectPhotoUpload.tsx`
- `ProSidebar.tsx`
- `ProNavbar.tsx`

This means:
- No caching possible (bypasses Server Component cache)
- No deduplication (two components can fetch same data)
- Harder to maintain

**Solution:** Move these queries into Server Actions or Server Components. Client components should receive data as props or call Server Actions.

**Migration plan:**
| Component | Current | Target |
|-----------|---------|--------|
| `ValidationPage.tsx` | Direct Supabase in useEffect | Server Action |
| `ProjectPhotoUpload.tsx` | Direct Supabase in useEffect | Server Action + props |
| `ProSidebar.tsx` | Direct Supabase in useEffect | Server Component data fetch |
| `ProNavbar.tsx` | Direct Supabase in useEffect | Server Component data fetch |

**Why before launch:** Centralization enables caching, deduplication, and easier testing.

**Cost:** ~3 hours

---

## Phase 3: Scale — Do When You Have 100+ Users

### 3.1 Add Application-Level Caching (Redis/Upstash)
**When:** When DB load becomes noticeable (slow queries, rate limits, cost spikes).

**What to cache:**
- Professional profile pages (TTL: 5 min)
- Platform metrics / landing page stats (TTL: 15 min)
- Professional listing (TTL: 5 min)
- User session/role (TTL: 1 hour)

**Recommended:** Upstash Redis (serverless, pay-per-use, ~$0 for early stage).

**Cost later:** ~1 day setup + $0-5/mo at early stage

---

### 3.2 Add React Query / SWR for Client-Side Caching
**When:** When client-side components make redundant requests or you need optimistic UI updates.

**What it solves:**
- Deduplicates concurrent requests
- Background refetch on window focus
- Optimistic updates for mutations
- Shared cache across components

**Cost later:** ~2 days integration

---

### 3.3 Database Indexes Review
**When:** When queries slow down with growing data.

**Action:** Review slow queries, add missing indexes on frequently filtered/sorted columns. Most indexes likely already exist from Supabase conventions, but worth auditing at scale.

---

## What NOT to Do Now

| Technique | Why Wait |
|-----------|----------|
| Redis / external cache | Overkill for <100 users, adds operational complexity |
| React Query / SWR | Client-side deduplication isn't a bottleneck yet |
| Edge Functions | No compute-heavy operations need edge deployment |
| CDN for API | Next.js on Vercel already handles this |
| Query result memoization | Premature — DB is fast at small scale |

---

## Priority Summary

| Phase | Effort | Impact | When |
|-------|--------|--------|------|
| **1.1 JWT role in middleware** | Low | High — removes DB query on every request | Now |
| **1.2 Revalidate static-like pages** | Low | High — cuts DB hits ~80% on public pages | Now |
| **1.3 Select needed columns only** | Low | Medium — less bandwidth, faster queries | Now |
| **2.1 Pagination on lists** | Medium | High — prevents future slowdown | Before launch |
| **2.2 Batch signed URLs** | Low | Medium — 5-10x faster media loads | Before launch |
| **2.3 Centralize scattered queries** | Medium | Medium — enables caching, cleaner code | Before launch |
| **3.x Scale optimizations** | High | High — but only matters at 100+ users | Later |

---

## Implementation Order Recommendation

Start with **Phase 1** items. They're quick, low-risk, and compound in value as traffic grows. Phase 2 should be completed before any public launch or marketing push. Phase 3 can wait until you have real usage data to justify the investment.
