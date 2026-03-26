# Kelen - African Network Blueprint

## Overview
Kelen is a high-fidelity professional discovery and verification platform connecting African professionals with clients. It operates with a "Digital Diplomat" editorial design language, prioritizing trust, premium aesthetics, and technical excellence.

## Detailed Outline (Current State)

### Framework & Infrastructure
- **Core:** Next.js 14/15 (App Router), TypeScript.
- **Styling:** Vanilla CSS & Tailwind (constrained to premium design tokens).
- **Backend:** Supabase (Auth, DB, Storage).
- **Design System:** "Digital Diplomat"
  - **Aesthetic:** Editorial layout, cream-toned backgrounds, 24px organic corner radii.
  - **Typography:** Inter & Manrope (Expressive font sizes).
  - **Visuals:** Multi-layered drop shadows, glassmorphism, subtle micro-animations.

### Key Features Implemented

#### 1. Professional Portfolio (Public)
`app/(marketing)/professionnels/[slug]/page.tsx`
- **Hero Section:** Immersive background-blur, prominent professional branding, and "Live Sync" status.
- **Bento-Grid Portfolio:** Asymmetric gallery for high-impact project showcases.
- **Expertise Panel:** Interactive philosophy and commitments section using premium iconography.
- **Direct Contact:** Integrated Phone, WhatsApp Business, and Email access.

#### 2. Dynamic Project Timeline
`components/shared/ProjectTimeline.tsx` & `app/(client)/projets/[id]/page.tsx`
- **Visual Progress:** Step-by-step phase tracking with progress bars.
- **Status Context:** Real-time feedback (Completed, In Progress, Upcoming).
- **Project Context:** Integrated category and location context for each phase.

#### 3. Verification Console (Admin)
`app/(admin)/admin/queue/[id]/page.tsx`
- **Admin Review:** High-fidelity dashboard for expert validation.
- **Bento-Stats:** Rapid overview of signal counts and historical data.
- **Document Checklist:** Premium list view for quick document verification.

#### 4. Digital Vault (Professional)
`app/(professional)/pro/documents/page.tsx`
- **Document Management:** Triple-column layout for secure storage.
- **Preview Sidebar:** Instant feedback and metadata editing.

#### 5. Marketing Landing Page
`app/(marketing)/page.tsx`
- **Expert Grid:** Advanced filtering and sorting for professional discovery.
- **Premium Navigation:** Animated, responsive navigation system.

## Action Plan & Next Steps
1. **SEO Optimization:** Finalize metadata and social preview cards for all professional profile pages.
2. **Real-time Notifications:** Integrate Supabase real-time for project timeline updates.
3. **Analytics Dashboard:** Implement a basic view-counter for professional profiles.

## Verification Plan
- **Automated:** `npm run build` and `npm run lint` for every major change.
- **Manual:** Responsive design check across mobile, tablet, and desktop views.
- **Data:** Ensure all dynamic routes (`projets/[id]`, `professionnels/[slug]`) handle missing data gracefully.
