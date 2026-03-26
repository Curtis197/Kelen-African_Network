# Design System Strategy: The Digital Diplomat

## 1. Overview & Creative North Star
The Creative North Star for this system is **"The Digital Diplomat."** 

Project management for the Diaspora requires a balance of high-level authority and organic warmth. We are moving away from the "SaaS-in-a-box" aesthetic. Instead, we are building a high-end editorial experience that feels like a curated physical workspace. We achieve this by breaking the traditional rigid grid through **intentional asymmetry**, where key metrics might bleed off-center, and **tonal depth**, where elements are layered like fine stationery on a stone desk. The interface should feel breathable, expensive, and bespoke.

---

## 2. Colors & Surface Philosophy
The palette utilizes a sophisticated interplay between the vibrant `primary` (#10b77f) and the authoritative `secondary` (#eab308), grounded by a "Stone" neutral base.

### The "No-Line" Rule
**Standard 1px borders are strictly prohibited for sectioning.** To define space, use background color shifts. A section should be distinguished by moving from `surface` (#f9f9f8) to `surface-container-low` (#f3f4f3). This creates a "molded" look rather than a "drawn" look.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. 
- **Base Layer:** `surface` (#f9f9f8) for the main application background.
- **Section Layer:** `surface-container-low` (#f3f4f3) for sidebar or secondary content areas.
- **Object Layer:** `surface-container-lowest` (#ffffff) for primary cards to create a natural, soft lift.

### The "Glass & Gradient" Rule
To elevate the "Premium" feel, use Glassmorphism for floating navigation or overlays. Use `surface` at 70% opacity with a `backdrop-blur` of 12px. For primary CTAs, do not use flat green; apply a subtle linear gradient from `primary` (#006c49) to `primary-container` (#10b77f) at a 135-degree angle to give the element "visual soul."

---

## 3. Typography: Editorial Authority
We pair the geometric confidence of **Manrope** for headers with the high-legibility of **Inter** for data.

- **Display & Headline (Manrope):** Use `display-md` (2.75rem) for dashboard greetings and `headline-sm` (1.5rem) for card titles. These should be set to a **Bold (700)** weight to convey professionalism.
- **Body & Labels (Inter):** Use `body-md` (0.875rem) for general project descriptions. 
- **The Signature Scale:** Maintain high contrast. A `display-lg` headline should sit near a `label-sm` metadata tag to create an editorial, "magazine-style" hierarchy that guides the eye immediately to what matters.

---

## 4. Elevation & Depth
Depth is a functional tool, not a decoration. We use **Tonal Layering** to convey importance.

- **The Layering Principle:** Instead of shadows, place a `surface-container-lowest` card (Pure White) onto the `surface` background (Stone-50). The slight shift in hue provides all the separation needed for a clean, modern look.
- **Ambient Shadows:** When a card must "float" (e.g., a hovered project card), use a shadow with a 32px blur, 4% opacity, and a tint derived from `on-surface` (#1a1c1c). Never use pure black shadows.
- **The "Ghost Border" Fallback:** If accessibility requires a stroke, use `outline-variant` (#bbcabf) at **15% opacity**. It should be felt, not seen.
- **Glassmorphism:** For top-level navigation bars, use a semi-transparent `surface-bright` with a subtle `outline-variant` 10% opacity top-border to mimic the edge of a glass pane.

---

## 5. Components

### Cards (The Core Primitive)
- **Style:** No borders. Use `surface-container-lowest` for the fill.
- **Rounding:** Use `xl` (1.5rem) for main dashboard cards to feel organic and approachable.
- **Content:** Separate header, body, and footer using vertical spacing from the scale (`spacing-6`) instead of divider lines.

### Status Badges & Progress Bars
- **Badges:** Use `secondary-container` (#fdc425) with `on-secondary-container` text for "In Progress" states. Use a `full` (9999px) radius.
- **Progress Bars:** The track should be `surface-container-highest` (#e2e2e2). The indicator should be a gradient of `primary` to `inverse-primary`. Keep the height slim (`spacing-1.5`) for a sophisticated look.

### Buttons
- **Primary:** Gradient fill (`primary` to `primary-container`), white text, `md` (0.75rem) rounding.
- **Secondary:** `surface-container-high` fill with `on-surface` text. No border.
- **Tertiary:** Ghost style using `primary` text color with no background, intended for low-emphasis actions like "Cancel."

### Input Fields
- **Style:** Use `surface-container-low` as the background fill. Upon focus, shift to `surface-container-lowest` with a 1px "Ghost Border" using `primary`.

---

## 6. Do’s and Don’ts

### Do:
- **Use Asymmetric White Space:** Allow a dashboard column to be wider than the others to create a focal point.
- **Layer Tones:** Stack `surface-container` tiers to create hierarchy.
- **Micro-interactions:** Use soft transitions (200ms ease-out) for hover states on cards.

### Don’t:
- **No 1px Dividers:** Do not use lines to separate list items; use `spacing-4` or a background hover tint.
- **No High-Contrast Shadows:** Avoid "muddy" dark shadows; keep them airy and tinted.
- **No Default Grids:** Don't force every element into an even box; let the content's importance dictate its width and "breathability."
- **No Pure Black:** Always use `on-surface` (#1a1c1c) for text to maintain the premium, stone-toned aesthetic.