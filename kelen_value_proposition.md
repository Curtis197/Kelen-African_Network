# Kelen — Updated Offer Summary

## What Kelen Is

A professional discovery and verification platform connecting the African diaspora in Europe with service providers in Francophone Africa. The core problem: diaspora members invest €20k–100k in construction and renovation projects with no reliable way to evaluate professionals remotely.

Kelen gives every professional a free mini website. The quality of presentation is identical for all — what changes is the depth of content and Google visibility.

---

## The Profile — A Commercial Landing Page

Not a CV. A landing page structured for conversion, following the standard of professional commercial websites.

**Structure (in order):**

1. **Hero** — Full-width photo of best work · Name · AI-generated one-liner tagline
2. **Portfolio** — Immersive project gallery
3. **About** — Short AI-generated presentation text · Values badges
4. **Contact** — Profile photo · Specialty · Zone · Phone · WhatsApp · Email · Kelen status badge

The professional's face appears in the contact section — not the hero. The work speaks first.

---

## AI Copywriting

Generated from a questionnaire. Triggered by the professional when ready — not automatic.

**The questionnaire covers:**
- Personal values (select max 3): Honesty, Rigor, Punctuality, Transparency, Excellence, Discretion, Commitment, Simplicity
- Professional qualities (select max 3): Punctuality, Quality of finish, Listening, Guidance, Responsiveness, Budget respect, Advice, Reliability
- Client relationship style (single select)
- Communication frequency (single select)
- Project they're most proud of (optional free text)
- Limits they refuse (optional multi-select + free text)

**Two outputs from one questionnaire:**
- `bio_accroche` — 1 sentence for the hero section
- `bio_presentation` — 3–5 sentences for the About section

---

## Pricing

| Feature | Free | Paid — 3,000 XOF / €15/month |
|---|---|---|
| Full mini website | ✓ | ✓ |
| AI copywriting generation | ✓ | ✓ |
| Basic statistics | ✓ | ✓ |
| Projects | 3 max | Unlimited |
| Photos | 15 total | Unlimited |
| Videos | — | ✓ |
| Automatic logo branding | — | ✓ |
| Rendering | SSG — static | SSR — dynamic |
| Google indexing | — | ✓ |
| XML Sitemap | — | ✓ |
| Google Analytics (GA4) | — | ✓ |
| Advanced in-app analytics | — | ✓ |

**Free accounts** are accessible via direct URL but not indexed by Google. They exist and work — they just aren't findable organically.

**Paid accounts** are server-side rendered with full dynamic metadata, Open Graph tags, and are included in the sitemap. A plumber in Dakar paying 3,000 XOF/month appears in Google when someone searches "plombier Dakar."

The free tier is generous enough to be a real showcase — 3 projects and 15 photos is sufficient to get started. Insufficient to document a career.

---

## Automatic Branding (Paid Only)

The professional uploads their logo. The `color-thief` library extracts the dominant color palette client-side. Their profile adopts their brand colors automatically — buttons, overlays, badges — with WCAG contrast verification to ensure readability.

Three fields stored in the database: `brand_primary`, `brand_secondary`, `brand_accent` (hex). If empty, the profile falls back to Kelen's default colors silently.

---

## SEO Strategy

Each professional profile is one URL: `kelen.com/pro/[slug]`

All SEO weight concentrated on this single page — not fragmented across individual project pages. 500 professionals × 1 strong URL = 500 indexed pages targeting geo + trade queries ("villa construction Cocody", "électricien Dakar rénovation").

Only paid profiles appear in the sitemap. Gratuitous profiles are accessible but not submitted to Google.

---

## Verification System (The Trust Layer)

Independent of the commercial profile. Cannot be influenced by payment.

- **Gold status** — 5+ verified recommendations linked to contracts
- **Grey status** — Default, no verified history yet
- **Red status** — 1 verified signal of contract breach — permanent, irreversible

The status badge appears in the contact section. Kelen never says "this professional is reliable" — it shows the documented evidence and lets the user conclude.

Zero tolerance: one verified contract breach ends a professional's credibility on the platform permanently.

---

## Revenue Model

**Phase 1 (Months 1–6):** Free for professionals. Google Ads on all pages covers partial infrastructure. Focus on SEO content accumulation.

**Phase 2 (Months 6–12):** Professional subscriptions activated (3,000 XOF / €15). Google Ads continues. At 50k monthly visitors, transition to direct advertising sales targeting diaspora-specific services (money transfers, banks, construction materials, airlines).

**Geographic rollout:**
- Launch: Francophone Africa (Senegal, Côte d'Ivoire, Mali, Cameroon, Gabon, Congo)
- Months 6–12: Francophone Europe (France, Belgium, Switzerland, Luxembourg)

---

## Technical Stack Summary

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, Supabase SSR
- **Rendering:** SSG (free profiles) / SSR (paid profiles) — same route, conditional behavior
- **Backend:** Supabase (PostgreSQL), Edge Functions (Deno/TypeScript)
- **Payments:** Stripe (EUR) + Wave/Orange Money (XOF)
- **AI:** Anthropic API — `claude-sonnet-4-20250514` for copywriting generation
- **Branding:** `color-thief` client-side color extraction
- **Storage:** Supabase Storage — 5 buckets (photos, videos, avatars, covers, logos)

---

## What Makes This Different

Bark says "trust us, we'll match you." Kelen says "here's everything, decide yourself."

Bark serves convenience — cleaning, design, low-stakes services. Kelen serves legitimate fear — construction, renovation, real estate, irreversible cross-border investments.

The portfolio is not a supporting feature. It's the core value proposition. High-quality portfolio presentation at this level of quality doesn't exist at scale for African artisans — not on Instagram (unstructured), not on personal websites (expensive), not on directories (no galleries).

Kelen equalizes that. Not by saying it — by making it visible.