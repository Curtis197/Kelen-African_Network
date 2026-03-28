# Project Areas & Steps Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 5 bugs in the project/steps/areas feature: status constraint, external pro uniqueness, navigation, missing project_steps migration, and persistent project areas.

**Architecture:** Two SQL migrations handle DB schema fixes. Code changes update the project detail page and actions to use a `project_areas` table instead of ephemeral local state.

**Tech Stack:** Next.js 15 App Router, Supabase SSR, TypeScript, React

---

## File Map

| File | Change |
|---|---|
| `supabase/migrations/20260328000001_project_steps.sql` | **NEW** — create `project_steps` + `project_step_professionals` tables with correct status check |
| `supabase/migrations/20260328000002_project_areas.sql` | **NEW** — fix unique constraint on external pros, create `project_areas` table, migrate data |
| `lib/types/projects.ts` | Add `ProjectArea` interface |
| `lib/actions/projects.ts` | Add `createProjectArea`, `deleteProjectArea`, `getProjectAreas`; update `manageProjectProfessional` to set `project_area_id` |
| `app/(client)/projets/[id]/page.tsx` | Load areas from DB, use `createProjectArea` on add, replace `activeAreas` state with `areas` from DB |
| `components/projects/DevelopmentAreaRow.tsx` | Fix "Trouver un professionnel" link to `/` instead of `/recherche`; add `areaId` prop + delete area button |

---

## Task 1: SQL — Create `project_steps` table and fix status constraint

**Files:**
- Create: `supabase/migrations/20260328000001_project_steps.sql`

The table was created manually in Supabase. This migration ensures it exists correctly and fixes the constraint to include all valid statuses.

- [ ] **Step 1: Create the migration file**

```sql
-- Migration: Create project_steps and project_step_professionals tables
-- Handles the case where tables may already exist from manual creation.

-- ── project_steps ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS project_steps (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES user_projects(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  comment       TEXT,
  status        TEXT NOT NULL DEFAULT 'pending',
  budget        NUMERIC(14,2) NOT NULL DEFAULT 0,
  expenditure   NUMERIC(14,2) NOT NULL DEFAULT 0,
  order_index   INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Fix status constraint to include all valid values (drop and recreate)
ALTER TABLE project_steps DROP CONSTRAINT IF EXISTS project_steps_status_check;
ALTER TABLE project_steps
  ADD CONSTRAINT project_steps_status_check
  CHECK (status IN ('pending', 'in_progress', 'completed', 'on_hold', 'cancelled', 'approved', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_project_steps_project ON project_steps(project_id, order_index ASC);

-- Updated-at trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_project_steps'
  ) THEN
    CREATE TRIGGER set_updated_at_project_steps
      BEFORE UPDATE ON project_steps
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- ── project_step_professionals ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS project_step_professionals (
  step_id                  UUID NOT NULL REFERENCES project_steps(id) ON DELETE CASCADE,
  project_professional_id  UUID NOT NULL REFERENCES project_professionals(id) ON DELETE CASCADE,
  PRIMARY KEY (step_id, project_professional_id)
);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE project_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_step_professionals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies in case of re-run
DROP POLICY IF EXISTS "psteps_own" ON project_steps;
DROP POLICY IF EXISTS "psteps_admin" ON project_steps;
DROP POLICY IF EXISTS "pstep_pros_own" ON project_step_professionals;
DROP POLICY IF EXISTS "pstep_pros_admin" ON project_step_professionals;

CREATE POLICY "psteps_own" ON project_steps
  FOR ALL USING (
    project_id IN (SELECT id FROM user_projects WHERE user_id = auth.uid())
  )
  WITH CHECK (
    project_id IN (SELECT id FROM user_projects WHERE user_id = auth.uid())
  );

CREATE POLICY "psteps_admin" ON project_steps
  FOR ALL USING (public.has_role('admin'));

CREATE POLICY "pstep_pros_own" ON project_step_professionals
  FOR ALL USING (
    step_id IN (
      SELECT ps.id FROM project_steps ps
      JOIN user_projects up ON up.id = ps.project_id
      WHERE up.user_id = auth.uid()
    )
  )
  WITH CHECK (
    step_id IN (
      SELECT ps.id FROM project_steps ps
      JOIN user_projects up ON up.id = ps.project_id
      WHERE up.user_id = auth.uid()
    )
  );

CREATE POLICY "pstep_pros_admin" ON project_step_professionals
  FOR ALL USING (public.has_role('admin'));
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260328000001_project_steps.sql
git commit -m "fix(db): add project_steps migration with correct status constraint"
```

---

## Task 2: SQL — Fix external pro uniqueness + Create `project_areas` table

**Files:**
- Create: `supabase/migrations/20260328000002_project_areas.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- Migration: Fix unique constraint on external professionals and add project_areas table

-- ── 1. Fix unique_kelen_pro_per_project constraint ────────────────────────────
-- Current: UNIQUE NULLS NOT DISTINCT (project_id, professional_id)
-- Problem: NULLs treated as equal → only ONE external pro allowed per project.
-- Fix: drop constraint, replace with partial index on Kelen pros only.

ALTER TABLE project_professionals
  DROP CONSTRAINT IF EXISTS unique_kelen_pro_per_project;

DROP INDEX IF EXISTS unique_kelen_pro_per_project;

CREATE UNIQUE INDEX unique_kelen_pro_per_project
  ON project_professionals (project_id, professional_id)
  WHERE professional_id IS NOT NULL;

-- ── 2. Create project_areas table ─────────────────────────────────────────────
-- Stores development areas as persistent DB entities (not ephemeral local state).

CREATE TABLE IF NOT EXISTS project_areas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES user_projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (project_id, name)
);

CREATE INDEX IF NOT EXISTS idx_project_areas_project ON project_areas(project_id, created_at ASC);

-- ── 3. Add project_area_id FK to project_professionals ───────────────────────

ALTER TABLE project_professionals
  ADD COLUMN IF NOT EXISTS project_area_id UUID REFERENCES project_areas(id) ON DELETE SET NULL;

-- ── 4. Migrate existing development_area text → project_areas rows ────────────

INSERT INTO project_areas (project_id, name)
SELECT DISTINCT project_id, development_area
FROM project_professionals
WHERE development_area IS NOT NULL
ON CONFLICT (project_id, name) DO NOTHING;

UPDATE project_professionals pp
SET project_area_id = pa.id
FROM project_areas pa
WHERE pp.project_id = pa.project_id
  AND pp.development_area = pa.name
  AND pp.project_area_id IS NULL;

-- ── 5. RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE project_areas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "areas_own" ON project_areas;
DROP POLICY IF EXISTS "areas_admin" ON project_areas;

CREATE POLICY "areas_own" ON project_areas
  FOR ALL USING (
    project_id IN (SELECT id FROM user_projects WHERE user_id = auth.uid())
  )
  WITH CHECK (
    project_id IN (SELECT id FROM user_projects WHERE user_id = auth.uid())
  );

CREATE POLICY "areas_admin" ON project_areas
  FOR ALL USING (public.has_role('admin'));
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260328000002_project_areas.sql
git commit -m "fix(db): fix external pro unique constraint, add project_areas table"
```

---

## Task 3: Add `ProjectArea` type + server actions

**Files:**
- Modify: `lib/types/projects.ts`
- Modify: `lib/actions/projects.ts`

- [ ] **Step 1: Add `ProjectArea` to `lib/types/projects.ts`**

Append at the end of the file:

```typescript
export interface ProjectArea {
  id: string;
  project_id: string;
  name: string;
  created_at: string;
}
```

- [ ] **Step 2: Add area actions to `lib/actions/projects.ts`**

Add these three functions at the end of the file:

```typescript
export async function getProjectAreas(projectId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_areas")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) return [];
  return data;
}

export async function createProjectArea(projectId: string, name: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non autorisé" };

  const { data: project } = await supabase
    .from("user_projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) return { error: "Projet introuvable ou accès refusé." };

  const { data, error } = await supabase
    .from("project_areas")
    .insert([{ project_id: projectId, name }])
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath(`/projets/${projectId}`);
  return { data };
}

export async function deleteProjectArea(areaId: string, projectId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non autorisé" };

  const { data: project } = await supabase
    .from("user_projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) return { error: "Projet introuvable ou accès refusé." };

  const { error } = await supabase
    .from("project_areas")
    .delete()
    .eq("id", areaId);

  if (error) return { error: error.message };
  revalidatePath(`/projets/${projectId}`);
  return { success: true };
}
```

- [ ] **Step 3: Update `manageProjectProfessional` to also set `project_area_id`**

In the `manageProjectProfessional` function signature, add `areaId?: string` parameter:

```typescript
export async function manageProjectProfessional(
  projectId: string,
  proId: string | null,
  area: string,
  action: 'add' | 'remove',
  isExternal: boolean = false,
  externalData?: { name?: string; phone?: string; category?: string; location?: string; note?: string },
  areaId?: string
)
```

In the `if (action === 'add')` block, add `project_area_id` to `insertData`:

```typescript
if (areaId) {
  insertData.project_area_id = areaId;
}
```

Add it right after `insertData.development_area = area;`.

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 5: Commit**

```bash
git add lib/types/projects.ts lib/actions/projects.ts
git commit -m "feat(projects): add ProjectArea type and server actions for area management"
```

---

## Task 4: Update project detail page to use `project_areas` from DB

**Files:**
- Modify: `app/(client)/projets/[id]/page.tsx`

- [ ] **Step 1: Read the file, then apply changes**

Add `ProjectArea` to the imports from `@/lib/types/projects`:
```typescript
import { ProjectProfessional, ProjectStep, ProjectArea } from "@/lib/types/projects";
```

Add `createProjectArea`, `deleteProjectArea`, `getProjectAreas` to the import from `@/lib/actions/projects`:
```typescript
import { manageProjectProfessional, updateProfessionalRank, updateProfessionalSelection, createProjectArea, deleteProjectArea, getProjectAreas } from "@/lib/actions/projects";
```

Replace the `activeAreas` state with a typed `areas` state:
```typescript
// Remove:
const [activeAreas, setActiveAreas] = useState<string[]>([]);

// Add:
const [areas, setAreas] = useState<ProjectArea[]>([]);
```

In `fetchProjectData`, add a fetch for `project_areas` after the team fetch:

```typescript
// Fetch Areas
const areasData = await getProjectAreas(projectIdStr);
setAreas(areasData as ProjectArea[]);
```

Remove the `existingAreas` logic that was updating `activeAreas` from team data (the `setActiveAreas` call inside the team fetch block).

Replace the `addArea` function:
```typescript
const addArea = async (area: string) => {
  const result = await createProjectArea(projectIdStr, area);
  if (result?.data) {
    setAreas(prev => [...prev, result.data as ProjectArea]);
  }
  setShowAreaSelector(false);
};
```

Add a `removeArea` function:
```typescript
const removeArea = async (areaId: string) => {
  if (!confirm("Supprimer ce domaine et retirer tous ses professionnels ?")) return;
  await deleteProjectArea(areaId, projectIdStr);
  setAreas(prev => prev.filter(a => a.id !== areaId));
};
```

Update the `DevelopmentAreaRow` rendering to use `areas` instead of `activeAreas`:

```tsx
{/* Replace the areas.length > 0 ? areas : [...] map */}
<div className="space-y-16">
  {areas.map((area) => (
    <DevelopmentAreaRow
      key={area.id}
      areaId={area.id}
      areaName={area.name}
      projectId={projectIdStr}
      professionals={team.filter(m => m.development_area === area.name)}
      onRefresh={fetchProjectData}
      onDelete={() => removeArea(area.id)}
    />
  ))}

  {areas.length === 0 && (
    <div className="p-20 text-center bg-surface-container-low rounded-[2.5rem] border-2 border-dashed border-outline-variant/30">
      <div className="w-16 h-16 mx-auto bg-surface-container rounded-full flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-3xl text-on-surface-variant opacity-30">diversity_3</span>
      </div>
      <h4 className="text-xl font-headline font-bold text-on-surface">Initialisez vos domaines</h4>
      <p className="text-on-surface-variant font-medium mt-2 max-w-xs mx-auto">Ajoutez des domaines d&apos;intervention pour commencer à comparer des professionnels.</p>
      <button
        onClick={() => setShowAreaSelector(true)}
        className="mt-8 px-8 py-3 bg-primary/10 text-primary rounded-xl font-headline font-bold hover:bg-primary/20 transition-all font-body"
      >
        Choisir un premier domaine
      </button>
    </div>
  )}
</div>
```

Remove `import { DEVELOPMENT_AREAS } from "@/lib/constants/projects"` if it's only used in the area selector. Keep the area selector dropdown using `DEVELOPMENT_AREAS` — it can stay as-is for the preset list.

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add "app/(client)/projets/[id]/page.tsx"
git commit -m "feat(projects): load areas from DB, persist on add/delete"
```

---

## Task 5: Update `DevelopmentAreaRow` — fix nav + add areaId prop + delete button

**Files:**
- Modify: `components/projects/DevelopmentAreaRow.tsx`

- [ ] **Step 1: Read the file, then apply changes**

Add `areaId` and `onDelete` to the props interface:
```typescript
interface DevelopmentAreaRowProps {
  areaId: string;
  areaName: string;
  professionals: ProjectProfessional[];
  projectId: string;
  onRefresh: () => void;
  onDelete: () => void;
}
```

Update the function signature:
```typescript
export function DevelopmentAreaRow({ areaId, areaName, professionals, projectId, onRefresh, onDelete }: DevelopmentAreaRowProps) {
```

Fix the "Trouver un professionnel" link — change both occurrences from `/recherche?...` to `/`:
```tsx
// Change:
href={`/recherche?projectId=${projectId}&areaName=${encodeURIComponent(areaName)}`}
// To:
href={`/?projectId=${projectId}&areaName=${encodeURIComponent(areaName)}`}
```
(Do this for BOTH Link elements — line ~69 and the empty-state link ~215.)

Add a delete area button next to the "Ajouter un externe" button in the header:
```tsx
<button
  onClick={onDelete}
  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 hover:text-kelen-red-500 transition-colors"
  title="Supprimer ce domaine"
>
  <span className="material-symbols-outlined text-sm">delete</span>
</button>
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add components/projects/DevelopmentAreaRow.tsx
git commit -m "fix(projects): fix pro search nav to home, add areaId prop and delete area button"
```

---

## Task 6: Push and verify Vercel deployment

- [ ] **Step 1: Push**

```bash
git push origin feat/professional-dashboard
```

- [ ] **Step 2: Wait 60s then check deployment**

```bash
sleep 60 && vercel ls 2>&1 | head -5
```

Expected: newest deployment shows `● Ready`.
