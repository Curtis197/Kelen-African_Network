# Kelen Platform: Backend Development Plan

This document outlines the necessary backend architecture and tasks required to power the Kelen frontend. It is designed to be a conceptual guide for implementation, following the features defined in the `blueprint.md`.

**Recommended Tech Stack:**
*   **Framework:** Next.js (App Router)
*   **Backend Logic:** Server Actions
*   **Database:** Supabase (PostgreSQL)
*   **Authentication:** Supabase Auth
*   **File Storage:** Supabase Storage
*   **Payments:** Stripe (for CPM credits)

---

## 1. Conceptual Data Model

Before implementation, it's crucial to design the data structure. The backend will need to manage a few core entities:

*   **User & Professional Profiles:** A central table is required to store information for all users. This entity should differentiate between "diaspora" and "professional" roles and hold common information like names and email. A separate, linked entity should hold details exclusive to professionals, such as their location, description, portfolio, and advertising credits.

*   **Reputation Data:** Two distinct entities are needed to record the platform's core value:
    *   **Recommendations:** To store positive reviews, linked to both the submitting user and the reviewed professional.
    *   **Signals:** To store negative reports, also linked to both parties involved. Both entities must be able to reference evidence files.

## 2. Backend Implementation Strategy

### **Task 1: Implement a User Authentication System**

The first step is to build a secure authentication system. This system must handle the entire user lifecycle (registration, login, logout) and manage user sessions. A key requirement is to differentiate between the two primary roles on the platform—'diaspora' and 'professional'—and to protect application routes so that only authenticated users with the correct role can access sensitive areas like the dashboards.

### **Task 2: Develop the Profile Management System**

This involves creating the backend pathways for managing user data. You will need to build:

*   **Public Data Endpoints:** Functions that allow the frontend to fetch the necessary information for the public-facing professional profiles.
*   **Private Management Functions:** Secure functions that empower professionals to update their editable profile information (like their bio and location).
*   **Portfolio Handling:** A system for managing portfolio uploads. This requires a process to handle file uploads securely, store them, and associate them with the correct professional profile. It should also support the deletion of portfolio items.

### **Task 3: Build the Status Calculation Engine**

This is the core business logic of the Kelen platform. You must design and implement an automated, server-side process that calculates a professional's status tier. This engine will need to:

1.  Count a professional's total number of verified recommendations.
2.  Count their total number of verified signals.
3.  Apply the platform's business rules to assign the correct status (Gold, Silver, White, Red, or Black).

This calculation should be triggered automatically whenever a professional's reputation data is updated to ensure the status is always accurate and tamper-proof.

### **Task 4: Construct the Reputation & Evidence Workflow**

This task involves building the backend functionality for the platform's evidence-based review system. You will need to create server-side logic that allows diaspora users to submit their recommendations and signals. This workflow must handle the intake of descriptive text and the upload of associated evidence files (contracts, photos, etc.). A crucial part of this is establishing a clear status for each submission (e.g., 'pending,' 'verified,' 'rejected') to facilitate a future administrative review process.

### **Task 5: Integrate Payment & Analytics Systems**

To support the business model, the backend must integrate with a payment processing service. This involves:

*   **Payment Gateway Integration:** Set up a system for professionals to purchase advertising credits. This requires creating secure transactions and ensuring that credits are correctly allocated to the professional's account upon successful payment.
*   **Analytics Tracking:** Implement a lightweight system to track key metrics, starting with profile views. This involves creating a function that logs a view on a professional's public profile and another function to allow the professional to retrieve their analytics data for display on their dashboard.
