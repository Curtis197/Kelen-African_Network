# Professional Portfolio — Stitch vs Current Implementation Audit

**Date:** 8 Avril 2026  
**Pages Compared:** `app/(marketing)/professionnels/[slug]/page.tsx`  
**Stitch Desktop:** `stitch/desktop/professional_portfolio/`  
**Stitch Mobile:** `stitch/mobile/stitch_kelen_african_network/professional_portfolio_mobile_v3/`

---

## 1. Page Structure Overview

| Section | Stitch Desktop | Stitch Mobile | Current Implementation | Status |
|---------|---------------|---------------|----------------------|--------|
| **Top Nav** | Fixed glassmorphism bar with brand + links + CTA | Fixed bar with profile avatar + brand + verified icon | ❌ Missing entirely | 🟡 Gap | //the stitch navbar is irrelevant
| **Hero** | `h-[80vh]` full-bleed image with `bg-on-surface/30` overlay | `h-[80vh]` full-bleed with `bg-gradient-to-b from-transparent to-surface/80` | `min-h-[60vh] md:min-h-screen` with side-floating card | 🔴 Differs | // the stitch structure is perfect
| **Hero Card (overlap)** | `-mt-[16vh]`, centered `max-w-5xl`, 2-column layout with stats grid on right | `-mt-[16vh]`, full-width card, 2-col grid (Expérience/Status) | Side-floating card in hero, not overlapping | 🔴 Differs | // the stitch struture is perfect
| **Portfolio Section** | Featured (100%, h-[600px]) + 50/50 grid for secondary | Featured (col-span-2, aspect-16/9) + 2 square cards | 8/4 split with `md:col-span-8` + `md:col-span-4` | 🟡 Partial | // the stitch structure is perfect
| **About Section** | 2-column: text left + image right with floating badge | Stacked list with icon + description rows | 2-column with values grid + image with floating badge | ✅ Aligned |
| **Contact Section** | Centered card with 2-col split (info left, action buttons right) | Centered card with avatar, stacked buttons | Centered card with 2-col split | ✅ Aligned |
| **Footer** | Simple bar with brand + links + copyright | Bottom navigation bar (4 tabs) | ❌ Missing entirely | 🟡 Gap |// lets try the stitch version
| **Mobile Bottom Nav** | N/A | 4-tab rounded bar (Portfolio, Projects, Experience, Contact) | ❌ Missing | 🔴 Gap | // is irrelevant

---

## 2. Detailed Section-by-Section Audit

### 2.1 Top Navigation

**Stitch Desktop:**
- Fixed, glassmorphism: `bg-surface/70 backdrop-blur-xl`
- Brand "SERVICEX" left, nav links center, "Get in Touch" CTA right
- Border: `border-outline-variant/10`

**Stitch Mobile:**
- Fixed, `bg-stone-50/70 backdrop-blur-xl`
- Profile avatar (rounded-full) + brand name left, verified icon right

**Current:**
- ❌ No top nav exists on this page
- The nav is provided by a layout wrapper elsewhere

**Recommendation:** Add a page-level nav or rely on layout. If relying on layout, ensure it matches the glassmorphism style.

---
// no need of this
### 2.2 Hero Section

| Property | Stitch Desktop | Stitch Mobile | Current |
|----------|---------------|---------------|---------|
| Height | `h-[80vh]` | `h-[80vh]` | `min-h-[60vh] md:min-h-screen` |
| Overlay | `bg-on-surface/30` (flat) | `bg-gradient-to-b from-transparent to-surface/80` | `bg-black/20` |
| Card Position | Separate section, `-mt-[16vh]` overlap | Separate section, `-mt-[16vh]` overlap | Inside hero, side-floating (`md:w-[35vw]`) |
| Card Style | `surface-container-lowest`, `p-10 md:p-16`, `rounded-2xl`, `shadow-lifting` | `surface-container-lowest`, `p-8`, `rounded-2xl`, `shadow-sm` | `surface/70 backdrop-blur-2xl`, `rounded-[2rem]`, `shadow-2xl` |
| Title | `text-4xl md:text-6xl`, `font-headline font-extrabold`, `tracking-tighter` | `text-3xl`, `font-extrabold`, `tracking-tight` | `text-2xl sm:text-3xl md:text-5xl`, `font-black` |
| Tagline | `text-lg md:text-xl`, `border-l-4 border-primary pl-6`, italic | `text-lg`, italic, `leading-relaxed` | `text-sm md:text-lg`, `border-l-4 border-kelen-green-600 pl-3 md:pl-4` |
| Buttons | `bg-primary`, `bg-surface-container-high` | N/A (in overlap card) | `bg-gradient-to-br from-kelen-green-600 to-kelen-green-500`, `bg-surface-container-high` |
| Stats Grid | 4 stats in 2-col grid on right side of card | 2 stats in 2-col grid below title | ❌ Stats are badges (Rank, Verified) not metrics |

**Key Differences:**
- 🔴 Current hero uses a **side-floating card** approach; stitch uses a **full-bleed hero + overlapping card** below
- 🔴 Current has no explicit stats grid (Experience, Location, Specialty, Status)
- 🟡 Current overlay is `bg-black/20` vs stitch's `bg-on-surface/30`
- 🟡 Current hero is `min-h-screen` on desktop (taller than stitch's `80vh`)

---

### 2.3 Portfolio / Réalisations Section

| Property | Stitch Desktop | Stitch Mobile | Current |
|----------|---------------|---------------|---------|
| Layout | Featured: `h-[600px]` 100% width + 50/50 grid for 2 secondary | Featured: `col-span-2` + 2 square cards | 8/4 col split (`md:col-span-8` + `md:col-span-4`) |
| Featured Image | `h-[600px]`, overlay on hover | `aspect-[16/9]` | `aspect-[4/3] md:aspect-auto md:h-[600px]` |
| Secondary Cards | `h-80` image + text body below | `aspect-square` image + small title | Stacked in `grid-rows-2` |
| Hover Effect | `scale-105` on image, overlay appears | `scale-105` on image | `scale-110`, overlay with title |
| Card Style | `shadow-soft`, `border-outline-variant/10` | `bg-surface-container-low` | `shadow-sm`, `bg-white` or `bg-stone-100` |
| Section Header | Tagline + `text-4xl` title + divider line + italic description | `text-2xl` title + green accent bar | `text-4xl md:text-5xl` + tagline + "Voir toutes" link |

**Key Differences:**
- 🔴 Current uses an **8/4 asymmetric split** for featured vs secondary; stitch uses **100% + 50/50**
- 🟡 Current secondary cards are stacked in rows; stitch desktop shows them side-by-side
- 🟡 Current has placeholder "Plus de projets à venir"; stitch doesn't
- ✅ Hover effects and transitions are well-aligned

---

### 2.4 About Section

| Property | Stitch Desktop | Stitch Mobile | Current |
|----------|---------------|---------------|---------|
| Background | `bg-surface-container-low` | `bg-surface-container-low` with `rounded-t-[3rem]` | `bg-stone-50` with `rounded-t-[3rem] md:rounded-none` |
| Layout | 2-column grid | Stacked icon + description list | 2-column grid |
| Values | 3 values in a row with icons, separated by borders | 3 values with icons in `rounded-2xl bg-primary/10` | 3 values in `bg-white rounded-2xl` cards |
| Image | `h-[600px]`, `grayscale hover:grayscale-0`, floating badge bottom-right | N/A (no image section) | `h-[350px] sm:h-[450px] md:h-[700px]`, same grayscale effect |
| Floating Badge | `bg-surface-container-lowest`, verified badge with gold icon | N/A | White card with profile pic or gold award badge |

**Key Differences:**
- ✅ Structure is well-aligned (2-col, values, image with badge)
- 🟡 Current values use individual white cards vs stitch's inline bordered items
- 🟡 Current uses Lucide icons vs Material Symbols in stitch

---

### 2.5 Contact Section

| Property | Stitch Desktop | Stitch Mobile | Current |
|----------|---------------|---------------|---------|
| Background | `bg-surface` | N/A (integrated in page) | `bg-white` |
| Card | `bg-surface-container-lowest`, `rounded-2xl`, `p-10 md:p-16`, `shadow-xl` | `bg-surface-container-lowest`, `p-8`, `rounded-2xl` | `bg-stone-50`, `rounded-[3rem]`, `p-6 sm:p-8 md:p-20` |
| Top Accent | None | None | `h-1.5 md:h-2 bg-gradient-to-r from-kelen-green-400 via-kelen-green-600` |
| Layout | 2-col split: info left, action buttons right | Stacked with avatar + buttons | 2-col split: info left, action buttons right |
| Buttons | Row-style with `chevron_right` on hover | Full-width call button + 2-col grid (WhatsApp, Email) | Row-style with `ChevronRight` icon |
| Avatar | None | `w-24 h-24` rounded-full with verified badge | ❌ No avatar in contact section |

**Key Differences:**
- ✅ 2-column split layout is well-aligned
- 🟡 Current has a green gradient top bar (not in stitch)
- 🟡 Current button style differs (has chevron icon, stitch uses hover reveal)
- 🟡 Mobile version lacks the avatar + stacked button layout from stitch

---

### 2.6 Footer

| Property | Stitch Desktop | Stitch Mobile | Current |
|----------|---------------|---------------|---------|
| Desktop Footer | `bg-surface-container-low`, brand + links + copyright | N/A | ❌ Missing |
| Mobile Bottom Nav | N/A | 4-tab bar: Portfolio, Projects, Experience, Contact | ❌ Missing |

**Key Differences:**
- 🔴 No footer exists on current page
- 🔴 No mobile bottom navigation

---
no need of footer chnae

## 3. Design System Alignment

### 3.1 Colors

| Token | Stitch Value | Current Usage | Match? |
|-------|-------------|--------------|--------|
| `surface` | `#f9f9f8` | ✅ Used | ✅ |
| `surface-container-low` | `#f3f4f3` | ❌ Uses `bg-stone-50` | 🟡 |
| `surface-container-lowest` | `#ffffff` | ✅ Uses `bg-white` | ✅ |
| `surface-container-high` | `#e8e8e7` | ✅ Used | ✅ |
| `surface-container-highest` | `#e2e2e2` | Not used | 🟡 |
| `primary` | `#006c49` | ❌ Uses `kelen-green-600` | 🟡 |
| `primary-container` | `#10b77f` | ❌ Uses `kelen-green-500` | 🟡 |
| `on-surface` | `#1a1c1c` | ❌ Uses `stone-900` | 🟡 |
| `on-surface-variant` | `#3c4a42` | ❌ Uses `stone-600` | 🟡 |
| `outline-variant` | `#bbcabf` | ❌ Uses `stone-100` | 🟡 |

### 3.2 Typography

| Element | Stitch | Current | Match? |
|---------|--------|---------|--------|
| Headline Font | Manrope (`font-headline`) | Default (font-black) | 🟡 Font class not applied |
| Body Font | Inter (`font-body`) | Default | 🟡 Font class not applied |
| H1 | `font-headline font-extrabold text-4xl md:text-6xl tracking-tighter` | `text-2xl sm:text-3xl md:text-5xl font-black` | 🟡 |
| H2 | `font-headline font-bold text-4xl` | `text-4xl md:text-5xl font-black` | 🟡 |
| Labels | `text-[10px] uppercase font-bold tracking-widest` | `text-[10px] font-black uppercase tracking-[0.2em]` | ✅ |

### 3.3 Border Radius

| Element | Stitch | Current | Match? |
|---------|--------|---------|--------|
| Cards | `rounded-2xl` (1.5rem) | `rounded-2xl` to `rounded-[3rem]` | 🟡 Inconsistent |
| Buttons | `rounded-md` (0.75rem) | `rounded-xl` to `rounded-2xl` | 🟡 |
| Hero Card | `rounded-2xl` | `rounded-[2rem]` | 🟡 |
| Section rounding | None | `rounded-t-[3rem]` on about section | 🟡 Mobile matches, desktop doesn't |

### 3.4 Shadows

| Token | Stitch | Current | Match? |
|-------|--------|---------|--------|
| `shadow-lifting` | `0 20px 25px -5px rgba(0,0,0,0.1)...` | `shadow-2xl`, `shadow-3xl` (custom) | 🟡 Heavier in current |
| `shadow-soft` | `0 4px 6px -1px rgba(0,0,0,0.05)...` | `shadow-sm` | ✅ |
| Card shadows | Subtle, tonal layering | Heavy `shadow-2xl`, `shadow-3xl` | 🔴 Too heavy |

---

## 4. Missing Elements (Not in Current)

1. **Stats grid in hero card** — Experience, Location, Specialty, Status
2. **Desktop footer** — Brand + links + copyright
3. **Mobile bottom navigation** — 4-tab bar
4. **Mobile contact avatar** — Rounded-full image with verified badge
5. **Section header divider line** — Horizontal `h-px` line between title and description
6. **Italic description paragraph** in portfolio header ("Une sélection de projets...")
7. **Hover reveal chevrons** on contact buttons (stitch uses `opacity-0 group-hover:opacity-100`)
8. **Grayscale-to-color transition** on about image (partially implemented)
9. **Selection colors** (`selection:bg-primary-container selection:text-on-primary-container`)

---

## 5. Elements in Current but NOT in Stitch

1. **Status badges** (Gold/Silver/White/Red/Black rank) — Stitch uses simple "Expert Vérifié"
2. **"Add to Project" dialog** — Kelen-specific feature
3. **Recommendations section** — Kelen-specific social proof
4. **Green gradient top bar** on contact card
5. **Placeholder "Plus de projets à venir"** card
6. **Floating profile card** on about section image
7. **Reviews data** from `reviews` table (fetched but unused)

---

## 6. Priority Recommendations

### 🔴 Critical (Structural Differences)

| # | Issue | Fix |
|---|-------|-----|
| 1 | Hero approach differs (side-card vs overlap card) | Restructure to `80vh` full-bleed hero + separate `-mt-[16vh]` overlap card |
| 2 | Portfolio layout differs (8/4 vs 100%+50/50) | Change to featured full-width + 2-col secondary grid |
| 3 | No footer | Add desktop footer + mobile bottom nav |
| 4 | Stats grid missing from hero card | Add 4-metric grid (Experience, Location, Specialty, Status) |

### 🟡 Moderate (Styling Differences)

| # | Issue | Fix |
|---|-------|-----|
| 5 | Color tokens inconsistent | Replace `stone-*` and `kelen-green-*` with stitch tokens (`surface`, `primary`, etc.) |
| 6 | Font classes not applied | Use `font-headline` and `font-body` consistently |
| 7 | Shadow weights too heavy | Replace `shadow-2xl/3xl` with `shadow-lifting` / `shadow-sm` |
| 8 | Border radius inconsistency | Standardize to `rounded-2xl` for cards, `rounded-md` for buttons |
| 9 | Contact section lacks mobile avatar | Add profile avatar with verified badge for mobile |
| 10 | Section headers lack divider line | Add `h-px bg-outline-variant/20` divider + italic description |

### 🟢 Minor (Polish)

| # | Issue | Fix |
|---|-------|-----|
| 11 | Selection colors missing | Add `selection:bg-primary-container selection:text-on-primary-container` |
| 12 | Contact button hover differs | Switch from chevron icon to opacity-reveal chevron |
| 13 | Green gradient top bar on contact | Remove or replace with stitch style |
| 14 | Values use individual cards | Switch to inline bordered items with dividers |

---

## 7. Summary Score

| Category | Score | Notes |
|----------|-------|-------|
| Structure | 5/10 | Hero + portfolio layouts differ significantly |
| Styling | 6/10 | Color tokens, fonts, shadows need alignment |
| Components | 7/10 | Contact and about sections are close; nav/footer missing |
| Mobile | 4/10 | No bottom nav, no avatar, hero not optimized |
| Design System | 6/10 | Core philosophy present but token usage inconsistent |

**Overall: 5.6/10** — The current page captures the spirit of the stitch design but needs structural restructuring (hero, portfolio) and token standardization to achieve pixel-level alignment.
