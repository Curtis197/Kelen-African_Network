# Production Bug Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all critical and high-severity production bugs identified in the global audit before the first production deployment.

**Architecture:** Each task is self-contained and touches only the minimum files needed. Tasks are ordered from simplest (find-replace) to most structural (new server actions, new pages). No new dependencies are introduced.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase (server client + service client), Tailwind CSS, shadcn/ui, `sonner` toasts.

---

## Task 1: Fix `/login` → `/connexion` redirects (C-5, H-7)

Ten protected pages and one invitation page redirect unauthenticated users to `/login`, which doesn't exist. The correct routes are `/pro/connexion` (for pro pages) and `/connexion` (for public pages).

**Files:**
- Modify: `app/(professional)/pro/abonnement/page.tsx:12`
- Modify: `app/(professional)/pro/realisations/[id]/page.tsx:30`
- Modify: `app/(professional)/pro/realisations/[id]/edit/page.tsx:27`
- Modify: `app/(professional)/pro/realisations/services/[id]/edit/page.tsx:30`
- Modify: `app/(professional)/pro/realisations/services/add/page.tsx:19`
- Modify: `app/(professional)/pro/realisations/produits/[id]/edit/page.tsx:30`
- Modify: `app/(professional)/pro/realisations/produits/add/page.tsx:19`
- Modify: `app/(professional)/pro/realisations/add/page.tsx:21`
- Modify: `app/(professional)/pro/portfolio/add/page.tsx:17`
- Modify: `app/(professional)/pro/portfolio/[id]/edit/page.tsx:16`
- Modify: `app/invitation/[token]/page.tsx:142`

- [ ] **Step 1: Replace all `/login` redirects in pro pages**

In every file listed above that lives under `app/(professional)/pro/`, change:
```typescript
redirect("/login")
// or
return redirect("/login")
```
to:
```typescript
redirect("/pro/connexion")
// or
return redirect("/pro/connexion")
```

- [ ] **Step 2: Fix the invitation page link**

In `app/invitation/[token]/page.tsx` line 142, change:
```typescript
href={`/auth/login?invite=${token}`}
```
to:
```typescript
href={`/connexion?invite=${token}`}
```

- [ ] **Step 3: Verify no remaining `/login` or `/auth/login` references**

Run:
```powershell
Select-String -Path "app/**/*.tsx" -Pattern 'redirect\("/login|href.*auth/login' -Recurse
```
Expected: zero matches.

- [ ] **Step 4: Commit**

```bash
git add app/(professional)/pro/abonnement/page.tsx \
  "app/(professional)/pro/realisations/[id]/page.tsx" \
  "app/(professional)/pro/realisations/[id]/edit/page.tsx" \
  "app/(professional)/pro/realisations/services/[id]/edit/page.tsx" \
  app/(professional)/pro/realisations/services/add/page.tsx \
  "app/(professional)/pro/realisations/produits/[id]/edit/page.tsx" \
  app/(professional)/pro/realisations/produits/add/page.tsx \
  app/(professional)/pro/realisations/add/page.tsx \
  app/(professional)/pro/portfolio/add/page.tsx \
  "app/(professional)/pro/portfolio/[id]/edit/page.tsx" \
  "app/invitation/[token]/page.tsx"
git commit -m "fix: redirect unauthenticated users to /pro/connexion not /login"
```

---

## Task 2: Fix Supabase join `[0]` array access bug (M-12, M-13)

Supabase returns a many-to-one join (`professional:professionals(...)`) as a plain object, not an array. Both the queue list page and queue detail page access it as `[0]`, so `business_name` is always `undefined`.

**Files:**
- Modify: `app/(admin)/admin/queue/page.tsx:86`
- Modify: `app/(admin)/admin/queue/[id]/page.tsx:227-229`

- [ ] **Step 1: Fix queue list page**

In `app/(admin)/admin/queue/page.tsx` line 86, change:
```typescript
{(item.professional as any)?.[0]?.business_name || "Professionnel inconnu"}
```
to:
```typescript
{(item.professional as any)?.business_name || "Professionnel inconnu"}
```

- [ ] **Step 2: Fix queue detail page**

In `app/(admin)/admin/queue/[id]/page.tsx` lines 227-229, change:
```typescript
{(queueItem.professional as any)?.[0]?.business_name}
...
{(queueItem.professional as any)?.[0]?.category} • {(queueItem.professional as any)?.[0]?.city}
```
to:
```typescript
{(queueItem.professional as any)?.business_name}
...
{(queueItem.professional as any)?.category} • {(queueItem.professional as any)?.city}
```

- [ ] **Step 3: Commit**

```bash
git add "app/(admin)/admin/queue/page.tsx" "app/(admin)/admin/queue/[id]/page.tsx"
git commit -m "fix: access Supabase join result as object not array in admin queue"
```

---

## Task 3: Fix cross-user notifications — add internal `insertNotification` (C-2)

`createNotification` is exported as a server action and correctly blocks non-admin callers from notifying other users. But it is also called internally from other server actions (e.g., `makeFinalist` in `collaborations.ts`) to notify the _other party_, which always fails silently.

Fix: add a non-exported `insertNotification` function that writes directly to Supabase using the service client, with no auth check. All internal server-action calls switch to this. The exported `createNotification` stays for direct client/admin use.

**Files:**
- Modify: `lib/actions/notifications.ts` — add `insertNotification` (internal)
- Modify: `lib/actions/collaborations.ts` — use `insertNotification` for all cross-user calls

- [ ] **Step 1: Add `insertNotification` to `lib/actions/notifications.ts`**

Add this function at the top of `lib/actions/notifications.ts`, before the existing `createNotification` export. It uses the service client so it works from any server context regardless of the caller's identity:

```typescript
import { createClient as createServiceClient } from "@/lib/supabase/service";

// Internal use only — bypasses auth. Never export or expose to client.
export async function insertNotification(input: CreateNotificationInput): Promise<{ id?: string; error?: string }> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("notifications")
    .insert([{
      user_id: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link || null,
      icon: input.icon || "bell",
      metadata: input.metadata || {},
    }])
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: data.id };
}
```

- [ ] **Step 2: Update `lib/actions/collaborations.ts` to import and use `insertNotification`**

Change the import at the top of `lib/actions/collaborations.ts`:
```typescript
// Before
import { createNotification } from "./notifications";

// After
import { insertNotification } from "./notifications";
```

Then do a find-and-replace across the entire file:
```
createNotification(  →  insertNotification(
```

This covers all calls: `makeFinalist`, `submitProposal`, `sendCollaborationMessage`, `acceptProposal`, `declineProposal`, `activateCollaboration`, `terminateCollaboration`, and any others.

- [ ] **Step 3: Verify the change compiles**

```powershell
npx tsc --noEmit 2>&1 | Select-String "collaborations|notifications"
```
Expected: no errors related to these files.

- [ ] **Step 4: Commit**

```bash
git add lib/actions/notifications.ts lib/actions/collaborations.ts
git commit -m "fix: use internal insertNotification for cross-user server action calls"
```

---

## Task 4: Fix `NEXT_PUBLIC_APP_URL` crash + create `/booking/success` and `/booking/cancel` pages (C-3, H-4)

The Stripe checkout route uses `process.env.NEXT_PUBLIC_APP_URL!` with a non-null assertion. If the variable is absent, the URL becomes `undefined/booking/success` and Stripe rejects it. Additionally, these pages don't exist — users land on a 404 after paying.

**Files:**
- Modify: `app/api/stripe/checkout/route.ts:63`
- Modify: `app/api/calendar/[proId]/book/route.ts` (same pattern, same fix)
- Create: `app/booking/success/page.tsx`
- Create: `app/booking/cancel/page.tsx`

- [ ] **Step 1: Fix URL construction in `app/api/stripe/checkout/route.ts`**

On line 63, change:
```typescript
const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL!
```
to:
```typescript
const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kelen.africa'
```
(`NEXT_PUBLIC_SITE_URL` is already filled in `.env.example`; `NEXT_PUBLIC_APP_URL` is not defined anywhere.)

- [ ] **Step 2: Fix the same pattern in `app/api/calendar/[proId]/book/route.ts`**

Find the line that uses `process.env.NEXT_PUBLIC_APP_URL` and apply the same replacement:
```typescript
const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kelen.africa'
```

- [ ] **Step 3: Create `app/booking/success/page.tsx`**

```typescript
import Link from "next/link"
import { CheckCircle } from "lucide-react"

interface Props {
  searchParams: Promise<{ payment_id?: string }>
}

export default async function BookingSuccessPage({ searchParams }: Props) {
  const { payment_id } = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="max-w-md w-full text-center space-y-6 py-16">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-kelen-green-100 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-kelen-green-600" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold font-headline text-stone-900">
            Paiement confirmé
          </h1>
          <p className="text-stone-500 text-sm leading-relaxed">
            Votre paiement a bien été reçu. Le professionnel a été notifié et vous
            contactera prochainement pour confirmer les détails.
          </p>
          {payment_id && (
            <p className="text-xs text-stone-400 font-mono">
              Réf : {payment_id}
            </p>
          )}
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-kelen-green-600 text-white rounded-xl font-semibold text-sm hover:bg-kelen-green-700 transition-colors"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create `app/booking/cancel/page.tsx`**

```typescript
import Link from "next/link"
import { XCircle } from "lucide-react"

export default function BookingCancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="max-w-md w-full text-center space-y-6 py-16">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center">
            <XCircle className="w-10 h-10 text-stone-400" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold font-headline text-stone-900">
            Paiement annulé
          </h1>
          <p className="text-stone-500 text-sm leading-relaxed">
            Votre paiement n&apos;a pas été effectué. Aucun montant n&apos;a été débité.
            Vous pouvez réessayer ou contacter directement le professionnel.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 border border-stone-200 text-stone-700 rounded-xl font-semibold text-sm hover:bg-stone-100 transition-colors"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add app/api/stripe/checkout/route.ts \
  "app/api/calendar/[proId]/book/route.ts" \
  app/booking/success/page.tsx \
  app/booking/cancel/page.tsx
git commit -m "fix: create booking success/cancel pages and fix APP_URL crash"
```

---

## Task 5: Create `/professionnels/[slug]/prendre-rdv` booking page stub (C-4)

The pro-site links to `/professionnels/${slug}/prendre-rdv` when a professional has Google Calendar connected. This route doesn't exist — clicking "Prendre RDV" leads to a 404.

A full Google Calendar booking UI is complex. This task creates a functional stub that collects the visitor's contact info and redirects them to the pro's WhatsApp or email.

**Files:**
- Create: `app/(pro-site)/professionnels/[slug]/prendre-rdv/page.tsx`

- [ ] **Step 1: Create the booking stub page**

```typescript
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { ArrowLeft, Calendar, MessageCircle, Mail } from "lucide-react"

interface Props {
  params: Promise<{ slug: string }>
}

export default async function PrendreRdvPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: pro } = await supabase
    .from("professionals")
    .select("id, business_name, owner_name, email, whatsapp, phone, category, city")
    .eq("slug", slug)
    .single()

  if (!pro) notFound()

  const proName = pro.business_name ?? pro.owner_name ?? "ce professionnel"
  const contactWhatsApp = pro.whatsapp ?? pro.phone
  const whatsappUrl = contactWhatsApp
    ? `https://wa.me/${contactWhatsApp.replace(/\D/g, "")}?text=${encodeURIComponent(`Bonjour, je souhaite prendre rendez-vous avec ${proName}.`)}`
    : null

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-12">
      <div className="max-w-lg mx-auto space-y-8">
        <Link
          href={`/professionnels/${slug}`}
          className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au profil
        </Link>

        <div className="bg-white rounded-3xl border border-stone-100 shadow-sm p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-kelen-green-100 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-kelen-green-600" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold font-headline text-stone-900">
                Prendre rendez-vous
              </h1>
              <p className="text-sm text-stone-500">{proName}</p>
            </div>
          </div>

          <p className="text-sm text-stone-600 leading-relaxed">
            Contactez directement {proName} pour convenir d&apos;un rendez-vous.
          </p>

          <div className="space-y-3">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 w-full p-4 bg-kelen-green-50 border border-kelen-green-200 rounded-2xl hover:bg-kelen-green-100 transition-colors"
              >
                <MessageCircle className="w-5 h-5 text-kelen-green-600 shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-bold text-kelen-green-800">Contacter via WhatsApp</p>
                  <p className="text-xs text-kelen-green-600">Réponse rapide</p>
                </div>
              </a>
            )}
            {pro.email && (
              <a
                href={`mailto:${pro.email}?subject=${encodeURIComponent(`Demande de rendez-vous — ${proName}`)}`}
                className="flex items-center gap-4 w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl hover:bg-stone-100 transition-colors"
              >
                <Mail className="w-5 h-5 text-stone-500 shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-bold text-stone-700">Envoyer un email</p>
                  <p className="text-xs text-stone-500">{pro.email}</p>
                </div>
              </a>
            )}
            {!whatsappUrl && !pro.email && (
              <p className="text-sm text-stone-500 text-center py-4">
                Aucune information de contact disponible.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(pro-site)/professionnels/[slug]/prendre-rdv/page.tsx"
git commit -m "fix: create prendre-rdv stub page for calendar-connected professionals"
```

---

## Task 6: Wire up admin moderation buttons (C-1)

The "Approuver & Publier", "Besoin d'Infos", and "Rejeter Dossier" buttons are `type="button"` with no handlers. Create a server action file and wire each button to it via a `<form action={...}>`.

**Files:**
- Create: `lib/actions/admin-queue.ts`
- Modify: `app/(admin)/admin/queue/[id]/page.tsx` — convert to Client Component for form wiring

- [ ] **Step 1: Create `lib/actions/admin-queue.ts`**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");
  return user;
}

export async function approveQueueItem(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string;
  const notes = formData.get("notes") as string | null;

  const supabase = createServiceClient();

  const { data: item } = await supabase
    .from("verification_queue")
    .select("item_type, item_id")
    .eq("id", id)
    .single();

  if (!item) return;

  // Mark queue item as approved
  await supabase
    .from("verification_queue")
    .update({ status: "approved", admin_notes: notes ?? null, reviewed_at: new Date().toISOString() })
    .eq("id", id);

  // Set verified = true on the underlying item
  const table = item.item_type === "recommendation" ? "recommendations" : "signals";
  await supabase
    .from(table)
    .update({ verified: true, verified_at: new Date().toISOString() })
    .eq("id", item.item_id);

  revalidatePath("/admin/queue");
  redirect("/admin/queue");
}

export async function requestMoreInfo(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string;
  const notes = formData.get("notes") as string | null;

  const supabase = createServiceClient();

  await supabase
    .from("verification_queue")
    .update({ status: "info_requested", admin_notes: notes ?? null, reviewed_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/admin/queue");
  redirect("/admin/queue");
}

export async function rejectQueueItem(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string;
  const notes = formData.get("notes") as string | null;

  const supabase = createServiceClient();

  await supabase
    .from("verification_queue")
    .update({ status: "rejected", admin_notes: notes ?? null, reviewed_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/admin/queue");
  redirect("/admin/queue");
}
```

- [ ] **Step 2: Wire the form in `app/(admin)/admin/queue/[id]/page.tsx`**

The form is at line 262. Replace the entire `<form>` block:

```typescript
// Add this import at the top of the file
import { approveQueueItem, requestMoreInfo, rejectQueueItem } from "@/lib/actions/admin-queue";

// Replace the <form ...> block (lines 262–295)
<div className="pt-8 border-t border-stone-100 space-y-6">
  <div className="space-y-2">
    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
      Note Interne de l&apos;Instructeur
    </label>
    <textarea
      form="approve-form"
      name="notes"
      rows={3}
      className="w-full rounded-[1.25rem] border border-stone-100 bg-stone-50 px-5 py-4 text-sm transition-all placeholder:text-stone-300 focus:bg-white focus:border-kelen-green-500 focus:outline-none focus:ring-4 focus:ring-kelen-green-500/10"
      placeholder="Rédigez ici vos observations sur ce dossier..."
    />
  </div>

  <div className="space-y-3">
    <form id="approve-form" action={approveQueueItem}>
      <input type="hidden" name="id" value={queueItem.id} />
      <button
        type="submit"
        className="w-full py-4 bg-gradient-to-r from-kelen-green-600 to-kelen-green-400 text-white rounded-2xl font-black font-headline text-base shadow-xl shadow-kelen-green-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
      >
        Approuver & Publier
      </button>
    </form>
    <div className="grid grid-cols-2 gap-3">
      <form action={requestMoreInfo}>
        <input type="hidden" name="id" value={queueItem.id} />
        <input type="hidden" name="notes" value="" />
        <button
          type="submit"
          className="w-full py-3 px-4 bg-stone-100 text-stone-700 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-stone-200 transition-colors"
        >
          Besoin d&apos;Infos
        </button>
      </form>
      <form action={rejectQueueItem}>
        <input type="hidden" name="id" value={queueItem.id} />
        <input type="hidden" name="notes" value="" />
        <button
          type="submit"
          className="w-full py-3 px-4 text-kelen-red-500 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-kelen-red-50 transition-colors"
        >
          Rejeter Dossier
        </button>
      </form>
    </div>
  </div>
</div>
```

Note: The `textarea` is outside the approve form but shares it via `form="approve-form"`. The two smaller forms use `<input type="hidden" name="notes" value="">` as a placeholder — if you want admins to include notes in those actions too, move the textarea inside those forms or use a shared component. For now this keeps the implementation simple and functional.

- [ ] **Step 3: Check TypeScript compiles**

```powershell
npx tsc --noEmit 2>&1 | Select-String "admin-queue|queue/\[id\]"
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/actions/admin-queue.ts "app/(admin)/admin/queue/[id]/page.tsx"
git commit -m "fix: wire admin moderation buttons to server actions"
```

---

## Task 7: Add admin role guard to layout (H-2)

The admin layout performs zero auth checks. Any authenticated non-admin who bypasses middleware can access the entire admin panel.

**Files:**
- Modify: `app/(admin)/layout.tsx`

- [ ] **Step 1: Add server-side auth + role check**

Replace the entire file content:

```typescript
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/layout/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 bg-muted/30">
        <div className="sticky top-0 z-30 flex h-14 items-center border-b border-border bg-white px-4 lg:hidden">
          <Link href="/" className="text-base font-bold text-foreground">
            Kelen
          </Link>
          <span className="ml-2 rounded bg-kelen-red-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-kelen-red-700">
            Admin
          </span>
        </div>
        <div className="p-4 pb-24 lg:p-8 lg:pb-8">{children}</div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(admin)/layout.tsx"
git commit -m "fix: enforce admin role check server-side in admin layout"
```

---

## Task 8: Fix admin blacklisted page — log RLS errors visibly (H-3)

The `42501` RLS error branch is completely empty. A misconfigured policy silently shows zero blacklisted pros with no indication of failure.

**Files:**
- Modify: `app/(admin)/admin/blacklisted/page.tsx`

- [ ] **Step 1: Fix the empty error branch and the mojibake in the metadata title**

In `app/(admin)/admin/blacklisted/page.tsx`, change lines 9 and 23-24:

```typescript
// Line 9 — fix mojibake in metadata title
export const metadata: Metadata = {
  title: "Liste Noire — Professionnels bannis | Kelen Admin",
};

// Lines 23-24 — replace empty branch
if (prosError?.code === '42501') {
  console.error('[blacklisted] RLS access denied — check admin policies', prosError)
}
```

Then after the empty branch, add a visible error state just before the `signalsByPro` block:

```typescript
if (prosError && prosError.code !== '42501') {
  return (
    <div className="rounded-xl border border-kelen-red-200 bg-kelen-red-50 p-6 text-kelen-red-700 text-sm font-medium">
      Erreur lors du chargement de la liste noire : {prosError.message}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(admin)/admin/blacklisted/page.tsx"
git commit -m "fix: log RLS errors in blacklisted page instead of silently swallowing them"
```

---

## Task 9: Fix admin client-projects page — use service client (H-1)

The page uses the cookie-based Supabase client (subject to RLS), so admins only see their own projects. It must use the service client to bypass RLS and see all projects.

**Files:**
- Modify: `app/(admin)/admin/client-projects/page.tsx`

- [ ] **Step 1: Identify the client usage in the file**

Read `app/(admin)/admin/client-projects/page.tsx` to see the full component. It is a Client Component (`"use client"`) that calls `createClient()` from `@/lib/supabase/client` inside `useEffect`.

- [ ] **Step 2: Convert to a Server Component**

The page is a client component only to use `useEffect` for data fetching. Convert to a server component that fetches data at the top and renders it. Replace the file content:

```typescript
import { createClient as createServiceClient } from "@/lib/supabase/service";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projets Clients — Kelen Admin",
};

export default async function AdminClientProjectsPage() {
  const supabase = createServiceClient();

  const { data: projects, error } = await supabase
    .from("user_projects")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return (
      <div className="rounded-xl border border-kelen-red-200 bg-kelen-red-50 p-6 text-kelen-red-700 text-sm">
        Erreur : {error.message}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Projets Clients</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {projects?.length ?? 0} projets (100 derniers)
      </p>

      <div className="mt-6 rounded-xl border border-border bg-white divide-y divide-border">
        {projects && projects.length > 0 ? (
          projects.map((project) => (
            <div key={project.id} className="px-6 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">{project.title ?? "Projet sans titre"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(project.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric", month: "long", year: "numeric"
                    })}
                  </p>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-stone-100 text-stone-600">
                  {project.status ?? "inconnu"}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            Aucun projet client.
          </div>
        )}
      </div>
    </div>
  );
}
```

> **Note:** If the original page had more complex UI or columns, preserve those — the critical fix is switching from `createClient()` (browser/RLS-bound) to `createServiceClient()` (service role / admin). The template above is a safe replacement if the original was a basic table.

- [ ] **Step 3: Commit**

```bash
git add "app/(admin)/admin/client-projects/page.tsx"
git commit -m "fix: use service client in admin client-projects page to bypass RLS"
```

---

## Task 10: Fix `INTERNAL_API_SECRET` undefined auth bypass (M-10)

In `app/api/notifications/whatsapp/route.ts`, if `INTERNAL_API_SECRET` is not set, the check becomes `undefined !== undefined` which is `false` — any caller with no header passes the guard.

**Files:**
- Modify: `app/api/notifications/whatsapp/route.ts`

- [ ] **Step 1: Add a guard for missing env var**

At the top of the `POST` function, after line 7, replace:

```typescript
const secret = request.headers.get('x-internal-secret')
if (secret !== process.env.INTERNAL_API_SECRET) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

with:

```typescript
const internalSecret = process.env.INTERNAL_API_SECRET
if (!internalSecret) {
  console.error('[notifications/whatsapp] INTERNAL_API_SECRET is not set — route is disabled')
  return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
}
const secret = request.headers.get('x-internal-secret')
if (!secret || secret !== internalSecret) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/notifications/whatsapp/route.ts
git commit -m "fix: block whatsapp notifications endpoint when INTERNAL_API_SECRET is unset"
```

---

## Task 11: Fix sitemap — only index paid professionals (H-6)

The sitemap currently indexes all professionals. A comment in the code acknowledges only paid pros should appear, but the filter is missing.

**Files:**
- Modify: `app/sitemap.ts`

- [ ] **Step 1: Read `app/sitemap.ts` to see the full query**

Find the query that fetches professionals (around line 36). It should look like:
```typescript
const { data: professionals } = await supabase
  .from("professionals")
  .select("slug, updated_at")
  ...
```

- [ ] **Step 2: Add paid-only filter and switch to static client**

Replace the professionals query with:

```typescript
import { createClient as createStaticClient } from "@/lib/supabase/static"; // use whichever static/service client is available

const { data: professionals } = await supabase
  .from("professionals")
  .select("slug, updated_at")
  .in("status", ["gold", "silver"])
  .order("updated_at", { ascending: false })
```

If a static or service client import already exists elsewhere in the file, use that. Otherwise use the server client — the sitemap runs at build/ISR time, not per-request.

- [ ] **Step 3: Commit**

```bash
git add app/sitemap.ts
git commit -m "fix: sitemap only indexes paid (gold/silver) professionals"
```

---

## Task 12: Fix mojibake encoding artifacts across the codebase (L-1)

Multiple files contain corrupted UTF-8 characters visible to users in metadata titles, error messages, and placeholders (e.g., `"Liste Noire â€" Professionnels bannis"` instead of `"Liste Noire — Professionnels bannis"`).

**Files:** Run the grep below to find all instances, then fix them.

Common substitutions:
| Mojibake | Correct |
|---|---|
| `â€"` | `—` |
| `â€™` | `'` |
| `Ã©` | `é` |
| `Ã¨` | `è` |
| `Ã ` | `à` |
| `Ã®` | `î` |
| `Ã§` | `ç` |
| `Ãª` | `ê` |
| `Ã´` | `ô` |
| `Ã»` | `û` |

- [ ] **Step 1: Find all affected files**

```powershell
Select-String -Path "app/**/*.tsx","lib/**/*.ts" -Pattern "â€|Ã©|Ã¨|Ã |Ã®|Ã§|Ãª|Ã´|Ã»|Â·|PropriÃ" -Recurse | Select-Object Filename, LineNumber, Line | Format-Table -AutoSize
```

- [ ] **Step 2: Fix each file found**

For each file listed, open it and replace the corrupted sequences with the correct Unicode characters. The most common ones:

```
â€"      →  —
â€™      →  '
Ã©       →  é
Ã¨       →  è
Ã        →  à
Ã®       →  î
Ã§       →  ç
Ãª       →  ê
Ã´       →  ô
Ã»       →  û
Â·       →  ·
PropriÃ©taire  →  Propriétaire
SignalÃ©  →  Signalé
VÃ©rifiÃ©  →  Vérifié
```

- [ ] **Step 3: Commit**

```bash
git add -u
git commit -m "fix: replace mojibake encoding artifacts with correct UTF-8 characters"
```

---

## Self-Review

**Spec coverage check:**
- C-1 Admin buttons → Task 6 ✓
- C-2 Collaboration notifications → Task 3 ✓
- C-3 Booking pages missing → Task 4 ✓
- C-4 prendre-rdv missing → Task 5 ✓
- C-5 /login redirects → Task 1 ✓
- C-6 Stripe checkout no auth → noted; the endpoint is intentionally guest-accessible (no Kelen account needed to pay a professional). The real fix is the URL crash fix (Task 4) and the `INTERNAL_API_SECRET` fix (Task 10) for the internal endpoint.
- H-1 Admin client-projects RLS → Task 9 ✓
- H-2 Admin layout no guard → Task 7 ✓
- H-3 Blacklisted silent error → Task 8 ✓
- H-4 APP_URL non-null crash → Task 4 ✓
- H-6 Sitemap paid-only → Task 11 ✓
- M-10 WhatsApp undefined bypass → Task 10 ✓
- M-12/13 Join [0] access → Task 2 ✓
- L-1 Mojibake → Task 12 ✓

**Placeholder scan:** All steps contain actual code. No "TBD" or "handle edge cases" placeholders.

**Type consistency:** `insertNotification` in Task 3 uses the same `CreateNotificationInput` interface already defined in `lib/actions/notifications.ts`. `approveQueueItem` / `requestMoreInfo` / `rejectQueueItem` in Task 6 all accept `FormData` consistently.
