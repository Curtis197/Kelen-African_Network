# Database & RLS Maintenance Protocol

**Last Updated:** April 12, 2026

---

## ⚠️ IMPORTANT: Always Keep These Files in Sync

After **EVERY** database migration, you MUST update:

1. ✅ `supabase/database-scheme.sql` — Full schema reference
2. ✅ `supabase/RLS-list.md` — Current RLS policies
3. ✅ `.qwen/skills/instrument/DATABASE-REFERENCE.md` — Column/type reference

**Source of Truth:** The actual remote database is ALWAYS the source of truth. Files are documentation that must match the DB.

---

## 🔄 How to Update After a Migration

### Step 1: Push the Migration
```bash
npx supabase db push
```

### Step 2: Update `database-scheme.sql`
```bash
# Option A: Pull full schema from remote
npx supabase db pull

# Option B: Manually edit to match migration changes
# (faster for small changes like column nullability)
```

### Step 3: Update `RLS-list.md`
**Option A: Export from Supabase Dashboard**
1. Go to https://rtbfzpgklmbizznhwodg.supabase.co
2. Open SQL Editor
3. Run:
   ```sql
   SELECT tablename, policyname, cmd, roles::text, qual, with_check
   FROM pg_policies
   WHERE schemaname = 'public'
   ORDER BY tablename, policyname;
   ```
4. Export as CSV → Convert to markdown table → Replace RLS-list.md content

**Option B: Manual Update (for small changes)**
- If migration adds/drops RLS policies, edit RLS-list.md manually
- Add/remove rows matching the migration changes

### Step 4: Update `DATABASE-REFERENCE.md`
- If migration adds/alters tables, columns, or types
- Update `.qwen/skills/instrument/DATABASE-REFERENCE.md`
- Verify table names, column names, and constraints match

### Step 5: Verify All Three Match
```
Actual Remote DB = database-scheme.sql = DATABASE-REFERENCE.md = RLS-list.md
```

---

## 📋 Recent Changes Log

| Date | Migration | Files Updated | Notes |
|------|-----------|---------------|-------|
| 2026-04-12 | `20260412000001` Google Business | ✅ database-scheme.sql | Added `pro_google_tokens`, `pro_google_reviews_cache` |
| 2026-04-12 | `20260412000003` Client document access | ✅ RLS-list.md | Added 4 client policies for `project_documents` |
| 2026-04-12 | `20260412000004` Allow all doc types | ✅ (no doc needed) | Storage bucket config change |
| 2026-04-12 | `20260412000005` Nullable professional_id | ✅ database-scheme.sql | `project_documents.professional_id` now nullable |

---

## 🎯 Key Tables to Watch

| Table | RLS Policies Count | Notes |
|-------|-------------------|-------|
| `project_documents` | 7 | Most frequently modified — client + pro + admin access |
| `pro_google_tokens` | 4 | Google Business integration |
| `pro_google_reviews_cache` | 3 | Public read for portfolios |
| `professionals` | 5 | Core pro profile table |
| `user_projects` | TBD | Client project management |

---

## ⚡ Quick Commands Reference

```bash
# Check migration status
npx supabase db remote exec "SELECT version FROM _supabase_migrations ORDER BY version DESC LIMIT 5;"

# List all applied migrations
npx supabase migration list

# Push pending migrations
npx supabase db push

# Pull schema from remote (full export)
npx supabase db pull

# Create new migration
npx supabase migration new <description>
```

---

## 🔍 Troubleshooting

### RLS Violation (42501)
1. Check `RLS-list.md` for the table's policies
2. Verify the operation (INSERT/SELECT/UPDATE/DELETE) has a matching policy
3. Check if user role matches the policy's `USING` clause
4. If policy is missing, create a migration to add it

### Column Not Null Violation (23502)
1. Check `database-scheme.sql` for column constraints
2. If column should be nullable, create migration:
   ```sql
   ALTER TABLE table_name ALTER COLUMN column_name DROP NOT NULL;
   ```
3. Update `database-scheme.sql` to reflect the change

### Table/Column Not Found
1. Check if migration was applied: `npx supabase migration list`
2. If not applied: `npx supabase db push`
3. If applied but files don't match: Update the files

---

**Remember:** These files are living documentation. They evolve with every migration. Never let them drift out of sync with the actual database.
