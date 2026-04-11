# Backend Migration Plan — Edge Functions & Server-Side Processing

## Context
The project has **zero Edge Functions** and **no `supabase/functions/` directory**. All compute runs inside Next.js server actions or API routes. Several operations are blocking user actions with unnecessary synchronous work (emails, PDF generation, AI calls). This plan identifies what to move to the backend and why.

---

## Why Edge Functions vs Next.js API Routes

| Factor | Next.js API Route | Supabase Edge Function |
|--------|------------------|----------------------|
| Cold start | Slow (Node.js boot) | Fast (Deno, lightweight) |
| Proximity to DB | Network round-trip | Colocated with Supabase |
| Best for | SSR, rendering, UI flows | Background jobs, webhooks, queues |
| Cost | Vercel serverless pricing | Supabase edge pricing (pay-per-invocation) |
| Cron support | Via Vercel cron | Via Supabase pg_cron |

**Rule of thumb:**
- **Edge Function** = background jobs, webhooks, cron, fire-and-forget, external API calls
- **Next.js API route** = user-facing features, SSR, UI rendering, PDF/HTML generation

---

## Priority 1: Decouple Blocking Operations (Do Now)

These operations block the user's request because they run synchronously. The user waits for things that should be fire-and-forget.

### 1.1 Email Notifications → Edge Function with Queue

**Current state:** Every email via Resend blocks the server action. User approves a log → waits for email API → then gets a response.

**Affected operations:**
| Function | File | Email Type | Blocks |
|----------|------|-----------|--------|
| `approveLog()` | `lib/actions/log-comments.ts:14` | Log action approved | User approval action |
| `contestLog()` | `lib/actions/log-comments.ts:151` | Log action contested | User contest action |
| `resolveLog()` | `lib/actions/log-comments.ts:251` | Log action resolved | User resolve action |
| `createClientContact()` | `lib/actions/pro-project-clients.ts:65` | Client invitation | Client creation |
| `resendInvitation()` | `lib/actions/pro-project-clients.ts:274` | Invitation reminder | Resend action |

**Proposed architecture:**
```
Server Action                    Edge Function (async)
     │                                │
     ├── Insert log update            │
     ├── Insert notification record ──┼──► pg_notify / pg_net
     └── Return to user immediately   │    (fire-and-forget)
                                      │
                               Later (ms later)
                                      │
                               Read notification queue
                               Send Resend email
                               Mark as sent
```

**Implementation:**
1. Create Edge Function `send-email` at `supabase/functions/send-email/index.ts`
2. Server actions insert a row into a `email_queue` table instead of calling Resend directly
3. Edge Function listens via Supabase Realtime or pg_net for new queue entries
4. Edge Function sends email via Resend, marks row as `sent`

**New table needed:**
```sql
create table email_queue (
  id uuid default gen_random_uuid() primary key,
  to_email text not null,
  template text not null,
  payload jsonb not null,
  status text default 'pending',
  attempts int default 0,
  max_attempts int default 3,
  error text,
  sent_at timestamptz,
  created_at timestamptz default now()
);
```

**Edge benefit:** User actions become instant. Email retries are automatic. Failed emails don't corrupt user data.

**Effort:** ~3 hours

---

### 1.2 AI Bio Generation → Edge Function

**Current state:** `generateBio()` in `lib/actions/ai-copywriting.ts` calls Anthropic API synchronously. User waits 2-10 seconds for AI response.

**Proposed architecture:**
```
User clicks "Generate Bio"
     │
     ├── Server action inserts request into ai_requests table
     ├── Returns immediately (status: "pending")
     │
     └── Edge Function `generate-bio` triggers via pg_net
          ├── Calls Anthropic API
          ├── Parses & validates response
          ├── Updates professional.business_description
          └── Updates ai_requests status to "completed"
```

**Or simpler (if user expects immediate result):**
- Keep it as a Next.js API route (not Edge), but add proper timeout handling and streaming response
- User sees a loading spinner, but the Next.js server isn't blocked

**Edge benefit:** Cleaner separation. Better error handling. Retries on AI API failures. No blocking Next.js server.

**Effort:** ~2 hours

---

### 1.3 Bulk Draft Synchronization → Batch API Route

**Current state:** Client loops through offline drafts one by one, calling `createLog()` server action sequentially. 10 drafts = 10 round trips.

**Proposed change:** Create a single batch endpoint that accepts all drafts at once and processes them in parallel.

**New API route:** `app/api/journal/batch-sync/route.ts`
```typescript
// Accepts: { drafts: Array<LogDraft> }
// Processes: Promise.all(drafts.map(draft => createLog(draft)))
// Returns: { success: number, failed: Array<{draft, error}> }
```

**Edge benefit:** 10x faster for bulk sync. Single validation pass. Single DB connection.

**Effort:** ~1.5 hours

---

## Priority 2: Move Heavy Computation Off Client (Do Before Launch)

These operations run in the browser or in inefficient contexts, hurting user experience.

### 2.1 PDF/Excel Generation → Server-Side Renderer

**Current state:** 
- **PDF:** `lib/utils/project-export.ts` uses `jsPDF` + `jspdf-autotable` in the browser. Freezes the UI thread during generation.
- **Excel:** `downloadProjectExcel()` builds 4-sheet workbook client-side with `xlsx` library.
- **Journal PDF:** `app/api/journal-pdf/route.ts` returns HTML for `window.print()`. Not a real PDF.
- **Realization PDF:** `app/api/realisation-pdf/route.ts` same issue — HTML for browser print.

**Proposed architecture:**
```
User clicks "Export PDF"
     │
     ├── Next.js API route (or Edge Function)
     │    ├── Fetches all data (logs, media, steps, payments)
     │    ├── Generates signed URLs in parallel (Promise.all)
     │    └── Uses PDF library server-side (@react-pdf/renderer or Puppeteer)
     │
     └── Returns actual PDF file as download
```

**Recommended tool:** `@react-pdf/renderer` — same JSX syntax as your components, runs server-side, produces real PDFs.

**Alternative:** Puppeteer on a serverless function (heavier, but pixel-perfect rendering).

**Files to replace:**
| Current | Replacement |
|---------|------------|
| `lib/utils/project-export.ts` (client) | `app/api/project-pdf/route.ts` (server) |
| `app/api/journal-pdf/route.ts` (HTML) | `app/api/journal-pdf/route.ts` (real PDF) |
| `app/api/realisation-pdf/route.ts` (HTML) | `app/api/realisation-pdf/route.ts` (real PDF) |
| Excel export (client) | `app/api/project-excel/route.ts` (server) |

**Edge benefit:** No UI freezing. Actual PDF files (not HTML print). Server can batch signed URLs in parallel. Can add caching.

**Effort:** ~4 hours

---

### 2.2 File Upload Processing → Parallel Uploads

**Current state:** `uploadLogMedia()` in `lib/actions/log-media.ts:7` uploads files **sequentially** in a `for` loop. 10 photos = 20+ sequential operations (upload + DB insert each).

**Proposed change:** Use `Promise.all()` to upload all files in parallel.

```typescript
// Before (sequential)
for (const file of files) {
  await uploadOne(file)
  await insertRecord(file)
}

// After (parallel uploads, sequential DB after)
const uploadResults = await Promise.all(
  files.map(file => uploadToStorage(file))
)
await Promise.all(
  uploadResults.map(result => insertRecord(result))
)
```

**Edge benefit:** 5-10x faster for multi-file uploads. No Edge Function needed — just fix the code pattern.

**Effort:** ~30 min

---

## Priority 3: Scheduled Background Jobs (Do Before Launch)

### 3.1 Materialized View Refresh → Cron Edge Function

**Current state:** Two materialized views exist but are **never refreshed**:
- `professional_analytics_view` — should refresh hourly
- `platform_metrics_view` — should refresh every 15 minutes

**Proposed solution:**
```
Option A: Supabase pg_cron (preferred)
  ALTER MATERIALIZED VIEW professional_analytics_view 
  REFRESH EVERY 1 HOUR;

Option B: Edge Function + Vercel Cron
  Create Edge Function: supabase/functions/refresh-views/index.ts
  Schedule via Vercel: { "crons": [{ "path": "/api/cron/refresh-views", "schedule": "0 * * * *" }] }
```

**Edge benefit:** Views stay fresh. Dashboard stats and platform metrics are always current. Zero manual effort.

**Effort:** ~30 min

---

### 3.2 Professional Status Recalculation → Debounced

**Current state:** `compute_professional_status()` fires as a database trigger on EVERY insert/update to `recommendations` or `signals`. Under load, this causes cascading latency.

**Proposed change:** Debounce the trigger — instead of computing on every write, compute every 5 minutes max per professional.

```sql
-- Instead of trigger on every write:
CREATE TRIGGER trigger_compute_status
  AFTER INSERT OR UPDATE ON recommendations
  FOR EACH ROW EXECUTE FUNCTION compute_professional_status();

-- Use a status_pending table + cron job:
CREATE TABLE status_recalculation_queue (
  professional_id uuid,
  requested_at timestamptz default now(),
  processed_at timestamptz,
  PRIMARY KEY (professional_id, requested_at)
);

-- Cron runs every 5 min:
--   SELECT DISTINCT professional_id FROM status_recalculation_queue WHERE processed_at IS NULL
--   FOR EACH: compute_professional_status(id), mark processed
```

**Edge benefit:** Status computation batches multiple changes. DB doesn't choke under load.

**Effort:** ~2 hours

---

## Priority 4: Optimization Opportunities (Nice to Have)

### 4.1 Dashboard Stats Consolidation

**Current state:** `getProDashboardStats()` in `lib/actions/dashboard-stats.ts` runs **7+ separate queries** and fetches ALL reviews to compute average in JavaScript.

**Proposed change:** Use the existing `professional_analytics_view` materialized view (once refreshed) + consolidate into 1-2 queries.

**Edge benefit:** Dashboard loads 3-4x faster. Less DB load.

**Effort:** ~1 hour

---

### 4.2 Journal Data Fetching → Incremental

**Current state:** Realtime subscription triggers a full re-fetch of ALL logs on every change.

**Proposed change:** On realtime event, fetch only the changed log entry and merge into existing state (optimistic UI pattern).

**Edge benefit:** Much faster re-renders during collaborative editing. Less DB load.

**Effort:** ~2 hours

---

## What NOT to Move to Edge Functions

| Operation | Why Not |
|-----------|---------|
| Stripe webhook handler | Already an API route. Fine where it is. Cold start isn't critical for webhooks |
| Stripe checkout/cancel | Fast Stripe API calls. No benefit from Edge |
| GPS distance calculation | Simple math, runs fine client-side |
| Professional status DB function | Already runs in the database where it belongs |
| Data export aggregation | Already server-side. Not heavy enough to justify Edge |
| User authentication / middleware | Needs cookie handling. Next.js middleware is correct |

---

## Summary: What to Move Where

| Operation | Current Location | Move To | Priority | Effort |
|-----------|----------------|---------|----------|--------|
| Email notifications | Server actions (sync) | Edge Function + email_queue table | **P1** | 3h |
| AI bio generation | Server action | Edge Function or API route | **P1** | 2h |
| Bulk draft sync | Client sequential | Batch API route (parallel) | **P1** | 1.5h |
| PDF/Excel generation | Client-side (blocking) | Server-side API routes | **P2** | 4h |
| File uploads | Sequential loop | Parallel (Promise.all) | **P2** | 0.5h |
| Materialized view refresh | Missing | Cron job | **P3** | 0.5h |
| Status recalculation | DB trigger (every write) | Debounced (cron every 5min) | **P3** | 2h |
| Dashboard stats | 7+ queries | Consolidated (1-2 queries) | P4 | 1h |
| Journal realtime | Full re-fetch | Incremental merge | P4 | 2h |

**Total Priority 1:** 6.5 hours — immediate user experience improvement
**Total Priority 2:** 4.5 hours — clean architecture before launch
**Total Priority 3:** 2.5 hours — background reliability
**Total Priority 4:** 3 hours — polish

---

## Implementation Order

1. **Fix email blocking** (P1.1) — biggest single impact on perceived speed
2. **Fix file upload parallelism** (P2.2) — 30 min win, immediate benefit
3. **Batch draft sync** (P1.3) — 1.5h, prevents terrible UX at scale
4. **PDF/Excel server-side** (P2.1) — 4h, before any user tests exports
5. **AI bio generation** (P1.2) — 2h, clean boundary for external API
6. **Materialized view cron** (P3.1) — 30 min, set and forget
7. **Status debouncing** (P3.2) — 2h, prevents future DB issues
8. **Dashboard consolidation** (P4.1) — 1h, nice-to-have speedup
9. **Journal incremental** (P4.2) — 2h, collaborative editing polish

Start with P1 items. They decouple the most damaging synchronous operations.
