# Portfolio Page Fixes — DB Error & onClick Handler

**Date:** April 12, 2026  
**Issues:** 
1. `[DB] ❌ Database error: {}` — Empty error object
2. `Event handlers cannot be passed to Client Component props` — onClick in server component

---

## 🐛 Issue 1: Empty Database Error

### Problem
```
[DB] ❌ Database error: {}
at getPortfolio (lib\actions\portfolio.ts:107:15)
```

**Root Cause:** The error object from Supabase wasn't being properly serialized when logged. The actual error was likely:
- `PGRST116` — No portfolio found (normal, not an error)
- `42501` — RLS violation (professional not visible)

### Fix Applied

**File:** `lib/actions/portfolio.ts` (line 96-115)

**Before:**
```typescript
console.error('[DB] ❌ Database error:', portfolioError);  // Empty object {}
```

**After:**
```typescript
if (portfolioError.code === 'PGRST116') {
  console.log('[DB] No portfolio found for professional (PGRST116) — user needs to create one');
} else if (portfolioError.code === '42501') {
  console.error('[RLS] ❌ RLS POLICY VIOLATION - professional_portfolio table');
  console.error('[RLS] Hint: Check if professionals.is_visible = TRUE for this user');
} else {
  console.error('[DB] ❌ Database error:', {
    code: portfolioError.code,
    message: portfolioError.message,
    details: portfolioError.details,
    hint: portfolioError.hint,
  });
}
```

**Benefits:**
- ✅ Distinguishes between "not found" and actual errors
- ✅ Properly serializes error details (no more `{}`)
- ✅ RLS violations explicitly logged with fix hints

---

## 🐛 Issue 2: onClick in Server Component

### Problem
```
Uncaught Error: Event handlers cannot be passed to Client Component props.
  <button type="submit" className=... onClick={function onClick} children=...>
```

**Root Cause:** The `RealizationCard` component is a server component (async function), but it had a `<button>` with an `onClick` handler. React Server Components cannot pass event handlers to elements — those must be in Client Components.

### Fix Applied

**Files Changed:**
1. ✅ `app/(professional)/pro/portfolio/page.tsx` — Removed inline onClick
2. ✅ `components/pro/DeleteButton.tsx` — **NEW** Client Component for delete button

**Before (WRONG):**
```typescript
// In server component (async function)
<form action={async () => { "use server"; ... }}>
  <button
    type="submit"
    onClick={(e) => {  // ❌ Can't use onClick in server component!
      if (!confirm("Supprimer...")) {
        e.preventDefault();
      }
    }}
  >
    Supprimer
  </button>
</form>
```

**After (CORRECT):**
```typescript
// In server component
<DeleteButton realizationId={realization.id} />

// In Client Component (components/pro/DeleteButton.tsx)
"use client";

export function DeleteButton({ realizationId }: { realizationId: string }) {
  async function handleDelete() {
    if (!confirm("Supprimer cette réalisation ? Elle sera retirée de votre profil public.")) {
      return;
    }
    await deleteRealization(realizationId);
  }

  return (
    <button onClick={handleDelete} className="...">
      Supprimer
    </button>
  );
}
```

**Benefits:**
- ✅ Follows React Server Component patterns
- ✅ Confirmation dialog works correctly
- ✅ Clean separation of concerns

---

## 📋 Files Changed

| File | Change | Status |
|------|--------|--------|
| `lib/actions/portfolio.ts` | Improved error handling | ✅ Fixed |
| `app/(professional)/pro/portfolio/page.tsx` | Removed onClick from server component | ✅ Fixed |
| `components/pro/DeleteButton.tsx` | **NEW** Client Component for delete | ✅ Created |

---

## 🧪 Testing

### Test 1: Portfolio Page Load
**Before:** ❌ Empty error object in console  
**After:** ✅ Clear diagnostic message:
- "No portfolio found for professional (PGRST116) — user needs to create one"
- OR actual error details if something is broken

### Test 2: Delete Realization
**Before:** ❌ Error about onClick in server component  
**After:** ✅ Delete button works with confirmation dialog

---

## 🔍 Understanding the Real Issue

The empty error object `{}` was likely caused by one of these:

1. **PGRST116** — No portfolio exists yet (most likely)
   - This is **normal** — user just hasn't created a portfolio
   - Now logged as info, not error

2. **42501 (RLS Violation)** — Professional not visible
   - RLS policy requires `professionals.is_visible = TRUE`
   - If false, query is blocked silently
   - Now logged with explicit RLS violation message

3. **Serialization Issue** — Supabase error object not crossing server/client boundary properly
   - Fixed by extracting specific fields (code, message, details, hint)

---

## 🎯 Next Steps

If you still see database errors after this fix, check the console for the new detailed error message:

```
[DB] ❌ Database error: {
  code: "42501",
  message: "new row violates row-level security policy...",
  details: "...",
  hint: "..."
}
```

This will tell you exactly what's wrong and how to fix it.

---

**Status:** ✅ **RESOLVED** — Both errors fixed with proper error handling and React patterns
