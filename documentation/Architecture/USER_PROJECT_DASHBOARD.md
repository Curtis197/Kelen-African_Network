# Kelen — User Project Dashboard
## Implementation Documentation v2

> **Destinataire :** Claude Code (frontend) + Curtis (backend Supabase)
> **Langue du code :** TypeScript / Next.js 14
> **Langue des labels UI :** Français
> **Dernière mise à jour :** Mars 2026

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Schéma de base de données](#2-schéma-de-base-de-données)
3. [Row Level Security (RLS)](#3-row-level-security-rls)
4. [SQL Functions & Triggers](#4-sql-functions--triggers)
5. [Types TypeScript](#5-types-typescript)
6. [Routes & Pages Next.js](#6-routes--pages-nextjs)
7. [Composants UI](#7-composants-ui)
8. [Logique métier](#8-logique-métier)
9. [Règles de rendu & états](#9-règles-de-rendu--états)
10. [Annexe — Tâches d'implémentation](#10-annexe--tâches-dimplémentation)

---

## 1. Vue d'ensemble

### Ce que c'est

Le **dashboard projet** est un espace privé pour chaque utilisateur client. Il permet de :

- Créer et gérer un nombre illimité de projets
- Définir un budget global, enregistrer des versements, suivre le reste à payer
- Fixer des jalons (objectifs) et leur état d'avancement
- Associer des professionnels au projet — qu'ils soient sur Kelen ou non
- Retrouver rapidement les pros favoris depuis une liste personnelle
- Voir le top 3 des projets documentés de chaque pro Kelen associé

### Ce que ce n'est PAS

- Pas un outil de suivi de projet en temps réel
- Pas une messagerie entre client et pro
- Pas une plateforme de paiement (les versements sont des notes privées, pas des transactions)
- Pas visible par les professionnels — espace strictement privé client

### Principe Kelen

> Le dashboard projet ne génère pas de confiance — il organise la recherche de confiance.
> Les professionnels hors-plateforme peuvent être notés, mais ne bénéficient d'aucun statut Kelen.

---

## 2. Schéma de base de données

### 2.1 Table `user_projects`

```sql
CREATE TABLE user_projects (
  -- Identité
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Description
  title            TEXT NOT NULL,
  description      TEXT,
  category         TEXT CHECK (category IN (
    'construction', 'renovation', 'immobilier', 'amenagement', 'autre'
  )),
  location         TEXT,                     -- "Abidjan, Côte d'Ivoire"

  -- Budget
  budget_total     NUMERIC(14, 2),           -- Budget global prévu
  budget_currency  TEXT DEFAULT 'EUR' CHECK (budget_currency IN ('EUR', 'XOF', 'USD')),

  -- Calendrier
  start_date       DATE,
  end_date         DATE,

  -- Statut
  status           TEXT DEFAULT 'en_preparation' CHECK (status IN (
    'en_preparation',
    'en_cours',
    'en_pause',
    'termine',
    'annule'
  )),

  -- Jalons (JSONB pour flexibilité sans table séparée)
  objectives       JSONB DEFAULT '[]'::jsonb,
  -- Format: [{ "id": "uuid", "label": "Fondations coulées", "done": false }]

  -- Métadonnées
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_projects_user   ON user_projects(user_id, created_at DESC);
CREATE INDEX idx_user_projects_status ON user_projects(user_id, status);
```

---

### 2.2 Table `project_professionals`

Liaison entre un projet et un professionnel. Deux types possibles :
- **Pro Kelen** : `is_external = FALSE`, `professional_id` renseigné
- **Pro hors-plateforme** : `is_external = TRUE`, `professional_id` NULL, données saisies en `external_*`

```sql
CREATE TABLE project_professionals (
  -- Identité
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id        UUID NOT NULL REFERENCES user_projects(id) ON DELETE CASCADE,

  -- Type de pro
  is_external       BOOLEAN NOT NULL DEFAULT FALSE,
  professional_id   UUID REFERENCES professionals(id) ON DELETE SET NULL,
  -- NULL si is_external = TRUE

  -- Données pro externe (ignorées si is_external = FALSE)
  external_name     TEXT,
  external_phone    TEXT,            -- Téléphone / WhatsApp
  external_category TEXT CHECK (external_category IN (
    'construction', 'renovation', 'immobilier', 'amenagement', 'autre', NULL
  )),
  external_location TEXT,

  -- Rôle dans le projet
  role              TEXT DEFAULT 'contact' CHECK (role IN (
    'contact',   -- À contacter / en discussion
    'liked',     -- Shortlisté / favori
    'picked'     -- Retenu pour ce projet
  )),

  -- Note privée client (non visible par le pro)
  private_note      TEXT,

  -- Snapshot du profil Kelen au moment de l'ajout
  pro_snapshot      JSONB,
  -- Format: { "name", "category", "status", "slug", "city", "country", "avatar_url" }
  -- NULL pour les pros externes

  -- Métadonnées
  added_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),

  -- Contraintes d'intégrité
  CONSTRAINT unique_kelen_pro_per_project
    UNIQUE NULLS NOT DISTINCT (project_id, professional_id),

  CONSTRAINT external_requires_name
    CHECK (is_external = FALSE OR external_name IS NOT NULL),

  CONSTRAINT kelen_pro_requires_id
    CHECK (is_external = TRUE OR professional_id IS NOT NULL)
);

CREATE INDEX idx_project_professionals_project  ON project_professionals(project_id);
CREATE INDEX idx_project_professionals_pro      ON project_professionals(professional_id);
CREATE INDEX idx_project_professionals_role     ON project_professionals(project_id, role);
CREATE INDEX idx_project_professionals_external ON project_professionals(project_id, is_external);
```

---

### 2.3 Table `project_payments`

Versements enregistrés pour un projet. Chaque versement est optionnellement lié à un pro du projet.

```sql
CREATE TABLE project_payments (
  -- Identité
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id              UUID NOT NULL REFERENCES user_projects(id) ON DELETE CASCADE,

  -- Destinataire (optionnel — NULL = versement global, ex: frais de notaire)
  project_professional_id UUID REFERENCES project_professionals(id) ON DELETE SET NULL,

  -- Données du versement
  label                   TEXT NOT NULL,       -- "Acompte gros œuvre", "Solde architecte"
  amount                  NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  currency                TEXT NOT NULL CHECK (currency IN ('EUR', 'XOF', 'USD')),
  paid_at                 DATE NOT NULL,
  payment_method          TEXT CHECK (payment_method IN (
    'virement', 'especes', 'wave', 'orange_money', 'autre', NULL
  )),
  notes                   TEXT,

  -- Métadonnées
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_project_payments_project ON project_payments(project_id, paid_at DESC);
CREATE INDEX idx_project_payments_pro     ON project_payments(project_professional_id);
```

---

### 2.4 Vue `project_budget_summary`

Vue calculée pour le résumé financier. Agrège les versements dans la même devise que le projet.

```sql
CREATE OR REPLACE VIEW project_budget_summary AS
SELECT
  p.id                  AS project_id,
  p.budget_total,
  p.budget_currency,

  -- Total versé (même devise que le projet uniquement)
  COALESCE(SUM(
    CASE WHEN pp.currency = p.budget_currency THEN pp.amount ELSE 0 END
  ), 0)                 AS total_paid,

  -- Reste à payer (NULL si budget non défini)
  CASE
    WHEN p.budget_total IS NOT NULL THEN
      GREATEST(0, p.budget_total - COALESCE(SUM(
        CASE WHEN pp.currency = p.budget_currency THEN pp.amount ELSE 0 END
      ), 0))
    ELSE NULL
  END                   AS remaining,

  -- Nombre total de versements
  COUNT(pp.id)          AS payment_count,

  -- Indicateur devise mixte
  BOOL_OR(pp.currency IS DISTINCT FROM p.budget_currency AND pp.currency IS NOT NULL)
                        AS has_mixed_currencies

FROM user_projects p
LEFT JOIN project_payments pp ON pp.project_id = p.id
GROUP BY p.id;
```

> **Règle devise mixte :** Un versement en XOF sur un projet en EUR n'est pas comptabilisé dans `total_paid`. Le frontend affiche un avertissement si `has_mixed_currencies = true`.

---

### 2.5 Table `user_favorites`

Liste des pros Kelen mis en favori par un utilisateur, indépendamment de tout projet.

```sql
CREATE TABLE user_favorites (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  professional_id  UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  added_at         TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (user_id, professional_id)
);

CREATE INDEX idx_user_favorites_user ON user_favorites(user_id, added_at DESC);
```

---

### 2.6 Vue `professional_top_projects`

Top 3 projets vérifiés par professionnel, pour affichage dans le dashboard client.

```sql
CREATE OR REPLACE VIEW professional_top_projects AS
SELECT
  r.professional_id,
  r.id              AS recommendation_id,
  r.project_title,
  r.project_amount,
  r.project_date,
  r.project_photos,
  r.created_at,
  ROW_NUMBER() OVER (
    PARTITION BY r.professional_id
    ORDER BY r.project_amount DESC NULLS LAST, r.created_at DESC
  ) AS rank
FROM recommendations r
WHERE r.verified = TRUE
  AND r.linked   = TRUE;
```

> **Tri :** Projets par montant décroissant (met en avant la capacité à gérer des projets importants), puis par date.

---

## 3. Row Level Security (RLS)

### `user_projects`

```sql
ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_projects_all"
  ON user_projects FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admin_projects_all"
  ON user_projects FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
```

### `project_professionals`

```sql
ALTER TABLE project_professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_project_professionals_all"
  ON project_professionals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_projects
      WHERE id = project_professionals.project_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_projects
      WHERE id = project_id AND user_id = auth.uid()
    )
  );
```

### `project_payments`

```sql
ALTER TABLE project_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_project_payments_all"
  ON project_payments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_projects
      WHERE id = project_payments.project_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_projects
      WHERE id = project_id AND user_id = auth.uid()
    )
  );
```

### `user_favorites`

```sql
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_favorites_all"
  ON user_favorites FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## 4. SQL Functions & Triggers

### 4.1 Triggers `set_updated_at`

```sql
-- Réutilise la fonction set_updated_at() existante dans le projet
CREATE TRIGGER set_updated_at_user_projects
  BEFORE UPDATE ON user_projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_project_professionals
  BEFORE UPDATE ON project_professionals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_project_payments
  BEFORE UPDATE ON project_payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

---

### 4.2 Function + Trigger `snapshot_professional_on_add`

Capture les données publiques d'un pro Kelen au moment de l'ajout à un projet. Garantit l'affichage même si le pro devient inactif ultérieurement.

```sql
CREATE OR REPLACE FUNCTION snapshot_professional_on_add()
RETURNS TRIGGER AS $$
DECLARE
  pro_data JSONB;
BEGIN
  IF NEW.is_external = FALSE AND NEW.professional_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'name',       full_name,
      'category',   category,
      'status',     status,
      'slug',       slug,
      'city',       city,
      'country',    country,
      'avatar_url', avatar_url
    )
    INTO pro_data
    FROM professionals
    WHERE id = NEW.professional_id;

    NEW.pro_snapshot := pro_data;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER snapshot_pro_on_add
  BEFORE INSERT ON project_professionals
  FOR EACH ROW EXECUTE FUNCTION snapshot_professional_on_add();
```

---

## 5. Types TypeScript

Fichier : `src/types/projects.ts`

```typescript
// ─── Enums ───────────────────────────────────────────────────────────────────

export type ProjectStatus =
  | 'en_preparation'
  | 'en_cours'
  | 'en_pause'
  | 'termine'
  | 'annule';

export type ProjectCategory =
  | 'construction'
  | 'renovation'
  | 'immobilier'
  | 'amenagement'
  | 'autre';

export type ProjectCurrency = 'EUR' | 'XOF' | 'USD';

export type ProRole = 'contact' | 'liked' | 'picked';

export type KelenoStatus = 'gold' | 'silver' | 'white' | 'red' | 'black';

export type PaymentMethod =
  | 'virement'
  | 'especes'
  | 'wave'
  | 'orange_money'
  | 'autre';

// ─── Jalon ───────────────────────────────────────────────────────────────────

export interface ProjectObjective {
  id: string;
  label: string;
  done: boolean;
}

// ─── Snapshot pro Kelen (cache) ──────────────────────────────────────────────

export interface ProfessionalSnapshot {
  name: string;
  category: string;
  status: KelenoStatus;
  slug: string;
  city: string | null;
  country: string | null;
  avatar_url: string | null;
}

// ─── Top projets d'un pro Kelen ──────────────────────────────────────────────

export interface ProTopProject {
  recommendation_id: string;
  project_title: string | null;
  project_amount: number | null;
  project_date: string | null;
  project_photos: string[] | null;
  rank: number;
}

// ─── Versement ───────────────────────────────────────────────────────────────

export interface ProjectPayment {
  id: string;
  project_id: string;
  project_professional_id: string | null;
  label: string;
  amount: number;
  currency: ProjectCurrency;
  paid_at: string;               // ISO date YYYY-MM-DD
  payment_method: PaymentMethod | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentFormData {
  label: string;
  amount: number;
  currency: ProjectCurrency;
  paid_at: string;
  project_professional_id?: string;
  payment_method?: PaymentMethod;
  notes?: string;
}

// ─── Résumé budget ───────────────────────────────────────────────────────────

export interface ProjectBudgetSummary {
  project_id: string;
  budget_total: number | null;
  budget_currency: ProjectCurrency;
  total_paid: number;
  remaining: number | null;
  payment_count: number;
  has_mixed_currencies: boolean;
}

// ─── Pro Kelen associé à un projet ──────────────────────────────────────────

export interface ProjectProfessionalKelen {
  id: string;
  project_id: string;
  is_external: false;
  professional_id: string;
  role: ProRole;
  private_note: string | null;
  pro_snapshot: ProfessionalSnapshot;
  added_at: string;
  updated_at: string;
  // Enrichi côté client
  top_projects?: ProTopProject[];
  live_status?: KelenoStatus;        // Statut actuel (peut différer du snapshot)
  profile_url?: string;              // `/pros/${slug}`
}

// ─── Pro externe associé à un projet ────────────────────────────────────────

export interface ProjectProfessionalExternal {
  id: string;
  project_id: string;
  is_external: true;
  professional_id: null;
  external_name: string;
  external_phone: string | null;
  external_category: ProjectCategory | null;
  external_location: string | null;
  role: ProRole;
  private_note: string | null;
  pro_snapshot: null;
  added_at: string;
  updated_at: string;
}

export type ProjectProfessional =
  | ProjectProfessionalKelen
  | ProjectProfessionalExternal;

// ─── Formulaires d'ajout de pro ──────────────────────────────────────────────

export interface AddProfessionalKelen {
  is_external: false;
  professional_id: string;
  role: ProRole;
  private_note?: string;
}

export interface AddProfessionalExternal {
  is_external: true;
  external_name: string;
  external_phone?: string;
  external_category?: ProjectCategory;
  external_location?: string;
  role: ProRole;
  private_note?: string;
}

export type AddProfessionalFormData =
  | AddProfessionalKelen
  | AddProfessionalExternal;

// ─── Favori ──────────────────────────────────────────────────────────────────

export interface UserFavorite {
  id: string;
  user_id: string;
  professional_id: string;
  added_at: string;
  professional?: {
    full_name: string;
    category: string;
    status: KelenoStatus;
    slug: string;
    city: string | null;
    avatar_url: string | null;
  };
}

// ─── Projet ──────────────────────────────────────────────────────────────────

export interface UserProject {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: ProjectCategory | null;
  location: string | null;
  budget_total: number | null;
  budget_currency: ProjectCurrency;
  start_date: string | null;
  end_date: string | null;
  status: ProjectStatus;
  objectives: ProjectObjective[];
  created_at: string;
  updated_at: string;
  // Enrichissement
  professionals?: ProjectProfessional[];
  payments?: ProjectPayment[];
  budget_summary?: ProjectBudgetSummary;
}

// ─── Formulaire création / édition ───────────────────────────────────────────

export interface ProjectFormData {
  title: string;
  description?: string;
  category?: ProjectCategory;
  location?: string;
  budget_total?: number;
  budget_currency: ProjectCurrency;
  start_date?: string;
  end_date?: string;
  status: ProjectStatus;
  objectives: ProjectObjective[];
}
```

---

## 6. Routes & Pages Next.js

### Structure

```
app/
  (protected)/
    dashboard/
      page.tsx                              ← Liste des projets
      favoris/
        page.tsx                            ← Mes pros favoris
      projets/
        nouveau/
          page.tsx                          ← Formulaire création
        [projectId]/
          page.tsx                          ← Détail projet
          modifier/
            page.tsx                        ← Formulaire édition
          versements/
            page.tsx                        ← Historique complet
```

---

### 6.1 `/dashboard` — Liste des projets

**Type :** Server Component

```typescript
const { data: projects } = await supabase
  .from('user_projects')
  .select(`
    id, title, category, status, location,
    budget_total, budget_currency, start_date, end_date, objectives,
    project_professionals (
      id, is_external, role, pro_snapshot,
      external_name, external_category
    )
  `)
  .eq('user_id', userId)
  .order('created_at', { ascending: false });

const { data: summaries } = await supabase
  .from('project_budget_summary')
  .select('project_id, total_paid, remaining, budget_total, budget_currency')
  .in('project_id', projects.map(p => p.id));
```

**Rendu :**
- 0 projets → état vide + CTA "Créer mon premier projet"
- N projets → grille de `<ProjectCard />`

---

### 6.2 `/dashboard/projets/[projectId]` — Détail

**Type :** Server Component + Client Components pour interactions

```typescript
// Projet complet
const { data: project } = await supabase
  .from('user_projects')
  .select('*, project_professionals (*)')
  .eq('id', projectId)
  .eq('user_id', userId)
  .single();

// Budget summary
const { data: budgetSummary } = await supabase
  .from('project_budget_summary')
  .select('*')
  .eq('project_id', projectId)
  .single();

// Top 3 projets des pros Kelen
const kelenProIds = project.project_professionals
  .filter(p => !p.is_external)
  .map(p => p.professional_id);

const { data: topProjects } = await supabase
  .from('professional_top_projects')
  .select('*')
  .in('professional_id', kelenProIds)
  .lte('rank', 3);

// Statut live des pros Kelen
const { data: liveStatuses } = await supabase
  .from('professionals')
  .select('id, status')
  .in('id', kelenProIds);

// 5 derniers versements
const { data: recentPayments } = await supabase
  .from('project_payments')
  .select('*')
  .eq('project_id', projectId)
  .order('paid_at', { ascending: false })
  .limit(5);
```

**Layout de la page :**

```
┌─────────────────────────────────────────────────────┐
│  ← Mes projets                                       │
│  [Titre du projet]                    [Modifier]     │
│  Construction · Abidjan · 🟡 En cours                │
├──────────────────────────────────────────────────────┤
│  BUDGET                                              │
│  ┌────────────────────────────────────────────┐     │
│  │  Prévu       Versé        Reste à payer    │     │
│  │  €65 000     €28 500      €36 500          │     │
│  │  ██████████████░░░░░░░░░░░░░░░░  (44%)     │     │
│  │  [+ Enregistrer un versement]              │     │
│  │  Voir tous les versements (3) →            │     │
│  └────────────────────────────────────────────┘     │
├──────────────────────────────────────────────────────┤
│  CALENDRIER   Jan 2025 → Déc 2025                    │
├──────────────────────────────────────────────────────┤
│  DESCRIPTION  [texte libre]                          │
├──────────────────────────────────────────────────────┤
│  JALONS                          2/4 complétés       │
│  ☑ Architecte sélectionné                            │
│  ☑ Permis de construire obtenu                       │
│  ☐ Gros œuvre lancé                                  │
│  ☐ Second œuvre terminé                              │
│  [+ Ajouter un jalon]                                │
├──────────────────────────────────────────────────────┤
│  PROFESSIONNELS            [Tous][Retenus][+ Ajouter]│
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ 🏅 Gold  Kouadio Architecture   [Retenu ✓]   │   │
│  │    Architecte · Abidjan                      │   │
│  │    "Très réactif sur WhatsApp"               │   │
│  │    ▸ Projets vérifiés sur Kelen              │   │
│  │      Villa 5p Cocody ·········· €38 000      │   │
│  │      Immeuble R+2 Yopougon ···· €95 000      │   │
│  │      Rénovation bureaux ········ €12 000      │   │
│  │    [Voir profil Kelen →]          [···]      │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ (Ext.) Traoré & Fils BTP        [Contact]    │   │
│  │    Construction · Bouaké                     │   │
│  │    📱 +225 07 12 34 56                       │   │
│  │    "Recommandé par oncle Ibrahim"    [···]   │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

### 6.3 `/dashboard/projets/[projectId]/versements`

**Type :** Server Component

```typescript
const { data: payments } = await supabase
  .from('project_payments')
  .select(`
    *,
    project_professionals (
      is_external, pro_snapshot, external_name
    )
  `)
  .eq('project_id', projectId)
  .order('paid_at', { ascending: false });
```

Tableau chronologique complet avec filtre par professionnel et total en bas de page.

---

### 6.4 `/dashboard/favoris`

**Type :** Server Component

```typescript
const { data: favorites } = await supabase
  .from('user_favorites')
  .select(`
    id, added_at,
    professionals (
      id, full_name, category, status, slug, city, avatar_url
    )
  `)
  .eq('user_id', userId)
  .order('added_at', { ascending: false });
```

Bouton "Ajouter à un projet" par favori → ouvre une sélection de projet puis pré-remplit `<AddProfessionalModal />` avec ce pro.

---

## 7. Composants UI

### 7.1 `<ProjectCard />`

```typescript
interface ProjectCardProps {
  project: Pick<UserProject,
    'id' | 'title' | 'category' | 'status' | 'location' |
    'budget_total' | 'budget_currency' | 'objectives'
  > & {
    professionals: Array<{
      role: ProRole;
      is_external: boolean;
      pro_snapshot: ProfessionalSnapshot | null;
      external_name: string | null;
    }>;
    budget_summary?: Pick<ProjectBudgetSummary, 'total_paid' | 'remaining'>;
  };
}
```

**Affiche :**
- Titre (lien vers détail)
- Badge statut coloré
- Catégorie + localisation
- Budget : `€65 000 prévu · €28 500 versé`
- Jalons : `2/4 complétés` (barre de progression)
- Avatars des 3 premiers pros, `+N` si plus

**Couleurs statut :**
```
en_preparation → #9CA3AF (gris)
en_cours       → #B8860B (or Kelen)
en_pause       → #F97316 (orange)
termine        → #16A34A (vert)
annule         → #EF4444 atténué
```

---

### 7.2 `<BudgetPanel />`

```typescript
interface BudgetPanelProps {
  summary: ProjectBudgetSummary;
  recentPayments: ProjectPayment[];
  professionals: ProjectProfessional[];
  projectId: string;
  onAddPayment: (data: PaymentFormData) => Promise<void>;
}
```

**Affiche :**
- 3 blocs : Prévu / Versé / Reste à payer
- Barre de progression proportionnelle
- Avertissement si `has_mixed_currencies = true`
- 5 derniers versements : date | libellé | pro destinataire | montant
- CTA "+ Enregistrer un versement" → `<AddPaymentModal />`
- Lien "Voir tous les versements →" si `payment_count > 5`
- Si `budget_total = null` : afficher uniquement "Total versé : €X"

---

### 7.3 `<AddPaymentModal />`

**Champs :**

| Champ | Type | Requis | Notes |
|---|---|---|---|
| `label` | text | ✅ | "Acompte gros œuvre" |
| `amount` | number | ✅ | > 0 |
| `currency` | select | ✅ | Préselectionné = devise du projet |
| `paid_at` | date | ✅ | Date effective du versement |
| `project_professional_id` | select | ❌ | Liste des pros du projet + "Non lié à un pro" |
| `payment_method` | select | ❌ | Virement / Espèces / Wave / Orange Money / Autre |
| `notes` | textarea | ❌ | |

**Validation Zod :**
```typescript
export const paymentSchema = z.object({
  label: z.string().min(1).max(200),
  amount: z.number().positive(),
  currency: z.enum(['EUR', 'XOF', 'USD']),
  paid_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  project_professional_id: z.string().uuid().optional(),
  payment_method: z.enum(['virement', 'especes', 'wave', 'orange_money', 'autre']).optional(),
  notes: z.string().max(500).optional()
});
```

---

### 7.4 `<AddProfessionalModal />`

**Trois onglets :**

**① Recherche Kelen**
```typescript
// Fetch live au keystroke (debounce 300ms)
const { data } = await supabase
  .from('professionals')
  .select('id, full_name, category, status, slug, city, avatar_url')
  .ilike('full_name', `%${query}%`)
  .eq('is_active', true)
  .order('status')   // gold → silver → white
  .limit(10);
```
- Pro déjà dans le projet → désactivé, badge "Déjà ajouté"

**② Mes favoris**
- Même rendu que les résultats de recherche
- Chargé une fois à l'ouverture de la modal

**③ Pro hors-plateforme**
- Champs : Nom* | Téléphone/WhatsApp | Catégorie | Localisation
- Saisie directe, pas de recherche

**Étape 2 (commune)** — Rôle + Note privée → Bouton "Ajouter au projet"

---

### 7.5 `<ProjectProfessionalCard />`

```typescript
interface ProjectProfessionalCardProps {
  projectPro: ProjectProfessional;
  topProjects?: ProTopProject[];
  onRoleChange: (id: string, role: ProRole) => Promise<void>;
  onNoteChange: (id: string, note: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}
```

**Pro Kelen :**
- Avatar + nom (snapshot)
- Badge statut **live** (depuis `live_status`)
- Badge rôle cliquable → PATCH
- Note privée éditable inline
- Section dépliable "Projets vérifiés sur Kelen" → jusqu'à 3 lignes
- Lien "Voir profil Kelen →" (nouvel onglet)
- Menu `···` → Retirer du projet

**Pro externe :**
- Icône générique + nom saisi
- Badge "Hors Kelen" gris
- Badge rôle cliquable
- Téléphone si renseigné : lien `tel:` + `https://wa.me/`
- Catégorie et localisation si renseignées
- Note privée éditable inline
- Menu `···` → Modifier les infos / Retirer du projet

**Alertes statut critique :**
- `red` → bandeau orange : "⚠ Ce professionnel a reçu un signalement sur Kelen."
- `black` → bandeau rouge : "🚫 Ce professionnel est disqualifié de la plateforme."

---

### 7.6 `<ObjectivesManager />`

État entièrement local, sauvegarde explicite via bouton.

```typescript
// PATCH à la sauvegarde
await supabase
  .from('user_projects')
  .update({ objectives })
  .eq('id', projectId);
```

- Checkbox par jalon → toggle `done`
- Input inline pour ajouter un jalon
- Icône `×` pour supprimer
- Indicateur `N/Total complétés`
- Bouton "Enregistrer" (apparaît uniquement si des changements ont été faits)

---

## 8. Logique métier

### 8.1 Pros hors-plateforme

- Stockés dans `project_professionals` avec `is_external = TRUE`
- Modifiables après ajout (nom, téléphone, catégorie, localisation)
- Pas de contrainte d'unicité entre projets différents
- Pas de snapshot, pas de statut, pas de top projets
- L'utilisateur peut les inviter à rejoindre Kelen (futur — hors scope MVP)

### 8.2 Favoris

- `user_favorites` est indépendant des projets
- Le bouton ♡ sur les profils publics Kelen alimente cette table
- Depuis `/dashboard/favoris`, bouton "Ajouter à un projet" → raccourci vers `<AddProfessionalModal />` pré-rempli
- Retirer un favori n'affecte aucun projet existant

### 8.3 Budget et versements

- Budget global : champ optionnel, privé, purement informatif
- Versements : notes privées, pas de transactions réelles
- Un versement peut être lié à un pro du projet ou être global (frais notaire, taxes, etc.)
- Devise mixte : pas de conversion automatique, avertissement visuel uniquement
- `remaining` ne peut jamais être affiché négatif (GREATEST(0, …))

### 8.4 Rôles des pros dans un projet

| Règle | Détail |
|---|---|
| Plusieurs `picked` autorisés | Un projet peut retenir un architecte + un entrepreneur + un électricien |
| Pas d'exclusivité | Changer un pro en `picked` n'affecte pas les autres |
| Rôle par défaut à l'ajout | `contact` |
| Changement de rôle | PATCH immédiat sur `project_professionals.role` |

### 8.5 Statut live vs snapshot

| Donnée | Source | Raison |
|---|---|---|
| Nom, catégorie, ville, avatar | `pro_snapshot` | Stable si le pro se désactive |
| **Statut Kelen** | `professionals.status` (live) | **Doit refléter la réalité en temps réel** |
| Slug (lien profil) | `pro_snapshot.slug` | Stable |

---

## 9. Règles de rendu & états

### Badges statut pro dans le dashboard

| Statut | Badge | Alerte |
|---|---|---|
| `gold` | ★ Or | — |
| `silver` | ◆ Argent | — |
| `white` | ○ Non classifié | — |
| `red` | ⚠ Orange | Bandeau "Signalement en cours" |
| `black` | 🚫 Rouge | Bandeau "Professionnel disqualifié" |

### États vides

| Contexte | Message |
|---|---|
| Aucun projet | "Vous n'avez pas encore de projet. Créez votre premier projet pour organiser votre recherche de professionnels." |
| Aucun pro associé | "Aucun professionnel associé. Ajoutez des pros Kelen ou notez les contacts que vous avez déjà." |
| Pro Kelen sans projets vérifiés | "Ce professionnel n'a pas encore de projets vérifiés sur Kelen." |
| Aucun jalon | "Aucun jalon défini. Ajoutez les étapes clés de votre projet." |
| Aucun versement | "Aucun versement enregistré pour ce projet." |
| Favoris vides | "Vous n'avez pas encore de pros en favori. Explorez les professionnels Kelen et sauvegardez les plus intéressants." |

### Avertissement devise mixte

```
⚠ Certains versements sont en [XOF] et ne sont pas inclus dans le calcul
ci-dessus. Consultez le détail complet des versements pour voir tous les montants.
```

### Responsive / Mobile

La client consulte majoritairement sur mobile. Priorités :
- Cartes projets : liste verticale (une colonne)
- BudgetPanel : blocs empilés (Prévu → Versé → Reste)
- Cartes pros : scroll vertical
- Modals : bottom sheet sur mobile
- Formulaires : colonnes uniques

---

## 10. Bouton Favori sur les profils publics

### Contexte

La table `user_favorites` ne se remplit que si l'utilisateur peut mettre un pro en favori depuis son profil public `/pro/[slug]`. Ce bouton n'est pas dans le brief Claude Code existant — il doit être ajouté.

---

### 10.1 Comportement

- **Visible uniquement pour les utilisateurs connectés** (rôle `user`, pas `professional`)
- **Position :** Section Contact de la page profil, à côté ou en dessous des boutons d'appel/WhatsApp
- **État toggle :**
  - Non favori → icône ♡ vide, libellé "Sauvegarder"
  - Favori → icône ♥ plein (or Kelen `#B8860B`), libellé "Sauvegardé"
- **Action :**
  - Clic si non favori → `INSERT INTO user_favorites`
  - Clic si déjà favori → `DELETE FROM user_favorites`
- **Non connecté :** Le bouton n'apparaît pas. Aucun CTA de connexion à cet endroit — ne pas perturber la conversion pro.

---

### 10.2 Données à fetcher sur la page `/pro/[slug]`

La page profil est un Server Component. Pour afficher l'état initial du bouton, il faut savoir si l'utilisateur connecté a déjà ce pro en favori.

```typescript
// Dans le Server Component /pro/[slug]/page.tsx
// Après avoir fetché le profil professionnel (déjà existant)

const session = await getServerSession(); // ou supabase auth

let isFavorited = false;

if (session?.user) {
  const { data } = await supabase
    .from('user_favorites')
    .select('id')
    .eq('user_id', session.user.id)
    .eq('professional_id', professional.id)
    .maybeSingle();

  isFavorited = !!data;
}
```

---

### 10.3 Composant `<FavoriteButton />`

**Type :** Client Component (interactions optimistes)

```typescript
// src/components/FavoriteButton.tsx
'use client';

interface FavoriteButtonProps {
  professionalId: string;
  initialIsFavorited: boolean;
  isAuthenticated: boolean;
}
```

**Logique :**
```typescript
const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
const [isPending, setIsPending] = useState(false);

async function handleToggle() {
  if (!isAuthenticated) return; // ne devrait pas arriver (bouton masqué)
  
  // Mise à jour optimiste
  setIsFavorited(prev => !prev);
  setIsPending(true);

  try {
    if (isFavorited) {
      await supabase
        .from('user_favorites')
        .delete()
        .eq('professional_id', professionalId)
        .eq('user_id', currentUserId);
    } else {
      await supabase
        .from('user_favorites')
        .insert({ professional_id: professionalId, user_id: currentUserId });
    }
  } catch {
    // Rollback optimiste en cas d'erreur
    setIsFavorited(prev => !prev);
    toast.error('Une erreur est survenue.');
  } finally {
    setIsPending(false);
  }
}
```

**Rendu :**
```tsx
// Masqué si non connecté
if (!isAuthenticated) return null;

return (
  <button
    onClick={handleToggle}
    disabled={isPending}
    aria-label={isFavorited ? 'Retirer des favoris' : 'Sauvegarder ce professionnel'}
    className={cn(
      'flex items-center gap-2 px-4 py-2 rounded-full border transition-colors',
      isFavorited
        ? 'border-[#B8860B] text-[#B8860B] bg-[#B8860B]/5'
        : 'border-gray-300 text-gray-600 hover:border-[#B8860B] hover:text-[#B8860B]'
    )}
  >
    <Heart
      size={16}
      className={isFavorited ? 'fill-[#B8860B]' : ''}
    />
    <span className="text-sm">
      {isFavorited ? 'Sauvegardé' : 'Sauvegarder'}
    </span>
  </button>
);
```

---

### 10.4 Intégration dans `/pro/[slug]/page.tsx`

Dans la **Section Contact** existante (section 5.6 du brief Claude Code), ajouter `<FavoriteButton />` après les boutons de contact :

```tsx
// Dans la Section Contact
<div className="flex flex-col gap-3">
  {/* Boutons existants */}
  {pro.phone && <PhoneButton phone={pro.phone} />}
  {pro.whatsapp && <WhatsAppButton whatsapp={pro.whatsapp} />}
  {pro.email && <EmailButton email={pro.email} />}

  {/* Nouveau */}
  <FavoriteButton
    professionalId={pro.id}
    initialIsFavorited={isFavorited}
    isAuthenticated={!!session?.user}
  />
</div>
```

---

### 10.5 RLS — rappel

La table `user_favorites` est déjà couverte par la politique RLS définie en §3 :

```sql
CREATE POLICY "own_favorites_all"
  ON user_favorites FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

Un utilisateur ne peut voir, créer ou supprimer que ses propres favoris. Aucun pro ne peut voir qui l'a mis en favori.

---

## 11. Annexe — Tâches d'implémentation

### Backend — Curtis (Supabase)

| # | Tâche | Priorité |
|---|---|---|
| B1 | Créer table `user_projects` + index | P0 |
| B2 | Créer table `project_professionals` + contraintes + index | P0 |
| B3 | Créer table `project_payments` + index | P0 |
| B4 | Créer table `user_favorites` + index | P0 |
| B5 | Appliquer RLS sur les 4 tables | P0 |
| B6 | Créer triggers `set_updated_at` sur les 3 tables mutables | P0 |
| B7 | Créer fonction + trigger `snapshot_professional_on_add` | P0 |
| B8 | Créer vue `professional_top_projects` | P0 |
| B9 | Créer vue `project_budget_summary` | P0 |

### Frontend — Claude Code

| # | Tâche | Priorité | Fichier cible |
|---|---|---|---|
| F1 | Créer `src/types/projects.ts` | P0 | `src/types/projects.ts` |
| F2 | Page `/dashboard` — liste projets + `<ProjectCard />` | P0 | `app/(protected)/dashboard/page.tsx` |
| F3 | Page `/dashboard/projets/nouveau` + formulaire Zod | P0 | `app/(protected)/dashboard/projets/nouveau/page.tsx` |
| F4 | Page `/dashboard/projets/[projectId]` — détail | P0 | `app/(protected)/dashboard/projets/[projectId]/page.tsx` |
| F5 | Composant `<BudgetPanel />` | P0 | `src/components/dashboard/BudgetPanel.tsx` |
| F6 | Composant `<ProjectProfessionalCard />` (Kelen + externe) | P0 | `src/components/dashboard/ProjectProfessionalCard.tsx` |
| F7 | **Composant `<FavoriteButton />`** — bouton ♡ | P0 | `src/components/FavoriteButton.tsx` |
| F8 | **Modifier `/pro/[slug]/page.tsx`** — fetch `isFavorited` + intégrer `<FavoriteButton />` en Section Contact | P0 | `app/(public)/pro/[slug]/page.tsx` |
| F9 | Composant `<ObjectivesManager />` | P1 | `src/components/dashboard/ObjectivesManager.tsx` |
| F10 | Composant `<AddProfessionalModal />` (3 onglets) | P1 | `src/components/dashboard/AddProfessionalModal.tsx` |
| F11 | Composant `<AddPaymentModal />` | P1 | `src/components/dashboard/AddPaymentModal.tsx` |
| F12 | Page `/dashboard/projets/[projectId]/modifier` | P1 | `app/(protected)/dashboard/projets/[projectId]/modifier/page.tsx` |
| F13 | Page `/dashboard/projets/[projectId]/versements` | P1 | `app/(protected)/dashboard/projets/[projectId]/versements/page.tsx` |
| F14 | Page `/dashboard/favoris` | P2 | `app/(protected)/dashboard/favoris/page.tsx` |

---

*Document Kelen — kelen.com*
*"La confiance ne se promet pas. Elle se documente."*
