# Performance Improvement Plan — Kelen African Network

## Context

**Africa-first mandate.** Primary users are in sub-Saharan Africa:
- **Bandwidth:** 2G/3G common (50-500 KB/s), data costs money per MB
- **Latency:** 300-800ms RTT (vs 20-80ms in Europe/US)
- **Devices:** Mid-range Android phones, limited RAM
- **Connectivity:** Intermittent — connections drop and resume

Every sequential network request compounds. 8 sequential DB calls at 500ms RTT = 4 seconds minimum before content. 3 Google Fonts CDN requests = 1.5 seconds before text renders. Performance is the product.

---

## Already Done ✅

- Image compression: sharp server-side (WebP), canvas client-side pre-compression
- Quality tiers per bucket (portfolios 80%, log-media 70%, evidence-photos 75%)
- Server Actions for all data fetching (no `useEffect + fetch` on client)
- Proper viewport meta tags
- Google Analytics with `afterInteractive` (non-blocking)
- Pagination on notifications and recommendations
- Admin dashboard uses `Promise.all` for its 6 count queries

---

## Phase 1 — Do Immediately (estimated 5h total)

---

### Task 1: Parallelize Dashboard Stats Queries
**Why:** `lib/actions/dashboard-stats.ts` runs 8 independent DB queries sequentially. At 500ms RTT this is 4 seconds minimum before the dashboard loads. All 8 queries are independent and can run simultaneously.

**Steps:**

1. Open [lib/actions/dashboard-stats.ts](lib/actions/dashboard-stats.ts) and read the entire file.

2. Identify every `await supabase.from(...)` call in the function that fetches dashboard stats. List them in order.

3. Verify that none of these queries use the result of a previous query as input. (They should all be independent — counting different tables.)

4. Replace the sequence of `const { ... } = await supabase...` calls with a single `Promise.all([...])` block:
   ```typescript
   const [
     result1,
     result2,
     result3,
     // ... one entry per query
   ] = await Promise.all([
     supabase.from(...).select(...),
     supabase.from(...).select(...),
     supabase.from(...).select(...),
     // ... all queries here
   ])
   ```

5. Update the variable references below the Promise.all to use the destructured results (`result1.count`, `result2.data`, etc.).

6. Save the file. Check that TypeScript does not report errors.

7. Open the Pro dashboard in the browser and confirm it still displays all stats correctly.

**Verification:** Dashboard loads. No TypeScript errors. All stat values match what was shown before.

---

### Task 2: Self-host Fonts — Remove Google Fonts CDN
**Why:** `app/layout.tsx` loads Manrope, Inter, and Material Symbols from Google's CDN via 3 `<link>` tags. Each is a round-trip to an external server. At 500ms RTT this blocks text rendering for 1.5–4 seconds on every page.

**Steps:**

1. Open [app/layout.tsx](app/layout.tsx) and read the entire file.

2. Find the two `<link rel="preconnect" href="https://fonts.googleapis.com" ...>` tags and the `<link href="https://fonts.googleapis.com/css2?family=Manrope...">` tag. Note exactly which font weights are requested (Manrope 400, 700, 800 — Inter 400, 500, 600).

3. At the top of the file, after the existing imports, add:
   ```typescript
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
   ```

4. In the `<html>` element's `className`, add the font variables:
   ```typescript
   <html lang="fr" className={`${manrope.variable} ${inter.variable}`}>
   ```

5. In the `<head>` section, delete all three of these tags:
   - `<link rel="preconnect" href="https://fonts.googleapis.com" ...>`
   - `<link rel="preconnect" href="https://fonts.gstatic.com" ...>`
   - `<link href="https://fonts.googleapis.com/css2?family=Manrope...">` (Manrope + Inter line)

6. Do NOT yet delete the Material Symbols `<link>` tag — that is handled in Task 3.

7. Open `tailwind.config.ts` (or `tailwind.config.js`). Find where `fontFamily` is defined. Update it to use the CSS variables:
   ```typescript
   fontFamily: {
     sans: ['var(--font-manrope)', 'sans-serif'],
     inter: ['var(--font-inter)', 'sans-serif'],
   }
   ```
   If the config already references font names as strings (e.g. `'Manrope'`), replace them with the variable references above.

8. Save both files. Run the dev server. Open any page and verify that text still renders in Manrope/Inter. Open DevTools → Network → filter by `fonts.googleapis.com` — there should be zero requests.

**Verification:** Text renders correctly. No requests to `fonts.googleapis.com` or `fonts.gstatic.com` in the Network tab.

---

### Task 3: Replace Material Symbols with Lucide Icons
**Why:** The Material Symbols `<link>` tag in `app/layout.tsx` loads a variable font file (~200KB) from Google's CDN. `lucide-react` is already a dependency and covers the same icon set. Removing this CDN request eliminates one more blocking round-trip.

**Steps:**

1. Search the entire codebase for the string `material-symbols` or `Material Symbols` or the class names used (commonly `class="material-symbols-outlined"`). List every file and usage.

2. For each usage, identify which icon name is used (e.g. `home`, `search`, `chevron_right`).

3. Find the equivalent icon in `lucide-react`. Common mappings:
   - `home` → `Home`
   - `search` → `Search`
   - `chevron_right` → `ChevronRight`
   - `close` → `X`
   - `menu` → `Menu`
   - `check` → `Check`
   - `arrow_back` → `ArrowLeft`
   - `person` → `User`
   - `settings` → `Settings`
   - For any icon without an obvious match, search [lucide.dev](https://lucide.dev) for the closest name.

4. For each file found in step 1, replace the Material Symbol span with the lucide-react component:
   ```typescript
   // Before
   <span className="material-symbols-outlined">search</span>
   
   // After
   import { Search } from 'lucide-react'
   <Search className="w-5 h-5" />
   ```

5. After all usages are replaced, open [app/layout.tsx](app/layout.tsx) and delete the remaining Material Symbols `<link>` tag:
   ```html
   <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined..." rel="stylesheet" />
   ```

6. Save all files. Run the dev server. Check every page or component where icons were replaced and confirm the icons still appear and look correct.

**Verification:** No requests to `fonts.googleapis.com` at all in the Network tab. All icons visible and correctly sized.

---

### Task 4: Add ISR to Public Marketing Pages
**Why:** All 95 pages are currently fully dynamic — every request hits the database. Public pages like the landing page and professional profiles rarely change. Adding `export const revalidate` caches the rendered HTML for N seconds. After the first visitor, all subsequent visitors get the cached page with zero DB queries.

**Steps:**

1. Open [app/(marketing)/page.tsx](app/(marketing)/page.tsx). At the very top of the file (before any imports or after the last import), add:
   ```typescript
   export const revalidate = 3600
   ```
   Save the file.

2. Open [app/(marketing)/professionnels/page.tsx](app/(marketing)/professionnels/page.tsx). Add at the top:
   ```typescript
   export const revalidate = 300
   ```
   Save the file.

3. Open [app/(marketing)/professionnels/[slug]/page.tsx](app/(marketing)/professionnels/%5Bslug%5D/page.tsx). Add at the top:
   ```typescript
   export const revalidate = 300
   ```
   Save the file.

4. Search for any other page files inside `app/(marketing)/` that are not already covered. For each one found, add `export const revalidate = 300` unless the page shows personalized data (user-specific content). Do not add revalidate to pages with `cookies()` or session-dependent data.

5. Confirm that the mutation actions that update professional profiles already call `revalidatePath()`. Search for `revalidatePath` in `lib/actions/`. If it exists on profile-update and review-create actions, the cache will be invalidated automatically when data changes — no extra work needed.

6. Deploy or run `next build` locally. Confirm there are no build errors related to the pages modified.

**Verification:** `next build` succeeds with no errors. The pages are listed as ISR (show a revalidate time) in the build output, not as dynamic routes.

---

### Task 5: Lazy-Load Google Maps
**Why:** The Google Maps JavaScript API (~200KB) currently loads synchronously whenever `GoogleMapsScript` is mounted. It blocks rendering and costs 1+ second on 3G, even for users who never scroll down to see the map. It should only load when the map container becomes visible.

**Steps:**

1. Open [components/location/GoogleMapsScript.tsx](components/location/GoogleMapsScript.tsx) and read the entire file.

2. Find the `setInterval` or polling logic that checks if Maps has loaded (approximately every 100ms). Note what it does and what it calls when Maps is ready.

3. Find where the Maps script is injected into the document (the `document.createElement('script')` or equivalent call).

4. Add a `containerRef` to the component:
   ```typescript
   const containerRef = useRef<HTMLDivElement>(null)
   ```

5. Replace the current script-loading logic inside `useEffect` with an `IntersectionObserver` that only loads the script when the container enters the viewport:
   ```typescript
   useEffect(() => {
     const el = containerRef.current
     if (!el) return
   
     const observer = new IntersectionObserver(
       ([entry]) => {
         if (entry.isIntersecting) {
           loadMapsScript()   // move existing script-injection logic into this function
           observer.disconnect()
         }
       },
       { threshold: 0.1 }
     )
     observer.observe(el)
     return () => observer.disconnect()
   }, [])
   ```

6. Remove the polling `setInterval` entirely. Replace it with the existing callback mechanism that Google Maps already provides (the `callback` parameter in the Maps script URL already handles "maps is ready" — no polling needed).

7. Ensure the returned JSX wraps its container in the `ref`:
   ```typescript
   return <div ref={containerRef}>{/* map or placeholder */}</div>
   ```

8. Save the file. Open a page that uses the map. In DevTools → Network, confirm that `maps.googleapis.com` is not requested on page load. Scroll to the map — confirm the request fires and the map loads.

**Verification:** Maps script not in Network tab on page load. Maps loads correctly after scrolling to it.

---

### Task 6: Fix Reviews Query — Use Server-Side Average
**Why:** The dashboard stats function fetches every review row for a professional and computes the average rating in JavaScript. With 500 reviews this transfers unnecessary data over a slow connection. The database can compute the average in a single aggregate query.

**Steps:**

1. Open [lib/actions/dashboard-stats.ts](lib/actions/dashboard-stats.ts). Find the query that fetches reviews, which looks like:
   ```typescript
   const { data: reviews } = await supabase
     .from('reviews')
     .select('rating')
     .eq('professional_id', pro.id)
   ```

2. Check whether the `professionals` table already has an `avg_rating` column. Search for `avg_rating` in the schema files or Supabase types. If it exists and is kept in sync by a database trigger, skip to step 5.

3. If `avg_rating` does not exist or is not reliable, replace the query with a Supabase aggregate:
   ```typescript
   const { data: ratingData } = await supabase
     .from('reviews')
     .select('rating')
     .eq('professional_id', pro.id)
     .limit(1000)  // safety cap — no professional will have more than 1000 reviews at launch
   ```

4. Keep the JavaScript average calculation as-is for now (the `.limit(1000)` prevents unbounded data transfer). This is safe until a better aggregate is set up.

5. Alternatively, if Supabase RPC or a view for `avg_rating` already exists, replace the entire block with:
   ```typescript
   const avgRating = professional.avg_rating ?? 0
   ```
   and remove the reviews query entirely from this function.

6. Save the file. Test the dashboard to confirm the average rating still displays correctly.

**Verification:** Dashboard shows correct average rating. No unbounded query (check with `.explain()` in Supabase dashboard if needed).

---
### Task 7: Replace Raw `<img>` Tags with Next.js Image (Completed)
**Why:** 7+ raw `<img>` tags in the app bypass lazy loading, responsive sizing, and layout-shift prevention. On slow connections, images below the fold load immediately and waste bandwidth.
**Status:** Completed. All instances of raw `<img>` tags replaced with `next/image`. `remotePatterns` updated in `next.config.ts`.

---

### Task 8: Add Dynamic Imports for Heavy Libraries (Completed)
**Why:** `jspdf`, `xlsx`, `recharts`, and `@tiptap/*` were already dynamically imported. `framer-motion` usage has been optimized by extracting animated components into lazy-loaded chunks.

---

### Task 9: Cache Custom Domain Middleware Lookup (Completed)
**Why:** `middleware.ts` queries the `professional_portfolio` table on every request to resolve custom domains. This DB round-trip fires before any page logic runs and cannot be avoided by ISR.
**Status:** Completed. Middleware uses cached lookups where possible.

---

### Task 10: Paginate Remaining Unbounded List Queries (Completed)
**Why:** Some list queries still fetch all rows with no limit. This is safe now with small data, but will become slow as the database grows.
**Status:** Completed. Professional search and project list now use pagination/batching.

---

## Phase 3 — After 100+ Users

These tasks are not urgent now. Add them once you have real usage data.

| Task | When to do it | Why |
|------|--------------|-----|
| Upstash Redis for application caching | When DB costs rise or query times spike | 5-min TTL on profiles/stats |
| Service Worker + offline support | When users report losing work on bad connections | Cache shell HTML and queue mutations offline |
| AVIF image generation in sharp pipeline | When you have budget and WebP is measurably slow | AVIF is 50% smaller than WebP |
| Database index audit | When `EXPLAIN ANALYZE` shows sequential scans | Add indexes on `custom_domain`, `project_id + date`, `professional_id` |
| React Query / SWR | When you have real-time features needing optimistic UI | Not needed until then |

---

## Summary

| # | Task | Phase | Effort | Africa Latency Saved | Status |
|---|------|-------|--------|----------------------|--------|
| 1 | Parallelize 8 dashboard queries | 1 | 1h | ~3500ms | ✅ |
| 2 | Self-host fonts via next/font | 1 | 1.5h | ~1500ms every page | ✅ |
| 3 | Replace Material Symbols with Lucide | 1 | 30min | removes last CDN font block | ✅ |
| 4 | Add ISR to 5 public pages | 1 | 30min | ~1400ms on repeat visits | ✅ |
| 5 | Lazy-load Google Maps | 1 | 1h | ~1000ms on map pages | ✅ |
| 6 | Fix reviews query (add limit) | 1 | 30min | bandwidth safety | ✅ |
| 7 | Replace img with Next.js Image | 2 | 2h | lazy loading + correct sizing | ✅ |
| 8 | Dynamic imports for heavy libs | 2 | 3h | optimized bundles | ✅ |
| 9 | Cache middleware domain lookup | 2 | 2h | -1 DB query per request | ✅ |
| 10 | Paginate remaining list queries | 2 | 2h | bandwidth + DB safety | ✅ |
| 11 | Final Performance Sweep | 3 | 2h | Regression testing | 🔄 |
