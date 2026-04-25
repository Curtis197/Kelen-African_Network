# Kelen — Frontend Work Done

> **Branch:** feat/professional-dashboard
> **Last updated:** 2026-04-25

---

## Foundation

| File | Purpose |
|---|---|
| `package.json` | All dependencies declared (Next.js 16, React 19, Supabase, Zod, React Hook Form, Tailwind 4, Sonner, Lucide, TipTap, Sharp, Stripe) |
| `app/globals.css` | Kelen color system — Pan-African palette (Green #009639, Yellow #FCCF00, Red #CE1126) via Tailwind `@theme inline` |
| `app/layout.tsx` | Root layout — French lang, Geist fonts, metadata with title template, Toaster |
| `middleware.ts` | Auth guard with protected route mapping + custom domain lookup with caching |
| `lib/supabase/types.ts` | Complete TypeScript types for all database tables + materialized views |
| `lib/supabase/client.ts` | Browser Supabase client (`createBrowserClient`) |
| `lib/supabase/server.ts` | Server Supabase client (`createServerClient` with cookies) |
| `lib/utils/constants.ts` | Categories, countries, budget ranges, breach types, status config, nav links, subscription pricing |
| `lib/utils/format.ts` | French locale formatters (dates, currency, ratings, country names, tenure) |
| `lib/utils/validators.ts` | Zod schemas for all forms with French error messages + type exports |
| `lib/utils/subscription-gate.ts` | Tier limit checks — `getTierLimits()`, `canCreateProject()`, `canUploadPhotos()` |
| `lib/config/image-compression.ts` | Per-bucket Sharp compression settings |
| `lib/notifications.ts` | Email + WhatsApp notification helpers |
| `lib/stripe-connect.ts` | Stripe Connect account management helpers |

---

## Layouts (8)

| Layout | Route Group | Description |
|---|---|---|
| `app/(marketing)/layout.tsx` | Marketing | Navbar + Footer |
| `app/(validation)/layout.tsx` | Validation | Navbar + Footer |
| `app/(auth)/layout.tsx` | Auth | Centered card, Kelen logo, founding phrase |
| `app/(client)/layout.tsx` | Client | DashboardSidebar + main content area |
| `app/(professional)/layout.tsx` | Professional | ProSidebar (with "Pro" badge) + main content area |
| `app/(admin)/layout.tsx` | Admin | AdminSidebar (with "Admin" badge) + main content area |
| `app/(pro-site)/layout.tsx` | Pro Site | Public professional site layout |
| `app/(pro-preview)/layout.tsx` | Pro Preview | Preview mode layout with preview banner |

---

## Pages (60+)

### Marketing (6)
| Route | File | Description |
|---|---|---|
| `/` | `app/(marketing)/page.tsx` | Home — Hero, How It Works, Status Tiers, Two Systems, Pro CTA |
| `/pour-les-pros` | `app/(marketing)/pour-les-pros/page.tsx` | Pro landing — Benefits, status system, pricing, CTA |
| `/a-propos` | `app/(marketing)/a-propos/page.tsx` | Mission and platform overview |
| `/comment-ca-marche` | `app/(marketing)/comment-ca-marche/page.tsx` | Verification system, status criteria, platform mechanics |
| `/faq` | `app/(marketing)/faq/page.tsx` | FAQs — verification, recommendations, signals, pricing |
| `/contact` | `app/(marketing)/contact/page.tsx` | Contact form and support info |

### Public / Validation (2)
| Route | File | Description |
|---|---|---|
| `/recherche` | `app/(validation)/recherche/page.tsx` | Search — Lookup/Browse modes, filters, ProfessionalCard results |
| `/pro/[slug]` | `app/(validation)/pro/[slug]/page.tsx` | Public profile — status banner, stats, recommendations, signals, reviews, sidebar contact |

### Auth (5)
| Route | File | Description |
|---|---|---|
| `/connexion` | `app/(auth)/connexion/page.tsx` | Client login |
| `/inscription` | `app/(auth)/inscription/page.tsx` | Client register — toggle with conditional fields |
| `/mot-de-passe` | `app/(auth)/mot-de-passe/page.tsx` | Password reset request |
| `/mot-de-passe/reset` | `app/(auth)/mot-de-passe/reset/page.tsx` | Token-based password update form |
| `/pro/connexion` | `app/(auth)/pro/connexion/page.tsx` | Dedicated professional login ("Espace Professionnel") |
| `/pro/inscription` | `app/(auth)/pro/inscription/page.tsx` | Dedicated professional registration |

### Client Dashboard (11)
| Route | File | Description |
|---|---|---|
| `/dashboard` | `app/(client)/dashboard/page.tsx` | Quick actions, stats, recent activity |
| `/recommandation` | `app/(client)/recommandation/page.tsx` | Select professional to recommend |
| `/recommandation/[slug]` | `app/(client)/recommandation/[slug]/page.tsx` | 4-step recommendation form |
| `/recommandation/externe` | `app/(client)/recommandation/externe/page.tsx` | Recommend a professional not yet on Kelen |
| `/signal` | `app/(client)/signal/page.tsx` | Select professional to signal |
| `/signal/[slug]` | `app/(client)/signal/[slug]/page.tsx` | 5-step signal form with severity, dates, file upload, legal checkboxes |
| `/signal/externe` | `app/(client)/signal/externe/page.tsx` | File a complaint against a professional not yet on Kelen |
| `/avis/[slug]` | `app/(client)/avis/[slug]/page.tsx` | Star rating + comment review form |
| `/favoris` | `app/(client)/favoris/page.tsx` | Saved/bookmarked professionals with search |
| `/documents` | `app/(client)/documents/page.tsx` | Document vault — upload, view, download contracts and plans |
| `/parametres/profil` | `app/(client)/parametres/profil/page.tsx` | Account settings — name, country, phone, notification preferences |
| `/validation` | `app/(client)/validation/page.tsx` | Account verification workflow |

### Professional Dashboard (14)
| Route | File | Description |
|---|---|---|
| `/pro/dashboard` | `app/(professional)/pro/dashboard/page.tsx` | Stats, pending actions (link recs, respond to signals) |
| `/pro/profil` | `app/(professional)/pro/profil/page.tsx` | Edit profile — description, services, experience, WhatsApp |
| `/pro/realisations` | `app/(professional)/pro/realisations/page.tsx` | Manage portfolio realisations, services, products |
| `/pro/site` | `app/(professional)/pro/site/page.tsx` | Site builder — style, domain, calendar settings |
| `/pro/portfolio` | `app/(professional)/pro/portfolio/page.tsx` | Portfolio PDF builder with preview |
| `/pro/newsletter` | `app/(professional)/pro/newsletter/page.tsx` | Newsletter dashboard — subscribers, campaigns |
| `/pro/google` | `app/(professional)/pro/google/page.tsx` | Google Business Profile sync and review import |
| `/pro/projets` | `app/(professional)/pro/projets/page.tsx` | Professional project list (collaborative projects with clients) |
| `/pro/projets/[id]` | `app/(professional)/pro/projets/[id]/page.tsx` | Professional project detail |
| `/pro/projets/[id]/journal` | `app/(professional)/pro/projets/[id]/journal/page.tsx` | Daily journal logs for a project |
| `/pro/documents` | `app/(professional)/pro/documents/page.tsx` | Document management (professional side) |
| `/pro/recommandations` | `app/(professional)/pro/recommandations/page.tsx` | View & link recommendations to profile |
| `/pro/signal` | `app/(professional)/pro/signal/page.tsx` | View signals & respond (15-day deadline) |
| `/pro/abonnement` | `app/(professional)/pro/abonnement/page.tsx` | Manage subscription (3 000 FCFA / 15€) |
| `/pro/analytique` | `app/(professional)/pro/analytique/page.tsx` | Views chart, traffic sources, key metrics (6 months) |
| `/pro/validation` | `app/(professional)/pro/validation/page.tsx` | Profile completeness checklist before going public |

### Admin (6)
| Route | File | Description |
|---|---|---|
| `/admin` | `app/(admin)/admin/page.tsx` | Platform overview — stats, recent submissions |
| `/admin/queue` | `app/(admin)/admin/queue/page.tsx` | Verification queue list with priority indicators |
| `/admin/queue/[id]` | `app/(admin)/admin/queue/[id]/page.tsx` | Review screen — approve/reject/request info |
| `/admin/journal` | `app/(admin)/admin/journal/page.tsx` | Activity log with action types |
| `/admin/blacklisted` | `app/(admin)/admin/blacklisted/page.tsx` | Manage blacklisted professionals (status='black') |
| `/admin/client-projects` | `app/(admin)/admin/client-projects/page.tsx` | Browse and manage all client projects |

### Public Pro Site (10)
| Route | File | Description |
|---|---|---|
| `/professionnels/[slug]` | `app/(pro-site)/professionnels/[slug]/page.tsx` | Professional public site — hero, portfolio, about, contact, booking widget |
| `/professionnels/[slug]/realisations` | `app/(pro-site)/.../realisations/page.tsx` | All realisations listing |
| `/professionnels/[slug]/realisations/[id]` | `app/(pro-site)/.../realisations/[id]/page.tsx` | Realisation detail — gallery, description, likes, comments |
| `/professionnels/[slug]/services` | `app/(pro-site)/.../services/page.tsx` | Services listing (public) |
| `/professionnels/[slug]/services/[id]` | `app/(pro-site)/.../services/[id]/page.tsx` | Service detail |
| `/professionnels/[slug]/produits` | `app/(pro-site)/.../produits/page.tsx` | Products listing (public) |
| `/professionnels/[slug]/produits/[id]` | `app/(pro-site)/.../produits/[id]/page.tsx` | Product detail |
| `/professionnels/[slug]/recommandations` | `app/(pro-site)/.../recommandations/page.tsx` | Verified recommendations on public site |
| `/professionnels/[slug]/a-propos` | `app/(pro-site)/.../a-propos/page.tsx` | About section |

### Pro Site Preview (5)
| Route | File | Description |
|---|---|---|
| `/pro/preview/[slug]` | `app/(pro-preview)/pro/preview/[slug]/page.tsx` | Live preview of public site before publishing |
| `/pro/preview/[slug]/services` | `app/(pro-preview)/.../services/page.tsx` | Preview services section |
| `/pro/preview/[slug]/produits` | `app/(pro-preview)/.../produits/page.tsx` | Preview products section |
| `/pro/preview/[slug]/a-propos` | `app/(pro-preview)/.../a-propos/page.tsx` | Preview about section |
| `/pro/preview/[slug]/realisations` | `app/(pro-preview)/.../realisations/page.tsx` | Preview realisations section |

### Public / Token-Based (3)
| Route | File | Description |
|---|---|---|
| `/journal/[token]` | `app/journal/[token]/page.tsx` | Shared daily log — public read-only with approve/contest |
| `/invitation/[token]` | `app/invitation/[token]/page.tsx` | Project invitation — auto-links client account on auth |
| `/newsletter/unsubscribe` | `app/newsletter/unsubscribe/page.tsx` | Newsletter unsubscribe with token verification |

---

## API Routes

| Route | Description |
|---|---|
| `/api/upload-image` | Server-side image upload with Sharp compression |
| `/api/stripe/webhook` | Stripe events — checkout, subscription updates, payment failures |
| `/api/stripe/connect/onboard` | Stripe Connect onboarding for professionals |
| `/api/stripe/connect/status` | Check Connect account readiness |
| `/api/stripe/connect/dashboard` | Generate link to Stripe Connect dashboard |
| `/api/stripe/invoice` | Create Stripe payment link for invoices |
| `/api/calendar/[proId]/availability` | Fetch available booking slots |
| `/api/calendar/[proId]/book` | Create appointment + optional Stripe deposit |
| `/api/auth/google/authorize` | Google OAuth2 sign-in initiation |
| `/api/auth/google/callback` | Google OAuth2 callback |
| `/api/auth/google/calendar/authorize` | Google Calendar OAuth2 initiation |
| `/api/auth/google/calendar/callback` | Google Calendar OAuth2 callback — stores tokens |
| `/api/google/reviews` | Fetch Google Business reviews |
| `/api/google/sync-photos` | Sync GBP photos to portfolio storage |
| `/api/notifications/reminder-cron` | Daily cron — appointment reminders via email + WhatsApp |
| `/api/newsletter/ai-correct` | Claude API — correct and improve newsletter text |
| `/api/presentation/ai-correct` | Claude API — correct service/product descriptions |
| `/api/journal-pdf` | Generate journal PDF export |
| `/api/realisation-pdf` | Generate realisation PDF export |
| `/api/catalogue-pdf` | Generate catalogue PDF (services + products) |
| `/api/pro-site/likes` | Like/unlike a realisation |

---

## Components (60+)

### Layout (5)
| Component | File | Description |
|---|---|---|
| `Navbar` | `components/layout/Navbar.tsx` | Responsive navbar, mobile hamburger, marketing nav, CTA buttons |
| `Footer` | `components/layout/Footer.tsx` | Dark footer, 4-column grid, founding phrase |
| `DashboardSidebar` | `components/layout/DashboardSidebar.tsx` | Client sidebar — active state, user info, logout |
| `ProSidebar` | `components/layout/ProSidebar.tsx` | Professional sidebar — nav items, "Pro" badge |
| `AdminSidebar` | `components/layout/AdminSidebar.tsx` | Admin sidebar — nav items, "Admin" badge |

### Shared (8)
| Component | File | Description |
|---|---|---|
| `StatusBadge` | `components/shared/StatusBadge.tsx` | Gold/Silver/White/Red/Black badge, size variants |
| `ProfessionalCard` | `components/shared/ProfessionalCard.tsx` | Search result card linking to /pro/[slug] |
| `RecommendationCard` | `components/shared/RecommendationCard.tsx` | Green card — project details, budget, submitter |
| `SignalCard` | `components/shared/SignalCard.tsx` | Red card — breach type, severity, pro response |
| `ReviewCard` | `components/shared/ReviewCard.tsx` | Star rating display, comment, reviewer info |
| `SearchBar` | `components/shared/SearchBar.tsx` | Client component, URL param management |
| `FilterPanel` | `components/shared/FilterPanel.tsx` | Mode toggle, category/country/status dropdowns |
| `EmptyState` | `components/shared/EmptyState.tsx` | Reusable empty state with optional action |

### Forms (9)
| Component | File | Description |
|---|---|---|
| `LoginForm` | `components/forms/LoginForm.tsx` | Email/password with Zod validation |
| `RegisterForm` | `components/forms/RegisterForm.tsx` | Client/Pro toggle, conditional fields |
| `PasswordResetForm` | `components/forms/PasswordResetForm.tsx` | Email input, success state |
| `UpdatePasswordForm` | `components/forms/UpdatePasswordForm.tsx` | Token-based password update |
| `RecommendationForm` | `components/forms/RecommendationForm.tsx` | 4-step multi-step form with step indicator |
| `SignalForm` | `components/forms/SignalForm.tsx` | 5-step form with severity, dates, file upload, legal |
| `ReviewForm` | `components/forms/ReviewForm.tsx` | Interactive star rating + comment |
| `ProProfileForm` | `components/forms/ProProfileForm.tsx` | Description, services tags, experience, team |
| `ServiceForm` | `components/forms/ServiceForm.tsx` | Create/edit professional service |
| `ProductForm` | `components/forms/ProductForm.tsx` | Create/edit professional product |

### Portfolio / Pro Site Builder (10)
| Component | File | Description |
|---|---|---|
| `SiteBuilder` | `components/portfolio/SiteBuilder.tsx` | Full site customization — sections, style, domain, AI copy |
| `StyleQuiz` | `components/portfolio/StyleQuiz.tsx` | Visual quiz to select color mode and corner style |
| `CopywritingQuiz` | `components/portfolio/CopywritingQuiz.tsx` | 4-step questionnaire → Claude generates hero + about text |
| `CopyEditor` | `components/portfolio/CopyEditor.tsx` | Edit AI-generated copy with manual override |
| `DomainManager` | `components/portfolio/DomainManager.tsx` | Custom domain mapping and status tracking |
| `DomainSearch` | `components/portfolio/DomainSearch.tsx` | Domain availability search |
| `PortfolioPDFBuilder` | `components/pro/PortfolioPDFBuilder.tsx` | Generate branded portfolio PDF |
| `CataloguePDFButton` | `components/pro/CataloguePDFButton.tsx` | One-click catalogue PDF export |
| `ProjectImageManager` | `components/pro/ProjectImageManager.tsx` | Image carousel management with reordering |
| `PresentationTabs` | `components/pro/PresentationTabs.tsx` | Tabs for realisations / services / products management |

### Pro Site Public Components (8)
| Component | File | Description |
|---|---|---|
| `ProSiteHero` | `components/pro-site/ProSiteHero.tsx` | Hero section with brand colors |
| `ProSiteContact` | `components/pro-site/ProSiteContact.tsx` | Contact form + WhatsApp section |
| `ProSiteNewsletter` | `components/pro-site/ProSiteNewsletter.tsx` | Newsletter subscribe widget |
| `ProSiteGoogleReviews` | `components/pro-site/ProSiteGoogleReviews.tsx` | Google reviews display |
| `ProSiteStyleProvider` | `components/pro-site/ProSiteStyleProvider.tsx` | CSS variable injection from style tokens |
| `ProSiteSectionPreview` | `components/pro-site/ProSiteSectionPreview.tsx` | Section-level preview wrapper |
| `BookingWidget` | `components/calendar/BookingWidget.tsx` | Client-facing appointment booking UI |
| `CalendarSettings` | `components/calendar/CalendarSettings.tsx` | Professional calendar configuration |

### Interactions (3)
| Component | File | Description |
|---|---|---|
| `LikeButton` | `components/interactions/LikeButton.tsx` | Like/unlike realisation with optimistic UI |
| `RealizationCommentThread` | `components/interactions/RealizationCommentThread.tsx` | Comment thread on public realisations |
| `PhotoUpload` | `components/journal/PhotoUpload.tsx` | Drag & drop photo upload with EXIF extraction |

### Collaboration (3)
| Component | File | Description |
|---|---|---|
| `ProposalCard` | `components/collaboration/ProposalCard.tsx` | Proposal display with accept/decline/revise actions |
| `CollaborationThread` | `components/collaboration/CollaborationThread.tsx` | Real-time messaging within a proposal context |
| `ProListPage` | `components/collaboration/ProListPage.tsx` | Professional list for a project with filters |

### Newsletter (2)
| Component | File | Description |
|---|---|---|
| `NewsletterDashboard` | `components/newsletter/NewsletterDashboard.tsx` | Subscriber management + campaign composer |
| `TipTapEditor` | `components/newsletter/TipTapEditor.tsx` | Rich text HTML email editor |

### Google / Location (4)
| Component | File | Description |
|---|---|---|
| `GoogleBusinessConnect` | `components/pro/GoogleBusinessConnect.tsx` | GBP account verification + photo/review sync |
| `GoogleReviewsSection` | `components/pro/GoogleReviewsSection.tsx` | Aggregated Google reviews display |
| `GoogleMapsScript` | `components/location/GoogleMapsScript.tsx` | Maps API loader |
| `LocationSearch` | `components/location/LocationSearch.tsx` | Location autocomplete for projects |

### Auth (2)
| Component | File | Description |
|---|---|---|
| `GoogleButton` | `components/auth/GoogleButton.tsx` | Google OAuth2 sign-in button |
| `UpdatePasswordForm` | `components/forms/UpdatePasswordForm.tsx` | Token-based password update form |

### Analytics (1)
| Component | File | Description |
|---|---|---|
| `GoogleAnalytics` | `components/analytics/GoogleAnalytics.tsx` | GA4 tracking script |

### UI (1)
| Component | File | Description |
|---|---|---|
| `Toaster` | `components/ui/Toaster.tsx` | Sonner toast wrapper |

---

## Server Actions (`lib/actions/`)

| File | Description |
|---|---|
| `stripe.ts` | Checkout session, subscription info, cancellation |
| `google-profile.ts` | GBP account operations, photo sync |
| `collaborations.ts` | Proposal creation, negotiation, status updates |
| `newsletter.ts` | Subscriber management, campaign send, unsubscribe |
| `log-shares.ts` | Token-based log share creation and validation |
| `pro-project-clients.ts` | Project invitation token management |
| `log-media.ts` | Journal photo upload and EXIF handling |
| `project-images.ts` | Project gallery management |
| `realization-comments.ts` | Comment CRUD on realisations |
| `realization-likes.ts` | Like/unlike realisations |
| `user-profile.ts` | Client profile settings update |
| `pro-projects.ts` | Professional project CRUD |
| `journal-export.ts` | PDF journal generation trigger |

---

## Current State

- **All pages connected to Supabase** with real data via server actions and direct queries
- **Auth fully active** — middleware guards all protected routes
- **Stripe integrated** — subscription billing + Connect for professional payments
- **AI features live** — Claude Sonnet 4 for hero text, about text, service descriptions, newsletter corrections
- **Google integrations active** — OAuth sign-in, Calendar sync, Business Profile sync
- **Paywall bypassed for development** — see `// DEV MODE` in `lib/utils/subscription-gate.ts` and `app/(professional)/pro/site/page.tsx`
