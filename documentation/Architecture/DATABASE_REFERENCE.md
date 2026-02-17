# Kelen — Database Reference (Frontend)

> **À qui s'adresse ce document :** au développeur frontend (Claude Code / Gemini).
> Il décrit les tables, leurs colonnes, les relations entre elles, et qui peut lire ou écrire quoi selon le rôle.
> Ce document ne contient pas de SQL de migration. Il ne décrit pas la logique métier — voir `STATUS_SYSTEM.md` pour les règles de calcul de statut.

---

## Rôles utilisateurs

Chaque utilisateur authentifié a un `role` stocké dans la table `users` :

| Rôle | Description |
|---|---|
| `user` | Membre de la diaspora. Peut soumettre des recommandations, signaux, et avis. |
| `professional` | Professionnel africain. A un profil dans `professionals`. |
| `admin` | Équipe Kelen. Accès complet à tout. |

Un utilisateur non authentifié (visiteur public) peut lire certaines données — les détails sont précisés table par table.

---

## Vue d'ensemble des tables

| Table | Rôle | Description courte |
|---|---|---|
| `users` | Tous | Comptes utilisateurs — miroir de Supabase Auth |
| `professionals` | `professional` | Profil public + métriques + crédit CPM |
| `recommendations` | `user` → `professional` | Projets vérifiés soumis par des clients |
| `signals` | `user` → `professional` | Signalements de manquements contractuels |
| `reviews` | `user` → `professional` | Notes 1–5 étoiles + commentaires libres |
| `review_history` | Système | Historique des modifications d'avis (admin seulement) |
| `credit_transactions` | Système → `professional` | Ledger financier immuable des mouvements de crédit |
| `profile_views` | Système → `professional` | Une ligne par vue de profil (analytics) |
| `profile_interactions` | Système → `professional` | Clics sur les boutons de contact (analytics) |
| `verification_queue` | Système → `admin` | File d'attente admin pour vérifier recommandations et signaux |

---

## Table : `users`

Créé automatiquement à l'inscription via Supabase Auth. L'`id` est identique au `auth.uid()`.

| Colonne | Type | Notes |
|---|---|---|
| `id` | UUID | Clé primaire. Identique à `auth.uid()` |
| `email` | TEXT | Unique. Non modifiable par l'utilisateur |
| `display_name` | TEXT | Nom affiché publiquement |
| `role` | TEXT | `user` / `professional` / `admin` |
| `country` | TEXT | Code ISO 3166-1 alpha-2 (ex: `FR`, `CI`, `SN`) |
| `phone` | TEXT | Optionnel |
| `email_notifications` | BOOLEAN | Préférence de notifications |
| `language` | TEXT | `fr` ou `en` |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | Mis à jour automatiquement |
| `last_login_at` | TIMESTAMPTZ | |

**Permissions :**

| Opération | Qui |
|---|---|
| SELECT sa propre ligne | Utilisateur authentifié (son propre `id`) |
| UPDATE sa propre ligne | Utilisateur authentifié — sauf `role`, `email`, `id` |
| SELECT toutes les lignes | `admin` |
| UPDATE `role` | `admin` uniquement |

---

## Table : `professionals`

Une ligne par professionnel. Existe même si le crédit est à zéro — la validation fonctionne toujours.

### Colonnes identité (non modifiables par le pro)

| Colonne | Type | Notes |
|---|---|---|
| `id` | UUID | Clé primaire |
| `user_id` | UUID | FK → `users.id`. Unique (1 pro par compte) |
| `slug` | TEXT | Unique. Généré automatiquement (ex: `kouadio-construction-abidjan`) |
| `owner_name` | TEXT | Nom du propriétaire — vérifié à l'inscription |
| `created_at` | TIMESTAMPTZ | Date d'inscription sur Kelen |

### Colonnes profil (modifiables par le pro)

| Colonne | Type | Notes |
|---|---|---|
| `business_name` | TEXT | Nom de l'entreprise |
| `category` | TEXT | Catégorie principale (ex: `construction`, `plomberie`) |
| `subcategories` | TEXT[] | Tableau de sous-catégories optionnelles |
| `country` | TEXT | Pays d'exercice |
| `city` | TEXT | Ville d'exercice |
| `address` | TEXT | Optionnel |
| `phone` | TEXT | Visible uniquement si `is_visible = TRUE` |
| `whatsapp` | TEXT | Optionnel. Visible uniquement si `is_visible = TRUE` |
| `email` | TEXT | Visible uniquement si `is_visible = TRUE` |
| `description` | TEXT | Description libre. Visible uniquement si `is_visible = TRUE` |
| `services_offered` | TEXT[] | Liste de services. Visible uniquement si `is_visible = TRUE` |
| `years_experience` | INTEGER | Optionnel |
| `team_size` | INTEGER | Optionnel |
| `portfolio_photos` | TEXT[] | URLs Storage. Visible uniquement si `is_visible = TRUE` |
| `portfolio_videos` | TEXT[] | URLs Storage. Visible uniquement si `is_visible = TRUE` |

### Colonnes statut (calculées automatiquement — ne jamais écrire)

| Colonne | Type | Notes |
|---|---|---|
| `status` | TEXT | `gold` / `silver` / `white` / `red` / `black` — calculé par trigger |
| `recommendation_count` | INTEGER | Nombre de recommandations vérifiées ET liées |
| `signal_count` | INTEGER | Nombre de signaux vérifiés |
| `avg_rating` | NUMERIC(3,2) | Moyenne des notes. `NULL` si aucun avis |
| `positive_review_pct` | NUMERIC(5,2) | % d'avis avec note ≥ 4. `NULL` si aucun avis |
| `review_count` | INTEGER | Nombre total d'avis visibles |

### Colonnes CPM (modifiables partiellement)

| Colonne | Type | Notes |
|---|---|---|
| `credit_balance` | NUMERIC(10,2) | Solde en EUR. Ne jamais écrire directement — géré par fonctions |
| `total_views` | INTEGER | Vues totales depuis la création |
| `monthly_view_cap` | INTEGER | Plafond mensuel. `NULL` = pas de plafond |
| `current_month_views` | INTEGER | Vues du mois en cours |
| `auto_reload_enabled` | BOOLEAN | Rechargement automatique activé |
| `auto_reload_amount` | NUMERIC(10,2) | Montant du rechargement auto |
| `auto_reload_threshold` | NUMERIC(10,2) | Seuil déclencheur du rechargement auto |

### Colonnes visibilité (lecture seule côté frontend)

| Colonne | Type | Notes |
|---|---|---|
| `is_visible` | BOOLEAN | **Colonne générée** — `TRUE` si `credit_balance > 0 AND is_active`. Ne jamais écrire |
| `is_active` | BOOLEAN | Mis à `FALSE` automatiquement quand le crédit tombe à 0 |
| `verified` | BOOLEAN | Document d'identité vérifié par l'admin |

**Permissions :**

| Opération | Qui | Restriction |
|---|---|---|
| SELECT si `status != 'black'` | Public (non authentifié) | Recherche browse uniquement |
| SELECT tous statuts par nom | Utilisateur authentifié | Recherche par nom exact |
| SELECT profil direct `/pro/[slug]` | Public | Tous statuts, y compris `black` |
| UPDATE colonnes profil | Pro (son propre profil) | Jamais `status`, `recommendation_count`, `signal_count`, `avg_rating`, `credit_balance`, `is_visible` |
| UPDATE paramètres CPM | Pro (son propre profil) | `auto_reload_enabled`, `auto_reload_amount`, `auto_reload_threshold`, `monthly_view_cap` |
| ALL | `admin` | |

---

## Table : `recommendations`

Soumises par des clients (`user`), réclamées par le professionnel (`linked`), vérifiées par l'admin.

### Colonnes soumission (écrites par le client à la création)

| Colonne | Type | Notes |
|---|---|---|
| `id` | UUID | Clé primaire |
| `professional_id` | UUID | FK → `professionals.id` |
| `professional_slug` | TEXT | Dénormalisé — copie du slug au moment de la soumission |
| `submitter_id` | UUID | FK → `users.id` |
| `submitter_name` | TEXT | Snapshot du nom au moment de la soumission |
| `submitter_country` | TEXT | Snapshot |
| `submitter_email` | TEXT | Snapshot |
| `project_type` | TEXT | Ex: `construction`, `rénovation`, `électricité` |
| `project_description` | TEXT | Description libre du projet |
| `completion_date` | DATE | Date de fin du projet |
| `budget_range` | TEXT | `0-10k` / `10k-25k` / `25k-50k` / `50k-100k` / `100k+` |
| `location` | TEXT | Ville / région du projet |
| `contract_url` | TEXT | URL Storage — obligatoire |
| `photo_urls` | TEXT[] | URLs Storage — obligatoire (au moins 1) |
| `before_photos` | TEXT[] | Optionnel |
| `after_photos` | TEXT[] | Optionnel |
| `created_at` | TIMESTAMPTZ | |

### Colonnes liaison (écrites par le professionnel)

| Colonne | Type | Notes |
|---|---|---|
| `linked` | BOOLEAN | Le pro reconnaît ce projet comme le sien |
| `linked_at` | TIMESTAMPTZ | |

### Colonnes vérification (écrites par l'admin uniquement)

| Colonne | Type | Notes |
|---|---|---|
| `status` | TEXT | `pending` / `verified` / `rejected` |
| `verified` | BOOLEAN | `TRUE` uniquement après vérification admin |
| `verified_at` | TIMESTAMPTZ | |
| `verified_by` | UUID | FK → `users.id` (admin) |
| `verification_notes` | TEXT | Notes internes admin |
| `rejection_reason` | TEXT | Visible au soumetteur si rejeté |

**Permissions :**

| Opération | Qui | Restriction |
|---|---|---|
| SELECT si `verified = TRUE` | Public | |
| SELECT ses propres soumissions | `user` (submitter) | Tous statuts (pending, rejected...) |
| INSERT | `user` authentifié | |
| UPDATE `linked` + `linked_at` | `professional` | Uniquement sur ses propres recommandations |
| UPDATE colonnes vérification | `admin` | |

---

## Table : `signals`

Signalements de manquements contractuels. Un signal vérifié = Liste Rouge minimum.

### Colonnes soumission (écrites par le client)

| Colonne | Type | Notes |
|---|---|---|
| `id` | UUID | Clé primaire |
| `professional_id` | UUID | FK → `professionals.id` |
| `professional_slug` | TEXT | Dénormalisé |
| `submitter_id` | UUID | FK → `users.id` |
| `submitter_name` | TEXT | Snapshot |
| `submitter_country` | TEXT | Snapshot |
| `submitter_email` | TEXT | Snapshot |
| `breach_type` | TEXT | `timeline` / `budget` / `quality` / `abandonment` / `fraud` |
| `breach_description` | TEXT | Description détaillée |
| `severity` | TEXT | `minor` / `major` / `critical` |
| `agreed_start_date` | DATE | |
| `agreed_end_date` | DATE | |
| `actual_start_date` | DATE | Optionnel |
| `actual_end_date` | DATE | Optionnel |
| `timeline_deviation` | TEXT | Explication textuelle de l'écart |
| `agreed_budget` | NUMERIC(10,2) | Optionnel |
| `actual_budget` | NUMERIC(10,2) | Optionnel |
| `budget_deviation` | TEXT | Explication textuelle de l'écart |
| `contract_url` | TEXT | URL Storage — obligatoire |
| `evidence_urls` | TEXT[] | URLs Storage — obligatoire |
| `communication_logs` | TEXT[] | URLs Storage — optionnel |
| `created_at` | TIMESTAMPTZ | |

### Colonnes réponse professionnel (écrites par le pro)

| Colonne | Type | Notes |
|---|---|---|
| `pro_response` | TEXT | Réponse textuelle du professionnel |
| `pro_evidence_urls` | TEXT[] | URLs Storage — contre-preuves |
| `pro_responded_at` | TIMESTAMPTZ | |

### Colonnes vérification (écrites par l'admin)

| Colonne | Type | Notes |
|---|---|---|
| `status` | TEXT | `pending` / `verified` / `rejected` / `disputed` |
| `verified` | BOOLEAN | `TRUE` uniquement après vérification admin |
| `verified_at` | TIMESTAMPTZ | |
| `verified_by` | UUID | FK → `users.id` (admin) |
| `verification_notes` | TEXT | |
| `rejection_reason` | TEXT | |

**Permissions :**

| Opération | Qui | Restriction |
|---|---|---|
| SELECT si `verified = TRUE` | Public | |
| SELECT ses propres soumissions | `user` (submitter) | Tous statuts |
| INSERT | `user` authentifié | |
| UPDATE `pro_response` + `pro_evidence_urls` + `pro_responded_at` | `professional` | Uniquement sur les signaux le concernant |
| UPDATE colonnes vérification | `admin` | |

---

## Table : `reviews`

Notes et commentaires libres. Un utilisateur = une seule note par professionnel, modifiable à vie.

| Colonne | Type | Notes |
|---|---|---|
| `id` | UUID | Clé primaire |
| `professional_id` | UUID | FK → `professionals.id` |
| `reviewer_id` | UUID | FK → `users.id`. Unique par `(professional_id, reviewer_id)` |
| `reviewer_name` | TEXT | Snapshot du nom au moment de la soumission |
| `reviewer_country` | TEXT | Snapshot |
| `rating` | INTEGER | 1 à 5 |
| `comment` | TEXT | Texte libre — optionnel |
| `is_hidden` | BOOLEAN | `FALSE` par défaut. Mis à `TRUE` par admin pour contenu illégal |
| `hidden_reason` | TEXT | Motif admin — non visible publiquement |
| `created_at` | TIMESTAMPTZ | Date de la première soumission |
| `updated_at` | TIMESTAMPTZ | Date de la dernière modification |

**Permissions :**

| Opération | Qui | Restriction |
|---|---|---|
| SELECT si `is_hidden = FALSE` | Public | |
| INSERT | `user` authentifié | Une seule note par `(professional_id, reviewer_id)` |
| UPDATE `rating` + `comment` | `user` (auteur) | Ne peut pas modifier `is_hidden` |
| UPDATE `is_hidden` + `hidden_reason` | `admin` | |
| DELETE | Personne | Aucune suppression autorisée |

---

## Table : `review_history`

Conserve les versions précédentes d'un avis à chaque modification. Usage admin uniquement.

| Colonne | Type | Notes |
|---|---|---|
| `id` | UUID | Clé primaire |
| `review_id` | UUID | FK → `reviews.id` |
| `previous_rating` | INTEGER | Valeur avant modification |
| `previous_comment` | TEXT | Valeur avant modification |
| `changed_at` | TIMESTAMPTZ | |

**Permissions :** `admin` uniquement — aucune lecture/écriture frontend.

---

## Table : `credit_transactions`

Ledger financier immuable. Chaque mouvement de crédit est enregistré ici. Aucune modification possible.

| Colonne | Type | Notes |
|---|---|---|
| `id` | UUID | Clé primaire |
| `professional_id` | UUID | FK → `professionals.id` |
| `type` | TEXT | `purchase` / `deduction` / `refund` / `adjustment` |
| `amount` | NUMERIC(10,2) | Positif (achat/remboursement) ou négatif (déduction) |
| `balance_after` | NUMERIC(10,2) | Snapshot du solde après cette transaction |
| `description` | TEXT | Ex: "Vue profil - recherche Paris" |
| `payment_method` | TEXT | `stripe` / `wave` / `orange_money` — NULL pour les déductions |
| `payment_id` | TEXT | Référence paiement externe Stripe/Wave |
| `currency` | TEXT | `EUR` ou `XOF` |
| `created_at` | TIMESTAMPTZ | |
| `ip_address` | INET | IP de l'opération |

**Permissions :**

| Opération | Qui |
|---|---|
| SELECT ses propres transactions | `professional` |
| SELECT toutes | `admin` |
| INSERT | Système uniquement (service role — jamais depuis le frontend) |
| UPDATE / DELETE | Personne |

---

## Table : `profile_views`

Une ligne insérée par le système à chaque visite d'un profil avec crédit actif. Immutable.

| Colonne | Type | Notes |
|---|---|---|
| `id` | UUID | Clé primaire |
| `professional_id` | UUID | FK → `professionals.id` |
| `viewer_ip_hash` | TEXT | SHA-256 de l'IP (RGPD) — jamais l'IP brute |
| `viewer_country` | TEXT | |
| `viewer_city` | TEXT | |
| `source` | TEXT | `search` / `browse` / `category` / `direct` |
| `search_query` | TEXT | Requête ayant mené au profil — optionnel |
| `referrer` | TEXT | URL référente — optionnel |
| `cost_deducted` | NUMERIC(10,4) | Montant déduit pour cette vue (défaut: 0.005 EUR) |
| `view_duration` | INTEGER | Secondes passées sur le profil — envoyé côté client |
| `created_at` | TIMESTAMPTZ | |

**Permissions :**

| Opération | Qui |
|---|---|
| SELECT ses propres vues | `professional` |
| SELECT toutes | `admin` |
| INSERT | Système uniquement |
| UPDATE / DELETE | Personne |

---

## Table : `profile_interactions`

Clics sur les boutons de contact. Alimente le funnel de conversion dans les analytics.

| Colonne | Type | Notes |
|---|---|---|
| `id` | UUID | Clé primaire |
| `professional_id` | UUID | FK → `professionals.id` |
| `type` | TEXT | `contact_click` / `phone_click` / `whatsapp_click` / `email_click` |
| `viewer_ip_hash` | TEXT | SHA-256 de l'IP |
| `viewer_country` | TEXT | |
| `created_at` | TIMESTAMPTZ | |

**Permissions :** identiques à `profile_views`.

---

## Table : `verification_queue`

Alimentée automatiquement à chaque soumission de recommandation ou signal. Workflow admin uniquement.

| Colonne | Type | Notes |
|---|---|---|
| `id` | UUID | Clé primaire |
| `item_type` | TEXT | `recommendation` ou `signal` |
| `item_id` | UUID | ID de la ligne dans `recommendations` ou `signals` |
| `professional_id` | UUID | FK → `professionals.id` |
| `status` | TEXT | `pending` / `in_review` / `completed` |
| `assigned_to` | UUID | FK → `users.id` (admin assigné) |
| `review_notes` | TEXT | Notes internes admin |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |
| `reviewed_at` | TIMESTAMPTZ | |

**Permissions :** `admin` uniquement pour toutes les opérations.

---

## Relations entre tables

```
users
 ├── professionals (1:1 via user_id)
 │    ├── recommendations (1:N via professional_id)
 │    ├── signals (1:N via professional_id)
 │    ├── reviews (1:N via professional_id)
 │    ├── credit_transactions (1:N via professional_id)
 │    ├── profile_views (1:N via professional_id)
 │    ├── profile_interactions (1:N via professional_id)
 │    └── verification_queue (1:N via professional_id)
 ├── recommendations (1:N via submitter_id)
 ├── signals (1:N via submitter_id)
 └── reviews (1:N via reviewer_id)
      └── review_history (1:N via review_id)
```

---

## Colonnes à ne jamais écrire depuis le frontend

Ces colonnes sont calculées ou gérées exclusivement par des fonctions backend / triggers. Toute tentative d'écriture directe sera bloquée par RLS.

| Table | Colonnes |
|---|---|
| `professionals` | `status`, `recommendation_count`, `signal_count`, `avg_rating`, `positive_review_pct`, `review_count`, `credit_balance`, `total_views`, `current_month_views`, `is_visible`, `is_active` |
| `recommendations` | `verified`, `verified_at`, `verified_by`, `verification_notes`, `rejection_reason` |
| `signals` | `verified`, `verified_at`, `verified_by`, `verification_notes`, `rejection_reason` |
| `reviews` | `is_hidden`, `hidden_reason` |
| `credit_transactions` | Toute la table (INSERT système uniquement) |
| `profile_views` | Toute la table (INSERT système uniquement) |
| `profile_interactions` | Toute la table (INSERT système uniquement) |
| `verification_queue` | Toute la table (INSERT système uniquement) |

---

## Buckets Storage

Les fichiers sont stockés dans Supabase Storage. Les URLs retournées sont utilisées directement dans les colonnes `TEXT` ou `TEXT[]` correspondantes.

| Bucket | Usage | Colonnes concernées |
|---|---|---|
| `contracts` | Contrats PDF | `recommendations.contract_url`, `signals.contract_url` |
| `evidence-photos` | Photos de preuve | `recommendations.photo_urls`, `signals.evidence_urls`, `signals.pro_evidence_urls` |
| `portfolios` | Photos/vidéos portfolio | `professionals.portfolio_photos`, `professionals.portfolio_videos` |
| `verification-docs` | Documents d'identité pro | `professionals.verification_documents` |
