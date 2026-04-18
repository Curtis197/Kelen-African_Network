# 🗄️ Database Schema Quick Reference

> **Source of truth: `supabase/database-scheme.sql`**
> **Last updated: April 10, 2026**

## 📋 Table Categories

### 1. **USER MANAGEMENT** (4 tables)
- `users` - User accounts
- `user_favorites` - Saved professionals
- `user_projects` - Client projects (formerly called "projects")
- `subscriptions` - Professional subscriptions

### 2. **PROFESSIONALS** (8 tables)
- `professionals` - Professional profiles
- `professional_areas` - Development areas (Law, Construction, etc.)
- `professions` - Specific professions within areas
- `professional_portfolio` - Profile customization (hero, about sections)
- `professional_realizations` - Portfolio showcase (FINISHED work)
- `realization_images` - Realization photos
- `realization_videos` - Realization videos
- `realization_documents` - Realization docs
- `realization_comments` - Realization feedback
- `realization_likes` - Realization likes

### 3. **PRO PROJECTS** (Professional Client Work Management) (3 tables)
- `pro_projects` - Professional's client projects (management, NOT portfolio)
- `pro_project_images` - Pro project photos
- `pro_project_clients` - Pro project client info

### 4. **USER PROJECT MANAGEMENT** (Client Projects) (6 tables)
- `user_projects` - Client's project (the main project)
- `project_areas` - Geographic/functional areas of project
- `project_steps` - Project phases/milestones
- `project_professionals` - Professionals assigned to project
- `project_step_professionals` - Professionals linked to specific steps
- `project_payments` - Payments for project

### 5. **PROJECT LOGS** (Daily Logs System) (5 tables)
- `project_logs` - Daily activity logs
- `project_log_comments` - Approvals/contests
- `project_log_media` - Photos/media for logs
- `project_log_shares` - Shared log links
- `project_log_views` - Log view tracking

### 6. **DOCUMENTS & EVIDENCE** (3 tables)
- `project_documents` - Contracts/documents
- `project_images` - Professional project photos (pro-owned)
- `user_project_images` - Client project images (client-owned)

### 7. **REVIEWS & SIGNALS** (4 tables)
- `reviews` - Professional reviews
- `review_history` - Review change history
- `signals` - Breach/problem reports
- `recommendations` - Professional recommendations

### 8. **NOTIFICATIONS & ANALYTICS** (4 tables)
- `notifications` - User notifications
- `profile_views` - Profile view tracking
- `profile_interactions` - Contact clicks, etc.
- `verification_queue` - Items awaiting verification

### 9. **COLLABORATION** (2 tables)
- `project_collaborations` - Client-pro collaboration pipeline (Saved → Finalist → Proposal → Active)
- `collaboration_messages` - Negotiation messages thread

---

## 🔑 Common Confusion Points

### ⚠️ CONFUSION #1: "Projects" vs "Pro Projects" vs "User Projects" vs "Realizations"

| Table | Purpose | Who Creates | Visibility | Example |
|-------|---------|-------------|------------|---------|
| **`user_projects`** | Client's project management | **Client** | Private to client | "Building my house in Dakar" |
| **`pro_projects`** | Pro managing client project | **Professional** | Private (pro + client) | "House construction for Jean" (client not on platform) |
| **`professional_realizations`** | Portfolio showcase (FINISHED) | **Professional** | Public (portfolio) | "Completed villa in Dakar - 2024" |

**Workflow:**
```
Pro creates pro_project (managing client work)
    ↓
Work progresses (project_logs)
    ↓
Work completed
    ↓
Pro creates professional_realization (showcase finished work)
    ↓
Realization appears on public portfolio
```

**Key Differences:**
- **`user_projects`** = Client is on platform, managing their own project
- **`pro_projects`** = Pro is managing work (client may NOT be on platform)
- **`professional_realizations`** = Finished work showcased on portfolio (NOT in-progress projects)

**Common Mistake:**
```typescript
// ❌ WRONG - Table doesn't exist!
const { data } = await supabase.from('projects').select('*')

// ✅ RIGHT - Client's projects (client is on platform)
const { data } = await supabase.from('user_projects').select('*')

// ✅ RIGHT - Pro managing client work (client may not be on platform)
const { data } = await supabase.from('pro_projects').select('*')

// ✅ RIGHT - Finished work on portfolio (public showcase)
const { data } = await supabase.from('professional_realizations').select('*')
```

### ⚠️ CONFUSION #2: "Professional" vs "Profession" vs "Professional Area"

| Table | Purpose | Example |
|-------|---------|---------|
| **`professionals`** | The person/company | "Jean Dupont Construction" |
| **`professions`** | The job type | "Maçon", "Électricien" |
| **`professional_areas`** | Broad category | "Construction", "Legal", "Education" |

**Relationship:**
```
professional_areas (Construction)
  └─ professions (Maçon)
       └─ professionals (Jean Dupont)
```

### ⚠️ CONFUSION #3: "Project Professionals" vs "Project Step Professionals"

| Table | Purpose | Example |
|-------|---------|---------|
| **`project_professionals`** | Professional assigned to project | "Jean assigned to my house project" |
| **`project_step_professionals`** | Professional assigned to specific step | "Jean assigned to Foundation step only" |

### ⚠️ CONFUSION #4: "Realizations" vs "Pro Projects"

| Table | Purpose | Content | Visibility |
|-------|---------|---------|------------|
| **`professional_realizations`** | Portfolio showcase (FINISHED work) | "Built 50 houses in 2024" | **PUBLIC** on portfolio |
| **`pro_projects`** | Pro managing client work | Full details, photos, clients | **PRIVATE** (pro + client) |

**Workflow:**
```
pro_projects (in-progress management)
    ↓ Completed
professional_realizations (finished showcase)
    ↓
Displayed on public portfolio
```

---

## 📊 Complete Table Reference

### `users` - User Accounts
**Purpose:** All user accounts (clients and professionals)

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key (matches auth.users) |
| `email` | text | User email |
| `display_name` | text | Display name |
| `role` | text | `client`, `pro_africa`, `pro_europe`, `pro_intl`, `admin` |
| `country` | text | User's country |
| `phone` | text | Phone number |
| `language` | text | `fr` or `en` |

**Common Queries:**
```typescript
// Get current user
const { data } = await supabase.from('users').select('*').eq('id', userId).single()

// Get all clients
const { data } = await supabase.from('users').select('*').eq('role', 'client')
```

---

### `user_projects` - Client Projects
**Purpose:** Projects created by clients to manage their construction/renovation

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK → users.id |
| `title` | text | Project title |
| `description` | text | Project description |
| `category` | text | Project category |
| `location` | text | Project location (city name) |
| `location_lat` | numeric | GPS latitude coordinate |
| `location_lng` | numeric | GPS longitude coordinate |
| `location_country` | text | Country name from geocoding |
| `location_formatted` | text | Full formatted address from Google Maps |
| `budget_total` | numeric | Total budget |
| `budget_currency` | text | `EUR`, `XOF`, `USD` (default: `EUR`) |
| `status` | text | `en_preparation`, `en_cours`, `en_pause`, `termine`, `annule` |
| `objectives` | jsonb | Project objectives array |

**Common Queries:**
```typescript
// Get user's projects
const { data } = await supabase
  .from('user_projects')
  .select('*')
  .eq('user_id', userId)

// Create new project
const { data } = await supabase
  .from('user_projects')
  .insert({
    user_id: userId,
    title: 'My House',
    category: 'Construction',
    budget_currency: 'EUR'
  })
```

---

### `user_project_images` - Client Project Images
**Purpose:** Image gallery for client's user_projects

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `project_id` | uuid | FK → user_projects.id (CASCADE DELETE) |
| `url` | text | Image URL (storage) |
| `is_main` | boolean | Main/hero image flag |
| `created_at` | timestamptz | Auto now |
| `updated_at` | timestamptz | Auto now |

**RLS Policies:**
- `upimages_user_read_own` — SELECT for project owner
- `upimages_user_insert_own` — INSERT for project owner
- `upimages_user_update_own` — UPDATE for project owner
- `upimages_user_delete_own` — DELETE for project owner
- `upimages_public_read` — SELECT for anyone
- `upimages_admin_all` — ALL for admins

**Common Usage:**
```typescript
// Get project images (client-side)
import { getProjectImages } from '@/lib/actions/project-images'
const images = await getProjectImages(projectId)
const mainImage = images.find(img => img.is_main) || images[0]

// Upload and add image (via server action)
import { uploadProjectImage } from '@/lib/actions/project-images'
const result = await uploadProjectImage(projectId, imageUrl)
```

---

### `professionals` - Professional Profiles
**Purpose:** Professional business profiles

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK → users.id (UNIQUE) |
| `business_name` | text | Business name |
| `slug` | text | URL slug (UNIQUE) |
| `category` | text | Business category |
| `country` | text | Country |
| `city` | text | City |
| `status` | text | `gold`, `silver`, `white`, `red`, `black` |
| `area_id` | uuid | FK → professional_areas.id |
| `profession_id` | uuid | FK → professions.id |
| `is_visible` | boolean | Show in search |
| `verified` | boolean | Verified status |

**Common Queries:**
```typescript
// Get professional by slug
const { data } = await supabase
  .from('professionals')
  .select('*, professional_areas(*), professions(*)')
  .eq('slug', slug)
  .single()

// Search professionals
const { data } = await supabase
  .from('professionals')
  .select('*')
  .eq('category', 'Construction')
  .eq('is_visible', true)
```

---

### `pro_projects` - Professional Client Projects
**Purpose:** Projects created by professionals to manage client work (client may NOT be on platform)

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `professional_id` | uuid | FK → professionals.id |
| `title` | text | Project title |
| `description` | text | Project description |
| `category` | text | Project category |
| `location` | text | Location |
| `client_name` | text | Client name (may not be on platform) |
| `client_email` | text | Client email |
| `client_phone` | text | Client phone |
| `start_date` | date | Project start |
| `end_date` | date | Expected end |
| `actual_end_date` | date | Actual completion date |
| `budget` | numeric | Project budget |
| `currency` | text | `XOF`, `EUR`, `USD` (default: `XOF`) |
| `status` | text | `in_progress`, `completed`, `paused`, `cancelled` |
| `is_public` | boolean | **NOT for portfolio** - internal visibility |
| `completion_notes` | text | Notes on completion |

**Key Points:**
- ⚠️ **NOT displayed on portfolio** - these are management tools
- ⚠️ Client may NOT be a platform user
- ✅ Used for project tracking, logs, client communication
- ✅ When completed, pro may create `professional_realizations` from this work

**Common Queries:**
```typescript
// Get pro's client projects
const { data } = await supabase
  .from('pro_projects')
  .select('*, pro_project_images(*), pro_project_clients(*)')
  .eq('professional_id', proId)

// Get completed projects (candidates for portfolio showcase)
const { data } = await supabase
  .from('pro_projects')
  .select('*')
  .eq('professional_id', proId)
  .eq('status', 'completed')
```

---

### `project_logs` - Daily Activity Logs
**Purpose:** Daily progress logs for projects

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `project_id` | uuid | FK → user_projects.id |
| `pro_project_id` | uuid | FK → pro_projects.id |
| `step_id` | uuid | FK → project_steps.id |
| `author_id` | uuid | FK → users.id |
| `author_role` | text | `client` or `professional` |
| `log_date` | date | Date of log |
| `title` | text | Log title |
| `description` | text | Log description |
| `money_spent` | numeric | Amount spent |
| `money_currency` | text | `XOF`, `EUR`, `USD` (default: `XOF`) |
| `status` | text | `pending`, `approved`, `contested`, `resolved` |
| `gps_latitude` | numeric | GPS location |
| `gps_longitude` | numeric | GPS location |
| `location_name` | text | Human-readable city name |

**Common Queries:**
```typescript
// Get logs for a project
const { data } = await supabase
  .from('project_logs')
  .select('*, project_log_media(*), author:users(display_name)')
  .eq('project_id', projectId)
  .order('log_date', { ascending: false })
```

---

### `project_steps` - Project Phases
**Purpose:** Phases/milestones within a user project

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `project_id` | uuid | FK → user_projects.id |
| `title` | text | Step title |
| `status` | text | `pending`, `in_progress`, `completed`, `on_hold`, `cancelled`, `approved`, `rejected` |
| `budget` | numeric | Step budget |
| `expenditure` | numeric | Amount spent |
| `order_index` | integer | Display order |

**Common Queries:**
```typescript
// Get steps for a project
const { data } = await supabase
  .from('project_steps')
  .select('*')
  .eq('project_id', projectId)
  .order('order_index', { ascending: true })
```

---

### `reviews` - Professional Reviews
**Purpose:** Reviews/ratings for professionals

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `professional_id` | uuid | FK → professionals.id |
| `reviewer_id` | uuid | FK → users.id |
| `reviewer_name` | text | Reviewer name |
| `reviewer_country` | text | Reviewer country |
| `rating` | integer | 1-5 rating |
| `comment` | text | Review comment |
| `is_hidden` | boolean | Hidden flag |

**Common Queries:**
```typescript
// Get professional's reviews
const { data } = await supabase
  .from('reviews')
  .select('*')
  .eq('professional_id', proId)
  .eq('is_hidden', false)
  .order('created_at', { ascending: false })
```

---

## 📊 Table Details

### `realization_videos` - Realization Videos
**Purpose:** Videos for professional realizations (MP4, WebM)

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `realization_id` | uuid | FK → professional_realizations.id (CASCADE DELETE) |
| `url` | text | Video URL (storage) |
| `thumbnail_url` | text | Optional thumbnail URL |
| `duration` | integer | Video duration in seconds |
| `order_index` | integer | Display order (default: 0) |
| `created_at` | timestamptz | Auto now |
| `updated_at` | timestamptz | Auto now |

**Storage:**
- **Bucket:** `portfolios`
- **Path:** `portfolios/{user_id}/videos/{uuid}.{ext}`
- **Max file size:** 50 MB
- **Allowed formats:** `video/mp4`, `video/webm`

**RLS Policies:**
- `realization_videos_insert_own` — INSERT for realization owner
- `realization_videos_update_own` — UPDATE for realization owner
- `realization_videos_delete_own` — DELETE for realization owner
- `realization_videos_public_view` — SELECT for anyone (if professional is visible)

**Common Usage:**
```typescript
// Get realization videos
const { data } = await supabase
  .from('professional_realizations')
  .select('*, realization_videos(*)')
  .eq('id', realizationId)
  .single()

// Videos are ordered by order_index
const sortedVideos = data.realization_videos
  .sort((a, b) => a.order_index - b.order_index)
```

---

### `professional_realizations` - Portfolio Showcase (FINISHED WORK)
**Purpose:** Completed work showcased on professional's PUBLIC portfolio

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `professional_id` | uuid | FK → professionals.id |
| `title` | text | Realization title |
| `description` | text | Description of work |
| `location` | text | Project location |
| `completion_date` | date | When completed |
| `price` | numeric | Project value |
| `currency` | text | `XOF` (default), `EUR`, `USD` |

**Associated Tables:**
- `realization_images` - Photos for this realization
- `realization_videos` - Videos for this realization
- `realization_documents` - Documents for this realization
- `realization_comments` - Feedback/comments on realization
- `realization_likes` - Likes for this realization

**Key Points:**
- ✅ **DISPLAYED on PUBLIC portfolio** - this is what visitors see!
- ✅ Only FINISHED work should be added here
- ✅ Created FROM completed `pro_projects` (but not required)
- ✅ This is the professional's showcase, not work-in-progress

**Common Queries:**
```typescript
// Get professional's portfolio (public showcase)
const { data } = await supabase
  .from('professional_realizations')
  .select('*, realization_images(*), realization_documents(*)')
  .eq('professional_id', proId)
  .order('completion_date', { ascending: false })

// Add new realization
const { data } = await supabase
  .from('professional_realizations')
  .insert({
    professional_id: proId,
    title: 'Villa Construction',
    description: 'Luxury villa built in Dakar',
    location: 'Dakar, Senegal',
    completion_date: '2024-12-01',
    price: 150000000,
    currency: 'XOF'
  })
```

---

## 🔗 Table Relationships

### Key Foreign Keys

```
users
 ├─ user_projects (user_id) - Client's projects
 ├─ professionals (user_id) UNIQUE - Pro profile
 ├─ project_logs (author_id) - Daily logs
 └─ reviews (reviewer_id) - Reviews given

professionals
 ├─ pro_projects (professional_id) - Client work management (PRIVATE)
 ├─ professional_realizations (professional_id) - Portfolio showcase (PUBLIC)
 ├─ professional_portfolio (professional_id) UNIQUE - Profile customization
 ├─ realization_images - Photos for realizations
 ├─ realization_videos - Videos for realizations
 ├─ realization_documents - Docs for realizations
 ├─ realization_comments - Comments on realizations
 ├─ realization_likes - Likes for realizations
 ├─ project_professionals (professional_id) - Assigned to client projects
 ├─ project_documents (professional_id) - Contracts
 ├─ project_images (professional_id) - Project photos
 ├─ reviews (professional_id) - Reviews received
 ├─ signals (professional_id) - Breach reports
 └─ recommendations (professional_id) - Recommendations

user_projects
 ├─ project_areas (project_id) - Project areas
 ├─ project_steps (project_id) - Project phases
 ├─ project_professionals (project_id) - Assigned professionals
 ├─ project_logs (project_id) - Daily activity logs
 └─ project_payments (project_id) - Payments

project_steps
 ├─ project_step_professionals (step_id) - Pros on specific steps
 └─ project_logs (step_id) - Logs for specific steps

pro_projects
 ├─ pro_project_images (pro_project_id) - Photos
 ├─ pro_project_clients (pro_project_id) - Client info
 └─ project_logs (pro_project_id) - Activity logs

professional_realizations
 ├─ realization_images (realization_id) - Photos
 ├─ realization_videos (realization_id) - Videos
 ├─ realization_documents (realization_id) - Documents
 ├─ realization_comments (realization_id) - Comments
 └─ realization_likes (realization_id) - Likes
```

### Project Lifecycle Flow

```
CLIENT ON PLATFORM:
user_projects (client creates)
  └─ project_steps (phases)
      └─ project_logs (daily activity)
          └─ project_log_media (photos/evidence)

PRO MANAGING CLIENT WORK:
pro_projects (pro creates, client may not be on platform)
  └─ pro_project_clients (client details)
      └─ project_logs (daily activity)
          └─ project_log_media (photos/evidence)

COMPLETED WORK → PORTFOLIO:
pro_projects (status: completed)
  → professional_realizations (created from completed work)
      └─ realization_images (showcase photos)
          → DISPLAYED ON PUBLIC PORTFOLIO
```

---

## 🤝 Collaboration Tables

### `project_collaborations` - Client-Pro Collaboration Pipeline
**Purpose:** Tracks the collaboration pipeline from finalist selection to active collaboration

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `project_id` | uuid | FK → user_projects.id (CASCADE DELETE) |
| `professional_id` | uuid | FK → professionals.id (CASCADE DELETE) |
| `project_professional_id` | uuid | FK → project_professionals.id (CASCADE DELETE) |
| `pro_project_id` | uuid | FK → pro_projects.id (SET NULL on delete) |
| `status` | text | `pending`, `negotiating`, `active`, `declined`, `not_picked`, `suspended`, `terminated` |
| `proposal_text` | text | Pro's approach & terms |
| `proposal_budget` | numeric | Pro's quoted price |
| `proposal_currency` | text | Default `XOF` |
| `proposal_timeline` | text | Pro's estimated timeline |
| `proposal_submitted_at` | timestamptz | When proposal was submitted |
| `agreed_price` | numeric | Final agreed price |
| `agreed_start_date` | date | Agreement start |
| `agreed_end_date` | date | Agreement end |
| `started_at` | timestamptz | When collaboration became active |
| `ended_at` | timestamptz | When collaboration ended |
| `decline_reason` | text | Reason for declining |
| `created_at` | timestamptz | Auto now |
| `updated_at` | timestamptz | Auto now |

**Status Workflow:**
```
pending → negotiating → active → terminated
pending → declined
negotiating → not_picked
```

**Common Queries:**
```typescript
// Get all collaborations for a project
const { data } = await supabase
  .from('project_collaborations')
  .select('*, professional:professionals(*), messages:collaboration_messages(*)')
  .eq('project_id', projectId)
  .order('created_at', { ascending: false })

// Get pro's inbox
const { data } = await supabase
  .from('project_collaborations')
  .select('*, project:user_projects(*)')
  .eq('professional_id', proId)
  .in('status', ['pending', 'negotiating', 'active'])
```

---

### `collaboration_messages` - Collaboration Message Thread
**Purpose:** Negotiation messages between client and pro

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `collaboration_id` | uuid | FK → project_collaborations.id (CASCADE DELETE) |
| `sender_id` | uuid | FK → users.id |
| `sender_role` | text | `client` or `professional` |
| `message_type` | text | `proposal`, `counter_offer`, `revision_request`, `acceptance`, `decline`, `general` |
| `content` | text | Message body |
| `attachments` | jsonb | Array of `{url, type, name}` |
| `created_at` | timestamptz | Auto now |

**Common Queries:**
```typescript
// Get message thread
const { data } = await supabase
  .from('collaboration_messages')
  .select('*')
  .eq('collaboration_id', collabId)
  .order('created_at', { ascending: true })
```

---

### `project_professionals` — Updated `selection_status` values

**New values added:** `agreed`, `not_selected`

| Status | Collaboration Status | Meaning |
|--------|---------------------|---------|
| `candidate` | *(no collaboration)* | Pro saved/liked by client |
| `shortlisted` | *(no collaboration)* | Client considering |
| `finalist` | `pending` or `negotiating` | Proposal phase |
| `agreed` | `active` | Pro picked, collaboration active |
| `not_selected` | `declined` or `not_picked` | Finalist not chosen |

---

### `notifications.type` — New enum values

**8 new values added:**
- `finalist_selected`
- `proposal_submitted`
- `revision_requested`
- `proposal_accepted`
- `proposal_declined`
- `collaboration_declined`
- `collaboration_activated`
- `collaboration_terminated`

---

## ⚡ Common Query Patterns

### Get Project with All Details
```typescript
const { data } = await supabase
  .from('user_projects')
  .select(`
    *,
    project_areas(*),
    project_steps(*),
    project_professionals(
      *,
      professionals(*)
    ),
    project_logs(*)
  `)
  .eq('id', projectId)
  .single()
```

### Get Professional with Full Profile
```typescript
const { data } = await supabase
  .from('professionals')
  .select(`
    *,
    professional_areas(*),
    professions(*),
    professional_portfolio(*),
    pro_projects(*),
    professional_realizations(*),
    reviews(*)
  `)
  .eq('slug', slug)
  .single()
```

---

## 🚨 RLS Policy Notes

**Common RLS Issues:**

1. **`user_projects`** - User can only see their own projects
   ```sql
   SELECT for authenticated users where user_id = auth.uid()
   ```

2. **`professionals`** - Public visibility, but edits restricted
   ```sql
   SELECT for all users
   UPDATE/DELETE for professionals where user_id = auth.uid()
   ```

3. **`project_logs`** - Authors and project owners can access
   ```sql
   SELECT where author_id = auth.uid() OR project_id IN (SELECT id FROM user_projects WHERE user_id = auth.uid())
   ```

---

## 💡 Quick Tips

### Always Use These Table Names:
- ✅ `user_projects` - Client projects
- ✅ `pro_projects` - Professional portfolio
- ✅ `professionals` - Professional profiles
- ✅ `project_logs` - Daily logs

### Never Use These (Don't Exist):
- ❌ `projects` - Doesn't exist!
- ❌ `project` - Doesn't exist!
- ❌ `professional_project` - Doesn't exist!

### Status Values:
- **user_projects:** `en_preparation`, `en_cours`, `en_pause`, `termine`, `annule`
- **pro_projects:** `in_progress`, `completed`, `paused`, `cancelled`
- **project_logs:** `pending`, `approved`, `contested`, `resolved`
- **project_steps:** `pending`, `in_progress`, `completed`, `on_hold`, `cancelled`, `approved`, `rejected`
- **professionals.status:** `gold`, `silver`, `white`, `red`, `black`

---

**Keep this file updated as schema changes!** 📝
