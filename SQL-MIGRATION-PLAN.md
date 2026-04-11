# TypeScript → SQL Migration Plan

## Context
Many TypeScript functions fetch raw rows from the database then do aggregation, filtering, sorting, and grouping in JavaScript. SQL can do all of these natively — often 10-100x faster because the computation happens inside the database, not after transferring all rows over the network.

---

## How to Read This Plan

| Gain | Meaning |
|------|---------|
| **HIGH** | Transfers 10-100x less data. Replaces N queries with 1. Obvious win. |
| **MEDIUM** | Reduces round-trips. Less data over wire. Worth doing. |
| **LOW** | Data is already in memory. JS computation is cheap on small datasets. Nice cleanup but not urgent. |

---

## Priority 1: HIGH Gain — Do Now

### 1.1 Dashboard Stats — Average Rating

**File:** `lib/actions/dashboard-stats.ts:88-96`

**Current (wasteful):**
```typescript
// Fetches EVERY review row just to compute an average
const { data: reviews } = await supabase
  .from("reviews").select("rating").eq("professional_id", pro.id);
const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
```

**SQL replacement:**
```typescript
const { data } = await supabase
  .from("reviews")
  .select("avg_rating, review_count", { count: "exact" })
  .eq("professional_id", pro.id)
  .single();

// OR via RPC for even cleaner code:
const { data } = await supabase.rpc("get_review_stats", { prof_id: pro.id });
```

```sql
-- If using direct query:
SELECT AVG(rating) as avg_rating, COUNT(*) as review_count
FROM reviews WHERE professional_id = $1;
```

**Why it matters:** A pro with 200 reviews currently transfers 200 rows to Next.js, then sums them in JS. SQL transfers 1 row with the pre-computed answer.

**Effort:** 15 min

---

### 1.2 Journal Stats — Sum & Unique Days

**File:** `lib/actions/journal-stats.ts:17-45`

**Current (wasteful):**
```typescript
// Fetches ALL log rows, then sums in JS
const totalSpent = logs.reduce((sum, log) => sum + (log.money_spent || 0), 0);
// Counts unique dates via Set
const uniqueDates = new Set(logs.map(log => log.log_date)).size;
// Then fires ANOTHER separate query for photo count
```

**SQL replacement — single query for everything:**
```typescript
const { data } = await supabase.rpc("get_project_journal_stats", { proj_id: projectId });
```

```sql
CREATE OR REPLACE FUNCTION get_project_journal_stats(proj_id uuid)
RETURNS TABLE (
  log_count bigint,
  total_spent numeric,
  currency text,
  days_worked bigint,
  photo_count bigint
) LANGUAGE sql STABLE AS $$
  SELECT
    (SELECT COUNT(*) FROM project_logs WHERE project_id = proj_id) as log_count,
    (SELECT COALESCE(SUM(money_spent), 0) FROM project_logs WHERE project_id = proj_id) as total_spent,
    (SELECT COALESCE(MAX(money_currency)::text, 'XOF') FROM project_logs WHERE project_id = proj_id) as currency,
    (SELECT COUNT(DISTINCT log_date) FROM project_logs WHERE project_id = proj_id) as days_worked,
    (SELECT COUNT(*) FROM project_log_media m
     JOIN project_logs l ON l.id = m.log_id
     WHERE l.project_id = proj_id) as photo_count;
$$;
```

**Why it matters:** Currently 2 round-trips (logs + photo count) plus JS computation. Becomes 1 round-trip, 0 JS computation.

**Effort:** 30 min

---

### 1.3 Realisations Page — N+1 Likes/Comments Count

**File:** `app/(marketing)/professionnels/[slug]/realisations/page.tsx:52-77`

**Current (N+1 disaster):**
```typescript
// For 20 realizations: fires 40 separate COUNT queries!
const likesData = await Promise.all(
  realizationIds.map(async (id) => {
    const { count } = await supabase
      .from("realization_likes")
      .select("*", { count: 'exact', head: true })
      .eq("realization_id", id);
    return { id, count: count || 0 };
  })
);
// Same pattern again for comments... = 2*N queries total
```

**SQL replacement — 2 queries total, regardless of count:**
```typescript
// Single query for ALL like counts
const { data: likesData } = await supabase
  .from("realization_likes")
  .select("realization_id, count:realization_id")
  .in("realization_id", realizationIds)
  .group("realization_id");

// Or more reliably via raw query:
const { data: likesData } = await supabase.rpc("get_realization_like_counts", {
  real_ids: realizationIds
});
```

```sql
CREATE OR REPLACE FUNCTION get_realization_like_counts(real_ids uuid[])
RETURNS TABLE (realization_id uuid, like_count bigint, comment_count bigint)
LANGUAGE sql STABLE AS $$
  SELECT
    r.id as realization_id,
    COUNT(DISTINCT rl.id) as like_count,
    COUNT(DISTINCT rc.id) as comment_count
  FROM unnest(real_ids) as r(id)
  LEFT JOIN realization_likes rl ON rl.realization_id = r.id
  LEFT JOIN realization_comments rc ON rc.realization_id = r.id
  GROUP BY r.id;
$$;
```

**Why it matters:** 20 realizations = 40 queries now. With SQL function = 1 query. 40x reduction. This is the classic N+1 anti-pattern.

**Effort:** 45 min

---

### 1.4 Analytics Page — Multiple Count Queries + In-Memory Grouping

**File:** `app/(professional)/pro/analytique/page.tsx:48-131`

**Current (wasteful on multiple levels):**
```typescript
// 5 separate COUNT queries against same tables
const { count: totalViews } = await supabase.from("profile_views").select("*", { count: 'exact', head: true })...
const { count: monthlyViews } = await supabase.from("profile_views").select("*", { count: 'exact', head: true })...
const { count: searchAppearances } = await supabase.from("profile_views").select("*", { count: 'exact', head: true })...

// Then fetches ALL rows for charts, then groups in JS
const { data: allViews } = await supabase.from("profile_views").select("created_at, source")...
// Groups by month manually in JS with findIndex + count++
// Groups by source manually in JS with counts[source] = (counts[source] || 0) + 1
```

**SQL replacement — 3 queries instead of 7+:**
```typescript
// Query 1: All view stats in one
const { data: viewStats } = await supabase.rpc("get_profile_view_stats", { prof_id: professionalId });

// Query 2: Monthly chart data (pre-grouped)
const { data: monthlyData } = await supabase
  .from("profile_views")
  .select("month:created_at, count:created_at")
  .eq("professional_id", professionalId)
  .gte("created_at", sixMonthsAgo)
  // Note: Next.js Supabase doesn't support DATE_TRUNC directly
  // Use RPC instead:
const { data: monthlyData } = await supabase.rpc("get_monthly_views", {
  prof_id: professionalId,
  since: sixMonthsAgo
});

// Query 3: Traffic sources (pre-grouped)
const { data: sources } = await supabase.rpc("get_traffic_sources", {
  prof_id: professionalId
});
```

```sql
CREATE OR REPLACE FUNCTION get_profile_view_stats(prof_id uuid)
RETURNS TABLE (total_views bigint, monthly_views bigint, search_appearances bigint)
LANGUAGE sql STABLE AS $$
  SELECT
    COUNT(*) as total_views,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as monthly_views,
    COUNT(*) FILTER (WHERE source = 'search') as search_appearances
  FROM profile_views
  WHERE professional_id = prof_id;
$$;

CREATE OR REPLACE FUNCTION get_monthly_views(prof_id uuid, since timestamptz)
RETURNS TABLE (month text, count bigint)
LANGUAGE sql STABLE AS $$
  SELECT
    TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month,
    COUNT(*) as count
  FROM profile_views
  WHERE professional_id = prof_id AND created_at >= since
  GROUP BY DATE_TRUNC('month', created_at)
  ORDER BY DATE_TRUNC('month', created_at);
$$;

CREATE OR REPLACE FUNCTION get_traffic_sources(prof_id uuid)
RETURNS TABLE (source text, count bigint)
LANGUAGE sql STABLE AS $$
  SELECT
    COALESCE(source, 'direct') as source,
    COUNT(*) as count
  FROM profile_views
  WHERE professional_id = prof_id
  GROUP BY source
  ORDER BY count DESC;
$$;
```

**Why it matters:** Transfers potentially thousands of raw rows to group them into 4-6 aggregated values. SQL transfers only the 4-6 aggregated values directly.

**Effort:** 1.5 hours

---

## Priority 2: MEDIUM Gain — Do Before Launch

### 2.1 Journal PDF — In-Memory Aggregations

**File:** `lib/actions/journal-export.ts:123-154`

**Current:**
```typescript
const approvedCount = exportLogs.filter(l => l.status === 'approved' || l.status === 'resolved').length;
const contestedCount = exportLogs.filter(l => l.status === 'contested').length;
const totalBudget = exportLogs.reduce((sum, log) => sum + Number(log.money_spent || 0), 0);
const periodStart = sortedLogs[0]?.log_date;
const periodEnd = sortedLogs[sortedLogs.length - 1]?.log_date;
```

**SQL replacement:**
```sql
SELECT
  COUNT(*) FILTER (WHERE status IN ('approved', 'resolved')) as approved_count,
  COUNT(*) FILTER (WHERE status = 'contested') as contested_count,
  COALESCE(SUM(money_spent), 0) as total_budget,
  MIN(log_date) as period_start,
  MAX(log_date) as period_end
FROM project_logs
WHERE pro_project_id = $1;
```

**Effort:** 20 min

---

### 2.2 Journal PDF — N+1 Comment Fetches

**File:** `lib/actions/journal-export.ts:100-113`

**Current:**
```typescript
const exportLogs = await Promise.all(
  logs.map(async (log) => {
    const comments = await getLogComments(log.id); // 1 query per log
    ...
  })
);
// M logs = M comment queries
```

**SQL replacement — fetch all comments for all logs in 1 query:**
```typescript
// Single query for ALL comments
const { data: allComments } = await supabase
  .from("project_log_comments")
  .select("*, author:users(display_name)")
  .in("log_id", logIds);

// Group in JS (now cheap — comments are small)
const commentsByLog = new Map();
allComments?.forEach(c => {
  const arr = commentsByLog.get(c.log_id) || [];
  arr.push(c);
  commentsByLog.set(c.log_id, arr);
});
```

**Why it matters:** 20 logs = 20 comment queries now. Becomes 1 query.

**Effort:** 30 min

---

### 2.3 Dashboard Stats — 5 Separate Count Queries

**File:** `lib/actions/dashboard-stats.ts:73-119`

**Current:** 5 sequential `.select('*', {head: true, count: 'exact'})` calls against the same tables with different filters.

**SQL replacement:**
```sql
CREATE OR REPLACE FUNCTION get_pro_dashboard_stats(prof_id uuid)
RETURNS TABLE (
  total_recommendations bigint,
  pending_recommendations bigint,
  total_signals bigint,
  pending_signals bigint,
  monthly_views bigint
) LANGUAGE sql STABLE AS $$
  SELECT
    (SELECT COUNT(*) FROM recommendations WHERE professional_id = prof_id) as total_recommendations,
    (SELECT COUNT(*) FROM recommendations WHERE professional_id = prof_id AND status = 'pending') as pending_recommendations,
    (SELECT COUNT(*) FROM signals WHERE professional_id = prof_id) as total_signals,
    (SELECT COUNT(*) FROM signals WHERE professional_id = prof_id AND status = 'pending') as pending_signals,
    (SELECT COUNT(*) FROM profile_views WHERE professional_id = prof_id AND created_at > NOW() - INTERVAL '30 days') as monthly_views;
$$;
```

**Effort:** 30 min

---

### 2.4 Log Authorization — Sequential Queries

**File:** `lib/actions/log-comments.ts` — `approveLog()`, `contestLog()`, `resolveLog()`

**Current:** 3-4 sequential queries to verify ownership (get log → check user_projects → check pro_projects → verify pro ownership).

**SQL replacement — single authorization check:**
```sql
-- Inline subquery in the existing SELECT:
SELECT pl.*
FROM project_logs pl
WHERE pl.id = $1
AND (
  (pl.project_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.id = pl.project_id AND up.user_id = auth.uid()
  ))
  OR
  (pl.pro_project_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM pro_projects pp
    JOIN professionals pr ON pp.professional_id = pr.id
    WHERE pp.id = pl.pro_project_id AND pr.user_id = auth.uid()
  ))
);
```

If this query returns 0 rows, the user has no access — no further queries needed.

**Effort:** 30 min

---

## Priority 3: LOW Gain — Cleanup When Convenient

### 3.1 Landing Page — Post-Fetch Sort

**File:** `app/(marketing)/page.tsx:18-32`

Only 12 rows. JS sort is trivial. But SQL ordering is cleaner:

```sql
SELECT * FROM professionals
WHERE status != 'black' AND is_visible = true AND is_active = true
ORDER BY
  CASE status
    WHEN 'gold' THEN 0 WHEN 'silver' THEN 1 WHEN 'white' THEN 2
    WHEN 'red' THEN 3 ELSE 4
  END,
  recommendation_count DESC
LIMIT 12;
```

**Effort:** 10 min

---

### 3.2 Admin Queue — In-Memory Filter

**File:** `app/(admin)/admin/queue/page.tsx:26-29`

```typescript
const recommendations = queueItems?.filter(i => i.item_type === "recommendation");
const signals = queueItems?.filter(i => i.item_type === "signal");
```

Can be done in SQL with conditional aggregation, but the JS `.filter()` on a small pending list is fine. Optional cleanup.

**Effort:** 10 min

---

### 3.3 Toggle Like — 3 Sequential Queries

**File:** `lib/actions/realization-likes.ts:12-37`

Could be reduced from 3 queries to 2 with an upsert + RPC function, but each query is fast and the operation is infrequent.

**Effort:** 30 min

---

### 3.4 Export Data — In-Memory Mapping

**File:** `lib/actions/export-data.ts:67-95`

The `.map()` operations on already-fetched data are O(n) and acceptable. The export needs all rows anyway, so the JS transformation is not wasteful.

**No action needed.**

---

## Summary: All SQL Functions to Create

| Function | Purpose | Priority | File to Update |
|----------|---------|----------|---------------|
| `get_review_stats(prof_id)` | AVG + COUNT reviews in 1 call | **P1** | `dashboard-stats.ts` |
| `get_project_journal_stats(proj_id)` | COUNT, SUM, MAX, COUNT DISTINCT in 1 call | **P1** | `journal-stats.ts` |
| `get_realization_like_counts(real_ids[])` | GROUP BY likes + comments for N realizations | **P1** | `realisations/page.tsx` |
| `get_profile_view_stats(prof_id)` | 3 filtered counts in 1 call | **P1** | `analytique/page.tsx` |
| `get_monthly_views(prof_id, since)` | DATE_TRUNC GROUP BY for chart data | **P1** | `analytique/page.tsx` |
| `get_traffic_sources(prof_id)` | GROUP BY source for pie chart | **P1** | `analytique/page.tsx` |
| `get_pro_dashboard_stats(prof_id)` | 5 dashboard counts in 1 call | **P2** | `dashboard-stats.ts` |

---

## General Rule Going Forward

| Do in SQL | Do in TypeScript |
|-----------|-----------------|
| COUNT, SUM, AVG, MIN, MAX | Formatting strings for display |
| GROUP BY for charts/reports | UI state management |
| FILTER (WHERE ...) for conditional counts | Conditional rendering |
| JOINs to combine data | Transforming data shapes for components |
| ORDER BY for sorting | Sorting already-small arrays (< 100 items) |
| DISTINCT for unique values | Deduplicating small arrays |
| EXISTS for authorization checks | Client-side form validation |

**Rule of thumb:** If the operation reduces data (N rows → 1 value), do it in SQL. If it transforms data for display (1 row → 1 formatted string), TypeScript is fine.

---

## Estimated Total Impact

| Metric | Before | After |
|--------|--------|-------|
| Dashboard stats queries | 7+ sequential | 1-2 RPC calls |
| Journal stats queries | 2 round-trips + JS math | 1 RPC call |
| Realisations likes/comments | 2×N queries (40 for 20 items) | 1 query |
| Analytics page queries | 7+ plus thousands of rows | 3 queries, dozens of bytes |
| Data transferred for analytics | N raw rows (growing) | 3-6 aggregated rows (constant) |

**Total effort for P1 items:** ~2.5 hours
**Total effort for P2 items:** ~1.5 hours

Start with P1. They give the most performance gain per hour invested.
