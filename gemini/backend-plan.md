# Kelen Platform: Backend Development Plan

This document outlines the necessary backend architecture and tasks required to power the Kelen frontend. It is designed to be a comprehensive guide for implementation, following the features defined in the `blueprint.md`.

**Recommended Tech Stack:**
*   **Framework:** Next.js (App Router)
*   **Backend Logic:** Server Actions
*   **Database:** Supabase (PostgreSQL)
*   **Authentication:** Supabase Auth
*   **File Storage:** Supabase Storage
*   **Payments:** Stripe (for CPM credits)

---

## 1. Database Schema Design

The following tables are proposed for the Supabase PostgreSQL database.

#### `profiles`
Stores public data for both regular users (diaspora) and professionals.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key. Foreign key to `auth.users.id`. |
| `created_at` | `timestampz` |  |
| `role` | `text` | User role: 'diaspora' or 'professional'. |
| `full_name` | `text` | User's full name or company name. |
| `email` | `text` | User's email address. |
| `is_public` | `boolean` | Is the profile visible in public searches? |
| `status` | `text` | **(Calculated)** One of: 'Liste Or', 'Liste Argent', 'Liste Blanche', 'Liste Rouge', 'Liste Noire'. |

#### `professional_details`
Stores data specific to professionals.

| Column | Type | Description |
| :--- | :--- | :--- |
| `profile_id` | `uuid` | Primary Key. Foreign key to `profiles.id`. |
| `category` | `text` | Main professional category (e.g., 'Construction'). |
| `location` | `text` | City, Country (e.g., 'Abidjan, Côte d'Ivoire'). |
| `description` | `text` | Public-facing bio or description. |
| `portfolio_items` | `jsonb[]` | Array of objects, e.g., `{title: '...', imageUrl: '...'}`. |
| `cpm_credits` | `integer` | Number of available profile views for discovery. |
| `analytics_views` | `integer` | Tracks profile views over a period. |

#### `recommendations`
Stores positive reviews submitted by diaspora users.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key. |
| `created_at` | `timestampz` |  |
| `project_name` | `text` | Name of the project being reviewed. |
| `comment` | `text` | The client's testimonial. |
| `client_name` | `text` | Name of the diaspora user who submitted it. |
| `professional_id` | `uuid` | Foreign key to `profiles.id`. |
| `submitter_id` | `uuid` | Foreign key to `profiles.id` (the diaspora user). |
| `evidence_urls`| `text[]` | Array of URLs to uploaded evidence files in Supabase Storage. |
| `status` | `text` | 'pending', 'verified', 'rejected'. |

#### `signals`
Stores negative reports (contract breaches).

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key. |
| `created_at` | `timestampz` |  |
| `reason` | `text` | The reason for the signal (e.g., 'Retard de livraison'). |
| `professional_id` | `uuid` | Foreign key to `profiles.id`. |
| `submitter_id` | `uuid` | Foreign key to `profiles.id`. |
| `evidence_urls`| `text[]` | Array of URLs to uploaded evidence files. |
| `status` | `text` | 'pending', 'verified', 'disputed', 'rejected'. |

---

## 2. Backend Implementation by Feature

### **Task 1: Authentication**
*   **Objective:** Set up secure user registration and login for both 'diaspora' and 'professional' roles.
*   **Implementation:**
    1.  **Enable Supabase Auth:** Configure authentication in your Supabase project.
    2.  **Create Server Actions:**
        *   `signUp(email, password, role, fullName)`: This action will use the Supabase client to create a new user in `auth.users`. On success, it should also create a corresponding entry in the `public.profiles` table with the correct `role` and `full_name`.
        *   `signIn(email, password)`: Uses the Supabase client to authenticate the user and manage session cookies.
        *   `signOut()`: Logs the user out.
    3.  **Middleware:** Create a `middleware.ts` file to protect routes. It should check for a valid session cookie and redirect unauthenticated users from `/dashboard` and `/pro/dashboard` to the login page.

### **Task 2: Profile Management**
*   **Objective:** Allow professionals to update their profile and for data to be fetched for public pages.
*   **Implementation:**
    1.  **Create Server Actions:**
        *   `getProfessionalProfile(slug)`: A public action that fetches all necessary data for the `/pro/[slug]` page from the `profiles` and `professional_details` tables.
        *   `updateProfessionalProfile(formData)`: An authenticated action for professionals. It takes form data from the `/pro/profil` page and updates the `professional_details` table. It should only allow editing of fields like `description`, `location`, etc.
    2.  **Portfolio Management:**
        *   Use **Supabase Storage** to handle image uploads for the portfolio.
        *   `addPortfolioItem(title, imageFile)`: This server action will first upload the `imageFile` to a Supabase bucket, get the public URL, and then add a new JSON object `{title, imageUrl}` to the `portfolio_items` array in the `professional_details` table.
        *   `deletePortfolioItem(imageUrl)`: Removes an item from the `portfolio_items` array and deletes the corresponding file from Supabase Storage to save space.

### **Task 3: Core Logic - The Status System**
*   **Objective:** Automatically calculate a professional's status based on verified data. This is the most critical piece of business logic.
*   **Implementation:**
    1.  **Create a PostgreSQL Function:** This is the most efficient way to handle the calculation. Create a function `update_professional_status(professional_id uuid)` in the Supabase SQL editor.
    2.  **Function Logic:**
        *   Count the number of `verified` recommendations for the given `professional_id`.
        *   Count the number of `verified` signals for the given `professional_id`.
        *   Apply the rules from the blueprint:
            *   `signals >= 3` -> `Liste Noire`
            *   `signals >= 1` -> `Liste Rouge`
            *   `recommendations >= 5` -> `Liste Or`
            *   `recommendations >= 1` -> `Liste Argent`
            *   Otherwise -> `Liste Blanche`
        *   Update the `status` column in the `profiles` table for that professional.
    3.  **Create Triggers:** Set up database triggers so that the `update_professional_status` function runs automatically whenever a change occurs in the `recommendations` or `signals` tables for a specific professional. This ensures the status is always up-to-date without needing to run manual checks.

### **Task 4: Reputation Workflow (Recommendations & Signals)**
*   **Objective:** Allow diaspora users to submit evidence and admins to verify it.
*   **Implementation:**
    1.  **File Uploads:** Both submission forms will need to upload multiple files to Supabase Storage.
    2.  **Create Server Actions:**
        *   `submitRecommendation(formData)`: For the `/recommandation` form. This action will upload evidence files, get their URLs, and insert a new record into the `recommendations` table with a `status` of 'pending'.
        *   `submitSignal(formData)`: For the `/signal` form. Does the same as above, but for the `signals` table.
    3.  **Admin/Verification (Manual Step):** For now, the verification of 'pending' recommendations and signals would be a manual process done directly in the Supabase database dashboard by an admin. The admin would review the evidence and update the status from 'pending' to 'verified' or 'rejected'.

### **Task 5: Payments & Analytics (CPM)**
*   **Objective:** Allow professionals to buy advertising credits.
*   **Implementation:**
    1.  **Stripe Integration:**
        *   Set up a Stripe account and get your API keys.
        *   Create a product in Stripe for "CPM Credits" (e.g., a €5 package).
    2.  **Create Server Actions:**
        *   `createCheckoutSession()`: An authenticated server action for professionals. When a user wants to buy credit from `/pro/credit`, this action uses the Stripe Node.js library to create a checkout session. It should include the `professional_id` in the session's metadata.
        *   `handleStripeWebhook(event)`: Create a public API route (e.g., `/api/webhooks/stripe`) to receive webhook events from Stripe. When a `checkout.session.completed` event occurs, you extract the `professional_id` from the metadata and update their `cpm_credits` in the `professional_details` table.
    3.  **Analytics:**
        *   `trackProfileView(professional_id)`: On the `/pro/[slug]` page, call this server action. It should increment the `analytics_views` count for the professional.
        *   `getAnalyticsData()`: An authenticated action for professionals to fetch their view count for the `/pro/analytique` page.

