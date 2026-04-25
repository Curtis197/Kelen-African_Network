# Daily Log — UI/UX Design Document

> Created: 2026-04-06
> Status: Design — awaiting approval before implementation

---

## 1. Route & Navigation Structure

### 1.1 Where the Journal Lives

The "Journal" is a **tab** on the existing project detail page.

```
/projets/[id]                    → Project overview (existing)
/projets/[id]/journal            → Daily log timeline (NEW)
/projets/[id]/journal/nouveau    → Create new log (NEW)
/projets/[id]/journal/[logId]    → Single log detail (NEW)
/journal/[shareToken]            → Public shared log view (NEW — outside auth)
```

### 1.2 Navigation Entry Points

**From project detail page** — New tab in the existing project nav:
```
[Vue d'ensemble]  [Équipe]  [Étapes]  [Journal]  [Documents]
                                              ↑ NEW
```

**From project dashboard** (`/projets`):
- Each project card shows a small indicator: "📝 3 rapports cette semaine"
- Clicking goes directly to `/projets/[id]/journal`

**From pro sidebar** — New nav item:
```
📋  Mes projets
📝  Mon journal          ← NEW
```

---

## 2. Page-by-Page UI Breakdown

### 2.1 Journal List Page — `/projets/[id]/journal`

**Purpose**: Chronological view of all logs for this project. Quick scan + drill down.

#### Layout (Desktop)

```
┌────────────────────────────────────────────────────────────────┐
│  Chantier Villa Saly                            [🔗 Partager]  │
│  Projet en cours · Budget: 25M XOF              [➕ Nouveau]   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ─── Mars 2026 ───                                           │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  5 avril 2026 · 14h32 · Moussa D. (Pro)              │      │
│  │  ┌─────────────────────────────────────────────┐     │      │
│  │  │  COULAGE DES FONDATIONS TERMINÉ              │     │      │
│  │  │  Les fondations du bâtiment principal sont    │     │      │
│  │  │  entièrement coulées. Béton livré par Ciment  │     │      │
│  │  │  Sahel (12 camions). Séchage en cours.        │     │      │
│  │  └─────────────────────────────────────────────┘     │      │
│  │  ┌─────┐ ┌─────┐ ┌─────┐                            │      │
│  │  │ IMG │ │ IMG │ │ PDF │         +3 fichiers         │      │
│  │  │     │ │     │ │     │                            │      │
│  │  └─────┘ └─────┘ └─────┘                            │      │
│  │  💰 2 500 000 XOF  ·  📍 14.6937°N, 17.4441°W      │      │
│  │  ⚠️ Retard livraison acier (voir problèmes)          │      │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │      │
│  │  [Approuvé ✓]  [Voir le détail →]                   │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  4 avril 2026 · 09h15 · Jean D. (Client)             │      │
│  │  VISITE DE CHANTIER — Vérification ferraillage       │      │
│  │  ┌─────────────────────────────────────────────┐     │      │
│  │  │  Contrôle du ferraillage effectué. Conforme   │     │      │
│  │  │  aux plans. Autorisation de coulage donnée.   │     │      │
│  │  └─────────────────────────────────────────────┘     │      │
│  │  ┌─────┐ ┌─────┐                                    │      │
│  │  │ IMG │ │ IMG │                                    │      │
│  │  └─────┘ └─────┘                                    │      │
│  │  📍 14.6937°N, 17.4441°W                            │      │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │      │
│  │  [En attente]  [Voir le détail →]                   │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                │
│  ─── Février 2026 ───                                        │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  28 fév. 2026 · 17h00 · Moussa D. (Pro)              │      │
│  │  PRÉPARATION DU TERRAIN — Nivellement terminé        │      │
│  │  ... (collapsed preview)                              │      │
│  │  [Contesté ⚠️]  [Voir le détail →]                   │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

#### Layout (Mobile)

```
┌─────────────────────┐
│ Chantier Villa Saly │
│ [🔗]        [➕]    │
├─────────────────────┤
│                     │
│ 5 avril 2026        │
│ Moussa D. (Pro)     │
│ ┌─────────────────┐ │
│ │ COULAGE DES     │ │
│ │ FONDATIONS...   │ │
│ └─────────────────┘ │
│ [IMG] [IMG] [PDF]   │
│ 💰 2.5M XOF         │
│ 📍 14.69°N, 17.44°W │
│ ⚠️ Retard livraison  │
│ [Approuvé ✓] [→]    │
│                     │
│ 4 avril 2026        │
│ Jean D. (Client)    │
│ ┌─────────────────┐ │
│ │ VISITE DE       │ │
│ │ CHANTIER...     │ │
│ └─────────────────┘ │
│ [IMG] [IMG]         │
│ [En attente] [→]    │
│                     │
└─────────────────────┘
```

#### Key Design Decisions

- **Grouped by month** — chronological with month headers, like a journal
- **Card-based** — each log is a card with preview image thumbnails
- **Status badge** — prominent color-coded pill on each card
- **Issues flag** — if `issues` field is not empty, show a small warning icon + truncated text
- **Money display** — compact, with project currency
- **GPS display** — compact coordinates (truncated to 2 decimals on card, full on detail)
- **"Voir le détail →"** — clickable anywhere on card to navigate to detail page
- **Infinite scroll or pagination** — load more as user scrolls (no hardcoded page numbers)

#### Empty State

```
┌────────────────────────────────────────────────────────────┐
│  📝                                                        │
│  Aucun rapport pour le moment                              │
│  Commencez à documenter l'avancement de ce chantier.       │
│                                                            │
│  [➕ Créer le premier rapport]                             │
└────────────────────────────────────────────────────────────┘
```

#### Loading State

- Skeleton cards matching the card shape
- Shimmer animation on image placeholders
- 3 skeleton cards by default

---

### 2.2 Create/Edit Log Page — `/projets/[id]/journal/nouveau`

**Purpose**: Rich form to create a new daily log entry.

#### Layout (Desktop)

```
┌────────────────────────────────────────────────────────────────┐
│  ← Retour au journal                                           │
│                                                                │
│  Nouveau rapport                                               │
│  Chantier Villa Saly                                           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  📅 Date                                                 │  │
│  │  [06/04/2026        ] 📆                                 │  │
│  │                                                          │  │
│  │  🏷️ Titre du rapport                                    │  │
│  │  [_____________________________]                         │  │
│  │                                                          │  │
│  │  📝 Description                                          │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │                                                    │  │  │
│  │  │  Zone de texte simple                              │  │  │
│  │  │  (pas de formatting)                               │  │  │
│  │  │                                                    │  │  │
│  │  │                                                    │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                          │  │
│  │  📍 Localisation GPS                    📡 Détecter      │  │
│  │  Latitude:  [14.6937283          ]                       │  │
│  │  Longitude: [-17.4440692         ]                       │  │
│  │  Source: EXIF (photo) ✅                                 │  │
│  │                                                          │  │
│  │  💰 Dépenses du jour                                     │  │
│  │  ┌──────────────┐ ┌──────────┐                          │  │
│  │  │ 2 500 000    │ │ XOF    ▼│                          │  │
│  │  └──────────────┘ └──────────┘                          │  │
│  │  🔗 Lier à un paiement (optionnel)                      │  │
│  │  [Aucun paiement lié] ▼                                 │  │
│  │                                                          │  │
│  │  ⚠️ Problèmes rencontrés (optionnel)                    │  │
│  │  [_____________________________]                         │  │
│  │                                                          │  │
│  │  📋 Prochaines étapes (optionnel)                       │  │
│  │  [_____________________________]                         │  │
│  │                                                          │  │
│  │  🌤️ Météo (optionnel)                                  │  │
│  │  ☀️  ⛅  🌧️  ⛈️  ❄️                                     │  │
│  │                                                          │  │
│  │  📷 Photos du chantier                                  │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  [Glissez vos photos ici ou cliquez]               │  │  │
│  │  │  JPEG, PNG, WebP — max 10MB par photo              │  │  │
│  │  │                                                    │  │  │
│  │  │  📷 Prendre une photo  |  📁 Choisir des fichiers  │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                          │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                 │  │
│  │  │          │ │          │ │          │                  │  │
│  │  │  IMG 01  │ │  IMG 02  │ │  IMG 03  │  [×] each       │  │
│  │  │  ★ Cover │ │          │ │          │                  │  │
│  │  │          │ │          │ │          │                  │  │
│  │  └──────────┘ └──────────┘ └──────────┘                 │  │
│  │  EXIF: ✅ GPS + ⏰ ✅  |  📡 Pas de GPS sur 1 photo      │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  [Annuler]     [💾 Brouillon]     [Publier le rapport]   │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

#### Layout (Mobile — Single Column)

```
┌─────────────────────┐
│ ← Retour            │
│ Nouveau rapport     │
├─────────────────────┤
│ 📅 Date             │
│ [06/04/2026]  📆    │
│                     │
│ 🏷️ Titre            │
│ [____________]      │
│                     │
│ 📝 Description      │
│ ┌─────────────────┐ │
│ │                 │ │
│ │                 │ │
│ └─────────────────┘ │
│                     │
│ 📍 Localisation GPS │
│ [📡 Détecter ma     │
│  position]          │
│ Lat: [14.6937]      │
│ Lng: [-17.4441]     │
│ Source: EXIF ✅     │
│                     │
│ 💰 Dépenses         │
│ [2 500 000] [XOF▼] │
│                     │
│ 🔗 Lier paiement    │
│ [Aucun] ▼           │
│                     │
│ ⚠️ Problèmes        │
│ [____________]      │
│                     │
│ 📋 Prochaines étapes│
│ [____________]      │
│                     │
│ 🌤️ Météo            │
│ ☀️ ⛅ 🌧️ ⛈️ ❄️       │
│                     │
│ 📷 Photos           │
│ ┌─────────────────┐ │
│ │ 📷 Prendre photo│ │
│ │ 📁 Choisir fotos│ │
│ └─────────────────┘ │
│                     │
│ [IMG] [IMG] [IMG]   │
│ (uniform grid)      │
│                     │
│ [Annuler]           │
│ [💾 Brouillon]      │
│ [Publier le rapport]│
└─────────────────────┘
```

#### Form Field Specifications

| Field | Type | Required | Notes |
|---|---|---|---|
| Date | Date picker | ✅ Yes | Defaults to today. Can be backdated. |
| Title | Text input | ✅ Yes | Max 200 chars. Placeholder: "Ex: Coulage des fondations" |
| Description | Textarea (plain) | ✅ Yes | Min 50 chars. No formatting. |
| Money spent | Number input | ❌ Optional | Defaults to 0. Currency inherited from project. |
| Link to payment | Dropdown | ❌ Optional | Lists project payments not yet linked. |
| Issues | Textarea | ❌ Optional | Max 1000 chars. |
| Next steps | Textarea | ❌ Optional | Max 1000 chars. |
| Weather | Icon selector (single) | ❌ Optional | Sunny / Cloudy / Rainy / Stormy / Cold |
| GPS | Lat/Lng inputs + auto-detect | ✅ **Required** | Auto-fills from EXIF or browser GPS. No map — just coordinate fields + source indicator. |
| Photos | Upload zone | ❌ Optional (but recommended) | JPEG, PNG, WebP only. Max 10MB each. |

#### Offline Behavior

- **"Mode hors ligne"** banner appears at top when `navigator.onLine === false`
- **"💾 Brouillon"** saves to IndexedDB immediately (even when online — drafts exist for both modes)
- **"Publier le rapport"**:
  - If online: saves directly to Supabase
  - If offline: saves to IndexedDB + shows "Brouillon sauvegardé — sera envoyé à la reconnexion"
- **Auto-save**: On every keystroke, debounced at 500ms. Saves form state to IndexedDB in real-time.
- **Draft recovery**: If user navigates away and comes back, form prompts: "Un brouillon existe. Restaurer?"

#### GPS Acquisition Strategy (Priority Order)

```
1. EXIF GPS from uploaded photos (highest confidence)
   ↓ (if no photos with GPS)
2. Browser Geolocation API (navigator.geolocation)
   ↓ (if denied or unavailable)
3. Manual coordinate entry (user types lat/lng)
```

**UI indicator per source:**
- EXIF: `Source: EXIF (photo) ✅` — green check
- Browser: `Source: Position détectée (appareil) 📡` — blue info
- Manual: `Source: Manuelle 📌` — gray pin

**GPS Validation:**
- On submit: GPS coordinates required (both lat and lng must be present)
- Log detail page shows distance from project location: "📍 12m du lieu du projet ✅" (within 50m) or "📍 2.3km du lieu du projet ⚠️" (further away)

---

### 2.3 Single Log Detail Page — `/projets/[id]/journal/[logId]`

**Purpose**: Full immersive view of a single log entry with all media, comments, and actions.

#### Layout (Desktop)

```
┌────────────────────────────────────────────────────────────────┐
│  ← Retour au journal                          [🔗 Partager]    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  5 avril 2026 · 14h32                                         │
│  🟢 Approuvé                                                  │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  COULAGE DES FONDATIONS TERMINÉ                       │      │
│  │                                                       │      │
│  │  Les fondations du bâtiment principal sont            │      │
│  │  entièrement coulées. Béton livré par Ciment Sahel    │      │
│  │  (12 camions). Séchage en cours (72h prévu).          │      │
│  │  L'équipe de 8 ouvriers a travaillé de 6h à 16h.      │      │
│  │                                                       │      │
│  │  Rédigé par Moussa Diallo (Professionnel)             │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  📍 14.6937283°N, 17.4440692°W                      │      │
│  │  Source: EXIF (3 photos)                            │      │
│  │  ┌─────────────────────────────────────────────┐     │      │
│  │  │         [Interactive Map View]              │     │      │
│  │  │         Showing pin on project location     │     │      │
│  │  └─────────────────────────────────────────────┘     │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  💰 2 500 000 XOF                                    │      │
│  │  🔗 Non lié à un paiement officiel                   │      │
│  │     [Convertir en paiement]                          │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  🌤️ Météo: Ensoleillé, 32°C                         │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                │
│  ━━━ Photos (5) ━━━                                          │
│                                                                │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                    │
│  │     │ │     │ │     │ │     │ │     │  Uniform grid       │
│  │ IMG │ │ IMG │ │ IMG │ │ IMG │ │ IMG │                     │
│  │     │ │     │ │     │ │     │ │     │                     │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                    │
│   ▲ Tap to open lightbox                                      │
│                                                                │
│  ━━━ Problèmes rencontrés ━━━                                │
│                                                                │
│  ⚠️ Retard de livraison d'acier (2 jours de retard sur         │
│  le planning prévu). Fournisseur: Acier Sénégal SARL.          │
│  Impact: décalage possible de la phase murs.                   │
│                                                                │
│  ━━━ Prochaines étapes ━━━                                   │
│                                                                │
│  📋 Début du séchage (72h). Prochaine étape:                   │
│  démoulage prévu le 8 avril. Livraison briques prévue           │
│  le 9 avril.                                                   │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ━━━ Commentaires (2) ━━━                                    │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  Jean Dupont (Client) · 5 avril 2026 · 18h00         │      │
│  │  ✅ Approuvé                                          │      │
│  │  "Travail conforme aux plans. J'ai vérifié les        │      │
│  │   dimensions, tout est bon."                          │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  Moussa Diallo (Pro) · 6 avril 2026 · 08h00          │      │
│  │  "Merci Jean. Le séchage se passe bien."              │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  [Ajouter un commentaire...]          [Envoyer]      │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│  [Approuver ✓]  [Contester ⚠️]                                 │
└────────────────────────────────────────────────────────────────┘
```

#### Layout (Mobile)

```
┌─────────────────────┐
│ ← Retour    [🔗]    │
├─────────────────────┤
│ 5 avril 2026 14h32  │
│ 🟢 Approuvé         │
│                     │
│ COULAGE DES         │
│ FONDATIONS...       │
│                     │
│ Les fondations du   │
│ bâtiment...         │
│                     │
│ 📍 14.69°N, 17.44°W │
│ ┌─────────────────┐ │
│ │  [Mini carte]   │ │
│ └─────────────────┘ │
│                     │
│ 💰 2 500 000 XOF    │
│ 🌤️ Ensoleillé 32°C  │
│                     │
│ ━━━ Galerie (5) ━━━ │
│ [IMG] [IMG] [IMG]   │
│ [IMG] [PDF]         │
│ (swipe carousel)    │
│                     │
│ ⚠️ Problèmes        │
│ Retard livraison... │
│                     │
│ 📋 Prochaines étapes│
│ Début du séchage... │
│                     │
│ ━ Commentaires ━    │
│ Jean D. ✅          │
│ "Travail conforme"  │
│                     │
│ Moussa D.           │
│ "Merci Jean..."     │
│                     │
│ [Ajouter un         │
│  commentaire]       │
│                     │
│ ━━━━━━━━━━━━━━━━━━━ │
│ [Approuver]         │
│ [Contester]         │
└─────────────────────┘
```

---

### 2.4 Shared Log Page — `/journal/[shareToken]`

**Purpose**: Public-facing page for non-subscribed clients who receive a shared link.

#### Layout (Mobile-First — Most Traffic from Links)

```
┌─────────────────────┐
│  Kelen    [Logo]    │
├─────────────────────┤
│                     │
│  Rapport de chantier │
│  Chantier Villa Saly │
│  5 avril 2026        │
│                     │
│  ┌─────────────────┐│
│  │ COULAGE DES     ││
│  │ FONDATIONS...   ││
│  └─────────────────┘│
│                     │
│  Les fondations du  │
│  bâtiment principal │
│  sont entièrement   │
│  coulées...         │
│                     │
│  📍 14.69°N, 17.44°W│
│  💰 2 500 000 XOF   │
│  🌤️ Ensoleillé      │
│                     │
│  ━━━ Photos ━━━     │
│  [IMG] [IMG] [IMG]  │
│  (swipe)            │
│                     │
│  ⚠️ Retard livraison│
│  acier...           │
│                     │
│  📋 Prochaines:     │
│  Démoulage 8 avril  │
│                     │
│  ━━━━━━━━━━━━━━━━━━━│
│                     │
│  Ce rapport a été   │
│  vu 3 fois          │
│  Dernière vue:      │
│  il y a 2 heures    │
│                     │
│  ━━━━━━━━━━━━━━━━━━━│
│                     │
│  Votre retour:      │
│                     │
│  📧 Votre email:    │
│  [_______________]  │
│                     │
│  💬 Commentaire:    │
│  ┌─────────────────┐│
│  │                 ││
│  └─────────────────┘│
│                     │
│  [📎 Ajouter des    │
│   preuves (opt.)]   │
│                     │
│  [✅ Approuver]     │
│  [⚠️ Contester]     │
│                     │
│  ━━━━━━━━━━━━━━━━━━━│
│  Propulsé par Kelen │
│  kelen.africa       │
└─────────────────────┘
```

#### Key Differences from Authenticated View

- **No navigation** — no sidebar, no tabs
- **Email required** — to submit approval or contest
- **Evidence upload optional** — but available
- **View counter visible** — "Ce rapport a été vu X fois"
- **Kelen branding** — footer with logo and link
- **No edit capabilities** — read-only + comment only
- **No media download** — viewing only (prevent forwarding evidence)

---

### 2.5 Share Modal

**Purpose**: Share a log via email, WhatsApp, or SMS.

```
┌─────────────────────────────────────┐
│                                     │
│         Partager ce rapport         │
│                                     │
│  Envoyer via:                       │
│                                     │
│  ┌──────────┐ ┌──────────┐         │
│  │  📧      │ │  💬      │         │
│  │  Email   │ │ WhatsApp │         │
│  └──────────┘ └──────────┘         │
│                                     │
│  ┌──────────┐                      │
│  │  📱      │                      │
│  │  SMS     │                      │
│  └──────────┘                      │
│                                     │
│  ─────────────────────────────      │
│                                     │
│  Destinataire (optionnel):          │
│  📧 [email@exemple.com      ]       │
│  📱 [+221 77 000 00 01      ]       │
│                                     │
│  ─────────────────────────────      │
│                                     │
│  Ou copier le lien:                 │
│  ┌──────────────────────────────┐   │
│  │ kelen.africa/journal/x8k2... │📋│
│  └──────────────────────────────┘   │
│                                     │
│              [Annuler] [Envoyer]    │
│                                     │
└─────────────────────────────────────┘
```

#### Share Behavior

| Method | Behavior |
|---|---|
| **Email** | Sends via Resend. Template: "Nouveau rapport — Chantier Villa Saly" with preview + link |
| **WhatsApp** | Opens `wa.me/{phone}?text={encoded_message}` with pre-filled message |
| **SMS** | Opens `sms:{phone}?body={encoded_message}` on mobile |
| **Copy link** | Copies to clipboard with toast confirmation |

**Pre-filled message template:**
```
Nouveau rapport pour le chantier "Villa Saly" — 5 avril 2026
Coulage des fondations terminé. Voir le rapport:
https://kelen.africa/journal/{shareToken}
```

---

## 3. Component Architecture

### 3.1 New Components to Create

```
components/
├── journal/
│   ├── LogTimeline.tsx          ← Main timeline list (grouped by month)
│   ├── LogCard.tsx              ← Single log preview card
│   ├── LogDetail.tsx            ← Full log detail view
│   ├── LogForm.tsx              ← Create/edit log form
│   ├── PhotoUpload.tsx          ← Drag & drop photo upload with EXIF
│   ├── PhotoGrid.tsx            ← Uniform grid of photos
│   ├── PhotoLightbox.tsx        ← Full-screen photo viewer
│   ├── LogActions.tsx           ← Approve / Contest / Resolve bar
│   ├── LogCommentThread.tsx     ← Comment history display
│   ├── LogCommentForm.tsx       ← Add comment form
│   ├── GPSDisplay.tsx           ← GPS coordinates display + source indicator
│   ├── GPSInput.tsx             ← Lat/Lng input + auto-detect button
│   ├── MoneyDisplay.tsx         ← Formatted money with currency
│   ├── WeatherIcon.tsx          ← Weather emoji/icon
│   ├── ShareLogModal.tsx        ← Share via email/WhatsApp/SMS
│   ├── SharedLogPage.tsx        ← Public shared log layout
│   ├── OfflineIndicator.tsx     ← "Mode hors ligne" banner
│   ├── SyncQueue.tsx            ← Pending drafts UI
│   ├── LogStatusBadge.tsx       ← Status pill component
│   └── LogEmptyState.tsx        ← Empty state illustration
├── ui/
│   └── (existing components reused)
```

### 3.2 Reused Existing Components

| Existing Component | Usage in Journal |
|---|---|
| `StatusBadge.tsx` | Adapt for log statuses (add new colors) |
| `Navbar.tsx` | Already exists — no changes needed |
| `DashboardSidebar.tsx` | Add "Mon journal" nav item |
| `ProjectStepsSection.tsx` | Reference for card styling patterns |
| `Dialog` components | Use for ShareLogModal, GPSInput modal |

---

## 4. Offline Experience Design

### 4.1 Visual States

**Online (normal):**
- No indicator
- All actions work normally
- "Publier le rapport" saves to server immediately

**Offline detected:**
```
┌────────────────────────────────────────────────────┐
│  📡 Mode hors ligne                                │
│  Les brouillons sont sauvegardés localement        │
│  et seront envoyés à la reconnexion.               │
│                              [Synchroniser]        │
└────────────────────────────────────────────────────┘
```

- Yellow/orange banner at top of form
- "Publier le rapport" → "💾 Sauvegarder le brouillon"
- All media stored locally in IndexedDB

**Reconnecting:**
```
┌────────────────────────────────────────────────────┐
│  🔄 Reconnexion en cours...                        │
│  Envoi de 2 brouillon(s)...                        │
└────────────────────────────────────────────────────┘
```

**Sync complete:**
```
┌────────────────────────────────────────────────────┐
│  ✅ 2 brouillon(s) envoyé(s) avec succès           │
└────────────────────────────────────────────────────┘
```

### 4.2 Draft Management

**Draft list accessible from journal page:**
```
┌──────────────────────────────────────────┐
│  Brouillons en attente (2)               │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ 5 avril · Coulage fondations       │  │
│  │ 💾 En attente de synchronisation   │  │
│  │ [Envoyer maintenant] [Supprimer]   │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ 4 avril · Livraison matériaux      │  │
│  │ 💾 En attente de synchronisation   │  │
│  │ [Envoyer maintenant] [Supprimer]   │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

### 4.3 IndexedDB Schema

Using `idb-keyval` — simple key-value store:

```
Key: `draft-log-{uuid}` → Value: Full log form data + media blobs
Key: `draft-media-{uuid}` → Value: Individual media blob (photo/video)
Key: `sync-queue` → Value: Array of draft UUIDs awaiting sync
Key: `last-gps` → Value: Last known GPS coordinates (cached)
Key: `form-state` → Value: Current form input values (auto-save)
```

---

## 5. Responsive Breakpoints

| Breakpoint | Target | Behavior |
|---|---|---|
| `< 640px` (sm) | Mobile phones | Single column, stacked cards, carousel gallery |
| `640px - 1024px` (md-lg) | Tablets | Two-column form layout, grid gallery |
| `> 1024px` (lg) | Desktop | Full layout with sidebar, masonry gallery |

### 5.1 Gallery Responsive Behavior

| Screen | Layout |
|---|---|
| Mobile (< 640px) | Swipeable carousel, 1 image at a time |
| Tablet (640-1024px) | 2-column grid |
| Desktop (> 1024px) | Masonry: 1 large cover + 2-column thumbnails |

### 5.2 Form Responsive Behavior

| Screen | Layout |
|---|---|
| Mobile | Single column, full-width inputs, stacked buttons |
| Tablet+ | Single column centered, max-width 800px (no sidebar) |
| Desktop | Single column centered, max-width 800px |

---

## 6. Color & Typography

### 6.1 Status Badge Colors

| Status | Background | Text | Icon |
|---|---|---|---|
| `pending` | `bg-amber-100` | `text-amber-800` | ⏳ |
| `approved` | `bg-green-100` | `text-green-800` | ✅ |
| `contested` | `bg-red-100` | `text-red-800` | ⚠️ |
| `resolved` | `bg-blue-100` | `text-blue-800` | 🔵 |

**Dark mode equivalents** using MD3 tokens:
- `pending` → `bg-amber-200/20 text-amber-300`
- `approved` → `bg-green-200/20 text-green-300`
- `contested` → `bg-red-200/20 text-red-300`
- `resolved` → `bg-blue-200/20 text-blue-300`

### 6.2 Typography Scale

| Element | Mobile | Desktop |
|---|---|---|
| Page title | `text-2xl font-bold` | `text-3xl font-bold` |
| Log title (card) | `text-lg font-semibold` | `text-xl font-semibold` |
| Log title (detail) | `text-xl font-bold` | `text-2xl font-bold` |
| Body text | `text-sm` | `text-base` |
| Metadata (date, GPS) | `text-xs text-muted` | `text-sm text-muted` |
| Form labels | `text-sm font-medium` | `text-sm font-medium` |

---

## 7. Animations & Transitions

Following the "Digital Diplomat" design system with `framer-motion`:

| Interaction | Animation |
|---|---|
| Card hover | Subtle lift: `y: -2px, shadow increase` |
| Card expand | `layoutId` morph from card to detail |
| Gallery lightbox open | `opacity: 0 → 1, scale: 0.95 → 1` |
| New log appear | `slideIn: y: 20 → 0, opacity: 0 → 1` |
| Approve/contest buttons | Stagger animation on page load |
| Share modal | `opacity: 0 → 1, backdrop blur` |
| Offline banner | `slideIn: y: -100% → 0` |
| Sync complete toast | `slideIn: x: 100% → 0, auto-dismiss 3s` |

---

## 8. Accessibility Checklist

- [ ] All media have `alt` text (caption if provided, fallback "Photo du chantier du {date}")
- [ ] GPS map has `aria-label="Localisation du chantier"`
- [ ] Form inputs all have associated `<label>` with `htmlFor`/`id`
- [ ] Status badges use `role="status"` + `aria-label` (not just color)
- [ ] Gallery lightbox traps focus and handles Escape key
- [ ] Approve/contest buttons have `aria-pressed` state
- [ ] Offline banner announced by screen readers (`role="alert"`)
- [ ] Color contrast passes WCAG AA for all status badge combinations
- [ ] Media upload zone keyboard-accessible (tab to select files)
- [ ] Share modal uses existing `DialogContent` (focus trapping built-in)

---

## 9. Design Decisions (Resolved)

1. **Rich text editor**: **Plain textarea** only. No bold, no lists. Simple description text. Keeps the form lightweight, especially for offline use.
2. **No interactive map**: The form does **not** include a Leaflet/Mapbox map. GPS is acquired via EXIF or browser Geolocation API only. The log detail page shows a simple text comparison: "Log GPS vs Project location" — a distance indicator (e.g. "📍 12m du lieu du projet" with ✅ if within 50m, ⚠️ if further).
3. **Gallery layout**: **Uniform grid** on all breakpoints. No masonry. Consistent card sizing:
   - Mobile: 1 column (full-width cards)
   - Tablet: 2-column uniform grid
   - Desktop: 3-4 column uniform grid
4. **Draft auto-save**: **On every keystroke, debounced at 500ms**. Uses `useRef` + `setTimeout` pattern — no heavy library. Form state saved to IndexedDB in real-time.
5. **MVP media scope**: **Photos only.** No video upload, no document upload, no receipt upload for MVP. The media type in `project_log_media` is restricted to `'photo'`. This keeps the MVP focused on the core use case: visual proof of work done.

---

## 10. Next Steps

Once this UI/UX design is approved:

1. **Finalize the design questions above**
2. **Create the database migration** (first technical step)
3. **Build types and server actions**
4. **Implement components in this order:**
   - LogStatusBadge → LogCard → LogTimeline (read-only first)
   - LogForm → MediaUpload → GPSInput (write path)
   - LogDetail → LogCommentThread → LogActions (review path)
   - ShareLogModal → SharedLogPage (sharing path)
   - OfflineIndicator → SyncQueue (offline path)
5. **Wire up notifications** (Resend email templates)
6. **Test offline flow** with airplane mode simulation
7. **Polish & accessibility audit**
