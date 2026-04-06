# Daily Log Feature — Full Specification

> Created: 2026-04-06
> Status: Planning — awaiting approval before implementation

---

## 1. Feature Overview

The **Daily Log** system is a transparency and accountability layer between clients and professionals on any given project. Professionals and clients can log daily progress on a project with descriptions, media (photos/videos with embedded GPS + timestamp), and supporting documents (receipts, invoices). Clients can view logs, approve or contest them, and track spending and issues. Non-subscribed clients receive shareable links via email, WhatsApp, or SMS.

### Core Principles
- **Evidence over claims**: Every log entry is timestamped and geotagged
- **Transparency**: Clients see what happens on their project every day
- **Accountability**: Approve/contest workflow creates a permanent record
- **Accessibility**: Free clients can view logs via shareable links — no paywall

---

## 2. Database Schema

### 2.1 Table: `project_logs`

The main log entry table. One row = one daily log.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK, default `gen_random_uuid()` | Unique identifier |
| `project_id` | UUID | FK → `user_projects(id)`, NOT NULL | Parent project |
| `step_id` | UUID | FK → `project_steps(id)`, NULLABLE | Optional: linked project step |
| `author_id` | UUID | FK → `users(id)`, NOT NULL | Who created the log (client or pro) |
| `author_role` | TEXT | CHECK IN ('client', 'professional') | Author type for quick filtering |
| `log_date` | DATE | NOT NULL, default `NOW()` | The date this log covers |
| `title` | TEXT | NOT NULL | Short summary (e.g. "Coulage fondations terminées") |
| `description` | TEXT | NOT NULL | Detailed description of work done |
| `money_spent` | NUMERIC(14,2) | DEFAULT 0, CHECK >= 0 | Money spent that day |
| `money_currency` | TEXT | DEFAULT 'XOF', CHECK IN ('XOF','EUR','USD') | Currency |
| `issues` | TEXT | NULLABLE | Problems encountered (free text) |
| `next_steps` | TEXT | NULLABLE | Planned work for next days |
| `weather` | TEXT | NULLABLE | Optional: weather conditions (affects construction) |
| `status` | TEXT | DEFAULT 'pending', CHECK IN ('pending','approved','contested','resolved') | Client review status |
| `gps_latitude` | NUMERIC(10,7) | NOT NULL | GPS latitude from photo EXIF or manual entry |
| `gps_longitude` | NUMERIC(10,7) | NOT NULL | GPS longitude from photo EXIF or manual entry |
| `payment_id` | UUID | FK → `project_payments(id)`, NULLABLE | Optional link to an official payment record |
| `is_synced` | BOOLEAN | DEFAULT true | True if created online, false if synced from offline |
| `synced_at` | TIMESTAMPTZ | NULLABLE | When an offline draft was synced to the server |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last edit timestamp |

**Indexes:**
```sql
CREATE INDEX idx_project_logs_project ON project_logs(project_id, log_date DESC);
CREATE INDEX idx_project_logs_step ON project_logs(step_id);
CREATE INDEX idx_project_logs_author ON project_logs(author_id);
CREATE INDEX idx_project_logs_date ON project_logs(log_date DESC);
CREATE INDEX idx_project_logs_status ON project_logs(project_id, status);
```

### 2.2 Table: `project_log_media`

Stores all media attached to a log (photos, videos, receipts, documents).

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK, default `gen_random_uuid()` | Unique identifier |
| `log_id` | UUID | FK → `project_logs(id)`, NOT NULL, CASCADE DELETE | Parent log |
| `media_type` | TEXT | CHECK IN ('photo') | Type of media (MVP: photos only) |
| `storage_path` | TEXT | NOT NULL | Supabase Storage path |
| `file_name` | TEXT | NOT NULL | Original file name |
| `file_size` | BIGINT | NULLABLE | File size in bytes |
| `mime_type` | TEXT | NOT NULL | e.g. 'image/jpeg', 'image/png', 'image/webp' |
| `caption` | TEXT | NULLABLE | User-provided caption |
| `exif_timestamp` | TIMESTAMPTZ | NULLABLE | Extracted from EXIF data |
| `exif_latitude` | NUMERIC(10,7) | NULLABLE | Extracted from EXIF GPS |
| `exif_longitude` | NUMERIC(10,7) | NULLABLE | Extracted from EXIF GPS |
| `is_primary` | BOOLEAN | DEFAULT false | Primary/cover image |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Upload timestamp |

**Indexes:**
```sql
CREATE INDEX idx_log_media_log ON project_log_media(log_id);
CREATE INDEX idx_log_media_type ON project_log_media(log_id, media_type);
```

### 2.3 Table: `project_log_comments`

Client responses (approve with comment or contest with evidence).

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK, default `gen_random_uuid()` | Unique identifier |
| `log_id` | UUID | FK → `project_logs(id)`, NOT NULL, CASCADE DELETE | Parent log |
| `author_id` | UUID | FK → `users(id)`, NOT NULL | Client who commented |
| `comment_type` | TEXT | CHECK IN ('approval','contest') | Type of response |
| `comment_text` | TEXT | NOT NULL | The comment text |
| `evidence_urls` | TEXT[] | DEFAULT '{}' | URLs of evidence files (for contests) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Comment timestamp |

**Indexes:**
```sql
CREATE INDEX idx_log_comments_log ON project_log_comments(log_id);
CREATE INDEX idx_log_comments_type ON project_log_comments(log_id, comment_type);
```

### 2.4 Table: `project_log_shares`

Tracks shareable links sent to non-subscribed clients.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK, default `gen_random_uuid()` | Unique identifier |
| `log_id` | UUID | FK → `project_logs(id)`, NOT NULL, CASCADE DELETE | Shared log |
| `share_token` | TEXT | UNIQUE, NOT NULL | Random token for the shareable URL |
| `recipient_email` | TEXT | NULLABLE | Recipient email (if shared via email/WhatsApp) |
| `recipient_phone` | TEXT | NULLABLE | Recipient phone (if shared via SMS/WhatsApp) |
| `share_method` | TEXT | CHECK IN ('email','whatsapp','sms') | How it was shared |
| `shared_by_id` | UUID | FK → `users(id)`, NOT NULL | User who shared the log |
| `shared_at` | TIMESTAMPTZ | DEFAULT NOW() | When it was shared |
| `first_viewed_at` | TIMESTAMPTZ | NULLABLE | When recipient first opened the link |
| `view_count` | INTEGER | DEFAULT 0 | How many times the link was opened |
| `expires_at` | TIMESTAMPTZ | NULLABLE | Optional: link expiration |

**Indexes:**
```sql
CREATE UNIQUE INDEX idx_log_shares_token ON project_log_shares(share_token);
CREATE INDEX idx_log_shares_log ON project_log_shares(log_id);
CREATE INDEX idx_log_shares_email ON project_log_shares(recipient_email);
```

### 2.5 Table: `project_log_views`

Tracks individual views of shared logs (for "seen" status).

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK, default `gen_random_uuid()` | Unique identifier |
| `share_id` | UUID | FK → `project_log_shares(id)`, NOT NULL | Which share was viewed |
| `viewed_at` | TIMESTAMPTZ | DEFAULT NOW() | When it was viewed |
| `viewer_ip` | TEXT | NULLABLE | IP address (for basic identity) |
| `viewer_user_agent` | TEXT | NULLABLE | Browser/device info |

**Indexes:**
```sql
CREATE INDEX idx_log_views_share ON project_log_views(share_id);
```

---

## 3. RLS Policies

```sql
-- ── project_logs ────────────────────────────────────────────
ALTER TABLE project_logs ENABLE ROW LEVEL SECURITY;

-- Client: full access to logs on their own projects
CREATE POLICY "logs_client_own" ON project_logs
  FOR ALL USING (
    project_id IN (SELECT id FROM user_projects WHERE user_id = auth.uid())
  )
  WITH CHECK (
    project_id IN (SELECT id FROM user_projects WHERE user_id = auth.uid())
  );

-- Professional: can create/edit logs for projects they're assigned to
CREATE POLICY "logs_pro_insert" ON project_logs
  FOR INSERT WITH CHECK (
    author_id = auth.uid()
    AND project_id IN (
      SELECT pp.project_id FROM project_professionals pp
      WHERE pp.professional_id IN (
        SELECT id FROM professionals WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "logs_pro_read" ON project_logs
  FOR SELECT USING (
    author_id = auth.uid()
  );

CREATE POLICY "logs_pro_update" ON project_logs
  FOR UPDATE USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Admin: full access
CREATE POLICY "logs_admin" ON project_logs
  FOR ALL USING (public.has_role('admin'));

-- ── project_log_media ───────────────────────────────────────
ALTER TABLE project_log_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "media_client_own" ON project_log_media
  FOR ALL USING (
    log_id IN (
      SELECT pl.id FROM project_logs pl
      JOIN user_projects up ON up.id = pl.project_id
      WHERE up.user_id = auth.uid()
    )
  )
  WITH CHECK (
    log_id IN (
      SELECT pl.id FROM project_logs pl
      JOIN user_projects up ON up.id = pl.project_id
      WHERE up.user_id = auth.uid()
    )
  );

CREATE POLICY "media_pro_own" ON project_log_media
  FOR ALL USING (
    log_id IN (SELECT pl.id FROM project_logs pl WHERE pl.author_id = auth.uid())
  )
  WITH CHECK (
    log_id IN (SELECT pl.id FROM project_logs pl WHERE pl.author_id = auth.uid())
  );

CREATE POLICY "media_admin" ON project_log_media
  FOR ALL USING (public.has_role('admin'));

-- ── project_log_comments ────────────────────────────────────
ALTER TABLE project_log_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_client_own" ON project_log_comments
  FOR ALL USING (
    log_id IN (
      SELECT pl.id FROM project_logs pl
      JOIN user_projects up ON up.id = pl.project_id
      WHERE up.user_id = auth.uid()
    )
  )
  WITH CHECK (
    log_id IN (
      SELECT pl.id FROM project_logs pl
      JOIN user_projects up ON up.id = pl.project_id
      WHERE up.user_id = auth.uid()
    )
  );

CREATE POLICY "comments_pro_read" ON project_log_comments
  FOR SELECT USING (
    log_id IN (SELECT pl.id FROM project_logs pl WHERE pl.author_id = auth.uid())
  );

CREATE POLICY "comments_admin" ON project_log_comments
  FOR ALL USING (public.has_role('admin'));

-- ── project_log_shares ──────────────────────────────────────
ALTER TABLE project_log_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shares_user_own" ON project_log_shares
  FOR ALL USING (shared_by_id = auth.uid())
  WITH CHECK (shared_by_id = auth.uid());

-- Public read via token (no auth required)
CREATE POLICY "shares_public_read" ON project_log_shares
  FOR SELECT USING (true);

CREATE POLICY "shares_admin" ON project_log_shares
  FOR ALL USING (public.has_role('admin'));

-- ── project_log_views ───────────────────────────────────────
ALTER TABLE project_log_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a view (public endpoint)
CREATE POLICY "views_public_insert" ON project_log_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "views_user_read" ON project_log_views
  FOR SELECT USING (
    share_id IN (SELECT id FROM project_log_shares WHERE shared_by_id = auth.uid())
  );

CREATE POLICY "views_admin" ON project_log_views
  FOR ALL USING (public.has_role('admin'));
```

---

## 4. Supabase Storage Bucket

Create a new bucket: `log-media`

| Setting | Value |
|---|---|
| **Public** | `false` (private, accessed via signed URLs) |
| **File size limit** | 10MB per photo |
| **Allowed MIME types** | `image/jpeg`, `image/png`, `image/webp` |
| **Path structure** | `log-media/{project_id}/{log_id}/photo/{uuid}-{filename}` |

---

## 5. User Flows

### 5.1 Professional Creates a Log

```
1. Pro navigates to project detail page → clicks "Journal" tab
2. Sees existing log entries in chronological order
3. Clicks "Ajouter un rapport" button
4. Form opens with:
   - Date picker (defaults to today)
   - Title input
   - Rich text description
   - Money spent (amount + currency)
   - Issues textarea (optional)
   - Next steps textarea (optional)
   - Weather selector (optional: sunny/cloudy/rainy/stormy)
   - GPS auto-detect button (uses browser geolocation API)
5. Media upload zone:
   - Drag & drop or file picker (photos only)
   - Accepts: JPEG, PNG, WebP images
   - Auto-extracts EXIF GPS + timestamp from images
   - Shows preview thumbnails in uniform grid
   - Marks one as primary/cover
6. Clicks "Publier le rapport"
7. Log saved → client notified (email/in-app)
```

### 5.2 Client Views Logs (Subscribed)

```
1. Client navigates to project detail → "Journal" tab
2. Sees timeline of logs, most recent first
3. Each log card shows:
   - Date + author badge
   - Title + short description
   - Primary photo thumbnail
   - Money spent indicator
   - Status badge (pending/approved/contested)
   - Issues flag (if any)
4. Clicks to expand full log view:
   - Full description
   - All media in gallery view
   - GPS location on mini map (optional)
   - Money breakdown
   - Previous comments
5. Actions: Approve (with comment) or Contest (with comment + evidence)
```

### 5.3 Client Views Log (Non-Subscribed via Shareable Link)

```
1. Client receives email/WhatsApp/SMS with link:
   kelen.africa/journal/{share_token}
2. Opens link → sees read-only log page:
   - Full log content (description, media, money spent)
   - "Rapport vu le {date}" confirmation
   - Approve / Contest buttons
3. If Approve: simple form → comment → submit → log marked "approved"
4. If Contest: form with comment + evidence upload → submit → log marked "contested"
5. Either action requires email entry (creates identity trail)
6. View is recorded in `project_log_views` → first_viewed_at updated
```

### 5.4 Sharing a Log

```
1. Pro or client opens a log → clicks "Partager"
2. Modal appears with options:
   - Email: input recipient email → send via Resend
   - WhatsApp: opens wa.me link with pre-filled message + URL
   - SMS: opens sms: URI with pre-filled message + URL
3. Share recorded in `project_log_shares`
4. Token generated: crypto-random 32-char string
5. Optional: set expiration date
```

### 5.5 Contest Resolution

```
1. Client contests a log → adds comment + uploads evidence
2. Log status changes to "contested"
3. Professional receives notification
4. Professional can:
   - Respond with a comment (status stays "contested")
   - Upload clarifying evidence
   - Mark as "resolved" with explanation
5. Client can then approve (status → "resolved") or keep contested
6. Full audit trail preserved in `project_log_comments`
```

---

## 6. Shareable Link System

### URL Pattern
```
/journal/{share_token}
```

### Token Generation
- 32-character cryptographically random string
- Stored in `project_log_shares.share_token`
- No predictable sequence

### View Tracking
- On page load: fire beacon to `/api/log-views` with share_token
- Server resolves token → records view in `project_log_views`
- Updates `first_viewed_at` if first visit
- Increments `view_count`

### Security
- No auth required to view (public access via policy `shares_public_read`)
- Writing comments from shared link requires email entry
- Evidence uploads from shared link stored in separate public bucket with virus scanning (future)

---

## 7. Media Upload Pipeline

### 7.1 Client-Side Flow

```
1. User selects/drops files in upload zone
2. For each image file:
   a. Read EXIF data client-side (using `exifr` npm package)
   b. Extract: GPS coordinates, timestamp, camera model
   c. Display extracted data as preview metadata
   d. If no EXIF GPS: offer manual GPS pin drop
3. Files uploaded to Supabase Storage via server action
4. Server action validates:
   - File size < 50MB
   - MIME type allowed
   - File not corrupted
5. Returns storage path → saved to `project_log_media`
```

### 7.2 EXIF Extraction

**Library**: `exifr` (npm) — lightweight, works in browser

**Extracted fields:**
- `GPSLatitude` / `GPSLongitude`
- `DateTimeOriginal`
- `Make` / `Model` (camera info — optional)

**Fallback:** If no EXIF data:
- Use browser geolocation API at time of upload
- Use server timestamp as fallback
- Flag media as "GPS not verified" in UI

### 7.3 Storage Structure

```
log-media/
├── {project_id}/
│   ├── {log_id}/
│   │   ├── photo/
│   │   │   ├── {uuid}-IMG_001.jpg
│   │   │   └── {uuid}-IMG_002.jpg
│   │   ├── video/
│   │   │   └── {uuid}-site-video.mp4
│   │   ├── document/
│   │   │   └── {uuid}-plan.pdf
│   │   └── receipt/
│   │       └── {uuid}-cement-receipt.jpg
```

---

## 8. Server Actions

### 8.1 `lib/actions/daily-logs.ts`

```typescript
// Create a new log entry
async function createLog(data: {
  projectId: string;
  stepId?: string;
  logDate: string;
  title: string;
  description: string;
  moneySpent?: number;
  moneyCurrency?: string;
  issues?: string;
  nextSteps?: string;
  weather?: string;
  gpsLat?: number;
  gpsLng?: number;
  media?: Array<{...}>;  // pre-uploaded media references
}): Promise<{ data?: Log; error?: string }>

// Update an existing log
async function updateLog(logId: string, data: Partial<Log>): Promise<{ data?: Log; error?: string }>

// Delete a log
async function deleteLog(logId: string): Promise<{ success: boolean; error?: string }>

// Get all logs for a project
async function getProjectLogs(projectId: string): Promise<Log[]>

// Get a single log by ID
async function getLogById(logId: string): Promise<Log | null>

// Get logs filtered by step
async function getLogsByStep(stepId: string): Promise<Log[]>
```

### 8.2 `lib/actions/log-media.ts`

```typescript
// Upload media files to Supabase Storage
async function uploadLogMedia(
  logId: string,
  files: FormData
): Promise<{ data?: Media[]; error?: string }>

// Delete a media item
async function deleteLogMedia(mediaId: string): Promise<{ success: boolean; error?: string }>

// Generate signed URL for viewing media
async function getMediaUrl(storagePath: string): Promise<string>

// Get all media for a log
async function getLogMedia(logId: string): Promise<Media[]>
```

### 8.3 `lib/actions/log-comments.ts`

```typescript
// Approve a log with comment
async function approveLog(
  logId: string,
  comment: string
): Promise<{ success: boolean; error?: string }>

// Contest a log with comment + evidence
async function contestLog(
  logId: string,
  comment: string,
  evidenceUrls: string[]
): Promise<{ success: boolean; error?: string }>

// Resolve a contested log
async function resolveLog(
  logId: string,
  comment: string
): Promise<{ success: boolean; error?: string }>

// Get comments for a log
async function getLogComments(logId: string): Promise<Comment[]>
```

### 8.4 `lib/actions/log-shares.ts`

```typescript
// Share a log via email/WhatsApp/SMS
async function shareLog(
  logId: string,
  options: {
    method: 'email' | 'whatsapp' | 'sms';
    recipientEmail?: string;
    recipientPhone?: string;
    expiresAt?: string;
  }
): Promise<{ shareToken: string; shareUrl: string; error?: string }>

// Get a shared log by token (public endpoint)
async function getSharedLogByToken(shareToken: string): Promise<SharedLog | null>

// Record a view of a shared log
async function recordShareView(shareToken: string, ip: string, userAgent: string): Promise<void>

// Get share stats for a log
async function getShareStats(logId: string): Promise<{ viewCount: number; firstViewedAt?: string }>
```

---

## 9. Notification System

### 9.1 Email Notifications (via Resend)

| Trigger | Recipient | Template |
|---|---|---|
| New log created | Project client | "Nouveau rapport pour votre projet {title}" |
| Log approved | Log author (pro) | "Votre rapport a été approuvé" |
| Log contested | Log author (pro) | "Un rapport a été contesté — action requise" |
| Contest response | Client who contested | "Réponse à votre contestation" |
| Log shared | Shared recipient | "Rapport de chantier — projet {title}" |

### 9.2 In-App Notifications

Using Supabase Realtime for push-style notifications:

```typescript
// Subscribe to log changes on project detail page
supabase
  .channel(`logs:${projectId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'project_logs',
    filter: `project_id=eq.${projectId}`
  }, (payload) => {
    // Update UI in real-time
  })
  .subscribe()
```

---

## 10. UI/UX Design

### 10.1 Route Structure

```
app/(client)/projets/[id]/
├── page.tsx                    // Existing project detail
├── journal/                    // NEW: Daily log section
│   ├── page.tsx               // Log list view
│   ├── [logId]/
│   │   └── page.tsx           // Single log detail
│   └── nouveau/
│       └── page.tsx           // Create new log form
└── share/[token]/
    └── page.tsx               // Public shared log view (outside auth route group)
```

### 10.2 Key Components to Build

| Component | Purpose |
|---|---|
| `LogTimeline.tsx` | Chronological list of logs, card-based |
| `LogCard.tsx` | Preview card for each log entry |
| `LogDetail.tsx` | Full log view with media gallery |
| `LogForm.tsx` | Create/edit log form |
| `MediaUpload.tsx` | Drag & drop upload with EXIF extraction |
| `MediaGallery.tsx` | Photo/video/document gallery viewer |
| `LogActions.tsx` | Approve / Contest / Resolve action bar |
| `LogCommentThread.tsx` | Comment history for a log |
| `ShareLogModal.tsx` | Share via email/WhatsApp/SMS |
| `GPSMarker.tsx` | Display GPS location (optional map) |
| `MoneyTracker.tsx` | Visual spending indicator |
| `SharedLogPage.tsx` | Public-facing shared log page |

### 10.3 Design Language

Following the "Digital Diplomat" system:
- **Cards**: `bg-surface-container-low`, `rounded-2xl`, large padding
- **Status badges**: Use existing `StatusBadge` component with new colors:
  - `pending` → amber
  - `approved` → green
  - `contested` → red
  - `resolved` → blue
- **Media gallery**: Uniform grid on all breakpoints
- **Timeline**: Vertical line with dots, like a Git history graph
- **Forms**: Single-column on mobile, two-column (form + GPS sidebar) on desktop

### 10.4 Mobile Considerations

- Upload zone must support camera capture (`accept="image/*" capture="environment"`)
- GPS auto-detect uses browser Geolocation API
- Media gallery: swipe gestures, pinch-to-zoom
- Forms: single column, large touch targets
- Share buttons: native share API on mobile when available

---

## 11. Implementation Phases

### Phase 1: Core Infrastructure
- [ ] Create database migration (`project_logs`, `project_log_media`, `project_log_comments`, `project_log_shares`, `project_log_views`)
- [ ] Set up Supabase Storage bucket (`log-media`)
- [ ] Create TypeScript types (`lib/types/daily-logs.ts`)
- [ ] Build server actions (CRUD for logs, media, comments)

### Phase 2: Professional Log Creation
- [ ] Build `LogForm.tsx` (create/edit)
- [ ] Build `MediaUpload.tsx` with EXIF extraction
- [ ] Build `LogTimeline.tsx` and `LogCard.tsx`
- [ ] Add journal tab to project detail page
- [ ] Wire up server actions to forms

### Phase 3: Client Review Flow
- [ ] Build `LogDetail.tsx` with media gallery
- [ ] Build `LogActions.tsx` (approve/contest)
- [ ] Build `LogCommentThread.tsx`
- [ ] Add contest resolution workflow
- [ ] Real-time updates via Supabase Realtime

### Phase 4: Shareable Links
- [ ] Build share token generation server action
- [ ] Build `SharedLogPage.tsx` (public route)
- [ ] Build `ShareLogModal.tsx` (email/WhatsApp/SMS)
- [ ] Implement view tracking
- [ ] Email notification templates (Resend)

### Phase 5: Polish & Monitoring
- [ ] Add dashboard aggregates (total logs, spending over time, issue count)
- [ ] GPS visualization on logs
- [ ] Export logs to PDF (project-level report)
- [ ] Add loading/empty/error states
- [ ] Write tests for server actions

---

## 12. Decisions (Resolved)

1. **GPS Enforcement**: GPS is **REQUIRED** for every log. The professional must provide a location. If EXIF GPS is unavailable from photos, the browser Geolocation API is used. If that also fails, the pro must manually pin the location on a map before submitting.
2. **Log Frequency**: **Unlimited** logs per day. Multiple small updates are allowed — site photos in the morning, material delivery receipts at noon, end-of-day summary.
3. **Professional Permissions**: **Any invited professional** can create logs. The project owner (client) grants log-writing permission when assigning a pro to the project, or can invite a pro specifically for logging purposes.
4. **Data Retention**: Shared links **never expire** by default. No `expires_at` enforcement. Links remain valid indefinitely for project archival.
5. **Contest Escalation**: **Kelen does not arbitrate.** The platform records the dispute, both sides can respond, and the full audit trail is preserved. It is purely between client and pro.
6. **Money Integration**: Log `money_spent` remains **separate from `project_payments`** but can be optionally linked. A new nullable column `payment_id` on `project_logs` allows the client to later convert a logged expense into an official payment record if desired.
7. **Offline Support**: **Critical.** Professionals must be able to draft logs offline and sync when connectivity returns. Uses IndexedDB for local storage + sync queue pattern.

---

## 13. Technical Notes

### EXIF Library Choice
- **`exifr`** (npm) — ~3KB gzipped, browser-compatible, extracts GPS + datetime
- Alternative: `exif-js` — older, larger, less maintained

### Geolocation API
- Browser `navigator.geolocation.getCurrentPosition()`
- Requires HTTPS (already the case with Next.js)
- User must grant permission
- Fallback: user manually enters coordinates or uses last known GPS

### File Size Limits
- Photos: 2-10MB each (10MB hard limit)
- MVP: photos only (no video, no documents, no receipts)

### Currency Conversion
- Store logs in project currency
- Display conversion optional (future feature)

### Offline Strategy

**IndexedDB** via `idb-keyval` (lightweight, ~500 bytes) or `localforage` (~7.5KB).

**Sync Queue Pattern:**
1. When offline, log saves to IndexedDB as a draft
2. Each draft gets a `pending_sync` flag
3. Background sync (or manual "Sync now" button) pushes drafts to Supabase
4. On success: remove from IndexedDB, update UI
5. On conflict: show merge dialog (e.g., if another log was created in the meantime)

**Offline Media Handling:**
- Photos are compressed client-side before storing in IndexedDB (max 1920px width, JPEG quality 0.8)
- Compressed photos stored as base64 blobs in IndexedDB
- Queue supports unlimited drafts — no hard cap

**Connectivity Detection:**
- `navigator.onLine` for basic detection
- Periodic ping to `/api/health` for reliable check
- Visual indicator in the UI: "Mode hors ligne — brouillons sauvegardés localement"
