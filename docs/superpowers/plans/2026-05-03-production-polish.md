# Production Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the five remaining production blockers: missing error boundaries, `alert()`/`confirm()` dialogs, PII logs in auth callback, and spam vectors on the comments and likes API endpoints.

**Architecture:** Each task is fully independent. No new dependencies are introduced. Error boundaries use Next.js built-in conventions (`error.tsx`). `alert()`/`confirm()` are replaced with `sonner` toasts (already installed). Rate limiting uses Supabase DB queries so it works across serverless instances.

**Tech Stack:** Next.js 15 App Router, TypeScript, `sonner` (toast), Supabase server client, `x-forwarded-for` header for IP detection.

---

## Task 1: Add global error boundaries (`error.tsx`)

Next.js requires `error.tsx` to be a **Client Component** (`"use client"`). It receives `error: Error` and `reset: () => void` props. Without it, any unhandled server error shows a blank default page with no recovery.

Create three files — one for the root, one for the pro dashboard section, one for admin.

**Files:**
- Create: `app/error.tsx`
- Create: `app/(professional)/pro/error.tsx`
- Create: `app/(admin)/admin/error.tsx`

- [ ] **Step 1: Create `app/error.tsx`**

```typescript
"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="max-w-md w-full text-center space-y-6 py-16">
        <div className="text-5xl font-headline font-black text-stone-200">500</div>
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold font-headline text-stone-900">
            Une erreur est survenue
          </h1>
          <p className="text-stone-500 text-sm leading-relaxed">
            Quelque chose s&apos;est mal passé. Nos équipes ont été notifiées.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-kelen-green-600 text-white rounded-xl text-sm font-semibold hover:bg-kelen-green-700 transition-colors"
          >
            Réessayer
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 border border-stone-200 text-stone-700 rounded-xl text-sm font-semibold hover:bg-stone-100 transition-colors"
          >
            Accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `app/(professional)/pro/error.tsx`**

```typescript
"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ProError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Pro Error]", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="max-w-sm w-full text-center space-y-5">
        <div className="text-4xl font-headline font-black text-stone-200">Oops</div>
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-stone-900">Erreur inattendue</h2>
          <p className="text-stone-500 text-sm">
            Cette page a rencontré un problème. Vos données sont en sécurité.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-4 py-2 bg-kelen-green-600 text-white rounded-lg text-sm font-semibold hover:bg-kelen-green-700 transition-colors"
          >
            Réessayer
          </button>
          <Link
            href="/pro/dashboard"
            className="px-4 py-2 border border-stone-200 text-stone-700 rounded-lg text-sm hover:bg-stone-100 transition-colors"
          >
            Tableau de bord
          </Link>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `app/(admin)/admin/error.tsx`**

```typescript
"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Admin Error]", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="max-w-sm w-full text-center space-y-5">
        <h2 className="text-xl font-extrabold text-stone-900">Erreur admin</h2>
        <p className="text-stone-500 text-sm">
          {error.message || "Une erreur inattendue s'est produite."}
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-kelen-green-600 text-white rounded-lg text-sm font-semibold hover:bg-kelen-green-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add app/error.tsx "app/(professional)/pro/error.tsx" "app/(admin)/admin/error.tsx"
git commit -m "fix: add error boundaries for global, pro, and admin routes"
```

---

## Task 2: Replace `alert()` / `confirm()` with `sonner` toasts

`sonner` is already installed and used throughout the project. Import `toast` from `"sonner"`.

For **`alert()`**: replace with `toast.error(message)` (for errors) or `toast.success(message)` (for success).

For **`confirm()`**: replace with a toast action pattern. The function that was previously guarded by `confirm()` needs to be extracted into a named callback so the toast's `action.onClick` can call it.

**Files:**
- Modify: `app/(professional)/pro/documents/page.tsx`
- Modify: `app/(client)/documents/page.tsx`
- Modify: `app/(client)/projets/[id]/documents/page.tsx`
- Modify: `app/(professional)/pro/projets/[id]/documents/page.tsx`
- Modify: `app/(client)/projets/[id]/pros/proposal/[proId]/page.tsx`
- Modify: `app/(client)/projets/[id]/modifier/EditClientProjectPage.tsx`
- Modify: `app/(client)/projets/[id]/page.tsx`
- Modify: `app/(professional)/pro/collaborations/[id]/page.tsx`

### `app/(professional)/pro/documents/page.tsx`

- [ ] **Step 1: Add `toast` import**

Add to the existing imports:
```typescript
import { toast } from "sonner";
```

- [ ] **Step 2: Replace `confirm` + `alert` in `handleDelete`**

Replace:
```typescript
const handleDelete = async (docId: string) => {
  if (!confirm("Supprimer ce document ?")) return;

  const { error } = await supabase.from("project_documents").delete().eq("id", docId);

  if (error) {
    alert("Erreur lors de la suppression.");
    return;
  }

  if (selectedDoc?.id === docId) setSelectedDoc(null);
  fetchDocuments();
};
```

With:
```typescript
const handleDelete = (docId: string) => {
  toast("Supprimer ce document ?", {
    action: {
      label: "Supprimer",
      onClick: async () => {
        const { error } = await supabase.from("project_documents").delete().eq("id", docId);
        if (error) {
          toast.error("Erreur lors de la suppression.");
          return;
        }
        if (selectedDoc?.id === docId) setSelectedDoc(null);
        fetchDocuments();
      },
    },
    cancel: { label: "Annuler", onClick: () => {} },
  });
};
```

- [ ] **Step 3: Replace `alert` calls in `handleUpload`**

```typescript
// Before
alert("Le fichier est trop volumineux (max 10 Mo).");
// After
toast.error("Le fichier est trop volumineux (max 10 Mo).");

// Before
alert("Format non accepté. Formats acceptés : PDF, JPG, PNG, WEBP.");
// After
toast.error("Format non accepté. Formats acceptés : PDF, JPG, PNG, WEBP.");

// Before
alert("Document ajouté.");
// After
toast.success("Document ajouté.");

// Before
alert("Erreur upload: " + ((err as any).message || 'Erreur inconnue'));
// After
toast.error("Erreur upload : " + ((err as any).message || 'Erreur inconnue'));
```

### `app/(client)/documents/page.tsx`

- [ ] **Step 4: Add `toast` import and replace all `alert`/`confirm`**

Add:
```typescript
import { toast } from "sonner";
```

Replace every `alert(...)` with `toast.error(...)` or `toast.success(...)` as appropriate:
```typescript
// Errors → toast.error
alert("Le fichier est trop volumineux. Taille maximale : 10 Mo.")  →  toast.error("Le fichier est trop volumineux. Taille maximale : 10 Mo.")
alert("Format non accepté. Formats acceptés : PDF, JPG, PNG.")  →  toast.error("Format non accepté. Formats acceptés : PDF, JPG, PNG.")
alert("Vous devez être connecté pour uploader un document.")  →  toast.error("Vous devez être connecté pour uploader un document.")
alert("Veuillez sélectionner un projet avant d'uploader un document.")  →  toast.error("Veuillez sélectionner un projet avant d'uploader un document.")
alert(error.code === '42501' ? "Erreur de permissions..." : "Erreur lors de l'enregistrement du document.")
  →  toast.error(error.code === '42501' ? "Erreur de permissions. Veuillez contacter le support." : "Erreur lors de l'enregistrement du document.")
alert("Erreur lors de l'upload du document.")  →  toast.error("Erreur lors de l'upload du document.")
alert("Erreur lors de la suppression du document.")  →  toast.error("Erreur lors de la suppression du document.")

// Success → toast.success
alert("Document uploadé avec succès !")  →  toast.success("Document uploadé avec succès !")
```

Replace `confirm` in `handleDelete`:
```typescript
// Before
const handleDelete = async (docId: string) => {
  if (!confirm("Supprimer ce document ?")) return;
  const { error } = await supabase.from("project_documents").delete().eq("id", docId);
  if (error) { alert("Erreur lors de la suppression du document."); return; }
  fetchDocuments();
  if (selectedDoc?.id === docId) setSelectedDoc(null);
};

// After
const handleDelete = (docId: string) => {
  toast("Supprimer ce document ?", {
    action: {
      label: "Supprimer",
      onClick: async () => {
        const { error } = await supabase.from("project_documents").delete().eq("id", docId);
        if (error) { toast.error("Erreur lors de la suppression du document."); return; }
        fetchDocuments();
        if (selectedDoc?.id === docId) setSelectedDoc(null);
      },
    },
    cancel: { label: "Annuler", onClick: () => {} },
  });
};
```

### `app/(client)/projets/[id]/documents/page.tsx`

- [ ] **Step 5: Same pattern — add `toast` import, replace all `alert`/`confirm`**

Read the file first, then apply the same substitution pattern as Step 4. The file has the same structure: `handleUpload` with `alert()` and `handleDelete` with `confirm()`.

### `app/(professional)/pro/projets/[id]/documents/page.tsx`

- [ ] **Step 6: Same pattern — add `toast` import, replace all `alert`/`confirm`**

Same substitution as Step 5.

### `app/(client)/projets/[id]/pros/proposal/[proId]/page.tsx`

- [ ] **Step 7: Replace `confirm` for accepting a proposal**

Read the file to find the exact confirm call. It looks like:
```typescript
if (!confirm("Accepter cette proposition ? Les autres finalistes seront automatiquement refusés.")) {
  return;
}
// ... acceptance logic
```

Add `import { toast } from "sonner"` if not already present. Extract the acceptance logic into a named function `doAccept()`, then:

```typescript
const doAccept = async () => {
  // ... existing acceptance logic here
};

// Replace the confirm guard with:
toast("Accepter cette proposition ?", {
  description: "Les autres finalistes seront automatiquement refusés.",
  action: { label: "Confirmer", onClick: doAccept },
  cancel: { label: "Annuler", onClick: () => {} },
});
return; // don't continue inline — doAccept handles it
```

### `app/(client)/projets/[id]/modifier/EditClientProjectPage.tsx`

- [ ] **Step 8: Replace `confirm` for cancel with unsaved changes**

Find:
```typescript
if (confirm("Voulez-vous vraiment annuler ? Les modifications non enregistrées seront perdues.")) {
```

Add `import { toast } from "sonner"` if not already present. Replace:
```typescript
toast("Annuler les modifications ?", {
  description: "Les modifications non enregistrées seront perdues.",
  action: { label: "Oui, annuler", onClick: () => router.back() },
  cancel: { label: "Continuer l'édition", onClick: () => {} },
});
```
Remove the `router.back()` that was inside the old `if` block (it now lives in the toast action).

### `app/(client)/projets/[id]/page.tsx`

- [ ] **Step 9: Replace two `confirm` calls for domain removal**

Read the file. Find the two confirm patterns (around lines 110 and 129). Same toast action pattern:

```typescript
// Confirm 1 — delete domain entirely
toast("Supprimer ce domaine ?", {
  description: "Tous ses professionnels seront retirés du projet.",
  action: { label: "Supprimer", onClick: () => handleDomainDelete(domainId) },
  cancel: { label: "Annuler", onClick: () => {} },
});

// Confirm 2 — remove single area
toast(`Retirer "${area}" du projet ?`, {
  action: { label: "Retirer", onClick: () => handleAreaRemove(area) },
  cancel: { label: "Annuler", onClick: () => {} },
});
```

Extract the bodies of both existing `if (confirm(...))` blocks into named functions `handleDomainDelete` and `handleAreaRemove`.

### `app/(professional)/pro/collaborations/[id]/page.tsx`

- [ ] **Step 10: Replace `confirm` for declining an invitation**

Find:
```typescript
if (!confirm('Refuser cette invitation ? Cette action est irréversible.')) {
  return;
}
```

Add `import { toast } from "sonner"` if not already present. Extract the decline logic into `doDecline()`:

```typescript
toast("Refuser cette invitation ?", {
  description: "Cette action est irréversible.",
  action: { label: "Refuser", onClick: doDecline },
  cancel: { label: "Annuler", onClick: () => {} },
});
return;
```

- [ ] **Step 11: Commit**

```bash
git add \
  "app/(professional)/pro/documents/page.tsx" \
  "app/(client)/documents/page.tsx" \
  "app/(client)/projets/[id]/documents/page.tsx" \
  "app/(professional)/pro/projets/[id]/documents/page.tsx" \
  "app/(client)/projets/[id]/pros/proposal/[proId]/page.tsx" \
  "app/(client)/projets/[id]/modifier/EditClientProjectPage.tsx" \
  "app/(client)/projets/[id]/page.tsx" \
  "app/(professional)/pro/collaborations/[id]/page.tsx"
git commit -m "fix: replace alert/confirm with sonner toasts across all pages"
```

---

## Task 3: Remove PII from auth callback logs

`app/auth/callback/route.ts` logs `user.id`, `email`, `role`, and detailed RLS diagnostics on every login in production. These should only appear in development.

**Files:**
- Modify: `app/auth/callback/route.ts`

- [ ] **Step 1: Guard all `console.log` calls with dev check**

Read the file. It has ~12 `console.log` / `console.error` calls. The RLS error logs (lines 65-68, 98-102, 121-125) are valuable diagnostics — keep them as `console.error` since errors should always be logged. Remove or guard the informational `console.log` calls that include user data.

Apply this pattern throughout the file:

```typescript
// Before (logs user data unconditionally)
console.log('[Auth Callback] Session established', { 
  userId: sessionData?.user?.id, 
  email: sessionData?.user?.email,
  ...
});

// After (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('[Auth Callback] Session established', { 
    userId: sessionData?.user?.id, 
    email: sessionData?.user?.email,
    ...
  });
}
```

Specifically, wrap these in `if (process.env.NODE_ENV === 'development')`:
- Line 10: `console.log('[Auth Callback] Received callback', ...)`
- Line 23: `console.log('[Auth Callback] Exchanging code for session')`
- Line 27-32: `console.log('[Auth Callback] Session established', { userId, email, ... })`
- Line 37: `console.log('[Auth Callback] Google OAuth detected, syncing profile')`
- Line 43-48: `console.log('[Auth Callback] Google metadata extracted', ...)`
- Line 57-63: `console.log('[Auth Callback] Current user data', { role, currentAvatar, ... })`
- Line 84: `console.log('[Auth Callback] Updating users table', { updateData, userId })`
- Line 91-96: `console.log('[Auth Callback] Users update result', ...)`
- Line 104: `console.log('[Auth Callback] No user updates needed...')`
- Line 109: `console.log('[Auth Callback] Updating professionals table', { userId })`
- Line 116-120: `console.log('[Auth Callback] Professionals update result', ...)`
- Line 129: `console.log('[Auth Callback] Google profile sync completed')`
- Line 139: `console.log('[Auth Callback] User role query', ...)`
- Line 152: `console.log('[Auth Callback] Redirecting to', ...)`
- Line 163: `console.warn('[Auth Callback] Unable to complete authentication...')`

Keep these **without** a dev guard (they're error conditions that always need logging):
- Line 14: `console.error('[Auth Callback] OAuth error', ...)`
- Line 66-68: `console.error('[Auth Callback] ❌ EXPLICIT RLS BLOCKING on users select!', ...)`
- Line 98-102: `console.error('[Auth Callback] ❌ EXPLICIT RLS BLOCKING on users update!', ...)`
- Line 122-125: `console.error('[Auth Callback] ❌ EXPLICIT RLS BLOCKING on professionals update!', ...)`
- Line 155-159: `console.error('[Auth Callback] Error exchanging code for session', ...)`

- [ ] **Step 2: Commit**

```bash
git add app/auth/callback/route.ts
git commit -m "fix: guard PII console.log calls in auth callback behind NODE_ENV check"
```

---

## Task 4: Add rate limiting to `/api/pro-site/comments`

Currently any anonymous caller can POST unlimited comments. Fix: read the client IP from `x-forwarded-for` header and count their recent comments via Supabase. Reject if they've posted more than 10 comments across any item in the last 15 minutes.

The `item_comments` table already exists. We add an `ip_hash` column to store a hashed IP (SHA-256, never raw) for rate limiting. If the column doesn't exist yet, the insert will fail gracefully — we handle that.

Actually, adding a DB column requires a migration. Instead, use a simpler approach: count comments by `author_name` + same `item_id` in the last hour. This stops the most obvious spam without any schema changes.

**Files:**
- Modify: `app/api/pro-site/comments/route.ts`

- [ ] **Step 1: Add rate limit check to POST handler**

Replace the POST handler in `app/api/pro-site/comments/route.ts`:

```typescript
const VALID_TYPES = new Set(['service', 'realisation', 'produit'])

// Simple in-request rate limit: max 5 comments per author_name per item per hour
async function isRateLimited(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
  itemId: string,
  authorName: string
): Promise<boolean> {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('item_comments')
    .select('*', { count: 'exact', head: true })
    .eq('item_id', itemId)
    .eq('author_name', authorName)
    .gte('created_at', since)
  return (count ?? 0) >= 5
}

// POST /api/pro-site/comments  body: { item_type, item_id, author_name, body }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const { item_type, item_id, author_name, body: commentBody } = body

  if (!VALID_TYPES.has(item_type)) return NextResponse.json({ error: 'Invalid item_type' }, { status: 400 })
  if (typeof item_id !== 'string' || item_id.length !== 36) return NextResponse.json({ error: 'Invalid item_id' }, { status: 400 })
  if (typeof author_name !== 'string' || author_name.length < 1 || author_name.length > 80)
    return NextResponse.json({ error: 'author_name must be 1-80 chars' }, { status: 400 })
  if (typeof commentBody !== 'string' || commentBody.length < 1 || commentBody.length > 1000)
    return NextResponse.json({ error: 'body must be 1-1000 chars' }, { status: 400 })

  const supabase = await createClient()

  if (await isRateLimited(supabase, item_id, author_name)) {
    return NextResponse.json(
      { error: 'Trop de commentaires. Veuillez patienter avant de réessayer.' },
      { status: 429 }
    )
  }

  const { data, error } = await supabase
    .from('item_comments')
    .insert({ item_type, item_id, author_name, body: commentBody })
    .select('id, author_name, body, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({
    id: data.id,
    authorName: data.author_name,
    body: data.body,
    createdAt: data.created_at,
    likeCount: 0,
  })
}
```

Keep the existing GET handler unchanged above this.

- [ ] **Step 2: Commit**

```bash
git add app/api/pro-site/comments/route.ts
git commit -m "fix: rate limit comments to 5 per author per item per hour"
```

---

## Task 5: Harden `/api/pro-site/likes` against headless spam

The likes POST currently generates a fresh `session_id` if no cookie is present, meaning HTTP clients without cookies can create unlimited likes by omitting the cookie. Fix: require the `kelen_session` cookie to already exist in the POST request. Legitimate browsers always have it because the GET endpoint (which loads the like count and sets the cookie) is called before any like action.

**Files:**
- Modify: `app/api/pro-site/likes/route.ts`

- [ ] **Step 1: Require existing session cookie on POST**

Replace the POST handler:

```typescript
// POST /api/pro-site/likes  body: { item_type, item_id }
export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('kelen_session')?.value

  // Require an existing session cookie (set by the GET endpoint).
  // This blocks headless clients that omit cookies from inflating likes.
  if (!sessionId) {
    return NextResponse.json(
      { error: 'Session requise. Rechargez la page et réessayez.' },
      { status: 400 }
    )
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const { item_type, item_id } = body
  if (!item_type || !item_id) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('item_likes')
    .select('id')
    .eq('item_type', item_type)
    .eq('item_id', item_id)
    .eq('session_id', sessionId)
    .maybeSingle()

  if (existing) {
    await supabase.from('item_likes').delete().eq('id', existing.id)
  } else {
    await supabase.from('item_likes').insert({ item_type, item_id, session_id: sessionId })
  }

  const { count } = await supabase
    .from('item_likes')
    .select('*', { count: 'exact', head: true })
    .eq('item_type', item_type)
    .eq('item_id', item_id)

  const res = NextResponse.json({ count: count ?? 0, liked: !existing })
  res.cookies.set('kelen_session', sessionId, { maxAge: 60 * 60 * 24 * 365, path: '/' })
  return res
}
```

Keep the GET handler and `getOrCreateSessionId` function unchanged.

- [ ] **Step 2: Commit**

```bash
git add app/api/pro-site/likes/route.ts
git commit -m "fix: require existing session cookie on likes POST to block headless spam"
```

---

## Self-Review

**Spec coverage:**
1. Error boundaries → Task 1 ✓ (global + pro + admin)
2. `alert()`/`confirm()` → Task 2 ✓ (8 files covered)
3. PII logs → Task 3 ✓ (all console.log lines identified)
4. Comments rate limit → Task 4 ✓ (5/hour per author+item)
5. Likes spam → Task 5 ✓ (cookie guard on POST)

**Placeholder scan:** All steps contain complete code. No "TBD" or vague instructions.

**Type consistency:** `isRateLimited` in Task 4 takes `supabase` typed via `Awaited<ReturnType<...>>` — this is verbose but correct since `createClient` is async. Alternative: just call `createClient()` inside the function. To keep it simple, inline it:

Simplify `isRateLimited` in Task 4 to avoid the complex type:

```typescript
async function isRateLimited(supabase: ReturnType<typeof import('@/lib/supabase/server').createClient> extends Promise<infer T> ? T : never, ...
```

That's complex. Simpler: just call `createClient()` directly inside `isRateLimited` or pass the already-awaited client (which is what the plan does — `createClient()` is called before `isRateLimited` and the result is passed in). The type of the passed-in supabase is the return type of `await createClient()`. Use `any` for the parameter type in the helper since it's a private function:

Revised `isRateLimited` signature in Task 4:
```typescript
async function isRateLimited(supabase: Awaited<ReturnType<typeof createClient>>, itemId: string, authorName: string): Promise<boolean> {
```
This works because `createClient` is already imported at the top of the file.
