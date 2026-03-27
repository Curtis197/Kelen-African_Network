# **Kelen Platform Migration Blueprint**

## **Overview**
Kelen is a high-fidelity platform for connecting clients with African professionals. The application is built with Next.js 15 (App Router), Tailwind CSS, and Supabase. The goal is a premium, editorial-style experience ("Digital Diplomat" aesthetic).

## **Project Structure & Features**

### **1. Navigation & Layout**
- **Global Navigation:** Sticky header with premium glassmorphism.
- **Root Layout:** Manrope (Headings) and Inter (Body) font integration.

### **2. Professional Portfolio**
- **Profile Page:** High-fidelity, editorial-style profile with expert range status, dynamic hero, and bento-style project grid.
- **Realization Detail Page:** Dynamic route at `app/(marketing)/professionnels/[slug]/realisations/[id]/page.tsx`.
    - **Immersive Hero:** Context-specific background and metadata.
    - **Narrative Section:** Editorial-style project description.
    - **Bento Gallery:** Multi-scale photo grid for project showcase.
    - **Technical Vault:** Secure area for project-specific downloads and documentation.
    - **Project Specifications:** Sticky sidebar with technical metadata.
    - **Expert CTA:** Integrated contact section for professional engagement.

### **3. Data Management**
- **Supabase Integration:**
    - `professionals`: Core professional data.
    - `professional_realizations`: Project details and metadata.
    - `realization_images`: Storage and links for project photography.
    - `realization_documents`: Technical files and PDFs.
    - `professional_portfolio`: Custom branding for professional pages.

### **4. Design System**
- **Aesthetic:** "Digital Diplomat" – premium, understated, trust-focused.
- **Surfaces:** Soft Stone/Cream (#f9f9f8) base with depth through background color shifts ("No-Line" rule).
- **Typography:** Expressive font scales, italics for context, and black font weights for emphasis.
- **Rounding:** 24px-32px radii for cards and sections.

## **Implementation Log**

### **Initial Migration (Phase 1)**
- Setup base Next.js project and Tailwind configuration.
- Implemented Landing Page with dynamic professional fetching.

### **Professional Portfolio (Phase 2)**
- Created Professional Profile page with dynamic Supabase integration.
- Implemented `ProfileHero` and `BentoGrid` for professional projects.

### **Realization Detail Page (Phase 3)**
- Implemented the dynamic Realization Detail route.
- Integrated `realization_images` and `realization_documents` fetching.
- Built the "Technical Vault" and "Sticky Specs" components.
- Linked the Professional Portfolio grid to the Realization Detail pages.

## **Execution Plan (Current Task)**
1.  **Objective:** Implement Universal Recommendations & Signals.
2.  **Steps:**
    - [x] **Phase 1: Database Migration**: Nullable professional_id, added external fields.
    - [x] **Phase 2: Validation Updates**: Updated Zod schemas for conditional validation.
    - [x] **Phase 3: Form Refactoring**: Updated `RecommendationForm` and `SignalForm` with identity steps.
    - [x] **Phase 4: UI/UX Integration**: Added CTAs and external routes.
    - [ ] **Phase 5: Verification**: Verify submission logic for both on-platform and off-platform cases.

## **Implementation Log**
n)
`app/(admin)/admin/queue/[id]/page.tsx`
- **Admin Review:** High-fidelity dashboard for expert validation.
- **Bento-Stats:** Rapid overview of signal counts and historical data.
`app/(professional)/pro/documents/page.tsx`
- **Document Management:** Triple-column layout for secure storage.
- **Preview Sidebar:** Instant feedback and metadata editing.

#### 5. Marketing Landing Page
`app/(marketing)/page.tsx`
- **Expert Grid:** Advanced filtering and sorting for professional discovery.
- **Premium Navigation:** Animated, responsive navigation system.

## Action Plan & Next Steps
### 2. Phase 2: Landing Page Data Integration (Current)
- [x] Refactor `app/(marketing)/page.tsx` into a Server Component.
- [x] Fetch professionals from Supabase, excluding blacklisted profiles (`status != 'black'`).
- [x] Implement real-time expert count on the landing page based on the `professionals` table.
- [x] Add status-based sorting logic (Gold > Silver > White > Red) for the expert grid.
- [x] Ensure `ProfessionalCard` components link to dynamic portfolio pages.
### **4. Unified Navigation & Dashboard Evolution**
- **Simplified Client Flow:** Removed the redundant client dashboard. Clients now interact with the platform directly via the global Navbar, which provides a dedicated "Gestion de projets" hub.
- **Pro Dashboard:** Professionals retain a dedicated dashboard (`/pro/dashboard`) for business metrics, accessible via a role-aware top Navbar.
- **Global Context:** The premium `Navbar` and `Footer` are now visible across all connected states (Client, Pro, Admin) to ensure a consistent exit path and branding.

## **Implementation Log**

### **Initial Migration (Phase 1)**
- Setup base Next.js project and Tailwind configuration.
- Implemented Landing Page with dynamic professional fetching.

### **Professional Portfolio (Phase 2)**
- Created Professional Profile page with dynamic Supabase integration.
- Implemented `ProfileHero` and `BentoGrid` for professional projects.

### **Realization Detail Page (Phase 3)**
- Implemented the dynamic Realization Detail route.
- Integrated `realization_images` and `realization_documents` fetching.
- Built the "Technical Vault" and "Sticky Specs" components.
- Linked the Professional Portfolio grid to the Realization Detail pages.

### **Navigation Simplification (Phase 4 - Current)**
- [x] Refactored `Navbar.tsx` for role-based navigation (Dashboard, Projects, Logout).
- [x] Removed `DashboardSidebar` from the client experience.
- [x] Redirected redundant `/dashboard` traffic to `/projets`.
- [x] Integrated `Navbar` and `Footer` into all layout shells for consistency.
### Professional Dashboard & Management

The professional side of the platform focuses on authority and demonstrability.

-   **Dashboard**: High-level overview of core metrics (Recommendations, Ratings, Views) using Material Design 3 surface tokens.
-   **Realization Management**: A premium, editorial showcase for projects.
    -   **Design Philosophy**: "The Digital Diplomat" — utilizing stone tones, no-border sectioning, and bold Manrope typography.
    -   **Media Integration**: Multi-step project onboarding with high-capacity image gallery and a secure "Technical Vault" for documents.
    -   **Asymmetric Layout**: Purposeful white space and grid variation to break the "SaaS" feel.

## Future Plans

-   **Client-Pro Messaging**: Real-time communication via Supabase.
-   **Service Estimates**: Integration with the Project Verification flow to allow pros to send quotes.
-   **Payment Escrow**: Secure fund handling for Diaspora-to-Local projects.
3. **Real-time Notifications:** Integrate Supabase real-time for project timeline updates.
4. **Professional Portfolio Editor:** Implement a high-fidelity, editorial-style editor for professionals to manage their public profile and bento-grid realizations.
5. **Analytics Dashboard:** Implement a basic view-counter for professional profiles.

## Verification Plan
1. **Count Verification**: Confirm that the landing page expert count matches the number of non-blacklisted entries in the `professionals` table.
2. **Filtering Check**: Manually verify that professionals with `status='black'` are not visible in the grid.
3. **Link Integrity**: Test that clicking a professional card correctly navigates to `/professionnels/[slug]`.
4. **Responsive Check**: Ensure the new dynamic grid remains responsive on mobile and tablet devices.
- **Automated:** `npm run build` and `npm run lint` for every major change.
- **Manual:** Responsive design check across mobile, tablet, and desktop views; verify Supabase data fetching on the landing page.
- **Data:** Ensure all dynamic routes (`projets/[id]`, `professionnels/[slug]`) and the landing page handle missing data gracefully.
