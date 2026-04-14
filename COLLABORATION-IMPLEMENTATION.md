# Collaboration Feature — Implementation Plan

> **Status:** IN PROGRESS
> **Last updated:** April 14, 2026
> **Scope:** Client-pro matching system, pro communication hub, project access gating

---

## 🚀 Multi-Agent Implementation Plan

**Database & Backend (DONE):**
- ✅ Migrations created and applied
- ✅ TypeScript types created
- ✅ Server actions created (all 13 actions)

**Remaining work split into 4 parallel agents:**

### Agent 1: Client ProListPage + Routes
**Files to create:**
- `components/collaboration/ProListPage.tsx` — Client pro list view with grouped sections
- `app/(client)/projects/[id]/pros/page.tsx` — Route page
- `app/(client)/projects/[id]/pros/proposal/[proId]/page.tsx` — Proposal review route

**Key specs:**
- Sections: Saved → Shortlisted → Finalists → Picked → Declined (collapsed)
- Uses `getProjectProList(projectId)` server action
- Status badges per section
- Actions: Shortlist, Make Finalist, View Proposal, Pick Pro

---

### Agent 2: ProposalView + FinalistProjectView Components
**Files to create:**
- `components/collaboration/ProposalView.tsx` — Client proposal review page
- `components/collaboration/FinalistProjectView.tsx` — Pro read-only project view

**Key specs:**
- ProposalView: Shows proposal details, message thread, Accept/Decline buttons
- FinalistProjectView: Read-only project description, steps, areas + proposal form
- Both use `getProposalDetail()` and `getFinalistProjectView()` actions

---

### Agent 3: ProInbox Component + Route
**Files to create:**
- `components/collaboration/ProInbox.tsx` — Pro inbox with 3 tabs
- `app/(pro)/inbox/page.tsx` — Pro inbox route

**Key specs:**
- Tab 1: Proposals (pending/negotiating/active collaborations)
- Tab 2: Realization comments (social media style)
- Tab 3: Google reviews (reply via API)
- Uses `getProInbox()` server action

---

### Agent 4: Modify Existing Components + Types
**Files to modify:**
- `components/pro/ProProjectsPage.tsx` — Add source indicator badge (CLIENT PROJECT vs PRO PROJECT)
- `lib/types/pro-projects.ts` — Add `source_type` field
- `components/daily-logs/DailyLogCard.tsx` — Add author identity display
- `lib/types/collaborations.ts` — Already created ✅

**Key specs:**
- ProProjectsPage: Badge shows `CLIENT PROJECT` (blue) or `PRO PROJECT` (purple)
- DailyLogCard: Shows "Written by: Jean B. Construction (Builder)" or "Written by: Jean Dupont (Client)"

---

## 📋 Original Specification

## 1. Overview

The collaboration feature connects clients managing `user_projects` with professionals. It replaces the informal "save/like" system with a structured pipeline: **Saved → Shortlisted → Finalist → Proposal → Picked → Active**.

Only **active** pros gain full project access. Finalists get a read-only project description view to prepare a proposal. The platform does **not** display its own rating — only Google Business reviews appear publicly on portfolios.

---

## 2. Database Schema

### 2.1 New Tables

#### `project_collaborations`

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | uuid | NO | PK |
| `project_id` | uuid | NO | FK → `user_projects.id` (CASCADE DELETE) |
| `professional_id` | uuid | NO | FK → `professionals.id` (CASCADE DELETE) |
| `project_professional_id` | uuid | NO | FK → `project_professionals.id` (CASCADE DELETE) |
| `pro_project_id` | uuid | YES | FK → `pro_projects.id` (SET NULL on delete) |
| `status` | text | NO | `pending`, `negotiating`, `active`, `declined`, `not_picked`, `suspended`, `terminated` |
| `proposal_text` | text | YES | Pro's approach & terms |
| `proposal_budget` | numeric | YES | Pro's quoted price |
| `proposal_currency` | text | YES | Default `XOF` |
| `proposal_timeline` | text | YES | Pro's estimated timeline |
| `proposal_submitted_at` | timestamptz | YES | When proposal was submitted |
| `agreed_price` | numeric | YES | Final agreed price |
| `agreed_start_date` | date | YES | Agreement start |
| `agreed_end_date` | date | YES | Agreement end |
| `started_at` | timestamptz | YES | When collaboration became active |
| `ended_at` | timestamptz | YES | When collaboration ended |
| `decline_reason` | text | YES | Reason for declining |
| `created_at` | timestamptz | NO | Default `now()` |
| `updated_at` | timestamptz | NO | Default `now()` |

**Indexes:** `project_id`, `professional_id`, `status`

#### `collaboration_messages`

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | uuid | NO | PK |
| `collaboration_id` | uuid | NO | FK → `project_collaborations.id` (CASCADE DELETE) |
| `sender_id` | uuid | NO | FK → `users.id` |
| `sender_role` | text | NO | `client` or `professional` |
| `message_type` | text | NO | `proposal`, `counter_offer`, `revision_request`, `acceptance`, `decline`, `general` |
| `content` | text | NO | Message body |
| `attachments` | jsonb | YES | Array of `{url, type, name}` |
| `created_at` | timestamptz | NO | Default `now()` |

**Index:** `collaboration_id`

### 2.2 Modified Tables

#### `project_professionals` — New `selection_status` values

Existing: `candidate`, `shortlisted`, `finalist`
**New:** `agreed`, `not_selected`

| Status | Collaboration Status | Meaning |
|---|---|---|
| `candidate` | *(no collaboration record)* | Pro saved/liked by client |
| `shortlisted` | *(no collaboration record)* | Client considering |
| `finalist` | `pending` or `negotiating` | Proposal phase — multiple finalists possible |
| `agreed` | `active` | Pro picked, collaboration active |
| `not_selected` | `declined` or `not_picked` | Finalist not chosen |

#### `notifications.type` — New enum values

Existing values kept. **8 new values added:**
- `finalist_selected`
- `proposal_submitted`
- `revision_requested`
- `proposal_accepted`
- `proposal_declined`
- `collaboration_declined`
- `collaboration_activated`
- `collaboration_terminated`

---

## 3. Workflow

```
1. Client saves pro → project_professionals: role='liked', selection_status='candidate'
   └─ No notification to pro

2. Client shortlists → selection_status: 'shortlisted'
   └─ No notification to pro

3. Client makes pro a FINALIST
   └─ selection_status → 'finalist'
   └─ project_collaborations created: status='pending'
   └─ Notification sent to pro: 'finalist_selected'
   └─ Pro gets READ-ONLY view of project description (no other pros visible)

4. Pro responds with proposal
   └─ collaboration status → 'negotiating'
   └─ proposal_text, proposal_budget, proposal_timeline filled
   └─ proposal_submitted_at = now()
   └─ Notification sent to client: 'proposal_submitted'

5. Client reviews, may request revisions (back-and-forth messaging)
   └─ collaboration_messages exchanged
   └─ Notifications: 'revision_requested'

6. Client picks ONE pro → AGREED
   └─ That pro: status → 'active', selection_status → 'agreed'
   └─ Other finalists: status → 'not_picked', selection_status → 'not_selected'
   └─ Notifications: 'proposal_accepted' (winner), 'proposal_declined' (losers)
   └─ Winner gets FULL project access

7. Collaboration may be terminated later
   └─ status → 'terminated'
   └─ Pro loses access
   └─ Logs stay attributed to original author (legal audit trail)
```

---

## 4. Access Rules

| Collaboration Status | Project Access | Pro Can See | Pro Can Do |
|---|---|---|---|
| `pending` | Read-only description | Project details, steps, areas, budget. **No other pros.** | Submit proposal, message client |
| `negotiating` | Read-only description | Same as above | Revise proposal, message thread |
| `active` | Full access | Everything: logs, documents, payments, **all active pros' logs**. **Not candidate/finalist pros.** | Create logs, upload media, approve/contest, add documents |
| `declined` / `not_picked` / `terminated` | No access | Nothing | Nothing |

**Storage:** Managed at app layer. Pros do NOT get direct bucket access. Server actions handle uploads.

---

## 5. UI Specifications

### 5.1 Pro List Page (Client)

**Route:** `/projects/[projectId]/pros`

**Layout:** Sections grouped by status — Saved → Shortlisted → Finalists → Picked → Declined (collapsed)

```
┌─────────────────────────────────────────────────────────┐
│  Project: Building My House in Dakar                    │
│                                                         │
│  ─── SAVED (12) ───                                     │
│  [Card] [Card] [Card] ...                               │
│  Actions: [Shortlist] [Remove]                          │
│                                                         │
│  ─── SHORTLISTED (4) ───                                │
│  [Card] [Card]                                          │
│  Actions: [Make Finalist] [Remove]                      │
│                                                         │
│  ─── FINALISTS — PROPOSAL PHASE (3) ───                 │
│  Jean B. — Proposal: ● Submitted                        │
│  [View Proposal] [Request Change]                       │
│  Amina K. — Proposal: ○ Awaiting response               │
│  [Send Reminder]                                        │
│  Fatou M. — Proposal: ● Negotiating                     │
│  [View Proposal] [Message] [Pick]                       │
│                                                         │
│  ─── PICKED — ACTIVE (1) ───                            │
│  Jean B. — Active since Apr 10  |  Full access          │
│  [View Activity] [Manage]                               │
│                                                         │
│  ─── DECLINED (2) ─── (collapsed, expandable)           │
└─────────────────────────────────────────────────────────┘
```

**Status badges per section:**
- Saved: `Saved` (grey)
- Shortlisted: `Shortlisted` (blue)
- Finalist — no response: `Awaiting response` (yellow)
- Finalist — proposal submitted: `Proposal submitted` (green)
- Finalist — negotiating: `Negotiating` (purple)
- Picked: `Active` (green solid with checkmark)
- Declined: `Declined` (red)

### 5.2 Proposal View (Client)

**Route:** `/projects/[projectId]/pros/[proId]`

```
┌─────────────────────────────────────────────────────────┐
│  Proposal from Jean B. Construction                      │
│  Builder  |  ★★★★☆  |  Dakar                            │
│                                                         │
│  ─── Proposal ─────────────────────────────────────────  │
│  Proposed budget: 22,000,000 XOF                        │
│  Timeline: 4 months                                     │
│  Terms: "We will handle foundation, framing..."         │
│  Submitted: Apr 12, 2026                                │
│                                                         │
│  ─── Message Thread ──────────────────────────────────  │
│  [Messages...]                                          │
│  [Reply]                                                │
│  [Accept Proposal — Pick This Pro]  [Decline]           │
└─────────────────────────────────────────────────────────┘
```

### 5.3 Finalist's Read-Only Project View (Pro)

Pro sees the project description — **no other pros listed**, no competition info.

```
┌─────────────────────────────────────────────────────────┐
│  🔷  Invitation: Building My House in Dakar             │
│  Client: Jean Dupont  |  Dakar  |  Budget: 25M XOF     │
│  Category: Construction                                 │
│                                                         │
│  ─── Description ─────────────────────────────────────  │
│  "Building a 3-bedroom house with garage..."            │
│                                                         │
│  ─── Steps ───────────────────────────────────────────  │
│  1. Foundation  —  5M XOF                               │
│  2. Framing     —  8M XOF                               │
│  3. Finishing   —  7M XOF                               │
│                                                         │
│  ─── Your Response ───────────────────────────────────  │
│  Approach: [rich text]  Budget: [___]  Timeline: [___]  │
│  Message: [rich text]                                   │
│  [Submit Proposal]        [Decline]                     │
└─────────────────────────────────────────────────────────┘
```

### 5.4 ProjectCard (Pro's `/pro/projets` page)

Cards show source type — **client project** (pro has access via collaboration) or **pro project** (pro created it).

| Type | Badge | Color | Details Link |
|---|---|---|---|
| Client project (`user_projects`) | `CLIENT PROJECT` | Blue `bg-blue-100 text-blue-700` | `/projects/[projectId]` |
| Pro project (`pro_projects`) | `PRO PROJECT` | Purple `bg-purple-100 text-purple-700` | `/pro/projets/[proProjectId]` |

**Card content differs by type:**
- Client project card: shows `users.display_name` as client, shows linked `pro_project` if exists
- Pro project card: shows `pro_projects.client_name`, shows `is_public` badge

### 5.5 Pro Inbox

**Route:** `/pro/inbox` (or tab on pro dashboard)

Single page with 3 tabs:

**Tab 1 — Proposals:** Pending finalist invites, negotiating threads, active collaborations

**Tab 2 — Comments:** Realization comments (social media style). Unanswered/replied filter. Inline reply.

**Tab 3 — Google Reviews:** New Google reviews needing reply. Reply via Google API. Collapsed history.

### 5.6 Project Log Author Display

Each log shows who wrote it:

```
Written by: Jean B. Construction (Builder)    ← if author is a pro
Written by: Jean Dupont (Client)              ← if author is the client
```

Resolved via:
```typescript
{log.author_role === 'professional' && log.professional
  ? `${log.professional.business_name} (${log.professional.category})`
  : `${log.author.display_name} (Client)`}
```

---

## 6. Server Actions

| Action | Parameters | Returns | Description |
|---|---|---|---|
| `makeFinalist` | `projectId, professionalId` | `{ success, error }` | Update selection_status → create collaboration → notify pro. **Idempotent** — if collaboration already exists, do nothing. |
| `submitProposal` | `collaborationId, {text, budget, currency, timeline}` | `{ success, error }` | Pro submits proposal. Sets status → `negotiating`. Notifies client. |
| `declineCollaboration` | `collaborationId, reason` | `{ success, error }` | Pro declines finalist invite. Sets status → `declined`. Notifies client. |
| `requestRevision` | `collaborationId, message` | `{ success, error }` | Client asks for proposal changes. Creates message. Notifies pro. |
| `acceptProposal` | `collaborationId` | `{ success, error }` | **Atomic:** activate this collaboration → decline all other finalists → notify all parties. |
| `declineFinalist` | `collaborationId, reason` | `{ success, error }` | Client declines a finalist. Sets status → `not_picked`. Notifies pro. |
| `terminateCollaboration` | `collaborationId, reason` | `{ success, error }` | End active collaboration. Sets status → `terminated`. Revokes access. Logs preserved. |
| `sendCollaborationMessage` | `collaborationId, {type, content, attachments}` | `{ success, error }` | Negotiation messaging. |
| `createProProjectAndLink` | `collaborationId, projectData` | `{ success, error, data }` | Create pro_project + link to collaboration in one call. Server-side. |
| `getProjectProList` | `projectId` | `{ groups: {saved, shortlisted, finalists, active, declined} }` | Fetch all pros on project grouped by status. |
| `getProInbox` | `professionalId` | `{ proposals, comments, googleReviews }` | Fetch all inbox items for pro. |
| `getFinalistProjectView` | `collaborationId` | `{ project, steps, areas }` | Read-only project view for finalists. |
| `getProposalDetail` | `collaborationId` | `{ collaboration, messages, professional }` | Client reviews a submitted proposal. |

---

## 7. RLS Policies

### 7.1 `project_collaborations`

| Policy | Type | Condition |
|---|---|---|
| `collab_client_all` | ALL | `project_id IN (SELECT id FROM user_projects WHERE user_id = auth.uid())` |
| `collab_pro_read` | SELECT | `professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())` |
| `collab_pro_update` | UPDATE | Same as pro_read |

### 7.2 `collaboration_messages`

| Policy | Type | Condition |
|---|---|---|
| `collab_messages_read` | SELECT | Collaboration belongs to client's project OR pro's profile |
| `collab_messages_client_insert` | INSERT | Collaboration belongs to client's project |
| `collab_messages_pro_insert` | INSERT | Collaboration belongs to pro's profile |

### 7.3 Collaboration Access on Existing Tables

| Table | Policy | SELECT Condition | WITH CHECK Condition |
|---|---|---|---|
| `user_projects` | `collab_pro_read` | status IN (`pending`, `negotiating`, `active`) | — |
| `user_projects` | `collab_pro_write` | status = `active` | status = `active` |
| `project_logs` | `collab_pro` | status IN (`pending`, `negotiating`, `active`) OR author = user | status = `active` OR author = user |
| `project_steps` | `collab_pro` | status IN (`pending`, `negotiating`, `active`) | status = `active` |
| `project_documents` | `collab_pro` | status IN (`pending`, `negotiating`, `active`) | status = `active` |
| `project_areas` | `collab_pro_read` | status IN (`pending`, `negotiating`, `active`) | — |
| `project_payments` | `collab_pro_read` | status = `active` only | — |
| `project_professionals` | `collab_view` | Client sees all. Active pros see only `agreed` pros (hidden from candidate/finalist pros) | — |

**Important:** Policies are ADDED alongside existing ones. No existing policies are modified. PostgreSQL OR logic applies — matching ANY policy grants access.

### 7.4 Storage

**No RLS changes.** App layer manages all uploads. Server actions authenticate before writing to storage buckets.

---

## 8. Migration Plan

### Order

| # | File | What It Does |
|---|---|---|
| 1 | `20260414000003_create_project_collaborations.sql` | Create table + RLS |
| 2 | `20260414000004_create_collaboration_messages.sql` | Create table + RLS |
| 3 | `20260414000005_collaboration_access_policies.sql` | Add collaboration RLS on existing tables |
| 4 | `20260414000006_add_collaboration_notification_types.sql` | Update notifications type constraint |
| 5 | `20260414000007_add_new_selection_statuses.sql` | Add `agreed`, `not_selected` to constraint |

### Full SQL for each migration file is in the migration appendix below.

### Post-Migration Checklist

- [ ] Run `npx supabase db push`
- [ ] Verify both new tables exist
- [ ] Export fresh RLS → update `supabase/RLS-list.md`
- [ ] Review `supabase/RLS-audit-findings.md` for new issues
- [ ] Update `supabase/database-scheme.sql`
- [ ] Update `.qwen/skills/instrument/DATABASE-REFERENCE.md`
- [ ] Run build to verify no type errors

---

## 9. Transition Decisions

| Question | Decision |
|---|---|
| Backfill existing `finalist` records? | **No.** Start fresh. Only new `makeFinalist` calls create collaboration records. |
| `makeFinalist` idempotency? | **No-op.** If collaboration already exists, do nothing. No error, no duplicate. |
| Formalize informal working relationships? | **Leave as-is.** Post-launch feature if needed. |
| Storage bucket access for pros? | **No change.** App layer manages. |

---

## 10. Reputation Architecture

```
Platform Reputation:
├─ Recommendations (formal, verified, STRONGEST signal)
│   └─ Separate flow (not inbox). Admin-verified.
│   └─ Displayed on portfolio as count + list.
│
├─ Google Reviews (external, synced, PUBLIC rating)
│   └─ In pro inbox for reply (via Google API).
│   └─ Displayed on portfolio as ★ rating. ONLY public rating.
│
└─ Realization Comments (social, lightweight)
    └─ In pro inbox for reply (inline).
    └─ Displayed on portfolio as social feed.

NO platform rating displayed anywhere.
Only Google rating is public.
```

---

## 11. Files to Create/Modify

### New Files
```
components/pro/ProListPage.tsx          — Client pro list view
components/pro/ProposalView.tsx          — Client proposal review
components/pro/FinalistProjectView.tsx   — Pro read-only project view
components/pro/ProInbox.tsx              — Pro inbox with 3 tabs
components/pro/ProposalCard.tsx          — Proposal card for pro list
components/pro/CollaborationThread.tsx   — Message thread in collaboration
lib/actions/collaborations.ts            — All collaboration server actions
app/(client)/projects/[id]/pros/page.tsx — Pro list page route
app/(pro)/inbox/page.tsx                 — Pro inbox route
```

### Modified Files
```
components/pro/ProProjectsPage.tsx       — Add source indicator badge
lib/types/pro-projects.ts                — Add source_type field
lib/types/collaborations.ts              — New type definitions
components/daily-logs/DailyLogCard.tsx   — Add author identity display
```

---

## Migration Appendix — Full SQL

### Migration 1: `20260414000003_create_project_collaborations.sql`

```sql
CREATE TABLE public.project_collaborations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  professional_id uuid NOT NULL,
  project_professional_id uuid NOT NULL,
  pro_project_id uuid,
  status text NOT NULL DEFAULT 'pending'::text
    CHECK (status = ANY (ARRAY['pending','negotiating','active','declined','not_picked','suspended','terminated'])),
  proposal_text text,
  proposal_budget numeric,
  proposal_currency text DEFAULT 'XOF'::text,
  proposal_timeline text,
  proposal_submitted_at timestamp with time zone,
  agreed_price numeric,
  agreed_start_date date,
  agreed_end_date date,
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  decline_reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT project_collaborations_pkey PRIMARY KEY (id),
  CONSTRAINT fk_collab_project FOREIGN KEY (project_id) REFERENCES public.user_projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_collab_professional FOREIGN KEY (professional_id) REFERENCES public.professionals(id) ON DELETE CASCADE,
  CONSTRAINT fk_collab_project_prof FOREIGN KEY (project_professional_id) REFERENCES public.project_professionals(id) ON DELETE CASCADE,
  CONSTRAINT fk_collab_pro_project FOREIGN KEY (pro_project_id) REFERENCES public.pro_projects(id) ON DELETE SET NULL
);

CREATE INDEX idx_collab_project ON public.project_collaborations(project_id);
CREATE INDEX idx_collab_professional ON public.project_collaborations(professional_id);
CREATE INDEX idx_collab_status ON public.project_collaborations(status);

ALTER TABLE public.project_collaborations ENABLE ROW LEVEL SECURITY;

CREATE POLICY collab_client_all ON public.project_collaborations
  FOR ALL
  USING (project_id IN (SELECT id FROM public.user_projects WHERE user_id = auth.uid()))
  WITH CHECK (project_id IN (SELECT id FROM public.user_projects WHERE user_id = auth.uid()));

CREATE POLICY collab_pro_read ON public.project_collaborations
  FOR SELECT
  USING (professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid()));

CREATE POLICY collab_pro_update ON public.project_collaborations
  FOR UPDATE
  USING (professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid()))
  WITH CHECK (professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid()));
```

### Migration 2: `20260414000004_create_collaboration_messages.sql`

```sql
CREATE TABLE public.collaboration_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  collaboration_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  sender_role text NOT NULL CHECK (sender_role = ANY (ARRAY['client','professional'])),
  message_type text NOT NULL CHECK (message_type = ANY (ARRAY['proposal','counter_offer','revision_request','acceptance','decline','general'])),
  content text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT collab_messages_pkey PRIMARY KEY (id),
  CONSTRAINT collab_messages_collab_id_fkey FOREIGN KEY (collaboration_id) REFERENCES public.project_collaborations(id) ON DELETE CASCADE,
  CONSTRAINT collab_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id)
);

CREATE INDEX idx_collab_messages_collab ON public.collaboration_messages(collaboration_id);

ALTER TABLE public.collaboration_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY collab_messages_read ON public.collaboration_messages
  FOR SELECT
  USING (
    collaboration_id IN (
      SELECT id FROM public.project_collaborations
      WHERE project_id IN (SELECT id FROM public.user_projects WHERE user_id = auth.uid())
      OR professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid())
    )
  );

CREATE POLICY collab_messages_client_insert ON public.collaboration_messages
  FOR INSERT
  WITH CHECK (
    collaboration_id IN (
      SELECT id FROM public.project_collaborations
      WHERE project_id IN (SELECT id FROM public.user_projects WHERE user_id = auth.uid())
    )
  );

CREATE POLICY collab_messages_pro_insert ON public.collaboration_messages
  FOR INSERT
  WITH CHECK (
    collaboration_id IN (
      SELECT id FROM public.project_collaborations
      WHERE professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid())
    )
  );
```

### Migration 3: `20260414000005_collaboration_access_policies.sql`

```sql
-- user_projects: pro read
CREATE POLICY user_projects_collab_pro_read ON public.user_projects
  FOR SELECT
  USING (
    id IN (
      SELECT pc.project_id FROM public.project_collaborations pc
      WHERE pc.professional_id IN (
        SELECT id FROM public.professionals WHERE user_id = auth.uid()
      )
      AND pc.status IN ('pending', 'negotiating', 'active')
    )
  );

-- user_projects: pro write
CREATE POLICY user_projects_collab_pro_write ON public.user_projects
  FOR ALL
  USING (
    id IN (
      SELECT pc.project_id FROM public.project_collaborations pc
      WHERE pc.professional_id IN (
        SELECT id FROM public.professionals WHERE user_id = auth.uid()
      )
      AND pc.status = 'active'
    )
  )
  WITH CHECK (
    id IN (
      SELECT pc.project_id FROM public.project_collaborations pc
      WHERE pc.professional_id IN (
        SELECT id FROM public.professionals WHERE user_id = auth.uid()
      )
      AND pc.status = 'active'
    )
  );

-- project_logs: pro access
CREATE POLICY project_logs_collab_pro ON public.project_logs
  FOR ALL
  USING (
    project_id IN (
      SELECT pc.project_id FROM public.project_collaborations pc
      WHERE pc.professional_id IN (
        SELECT id FROM public.professionals WHERE user_id = auth.uid()
      )
      AND pc.status IN ('pending', 'negotiating', 'active')
    )
    OR author_id = auth.uid()
  )
  WITH CHECK (
    project_id IN (
      SELECT pc.project_id FROM public.project_collaborations pc
      WHERE pc.professional_id IN (
        SELECT id FROM public.professionals WHERE user_id = auth.uid()
      )
      AND pc.status = 'active'
    )
    OR author_id = auth.uid()
  );

-- project_steps: pro access
CREATE POLICY project_steps_collab_pro ON public.project_steps
  FOR ALL
  USING (
    project_id IN (
      SELECT pc.project_id FROM public.project_collaborations pc
      WHERE pc.professional_id IN (
        SELECT id FROM public.professionals WHERE user_id = auth.uid()
      )
      AND pc.status IN ('pending', 'negotiating', 'active')
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT pc.project_id FROM public.project_collaborations pc
      WHERE pc.professional_id IN (
        SELECT id FROM public.professionals WHERE user_id = auth.uid()
      )
      AND pc.status = 'active'
    )
  );

-- project_documents: pro access
CREATE POLICY project_documents_collab_pro ON public.project_documents
  FOR ALL
  USING (
    project_id IN (
      SELECT pc.project_id FROM public.project_collaborations pc
      WHERE pc.professional_id IN (
        SELECT id FROM public.professionals WHERE user_id = auth.uid()
      )
      AND pc.status IN ('pending', 'negotiating', 'active')
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT pc.project_id FROM public.project_collaborations pc
      WHERE pc.professional_id IN (
        SELECT id FROM public.professionals WHERE user_id = auth.uid()
      )
      AND pc.status = 'active'
    )
  );

-- project_areas: pro read only
CREATE POLICY project_areas_collab_pro_read ON public.project_areas
  FOR SELECT
  USING (
    project_id IN (
      SELECT pc.project_id FROM public.project_collaborations pc
      WHERE pc.professional_id IN (
        SELECT id FROM public.professionals WHERE user_id = auth.uid()
      )
      AND pc.status IN ('pending', 'negotiating', 'active')
    )
  );

-- project_payments: pro read only (active only)
CREATE POLICY project_payments_collab_pro_read ON public.project_payments
  FOR SELECT
  USING (
    project_id IN (
      SELECT pc.project_id FROM public.project_collaborations pc
      WHERE pc.professional_id IN (
        SELECT id FROM public.professionals WHERE user_id = auth.uid()
      )
      AND pc.status = 'active'
    )
  );

-- project_professionals: active pros see only other active pros
CREATE POLICY project_professionals_collab_view ON public.project_professionals
  FOR SELECT
  USING (
    project_id IN (SELECT id FROM public.user_projects WHERE user_id = auth.uid())
    OR (
      project_id IN (
        SELECT pc.project_id FROM public.project_collaborations pc
        WHERE pc.professional_id IN (
          SELECT id FROM public.professionals WHERE user_id = auth.uid()
        )
        AND pc.status = 'active'
      )
      AND selection_status = 'agreed'
    )
  );
```

### Migration 4: `20260414000006_add_collaboration_notification_types.sql`

```sql
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type = ANY (ARRAY[
    'log_created'::text,
    'log_approved'::text,
    'log_contested'::text,
    'log_resolved'::text,
    'project_assigned'::text,
    'new_recommendation'::text,
    'new_signal'::text,
    'status_changed'::text,
    'subscription_activated'::text,
    'subscription_expired'::text,
    'finalist_selected'::text,
    'proposal_submitted'::text,
    'revision_requested'::text,
    'proposal_accepted'::text,
    'proposal_declined'::text,
    'collaboration_declined'::text,
    'collaboration_activated'::text,
    'collaboration_terminated'::text
  ]));
```

### Migration 5: `20260414000007_add_new_selection_statuses.sql`

```sql
ALTER TABLE public.project_professionals
  DROP CONSTRAINT IF EXISTS project_professionals_selection_status_check;

ALTER TABLE public.project_professionals
  ADD CONSTRAINT project_professionals_selection_status_check
  CHECK (selection_status = ANY (ARRAY[
    'candidate'::text,
    'shortlisted'::text,
    'finalist'::text,
    'agreed'::text,
    'not_selected'::text
  ]));
```
