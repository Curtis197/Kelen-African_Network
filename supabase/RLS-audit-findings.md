# 🔍 RLS Audit Findings

> Based on `supabase/RLS-list.md` export
> Date: April 10, 2026

## ✅ All Issues Resolved

All three issues identified in the original audit have been fixed in migration `20260410000007_fix_rls_issues.sql`.

### ~~1. `pro_project_images` - RLS DISABLED~~ → ✅ FIXED

**Fixed in migration:** `20260410000007`

Three policies added:
- `pro_images_public_read` — SELECT for visible pros with public projects
- `pro_images_pro_own` — ALL for owning professionals
- `pro_images_admin` — ALL for admins

### ~~2. `notifications_system_insert` - WITH CHECK = null~~ → ✅ FALSE ALARM

**Investigation result:** The policy actually has `WITH CHECK (true)` (see migration `20260408000003_notifications.sql`). The RLS list export only shows the `USING` column, which is always null for INSERT policies (they use `WITH CHECK` instead). This was a display artifact, not a real issue.

### ~~3. `project_log_comments` - INSERT has no WITH CHECK~~ → ✅ FIXED

**Fixed in migration:** `20260410000007`

Dropped the old policy and recreated with explicit `WITH CHECK` clause that validates the pro owns the project.

---

## 📊 Summary

| Issue Type | Count | Tables Affected | Status |
|------------|-------|-----------------|--------|
| **RLS Disabled** | 1 | `pro_project_images` | ✅ Fixed |
| **WITH CHECK = null (INSERT)** | 1 | `project_log_comments` | ✅ Fixed |
| **False Alarm (USING column display)** | 1 | `notifications` | ✅ Confirmed OK |

---

## 🔍 Additional INSERT Policies Reviewed

All 8 INSERT policies showing `USING = null` in the RLS list were verified against their source migrations. All have proper `WITH CHECK` clauses:

| Policy | WITH CHECK | Verified |
|--------|-----------|----------|
| `notifications_system_insert` | `(true)` | ✅ |
| `comments_pro_create_own_projects` | `(log_id IN (...))` | ✅ Fixed |
| `views_public_insert` | `(true)` | ✅ Intentional |
| `logs_pro_create_on_projects` | `(pro_project_id IN (...) OR project_id IN (...))` | ✅ |
| `realization_comments_create` | `(user_id = auth.uid())` | ✅ |
| `recommendations_insert` | `(submitter_id = auth.uid())` | ✅ |
| `reviews_insert` | `(reviewer_id = auth.uid())` | ✅ |
| `signals_insert` | `(submitter_id = auth.uid())` | ✅ |

**Note:** INSERT policies use `WITH CHECK`, not `USING`. The RLS list export shows the `USING` column which is always null for INSERT — this is expected behavior, not a bug.
