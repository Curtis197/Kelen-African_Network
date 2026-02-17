# Kelen Project Blueprint

This document serves as the central source of truth for the development of the Kelen platform's frontend. It outlines the project's vision, design principles, features, and a phased development plan.

## 1. Project Overview & Purpose

**Core Philosophy:** "La confiance ne se promet pas. Elle se documente."

Kelen is a permanent accountability platform designed to foster trust in collaborations between the African diaspora and professionals in Africa. It operates on two distinct, independent systems:

*   **Validation System (Free & Permanent):** A public, lookup-only registry. Anyone can search for a professional by their exact name to view their verified track record. This system is the core of the platform's integrity and is not monetized.
*   **Advertisement System (Paid & Optional):** A CPM-based discovery tool. Professionals can pay for visibility (€5 per 1,000 profile views) to appear in browsable search results. This system provides the business model without compromising the integrity of the validation data.

The platform's core is the **5-Tier Status System**, which is calculated automatically based on verified data:
*   🟡 **Liste Or:** Absolute trust (≥5 recommendations, high ratings, 0 signals).
*   ⚪ **Liste Argent:** Serious professional (1-4 recommendations, good ratings, 0 signals).
*   🤍 **Liste Blanche:** Neutral / No verified history.
*   🔴 **Liste Rouge:** Documented risk (1-2 verified signals).
*   ⚫ **Liste Noire:** Operational disqualification (≥3 verified signals).

## 2. Style, Design, and Features

### Visual Design & Aesthetics

The user interface will be modern, intuitive, and visually striking to make a great first impression and build user trust. The design will adhere to the following principles:

*   **Layout:** Clean, visually balanced, with generous spacing and a strong grid. The application will be fully mobile-responsive.
*   **Color Palette:** A vibrant and energetic palette with a wide range of hues and concentrations. The primary colors will evoke trust and professionalism.
*   **Typography:** Expressive and legible fonts with a clear hierarchy to guide the user's attention (e.g., large hero text, distinct headlines, readable body copy).
*   **Iconography:** Modern, meaningful, and intuitive icons will be used to enhance navigation and comprehension.
*   **Effects & Texture:**
    *   **Shadows:** Multi-layered drop shadows will be used to create a sense of depth and lift interactive elements off the page.
    *   **Interactivity:** Interactive elements (buttons, inputs) will feature a subtle "glow" effect on interaction.
    *   **Background:** A subtle noise texture will be applied to the main background to add a premium, tactile feel.
*   **Accessibility (A11Y):** The design will follow a11y standards to be usable by the widest possible audience.

### Core Frontend Features

*   **Authentication:** Secure registration and login flows for both "user" (diaspora) and "professional" roles, handled via Supabase Auth.
*   **Marketing Pages:** A set of static, SEO-optimized pages (Home, For Professionals, How It Works, Pricing) to explain the platform's value proposition.
*   **Public Validation Portal:**
    *   **/recherche:** A powerful search page with two modes: exact-name lookup (validation) and category/location browsing (discovery).
    *   **/pro/[slug]:** The permanent, dynamic, and shareable public profile for each professional, serving as their verified record.
*   **Diaspora User Area (Authenticated):**
    *   **/dashboard:** A personal dashboard to track submitted recommendations and signals.
    *   **/recommandation/[slug]:** A multi-step form to submit a positive project review with evidence (contracts, photos).
    *   **/signal/[slug]:** A multi-step form to report a contract breach with detailed evidence.
*   **Professional User Area (Authenticated):**
    *   **/pro/dashboard:** A central hub to manage profile, visibility, and finances.
    *   **/pro/profil:** An interface to edit editable portions of the public profile (description, portfolio).
    *   **/pro/recommandations:** A workflow to review and "link" verified recommendations submitted by clients.
    *   **/pro/signal:** An interface to view and respond to signals.
    *   **/pro/credit:** A payment interface to purchase CPM credit and manage visibility settings.
    *   **/pro/analytique:** A dashboard to view profile performance metrics.

## 3. Frontend Development Plan

The frontend will be built using Next.js (App Router), TypeScript, and Tailwind CSS with shadcn/ui for core components. Development will proceed in three phases.

### Phase 1: Core Validation & Public Interface

**Objective:** To build the essential public-facing validation system that allows anyone to look up a professional.

1.  **Project Setup:** Initialize Next.js project, configure Tailwind CSS, and set up `shadcn/ui`.
2.  **Main Layout & Static Pages:** Create the root layout (`/app/layout.tsx`) and build the static marketing pages (Home, Pour-les-pros, etc.).
3.  **Core Components:** Develop the fundamental reusable components, including `Header`, `Footer`, `StatusBadge`, and `ProfessionalCard`.
4.  **Search Page (`/recherche`):** Implement the search page with the dual-mode functionality for both name lookup and browsing.
5.  **Public Profile Page (`/pro/[slug]`):** Build the dynamic professional profile page. This is the centerpiece of this phase and will conditionally render information based on data fetched from the backend.

### Phase 2: User Authentication & Diaspora Workflow

**Objective:** To enable diaspora users to register, log in, and contribute to the platform by submitting evidence.

1.  **Authentication Flow:** Create the registration (`/inscription`) and login (`/connexion`) pages using Supabase Auth UI or custom components.
2.  **Route Protection:** Implement Next.js middleware to secure authenticated routes (e.g., `/dashboard`).
3.  **Diaspora Dashboard (`/dashboard`):** Build the user's personal dashboard to list their past and pending submissions.
4.  **Recommendation Form (`/recommandation/[slug]`):** Develop the multi-step form for submitting recommendations, including file upload functionality to Supabase Storage.
5.  **Signal Form (`/signal/[slug]`):** Develop the multi-step form for submitting signals, ensuring all required evidence fields are present.

### Phase 3: Professional Dashboard & CPM Management

**Objective:** To build the complete suite of tools for professionals to manage their profile, visibility, and reputation on the platform.

1.  **Professional Dashboard (`/pro/dashboard`):** Create the main dashboard, which will serve as the entry point to all professional-specific features.
2.  **Profile Management (`/pro/profil`):** Implement the form for professionals to edit their public-facing information and manage their portfolio.
3.  **CPM & Visibility (`/pro/credit`):** Build the UI for purchasing CPM credit, setting monthly caps, and configuring auto-reload. This will involve integrating with the backend payment processing logic.
4.  **Reputation Management:**
    *   **Link Recommendations (`/pro/recommandations`):** Create the interface for professionals to view and link incoming verified recommendations.
    *   **Respond to Signals (`/pro/signal`):** Build the page where professionals can view a signal against them and submit their response.
5.  **Analytics (`/pro/analytique`):** Develop the analytics page to display key performance indicators fetched from the backend.
