# Frontend, Responsiveness & Design Audit

**Date:** 2026-04-04
**Scope:** All components, pages, CSS, and styling in the Next.js app

---

## 1. Responsiveness Issues

### 1.1 DashboardSidebar — No Mobile Navigation
**File:** `components/layout/DashboardSidebar.tsx:26`
**Severity:** HIGH

The client dashboard sidebar uses `hidden lg:block` with **zero mobile fallback**. Users on phones/tablets get no navigation in the `/dashboard` area. No bottom nav, no hamburger menu, no drawer.

**Fix:** Add a mobile bottom navigation bar or a slide-out drawer triggered by a hamburger button in the Navbar.

### 1.2 ProjectWizard — Fixed Footer Breaks on Mobile
**File:** `components/projects/ProjectWizard.tsx:194-195`
**Severity:** HIGH

```tsx
<footer className="fixed bottom-0 w-full z-50 h-24 ...">
  <div className="flex justify-between items-center px-12 h-full ...">
```

- `px-12` (48px) is too much horizontal padding on 320-375px screens — buttons get squished
- `h-24` (96px) consumes significant mobile viewport
- `max-w-[1440px]` is a hardcoded pixel value

**Fix:** Use responsive padding `px-4 md:px-12`, reduce height on mobile `h-16 md:h-24`.

### 1.3 ProjectWizard — Oversized Typography on Mobile
**File:** `components/projects/ProjectWizard.tsx:249, 267, 339, 360, 411, 471`
**Severity:** MEDIUM

Headings use `text-5xl lg:text-6xl` and budget inputs use `text-6xl lg:text-8xl`. On mobile these cause horizontal overflow and are illegible. Container padding `p-8 lg:p-16` is also excessive.

**Fix:** Add mobile breakpoints: `text-2xl md:text-4xl lg:text-5xl` for headings, `text-3xl md:text-5xl lg:text-7xl` for budget numbers.

### 1.4 ProfessionalDirectory — Static Pagination
**File:** `components/landing/ProfessionalDirectory.tsx:254-265`
**Severity:** MEDIUM

Pagination buttons are hardcoded with `h-12 w-12` and static page numbers (1, 2, 3, ..., 12). Not dynamically generated, will overflow on narrow screens. The "Voir plus" button has no loading state, no error state, and no actual pagination logic — it does nothing.

**Fix:** Generate pagination dynamically, add `aria-current="page"` to active page, make buttons responsive.

### 1.5 DevelopmentAreaRow — Card Horizontal Scroll
**File:** `components/projects/DevelopmentAreaRow.tsx:155`
**Severity:** LOW

`min-w-[320px] md:min-w-[400px]` — On screens 320-375px, cards require horizontal scrolling. The `max-w-[150px]` on member name truncation (line 191) is too aggressive.

**Fix:** Reduce to `min-w-[280px]` for small phones, increase name truncation to `max-w-[200px]`.

### 1.6 ProfileHero — Excessive Height and Padding
**File:** `components/shared/ProfileHero.tsx:16, 29`
**Severity:** MEDIUM

- `min-h-[85vh]` pushes content below the fold on mobile
- `p-12 md:p-20` on the glassmorphism card is excessive
- `w-full md:w-[35vw]` uses a hardcoded vw value

**Fix:** Use `min-h-[60vh] md:min-h-[85vh]` and `p-6 md:p-12 lg:p-20`.

### 1.7 ProSidebar — 7 Items in Bottom Nav
**File:** `components/layout/ProSidebar.tsx:86-107`
**Severity:** MEDIUM

7 navigation items in the mobile bottom bar with `overflow-x-auto`. Exceeds the recommended maximum of 5 items. `text-[9px]` font size is below the 10px readability minimum. Inline style `style={{ maxWidth: 56 }}` should be a Tailwind class.

**Fix:** Consolidate to 5 items, increase font to `text-[10px]`, replace inline style with `max-w-[56px]`.

### 1.8 SearchBar — Button Overlap on Narrow Screens
**File:** `components/shared/SearchBar.tsx:37-51`
**Severity:** LOW

The search button is absolutely positioned at `right-2` with `px-5`. On screens < 320px, button text may overlap input text.

**Fix:** Add `min-w-[280px]` to the form container.

---

## 2. Design Inconsistencies

### 2.1 Button Styles — 6 Different Variations
**Files:** Multiple form components
**Severity:** MEDIUM

| Component | Classes |
|---|---|
| `RegisterForm.tsx:432` | `rounded-lg bg-kelen-green-500 px-4 py-2.5 text-sm font-medium` |
| `LoginForm.tsx:119` | `... + shadow-sm` |
| `ReviewForm.tsx:160` | `rounded-lg bg-kelen-green-500 px-6 py-3 text-sm font-semibold shadow-sm active:scale-95` |
| `SignalForm.tsx:726` | `rounded-lg bg-kelen-red-500 px-8 py-2.5 text-sm font-semibold shadow-sm active:scale-95` |
| `ProProfileForm.tsx:259` | `rounded-2xl bg-kelen-green-500 py-4 text-sm font-black shadow-xl` |
| `RecommendationForm.tsx:581` | `rounded-lg bg-kelen-green-500 px-8 py-2.5 text-sm font-semibold shadow-sm active:scale-95` |

**Fix:** All buttons should use `buttonVariants` from `components/ui/button.tsx` with size/variant props.

### 2.2 Input Styles — 4 Different Variations
**Files:** Multiple form components
**Severity:** MEDIUM

| Component | Classes |
|---|---|
| `RegisterForm` | `rounded-lg border border-border bg-white px-4 py-2.5 text-sm` |
| `ProProfileForm` | `rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-sm` |
| `RealizationForm` | `rounded-xl bg-surface-container-low px-4 py-3 text-sm` (no border) |
| `ProjectWizard` | `rounded-2xl bg-surface-container-low px-6 py-4` (no border, larger) |

**Fix:** Create a shared `Input` component in `components/ui/input.tsx` with consistent styling.

### 2.3 Card Padding — No Consistent Scale
**Files:** Multiple card components
**Severity:** LOW

| Component | Padding |
|---|---|
| `ProfessionalCard` | `p-5 sm:p-8` |
| `ReviewCard` | `p-6` |
| `SignalCard` | `p-6` |
| `RecommendationCard` | `p-6` |
| `ProjectStepCard` | `p-8` |
| `RealizationCard` | `p-6` |

**Fix:** Standardize to `p-4 sm:p-6 lg:p-8` across all cards.

### 2.4 Status Badges — Inline Instead of Component
**Files:** Multiple
**Severity:** MEDIUM

A `StatusBadge` component exists at `components/shared/StatusBadge.tsx` but is not used. Instead:
- `ProjectsPage.tsx:125` — inline `px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider`
- `DevelopmentAreaRow.tsx:160` — inline `px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest`
- `ProjectStepCard.tsx:93` — inline `px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em]`

**Fix:** Replace all inline status badges with `<StatusBadge>` component.

### 2.5 Emoji Icons in Sidebars
**Files:** `AdminSidebar.tsx:8-10`, `ProSidebar.tsx:8-14`, `DashboardSidebar.tsx:8-11`
**Severity:** LOW

Emoji icons (`📊`, `📋`, `📜`, `👤`, `🏗️`, `✓`, `⚠️`, `💎`, `📈`) are inconsistent with the rest of the app which uses Material Symbols. They render differently across platforms.

**Fix:** Replace all emoji icons with Material Symbols or Lucide icons.

### 2.6 Dual Color System
**File:** `app/globals.css`
**Severity:** MEDIUM

The CSS defines **two parallel color systems**:
1. **Kelen palette:** `--color-kelen-green-500`, `--color-kelen-red-500`, etc.
2. **Material Design 3:** `--color-primary`, `--color-surface`, `--color-on-surface`, etc.

Components inconsistently use both:
- `ProjectWizard.tsx` uses MD3 tokens (`bg-surface`, `text-on-surface`, `bg-primary`)
- `Navbar.tsx` uses Kelen tokens (`bg-white`, `bg-kelen-green-500`)
- `ProfessionalCard.tsx` uses raw values (`bg-white`, `text-stone-900`)

**Fix:** Choose one system as primary. Map Kelen colors to MD3 semantic roles, then use only semantic tokens (`bg-surface`, `text-on-surface`) in components.

---

## 3. Accessibility Issues

### 3.1 Missing aria-labels — Only 8 in Entire Codebase
**Files:** Multiple
**Severity:** HIGH

Major gaps:
- `SearchBar.tsx:38` — search input has no `aria-label`
- `FilterPanel.tsx:30, 40` — mode toggle buttons have no `aria-label`
- `ProfessionalDirectory.tsx:131, 151, 173` — select and input elements have no labels
- `DevelopmentAreaRow.tsx:215, 222, 227, 237, 245` — rank/sort buttons have no `aria-label`
- `ProjectStepCard.tsx:99, 105` — edit/delete buttons lack `aria-label`
- `RealizationCard.tsx:81, 89` — edit/delete buttons lack `aria-label`

### 3.2 Non-Semantic Clickable Elements
**File:** `components/shared/ProfessionalCard.tsx:81`
**Severity:** HIGH

Uses `<span>` as a clickable card wrapper with `onClick`. Not keyboard-navigable (no Tab focus, no Enter/Space activation). Screen readers don't announce it as interactive.

**Fix:** Change to `<button>` or `<a>` with proper `role`, `tabIndex`, and `onKeyDown` handlers.

### 3.3 Star Rating Not Accessible
**File:** `components/forms/ReviewForm.tsx:106-128`
**Severity:** HIGH

5 button elements with no `aria-label` (e.g., "Rate 3 out of 5 stars"), no `role="radiogroup"`, no keyboard navigation. Screen readers announce "button" five times with no context.

**Fix:** Wrap in `<fieldset>` with `<legend>`, use `role="radiogroup"` on container, `role="radio"` on each star with `aria-label="X stars"`.

### 3.4 Form Labels Missing htmlFor/id Association
**Files:** Multiple
**Severity:** HIGH

| File | Lines | Issue |
|---|---|---|
| `ProfessionalDirectory.tsx` | 131, 151 | `<select>` elements lack `id` and `<label htmlFor>` |
| `FilterPanel.tsx` | 55, 68, 81 | `<select>` elements lack labels entirely |
| `SignalForm.tsx` | 294, 310, 327, 343 | Many inputs lack `id` and associated `htmlFor` |
| `RecommendationForm.tsx` | — | Same pattern as SignalForm |

### 3.5 Color Contrast Failures
**Files:** Multiple
**Severity:** MEDIUM

- `text-[9px]` and `text-[10px]` with `text-on-surface-variant/40` or `text-stone-400` likely fail WCAG AA (4.5:1 for normal text)
- `DevelopmentAreaRow.tsx:131` — `text-on-surface-variant/40` at 40% opacity fails contrast
- `ProfessionalDirectory.tsx:196` — `text-muted-foreground` on `bg-surface-container-lowest` needs verification

### 3.6 Modal Focus Management
**Files:** `AddStepDialog.tsx`, `AssignStepProDialog.tsx`, `AddExternalProModal.tsx`, `AddToProjectDialog.tsx`
**Severity:** MEDIUM

None of the custom modals manage focus trapping or return focus on close. Users can tab behind the modal overlay.

**Fix:** Use the shared `DialogContent` from `components/ui/dialog.tsx` which has proper focus management, or implement focus trapping manually.

---

## 4. Dark Mode Issues

### 4.1 Hardcoded White Backgrounds — 12 Components
**Files:** Multiple
**Severity:** HIGH

Components use `bg-white` instead of `bg-background` or `bg-surface`:

| File | Line |
|---|---|
| `Navbar.tsx` | 70, 177 |
| `AuthLayout.tsx` | 19 |
| `LoginForm.tsx` | 81 |
| `RegisterForm.tsx` | 196 |
| `AddStepDialog.tsx` | 86 |
| `AssignStepProDialog.tsx` | 93 |
| `AddToProjectDialog.tsx` | 78 |
| `ProjectStepCard.tsx` | 65 |
| `ProfessionalDirectory.tsx` | 254 |

These appear as bright white boxes in dark mode.

### 4.2 Hardcoded Stone Text Colors — 5 Components
**Files:** Multiple
**Severity:** HIGH

Components use `text-stone-900`, `text-stone-500`, `text-stone-400`, `text-stone-300`, `text-stone-600`, `text-stone-200` instead of semantic tokens:

| File | Colors Used |
|---|---|
| `ProjectStepCard.tsx` | `text-stone-900`, `text-stone-500`, `text-stone-400`, `text-stone-300` |
| `ProjectStepsSection.tsx` | `text-stone-900`, `text-stone-500`, `text-stone-600`, `text-stone-200` |
| `AddStepDialog.tsx` | `text-stone-900`, `text-stone-500`, `text-stone-400` |
| `AssignStepProDialog.tsx` | `text-stone-900`, `text-stone-500`, `text-stone-400`, `text-stone-300` |
| `AddToProjectDialog.tsx` | `text-stone-900`, `text-stone-500`, `text-stone-400`, `text-stone-300` |

These will be unreadable in dark mode.

### 4.3 No Dark Mode Toggle
**Severity:** MEDIUM

Dark mode CSS variables are defined in `globals.css:161-195` and activated by `.dark` class on `<html>`, but there is **no toggle** anywhere in the UI. Users cannot switch modes.

**Fix:** Add a theme toggle component that sets/removes the `dark` class on `<html>` and persists preference in localStorage.

---

## 5. Hardcoded Values

### 5.1 Demo User Data in Layout Components
**Files:** Multiple
**Severity:** LOW

| File | Line | Hardcoded Value |
|---|---|---|
| `AdminSidebar.tsx` | 67 | `admin@kelen.africa` |
| `ProSidebar.tsx` | 68-72 | `Kouadio Construction`, `contact@kouadio-construction.ci` |
| `DashboardSidebar.tsx` | 62 | `demo@kelen.africa` |

**Fix:** Pull from user session/context.

### 5.2 Hardcoded Placeholder Image URL
**File:** `components/shared/ProfileHero.tsx:13`
**Severity:** LOW

A hardcoded Google/AI-generated placeholder image URL. Should be in `public/` or a configured CDN.

### 5.3 Arbitrary Shadow Values
**Files:** Multiple
**Severity:** LOW

| File | Line | Value |
|---|---|---|
| `ProfessionalCard.tsx` | 83 | `shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)]` |
| `ProjectWizard.tsx` | 194 | `shadow-[0_-4px_24px_rgba(0,0,0,0.04)]` |

**Fix:** Define in Tailwind config as named shadow tokens.

### 5.4 Duplicate `cn()` Utility
**Files:** `ProjectWizard.tsx:8-12`, `ProjectStepCard.tsx:5-9`
**Severity:** LOW

Both files define their own `cn()` utility instead of importing from `@/lib/utils`.

---

## 6. Debug Code in Production

### 6.1 Verbose Console Logging
**File:** `components/forms/RegisterForm.tsx:94, 106, 112, 119, 128`
**Severity:** MEDIUM

Multiple `console.log` statements with detailed debug output including user data and auth responses.

### 6.2 Action Logging
**Files:** `lib/actions/project-steps.ts:8`, `lib/actions/projects.ts:9`
**Severity:** LOW

`console.log(JSON.stringify({ ts: new Date().toISOString(), action, ...data }))` — logs all action data. Should use a proper logging service.

### 6.3 All `console.error` Locations (acceptable but should migrate)
- `LoginForm.tsx:55`
- `ReviewForm.tsx:63`
- `SignalForm.tsx:206`
- `RecommendationForm.tsx:151`
- `ProProfileForm.tsx:50, 105`
- `RealizationForm.tsx:94, 112, 118`
- `UpdatePasswordForm.tsx:44`
- `PasswordResetForm.tsx:28`
- `ProfessionalCard.tsx:74`
- `ProjectStepsSection.tsx:57`
- `AddStepDialog.tsx:70`
- `AssignStepProDialog.tsx:44, 78`
- `RealizationCard.tsx:38`

---

## 7. Component Complexity

### 7.1 Oversized Components
**Severity:** MEDIUM

| Component | Lines | Should Be Split Into |
|---|---|---|
| `SignalForm.tsx` | 750 | 6-7 step components |
| `RecommendationForm.tsx` | 597 | 5-6 step components |
| `ProjectWizard.tsx` | 505 | 5 step components |
| `DevelopmentAreaRow.tsx` | 326 | ProfessionalCard sub-component |
| `ProfessionalDirectory.tsx` | 269 | FilterBar sub-component |

---

## 8. Modal/Dialog Issues

### 8.1 Custom Modals Don't Use Shared Dialog
**Files:** `AddStepDialog.tsx`, `AssignStepProDialog.tsx`, `AddExternalProModal.tsx`, `AddToProjectDialog.tsx`
**Severity:** MEDIUM

All 4 implement their own overlay/positioning instead of using `DialogContent` from `components/ui/dialog.tsx`. Results in:
- Inconsistent sizing (`max-w-xl`, `max-w-md`, `max-w-lg`)
- Inconsistent padding (`p-8`, `p-8 lg:p-12`)
- Inconsistent border radius (`rounded-[2.5rem]`)
- No focus trapping
- No escape key handling
- No scroll containment

### 8.2 Modal Overflow on Small Screens
**File:** `AssignStepProDialog.tsx:110`
**Severity:** LOW

`max-h-[50vh] overflow-y-auto` — on landscape phones, 50vh is too small. Should use `max-h-[calc(100vh-8rem)]`.

---

## 9. Image Responsiveness

### 9.1 ProfileHero — No Next.js Image
**File:** `components/shared/ProfileHero.tsx:19`
**Severity:** MEDIUM

Uses `<img>` instead of Next.js `<Image>`. Missing `width`, `height`, and `loading="lazy"`.

### 9.2 ProfessionalCard — No Width/Height on img
**File:** `components/shared/ProfessionalCard.tsx:96-100`
**Severity:** LOW

`<img src={...}>` without `width`/`height` causes layout shift (mitigated by fixed parent `w-16 h-16`).

### 9.3 DevelopmentAreaRow — No Next.js Image
**File:** `components/projects/DevelopmentAreaRow.tsx:175-178`
**Severity:** LOW

Uses `<img>` with hardcoded Unsplash fallback URL.

### 9.4 RealizationCard — Correct Pattern
**File:** `components/pro/RealizationCard.tsx:49-54`
**Note:** Properly uses `<Image fill>` with `aspect-[16/10]` container. This is the correct pattern.

---

## 10. Navigation Issues

### 10.1 Navbar Mobile Menu — No Focus Trap
**File:** `components/layout/Navbar.tsx:176-264`
**Severity:** MEDIUM

Simple conditional render with no focus trap, no escape key handling, no body scroll lock. Users can tab behind the menu.

### 10.2 ProjectsPage — Dead Buttons
**File:** `app/(client)/projets/page.tsx:89-92, 212`
**Severity:** MEDIUM

- Filter button has no `onClick` handler or associated dropdown
- "Explorer le réseau" button has no `onClick` or `href`

### 10.3 ProjectStepsSection — Export Dropdown Does Nothing
**File:** `components/projects/ProjectStepsSection.tsx:100-119`
**Severity:** MEDIUM

Export dropdown buttons for Excel and PDF have no `onClick` handlers.

---

## 11. Missing States

### 11.1 Uses `alert()` Instead of Toast — 4 Components
**Severity:** LOW

| File | Line |
|---|---|
| `RegisterForm.tsx` | 66, 75 |
| `RealizationForm.tsx` | 119 |
| `ProProfileForm.tsx` | 106 |
| `ProfessionalCard.tsx` | 66, 75 |

### 11.2 No Loading/Error/Empty States
**Files:** Multiple
**Severity:** MEDIUM

- `ProfessionalDirectory.tsx` — "Voir plus" button has no loading state
- `ProjectStepsSection.tsx` — no empty state when no steps exist
- `ProjectsPage.tsx` — no loading skeleton, no empty state

---

## 12. Import Issues

### 12.1 Link Fallback in Client Components
**Files:** `SignalForm.tsx:241-243`, `RecommendationForm.tsx:184-186`
**Severity:** LOW

Both define a local `Link` component as `<a>` tag fallback. Next.js prefetching is lost.

### 12.2 Dead Code
**File:** `AssignStepProDialog.tsx:51-56`
**Severity:** LOW

`handleToggle` function has a bug (`prev.filter(id => id !== id)` never filters) and is never called — `toggleId` is used instead.

---

## Summary — Priority Action Items

### Critical (user-facing bugs)
1. **Add mobile navigation to client dashboard** — `DashboardSidebar.tsx`
2. **Fix dark mode** — Replace all `bg-white` → `bg-background`, `text-stone-*` → `text-on-surface` across 12+ components
3. **Add aria-labels and form label associations** — 20+ elements across 8 files
4. **Fix star rating accessibility** — `ReviewForm.tsx`
5. **Make ProfessionalCard keyboard-navigable** — Change `<span>` to `<button>`

### High Priority (UX improvements)
6. **Fix ProjectWizard mobile footer** — Responsive padding and height
7. **Consolidate button styles** — Use shared `buttonVariants`
8. **Consolidate input styles** — Create shared `Input` component
9. **Replace custom modals with Dialog** — 4 modals to refactor
10. **Add dark mode toggle** — Theme switcher component

### Medium Priority (code quality)
11. **Reduce oversized components** — Split SignalForm, RecommendationForm, ProjectWizard
12. **Remove console.log debug statements** — RegisterForm, action files
13. **Replace emoji icons with icon library** — 3 sidebar components
14. **Add loading/empty/error states** — Multiple pages and components
15. **Replace alert() with toast** — 4 components

### Low Priority (cleanup)
16. **Standardize card padding** — Use consistent scale
17. **Replace inline status badges with StatusBadge component** — 3 locations
18. **Remove dead code** — AssignStepProDialog handleToggle
19. **Import cn() from @/lib/utils** — 2 files with duplicate
20. **Move hardcoded images to /public** — ProfileHero, DevelopmentAreaRow
21. **Fix ProjectWizard typography scale** — Add mobile breakpoints
22. **Reduce ProSidebar nav items** — Consolidate from 7 to 5
