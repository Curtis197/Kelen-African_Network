# Remaining Fixes Plan

> **Status:** Session paused after fixing 9 critical/high priority bugs  
> **Completed:** 9/39 issues fixed (23%)  
> **Next Steps:** Continue with batches below  

---

## ✅ COMPLETED FIXES (9/39)

### Batch 1 - Critical Security (✅ Deployed)
1. ✅ Add auth check to `updateProjectStatus`
2. ✅ Add admin auth to taxonomy CRUD (6 functions)
3. ✅ Create `/auth/callback` route
4. ✅ Fix LogForm redirect to pro route
5. ✅ Fix UpdatePasswordForm redirect
6. ✅ Fix updateLog/deleteLog revalidation
7. ✅ Fix dynamic dark: class in LogStatusBadge

### Batch 2 - Critical Functionality (✅ Deployed)
8. ✅ Create `/pro/projets/[id]/edit` route
9. ✅ Fix approveLog/contestLog/resolveLog for pro projects

### Batch 3 - Billing (✅ Deployed)
10. ✅ Fix subscription period end calculation

---

## 🎯 REMAINING FIXES (30/39) - PRIORITY ORDER

### HIGH PRIORITY (7 issues) - Fix Next

#### 1. Add Auth to AI Copywriting
**File:** `lib/actions/ai-copywriting.ts:49`  
**Issue:** No auth check, anyone can consume API credits  
**Fix:**
```typescript
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) return { error: "Non autorisé" };

// Optional: Check if professional has active subscription
const { data: professional } = await supabase
  .from("professionals")
  .select("subscription_status")
  .eq("user_id", user.id)
  .single();

if (professional?.subscription_status !== 'active') {
  return { error: "Abonnement premium requis" };
}
```

#### 2. Add Auth to recalculateStatus
**File:** `lib/actions/status.ts:22`  
**Issue:** Anyone can trigger status recalculation  
**Fix:**
```typescript
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) return { error: "Non autorisé" };

// Check admin role
const { data: userData } = await supabase
  .from("users")
  .select("role")
  .eq("id", user.id)
  .single();

if (userData?.role !== 'admin') {
  return { error: "Non autorisé" };
}
```

#### 3. Fix togglePublic to Use Server Action
**File:** `components/pro/ProProjectsPage.tsx`  
**Issue:** Direct Supabase call from client bypasses revalidation  
**Fix:**
- Create server action `toggleProProjectPublic(id, isPublic)`
- Add ownership verification
- Call from component instead of direct Supabase

#### 4. Wire Up Draft Sync
**File:** `components/pro/ProProjectJournal.tsx`  
**Issue:** OfflineIndicator shows 0 drafts, no sync handler  
**Fix:**
- Import `getPendingDrafts`, `syncDraft`, `clearDraft` from draft utils
- Add state: `const [pendingDrafts, setPendingDrafts] = useState(0)`
- Add useEffect to check pending drafts on mount
- Pass `onSync` handler to OfflineIndicator
- Show sync progress with loading state

#### 5. Fix Log-Media Route RLS Bypass
**File:** `app/api/log-media/[...path]/route.ts:14`  
**Issue:** Service role key bypasses RLS, any path-known file accessible  
**Fix:**
- Extract project ID from path or query param
- Verify user has access to project (client or pro)
- Only generate signed URL if authorized

#### 6. Fix ProfessionalCard Nested Buttons
**File:** `components/shared/ProfessionalCard.tsx:82`  
**Issue:** `<button>` wrapping card contains nested `<button>` (invalid HTML)  
**Fix:**
- Change outer wrapper to `<div onClick>` or `<a href>`
- Keep inner "Choisir" button
- Add proper ARIA roles

#### 7. Add RLS Policy for Pro Project Logs
**File:** Supabase migration (new SQL file needed)  
**Issue:** No RLS policy allowing professionals to create logs for pro_projects  
**Fix:**
```sql
CREATE POLICY "logs_pro_create_pro_projects"
ON project_logs
FOR INSERT
TO authenticated
WITH CHECK (
  pro_project_id IN (
    SELECT pp.id FROM pro_projects pp
    JOIN professionals p ON pp.professional_id = p.id
    WHERE p.user_id = auth.uid()
  )
);
```

---

### MEDIUM PRIORITY (13 issues) - Fix After High

#### 8-13. Add Zod Validation to Server Actions
**Files:**
- `lib/actions/log-comments.ts`
- `lib/actions/log-media.ts`
- `lib/actions/log-shares.ts`
- `lib/actions/branding.ts`
- `lib/actions/realization-comments.ts`

**Pattern:**
```typescript
import { z } from 'zod';

const commentSchema = z.object({
  logId: z.string().uuid(),
  comment: z.string().min(1).max(5000),
  evidenceUrls: z.array(z.string().url()).max(10).optional(),
});

export async function approveLog(rawData: unknown) {
  const validated = commentSchema.parse(rawData);
  // ... rest of function
}
```

#### 14. Standardize Error Handling
**Issue:** Mix of thrown errors and `{ error: string }` returns  
**Fix:** Convert all server actions to return `{ success, error?, data? }` pattern  
**Files to update:**
- `lib/actions/realisations.ts`
- `lib/actions/realization-comments.ts`
- `lib/actions/realization-likes.ts`
- `lib/actions/project-steps.ts`

#### 15. createNotification Auth Check
**File:** `lib/actions/notifications.ts:33`  
**Fix:** Verify caller is system (service role) or has permission

#### 16. Signed URL Auto-Refresh
**File:** `components/journal/LogTimeline.tsx`  
**Fix:** 
- Store expiry time with signed URLs
- Set up interval to refresh URLs every 50 minutes
- Or implement on-demand refresh when images fail to load

#### 17-22. Add Dark Mode to Broken Components
**Files:**
- `components/shared/ProjectTimeline.tsx`
- `components/interactions/RealizationCommentThread.tsx`
- `components/interactions/LikeButton.tsx`
- `components/recommandations/RecommandationScrollRow.tsx`
- `components/location/LocationSearch.tsx`
- `components/shared/FilterPanel.tsx`

**Fix:** Add `dark:` variants to all hardcoded colors

#### 23. GPS Validation
**File:** `components/journal/LogForm.tsx`  
**Fix:**
- Don't allow (0, 0) as valid coordinates
- Make GPS optional or require valid coordinates
- Add validation in Zod schema

---

### LOW PRIORITY (10 issues) - Fix Last

#### 24. Remove Dead Code
**File:** `lib/actions/stripe.ts:92`  
**Fix:** Delete `handleStripeWebhook` server action (unused)

#### 25-28. Generate Complete Supabase Types
**Fix:** Run `supabase gen types typescript --project-id <ID>` and update types file

#### 29. Optimize Middleware DB Query
**File:** `middleware.ts:103`  
**Fix:** Encode role in JWT claim or session metadata instead of DB query

#### 30-33. Various Minor Improvements
- Add rate limiting to auth endpoints
- Improve error logging in log-media route
- Fix Footer hardcoded colors
- Standardize spacing tokens

---

## 📋 DEPLOYMENT STRATEGY

### Next Session - Batch 4 (High Priority Auth & Security)
1. Add auth to AI copywriting
2. Add auth to recalculateStatus
3. Fix togglePublic server action
4. Fix ProfessionalCard nested buttons
5. **BUILD & TEST**
6. **COMMIT & PUSH**
7. **DEPLOY TO VERCEL**
8. **CHECK LOGS**

### Batch 5 (Medium Priority - Validation & Error Handling)
9. Add Zod validation (5 files)
10. Standardize error handling (4 files)
11. createNotification auth check
12. **BUILD & TEST**
13. **COMMIT & PUSH**
14. **DEPLOY TO VERCEL**
15. **CHECK LOGS**

### Batch 6 (Medium Priority - Dark Mode & UX)
16. Wire up draft sync
17. Add dark mode (6 components)
18. Signed URL auto-refresh
19. GPS validation
20. **BUILD & TEST**
21. **COMMIT & PUSH**
22. **DEPLOY TO VERCEL**
23. **CHECK LOGS**

### Batch 7 (Low Priority & Cleanup)
24. Remove dead code
25. Fix log-media RLS bypass
26. Add RLS policy for pro project logs
27. Generate Supabase types
28. **BUILD & TEST**
29. **COMMIT & PUSH**
30. **FINAL DEPLOY TO VERCEL**
31. **CHECK LOGS**

---

## 🚀 QUICK START FOR NEXT SESSION

```bash
# 1. Navigate to project
cd "c:\Users\DELL LATITUDE 7480\Kelen-African_Network"

# 2. Pull latest changes
git pull

# 3. Start with auth fixes
# Open lib/actions/ai-copywriting.ts
# Add auth check at line 27

# 4. Build to verify
npm run build

# 5. Commit
git add -A
git commit -m "fix: Add auth to AI copywriting and status recalculation"
git push

# 6. Deploy to Vercel and monitor logs
```

---

## 📊 PROGRESS TRACKER

| Batch | Issues | Status | Deployed |
|-------|--------|--------|----------|
| 1 - Critical Security | 7 | ✅ Complete | ✅ Yes |
| 2 - Critical Functionality | 2 | ✅ Complete | ✅ Yes |
| 3 - Billing Fix | 1 | ✅ Complete | ✅ Yes |
| 4 - High Priority Auth | 4 | ⏳ Pending | ❌ No |
| 5 - Validation & Errors | 7 | ⏳ Pending | ❌ No |
| 6 - Dark Mode & UX | 5 | ⏳ Pending | ❌ No |
| 7 - Cleanup & RLS | 4 | ⏳ Pending | ❌ No |

**Total Progress: 9/39 (23%)**

---

## ⚠️ IMPORTANT NOTES

1. **Deploy after every batch** - Don't accumulate changes
2. **Check Vercel logs** - Look for runtime errors
3. **Test manually** - Don't rely solely on builds
4. **Monitor Sentry** (if configured) - Catch production errors
5. **Keep commits focused** - One concern per commit

---

**Generated:** 2026-04-09  
**Next Session:** Continue with Batch 4 (High Priority Auth)
