# Professional Website Template — Design Spec
**Date:** 2026-04-21  
**Status:** Draft — pending user review

---

## Context

Every professional on the Kelen platform currently has a dynamic profile page at `app/(marketing)/professionnels/[slug]/page.tsx`. The goal is to replace this with a **standardized website template** — the same shell for every professional, differentiated only by their content (photos, bio, services, etc.).

The philosophy is deliberately anti-trend: instead of hyper-personalization, offer one well-designed, functional template. Like Ikea, Ford, or Instagram — the structure is the brand. Professionals cannot redesign their page; they fill it.

---

## Customization Surface (minimal by design)

The only visual choices a professional can make:

| Option | Values |
|--------|--------|
| Corner style | Square · Half-rounded · Rounded |
| Color mode | Light · Dark · Logo-color (section backgrounds tinted with the pro's primary brand color, extracted from their uploaded logo via palette detection) |

Everything else — layout, typography, spacing, section order — is fixed.

---

## Color System

| Role | Color | Usage |
|------|-------|-------|
| Primary action | `#009639` Kelen green | Contact CTA, prices, "Voir tout", verified badge |
| Appointment | `#E05555` Soft red | "Prendre RDV" button only |
| Background nav/hero/contact | `#1a1a2e` Dark navy | Nav bar, hero, contact section footer |
| Social proof stars | `#FCCF00` Yellow | Google star ratings only |
| Surface | `#fff` / `#f5f5f5` | Alternating section backgrounds |

---

## Homepage — Section Order (fixed)

```
Nav
Hero
Présentation
Social Proof (Google)
Services
Réalisations
Produits
Newsletter
Contact
Footer
```

### Nav
- Left: professional's name (bold)
- Right: Services · Réalisations · Produits · **[📅 Prendre RDV]** (soft red) · **[Contact]** (green)
- Sticky on scroll

### Hero
- Full-width background image (pro's cover photo)
- Gradient overlay (bottom-heavy dark)
- Bottom-left: profession tag (uppercase, muted) + name (large bold) + one-line subtitle
- No CTA buttons — the hero is purely visual identity

### Présentation (replaces standalone À propos page)
- This block serves as the "About" section — there is no separate `/a-propos` list or detail page
- Short bio paragraph (pro-authored)
- Info pills: 📍 City · ⏱ Years of experience · 👥 Team size · ✓ Vérifié Kelen
- White background

### Social Proof
- Google rating badge: score + ★★★★★ + "Google" label
- Subtitle: "{n} avis · Mis à jour aujourd'hui"
- Horizontally scrolling row of Google review cards (auto-scroll, fade on right edge)
- Each card: stars · excerpt · reviewer name · date
- Only shown if pro has connected Google Business Profile
- Background: `#f5f5f5`

### Services / Réalisations / Produits sections
- Section header: title (bold) + "Voir tout →" link (green, right-aligned)
- Preview grid: 3 cards on desktop, 2 on mobile
- Each card shows: thumbnail/image placeholder + title + price + ♡ count + 💬 count
- "Voir tout →" leads to the list page for that section
- Sections hidden automatically if pro has no content in that category

### Newsletter
- Light green tinted background (`#f0faf4`)
- Centered: heading + subtitle + inline email input + "S'abonner" button (green)
- Footer note: "Pas de spam · Désabonnement en 1 clic"
- Powered by the platform's existing newsletter service

### Contact
- Dark navy background
- Heading + "Réponse sous 2h · Devis gratuit" subtitle
- **[📅 Prendre rendez-vous]** — soft red, full-width primary CTA
- Secondary row: **[WhatsApp]** (green) · **[Appeler]** (green) · **[Email]** (outlined)

### Footer
- Left: "© {year} {name} · kelen.africa"
- Right: "Kelen" in green

---

## List Pages — `/professionnels/[slug]/services`, `/realisations`, `/produits`

All three share one template.

### Structure
```
Breadcrumb nav (← Pro name / Section)
Section header (dark navy): pro name + profession · section title · item count
Grid of cards
```

### Card grid
- 2 columns mobile · 3 columns desktop
- Column count optionally adjustable by pro in dashboard (2 or 3)
- Each card:
  - Image (or color placeholder if no image)
  - Title
  - Short description or price
  - Engagement bar: ♡ {n} · 💬 {n}

---

## Detail Pages — `/professionnels/[slug]/services/[id]`, etc.

All three types (service, réalisation, produit) share one detail page template.

### Structure (top to bottom)

1. **Breadcrumb** — `← {Pro name} / {Section} / {Item title}`
2. **Main image** — full width, like count overlaid top-right
3. **Title block** — name + price/status + RDV + WhatsApp CTAs (always visible)
4. **Description** — prose text + meta pills (location, duration, warranty, etc.)
5. **Photo gallery** — 1 large featured + thumbnail grid, "+N more" indicator
6. **Videos** — horizontal row of video thumbnails with duration badge and play button
7. **Social thread**
   - Like count (♥ soft red when liked)
   - Comment count
   - Comment list: avatar initial · name · text · timestamp · nested like
   - Comment input: avatar placeholder + text field + send button
8. **Related items** — 2-card row from the same section

### Social engagement rules
- Anyone can like or comment — no account required
- Name field required to post a comment (no login)
- Likes are anonymous (no login required, stored by session/IP)

---

## Existing Code to Reuse

| What | Where |
|------|-------|
| Professional data fetching | `lib/actions/portfolio.ts` |
| Existing profile page (reference) | `app/(marketing)/professionnels/[slug]/page.tsx` |
| Google Reviews component | `components/pro/GoogleReviewsSection.tsx` |
| Newsletter widget | `components/portfolio/SubscribeWidget.tsx` |
| Booking widget (RDV) | Google Calendar integration in `app/api/auth/google/calendar/` |
| Realizations data | `lib/actions/realisations.ts` |
| Services data | `lib/actions/services.ts` |
| Portfolio settings (section visibility, style tokens) | `lib/actions/portfolio.ts` · `ProfessionalPortfolio` type |
| Media display | `components/portfolio/MediaGrid.tsx`, `MediaContent.tsx` |
| Recommendation scroll row | `components/portfolio/RecommandationScrollRow.tsx` |
| Design tokens | `app/globals.css` (MD3 + Kelen palette) |
| shadcn/ui components | `components/ui/` |

### New database tables needed
- `item_likes` — `{ id, item_type: 'service'|'realisation'|'produit', item_id, session_id, created_at }`
- `item_comments` — `{ id, item_type, item_id, author_name, body, created_at }` + nested `comment_likes`

---

## Pages to Create / Modify

| File | Action |
|------|--------|
| `app/(marketing)/professionnels/[slug]/page.tsx` | Refactor to new template |
| `app/(marketing)/professionnels/[slug]/services/page.tsx` | New — list page |
| `app/(marketing)/professionnels/[slug]/services/[id]/page.tsx` | New — detail page |
| `app/(marketing)/professionnels/[slug]/realisations/page.tsx` | New — list page |
| `app/(marketing)/professionnels/[slug]/realisations/[id]/page.tsx` | New — detail page |
| `app/(marketing)/professionnels/[slug]/produits/page.tsx` | New — list page |
| `app/(marketing)/professionnels/[slug]/produits/[id]/page.tsx` | New — detail page |
| `components/pro-site/` | New component folder for all template components |
| `supabase/migrations/` | New migration for likes + comments tables |

---

## Verification

1. Visit `/professionnels/[slug]` — confirm all 9 sections render in correct order
2. Click "Voir tout →" on Services — confirm list page loads with grid
3. Click a service card — confirm detail page renders all 7 blocks
4. Post a comment without logging in — confirm name + comment saves and displays
5. Like an item — confirm count increments, no login required
6. Toggle corner style in pro dashboard — confirm border-radius updates site-wide
7. Toggle dark mode — confirm color mode applies correctly
8. Hide a section in dashboard — confirm section disappears from homepage
9. Google reviews section — only visible if GBP connected
10. Newsletter — confirm email submit works via existing service
