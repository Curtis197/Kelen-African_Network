# Client Experience Audit — Kelen
**Date:** 2026-04-29
**Status:** Draft
**Scope:** End-to-end journey for homeowners and project owners using Kelen to find, compare, hire, and collaborate with professionals.

---

## 1. Context

Kelen serves two sides of a marketplace. This document audits the **client side only** — the experience of someone who wants to hire a professional for a construction, renovation, or home service project.

The pro side has its own feature matrix (dashboard, newsletter, Google Maps, portfolio, subscriptions). The client side shares the same codebase but operates under `/app/(client)/` routes and public-facing `/app/(marketing)/` and `/app/(pro-site)/professionnels/[slug]/` routes.

The audit covers:
- Current feature completeness
- Journey friction points
- Missing trust infrastructure
- Prioritized gaps

---

## 2. Feature Matrix — Client Side

### 2.1 Discovery

| Feature | Status | Location | Notes |
|---|---|---|---|
| Professional directory with search | Complete | `/` (home) | Full-text on `business_name`, `owner_name` |
| Filter by profession | Complete | `ProfessionalDirectory` | Dropdown from DB professions |
| Filter by development area | Complete | `ProfessionalDirectory` | Electrical, Plumbing, Construction, etc. |
| Filter by tier (Or / Argent / Tous) | Complete | `ProfessionalDirectory` | Visual badge on cards |
| Filter by city / country | Complete | `ProfessionalDirectory` | Free text |
| Sort by recommendation count | Complete | `getProfessionals()` | Default sort; Gold → Silver → White |
| Contextual / smart ranking | Missing | — | No weighting by budget match, past project type, proximity |
| Saved / favorites list | Complete | `/favoris` | Heart icon on card, stored in `user_favorites` |
| Professional public profile | Complete | `/professionnels/[slug]` | Hero, about, services, realisations, recs |
| Client reviews visible on profile | Missing | — | `reviews` table exists, `avg_rating` stored, never displayed |
| Portfolio (realisations) on profile | Complete (paywalled) | `/professionnels/[slug]/realisations` | 3 items max for free tier |
| Services listing on profile | Complete (paywalled) | `/professionnels/[slug]/services` | 3 items max for free tier |
| Products listing on profile | Complete (paywalled) | `/professionnels/[slug]/produits` | 3 items max for free tier |
| Verified recommendations visible | Complete | `/professionnels/[slug]` | Before/after photos, project type, budget range |
| Google reviews on profile | Complete | `/professionnels/[slug]` | Only for verified GBP accounts; 24h cache |

**Discovery score: 7 / 10**
Core search and browse is solid. The absence of client reviews on profiles and no contextual ranking are the two critical gaps.

---

### 2.2 Comparison

| Feature | Status | Location | Notes |
|---|---|---|---|
| Add professional to project | Complete | `manageProjectProfessional()` | Requires a project to exist first |
| Selection status funnel | Complete | `/projets/[id]/pros` | saved → shortlisted → finalist → active → declined |
| Visual comparison by status group | Complete | `ProListPage` | Grouped cards per status |
| Side-by-side comparison (2–3 pros) | Missing | — | No dedicated compare view; must browse cards one by one |
| Lightweight compare without project | Missing | — | No "compare mode" for casual browsing before project creation |
| Quick quote request (1-click) | Missing | — | No simplified quote flow; full project + finalist path required |
| Pro performance stats on card | Missing | — | `avg_rating` computed but not shown on `ProfessionalCard` |
| Recommendation snippet on card | Missing | — | Count shown, content buried in profile |

**Comparison score: 4 / 10**
The comparison infrastructure is correct but forces every user into a full project management flow. For jobs that take 2 hours (fixing a leak, painting a room) the funnel is a 4-step procurement process. This is the largest friction point in the experience.

---

### 2.3 Project Management

| Feature | Status | Location | Notes |
|---|---|---|---|
| Create project (wizard) | Complete | `/projets/nouveau` | Title, description, category, budget, location, areas |
| Project list | Complete | `/projets` | Cards with status, location, budget, image |
| Project detail | Complete | `/projets/[id]` | Steps (roadmap), team, budget tracker, development areas |
| Edit project | Complete | `/projets/[id]/modifier` | — |
| Status tracking | Complete | `/projets/[id]` | en_preparation → en_cours → en_pause → termine → annule |
| Budget tracking | Complete | `/projets/[id]` | Circular progress: total vs. spent |
| Development areas | Complete | `project_areas` table | Multiple trade domains per project |
| Daily log / progress journal | Complete | `/projets/[id]/journal` | Per-day entries with photos |
| Document management | Complete | `/projets/[id]/documents` | Upload / view project documents |
| Milestone / payment milestones | Missing | — | Steps exist in UI but no financial milestones attached |
| Photo proof-of-work validation | Missing | — | No structured before/during/after checklist per milestone |
| Project sharing / co-owner | Missing | — | Single client ownership; no team invitations |
| Project templates | Missing | — | Each project starts blank; no templates for common job types |

**Project management score: 7 / 10**
Well-built for large renovation projects. Overkill for small jobs. No template path for recurring job types (e.g. "Annual maintenance" or "Paint 2 rooms").

---

### 2.4 Engagement & Collaboration

| Feature | Status | Location | Notes |
|---|---|---|---|
| Make finalist (invite to propose) | Complete | `/projets/[id]/pros` | One-click, triggers notification to pro |
| View submitted proposal | Complete | `/projets/[id]/pros/proposal/[proId]` | Budget, timeline, description, submit date |
| Bidirectional messaging | Complete | `collaboration_messages` | Client ↔ pro, with attachment support (PDF/images) |
| Request revision | Complete | Proposal page | Sets status to `negotiating`, sends message |
| Accept proposal | Complete | Proposal page | Sets status `agreed`, auto-declines other finalists |
| Decline proposal | Complete | Proposal page | Sets status `not_selected` |
| Counter-offer from client | Missing | — | `message_type = 'counter_offer'` exists in enum but no UI |
| Proposal templates | Missing | — | Free-form text; no structured quote format |
| Contract / formal agreement | Missing | — | No generated contract from accepted proposal |
| Payment integration | Missing | — | No Stripe; collaboration status never triggers payment |
| Invoice generation | Missing | — | Proposals are text-only; no formal invoice |
| Dispute / arbitration | Missing | — | Signals captured but no resolution workflow |

**Engagement score: 5 / 10**
Core propose → accept flow is complete. The gap is everything that happens after acceptance: no payment, no contract, no milestone-linked deliverables. The platform stops being useful at the moment the real collaboration starts.

---

### 2.5 Trust & Reputation

| Feature | Status | Location | Notes |
|---|---|---|---|
| Verified recommendations (by previous clients) | Complete | Profile page | Before/after photos, budget range shown |
| Submit recommendation | Complete | `/recommandation/[slug]` | Internal (existing Kelen pro) + external |
| Leave review (rating + comment) | Complete | `/avis/[slug]` | Stored in `reviews` table with `avg_rating` update |
| Reviews visible to other clients | Missing | — | The single most critical missing feature |
| Signal / report a professional | Complete | `/signal` | Multiple breach types, stored in `signals` |
| Signal count shown on card | Complete | `ProfessionalCard` | Visible warning indicator |
| Verification badge (Gold/Silver) | Complete | Cards + profiles | Tier system based on validation process |
| Response rate / time | Missing | — | No tracking of how fast pros respond |
| On-time completion rate | Missing | — | No data surfaced from completed projects |
| Budget adherence rate | Missing | — | Proposed budget vs. actual never compared |

**Trust score: 5 / 10**
The recommendation and signal system creates a solid foundation. The display gap for client reviews is critical — every review collected since launch is invisible to other users.

---

## 3. End-to-End Journey Map

### 3.1 Large Project (Renovation / Construction)
```
1. [Discovery]    Home → search by profession + city → browse professional cards
2. [Shortlist]    Visit profiles → read realisations + recommendations → add to favorites
3. [Project]      Create project (/projets/nouveau) → define areas (electrical, plumbing…)
4. [Assign]       From directory: select pros for each area → added as candidates
5. [Compare]      /projets/[id]/pros → move from saved → shortlisted → finalist
6. [Quote]        Finalist pros submit proposals → client reviews each proposal
7. [Message]      Client requests revisions → back-and-forth messaging
8. [Accept]       Accept 1 proposal → other finalists auto-declined
9. [Collaborate]  Track progress via journal, documents, budget tracker
10. [Close]       Mark project termine → submit review + recommendation
```

**Friction points on this path:**
- Step 3 forces project creation before any comparison is possible
- Step 10 requires navigating to `/avis/[slug]` separately; no prompt at project close

---

### 3.2 Small Job (Quick hire — fix a faucet, paint a room)
```
1. [Discovery]    Home → search by profession + city
2. [??]           No quick path — client must create a full project to engage a pro
3. [??]           No "request a quote" button on the professional's profile
4. [??]           No lightweight messaging before project creation
```

**This path does not exist today.** A client who wants a single professional for a small job has no option short of going through the full project wizard. This is the largest acquisition risk — clients with small, urgent needs will leave.

---

## 4. Prioritized Gaps

### P0 — Display client reviews on professional profiles
- **What:** Show `reviews` (rating + comment) on `/professionnels/[slug]`
- **Why:** The data exists. Every review collected is currently invisible to other clients. This destroys the trust loop.
- **Effort:** Low — one new section component, query already available via `avg_rating` + reviews join
- **Files to change:** `app/(pro-site)/professionnels/[slug]/page.tsx`, new `ClientReviewsSection` component

### P0 — Quick quote request flow (no project required)
- **What:** "Demander un devis" button on professional profile → client fills a short brief (job type, description, timeline, budget) → pro receives it as an inbound inquiry
- **Why:** Removes the biggest acquisition blocker for small jobs
- **Effort:** Medium — new `pro_quote_requests` table, API route, pro inbox item
- **Alternative short-cut:** reuse `project_collaborations` with a `direct_quote` type flag

### P1 — Show `avg_rating` and one recommendation snippet on `ProfessionalCard`
- **What:** Add star rating display + first recommendation excerpt to search results
- **Why:** Increases click-through from search to profile; currently all cards look identical except for recommendation count
- **Effort:** Low — `avg_rating` already in `professionals` table, `getLatestRecommandations()` already exists

### P1 — Post-acceptance workflow (payment milestone prompt)
- **What:** After `status = agreed`, surface a "Set up milestones" prompt and wire to Stripe Connect (already specced in `2026-04-21-payments-whatsapp.md`)
- **Why:** Platform value drops to zero after acceptance; no reason for client to return
- **Effort:** Medium — depends on Stripe Connect implementation status

### P2 — Contextual ranking in search
- **What:** Score professionals by: `recommendation_count` (×2) + `avg_rating` (×1.5) + `signal_count` (penalty ×-3) + profile completeness bonus
- **Why:** Current sort (tier → recommendation count) rewards seniority but not relevance
- **Effort:** Low — modify `getProfessionals()` in `lib/actions/professionals.ts`, add computed `relevance_score`

### P2 — Side-by-side comparison view
- **What:** Select 2–3 pros from any context → compare panel: photo, tier, recommendations, services, avg_rating, response time
- **Why:** Reduces the number of profile page navigations; speeds decision
- **Effort:** Medium — client-side state, no new DB tables

### P3 — Project close prompt + review request
- **What:** When project status changes to `termine`, prompt client to leave reviews for active professionals
- **Why:** Increases review collection rate; no manual navigation to `/avis/[slug]` required
- **Effort:** Low — hook into status update mutation, add modal/toast with links

### P3 — Project templates
- **What:** Pre-fill project wizard with common job structures (Peinture 2 pièces, Installation électrique, Rénovation salle de bain)
- **Why:** Reduces time to project creation; helpful for first-time users
- **Effort:** Low — static config + pre-populate wizard state

---

## 5. Feature Matrix Summary

| Area | Score | Top Gap |
|---|---|---|
| Discovery | 7/10 | Client reviews not displayed; no smart ranking |
| Comparison | 4/10 | No lightweight path; full project required |
| Project Management | 7/10 | No milestones; no templates; single-owner only |
| Engagement | 5/10 | Nothing after acceptance: no payment, no contract |
| Trust & Reputation | 5/10 | Reviews invisible; no performance metrics |
| **Overall** | **5.6/10** | **Review display + quick quote path** |

---

## 6. Out of Scope (V2+)

- Escrow / payment protection
- Dispute resolution & arbitration
- AI-powered matching (budget inference, past project similarity)
- Multi-owner / collaborative projects
- Contractor insurance / guarantee product
- Periodic maintenance scheduling (recurring projects)

---

## 7. Immediate Next Steps

1. **Fix review visibility** — `ClientReviewsSection` on public profile (P0, ~1 day)
2. **Add rating to `ProfessionalCard`** — star display + recommendation snippet (P1, ~2h)
3. **Quick quote request flow** — "Demander un devis" on profile (P0, ~3 days)
4. **Project close → review prompt** — trigger on status change (P3, ~2h)

Items 1 and 4 require no new tables. Items 2 and 3 require schema changes.
