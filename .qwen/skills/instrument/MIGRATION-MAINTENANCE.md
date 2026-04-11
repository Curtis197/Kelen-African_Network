# 🔄 Database Migration Maintenance Protocol

> **Every time we run a migration, we MUST update the documentation!**

## ⚠️ The Problem

When we modify the database with migrations:
1. Schema changes (new tables, columns, constraints)
2. **Documentation becomes outdated**
3. `DATABASE-REFERENCE.md` has wrong info
4. `database-scheme.sql` doesn't match reality
5. We write code with wrong table/column names
6. Bugs and confusion follow

## ✅ The Solution

**Every migration MUST be followed by documentation updates!**

**Remember:** 
- ✅ **Actual Database** = Source of truth
- 📄 `database-scheme.sql` = Documentation (must match DB)
- 📄 `DATABASE-REFERENCE.md` = Documentation (must match DB)
- 📄 `RLS-list.md` = Documentation (must match DB)

**Documentation exists to serve the code, not the other way around.**

## 📋 Migration Checklist

### Before Running Migration
- [ ] Review the migration SQL
- [ ] Note all changes (tables, columns, types, constraints)

### After Running Migration (IMMEDIATELY!)

**If migration modifies RLS policies:**
- [ ] **Export updated RLS policies** to `supabase/RLS-list.md`
  ```sql
  -- Run in Supabase SQL Editor, export as markdown table
  SELECT 
    tablename AS "Table",
    policyname AS "Policy Name",
    cmd AS "Command",
    roles AS "Roles",
    qual AS "USING",
    with_check AS "WITH CHECK"
  FROM pg_policies
  WHERE schemaname = 'public'
  ORDER BY tablename, policyname;
  ```
- [ ] Save export to `supabase/RLS-list.md` (overwrite)
- [ ] Review `supabase/RLS-audit-findings.md` for new issues

- [ ] **Update `supabase/database-scheme.sql`**
  - Add new tables
  - Add/modify columns
  - Update constraints
  - Update RLS policy comments
  - Keep file in sync with actual database

- [ ] **Update `.qwen/skills/instrument/DATABASE-REFERENCE.md`**
  - Add new table sections
  - Update column descriptions
  - Add new status values
  - Update relationships diagram
  - Update confusion points if needed
  - Update RLS Policy Notes section
  - Add new common queries

**If migration does NOT touch RLS:**
- Skip RLS export step

### Verification
- [ ] Compare `database-scheme.sql` with actual database
- [ ] Compare `DATABASE-REFERENCE.md` with `database-scheme.sql`
- [ ] All three match: Actual DB = Scheme File = Reference File

## 🎯 What to Update

### When Adding a Table

**1. Update `database-scheme.sql`:**
```sql
CREATE TABLE public.new_table (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  -- ... columns
  CONSTRAINT new_table_pkey PRIMARY KEY (id)
);
```

**2. Update `DATABASE-REFERENCE.md`:**
- Add to appropriate category in Table Categories
- Add complete table reference with all columns
- Add to Table Relationships diagram
- Add common queries
- Update Quick Tips if needed

### When Adding/Modifying Columns

**1. Update `database-scheme.sql`:**
```sql
ALTER TABLE public.existing_table 
ADD COLUMN new_column text;
```

**2. Update `DATABASE-REFERENCE.md`:**
- Update column table
- Add description
- Note if it changes relationships or constraints

### When Adding Status Values/Enums

**1. Update `database-scheme.sql`:**
```sql
ALTER TABLE public.table 
ADD CONSTRAINT check_status 
CHECK (status = ANY (ARRAY['new_status'::text]));
```

**2. Update `DATABASE-REFERENCE.md`:**
- Update Status Values section
- Note in table description
- Update any affected queries

### When Modifying RLS Policies

**1. Update `database-scheme.sql`:**
- Add/modify policy comment

**2. Update `DATABASE-REFERENCE.md`:**
- Update RLS Policy Notes section
- Note policy changes

## 📝 Example Migration Update

### Migration: Add Tags to Projects

```sql
-- Migration file
CREATE TABLE public.project_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  tag text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT project_tags_pkey PRIMARY KEY (id),
  CONSTRAINT project_tags_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.user_projects(id)
);
```

**Update `database-scheme.sql`:**
```sql
-- Add at end, before verification_queue
CREATE TABLE public.project_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  tag text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT project_tags_pkey PRIMARY KEY (id),
  CONSTRAINT project_tags_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.user_projects(id)
);
```

**Update `DATABASE-REFERENCE.md`:**

1. Add to category:
```markdown
### 4. **USER PROJECT MANAGEMENT** (Client Projects) (7 tables)
- `user_projects` - Client's project (the main project)
- `project_areas` - Geographic/functional areas of project
- `project_steps` - Project phases/milestones
- `project_professionals` - Professionals assigned to project
- `project_step_professionals` - Professionals linked to specific steps
- `project_payments` - Payments for project
- `project_tags` - Tags/labels for projects ← NEW!
```

2. Add table reference:
```markdown
### `project_tags` - Project Tags
**Purpose:** Tags/labels for organizing projects

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `project_id` | uuid | FK → user_projects.id |
| `tag` | text | Tag name |
| `created_at` | timestamp | When tag added |

**Common Queries:**
```typescript
// Get tags for a project
const { data } = await supabase
  .from('project_tags')
  .select('*')
  .eq('project_id', projectId)
```
```

3. Update relationships:
```
user_projects
 ├─ project_areas (project_id)
 ├─ project_steps (project_id)
 ├─ project_professionals (project_id)
 ├─ project_logs (project_id)
 ├─ project_payments (project_id)
 └─ project_tags (project_id) ← NEW!
```

## ⚠️ Common Mistakes to Avoid

### ❌ WRONG: Run Migration, Forget Documentation
```
Run migration → Database changed → Docs outdated → Next code uses wrong names
```

### ✅ RIGHT: Run Migration, Update Docs Immediately
```
Run migration → Update database-scheme.sql → Update DATABASE-REFERENCE.md → Verify all match
```

## 🔧 Automation Helpers

### Script to Compare Schema with Reference
```bash
# Check if table exists in both files
grep -i "CREATE TABLE" supabase/database-scheme.sql | wc -l
grep -i "Table Categories" .qwen/skills/instrument/DATABASE-REFERENCE.md | wc -l
```

### Quick Find Missing Tables
1. Open `database-scheme.sql`
2. Open `DATABASE-REFERENCE.md`
3. Check each CREATE TABLE has a section in reference
4. Check each reference section has a CREATE TABLE

## 💡 Why This Matters

### Without Updates:
```
Day 1: Migration adds 'tags' column
Day 5: Developer reads outdated reference
Day 5: Writes code with wrong column names
Day 5: Bugs, debugging wastes tokens
```

### With Updates:
```
Day 1: Migration adds 'tags' column
Day 1: Reference updated immediately
Day 5: Developer reads current reference
Day 5: Writes correct code, no bugs
```

**Saves: Time, tokens, frustration!**

## 🚀 Commitment

**From now on, every migration includes:**

1. ✅ Run migration on database
2. ✅ Update `supabase/database-scheme.sql`
3. ✅ Update `.qwen/skills/instrument/DATABASE-REFERENCE.md`
4. ✅ Verify all three match
5. ✅ Commit all three files together

**Never run a migration without updating documentation!**

---

**This keeps our reference always accurate and reliable!** 📝
