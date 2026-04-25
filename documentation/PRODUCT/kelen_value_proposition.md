# Kelen — Updated Offer Summary

> For strategic positioning, market definition, and tone principles, see `kelen_positioning.md`.

## What Kelen Is

A professional visibility and trust platform. Professionals showcase their work and build credibility. Clients find, compare, and choose with confidence.

**Entry market:** Individuals managing construction and renovation projects between Europe and Africa — large sums, remote supervision, limited legal recourse. This is where the pain is most acute.

**Product scope:** Any professional with work to show and trust to build. Any client who needs to choose and rely on a professional for work they can't fully supervise themselves.

Kelen gives every professional a free profile. The quality of presentation is identical for all — what changes is the depth of content and Google visibility.

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

## Verification System (The Trust Foundation)

Independent of the commercial profile. Cannot be influenced by payment.

- **Gold status** — 3+ verified recommendations linked to contracts, zero signals
- **Grey status** — Default, no verified history yet
- **Red status** — 1 verified signal of contract breach — permanent, irreversible

The status badge appears on the profile. Kelen never says "this professional is reliable" — it shows documented evidence and lets the user conclude.

Zero tolerance: one verified contract breach permanently marks a professional on the platform.

---

## Revenue Model

**Revenue:** Professional subscriptions only.
- 3,000 XOF/month (West Africa — Wave, Orange Money, MTN Mobile Money)
- €15/month (Europe — Stripe)

**Not a revenue model:** Google Ads, CPM, charging clients, charging for trust.

**The incentive logic:**
- Clients are free → maximum reach, maximum credibility
- Validation is free → cannot be gamed or purchased
- Visibility is paid → only professionals with something to show will pay

**Geographic rollout:**
- Launch: Francophone Africa (Senegal, Côte d'Ivoire, Mali, Cameroon, Gabon, Congo)
- Phase 2: Francophone Europe (France, Belgium, Switzerland, Luxembourg)
- Long term: any market with professional-client trust problems

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

Bark serves convenience — cleaning, design, low-stakes services. Kelen serves high-stakes decisions — construction, renovation, any engagement where a wrong choice is expensive and hard to reverse.

**For the professional:** Kelen is the only place where silent work becomes visible proof. High-quality portfolio presentation at scale doesn't exist for most professionals — not on Instagram (unstructured), not on personal websites (expensive), not on directories (no verified history).

**For the client:** Kelen is the only place where past delivery is documented, verified, and permanent. Not reviews. Evidence.

Kelen equalizes access to credibility. Not by claiming it — by documenting it.