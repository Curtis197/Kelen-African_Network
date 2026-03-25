# Kelen — Système de Statuts (Référence)

> Ce document définit les 5 niveaux de statut, leurs critères, la logique de calcul, et les implications sur la visibilité. Il fait autorité sur tous les autres documents en cas de conflit.

---

## Vue d'ensemble des 5 niveaux

| Statut | Emoji | Visibilité recherche | Niveau de confiance |
|---|---|---|---|
| Liste Or | 🟡 | ✅ Visible | Confiance absolue |
| Liste Argent | ⚪ | ✅ Visible | Professionnel sérieux |
| Liste Blanche | 🤍 | ✅ Visible | Neutre — rien à reprocher |
| Liste Rouge | 🔴 | ✅ Visible (avec alerte) | Signal documenté — prudence |
| Liste Noire | ⚫ | ❌ Invisible | Disqualification opérationnelle |

**Règle fondamentale :** Les signaux priment toujours sur les recommandations. Un professionnel avec 20 recommandations Or et 3 signaux est en Liste Noire.

---

## Critères détaillés

### 🟡 Liste Or — Confiance absolue

Le niveau le plus difficile à atteindre. Réservé aux professionnels dont le track record est documenté, solide, et time-tested.

**Critères requis (tous obligatoires) :**
- ≥ 5 recommandations vérifiées et liées
- Rating moyen ≥ 4,5 / 5
- ≥ 90% de commentaires positifs (notes ≥ 4)
- 0 signal vérifié
- *Ancienneté ≥ 3 ans sur la plateforme* — **critère optionnel, activé ultérieurement**

**Signification :** La diaspora peut engager ce professionnel pour des projets à 5 ou 6 chiffres sans hésitation. Chaque critère est rempli indépendamment.

**Sur le critère d'ancienneté (quand activé) :**
Un professionnel peut avoir 6 recommandations excellentes mais seulement 8 mois de présence. Il reste en Liste Argent jusqu'à atteindre 3 ans. L'ancienneté protège contre les profils récents qui n'ont pas encore eu le temps d'être signalés. Aucun statut intermédiaire n'est affiché — le professionnel est simplement en Argent, pas encore éligible à l'Or.

---

### ⚪ Liste Argent — Professionnel sérieux

Track record en construction. Suffisant pour des projets de taille moyenne ou pour commencer une collaboration.

**Critères requis (tous obligatoires) :**
- 1 à 4 recommandations vérifiées et liées (en dessous du seuil Or)
- Rating moyen ≥ 4,0 / 5
- ≥ 80% de commentaires positifs (notes ≥ 4)
- 0 signal vérifié
- *Ancienneté ≥ 1 an sur la plateforme* — **critère optionnel, activé ultérieurement**

**Signification :** Professionnel qui a commencé à prouver sa valeur. Pas encore le niveau de confiance absolue, mais un point de départ solide.

---

### 🤍 Liste Blanche — Neutre

Aucun historique sur Kelen. Ni preuve de fiabilité, ni signal. Point de départ de tout professionnel.

**Critères :**
- 0 recommandation vérifiée liée, OU recommandations présentes mais critères Argent non atteints (rating < 4, < 80% positifs)
- 0 signal vérifié

**Signification :** "Nous ne savons pas encore." Pas un signal négatif en soi — le professionnel n'a simplement pas encore de track record documenté sur la plateforme. Procéder avec les précautions habituelles.

---

### 🔴 Liste Rouge — Signal documenté

1 signal vérifié. Reste visible dans les recherches — la transparence totale est préférée à la disparition. Le signal est affiché publiquement avec tous ses détails.

**Critères :**
- 1 signal vérifié (et un seul)
- Peu importe le nombre de recommandations

**Visibilité :** Apparaît dans les résultats de recherche et de browsing, avec un badge d'alerte rouge prominent. La diaspora peut voir le profil complet et décider en connaissance de cause.

**Signification :** Un manquement contractuel documenté. Peut être un incident isolé. La réponse du professionnel est visible aux côtés du signal. La diaspora dispose de toutes les informations pour décider.

**Sur la réponse du professionnel :** Il peut soumettre une réponse et des contre-preuves. Cette réponse est publique. Elle ne retire pas le signal mais contextualise.

---

### ⚫ Liste Noire — Disqualification opérationnelle

3 signaux vérifiés ou plus. Pattern établi, pas un incident isolé. Disparaît des résultats de recherche et de browsing.

**Critères :**
- ≥ 3 signaux vérifiés

**Visibilité :**
- ❌ N'apparaît pas dans les résultats de recherche par browse/catégorie
- ✅ Le profil public `/pro/[slug]` reste accessible via lien direct
- Le profil affiche le statut Liste Noire avec tous les signaux visibles

**Pourquoi le profil reste accessible via lien direct :** Si quelqu'un a déjà le lien ou le nom exact, il doit pouvoir voir l'historique complet. La Liste Noire retire la *découvrabilité*, pas la *transparence*.

---

## Les deux couches de données

### Couche 1 — Validation rigide (détermine Or / Argent / Blanc)

| Donnée | Source | Vérification |
|---|---|---|
| Recommandations vérifiées | Soumission client avec contrat + photos | Admin review obligatoire |
| Signaux vérifiés | Soumission client avec contrat + preuves | Admin review obligatoire |
| Ancienneté | `professionals.created_at` | Automatique |

Ces données sont **permanentes et non modifiables** par le professionnel.

### Couche 2 — Rating classique (contribue aux critères %)

| Donnée | Source | Vérification |
|---|---|---|
| Note (1–5 étoiles) | N'importe quel utilisateur avec compte | Aucune |
| Commentaire texte libre | N'importe quel utilisateur avec compte | Modération contenu illégal uniquement |

Ces données sont **ouvertes et non vérifiées**. La crédibilité vient du volume, pas de la vérification individuelle. Un avis ne peut être retiré que pour contenu illégal (injures, diffamation caractérisée).

**Règles de soumission :**
- Un utilisateur = une seule note par professionnel
- La note est modifiable à vie (l'expérience peut évoluer — ex: résolution tardive d'un litige)
- La note ne peut pas être supprimée par l'auteur — seul le contenu est modifiable
- L'historique des modifications est conservé en base (table `review_history`) pour traçabilité admin

**Calcul du % de commentaires positifs :**
```
commentaires_positifs = COUNT(reviews WHERE rating >= 4)
total_commentaires = COUNT(reviews)
pourcentage = (commentaires_positifs / total_commentaires) * 100
```

**Calcul du rating moyen :**
```
rating_moyen = AVG(reviews.rating)
```

---

## Logique de calcul du statut — `compute_professional_status()`

```
ENTRÉE : professional_id

ÉTAPE 1 — Vérifier les signaux (priorité absolue)
  sig_count = COUNT(signals WHERE professional_id = id AND verified = TRUE)
  IF sig_count >= 3 → statut = 'black' → FIN
  IF sig_count = 1 OR sig_count = 2 → statut = 'red' → FIN

ÉTAPE 2 — Calculer les métriques positives
  rec_count = COUNT(recommendations WHERE professional_id = id AND verified = TRUE AND linked = TRUE)
  avg_rating = AVG(reviews.rating WHERE professional_id = id)
  pct_positive = COUNT(reviews WHERE rating >= 4) / COUNT(reviews) * 100
  -- Si aucun avis : avg_rating = NULL, pct_positive = NULL

ÉTAPE 3 — Appliquer les seuils (sans ancienneté, phase actuelle)

  TENTER Liste Or :
    IF rec_count >= 5
    AND (avg_rating IS NULL OR avg_rating >= 4.5)
    AND (pct_positive IS NULL OR pct_positive >= 90)
    → statut = 'gold'

  TENTER Liste Argent :
    IF rec_count >= 1
    AND (avg_rating IS NULL OR avg_rating >= 4.0)
    AND (pct_positive IS NULL OR pct_positive >= 80)
    → statut = 'silver'

  SINON → statut = 'white'

ÉTAPE 4 — Persister
  UPDATE professionals SET
    status = statut,
    recommendation_count = rec_count,
    signal_count = sig_count,
    avg_rating = avg_rating,
    positive_review_pct = pct_positive

SORTIE : nouveau statut
```

**Note sur les avis manquants :** Si un professionnel a 5 recommandations vérifiées mais 0 avis, le rating est NULL. Dans la phase actuelle, NULL ne bloque pas — le professionnel obtient Liste Or sur la base des recommandations seules. Quand la plateforme aura du volume d'avis, cette règle pourra être durcie.

---

## Évolution future — Activation de l'ancienneté

Prévue à l'échéance 3 ans de la plateforme. Une migration SQL activera le critère :

```sql
-- Phase future : ajouter l'ancienneté aux critères
-- Liste Or : created_at <= NOW() - INTERVAL '3 years'
-- Liste Argent : created_at <= NOW() - INTERVAL '1 year'
```

L'impact au moment de l'activation : certains professionnels actuellement en Liste Or rétrograderont temporairement en Argent. Ils seront notifiés à l'avance. Le critère protège la crédibilité de la Liste Or sur le long terme.

---

## Schéma — Nouvelles colonnes requises

### Table `professionals` — colonnes à ajouter

```sql
-- Métriques rating (calculées, jamais saisies manuellement)
avg_rating NUMERIC(3,2),           -- ex: 4.73
positive_review_pct NUMERIC(5,2),  -- ex: 91.50
review_count INTEGER DEFAULT 0,

-- Mise à jour du CHECK sur status
status TEXT NOT NULL DEFAULT 'white'
  CHECK (status IN ('gold', 'silver', 'white', 'red', 'black')),
```

### Nouvelle table `reviews`

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,

  -- Auteur
  reviewer_id UUID NOT NULL REFERENCES users(id),
  reviewer_name TEXT NOT NULL,       -- snapshot
  reviewer_country TEXT NOT NULL,    -- snapshot

  -- Contenu
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,                      -- texte libre, optionnel

  -- Modération
  is_hidden BOOLEAN DEFAULT FALSE,   -- masqué pour contenu illégal
  hidden_reason TEXT,                -- motif admin si masqué

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_reviews_professional ON reviews(professional_id);
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);

-- Un utilisateur = une note par professionnel (modifiable à vie)
CREATE UNIQUE INDEX idx_reviews_one_per_user
  ON reviews(professional_id, reviewer_id);

-- Historique des modifications d'avis (optionnel, pour transparence)
CREATE TABLE review_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  previous_rating INTEGER NOT NULL,
  previous_comment TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recalcul du statut après chaque avis
CREATE TRIGGER recompute_status_on_review
  AFTER INSERT OR UPDATE OF rating, is_hidden ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION compute_professional_status_for(NEW.professional_id);
```

---

## RLS — Table `reviews`

```sql
-- Public : voir tous les avis non masqués
CREATE POLICY "Public can read visible reviews"
  ON reviews FOR SELECT
  USING (is_hidden = FALSE);

-- Utilisateur authentifié : soumettre un avis
CREATE POLICY "Authenticated users can submit reviews"
  ON reviews FOR INSERT
  WITH CHECK (reviewer_id = auth.uid());

-- Auteur : modifier sa propre note à vie (rating + comment uniquement)
CREATE POLICY "Reviewer can update own review"
  ON reviews FOR UPDATE
  USING (reviewer_id = auth.uid())
  WITH CHECK (
    reviewer_id = auth.uid() AND
    is_hidden = OLD.is_hidden  -- ne peut pas se dé-masquer lui-même
  );

-- Note : pas de DELETE pour les auteurs — un avis est permanent,
-- seul le contenu est modifiable. La trace de l'avis reste.

-- Admin : masquer pour contenu illégal
CREATE POLICY "Admin can hide reviews"
  ON reviews FOR UPDATE
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
```

---

## Impact sur la visibilité Annuaire

Le statut n'affecte pas directement la visibilité de base (qui dépend uniquement de `subscription_status = 'active'`). Mais il affecte **l'attractivité** dans les résultats :

- Liste Noire : n'apparaît jamais dans le browse/search, même avec crédit
- Liste Rouge : apparaît avec badge d'alerte rouge (moins de clics attendus)
- Liste Blanche : apparaît normalement
- Liste Argent / Or : apparaît avec badge positif (plus de clics attendus)

La diaspora peut filtrer les résultats sur "Liste Or uniquement" ou "Liste Or et Argent".

---

## Résumé des triggers affectés

| Événement | Action |
|---|---|
| `recommendations` : `verified = TRUE` ou `linked` change | Appelle `compute_professional_status()` |
| `signals` : `verified = TRUE` | Appelle `compute_professional_status()` (peut déclencher rouge ou noir) |
| `reviews` : INSERT ou UPDATE `rating` ou `is_hidden` | Appelle `compute_professional_status()` |
| Activation future de l'ancienneté | Migration + recalcul batch de tous les statuts |
