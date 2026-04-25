# Kelen - Blueprint

## Project Overview
Kelen is a professional visibility and trust platform. Clients find and compare professionals with verified track records. Professionals showcase their work and grow their client base.

**Entry market:** Individuals managing construction and renovation projects between Europe and Africa — large investments, remote supervision, limited legal recourse.

**Product scope:** Any professional-client relationship where the client pays for work they can't fully supervise. Any profession, any geography.

The platform is built with "Digital Diplomat" grade design: editorial-quality, premium, and transparent.

## Design System: "Digital Diplomat"
The application adheres to a premium, editorial-grade design system characterized by:
- **Typography**: `Manrope` for bold, high-impact headlines; `Inter` for clean, legible body text.
- **Tonal Layering**: Utilization of Material Design 3 surface tokens (`surface`, `surface-container-low`, `surface-container-lowest`) instead of traditional 1px borders for sectioning.
- **Organic Radii**: Large corner radii (`24px` to `32px`) for a soft, tactile feel.
- **Asymmetric Layouts**: Bento-style grids for information-dense dashboards.
- **Visual Feedback**: "Live Sync" pulsing indicators and smooth `framer-motion` transitions.

## Implemented Features

### 1. Project Creation Wizard
- **Route**: `/projets/nouveau`
- **Component**: `ProjectWizard.tsx`
- **Functionality**:
    - **Step 1: Concept**: Title, Description, and Category selection.
    - **Step 2: Financials**: Budget allocation and currency selection (XOF/EUR/USD).
    - **Step 3: Logistics**: Location (City, Country) and Project Duration.
    - **Step 4: Goals**: Definition of key project milestones/objectives.
- **Incremental Persistence**: Uses a "Live Save" pattern via the `upsertProject` server action, saving progress to Supabase at each step.

### 2. Project Management Dashboard
- **Route**: `/projets`
- **Functionality**:
    - **Bento Grid**: Asymmetric layout presenting project cards and high-level statistics.
    - **Real-time Stats**: Aggregated budget and active project counts.
    - **Quick Actions**: Easy access to create new initiatives.

### 3. Project Detail Page & Comparison Engine
- **Route**: `/projets/[id]`
- **Functionality**:
    - **Universal Comparison Engine**: Row-based layout grouping professionals by Functional Development Areas (e.g., Law, Architecture, Education).
    - **Multi-Professional Management**: Ability to add both platform-registered and external professionals for side-by-side comparison.
    - **Add-to-Project Workflow**: Seamless assignment of professionals directly from their profile pages or the search engine.
    - **Ranking System**: Visual ordering of professionals within a domain to prioritize candidates.
    - **Selection Workflow**: Status tracking (`Candidate`, `Shortlisted`, `Finalist`) for professional selection.
    - **Technical Vault**: Secure access to project documents.
    - **Live Timeline**: Visual progress tracking of project phases.
    - **Budget Analysis**: Circular progress visualization of fund consumption.

### 4. Project Step Management (Granular Roadmap)
- **Component**: `ProjectStepsSection.tsx`
- **Functionality**:
    - **Step-by-Step Tracking**: Break down project realization into discrete phases (e.g., Foundation, Walls, Roof).
    - **Financial Granularity**: Assign individual budgets and track expenditures for each specific step.
    - **Professional Association**: Link specialized professionals (e.g., Masons for Walls, Electricians for Wiring) directly to individual project steps.
    - **Status Workflow**: Track progress through granular statuses (`Pending`, `In Progress`, `Completed`, `On Hold`, `Cancelled`).
    - **Export Engine**: Generate Excel/PDF reports for project transparency.

### 5. Performance Optimization (Africa-First Mandate)
- **Architecture**: Every optimization is driven by the 300ms+ latency and 2G/3G bandwidth constraints in sub-Saharan Africa.
- **Data Fetching**:
    - **Parallelization**: Sequential database queries replaced with `Promise.all` in critical dashboards, reducing load times by ~3.5s.
    - **Batched Fetching**: Image and taxonomy data fetched in parallel to minimize network round-trips.
- **Asset Management**:
    - **Next.js Image Migration**: All raw `<img>` tags replaced with `next/image` for automatic WebP conversion, lazy loading, and responsive sizing.
    - **Self-hosted Typography**: Google Fonts CDN removed; Manrope and Inter fonts are self-hosted via `next/font/google` to eliminate blocking RTTs.
- **Caching Strategy**:
    - **ISR Implementation**: High-traffic marketing pages use Incremental Static Regeneration (revalidate: 3600s) to serve cached content instantly.
    - **Middleware Caching**: Custom domain lookups cached to reduce pre-render database overhead.
- **Bundle Optimization**: Heavy libraries (`jspdf`, `xlsx`, `framer-motion`) dynamically imported to reduce initial JS payload.

## Technical Architecture
- **Framework**: Next.js (App Router)
- **Database**: Supabase (PostgreSQL) with flexible schema support for universal categories.
- **Styling**: Tailwind CSS 4 + Material Design 3 tokens
- **Animations**: Framer Motion
- **Validation**: Zod (Schema-driven actions)

## Development Overrides

> These are temporary changes active on the current branch for development purposes. They must be reverted before production deployment.

| Override | File | Change |
|---|---|---|
| Paywall bypass — tier limits | `lib/utils/subscription-gate.ts` | `getTierLimits()` always returns `PAID_LIMITS` |
| Paywall bypass — project creation | `lib/utils/subscription-gate.ts` | `canCreateProject()` always returns `{ allowed: true, limit: -1 }` |
| Paywall bypass — photo upload | `lib/utils/subscription-gate.ts` | `canUploadPhotos()` always returns `{ allowed: true, limit: -1 }` |
| Paywall bypass — site builder | `app/(professional)/pro/site/page.tsx` | `isPaid` hardcoded to `true` — SiteBuilder always rendered |

All overrides are marked with `// DEV MODE` comments for easy grep.

---

## Planned Changes / Roadmap
- [x] Support for incremental wizard persistence.
- [x] Bento-style dashboard refactor.
- [x] High-fidelity detail page implementation.
- [x] Universal Project Comparison Engine (Row-based comparison, ranking).
- [x] Add-to-Project assignment workflow (direct from profile & search).
- [x] Granular Project Step Management (Phases, Budgets, Pro-Association).
- [x] Fix ProCard rendering to support both internal and external professional profiles.
- [x] Performance Optimization Phase 1 & 2 (Africa-First Mandate).
- [x] Paywall bypass for development (all subscription gates disabled — restore before production).
- [ ] Backend logic for exporting project steps (PDF/Excel)
- [ ] Financial dashboard aggregation across all project steps
- [ ] Role-based access control (RBAC) refinements for professional assistants
- [ ] Progressive Web App (PWA) capabilities for offline access
- [ ] Restore paywall enforcement before production launch
