# Kelen — Value Proposition
*Version 2.0 — Updated 2026-04-25*

> For strategic positioning and market definition, see `kelen_positioning.md`.
> This document details what the product delivers and why it matters.

---

## The Core Value Exchange

**Professional pays.** Gets digital presence, visibility, and tools to manage client relationships.

**Client pays nothing.** Gets access to verified professionals, their documented work, and tools to manage their projects.

**Kelen earns** from professionals who want to be found — not from clients, not from reputation scores.

---

## Value for the Professional

### The problem it solves

Most African professionals have no digital presence. Not because they lack the skill or the work — but because existing options require money, technical knowledge, or both. A personal website costs hundreds of euros and months of back-and-forth with a developer. Instagram is unstructured and disappears. WhatsApp photos get lost. Business cards become outdated.

The result: excellent professionals are invisible to clients who would hire them immediately if they could find them.

### The three outputs

Every Kelen profile automatically generates three things:

**1. A professional website**
Structured as a commercial landing page — not a CV. Hero image (their best work), project gallery, services, contact. Indexed on Google with paid subscription. Shareable as a direct URL. Updated in real time as the professional adds projects.

**2. A PDF portfolio**
Generated automatically from the profile. Clean, printable, sendable on WhatsApp in one tap. Does not require design skills, software, or internet at point of use. A plumber can hand it to a client at the end of a meeting.

**3. A Google My Business listing**
Synced from the profile. Appears when someone searches "plombier Dakar" or "électricien Abidjan." Local presence without local SEO expertise.

### Why the onboarding works

The entry bar is WhatsApp-level. If a professional can fill in a WhatsApp profile — name, photo, description, photos — they can create a Kelen profile. The process takes minutes. The website is ready immediately.

This is not simplification for unsophisticated users. This is removal of unnecessary barriers for professionals who are experts at their craft, not at digital tools.

### The reputation layer

Clients who have worked with a professional can submit a verified recommendation — with contract, photos, and timeline. Kelen verifies and publishes it. Each verified recommendation builds the professional's status (Gold, Silver, Unclassified).

This layer is independent of payment. A professional cannot buy a better status. A professional who delivers consistently earns it over time — and the status compounds with each new verified recommendation.

---

## Value for the Client

### The problem it solves

Finding a reliable professional is hard when you don't have a trusted network in the relevant sector — especially when the project is large, the professional is far, or both.

Word of mouth is limited. Facebook groups are noisy. Personal referrals don't scale. And once money is sent, there is limited recourse if something goes wrong.

### What Kelen gives them

**Search and discovery** — Find professionals by trade, location, and specialty. Browse portfolios and verified projects before making contact.

**Comparison** — Multiple profiles side by side. Documented work, not self-declared claims. Verified recommendations from real clients.

**Project creation** — Create a project, invite one or several professionals, compare their responses. The brief and the collaboration happen in one place.

**Collaboration** — Messages, documents, milestone tracking, all in the same space as the professional relationship. No lost WhatsApp threads, no email chains scattered across inboxes.

**Free, always** — Clients never pay. The platform's credibility depends on this. A client who pays for access is a client who questions the platform's neutrality.

---

## The Profile — Structure

Not a CV. A commercial landing page optimized for the professional's trade and location.

**Structure (in order):**

1. **Hero** — Full-width photo of best work · Name · One-line positioning (AI-generated or manual)
2. **Portfolio** — Project gallery with dates, location, and client testimony where available
3. **About** — Short description of the professional's activity · Values badges
4. **Contact** — Profile photo · Specialty · Zone · Phone · WhatsApp · Email · Kelen status badge

The professional's face appears in the contact section — not the hero. The work speaks first.

---

## AI Copywriting

Generated from a short questionnaire. Triggered by the professional when ready — not automatic.

**The questionnaire covers:**
- Personal values (select max 3): Honesty, Rigor, Punctuality, Transparency, Excellence, Discretion, Commitment, Simplicity
- Professional qualities (select max 3): Punctuality, Quality of finish, Listening, Guidance, Responsiveness, Budget respect, Advice, Reliability
- Client relationship style (single select)
- Communication frequency (single select)
- Project they're most proud of (optional free text)

**Two outputs from one questionnaire:**
- `bio_accroche` — 1 sentence for the hero section
- `bio_presentation` — 3–5 sentences for the About section

The AI generates from real inputs, not generic templates. The output sounds like the professional, not like a brochure.

---

## Pricing

| Feature | Free | Paid — 3,000 XOF / €15/month |
|---------|------|-------------------------------|
| Professional website | ✓ | ✓ |
| PDF portfolio export | ✓ | ✓ |
| Google My Business sync | ✓ | ✓ |
| AI copywriting | ✓ | ✓ |
| Basic statistics | ✓ | ✓ |
| Projects displayed | 3 max | Unlimited |
| Photos | 15 total | Unlimited |
| Videos | — | ✓ |
| Brand colors (logo upload) | — | ✓ |
| Google indexing (SEO) | — | ✓ |
| Appears in Kelen search results | — | ✓ |
| Google Analytics (GA4) | — | ✓ |
| Advanced in-app analytics | — | ✓ |
| Client collaboration module | — | ✓ |

**Free accounts** are accessible via direct URL but not indexed by Google and do not appear in Kelen discovery. They exist as a real product — 3 projects and 15 photos is enough to get started and share manually.

**Paid accounts** are server-side rendered with full dynamic metadata, Open Graph tags, and sitemap inclusion. A professional paying 3,000 XOF/month appears in Google when someone searches their trade in their city.

---

## Automatic Branding (Paid Only)

The professional uploads their logo. The `color-thief` library extracts the dominant color palette. Their profile adopts their brand colors — buttons, overlays, badges — with WCAG contrast verification for readability.

Three fields: `brand_primary`, `brand_secondary`, `brand_accent` (hex). Empty = Kelen default colors.

---

## SEO Strategy

Each professional profile is one URL: `kelen.com/pro/[slug]`

All SEO weight concentrated on this single page — not fragmented across project subpages. 500 professionals × 1 strong URL = 500 indexed pages targeting geo + trade queries ("villa construction Cocody", "électricien Dakar rénovation").

Only paid profiles appear in the sitemap. Free profiles are accessible but not submitted to Google.

---

## Status System

Independent of the commercial profile. Cannot be influenced by payment.

| Status | Criteria |
|--------|----------|
| 🟡 **Gold** | 3+ verified recommendations, rating ≥ 4.5/5, 90%+ positive |
| ⚪ **Silver** | 1–2 verified recommendations, rating ≥ 4.0/5, 80%+ positive |
| — **Unclassified** | No verified history yet |

The status badge appears on the profile. Kelen never says "this professional is reliable" — it shows documented evidence and lets the client conclude.

---

## What Makes This Different

**vs. Instagram:** Structured, findable on Google, verified by third parties — not an unstructured feed that disappears.

**vs. Personal website:** Zero technical barrier, zero design cost, immediately live — not months and hundreds of euros.

**vs. Bark / platform intermediaries:** The professional owns their profile and their client relationships. Kelen does not take commission. Kelen does not sit between professional and client as a marketplace intermediary.

**vs. Directories (Pages Jaunes, etc.):** Portfolio with real documented work, not just a name and phone number. Status from verified client recommendations, not self-declared claims.

**The fundamental difference:** Kelen equalizes access to credibility. A carpenter in Abidjan who has delivered ten excellent projects for ten years but has no digital presence is invisible. On Kelen, his work speaks for itself — publicly, searchably, verifiably.

---

## Technical Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, Supabase SSR
- **Rendering:** SSG (free profiles) / SSR (paid profiles) — same route, conditional behavior
- **Backend:** Supabase (PostgreSQL), Edge Functions (Deno/TypeScript)
- **Payments:** Stripe (EUR) + Wave/Orange Money (XOF)
- **AI:** Anthropic API — `claude-sonnet-4-6` for copywriting generation
- **Branding:** `color-thief` client-side color extraction
- **Storage:** Supabase Storage — 5 buckets (photos, videos, avatars, covers, logos)
