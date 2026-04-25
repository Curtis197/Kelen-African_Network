# Feature Matrix — Free vs Paid

> Created: 2026-04-08
> Source: All implemented features from implementation plan, audit documents, and codebase
> Purpose: Clear reference for what's included in each tier

---

## Pricing

| Plan | Price | Target |
|---|---|---|
| **Free** | 0 XOF / mois | All professionals (showcase entry) |
| **Premium Kelen** | 3 000 XOF / mois | Professionals in West Africa (Wave, Orange Money) |
| **Premium Europe** | €15 / mois | Professionals in Europe (Stripe) |

---

## Feature Comparison

| Feature | Free | Premium | Notes |
|---|---|---|---|
| **Profil public** | ✅ | ✅ | Mini-site avec hero, portfolio, contact |
| **Formulaire de profil** | ✅ | ✅ | Photo, description, services, WhatsApp, hero image |
| **Génération IA de texte** | ✅ | ✅ | Accroche hero + texte "À propos" via Claude Sonnet 4 |
| **Projets (portfolio)** | **3 max** | **Illimité** | Projets avec photos, description, localisation |
| **Photos** | **15 max** | **Illimité** | Upload via Supabase Storage |
| **Vidéos** | ❌ | ✅ | Support vidéo dans le portfolio |
| **Branding automatique** | ❌ | ✅ | Couleurs extraites du logo, appliquées au profil |
| **Indexation Google (SEO)** | ❌ | ✅ | Sitemap XML, balises OG, meta dynamiques |
| **Rendu de la page** | SSG (statique) | SSR (dynamique) | Profils payants toujours à jour |
| **Statistiques de base** | ✅ | ✅ | Vues du profil, interactions |
| **Statistiques avancées** | ❌ | ✅ | Graphiques 6 mois, sources de trafic, GA4 |
| **Journal de chantier** | ✅ | ✅ | Rapports quotidiens avec GPS, photos, dépenses |
| **Sync hors-ligne** | ✅ | ✅ | Brouillons IndexedDB, sync au retour en ligne |
| **Partage de rapports** | ✅ | ✅ | Lien public par email, WhatsApp, SMS |
| **Export PDF** | ✅ | ✅ | Rapport projet complet (couverture, étapes, journal, finances) |
| **Export Excel** | ✅ | ✅ | 4 feuilles : résumé, étapes, journal, finances |
| **Recommandations** | ✅ | ✅ | Réception, lien au profil, affichage public |
| **Signalements** | ✅ | ✅ | Réception, réponse sous 15 jours |
| **Badge de statut** | ✅ | ✅ | Gold / Silver / White / Red (calcul automatique DB) |
| **Notifications in-app** | ✅ | ✅ | Cloche avec compteur, dropdown, marquer tout lu |
| **Notifications email** | ✅ | ✅ | Logs, affectations, réputation, partage |
| **Gestion de projets** | ✅ | ✅ | CRUD, étapes, pros assignés, budget |
| **Tableau de bord** | ✅ | ✅ | Données réelles : recommandations, signaux, vues, abonnement |
| **Coffre-fort numérique** | ✅ | ✅ | Upload documents (contrats, plans, preuves) |
| **PWA installable** | ✅ | ✅ | Manifest, service worker, accès hors-ligne |
| **Mode sombre** | ✅ | ✅ | Toggle light/dark/system, persistance localStorage |

---

## Detailed Feature Breakdown

### 🆓 Free Tier — Included

#### Profile & Visibility
| Feature | Implementation |
|---|---|
| Public profile page | `/professionnels/[slug]` — hero, portfolio, about, contact |
| Profile editing | `/pro/profil` — photo, bio, services, experience, team, WhatsApp |
| AI copywriting | 4-step questionnaire → Claude generates hero tagline + about text |
| 3 portfolio projects | `pro_projects` table, max 3 enforced |
| 15 portfolio photos | Array in `professionals` table, max 15 enforced |
| Status badge | Auto-calculated via DB trigger (Gold/Silver/White/Red) |
| Profile views tracking | `profile_views` table, basic count |
| noindex on profile | `<meta name="robots" content="noindex">` — not in sitemap |

#### Project Management
| Feature | Implementation |
|---|---|
| Project CRUD | Create, read, update status, delete pro projects |
| Project detail | Title, description, location, dates, budget, client info |
| Journal stats | Real-time: report count, spending, photo count, days worked |
| Step management | Roadmap with phases, budgets, assigned professionals |
| Export dropdown | PDF + Excel (fully functional) |

#### Daily Journal
| Feature | Implementation |
|---|---|
| Log creation | Date, title, description (50+ chars), money, weather, GPS |
| Photo upload | Drag & drop, camera capture, EXIF extraction |
| Offline drafts | IndexedDB storage, auto-save debounced 500ms |
| Sync on reconnect | Reads draft from IndexedDB → `createLog()` server action |
| Log timeline | Grouped by month/year, card-based with photo thumbnails |
| Log detail | GPS display, money, weather, photos, issues, next steps |
| Approve/Contest | Client can approve or contest with comment |
| Share logs | Token-based public link via email, WhatsApp, SMS |
| Real-time sync | Supabase Realtime — live updates across connected clients |

#### Reputation
| Feature | Implementation |
|---|---|
| Recommendations | View all, link to profile, status tracking |
| Signals | View all, respond within 15 days, permanent record |
| Status calculation | DB trigger: Gold (3+ recs), Silver (1-2), White (0), Red (1+ signals) |
| Red permanence | Once Red, stays Red unless admin manually overrides |

#### Notifications
| Feature | Implementation |
|---|---|
| In-app bell icon | Unread count badge, dropdown with 10 recent, mark-all-read |
| Email: new log | Client notified when professional publishes report |
| Email: log approved | Professional notified when client approves report |
| Email: log contested | Professional notified when client contests report |
| Email: project assigned | Professional notified when added to a project |
| Email: reputation | Notification on new recommendation or signal |

#### Infrastructure
| Feature | Implementation |
|---|---|
| Dark mode | Toggle (light/dark/system), persists in localStorage |
| PWA | Manifest.json, service worker, installable on mobile |
| Sitemap | Listed in `/sitemap.xml` but profile has noindex |
| GA4 | Tracking script loads on all pages |

---

### 💎 Premium Tier — Everything in Free, plus:

#### Enhanced Visibility
| Feature | Implementation |
|---|---|
| Unlimited projects | No cap on `pro_projects` — document entire career |
| Unlimited photos | No cap on portfolio photos |
| Video support | Upload project videos to `videos` storage bucket |
| Google indexing | Profile appears in `/sitemap.xml`, `index` in robots meta |
| SSR rendering | Dynamic server-side rendering — real-time metadata |
| Open Graph tags | Full OG title, description, image, type, URL, locale |
| Twitter Card | `summary_large_image` with photo |
| Advanced analytics | 6-month bar chart, traffic source breakdown, contact click tracking |

#### Automatic Branding
| Feature | Implementation |
|---|---|
| Logo upload | Upload to `logos` storage bucket via `uploadLogo()` |
| Color extraction | `color-thief` extracts primary, secondary, accent colors |
| Dynamic theming | Profile page adopts brand colors (buttons, overlays, badges) |
| WCAG contrast | Color combinations verified for readability |

#### Subscription Management
| Feature | Implementation |
|---|---|
| Stripe Checkout | One-click subscribe → hosted checkout → webhook → active |
| Customer Portal | Manage payment method, view invoices, cancel subscription |
| Webhook handling | `checkout.session.completed`, `subscription.updated`, `subscription.deleted`, `invoice.payment_failed` |
| Billing history | View invoices via Stripe Portal (UI ready) |

#### Tier Enforcement
| Rule | Free | Premium |
|---|---|---|
| Max projects | 3 | Unlimited |
| Max photos | 15 | Unlimited |
| Videos | ❌ | ✅ |
| Google indexing | ❌ | ✅ |
| SSR rendering | ❌ (SSG) | ✅ |
| Brand colors | ❌ | ✅ |
| Advanced analytics | ❌ | ✅ |

---

## Feature Enforcement Points

| Checkpoint | How It's Enforced |
|---|---|
| Project creation | `canCreateProject()` in `subscription-gate.ts` — blocks if count >= 3 |
| Photo upload | `canUploadPhotos()` in `subscription-gate.ts` — blocks if count >= 15 |
| Video upload | `getTierLimits().hasVideo` — hides video upload UI for free |
| Sitemap inclusion | `isPaid = pro.status === 'gold' \|\| pro.status === 'silver'` — only paid profiles listed |
| Profile indexing | `robots: { index: isPaid }` in `generateMetadata()` — noindex for free |
| SSR vs SSG | Subscription check in profile page — dynamic rendering for paid |

### ⚠️ Dev Mode — Enforcement Currently Bypassed

All subscription gates are disabled for development. Search for `// DEV MODE` to locate all overrides.

| File | Override |
|---|---|
| `lib/utils/subscription-gate.ts` | `getTierLimits()` → always `PAID_LIMITS` |
| `lib/utils/subscription-gate.ts` | `canCreateProject()` → always `{ allowed: true, limit: -1 }` |
| `lib/utils/subscription-gate.ts` | `canUploadPhotos()` → always `{ allowed: true, limit: -1 }` |
| `app/(professional)/pro/site/page.tsx` | `isPaid = true` (hardcoded) |

**Restore before production:** revert `subscription-gate.ts` to query the `subscriptions` table and revert `isPaid` to `pro.status === "gold" \|\| pro.status === "silver"`.

---

## Future Features (Not Yet Implemented)

| Feature | Tier | Status |
|---|---|---|
| Wave / Orange Money payment | Paid | ❌ Infrastructure ready, payment not wired |
| Client-side color extraction UI | Paid | ❌ Server actions ready, UI component deferred |
| Photo sync for offline drafts | Free + Paid | ❌ Text sync works, photo sync needs base64 |
| Realization documents upload | Free + Paid | ✅ Table exists, UI wired in PortfolioForm |
| Subscription billing history UI | Paid | ❌ Stripe data available, no UI built |
| Date range selector in Analytics | Paid | ❌ Always shows last 6 months |

---

## Revenue Model Summary

| Metric | Value |
|---|---|
| **Revenue source** | Professional subscriptions only |
| **Free tier** | Always free, never charged |
| **West Africa** | 3 000 XOF / mois (Wave, Orange Money, MTN Mobile Money) |
| **Europe** | €15 / mois (Stripe) |
| **Not a revenue model** | Charging clients, CPM/ads, charging for trust/validation |

**Incentive logic:**
- Clients are free → maximum reach, maximum credibility
- Validation is free → cannot be gamed or purchased
- Visibility is paid → only professionals with something to show will pay
- Good professionals (Gold) pay because visibility converts
- Bad professionals (Red) won't pay — visibility would expose them
