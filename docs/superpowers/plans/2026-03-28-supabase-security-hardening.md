# Supabase Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all Supabase security and quality issues identified in the audit, from most critical to least critical.

**Architecture:** Each fix is self-contained — no shared state between tasks. Tasks 1–2 are the most impactful (security). Tasks 3–5 are quality/reliability improvements. No new dependencies are needed.

**Tech Stack:** Next.js 15 App Router, Supabase SSR (`@supabase/ssr`), Zod, React Hook Form, TypeScript

---

## File Map

| File | Change |
|---|---|
| `lib/supabase/storage.ts` | Add auth check, MIME whitelist, size limit, UUID naming, per-file batch results |
| `lib/actions/reviews.ts` | **NEW** — server action replacing client-side review insert |
| `components/forms/ReviewForm.tsx` | Call server action instead of direct Supabase insert |
| `lib/supabase/client.ts` | Throw clear error in dev/test when env vars are missing |
| `lib/supabase/server.ts` | Same env guard |
| `components/forms/LoginForm.tsx` | Read role from `user_metadata` — eliminate extra DB query |
| `app/auth/callback/route.ts` | Read role from `user_metadata` — eliminate extra DB query |

---

## Task 1: Harden `lib/supabase/storage.ts`

**Files:**
- Modify: `lib/supabase/storage.ts`

This is the most critical fix. The file currently has no auth check, no file type validation, no size limit, and uses `Math.random()` for filenames.

- [ ] **Step 1: Replace the entire file**

```typescript
// lib/supabase/storage.ts
import { createClient } from "./client";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  contracts: ["application/pdf"],
  "evidence-photos": ["image/jpeg", "image/png", "image/webp"],
  portfolios: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  "verification-docs": ["application/pdf", "image/jpeg", "image/png"],
};

function validateFile(file: File, bucket: string): string | null {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `${file.name} dépasse la taille maximale de 10 Mo.`;
  }
  const allowed = ALLOWED_MIME_TYPES[bucket];
  if (allowed && !allowed.includes(file.type)) {
    return `${file.name} : type de fichier non autorisé (${file.type}).`;
  }
  return null;
}

export async function uploadFile(
  file: File,
  bucket: string,
  path: string
): Promise<string> {
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Vous devez être connecté pour envoyer des fichiers.");
  }

  const validationError = validateFile(file, bucket);
  if (validationError) {
    throw new Error(validationError);
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `${path}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file);

  if (uploadError) {
    throw uploadError;
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return publicUrl;
}

export type UploadResult = { file: string; url: string | null; error: string | null };

export async function uploadMultipleFiles(
  files: FileList | File[],
  bucket: string,
  path: string
): Promise<UploadResult[]> {
  const results = await Promise.allSettled(
    Array.from(files).map((file) => uploadFile(file, bucket, path))
  );

  return Array.from(files).map((file, i) => {
    const result = results[i];
    if (result.status === "fulfilled") {
      return { file: file.name, url: result.value, error: null };
    }
    return { file: file.name, url: null, error: (result.reason as Error).message };
  });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "c:/Users/DELL LATITUDE 7480/Kelen-African_Network" && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors in `lib/supabase/storage.ts`

- [ ] **Step 3: Commit**

```bash
git add lib/supabase/storage.ts
git commit -m "fix(storage): add auth check, MIME whitelist, size limit, UUID naming, per-file batch results"
```

---

## Task 2: Move Review Insert to a Server Action

**Files:**
- Create: `lib/actions/reviews.ts`
- Modify: `components/forms/ReviewForm.tsx`

Currently `ReviewForm` inserts directly from the browser using the anon client. Moving to a Server Action enforces server-side auth and validation.

- [ ] **Step 1: Create `lib/actions/reviews.ts`**

```typescript
// lib/actions/reviews.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const insertReviewSchema = z.object({
  professional_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export type ReviewActionResult =
  | { success: true }
  | { success: false; error: string };

export async function submitReview(
  payload: z.infer<typeof insertReviewSchema>
): Promise<ReviewActionResult> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Vous devez être connecté pour laisser un avis." };
  }

  const parsed = insertReviewSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: "Données invalides." };
  }

  const { professional_id, rating, comment } = parsed.data;

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("first_name, last_name, country")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { success: false, error: "Impossible de récupérer votre profil." };
  }

  const { error: insertError } = await supabase.from("reviews").insert({
    professional_id,
    reviewer_id: user.id,
    reviewer_name: `${profile.first_name} ${profile.last_name}`,
    reviewer_country: profile.country,
    rating,
    comment,
    is_hidden: false,
  });

  if (insertError) {
    console.error("Review insert error:", insertError);
    return { success: false, error: "Une erreur est survenue lors de l'envoi. Veuillez réessayer." };
  }

  return { success: true };
}
```

- [ ] **Step 2: Update `components/forms/ReviewForm.tsx` to use the server action**

Replace the `onSubmit` function body (lines 41–91). Keep the form JSX exactly as-is; only `onSubmit` changes:

```typescript
// At top of file, add import:
import { submitReview } from "@/lib/actions/reviews";

// Replace the entire onSubmit function:
const onSubmit = async (data: ReviewFormData) => {
  if (data.rating === 0) {
    setError("Veuillez sélectionner une note.");
    return;
  }

  setIsLoading(true);
  setError(null);

  try {
    const result = await submitReview({
      professional_id: data.professional_id,
      rating: data.rating,
      comment: data.comment,
    });

    if (!result.success) {
      setError(result.error);
      return;
    }

    setSubmitted(true);
  } catch (err) {
    console.error("Review submission error:", err);
    setError("Une erreur est survenue lors de l'envoi. Veuillez réessayer.");
  } finally {
    setIsLoading(false);
  }
};
```

Also remove these lines that are no longer needed:
```typescript
// REMOVE these lines from onSubmit:
const supabase = createClient();
// and the entire blocks for: getUser, profile fetch, supabase.from("reviews").insert
```

And remove the import at the top:
```typescript
// REMOVE:
import { createClient } from "@/lib/supabase/client";
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd "c:/Users/DELL LATITUDE 7480/Kelen-African_Network" && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors in `lib/actions/reviews.ts` or `components/forms/ReviewForm.tsx`

- [ ] **Step 4: Commit**

```bash
git add lib/actions/reviews.ts components/forms/ReviewForm.tsx
git commit -m "fix(reviews): move insert to server action with server-side auth and validation"
```

---

## Task 3: Fix Silent Env Guard in Supabase Clients

**Files:**
- Modify: `lib/supabase/client.ts`
- Modify: `lib/supabase/server.ts`

In development/test environments, missing env vars should throw a loud error instead of returning a dummy client that silently fails.

- [ ] **Step 1: Update `lib/supabase/client.ts`**

Replace the guard block (lines 12–18):

```typescript
// lib/supabase/client.ts
// ============================================
// Kelen — Supabase Browser Client
// Use in 'use client' components
// ============================================

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set."
    );
  }

  return createBrowserClient(url, anonKey);
}
```

- [ ] **Step 2: Update `lib/supabase/server.ts`**

Replace the guard block (lines 14–26):

```typescript
// lib/supabase/server.ts
// ============================================
// Kelen — Supabase Server Client
// Use in Server Components, Server Actions, Route Handlers
// ============================================

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set."
    );
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from Server Component — ignore
        }
      },
    },
  });
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd "c:/Users/DELL LATITUDE 7480/Kelen-African_Network" && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 4: Commit**

```bash
git add lib/supabase/client.ts lib/supabase/server.ts
git commit -m "fix(supabase): throw clear error in dev when env vars are missing"
```

---

## Task 4: Eliminate Redundant DB Role Queries After Login

**Files:**
- Modify: `components/forms/LoginForm.tsx`
- Modify: `app/auth/callback/route.ts`

The `role` is already stored in `user_metadata` at signup (via `options.data.role`). There is no need to query `public.users` after auth. This removes a race condition and an extra round-trip.

- [ ] **Step 1: Update `LoginForm.tsx` `onSubmit`**

Replace lines 40–64 (the profile fetch + redirect block):

```typescript
if (authData.user) {
  const role = authData.user.user_metadata?.role as string | undefined;

  if (role?.startsWith("pro_")) {
    router.push("/pro/dashboard");
  } else if (role === "admin") {
    router.push("/admin/dashboard");
  } else {
    router.push("/dashboard");
  }

  router.refresh();
}
```

Remove the now-unused profile fetch entirely. The final `onSubmit` will be:

```typescript
const onSubmit = async (data: LoginFormData) => {
  setIsLoading(true);
  setError(null);

  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (authError) throw authError;

    if (authData.user) {
      const role = authData.user.user_metadata?.role as string | undefined;

      if (role?.startsWith("pro_")) {
        router.push("/pro/dashboard");
      } else if (role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }

      router.refresh();
    }
  } catch (err: any) {
    console.error("Login error:", err);
    setError(err.message || "Email ou mot de passe incorrect.");
  } finally {
    setIsLoading(false);
  }
};
```

- [ ] **Step 2: Update `app/auth/callback/route.ts`**

Replace lines 19–34 (the DB role query block) with a metadata read:

```typescript
// app/auth/callback/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      if (next.includes("/mot-de-passe/reset")) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      const role = data.session.user.user_metadata?.role as string | undefined;

      if (role?.startsWith("pro_")) {
        return NextResponse.redirect(`${origin}/pro/dashboard`);
      } else if (role === "admin") {
        return NextResponse.redirect(`${origin}/admin`);
      } else {
        return NextResponse.redirect(`${origin}/dashboard`);
      }
    }
  }

  return NextResponse.redirect(
    `${origin}/connexion?error=Impossible_de_verifier_votre_email`
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd "c:/Users/DELL LATITUDE 7480/Kelen-African_Network" && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 4: Commit**

```bash
git add components/forms/LoginForm.tsx app/auth/callback/route.ts
git commit -m "fix(auth): read role from user_metadata instead of extra DB query on login"
```

---

## Task 5: Fix Broken Return Type in `uploadMultipleFiles` Callers

**Files:**
- Modify: `components/forms/RecommendationForm.tsx`
- Modify: `components/forms/SignalForm.tsx`
- Modify: `components/forms/RealizationForm.tsx`

Task 1 changed `uploadMultipleFiles` to return `UploadResult[]` instead of `string[]`. Any caller that destructures the old array of URLs needs updating. If any caller hasn't been changed yet, this task patches it.

- [ ] **Step 1: Find all callers**

```bash
cd "c:/Users/DELL LATITUDE 7480/Kelen-African_Network" && grep -rn "uploadMultipleFiles\|uploadFile" --include="*.tsx" --include="*.ts" .
```

Note each file and how they consume the return value.

- [ ] **Step 2: For each caller, update URL extraction**

Old pattern (returns `string[]`):
```typescript
const urls = await uploadMultipleFiles(files, "bucket", "path");
// urls is string[]
```

New pattern (returns `UploadResult[]`):
```typescript
import { uploadMultipleFiles, type UploadResult } from "@/lib/supabase/storage";

const results = await uploadMultipleFiles(files, "bucket", "path");
const failed = results.filter((r) => r.error !== null);
if (failed.length > 0) {
  throw new Error(failed.map((r) => r.error).join(", "));
}
const urls = results.map((r) => r.url as string);
```

Apply this pattern to every caller found in Step 1.

- [ ] **Step 3: Verify TypeScript compiles with no errors**

```bash
cd "c:/Users/DELL LATITUDE 7480/Kelen-African_Network" && npx tsc --noEmit 2>&1
```

Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add components/forms/RecommendationForm.tsx components/forms/SignalForm.tsx components/forms/RealizationForm.tsx
git commit -m "fix(forms): update callers of uploadMultipleFiles for new UploadResult[] return type"
```
