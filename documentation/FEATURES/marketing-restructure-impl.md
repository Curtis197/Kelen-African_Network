# Marketing Restructure — Sequential Implementation

> Created: 2026-04-26  
> Executor: AI agent or developer  
> Prerequisite: Read this document top to bottom before starting. Execute steps in order. Do not skip steps.  
> Source of page copy: `documentation/Philosophy and Copywriting/marketing-pro.md`, `pro-pages.md`, `marketing-client.md`

---

## What this does

Splits the single `(marketing)` routing group into two distinct spaces:

| Space | Routes | Navbar | Audience |
|-------|--------|--------|----------|
| `app/(marketing)/` | `/`, `/comment-ca-marche`, `/faq`, `/contact`, legal pages | Navbar with search → | Clients looking for a pro |
| `app/(marketing-pro)/` | `/pour-les-professionnels` and all sub-pages | Navbar with "Créer mon profil →" CTA | Professionals |

After this restructure:
- `/pour-les-pros` redirects permanently to `/pour-les-professionnels`
- `/tarifs` redirects permanently to `/pour-les-professionnels/tarifs`
- The homepage (`/`) and client pages have a search-focused navbar
- All pro marketing pages share a distinct CTA-focused navbar

---

## File map — before and after

### Files that exist and stay
```
app/(marketing)/layout.tsx                              → keep, minor edit
app/(marketing)/page.tsx                                → keep (already fixed)
app/(marketing)/comment-ca-marche/page.tsx              → keep, content update
app/(marketing)/faq/page.tsx                            → keep, content update
app/(marketing)/contact/page.tsx                        → keep, content update
app/(marketing)/a-propos/page.tsx                       → keep as-is
app/(marketing)/cgu/page.tsx                            → keep as-is
app/(marketing)/mentions-legales/page.tsx               → keep as-is
app/(marketing)/confidentialite/page.tsx                → keep as-is
components/layout/Navbar.tsx                            → keep, used for client space
```

### Files that become redirects
```
app/(marketing)/pour-les-pros/page.tsx                  → convert to redirect → /pour-les-professionnels
app/(marketing)/tarifs/page.tsx                         → already redirects → update target
```

### New files to create
```
app/(marketing-pro)/layout.tsx                          → NEW
app/(marketing-pro)/pour-les-professionnels/page.tsx    → NEW (move content from pour-les-pros)
app/(marketing-pro)/pour-les-professionnels/comment-ca-marche/page.tsx  → NEW
app/(marketing-pro)/pour-les-professionnels/tarifs/page.tsx             → NEW
app/(marketing-pro)/pour-les-professionnels/faq/page.tsx                → NEW
app/(marketing-pro)/pour-les-professionnels/contact/page.tsx            → NEW
components/layout/NavbarMarketingPro.tsx                → NEW
components/ui/FaqAccordion.tsx                          → NEW (shared component)
```

### Constants to update
```
lib/utils/constants.ts                                  → update MARKETING_NAV, add MARKETING_PRO_NAV, update FOOTER_LINKS
next.config.ts                                          → add redirects
```

---

## STEP 1 — Add redirects to next.config.ts

**Action:** EDIT  
**File:** `next.config.ts`

Replace the entire file content with:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/pour-les-pros",
        destination: "/pour-les-professionnels",
        permanent: true,
      },
      {
        source: "/tarifs",
        destination: "/pour-les-professionnels/tarifs",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
```

---

## STEP 2 — Update constants.ts

**Action:** EDIT  
**File:** `lib/utils/constants.ts`

Find the `MARKETING_NAV` block and the `FOOTER_LINKS` block. Replace them exactly as shown below.

### 2a — Replace MARKETING_NAV

Old:
```ts
export const MARKETING_NAV = [
  { href: "/comment-ca-marche", label: "Comment ça marche" },
  { href: "/pour-les-pros", label: "Pour les pros" },
  { href: "/a-propos", label: "À propos" },
] as const;
```

New:
```ts
export const MARKETING_NAV = [
  { href: "/comment-ca-marche", label: "Comment ça marche" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;

export const MARKETING_PRO_NAV = [
  { href: "/pour-les-professionnels/comment-ca-marche", label: "Comment ça marche" },
  { href: "/pour-les-professionnels/tarifs", label: "Tarifs" },
  { href: "/pour-les-professionnels/faq", label: "FAQ" },
  { href: "/pour-les-professionnels/contact", label: "Contact" },
] as const;
```

### 2b — Replace FOOTER_LINKS plateforme array

Old:
```ts
  plateforme: [
    { href: "/recherche", label: "Rechercher" },
    { href: "/comment-ca-marche", label: "Comment ça marche" },
    { href: "/pour-les-pros", label: "Pour les pros" },
  ],
```

New:
```ts
  plateforme: [
    { href: "/recherche", label: "Rechercher" },
    { href: "/comment-ca-marche", label: "Comment ça marche" },
    { href: "/pour-les-professionnels", label: "Pour les professionnels" },
  ],
```

---

## STEP 3 — Create NavbarMarketingPro component

**Action:** CREATE  
**File:** `components/layout/NavbarMarketingPro.tsx`

This is the navbar for all `/pour-les-professionnels/*` pages. It has no search bar. Its primary CTA is "Créer mon profil →". It is a client component so it can manage mobile menu state.

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { MARKETING_PRO_NAV } from "@/lib/utils/constants";
import { Menu, X } from "lucide-react";

export function NavbarMarketingPro() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo — links to pro landing, not homepage */}
        <Link href="/pour-les-professionnels" className="flex items-center gap-1 group">
          <span className="text-2xl font-black tracking-tighter text-kelen-green-500 group-hover:scale-105 transition-transform duration-200">
            Kelen
          </span>
          <span className="ml-1 rounded bg-kelen-green-100 px-1.5 py-0.5 text-[10px] font-bold text-kelen-green-700">
            Pro
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-6 md:flex">
          {MARKETING_PRO_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-foreground/70 transition-colors hover:text-kelen-green-600"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/pro/connexion"
            className="text-sm font-medium text-foreground/70 transition-colors hover:text-kelen-green-600"
          >
            Se connecter
          </Link>
          <Link
            href="/pro/inscription"
            className="rounded-lg bg-kelen-green-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-kelen-green-600"
          >
            Créer mon profil →
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 md:hidden rounded-lg text-foreground/70 hover:text-foreground hover:bg-muted transition-colors"
          aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-background px-4 py-6 md:hidden">
          <div className="flex flex-col gap-4">
            {MARKETING_PRO_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="text-base font-medium text-foreground/70 transition-colors hover:text-kelen-green-600"
              >
                {item.label}
              </Link>
            ))}
            <hr className="border-border" />
            <Link
              href="/pro/connexion"
              onClick={() => setMobileOpen(false)}
              className="text-center py-3 text-sm font-medium text-foreground/70 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Se connecter
            </Link>
            <Link
              href="/pro/inscription"
              onClick={() => setMobileOpen(false)}
              className="text-center py-3 text-sm font-bold text-white bg-kelen-green-500 rounded-lg hover:bg-kelen-green-600 transition-colors"
            >
              Créer mon profil →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
```

---

## STEP 4 — Create (marketing-pro) layout

**Action:** CREATE  
**File:** `app/(marketing-pro)/layout.tsx`

```tsx
import { NavbarMarketingPro } from "@/components/layout/NavbarMarketingPro";
import { Footer } from "@/components/layout/Footer";

export default function MarketingProLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavbarMarketingPro />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer />
    </>
  );
}
```

---

## STEP 5 — Convert pour-les-pros to a redirect

**Action:** EDIT  
**File:** `app/(marketing)/pour-les-pros/page.tsx`

Replace the entire file content with:

```tsx
import { redirect } from "next/navigation";

export default function PourLesProPage() {
  redirect("/pour-les-professionnels");
}
```

Note: The redirect in next.config.ts (Step 1) handles the 301 for external links and search engines. This component-level redirect is a safety net for any internal `<Link>` that still points to the old URL.

---

## STEP 6 — Update /tarifs redirect target

**Action:** EDIT  
**File:** `app/(marketing)/tarifs/page.tsx`

Replace the entire file content with:

```tsx
import { redirect } from "next/navigation";

export default function TarifsPage() {
  redirect("/pour-les-professionnels/tarifs");
}
```

---

## STEP 7 — Create FaqAccordion shared component

**Action:** CREATE  
**File:** `components/ui/FaqAccordion.tsx`

This component is used by pro FAQ, client FAQ, and tarifs FAQ. It is a client component for interactivity.

```tsx
"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export interface FaqItem {
  q: string;
  a: string;
}

export interface FaqCategory {
  category: string;
  items: FaqItem[];
}

interface FaqAccordionProps {
  categories: FaqCategory[];
}

export function FaqAccordion({ categories }: FaqAccordionProps) {
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());

  const toggle = (key: string) => {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div className="space-y-10">
      {categories.map((cat) => (
        <section key={cat.category}>
          <h2 className="mb-4 text-lg font-bold text-foreground">{cat.category}</h2>
          <div className="divide-y divide-border rounded-xl border border-border bg-white overflow-hidden">
            {cat.items.map((item, i) => {
              const key = `${cat.category}-${i}`;
              const isOpen = openKeys.has(key);
              return (
                <div key={key}>
                  <button
                    onClick={() => toggle(key)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-foreground hover:bg-muted/40 transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`ml-4 h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
```

---

## STEP 8 — Create pro landing page

**Action:** CREATE  
**File:** `app/(marketing-pro)/pour-les-professionnels/page.tsx`

Source doc: `documentation/Philosophy and Copywriting/marketing-pro.md`

This page is the full SaaS landing for professionals. Fill in sections from `marketing-pro.md`. The structure below is the complete page shell — copy each section's text from the source doc.

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";

export const revalidate = false;

export const metadata: Metadata = {
  title: "Kelen pour les professionnels — Montrez votre travail. Construisez la confiance.",
  description:
    "Créez votre site web professionnel, votre portfolio PDF et votre fiche Google My Business en quelques minutes. Sans designer, sans agence.",
  openGraph: {
    title: "Kelen pour les professionnels",
    description:
      "Montrez votre travail. Construisez la confiance. Développez votre activité.",
    url: "https://kelen.com/pour-les-professionnels",
  },
};

const FEATURES_FREE = [
  "Profil public et site web",
  "Jusqu'à 3 projets affichés",
  "Export PDF portfolio",
  "Visible dans les résultats de recherche Kelen",
  "Badge de statut (Or, Argent, Non classé)",
];

const FEATURES_PAID = [
  "Indexation Google (SEO)",
  "Site web dynamique — toujours à jour",
  "Projets et photos illimités",
  "Synchronisation Google My Business",
  "Statistiques avancées",
  "Module de collaboration client",
  "Sans engagement — annulation à tout moment",
];

const STATUS_TIERS = [
  {
    name: "Non classé",
    condition: "Profil créé, aucune recommandation vérifiée encore",
    color: "bg-stone-50 border-stone-200 text-stone-600",
  },
  {
    name: "Argent ⚪",
    condition: "1–2 recommandations vérifiées, note ≥ 4,0/5, 80%+ positifs",
    color: "bg-stone-100 border-stone-300 text-stone-700",
  },
  {
    name: "Or 🟡",
    condition: "3+ recommandations vérifiées, note ≥ 4,5/5, 90%+ positifs",
    color: "bg-kelen-yellow-50 border-kelen-yellow-500 text-kelen-yellow-800",
  },
];

// Objections from marketing-pro.md — copy exact Q/A from source doc
const OBJECTIONS = [
  {
    q: "J'ai déjà un profil Instagram.",
    a: "Instagram demande de produire du contenu en continu — des reels, des stories, de l'engagement. C'est une posture de créateur de contenu, pas de professionnel. Kelen ne demande pas de produire du contenu. Il demande de documenter votre travail : ajouter des photos d'une réalisation terminée, une description, une date. Votre profil existe pour afficher votre travail — pas pour générer de l'engagement.",
  },
  {
    q: "Je n'ai pas le temps de gérer ça.",
    a: "Kelen ne se gère pas. Vous créez votre profil une fois, vous ajoutez vos projets au fil du temps. Il n'y a pas de fréquence à tenir, pas d'algorithme à satisfaire. Chaque projet ajouté reste visible indéfiniment.",
  },
  {
    q: "Je trouve déjà des clients par le bouche-à-oreille.",
    a: "Le bouche-à-oreille fonctionne dans votre cercle immédiat. Kelen vous permet d'être trouvé par des personnes qui ne vous connaissent pas — et qui cherchent quelqu'un avec votre profil précis. Les deux ne s'excluent pas.",
  },
  {
    q: "Est-ce que le statut Or m'aide à apparaître en premier ?",
    a: "Le statut est une information affichée sur votre profil. Il n'influence pas directement votre position dans les résultats. Un profil Non classé actif depuis plusieurs années peut apparaître avant un profil Or récent. La pertinence, la localisation et le contenu documenté comptent davantage.",
  },
];

export default function PourLesProfessionnelsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">

      {/* ── HERO ── */}
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Montrez votre travail.
          <br />
          <span className="text-kelen-green-600">Construisez la confiance.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          {/* Copy from marketing-pro.md → Hero → Sous-titre */}
          Vous avez des années de travail derrière vous. Kelen vous donne l&apos;endroit pour le montrer. Un site web, un PDF portfolio, une fiche Google — tous générés depuis un seul profil.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/pro/inscription"
            className="rounded-lg bg-kelen-green-500 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-kelen-green-600"
          >
            Créer mon profil gratuitement
          </Link>
          <Link
            href="/pour-les-professionnels/comment-ca-marche"
            className="rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Comment ça marche
          </Link>
        </div>
      </div>

      {/* ── REASSURANCE BAND ── */}
      {/* Copy from marketing-pro.md → Bande de réassurance */}
      <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground">
        {[
          "Gratuit pour commencer",
          "Sans carte bancaire",
          "Profil en ligne en 10 minutes",
          "PDF portfolio inclus",
          "Visible sur Kelen dès le premier jour",
        ].map((item) => (
          <span key={item} className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-kelen-green-500" />
            {item}
          </span>
        ))}
      </div>

      {/* ── PROBLEM ── */}
      {/* Copy from marketing-pro.md → Section Problème */}
      <section className="mt-24 grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-white p-6">
          <p className="text-base font-semibold text-foreground">
            Vous avez des années de travail derrière vous.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Il n&apos;existe aucun endroit pour le montrer. Pas vraiment. Les photos sont sur votre téléphone. Les clients vous connaissent — mais les nouveaux ne peuvent pas vous trouver.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-6">
          <p className="text-base font-semibold text-foreground">
            Quand un nouveau client vous contacte, vous devez vous vendre.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Expliquer ce que vous faites, envoyer des photos sur WhatsApp, donner des références. Un profil Kelen remplace tout ça — le client arrive déjà informé.
          </p>
        </div>
      </section>

      {/* ── 3 OUTPUTS ── */}
      {/* Copy from marketing-pro.md → Section Fonctionnalités → Site web / PDF / GMB */}
      <section className="mt-24">
        <h2 className="text-center text-2xl font-bold text-foreground">
          Trois sorties depuis un seul profil
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted-foreground">
          Vous remplissez votre profil une fois. Kelen génère tout.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            {
              title: "Site web professionnel",
              desc: "Partageable par lien. Indexé sur Google avec l'abonnement. Toujours à jour.",
            },
            {
              title: "PDF portfolio",
              desc: "Exportable en un clic. Envoyable sur WhatsApp. Imprimable pour un rendez-vous.",
            },
            {
              title: "Fiche Google My Business",
              desc: "Votre présence locale synchronisée avec votre profil. Avec l'abonnement.",
            },
          ].map((output) => (
            <div key={output.title} className="rounded-xl border border-border bg-white p-6">
              <h3 className="font-semibold text-foreground">{output.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{output.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      {/* Copy from marketing-pro.md → Comment ça marche */}
      <section className="mt-24">
        <h2 className="text-center text-2xl font-bold text-foreground">Comment ça marche</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            {
              step: "1",
              title: "Créez votre profil",
              desc: "Nom, métier, ville, téléphone. Ajoutez vos premières photos de réalisations. L'IA génère votre texte de présentation.",
            },
            {
              step: "2",
              title: "Documentez votre travail",
              desc: "Ajoutez vos projets terminés : photos, description, localisation. Chaque projet renforce votre profil.",
            },
            {
              step: "3",
              title: "Activez Google",
              desc: "Avec l'abonnement, votre profil est indexé sur Google. Vos nouveaux clients vous trouvent directement dans les recherches.",
            },
          ].map((step) => (
            <div key={step.step} className="rounded-xl border border-border bg-white p-6">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-kelen-green-50 text-sm font-bold text-kelen-green-700">
                {step.step}
              </span>
              <h3 className="mt-3 font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── STATUS ── */}
      <section className="mt-24">
        <h2 className="text-center text-2xl font-bold text-foreground">
          Un statut qui se construit
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted-foreground">
          Calculé automatiquement à partir de vos recommandations vérifiées. Il ne s&apos;achète pas. L&apos;abonnement n&apos;a aucun effet sur lui.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {STATUS_TIERS.map((tier) => (
            <div key={tier.name} className={`rounded-xl border p-6 ${tier.color}`}>
              <h3 className="text-lg font-bold">{tier.name}</h3>
              <p className="mt-2 text-sm opacity-80">{tier.condition}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="mt-24">
        <h2 className="text-center text-3xl font-bold text-foreground">Gratuit pour commencer. Payant pour aller plus loin.</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
          Présent sur Kelen dès le premier jour. Sur Google avec l&apos;abonnement.
        </p>
        <div className="mt-16 mx-auto max-w-4xl grid gap-8 lg:grid-cols-2 lg:items-start">
          {/* Free */}
          <div className="rounded-3xl border border-border bg-white p-8 shadow-sm">
            <h3 className="text-xl font-bold text-foreground">Gratuit</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Votre profil en ligne, visible dans les résultats Kelen dès le premier jour.
            </p>
            <p className="mt-6 text-4xl font-bold tracking-tight text-foreground">
              0 <span className="text-sm font-semibold text-muted-foreground">/ à vie</span>
            </p>
            <ul className="mt-8 space-y-3">
              {FEATURES_FREE.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 flex-shrink-0 text-kelen-green-600" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/pro/inscription"
              className="mt-8 block w-full rounded-xl border border-border px-4 py-3 text-center text-sm font-semibold text-stone-600 hover:bg-muted transition-colors"
            >
              Commencer gratuitement
            </Link>
          </div>

          {/* Paid */}
          <div className="relative rounded-3xl border-2 border-kelen-green-500 bg-white p-8 shadow-xl shadow-kelen-green-100">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-kelen-green-500 px-4 py-1 text-xs font-bold uppercase tracking-wider text-white">
              Abonnement
            </div>
            <h3 className="text-xl font-bold text-foreground">Kelen Pro</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Indexé sur Google. Site dynamique. Fonctionnalités avancées débloquées.
            </p>
            <p className="mt-6 text-4xl font-bold tracking-tight text-foreground">
              15 € <span className="text-sm font-semibold text-muted-foreground">/ mois</span>
            </p>
            <ul className="mt-8 space-y-3">
              {FEATURES_PAID.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 flex-shrink-0 text-kelen-green-600" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/pro/inscription"
              className="mt-8 block w-full rounded-xl bg-kelen-green-500 px-4 py-3 text-center text-sm font-bold text-white hover:bg-kelen-green-600 transition-colors"
            >
              Activer l&apos;abonnement
            </Link>
          </div>
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Professionnels en Afrique de l&apos;Ouest :{" "}
          <span className="font-bold text-foreground">3 000 FCFA / mois</span>{" "}
          via Wave, Orange Money ou MTN Mobile Money.
        </p>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Ce que l&apos;abonnement ne change jamais : votre statut (Or, Argent, Non classé), votre visibilité sur Kelen.{" "}
          <Link href="/pour-les-professionnels/tarifs" className="text-kelen-green-600 hover:underline">
            Voir la comparaison complète →
          </Link>
        </p>
      </section>

      {/* ── OBJECTIONS ── */}
      <section className="mt-24">
        <h2 className="text-center text-2xl font-bold text-foreground">Questions fréquentes</h2>
        <div className="mt-10 divide-y divide-border rounded-xl border border-border bg-white overflow-hidden">
          {OBJECTIONS.map((obj) => (
            <div key={obj.q} className="px-6 py-5">
              <p className="font-semibold text-foreground text-sm">{obj.q}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{obj.a}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/pour-les-professionnels/faq" className="text-kelen-green-600 hover:underline">
            Voir toutes les questions →
          </Link>
        </p>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="mt-24 rounded-2xl bg-kelen-green-500 p-8 sm:p-12 text-center">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          Votre travail mérite d&apos;être vu.
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-kelen-green-100">
          Créez votre profil. Documentez vos réalisations. Activez Google quand vous êtes prêt.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/pro/inscription"
            className="rounded-lg bg-white px-8 py-3 text-sm font-bold text-kelen-green-700 hover:bg-kelen-green-50 transition-colors"
          >
            Créer mon profil gratuitement
          </Link>
          <Link
            href="/pour-les-professionnels/comment-ca-marche"
            className="rounded-lg border border-white/30 px-8 py-3 text-sm font-medium text-white hover:bg-white/10 transition-colors"
          >
            Comment ça marche
          </Link>
        </div>
      </section>
    </div>
  );
}
```

---

## STEP 9 — Create pro Comment ça marche page

**Action:** CREATE  
**File:** `app/(marketing-pro)/pour-les-professionnels/comment-ca-marche/page.tsx`

Source doc: `documentation/Philosophy and Copywriting/pro-pages.md` → Section `/comment-ca-marche`

Read the source doc and fill in the 7 sections listed below. The shell:

```tsx
import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = false;

export const metadata: Metadata = {
  title: "Comment ça marche — Kelen pour les professionnels",
  description:
    "Comment Kelen fonctionne pour les professionnels : profil, site web, PDF, Google My Business, recommandations et collaboration client.",
};

// Fill SECTIONS array from pro-pages.md → /comment-ca-marche
// Each section: { title: string, content: string | React.ReactNode }
// 7 sections:
// 1. Le profil — votre source unique
// 2. Le site web (free vs paid)
// 3. Le portfolio PDF
// 4. La fiche Google My Business
// 5. Le copywriting par l'IA
// 6. Les recommandations et le statut
// 7. La collaboration client

const SECTIONS = [
  {
    title: "Le profil — votre source unique",
    content:
      "Tout part de votre profil Kelen. Vous remplissez vos informations une fois — nom, métier, ville, description, photos de réalisations, services. À partir de là, Kelen génère votre site web, votre PDF portfolio et votre fiche Google My Business. Pas de duplication. Pas de mise à jour multiple. Une seule source.",
  },
  {
    title: "Le site web",
    content:
      "Dès votre inscription, vous disposez d'un site web accessible par lien et visible dans les résultats de recherche Kelen. Avec l'abonnement : votre site est indexé sur Google, mis à jour dynamiquement à chaque chargement, et entièrement personnalisable (couleurs, style, sections). Sans abonnement : rendu statique, non indexé Google, 3 projets maximum.",
  },
  {
    title: "Le portfolio PDF",
    content:
      "Exportable depuis votre tableau de bord en un clic. Le PDF contient vos réalisations, vos services, vos coordonnées et votre QR code. Envoyable sur WhatsApp, par email, ou imprimable pour un rendez-vous client. Disponible sur le plan gratuit.",
  },
  {
    title: "La fiche Google My Business",
    content:
      "Avec l'abonnement, Kelen synchronise votre profil avec Google My Business — votre présence dans les recherches locales Google. Vos photos de réalisations, votre description et vos coordonnées sont synchronisées automatiquement.",
  },
  {
    title: "Le copywriting par l'IA",
    content:
      "Lors de la création de votre profil, Kelen vous pose 4 questions sur votre métier et votre clientèle. À partir de vos réponses, l'IA génère votre accroche (titre du site) et votre texte À propos. Vous pouvez les modifier à tout moment.",
  },
  {
    title: "Les recommandations et le statut",
    content:
      "Vos clients peuvent vous recommander directement depuis votre profil public. Chaque recommandation vérifiée contribue à votre statut : Non classé → Argent (1–2 recs, note ≥ 4,0/5, 80%+ positifs) → Or (3+ recs, note ≥ 4,5/5, 90%+ positifs). Le statut est affiché sur votre profil. Il ne s'achète pas et n'est pas lié à l'abonnement.",
  },
  {
    title: "La collaboration client",
    content:
      "Avec l'abonnement, vous pouvez inviter vos clients à rejoindre un projet partagé. Ils voient l'avancement, les rapports de chantier, les documents. Vous pouvez recevoir leur approbation ou leurs retours directement dans Kelen.",
  },
];

export default function ProCommentCaMarche() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Comment ça marche
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Tout ce que vous devez savoir avant de créer votre profil.
        </p>
      </div>

      <div className="mt-16 space-y-10">
        {SECTIONS.map((section, i) => (
          <section key={section.title} className="rounded-xl border border-border bg-white p-6">
            <div className="flex items-start gap-4">
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-kelen-green-50 text-xs font-bold text-kelen-green-700">
                {i + 1}
              </span>
              <div>
                <h2 className="text-base font-semibold text-foreground">{section.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{section.content}</p>
              </div>
            </div>
          </section>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap justify-center gap-4">
        <Link
          href="/pro/inscription"
          className="rounded-lg bg-kelen-green-500 px-6 py-3 text-sm font-bold text-white hover:bg-kelen-green-600 transition-colors"
        >
          Créer mon profil gratuitement →
        </Link>
        <Link
          href="/pour-les-professionnels/tarifs"
          className="rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          Voir les tarifs →
        </Link>
      </div>
    </div>
  );
}
```

---

## STEP 10 — Create pro Tarifs page

**Action:** CREATE  
**File:** `app/(marketing-pro)/pour-les-professionnels/tarifs/page.tsx`

Source doc: `documentation/Philosophy and Copywriting/pro-pages.md` → Section `/tarifs`

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { FaqAccordion, type FaqCategory } from "@/components/ui/FaqAccordion";

export const revalidate = false;

export const metadata: Metadata = {
  title: "Tarifs — Kelen pour les professionnels",
  description:
    "Présent sur Kelen gratuitement. Indexé sur Google avec l'abonnement à 3 000 FCFA ou 15 € par mois. Sans engagement.",
};

// Copy comparison rows from pro-pages.md → /tarifs → Tableau de comparaison
// Each row: { label, free, paid }
// true = ✓, false = —, string = value displayed directly
const COMPARISON_ROWS: { category: string; rows: { label: string; free: boolean | string; paid: boolean | string }[] }[] = [
  {
    category: "Présence",
    rows: [
      { label: "Profil public et site web", free: true, paid: true },
      { label: "Visible dans les résultats Kelen", free: true, paid: true },
      { label: "Indexation Google (SEO)", free: false, paid: true },
      { label: "Rendu du site", free: "Statique (SSG)", paid: "Dynamique (SSR)" },
    ],
  },
  {
    category: "Contenu",
    rows: [
      { label: "Projets portfolio", free: "3 maximum", paid: "Illimité" },
      { label: "Photos", free: "15 maximum", paid: "Illimité" },
      { label: "Vidéos", free: false, paid: true },
      { label: "Services et produits", free: true, paid: true },
    ],
  },
  {
    category: "Sorties",
    rows: [
      { label: "Export PDF portfolio", free: true, paid: true },
      { label: "Export PDF catalogue", free: true, paid: true },
      { label: "Synchronisation Google My Business", free: false, paid: true },
      { label: "Personnalisation du site (couleurs, style)", free: false, paid: true },
      { label: "Domaine personnalisé", free: false, paid: true },
    ],
  },
  {
    category: "Collaboration et analytics",
    rows: [
      { label: "Module de collaboration client", free: false, paid: true },
      { label: "Journal de chantier", free: true, paid: true },
      { label: "Statistiques de base", free: true, paid: true },
      { label: "Statistiques avancées (6 mois, sources de trafic)", free: false, paid: true },
      { label: "Newsletter clients", free: false, paid: true },
    ],
  },
  {
    category: "Réputation",
    rows: [
      { label: "Recommandations reçues", free: true, paid: true },
      { label: "Badge de statut (Or, Argent, Non classé)", free: true, paid: true },
    ],
  },
];

// FAQ from pro-pages.md → /tarifs → FAQ tarifs
const TARIFS_FAQ: FaqCategory[] = [
  {
    category: "Questions sur le paiement",
    items: [
      {
        q: "Comment annuler mon abonnement ?",
        a: "Depuis votre tableau de bord → Abonnement → Gérer mon abonnement. L'annulation est immédiate. Vous conservez l'accès aux fonctionnalités payantes jusqu'à la fin de la période en cours.",
      },
      {
        q: "Que se passe-t-il si j'annule ?",
        a: "Votre profil reste en ligne et visible sur Kelen. Vous perdez l'indexation Google, le rendu dynamique et les fonctionnalités avancées. Votre contenu, vos réalisations et vos recommandations sont conservés.",
      },
      {
        q: "Est-ce que le statut Or ou Argent change avec l'abonnement ?",
        a: "Non. Le statut dépend uniquement de vos recommandations vérifiées. L'abonnement n'a aucun effet sur lui.",
      },
      {
        q: "Quels moyens de paiement sont acceptés ?",
        a: "En Europe : carte bancaire via Stripe. En Afrique de l'Ouest : Wave, Orange Money, MTN Mobile Money (3 000 FCFA / mois).",
      },
      {
        q: "Y a-t-il un engagement minimum ?",
        a: "Non. Vous pouvez annuler à tout moment, sans frais ni préavis.",
      },
      {
        q: "Mon profil est-il visible immédiatement après l'inscription ?",
        a: "Oui. Votre profil est visible dans les résultats de recherche Kelen dès votre inscription, que vous soyez abonné ou non. L'abonnement ajoute l'indexation Google.",
      },
    ],
  },
];

function CellValue({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="mx-auto h-4 w-4 text-kelen-green-600" />;
  if (value === false) return <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" />;
  return <span className="text-xs text-muted-foreground">{value}</span>;
}

export default function ProTarifsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Tarifs</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Présent sur Kelen dès le premier jour. Sur Google avec l&apos;abonnement.
        </p>
      </div>

      {/* Price cards */}
      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-white p-6 text-center">
          <h2 className="text-lg font-bold text-foreground">Gratuit</h2>
          <p className="mt-1 text-3xl font-bold">0</p>
          <p className="text-sm text-muted-foreground">à vie</p>
          <Link href="/pro/inscription" className="mt-4 block rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-stone-600 hover:bg-muted transition-colors">
            Commencer gratuitement
          </Link>
        </div>
        <div className="rounded-2xl border-2 border-kelen-green-500 bg-white p-6 text-center">
          <h2 className="text-lg font-bold text-foreground">Kelen Pro</h2>
          <p className="mt-1 text-3xl font-bold">15 €</p>
          <p className="text-sm text-muted-foreground">/ mois — ou 3 000 FCFA</p>
          <Link href="/pro/inscription" className="mt-4 block rounded-lg bg-kelen-green-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-kelen-green-600 transition-colors">
            Activer l&apos;abonnement
          </Link>
        </div>
      </div>

      {/* Comparison table */}
      <div className="mt-16">
        <h2 className="mb-6 text-xl font-bold text-foreground">Comparaison complète</h2>
        {COMPARISON_ROWS.map((group) => (
          <div key={group.category} className="mb-8">
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">{group.category}</h3>
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Fonctionnalité</th>
                    <th className="w-24 px-4 py-2.5 text-center font-medium text-muted-foreground">Gratuit</th>
                    <th className="w-24 px-4 py-2.5 text-center font-medium text-kelen-green-700">Pro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                  {group.rows.map((row) => (
                    <tr key={row.label}>
                      <td className="px-4 py-3 text-foreground">{row.label}</td>
                      <td className="px-4 py-3 text-center"><CellValue value={row.free} /></td>
                      <td className="px-4 py-3 text-center"><CellValue value={row.paid} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* What subscription never changes */}
      <div className="mt-12 rounded-xl border border-border bg-white p-6">
        <h2 className="font-semibold text-foreground">Ce que l&apos;abonnement ne change jamais</h2>
        <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
          <li>— Votre statut (Or, Argent, Non classé) : uniquement lié à vos recommandations vérifiées</li>
          <li>— Votre visibilité dans les résultats de recherche Kelen</li>
          <li>— Le contenu de votre profil : il reste intact si vous annulez</li>
        </ul>
      </div>

      {/* FAQ */}
      <div className="mt-16">
        <h2 className="mb-8 text-xl font-bold text-foreground">Questions sur les tarifs</h2>
        <FaqAccordion categories={TARIFS_FAQ} />
      </div>

      <div className="mt-12 text-center">
        <Link href="/pro/inscription" className="rounded-lg bg-kelen-green-500 px-8 py-3 text-sm font-bold text-white hover:bg-kelen-green-600 transition-colors">
          Créer mon profil gratuitement →
        </Link>
      </div>
    </div>
  );
}
```

---

## STEP 11 — Create pro FAQ page

**Action:** CREATE  
**File:** `app/(marketing-pro)/pour-les-professionnels/faq/page.tsx`

Source doc: `documentation/Philosophy and Copywriting/pro-pages.md` → Section `/faq`

Read the source doc for all Q/A pairs. Fill the `FAQ_CATEGORIES` array below with the content from the doc. The structure and component are provided here.

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { FaqAccordion, type FaqCategory } from "@/components/ui/FaqAccordion";

export const revalidate = false;

export const metadata: Metadata = {
  title: "FAQ — Kelen pour les professionnels",
  description: "Toutes les réponses aux questions fréquentes des professionnels sur Kelen.",
};

// Fill from pro-pages.md → /faq
// 6 categories:
// 1. Avant de s'inscrire (4 questions)
// 2. Profil et visibilité (5 questions)
// 3. Portfolio et contenu (4 questions)
// 4. Recommandations et statut (6 questions)
// 5. Abonnement et paiement (4 questions)
// 6. Technique (3 questions)
const FAQ_CATEGORIES: FaqCategory[] = [
  {
    category: "Avant de s'inscrire",
    items: [
      {
        q: "Kelen est-il vraiment gratuit ?",
        a: "Oui. Votre profil est gratuit, sans limite de durée. Il inclut votre site web, l'accès aux résultats de recherche Kelen, l'export PDF et jusqu'à 3 projets. L'abonnement ajoute l'indexation Google et les fonctionnalités avancées.",
      },
      {
        q: "Pour quel type de professionnel Kelen est-il fait ?",
        a: "Tout professionnel qui livre un travail physique ou une prestation de service : artisans, prestataires du bâtiment, architectes, designers, photographes, traducteurs, consultants, et plus. Si vous pouvez montrer ce que vous faites, Kelen est fait pour vous.",
      },
      {
        q: "Est-ce que je dois avoir un site web existant ?",
        a: "Non. Kelen crée votre site web à partir de votre profil. Vous n'avez besoin de rien d'autre.",
      },
      {
        q: "Combien de temps faut-il pour créer un profil ?",
        a: "Entre 10 et 20 minutes pour un profil complet avec photos. L'essentiel — nom, métier, ville, téléphone — prend moins de 5 minutes.",
      },
    ],
  },
  {
    category: "Profil et visibilité",
    items: [
      {
        q: "Mon profil est-il visible immédiatement ?",
        a: "Oui. Dès votre inscription, votre profil est accessible par lien et visible dans les résultats de recherche Kelen. L'indexation Google est activée avec l'abonnement.",
      },
      {
        q: "Quelle est la différence entre le rendu statique et dynamique ?",
        a: "Le rendu statique (gratuit) génère votre page une fois et la sert telle quelle. Le rendu dynamique (abonnement) recharge votre profil à chaque visite — vos dernières réalisations sont toujours visibles immédiatement.",
      },
      {
        q: "Puis-je avoir un domaine personnalisé ?",
        a: "Oui, avec l'abonnement. Vous pouvez connecter votre propre nom de domaine (ex: monsiteweb.com) à votre profil Kelen.",
      },
      {
        q: "Est-ce que je peux personnaliser le style de mon site ?",
        a: "Oui, avec l'abonnement. Vous pouvez choisir les couleurs, le style des coins, et les sections affichées. Sans abonnement, le site utilise le style par défaut Kelen.",
      },
      {
        q: "Si j'annule mon abonnement, que devient mon profil ?",
        a: "Votre profil reste en ligne et visible sur Kelen. Vous perdez l'indexation Google et les fonctionnalités avancées. Tout votre contenu est conservé.",
      },
    ],
  },
  {
    category: "Portfolio et contenu",
    items: [
      {
        q: "Combien de projets puis-je ajouter ?",
        a: "3 projets avec le plan gratuit. Illimité avec l'abonnement.",
      },
      {
        q: "Quels types de fichiers puis-je uploader ?",
        a: "Photos (JPG, PNG, WebP) sur tous les plans. Vidéos avec l'abonnement.",
      },
      {
        q: "Comment fonctionne le PDF portfolio ?",
        a: "Depuis votre tableau de bord, vous cliquez sur « Exporter le PDF ». Le PDF est généré instantanément à partir de votre profil. Il contient vos réalisations, vos services, vos coordonnées et un QR code vers votre profil. Disponible sur le plan gratuit.",
      },
      {
        q: "Puis-je choisir quels projets apparaissent sur mon site ?",
        a: "Oui. Vous contrôlez la visibilité de chaque projet depuis votre tableau de bord.",
      },
    ],
  },
  {
    category: "Recommandations et statut",
    items: [
      {
        q: "Comment mes clients me recommandent-ils ?",
        a: "Via le lien de recommandation accessible depuis votre profil public. Vos clients cliquent sur « Recommander ce professionnel », remplissent un formulaire court, et la recommandation est soumise à vérification.",
      },
      {
        q: "Qu'est-ce que la vérification d'une recommandation ?",
        a: "L'équipe Kelen vérifie que la recommandation provient d'un vrai client, avec un projet réel. Les recommandations non vérifiées ne comptent pas dans le calcul du statut.",
      },
      {
        q: "Comment le statut est-il calculé ?",
        a: "Automatiquement par le système. Or : 3+ recommandations vérifiées, note ≥ 4,5/5, 90%+ positifs. Argent : 1–2 recommandations vérifiées, note ≥ 4,0/5, 80%+ positifs. Non classé : aucune recommandation vérifiée.",
      },
      {
        q: "L'abonnement améliore-t-il mon statut ?",
        a: "Non. Le statut dépend uniquement de vos recommandations vérifiées. L'abonnement n'a aucun effet.",
      },
      {
        q: "Le statut influence-t-il ma position dans les résultats ?",
        a: "Le statut est une information affichée sur votre profil. Il n'est pas un facteur de classement direct. La pertinence du profil, la localisation et la richesse du contenu comptent davantage.",
      },
      {
        q: "Puis-je recommander un autre professionnel ?",
        a: "Oui. Même un professionnel qui n'est pas encore inscrit sur Kelen. La recommandation externe lui est transmise, et l'invitation à rejoindre la plateforme lui est envoyée.",
      },
    ],
  },
  {
    category: "Abonnement et paiement",
    items: [
      {
        q: "Comment annuler mon abonnement ?",
        a: "Depuis votre tableau de bord → Abonnement → Gérer mon abonnement. L'annulation est immédiate. Vous conservez l'accès aux fonctionnalités payantes jusqu'à la fin de la période en cours.",
      },
      {
        q: "Quels moyens de paiement sont acceptés ?",
        a: "En Europe : carte bancaire via Stripe. En Afrique de l'Ouest : Wave, Orange Money, MTN Mobile Money.",
      },
      {
        q: "Y a-t-il un engagement minimum ?",
        a: "Non. Sans engagement. Annulation possible à tout moment.",
      },
      {
        q: "Puis-je passer du plan gratuit à l'abonnement plus tard ?",
        a: "Oui. Depuis votre tableau de bord → Abonnement → Activer l'abonnement. Vos données, projets et recommandations existants sont conservés.",
      },
    ],
  },
  {
    category: "Technique",
    items: [
      {
        q: "Kelen fonctionne-t-il sur mobile ?",
        a: "Oui. L'application est installable sur mobile (PWA). Elle fonctionne hors-ligne pour la saisie des rapports de chantier.",
      },
      {
        q: "Comment fonctionne la synchronisation Google My Business ?",
        a: "Avec l'abonnement, vous connectez votre compte Google My Business depuis votre tableau de bord. Kelen synchronise vos photos de réalisations et votre description automatiquement.",
      },
      {
        q: "Mes données sont-elles sécurisées ?",
        a: "Oui. Vos données sont hébergées sur des serveurs sécurisés. Consultez notre politique de confidentialité pour les détails.",
      },
    ],
  },
];

export default function ProFaqPage() {
  return (
    <>
      {/* JSON-LD for Google FAQ rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ_CATEGORIES.flatMap((cat) =>
              cat.items.map(({ q, a }) => ({
                "@type": "Question",
                name: q,
                acceptedAnswer: { "@type": "Answer", text: a },
              }))
            ),
          }),
        }}
      />

      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Questions fréquentes
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Tout ce que vous devez savoir sur Kelen pour les professionnels.
          </p>
        </div>

        <div className="mt-12">
          <FaqAccordion categories={FAQ_CATEGORIES} />
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Vous ne trouvez pas votre réponse ?{" "}
            <Link href="/pour-les-professionnels/contact" className="text-kelen-green-600 hover:underline font-medium">
              Contactez-nous →
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
```

---

## STEP 12 — Create pro Contact page

**Action:** CREATE  
**File:** `app/(marketing-pro)/pour-les-professionnels/contact/page.tsx`

Source doc: `documentation/Philosophy and Copywriting/pro-pages.md` → Section `/contact`

```tsx
import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = false;

export const metadata: Metadata = {
  title: "Contact — Kelen pour les professionnels",
  description: "Contactez l'équipe Kelen pour toute question sur votre profil, votre abonnement ou un problème technique.",
};

// Fill contact channels from pro-pages.md → /contact
// Each channel: situation + email + délai de réponse
const CHANNELS = [
  {
    situation: "Inscription et création de profil",
    desc: "Questions avant de commencer, aide à la configuration initiale.",
    email: "support@kelen.com",
    delay: "Réponse sous 24h",
  },
  {
    situation: "Abonnement et facturation",
    desc: "Activation, annulation, problème de paiement, facture.",
    email: "abonnement@kelen.com",
    delay: "Réponse sous 24h",
  },
  {
    situation: "Problème sur votre profil ou vos réalisations",
    desc: "Contenu non affiché, erreur, bug, photo non chargée.",
    email: "support@kelen.com",
    delay: "Réponse sous 48h",
  },
  {
    situation: "Recommandation en cours de vérification",
    desc: "Une recommandation que vous attendez n'apparaît pas.",
    email: "recommandations@kelen.com",
    delay: "Réponse sous 48h",
  },
  {
    situation: "Partenariats et presse",
    desc: "Organisations professionnelles, médias, chambres de commerce.",
    email: "partenariats@kelen.com",
    delay: "Réponse sous 5 jours ouvrés",
  },
  {
    situation: "Suppression de compte et données",
    desc: "Demande de suppression de compte ou d'export de données (RGPD).",
    email: "donnees@kelen.com",
    delay: "Réponse sous 72h",
  },
];

export default function ProContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Contact</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Trouvez le bon canal selon votre situation. Pas de formulaire — un email direct à la bonne adresse.
        </p>
      </div>

      <div className="mt-12 space-y-4">
        {CHANNELS.map((channel) => (
          <div key={channel.situation} className="rounded-xl border border-border bg-white p-6">
            <h2 className="font-semibold text-foreground">{channel.situation}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{channel.desc}</p>
            <div className="mt-4 flex items-center justify-between">
              <a
                href={`mailto:${channel.email}`}
                className="text-sm font-medium text-kelen-green-600 hover:underline"
              >
                {channel.email}
              </a>
              <span className="text-xs text-muted-foreground">{channel.delay}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-border bg-muted/30 p-5 text-sm text-muted-foreground">
        <p>
          Avant d&apos;écrire, consultez la{" "}
          <Link href="/pour-les-professionnels/faq" className="text-kelen-green-600 hover:underline">
            FAQ
          </Link>{" "}
          — la plupart des questions y ont une réponse immédiate.
        </p>
      </div>
    </div>
  );
}
```

---

## STEP 13 — Update client pages for client-specific copy

The three client pages currently exist but may contain mixed or outdated copy. Update each one.

### 13a — Client Comment ça marche

**Action:** EDIT  
**File:** `app/(marketing)/comment-ca-marche/page.tsx`

Read the current file. If it already contains client-specific copy (how to search, how to read a profile, how to create a project, how to submit a recommendation), keep it. If it contains pro content or mixed content, replace using `marketing-client.md` → Section `/comment-ca-marche` as source.

Verify the page has these 7 sections:
1. Chercher un professionnel
2. Lire un profil
3. Comprendre le statut
4. Créer un projet
5. Collaborer avec un professionnel
6. Soumettre une recommandation
7. Ce que Kelen fait — et ne fait pas

If any section is missing or contains pro-side content, rewrite it from `marketing-client.md`.

Verify the bottom CTA links to `/recherche` (not to pro pages).

Verify metadata:
```ts
export const metadata: Metadata = {
  title: "Comment ça marche — Kelen",
  description: "Comment trouver un professionnel de confiance sur Kelen, consulter ses réalisations et collaborer sur votre projet.",
};
```

### 13b — Client FAQ

**Action:** EDIT  
**File:** `app/(marketing)/faq/page.tsx`

Read the current file. Replace or verify content comes from `marketing-client.md` → Section `/faq`.

The page must import `FaqAccordion` from `@/components/ui/FaqAccordion`.

5 categories:
1. Trouver un professionnel
2. Comprendre les profils et le statut
3. Projets et collaboration
4. Recommandations
5. Compte et données

Metadata:
```ts
export const metadata: Metadata = {
  title: "FAQ — Kelen",
  description: "Toutes les réponses aux questions fréquentes sur la recherche de professionnels et la gestion de projets sur Kelen.",
};
```

Add JSON-LD structured data (same pattern as pro FAQ page — see Step 11).

### 13c — Client Contact

**Action:** EDIT  
**File:** `app/(marketing)/contact/page.tsx`

Read the current file. Replace or verify content comes from `marketing-client.md` → Section `/contact`.

5 channels (client-side situations):
1. Avant inscription / questions générales
2. Problème avec un profil pro
3. Recommandation contestée
4. Compte et données personnelles
5. RGPD — demande d'accès ou suppression

Metadata:
```ts
export const metadata: Metadata = {
  title: "Contact — Kelen",
  description: "Contactez l'équipe Kelen pour toute question sur la recherche de professionnels ou votre compte.",
};
```

---

## STEP 14 — Verify the Footer links

**Action:** VERIFY  
**File:** `components/layout/Footer.tsx`

Open the file. Find any link that points to `/pour-les-pros` and update it to `/pour-les-professionnels`. Find any link pointing to `/tarifs` and update it to `/pour-les-professionnels/tarifs`.

If the Footer imports `FOOTER_LINKS` from constants, this was already fixed in Step 2. Verify there are no hardcoded `/pour-les-pros` or `/tarifs` links in the Footer JSX.

---

## Verification checklist

After all steps are complete, run through this list:

```
□ http://localhost:3000/                           → loads, client navbar with search links
□ http://localhost:3000/pour-les-pros              → redirects to /pour-les-professionnels (301)
□ http://localhost:3000/tarifs                     → redirects to /pour-les-professionnels/tarifs (301)
□ http://localhost:3000/pour-les-professionnels    → loads with NavbarMarketingPro (Kelen Pro badge, no search bar, "Créer mon profil →" CTA)
□ http://localhost:3000/pour-les-professionnels/comment-ca-marche → loads, 7 numbered sections
□ http://localhost:3000/pour-les-professionnels/tarifs            → loads, comparison table + FAQ
□ http://localhost:3000/pour-les-professionnels/faq               → loads, accordion, JSON-LD present in source
□ http://localhost:3000/pour-les-professionnels/contact           → loads, 6 contact channels
□ http://localhost:3000/comment-ca-marche          → loads with client navbar
□ http://localhost:3000/faq                        → loads with client navbar
□ http://localhost:3000/contact                    → loads with client navbar
□ MARKETING_PRO_NAV links in NavbarMarketingPro all resolve
□ MARKETING_NAV links in Navbar.tsx updated (no /pour-les-pros, no /tarifs)
□ Footer has no broken links
□ TypeScript: no type errors (run npx tsc --noEmit)
```

---

## Files NOT to touch

Do not modify:
- `app/(professional)/` — authenticated pro dashboard
- `app/(client)/` — authenticated client dashboard
- `app/(pro-site)/` — public professional profile pages
- `components/layout/ProNavbar.tsx` — this is the dashboard navbar, not the marketing pro navbar
- `components/layout/DashboardSidebar.tsx`
- Any Supabase-related files
- Any auth-related files
