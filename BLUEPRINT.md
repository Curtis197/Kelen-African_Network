# Kelen Diaspora - Blueprint

## Project Overview
Kelen is a high-fidelity platform designed for the African diaspora to manage investment projects (construction, architecture, etc.) with professional oversight and "Digital Diplomat" grade transparency.

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

### 3. Project Detail Page
- **Route**: `/projets/[id]`
- **Functionality**:
    - **Technical Vault**: Secure access to project documents.
    - **Team Overview**: Interactive list of experts and professionals involved.
    - **Live Timeline**: Visual progress tracking of project phases.
    - **Budget Analysis**: Circular progress visualization of fund consumption.

## Technical Architecture
- **Framework**: Next.js (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS 4 + Material Design 3 tokens
- **Animations**: Framer Motion
- **Validation**: Zod (Schema-driven actions)

## Planned Changes / Roadmap
- [x] Support for incremental wizard persistence.
- [x] Bento-style dashboard refactor.
- [x] High-fidelity detail page implementation.
- [ ] Integration of real-time chat with experts.
- [ ] Wallet/Payment gateway integration for project funding.
