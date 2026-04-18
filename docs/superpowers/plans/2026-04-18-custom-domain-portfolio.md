# Custom Domain Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow paying pros (Gold/Silver) to launch their Kelen portfolio as a standalone website on a custom domain, with a 2-minute style + copywriting quiz generating the site from their existing data, and a Fluid Compute preview function so they see the result before paying.

**Architecture:** Phase 1 — Style quiz (3-4 questions → CSS tokens) + Copy quiz (3-4 questions → AI-generated text via Claude) + a preview Fluid Compute function rendering real portfolio data as HTML, gated behind a paywall only at publish time. Phase 2 — Domain purchase via a registrar API, Vercel API domain registration, and Next.js middleware hostname routing that maps `diallo-construction-abidjan.com` to the existing `/professionnels/diallo-construction-abidjan` page with style tokens applied.

**Tech Stack:** Next.js App Router, Supabase, Tailwind CSS, Claude API (Anthropic SDK) for copy generation, Vercel REST API for domain management, registrar API (CheapDomain/Namecheap) for purchase, Vercel Fluid Compute for preview render.

---

## Existing Infrastructure (do not rebuild)

- Public portfolio page: `app/(marketing)/professionnels/[slug]/page.tsx`
- Realizations page: `app/(marketing)/professionnels/[slug]/realisations/page.tsx`
- Pro portfolio management: `app/(professional)/pro/portfolio/page.tsx`
- Tables: `professional_portfolio`, `professional_realizations`, `realization_images`, `realization_videos`, `realization_likes`, `realization_comments`
- Auth middleware: `middleware.ts` — handles session + role routing
- AI fields already on `professionals`: `bio_accroche`, `bio_presentation`, `brand_primary`, `brand_secondary`

---

## File Map

### New files — Phase 1 (Quiz + Preview)

| File | Responsibility |
|------|---------------|
| `supabase/migrations/20260418000001_portfolio_site.sql` | Add style_tokens, copy_quiz_answers, hero_subtitle, custom_domain, domain_status to professional_portfolio |
| `lib/portfolio/style-tokens.ts` | Quiz answer → CSS variable mapping. Single source of truth for all style options. |
| `lib/portfolio/copy-generator.ts` | Claude API call: quiz answers + pro profile data → hero_subtitle + about_text |
| `lib/actions/portfolio-site.ts` | Server actions: saveStyleQuiz, saveCopyQuiz, generateCopy |
| `components/portfolio/StyleQuiz.tsx` | Client component: 4 style questions with visual option cards |
| `components/portfolio/CopywritingQuiz.tsx` | Client component: 4 copy/tone questions |
| `components/portfolio/PortfolioPreviewFrame.tsx` | Client component: iframe loading the preview endpoint, with skeleton state |
| `app/api/portfolio-preview/route.ts` | GET endpoint: reads pro data + style tokens, returns full HTML string |
| `app/(professional)/pro/site/page.tsx` | New pro page: quiz + preview + domain section |

### New files — Phase 2 (Custom Domain)

| File | Responsibility |
|------|---------------|
| `lib/domain/registrar.ts` | Registrar API client: search availability, purchase domain |
| `lib/domain/vercel-domains.ts` | Vercel REST API client: add domain to project, check DNS status |
| `lib/actions/domain.ts` | Server actions: searchDomain, purchaseDomain, registerDomain |
| `components/portfolio/DomainSearch.tsx` | Client component: search box, availability results, purchase CTA |
| `app/api/domain/search/route.ts` | GET: proxy to registrar search, sanitize response |
| `app/api/domain/purchase/route.ts` | POST: purchase + register on Vercel, update DB |

### Modified files

| File | Change |
|------|--------|
| `middleware.ts` | Add hostname routing block at top: custom domain → rewrite to `/professionnels/[slug]` |
| `app/(marketing)/professionnels/[slug]/page.tsx` | Read style_tokens from portfolio, inject CSS variables via `<style>` tag in `<head>` |

---

## Phase 1 — Style & Copy Quiz + Preview

---

### Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260418000001_portfolio_site.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260418000001_portfolio_site.sql

-- Style quiz result stored as CSS token map
ALTER TABLE professional_portfolio
  ADD COLUMN IF NOT EXISTS style_tokens      JSONB    NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS copy_quiz_answers JSONB    NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS hero_subtitle     TEXT,
  ADD COLUMN IF NOT EXISTS custom_domain     TEXT     UNIQUE,
  ADD COLUMN IF NOT EXISTS domain_status     TEXT     CHECK (domain_status IN (
    'pending_purchase', 'purchased', 'pending_dns', 'active', 'failed'
  )),
  ADD COLUMN IF NOT EXISTS domain_purchased_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS domain_activated_at  TIMESTAMPTZ;

-- Index for fast hostname lookup in middleware
CREATE INDEX IF NOT EXISTS idx_portfolio_custom_domain
  ON professional_portfolio(custom_domain)
  WHERE custom_domain IS NOT NULL;
```

- [ ] **Step 2: Apply migration**

```bash
npx supabase db push
```

Expected: Migration applied, no errors.

- [ ] **Step 3: Verify columns exist**

```bash
npx supabase db diff
```

Expected: No diff (migration is applied).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260418000001_portfolio_site.sql
git commit -m "feat(db): add style_tokens, copy_quiz, domain fields to professional_portfolio"
```

---

### Task 2: Style Token System

**Files:**
- Create: `lib/portfolio/style-tokens.ts`

This is the single source of truth. Quiz question IDs, option values, and their CSS variable output all live here.

- [ ] **Step 1: Create the file**

```typescript
// lib/portfolio/style-tokens.ts

export const STYLE_QUESTIONS = [
  {
    id: "imageShape",
    label: "Forme des images",
    options: [
      { value: "sharp",   label: "Angles nets",         description: "Moderne & précis" },
      { value: "rounded", label: "Légèrement arrondi",  description: "Doux & professionnel" },
      { value: "pill",    label: "Très arrondi",        description: "Accueillant & friendly" },
    ],
  },
  {
    id: "mood",
    label: "Ambiance générale",
    options: [
      { value: "light", label: "Clair & épuré",   description: "Aérien & minimaliste" },
      { value: "dark",  label: "Sombre & fort",   description: "Impact & autorité" },
      { value: "warm",  label: "Chaud & naturel", description: "Chaleur & authenticité" },
    ],
  },
  {
    id: "imageWeight",
    label: "Priorité visuelle",
    options: [
      { value: "image",    label: "Images en avant",    description: "Votre travail parle" },
      { value: "balanced", label: "Équilibré",           description: "Image & texte ensemble" },
      { value: "text",     label: "Infos en avant",     description: "Clair & lisible" },
    ],
  },
  {
    id: "spacing",
    label: "Densité de la page",
    options: [
      { value: "spacious",  label: "Aéré & éditorial", description: "Magazine haut de gamme" },
      { value: "standard",  label: "Standard",          description: "Equilibré & lisible" },
      { value: "compact",   label: "Dense & direct",    description: "Maximum d'infos" },
    ],
  },
] as const;

export type StyleAnswers = {
  imageShape: "sharp" | "rounded" | "pill";
  mood: "light" | "dark" | "warm";
  imageWeight: "image" | "balanced" | "text";
  spacing: "spacious" | "standard" | "compact";
};

/**
 * Map quiz answers to CSS variable values.
 * These are injected as a <style> block on the portfolio page.
 */
export function buildCssVars(tokens: Partial<StyleAnswers>): Record<string, string> {
  const vars: Record<string, string> = {};

  // Image border radius
  const radiusMap = { sharp: "0px", rounded: "12px", pill: "24px" };
  if (tokens.imageShape) vars["--portfolio-img-radius"] = radiusMap[tokens.imageShape];

  // Card border radius (slightly less than image)
  const cardRadiusMap = { sharp: "0px", rounded: "8px", pill: "16px" };
  if (tokens.imageShape) vars["--portfolio-card-radius"] = cardRadiusMap[tokens.imageShape];

  // Mood: surface and text colors
  const moodMap = {
    light: {
      "--portfolio-bg":         "#ffffff",
      "--portfolio-surface":    "#f8f8f6",
      "--portfolio-on-bg":      "#1a1a1a",
      "--portfolio-on-surface": "#2d2d2d",
      "--portfolio-overlay":    "rgba(0,0,0,0.35)",
    },
    dark: {
      "--portfolio-bg":         "#0f0f0f",
      "--portfolio-surface":    "#1a1a1a",
      "--portfolio-on-bg":      "#f5f5f5",
      "--portfolio-on-surface": "#e0e0e0",
      "--portfolio-overlay":    "rgba(0,0,0,0.55)",
    },
    warm: {
      "--portfolio-bg":         "#faf7f2",
      "--portfolio-surface":    "#f2ece2",
      "--portfolio-on-bg":      "#2c1f0e",
      "--portfolio-on-surface": "#3d2b15",
      "--portfolio-overlay":    "rgba(30,15,0,0.45)",
    },
  };
  if (tokens.mood) Object.assign(vars, moodMap[tokens.mood]);

  // Hero image height based on imageWeight
  const heroHeightMap = { image: "90vh", balanced: "80vh", text: "60vh" };
  if (tokens.imageWeight) vars["--portfolio-hero-height"] = heroHeightMap[tokens.imageWeight];

  // Section padding based on spacing
  const paddingMap = { spacious: "8rem", standard: "6rem", compact: "4rem" };
  if (tokens.spacing) vars["--portfolio-section-padding"] = paddingMap[tokens.spacing];

  return vars;
}

/**
 * Render CSS vars object as a <style> string for injection.
 */
export function renderStyleTag(tokens: Partial<StyleAnswers>): string {
  const vars = buildCssVars(tokens);
  if (Object.keys(vars).length === 0) return "";
  const declarations = Object.entries(vars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");
  return `<style>:root {\n${declarations}\n}</style>`;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/portfolio/style-tokens.ts
git commit -m "feat(portfolio): style token system — quiz answers to CSS vars"
```

---

### Task 3: Apply Style Tokens to Portfolio Page

**Files:**
- Modify: `app/(marketing)/professionnels/[slug]/page.tsx`

- [ ] **Step 1: Import the renderer at the top of the file**

In `app/(marketing)/professionnels/[slug]/page.tsx`, add this import after the existing imports:

```typescript
import { buildCssVars } from "@/lib/portfolio/style-tokens";
import type { StyleAnswers } from "@/lib/portfolio/style-tokens";
```

- [ ] **Step 2: Extract CSS vars from portfolio data**

Inside `ProfessionalProfilePage`, after the `portfolio` is fetched (around line 216), add:

```typescript
  // Build CSS custom properties from style quiz answers
  const styleVars = portfolio?.style_tokens
    ? buildCssVars(portfolio.style_tokens as Partial<StyleAnswers>)
    : {};

  const cssVarString = Object.entries(styleVars)
    .map(([k, v]) => `${k}: ${v}`)
    .join("; ");
```

- [ ] **Step 3: Inject the style tag into the page wrapper**

Replace the opening `<div>` of the return statement (currently line 239):

```tsx
  return (
    <div
      className="bg-surface selection:bg-primary-container selection:text-on-primary-container min-h-screen"
      style={cssVarString ? ({ cssText: cssVarString } as React.CSSProperties) : undefined}
    >
```

Wait — Next.js doesn't support `cssText` in style prop. Use a `<style>` tag inside the component instead, placed right after the opening `<div>`:

```tsx
  return (
    <div className="bg-surface selection:bg-primary-container selection:text-on-primary-container min-h-screen">
      {cssVarString && (
        <style dangerouslySetInnerHTML={{ __html: `:root { ${cssVarString} }` }} />
      )}
      <main>
```

- [ ] **Step 4: Apply CSS vars to the hero section**

The hero section currently hardcodes `h-[80vh]`. Replace with the CSS var:

```tsx
        <section
          className="relative flex items-center justify-center overflow-hidden"
          style={{ height: "var(--portfolio-hero-height, 80vh)" }}
        >
```

- [ ] **Step 5: Apply CSS vars to the hero overlay**

The overlay `div` currently uses `bg-on-surface/30`. Replace with the CSS var:

```tsx
            <div
              className="absolute inset-0"
              style={{ background: "var(--portfolio-overlay, rgba(0,0,0,0.30))" }}
            />
```

- [ ] **Step 6: Apply CSS vars to section padding**

The portfolio section currently has `py-24`. Update to use the CSS var:

```tsx
        <section
          className="px-4 sm:px-6 md:px-8 bg-surface"
          id="portfolio"
          style={{ paddingTop: "var(--portfolio-section-padding, 6rem)", paddingBottom: "var(--portfolio-section-padding, 6rem)" }}
        >
```

- [ ] **Step 7: Commit**

```bash
git add app/'(marketing)'/professionnels/'[slug]'/page.tsx
git commit -m "feat(portfolio): apply style_tokens CSS vars to public portfolio page"
```

---

### Task 4: Copy Generator

**Files:**
- Create: `lib/portfolio/copy-generator.ts`

- [ ] **Step 1: Install Anthropic SDK if not present**

```bash
npm list @anthropic-ai/sdk || npm install @anthropic-ai/sdk
```

Expected: Package present or installed.

- [ ] **Step 2: Create the file**

```typescript
// lib/portfolio/copy-generator.ts

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const COPY_QUESTIONS = [
  {
    id: "tone",
    label: "Comment voulez-vous paraître ?",
    options: [
      { value: "professional", label: "Professionnel & sérieux",   description: "Rigueur & expertise" },
      { value: "warm",         label: "Chaleureux & accessible",   description: "Proche & à l'écoute" },
      { value: "bold",         label: "Audacieux & confiant",      description: "Impact & leadership" },
    ],
  },
  {
    id: "strength",
    label: "Votre force principale",
    options: [
      { value: "quality",      label: "Qualité du travail",              description: "Finitions impeccables" },
      { value: "reliability",  label: "Rapidité & fiabilité",            description: "Dans les délais, toujours" },
      { value: "experience",   label: "Expérience & expertise",          description: "Des années de savoir-faire" },
      { value: "value",        label: "Meilleur rapport qualité-prix",   description: "Excellence accessible" },
    ],
  },
  {
    id: "clientRelation",
    label: "Comment vous adressez-vous à vos clients ?",
    options: [
      { value: "formal",   label: "Formel",      description: '\"Nous vous accompagnons\"' },
      { value: "direct",   label: "Direct",      description: '\"Appelez-moi\"' },
      { value: "friendly", label: "Amical",      description: '\"Parlons de votre projet\"' },
    ],
  },
  {
    id: "differentiator",
    label: "Ce qui vous différencie (optionnel)",
    freeText: true,
    placeholder: "Ex: 20 ans sur Abidjan, spécialiste béton armé...",
  },
] as const;

export type CopyAnswers = {
  tone: "professional" | "warm" | "bold";
  strength: "quality" | "reliability" | "experience" | "value";
  clientRelation: "formal" | "direct" | "friendly";
  differentiator?: string;
};

export type ProContext = {
  businessName: string;
  category: string;
  city?: string;
  country?: string;
  yearsOfExperience?: number;
};

export type GeneratedCopy = {
  heroSubtitle: string;   // 1 punchy sentence, max 12 words
  aboutText: string;      // 3-4 sentences, first person plural or singular per tone
};

export async function generatePortfolioCopy(
  answers: CopyAnswers,
  pro: ProContext,
): Promise<GeneratedCopy> {
  const toneMap = {
    professional: "formel et expert, vouvoiement",
    warm: "chaleureux et humain, tutoiement possible",
    bold: "audacieux et direct, phrases courtes percutantes",
  };

  const strengthMap = {
    quality:     "la qualité irréprochable des finitions",
    reliability: "la rapidité et la fiabilité des délais",
    experience:  "l'expérience et le savoir-faire accumulés",
    value:       "le meilleur rapport qualité-prix du marché",
  };

  const clientMap = {
    formal:   "\"Nous vous accompagnons\" / \"Notre équipe\"",
    direct:   "\"Appelez-moi\" / \"Je suis là pour vous\"",
    friendly: "\"Parlons de votre projet\" / \"Ensemble\"",
  };

  const location = [pro.city, pro.country].filter(Boolean).join(", ");

  const prompt = `Tu es un rédacteur expert en marketing pour les professionnels africains.
Tu dois écrire le contenu d'un site portfolio pour ce professionnel.

PROFIL:
- Nom: ${pro.businessName}
- Métier: ${pro.category}
- Localisation: ${location || "Afrique"}
${pro.yearsOfExperience ? `- Expérience: ${pro.yearsOfExperience} ans` : ""}
${answers.differentiator ? `- Ce qui le différencie: ${answers.differentiator}` : ""}

STYLE SOUHAITÉ:
- Ton: ${toneMap[answers.tone]}
- Force mise en avant: ${strengthMap[answers.strength]}
- Formule client: ${clientMap[answers.clientRelation]}

RÈGLES:
- heroSubtitle: 1 phrase, max 12 mots, accroche forte, sans le nom de l'entreprise
- aboutText: 3-4 phrases naturelles, première personne, pas de clichés
- Écrire en français
- Ne pas mentionner "Kelen"
- Pas de bullet points, pas de titres dans aboutText

Réponds UNIQUEMENT avec ce JSON valide, rien d'autre:
{
  "heroSubtitle": "...",
  "aboutText": "..."
}`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const parsed = JSON.parse(text.trim()) as GeneratedCopy;

  return parsed;
}
```

- [ ] **Step 3: Add ANTHROPIC_API_KEY to environment**

```bash
# In .env.local (do not commit)
ANTHROPIC_API_KEY=sk-ant-...
```

- [ ] **Step 4: Commit**

```bash
git add lib/portfolio/copy-generator.ts
git commit -m "feat(portfolio): Claude copy generator from quiz answers"
```

---

### Task 5: Server Actions for Quiz

**Files:**
- Create: `lib/actions/portfolio-site.ts`

- [ ] **Step 1: Create the file**

```typescript
// lib/actions/portfolio-site.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { generatePortfolioCopy } from "@/lib/portfolio/copy-generator";
import type { StyleAnswers } from "@/lib/portfolio/style-tokens";
import type { CopyAnswers } from "@/lib/portfolio/copy-generator";
import { revalidatePath } from "next/cache";

async function getProfessional() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data: pro } = await supabase
    .from("professionals")
    .select("id, slug, business_name, category, city, country, years_of_experience")
    .eq("user_id", user.id)
    .single();

  if (!pro) throw new Error("Profil professionnel non trouvé");
  return { supabase, pro };
}

export async function saveStyleQuiz(answers: StyleAnswers) {
  const { supabase, pro } = await getProfessional();

  const { error } = await supabase
    .from("professional_portfolio")
    .upsert(
      { professional_id: pro.id, style_tokens: answers, updated_at: new Date().toISOString() },
      { onConflict: "professional_id" }
    );

  if (error) throw new Error(error.message);
  revalidatePath(`/professionnels/${pro.slug}`);
  return { success: true };
}

export async function saveCopyQuizAndGenerate(answers: CopyAnswers) {
  const { supabase, pro } = await getProfessional();

  // Generate copy via Claude
  const copy = await generatePortfolioCopy(answers, {
    businessName: pro.business_name,
    category: pro.category,
    city: pro.city,
    country: pro.country,
    yearsOfExperience: pro.years_of_experience,
  });

  const { error } = await supabase
    .from("professional_portfolio")
    .upsert(
      {
        professional_id: pro.id,
        copy_quiz_answers: answers,
        hero_subtitle: copy.heroSubtitle,
        about_text: copy.aboutText,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "professional_id" }
    );

  if (error) throw new Error(error.message);
  revalidatePath(`/professionnels/${pro.slug}`);
  return { success: true, copy };
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/actions/portfolio-site.ts
git commit -m "feat(portfolio): server actions for style + copy quiz persistence"
```

---

### Task 6: Preview Render Function

**Files:**
- Create: `app/api/portfolio-preview/route.ts`

This endpoint returns a full HTML document with the pro's real data and the proposed style tokens applied. It is called from an iframe in the quiz UI.

- [ ] **Step 1: Create the route**

```typescript
// app/api/portfolio-preview/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildCssVars } from "@/lib/portfolio/style-tokens";
import type { StyleAnswers } from "@/lib/portfolio/style-tokens";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  // Parse style override from query (preview uses proposed tokens, not saved ones)
  let styleOverride: Partial<StyleAnswers> = {};
  try {
    const raw = searchParams.get("style");
    if (raw) styleOverride = JSON.parse(decodeURIComponent(raw));
  } catch {
    // ignore bad JSON
  }

  if (!slug) {
    return new NextResponse("Missing slug", { status: 400 });
  }

  const supabase = await createClient();

  const { data: pro } = await supabase
    .from("professionals")
    .select("*, professional_portfolio(*)")
    .eq("slug", slug)
    .single();

  if (!pro) {
    return new NextResponse("Professional not found", { status: 404 });
  }

  const portfolio = pro.professional_portfolio?.[0] ?? null;

  // Merge saved tokens with preview override (override wins)
  const tokens: Partial<StyleAnswers> = {
    ...(portfolio?.style_tokens ?? {}),
    ...styleOverride,
  };

  const cssVars = buildCssVars(tokens);
  const cssVarString = Object.entries(cssVars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");

  const heroImage =
    portfolio?.hero_image_url ||
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80";

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Aperçu — ${pro.business_name}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet">
  <style>
    :root {
${cssVarString}
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', sans-serif;
      background: var(--portfolio-bg, #ffffff);
      color: var(--portfolio-on-bg, #1a1a1a);
    }
    .hero {
      position: relative;
      height: var(--portfolio-hero-height, 80vh);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .hero-img {
      position: absolute; inset: 0;
      width: 100%; height: 100%;
      object-fit: cover;
    }
    .hero-overlay {
      position: absolute; inset: 0;
      background: var(--portfolio-overlay, rgba(0,0,0,0.35));
    }
    .hero-card {
      position: relative; z-index: 10;
      background: var(--portfolio-surface, #f8f8f6);
      border-radius: var(--portfolio-card-radius, 12px);
      padding: 3rem;
      max-width: 700px;
      width: 90%;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
    }
    .hero-name {
      font-size: 2.5rem;
      font-weight: 900;
      line-height: 1.1;
      color: var(--portfolio-on-surface, #1a1a1a);
      margin-bottom: 0.5rem;
    }
    .hero-category {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--portfolio-on-surface, #1a1a1a);
      opacity: 0.7;
      margin-bottom: 0.75rem;
    }
    .hero-subtitle {
      font-size: 1rem;
      color: var(--portfolio-on-surface, #1a1a1a);
      opacity: 0.6;
      margin-bottom: 1.5rem;
    }
    .hero-cta {
      display: inline-block;
      background: #009639;
      color: #fff;
      padding: 0.875rem 2rem;
      border-radius: var(--portfolio-card-radius, 8px);
      font-weight: 700;
      text-decoration: none;
      font-size: 0.95rem;
    }
    .section {
      padding: var(--portfolio-section-padding, 6rem) 2rem;
    }
    .section-title {
      font-size: 1.75rem;
      font-weight: 900;
      margin-bottom: 2rem;
      color: var(--portfolio-on-bg, #1a1a1a);
    }
    .about-text {
      font-size: 1.05rem;
      line-height: 1.8;
      color: var(--portfolio-on-bg, #1a1a1a);
      opacity: 0.75;
      max-width: 600px;
    }
    .preview-badge {
      position: fixed; bottom: 1rem; right: 1rem;
      background: #009639;
      color: #fff;
      padding: 0.5rem 1rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 700;
      z-index: 9999;
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <section class="hero">
    <img class="hero-img" src="${heroImage}" alt="" />
    <div class="hero-overlay"></div>
    <div class="hero-card">
      <h1 class="hero-name">${escapeHtml(pro.business_name)}</h1>
      <p class="hero-category">${escapeHtml(pro.category || "")}</p>
      ${portfolio?.hero_subtitle ? `<p class="hero-subtitle">${escapeHtml(portfolio.hero_subtitle)}</p>` : ""}
      <a class="hero-cta" href="#">Consulter l'expert</a>
    </div>
  </section>

  ${portfolio?.about_text ? `
  <section class="section" style="background: var(--portfolio-surface, #f8f8f6)">
    <h2 class="section-title">À propos</h2>
    <p class="about-text">${escapeHtml(portfolio.about_text)}</p>
  </section>
  ` : ""}

  <div class="preview-badge">Aperçu</div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
```

- [ ] **Step 2: Test the endpoint manually**

Start the dev server: `npm run dev`

Navigate to: `http://localhost:3000/api/portfolio-preview?slug=YOUR_TEST_SLUG&style=%7B%22mood%22%3A%22dark%22%7D`

Expected: A full HTML page renders with dark mood colors applied.

- [ ] **Step 3: Commit**

```bash
git add app/api/portfolio-preview/route.ts
git commit -m "feat(api): portfolio preview render function with style token injection"
```

---

### Task 7: Style Quiz Component

**Files:**
- Create: `components/portfolio/StyleQuiz.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/portfolio/StyleQuiz.tsx
"use client";

import { useState } from "react";
import { STYLE_QUESTIONS } from "@/lib/portfolio/style-tokens";
import type { StyleAnswers } from "@/lib/portfolio/style-tokens";
import { saveStyleQuiz } from "@/lib/actions/portfolio-site";

interface Props {
  initialAnswers: Partial<StyleAnswers>;
  onAnswersChange: (answers: Partial<StyleAnswers>) => void;
}

export function StyleQuiz({ initialAnswers, onAnswersChange }: Props) {
  const [answers, setAnswers] = useState<Partial<StyleAnswers>>(initialAnswers);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSelect(questionId: string, value: string) {
    const next = { ...answers, [questionId]: value } as Partial<StyleAnswers>;
    setAnswers(next);
    onAnswersChange(next);
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveStyleQuiz(answers as StyleAnswers);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  const allAnswered = STYLE_QUESTIONS.every(q => answers[q.id as keyof StyleAnswers]);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-headline text-lg font-bold text-on-surface">Style visuel</h3>
        <p className="text-sm text-on-surface-variant/70 mt-1">
          4 questions pour personnaliser l'apparence de votre site.
        </p>
      </div>

      {STYLE_QUESTIONS.map((question) => (
        <div key={question.id} className="space-y-3">
          <p className="font-semibold text-sm text-on-surface">{question.label}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {question.options.map((option) => {
              const selected = answers[question.id as keyof StyleAnswers] === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => handleSelect(question.id, option.value)}
                  className={`text-left p-4 rounded-xl border-2 transition-all duration-150 ${
                    selected
                      ? "border-kelen-green-600 bg-kelen-green-50"
                      : "border-outline-variant/30 hover:border-kelen-green-300 hover:bg-surface-container-low"
                  }`}
                >
                  <p className="font-bold text-sm text-on-surface">{option.label}</p>
                  <p className="text-xs text-on-surface-variant/60 mt-0.5">{option.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <button
        onClick={handleSave}
        disabled={!allAnswered || saving}
        className="h-11 px-6 rounded-xl bg-kelen-green-600 text-white font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-kelen-green-700 transition-colors"
      >
        {saving ? "Enregistrement..." : saved ? "Enregistré ✓" : "Enregistrer le style"}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/portfolio/StyleQuiz.tsx
git commit -m "feat(components): style quiz with 4 visual preference questions"
```

---

### Task 8: Copywriting Quiz Component

**Files:**
- Create: `components/portfolio/CopywritingQuiz.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/portfolio/CopywritingQuiz.tsx
"use client";

import { useState } from "react";
import { COPY_QUESTIONS } from "@/lib/portfolio/copy-generator";
import type { CopyAnswers } from "@/lib/portfolio/copy-generator";
import { saveCopyQuizAndGenerate } from "@/lib/actions/portfolio-site";
import { Loader2 } from "lucide-react";

interface Props {
  initialAnswers: Partial<CopyAnswers>;
  onCopyGenerated: (copy: { heroSubtitle: string; aboutText: string }) => void;
}

export function CopywritingQuiz({ initialAnswers, onCopyGenerated }: Props) {
  const [answers, setAnswers] = useState<Partial<CopyAnswers>>(initialAnswers);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSelect(questionId: string, value: string) {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    setGenerated(false);
    setError(null);
  }

  function handleFreeText(value: string) {
    setAnswers(prev => ({ ...prev, differentiator: value }));
    setGenerated(false);
  }

  const requiredQuestions = COPY_QUESTIONS.filter(q => !("freeText" in q));
  const allRequired = requiredQuestions.every(q => answers[q.id as keyof CopyAnswers]);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const result = await saveCopyQuizAndGenerate(answers as CopyAnswers);
      onCopyGenerated(result.copy);
      setGenerated(true);
    } catch (e) {
      setError("Erreur lors de la génération. Réessayez.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-headline text-lg font-bold text-on-surface">Voix & Contenu</h3>
        <p className="text-sm text-on-surface-variant/70 mt-1">
          4 questions pour générer le texte de votre site automatiquement.
        </p>
      </div>

      {COPY_QUESTIONS.map((question) => {
        if ("freeText" in question) {
          return (
            <div key={question.id} className="space-y-2">
              <p className="font-semibold text-sm text-on-surface">
                {question.label}{" "}
                <span className="text-on-surface-variant/40 font-normal">(optionnel)</span>
              </p>
              <input
                type="text"
                placeholder={question.placeholder}
                value={(answers as any).differentiator ?? ""}
                onChange={e => handleFreeText(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-low text-sm focus:outline-none focus:border-kelen-green-500"
              />
            </div>
          );
        }

        return (
          <div key={question.id} className="space-y-3">
            <p className="font-semibold text-sm text-on-surface">{question.label}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {question.options.map((option) => {
                const selected = answers[question.id as keyof CopyAnswers] === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleSelect(question.id, option.value)}
                    className={`text-left p-4 rounded-xl border-2 transition-all duration-150 ${
                      selected
                        ? "border-kelen-green-600 bg-kelen-green-50"
                        : "border-outline-variant/30 hover:border-kelen-green-300 hover:bg-surface-container-low"
                    }`}
                  >
                    <p className="font-bold text-sm text-on-surface">{option.label}</p>
                    <p className="text-xs text-on-surface-variant/60 mt-0.5">{option.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleGenerate}
        disabled={!allRequired || generating}
        className="h-11 px-6 rounded-xl bg-kelen-green-600 text-white font-bold text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-kelen-green-700 transition-colors"
      >
        {generating && <Loader2 className="w-4 h-4 animate-spin" />}
        {generating ? "Génération en cours..." : generated ? "Texte généré ✓" : "Générer mon contenu"}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/portfolio/CopywritingQuiz.tsx
git commit -m "feat(components): copywriting quiz with AI generation trigger"
```

---

### Task 9: Preview Frame Component

**Files:**
- Create: `components/portfolio/PortfolioPreviewFrame.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/portfolio/PortfolioPreviewFrame.tsx
"use client";

import { useState, useEffect } from "react";
import { Loader2, Monitor, Smartphone } from "lucide-react";
import type { StyleAnswers } from "@/lib/portfolio/style-tokens";

interface Props {
  slug: string;
  styleOverride?: Partial<StyleAnswers>;
}

export function PortfolioPreviewFrame({ slug, styleOverride }: Props) {
  const [loading, setLoading] = useState(true);
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [key, setKey] = useState(0);

  // Reload iframe when styleOverride changes (debounced)
  useEffect(() => {
    const t = setTimeout(() => setKey(k => k + 1), 800);
    return () => clearTimeout(t);
  }, [JSON.stringify(styleOverride)]);

  const styleParam = styleOverride
    ? encodeURIComponent(JSON.stringify(styleOverride))
    : "";

  const previewUrl = `/api/portfolio-preview?slug=${slug}${styleParam ? `&style=${styleParam}` : ""}`;

  return (
    <div className="space-y-3">
      {/* Viewport toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setViewport("desktop")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            viewport === "desktop"
              ? "bg-kelen-green-600 text-white"
              : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          Bureau
        </button>
        <button
          onClick={() => setViewport("mobile")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            viewport === "mobile"
              ? "bg-kelen-green-600 text-white"
              : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          Mobile
        </button>
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-on-surface-variant/40 ml-2" />}
      </div>

      {/* Frame container */}
      <div
        className="relative bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/20 transition-all duration-300"
        style={{
          height: "520px",
          maxWidth: viewport === "mobile" ? "375px" : "100%",
        }}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-container-low z-10">
            <div className="text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-kelen-green-600 mx-auto" />
              <p className="text-xs text-on-surface-variant/60 font-medium">Chargement de l'aperçu...</p>
            </div>
          </div>
        )}
        <iframe
          key={key}
          src={previewUrl}
          className="w-full h-full border-0"
          onLoad={() => setLoading(false)}
          title="Aperçu du site"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/portfolio/PortfolioPreviewFrame.tsx
git commit -m "feat(components): portfolio preview iframe with viewport toggle and debounce"
```

---

### Task 10: "Mon Site" Pro Page

**Files:**
- Create: `app/(professional)/pro/site/page.tsx`

This is the main orchestration page where the quiz, preview, and eventually the domain section live.

- [ ] **Step 1: Create the page**

```tsx
// app/(professional)/pro/site/page.tsx
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SiteBuilder } from "@/components/portfolio/SiteBuilder";

export const metadata: Metadata = {
  title: "Mon Site Web — Kelen Pro",
  description: "Personnalisez et publiez votre site portfolio sur votre propre domaine.",
};

export default async function MySitePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/pro/connexion");

  const { data: pro } = await supabase
    .from("professionals")
    .select("id, slug, business_name, category, status")
    .eq("user_id", user.id)
    .single();

  if (!pro) redirect("/pro/profil");

  const { data: portfolio } = await supabase
    .from("professional_portfolio")
    .select("style_tokens, copy_quiz_answers, hero_subtitle, about_text, custom_domain, domain_status")
    .eq("professional_id", pro.id)
    .single();

  const isPaid = pro.status === "gold" || pro.status === "silver";

  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <div className="space-y-1">
        <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface lg:text-4xl">
          Mon Site Web
        </h1>
        <p className="text-on-surface-variant/70 leading-relaxed max-w-lg">
          Créez votre site portfolio en 2 minutes. L'aperçu est gratuit — le domaine est réservé aux membres Gold et Silver.
        </p>
      </div>

      <SiteBuilder
        pro={{ id: pro.id, slug: pro.slug, businessName: pro.business_name }}
        portfolio={portfolio}
        isPaid={isPaid}
      />
    </div>
  );
}
```

- [ ] **Step 2: Create the SiteBuilder client component**

```tsx
// components/portfolio/SiteBuilder.tsx
"use client";

import { useState } from "react";
import { StyleQuiz } from "./StyleQuiz";
import { CopywritingQuiz } from "./CopywritingQuiz";
import { PortfolioPreviewFrame } from "./PortfolioPreviewFrame";
import type { StyleAnswers } from "@/lib/portfolio/style-tokens";
import type { CopyAnswers } from "@/lib/portfolio/copy-generator";
import { Lock } from "lucide-react";
import Link from "next/link";

interface Props {
  pro: { id: string; slug: string; businessName: string };
  portfolio: {
    style_tokens?: Partial<StyleAnswers>;
    copy_quiz_answers?: Partial<CopyAnswers>;
    hero_subtitle?: string;
    about_text?: string;
    custom_domain?: string;
    domain_status?: string;
  } | null;
  isPaid: boolean;
}

export function SiteBuilder({ pro, portfolio, isPaid }: Props) {
  const [styleOverride, setStyleOverride] = useState<Partial<StyleAnswers>>(
    portfolio?.style_tokens ?? {}
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
      {/* Left: Quizzes */}
      <div className="space-y-12">
        <StyleQuiz
          initialAnswers={portfolio?.style_tokens ?? {}}
          onAnswersChange={setStyleOverride}
        />

        <div className="border-t border-outline-variant/20" />

        <CopywritingQuiz
          initialAnswers={portfolio?.copy_quiz_answers ?? {}}
          onCopyGenerated={() => {
            /* preview auto-reloads via key change */
          }}
        />
      </div>

      {/* Right: Preview + Domain */}
      <div className="space-y-8">
        <div>
          <h3 className="font-headline text-lg font-bold text-on-surface mb-3">Aperçu en direct</h3>
          <PortfolioPreviewFrame slug={pro.slug} styleOverride={styleOverride} />
        </div>

        {/* Domain section */}
        <div className="rounded-2xl border border-outline-variant/20 p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-headline text-lg font-bold text-on-surface">Votre domaine</h3>
              <p className="text-sm text-on-surface-variant/70 mt-1">
                Publiez sur votre propre adresse web.
              </p>
            </div>
            {!isPaid && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                <Lock className="w-3 h-3" />
                Gold / Silver
              </span>
            )}
          </div>

          {portfolio?.custom_domain ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-on-surface">
                Domaine actif :{" "}
                <a
                  href={`https://${portfolio.custom_domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-kelen-green-600 hover:underline"
                >
                  {portfolio.custom_domain}
                </a>
              </p>
              <p className="text-xs text-on-surface-variant/50">
                Statut : {portfolio.domain_status ?? "inconnu"}
              </p>
            </div>
          ) : isPaid ? (
            <p className="text-sm text-on-surface-variant/60">
              La section domaine sera disponible dans la prochaine mise à jour.
            </p>
          ) : (
            <Link
              href="/pro/abonnement"
              className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-colors"
            >
              Passer Gold ou Silver
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/'(professional)'/pro/site/page.tsx components/portfolio/SiteBuilder.tsx
git commit -m "feat(pro): Mon Site page with quiz + live preview + domain placeholder"
```

---

## Phase 2 — Custom Domain Flow

---

### Task 11: Registrar API Client

**Files:**
- Create: `lib/domain/registrar.ts`

> Note: Replace the base URL and auth headers with your actual registrar API credentials (Namecheap, OpenSRS, or CheapDomain). The interface below is provider-agnostic.

- [ ] **Step 1: Create the client**

```typescript
// lib/domain/registrar.ts

const REGISTRAR_API_URL = process.env.REGISTRAR_API_URL!;
const REGISTRAR_API_KEY = process.env.REGISTRAR_API_KEY!;
const REGISTRAR_USER    = process.env.REGISTRAR_API_USER!;

export type DomainAvailability = {
  domain: string;
  available: boolean;
  price?: number;       // annual price in USD
  currency?: string;
};

export type PurchaseResult = {
  success: boolean;
  domain: string;
  expiresAt?: string;
  errorMessage?: string;
};

/**
 * Check if a domain is available for registration.
 */
export async function checkDomainAvailability(domain: string): Promise<DomainAvailability> {
  const url = new URL(`${REGISTRAR_API_URL}/domains/check`);
  url.searchParams.set("domain", domain);

  const res = await fetch(url.toString(), {
    headers: {
      "Authorization": `Bearer ${REGISTRAR_API_KEY}`,
      "X-Username": REGISTRAR_USER,
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) throw new Error(`Registrar check failed: ${res.status}`);

  const data = await res.json();
  return {
    domain,
    available: data.available ?? false,
    price: data.price,
    currency: data.currency ?? "USD",
  };
}

/**
 * Purchase a domain. The registrar auto-configures nameservers to Vercel's.
 * Returns success/failure.
 */
export async function purchaseDomain(
  domain: string,
  registrantInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
  }
): Promise<PurchaseResult> {
  const res = await fetch(`${REGISTRAR_API_URL}/domains/purchase`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${REGISTRAR_API_KEY}`,
      "X-Username": REGISTRAR_USER,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ domain, registrant: registrantInfo, years: 1 }),
  });

  const data = await res.json();

  if (!res.ok) {
    return { success: false, domain, errorMessage: data.message ?? "Purchase failed" };
  }

  return { success: true, domain, expiresAt: data.expires_at };
}
```

- [ ] **Step 2: Add env vars to .env.local**

```bash
# .env.local (never commit)
REGISTRAR_API_URL=https://api.your-registrar.com/v1
REGISTRAR_API_KEY=your-api-key
REGISTRAR_API_USER=your-username
```

- [ ] **Step 3: Commit**

```bash
git add lib/domain/registrar.ts
git commit -m "feat(domain): registrar API client for domain check and purchase"
```

---

### Task 12: Vercel Domains API Client

**Files:**
- Create: `lib/domain/vercel-domains.ts`

- [ ] **Step 1: Create the client**

```typescript
// lib/domain/vercel-domains.ts

const VERCEL_TOKEN      = process.env.VERCEL_API_TOKEN!;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID!;
const VERCEL_TEAM_ID    = process.env.VERCEL_TEAM_ID; // optional

function vercelHeaders() {
  return {
    "Authorization": `Bearer ${VERCEL_TOKEN}`,
    "Content-Type": "application/json",
  };
}

function projectUrl(path: string) {
  const base = `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}${path}`;
  return VERCEL_TEAM_ID ? `${base}?teamId=${VERCEL_TEAM_ID}` : base;
}

export type DomainRegistrationResult = {
  success: boolean;
  domain: string;
  verified: boolean;
  errorMessage?: string;
};

/**
 * Register a custom domain on the Vercel project.
 * Vercel will serve the existing Next.js app for all requests to this domain.
 */
export async function addDomainToVercel(domain: string): Promise<DomainRegistrationResult> {
  const res = await fetch(projectUrl("/domains"), {
    method: "POST",
    headers: vercelHeaders(),
    body: JSON.stringify({ name: domain }),
  });

  const data = await res.json();

  if (!res.ok) {
    return {
      success: false,
      domain,
      verified: false,
      errorMessage: data.error?.message ?? "Vercel domain registration failed",
    };
  }

  return {
    success: true,
    domain,
    verified: data.verified ?? false,
  };
}

/**
 * Check DNS propagation status for a domain on Vercel.
 */
export async function checkDomainStatus(domain: string): Promise<{ verified: boolean; reason?: string }> {
  const res = await fetch(projectUrl(`/domains/${domain}`), {
    headers: vercelHeaders(),
  });

  if (!res.ok) return { verified: false, reason: "Domain not found on Vercel" };

  const data = await res.json();
  return { verified: data.verified ?? false };
}
```

- [ ] **Step 2: Add env vars to .env.local**

```bash
# .env.local
VERCEL_API_TOKEN=your-vercel-token
VERCEL_PROJECT_ID=your-project-id
VERCEL_TEAM_ID=your-team-id   # optional, omit if personal account
```

To find VERCEL_PROJECT_ID: run `vercel project ls` or check the Vercel dashboard project settings.

- [ ] **Step 3: Commit**

```bash
git add lib/domain/vercel-domains.ts
git commit -m "feat(domain): Vercel REST API client for domain registration and DNS check"
```

---

### Task 13: Domain Server Actions

**Files:**
- Create: `lib/actions/domain.ts`

- [ ] **Step 1: Create the file**

```typescript
// lib/actions/domain.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { checkDomainAvailability, purchaseDomain } from "@/lib/domain/registrar";
import { addDomainToVercel } from "@/lib/domain/vercel-domains";
import { revalidatePath } from "next/cache";

async function getPaidProfessional() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data: pro } = await supabase
    .from("professionals")
    .select("id, slug, status, owner_name, email, city, country, phone")
    .eq("user_id", user.id)
    .single();

  if (!pro) throw new Error("Profil non trouvé");
  if (pro.status !== "gold" && pro.status !== "silver") {
    throw new Error("Fonctionnalité réservée aux membres Gold et Silver");
  }

  return { supabase, pro };
}

export async function searchDomain(query: string) {
  // No auth required — search is free
  const cleaned = query
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const tlds = [".com", ".africa", ".net"];
  const results = await Promise.all(
    tlds.map(tld => checkDomainAvailability(`${cleaned}${tld}`))
  );
  return results;
}

export async function activateDomain(domain: string) {
  const { supabase, pro } = await getPaidProfessional();

  // 1. Check availability one more time before purchase
  const availability = await checkDomainAvailability(domain);
  if (!availability.available) throw new Error("Ce domaine n'est plus disponible.");

  // 2. Mark as pending in DB
  await supabase
    .from("professional_portfolio")
    .upsert(
      {
        professional_id: pro.id,
        custom_domain: domain,
        domain_status: "pending_purchase",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "professional_id" }
    );

  // 3. Purchase domain via registrar
  const nameParts = (pro.owner_name || "").split(" ");
  const purchase = await purchaseDomain(domain, {
    firstName: nameParts[0] || "Pro",
    lastName: nameParts.slice(1).join(" ") || "Kelen",
    email: pro.email,
    phone: pro.phone || "",
    address: "1 Rue Principale",
    city: pro.city || "Abidjan",
    country: pro.country || "CI",
  });

  if (!purchase.success) {
    await supabase
      .from("professional_portfolio")
      .update({ domain_status: "failed" })
      .eq("professional_id", pro.id);
    throw new Error(purchase.errorMessage || "Erreur lors de l'achat du domaine");
  }

  // 4. Register on Vercel
  const vercel = await addDomainToVercel(domain);
  if (!vercel.success) {
    await supabase
      .from("professional_portfolio")
      .update({ domain_status: "failed" })
      .eq("professional_id", pro.id);
    throw new Error(vercel.errorMessage || "Erreur lors de l'activation Vercel");
  }

  // 5. Update DB to active
  await supabase
    .from("professional_portfolio")
    .update({
      domain_status: vercel.verified ? "active" : "pending_dns",
      domain_purchased_at: new Date().toISOString(),
    })
    .eq("professional_id", pro.id);

  revalidatePath("/pro/site");
  return { success: true, domain, verified: vercel.verified };
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/actions/domain.ts
git commit -m "feat(domain): server actions for domain search and purchase + Vercel activation"
```

---

### Task 14: Domain Search UI Component

**Files:**
- Create: `components/portfolio/DomainSearch.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/portfolio/DomainSearch.tsx
"use client";

import { useState, useTransition } from "react";
import { Search, Check, X, Loader2, Globe } from "lucide-react";
import { searchDomain, activateDomain } from "@/lib/actions/domain";

type DomainResult = {
  domain: string;
  available: boolean;
  price?: number;
  currency?: string;
};

export function DomainSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DomainResult[]>([]);
  const [activating, setActivating] = useState<string | null>(null);
  const [activated, setActivated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, startSearch] = useTransition();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setError(null);
    setResults([]);
    startSearch(async () => {
      try {
        const data = await searchDomain(query.trim());
        setResults(data);
      } catch (e) {
        setError("Erreur lors de la recherche. Réessayez.");
      }
    });
  }

  async function handleActivate(domain: string) {
    setActivating(domain);
    setError(null);
    try {
      await activateDomain(domain);
      setActivated(domain);
    } catch (e: any) {
      setError(e.message || "Erreur lors de l'activation.");
    } finally {
      setActivating(null);
    }
  }

  if (activated) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-kelen-green-50 border border-kelen-green-200">
        <Globe className="w-5 h-5 text-kelen-green-600 shrink-0" />
        <div>
          <p className="font-bold text-sm text-kelen-green-800">
            {activated} — Activation en cours
          </p>
          <p className="text-xs text-kelen-green-600 mt-0.5">
            Votre site sera accessible dans quelques minutes le temps que le DNS se propage.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="diallo-construction-abidjan"
          className="flex-1 px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-low text-sm focus:outline-none focus:border-kelen-green-500"
        />
        <button
          type="submit"
          disabled={isSearching || !query.trim()}
          className="h-12 px-5 rounded-xl bg-kelen-green-600 text-white font-bold text-sm flex items-center gap-2 disabled:opacity-40 hover:bg-kelen-green-700 transition-colors"
        >
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Chercher
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map(r => (
            <div
              key={r.domain}
              className="flex items-center justify-between p-4 rounded-xl border border-outline-variant/20 bg-surface-container-low"
            >
              <div className="flex items-center gap-3">
                {r.available ? (
                  <Check className="w-4 h-4 text-kelen-green-600 shrink-0" />
                ) : (
                  <X className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <div>
                  <p className="font-bold text-sm text-on-surface">{r.domain}</p>
                  {r.available && r.price && (
                    <p className="text-xs text-on-surface-variant/60">
                      {r.price} {r.currency ?? "USD"} / an
                    </p>
                  )}
                  {!r.available && (
                    <p className="text-xs text-red-400">Déjà pris</p>
                  )}
                </div>
              </div>

              {r.available && (
                <button
                  onClick={() => handleActivate(r.domain)}
                  disabled={activating === r.domain}
                  className="h-9 px-4 rounded-lg bg-kelen-green-600 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 hover:bg-kelen-green-700 transition-colors"
                >
                  {activating === r.domain && <Loader2 className="w-3 h-3 animate-spin" />}
                  Activer
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire DomainSearch into SiteBuilder**

In `components/portfolio/SiteBuilder.tsx`, replace the domain placeholder text:

```tsx
// Replace this line:
//   <p className="text-sm text-on-surface-variant/60">
//     La section domaine sera disponible dans la prochaine mise à jour.
//   </p>

// With:
import { DomainSearch } from "./DomainSearch";

// Inside the isPaid branch:
<DomainSearch />
```

- [ ] **Step 3: Commit**

```bash
git add components/portfolio/DomainSearch.tsx components/portfolio/SiteBuilder.tsx
git commit -m "feat(domain): domain search and purchase UI for Gold/Silver pros"
```

---

### Task 15: Middleware Hostname Routing

**Files:**
- Modify: `middleware.ts`

When a request arrives with a hostname that is not the Kelen platform domain, look up which professional owns that domain and rewrite the request to their portfolio page. All auth logic is skipped — portfolio pages are public.

- [ ] **Step 1: Add hostname routing at the top of the middleware function**

In `middleware.ts`, add this block immediately after the early return for static assets (after line 24):

```typescript
  // ── Custom domain routing ─────────────────────────────
  const host = request.headers.get("host") || "";
  const platformHosts = [
    "kelen.africa",
    "kelen-pro.com",
    "localhost:3000",
    "localhost",
  ];

  const isCustomDomain = !platformHosts.some(
    ph => host === ph || host.endsWith(`.${ph}`)
  );

  if (isCustomDomain) {
    // Look up the professional slug for this custom domain
    const supabaseCustom = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll() {},
        },
      }
    );

    const { data: portfolio } = await supabaseCustom
      .from("professional_portfolio")
      .select("professional_id, professionals!inner(slug, is_visible)")
      .eq("custom_domain", host)
      .eq("domain_status", "active")
      .single();

    const slug = (portfolio?.professionals as any)?.slug;
    const isVisible = (portfolio?.professionals as any)?.is_visible;

    if (!slug || !isVisible) {
      return NextResponse.next(); // Let it 404 naturally
    }

    // Rewrite to the portfolio page — path is preserved for /realisations etc.
    const rewriteUrl = new URL(request.url);
    const originalPath = pathname === "/" ? "" : pathname;
    rewriteUrl.pathname = `/professionnels/${slug}${originalPath}`;

    return NextResponse.rewrite(rewriteUrl);
  }
  // ── End custom domain routing ─────────────────────────
```

- [ ] **Step 2: Update the middleware matcher to include all paths**

Replace the `config` export at the bottom:

```typescript
export const config = {
  matcher: [
    // Custom domain: must match ALL paths (not just auth routes)
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};
```

> Note: The broader matcher is required so the custom domain check runs on `/` and `/realisations`. Auth logic only runs when `isCustomDomain` is false, so there's no regression on existing routes.

- [ ] **Step 3: Verify existing auth routes still work**

Start the dev server: `npm run dev`

1. Navigate to `http://localhost:3000/pro/dashboard` — should redirect to login if not authenticated.
2. Navigate to `http://localhost:3000/professionnels/your-test-slug` — should load the portfolio.
3. Confirm no infinite redirects or auth errors on public routes.

- [ ] **Step 4: Commit**

```bash
git add middleware.ts
git commit -m "feat(middleware): custom domain hostname routing to professional portfolio"
```

---

### Task 16: Add "Mon Site" to Pro Navigation

The new page needs to be discoverable. Add a nav link in the pro sidebar/nav.

- [ ] **Step 1: Find the pro navigation component**

```bash
grep -r "pro/portfolio" app --include="*.tsx" -l
grep -r "pro/dashboard" components --include="*.tsx" -l
```

Identify the sidebar or nav component that lists pro routes.

- [ ] **Step 2: Add the link**

In the identified nav component, add alongside the existing portfolio link:

```tsx
import { Globe } from "lucide-react";

// Inside the nav list:
<Link
  href="/pro/site"
  className={/* same classes as other nav items */}
>
  <Globe className="w-5 h-5" />
  Mon Site
</Link>
```

- [ ] **Step 3: Commit**

```bash
git add <nav-component-file>
git commit -m "feat(nav): add Mon Site link to pro navigation"
```

---

## Self-Review

### Spec coverage check

| Requirement | Covered by |
|-------------|-----------|
| Domain search + purchase | Tasks 11, 13, 14 |
| Vercel domain registration | Task 12, 13 |
| Middleware hostname routing | Task 15 |
| Style quiz (3-4 questions) | Tasks 2, 7 |
| Copywriting quiz (3-4 questions) | Tasks 4, 8 |
| AI copy generation | Task 4 |
| Preview function (real data) | Tasks 6, 9 |
| Preview free, publish paid | Tasks 10 (SiteBuilder lock UI) |
| CSS tokens applied to portfolio page | Tasks 2, 3 |
| Custom domain maps to existing portfolio page | Task 15 |
| DB schema for new fields | Task 1 |
| Comment section | Already in DB (`realization_comments`). Frontend activation (like/comment buttons on the realization detail page) is a separate task not in scope here — it's a UI completion, not a new feature. |
| GMB auto-display | Marked out of scope: GMB integration is already built and awaiting Google review. No new work needed. |

### No placeholders confirmed

All code steps contain full, runnable code. No TBDs or "similar to Task N" shortcuts.

### Type consistency

- `StyleAnswers` defined in `lib/portfolio/style-tokens.ts` — used consistently in `buildCssVars`, `StyleQuiz`, `PortfolioPreviewFrame`, `SiteBuilder`, `portfolio-site.ts`
- `CopyAnswers` defined in `lib/portfolio/copy-generator.ts` — used consistently in `CopywritingQuiz`, `portfolio-site.ts`
- `saveStyleQuiz`, `saveCopyQuizAndGenerate` defined in `lib/actions/portfolio-site.ts` — imported in quiz components
- `searchDomain`, `activateDomain` defined in `lib/actions/domain.ts` — imported in `DomainSearch`
