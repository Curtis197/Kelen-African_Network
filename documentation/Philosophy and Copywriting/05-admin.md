# Kelen — Admin
*Copywriting complet — Version 2.0 — Mis à jour le 2026-04-25*

---

## Principes de l'espace admin

L'espace admin n'est pas public. Son copywriting est différent des pages utilisateur : plus direct, plus technique, orienté vers l'action et la traçabilité.

**Règles spécifiques à l'admin :**
- Pas de langage institutionnel — ici on dit les choses clairement
- Chaque action irréversible demande confirmation explicite
- Tout est journalisé — l'admin sait que ses actions sont enregistrées

---

## File d'attente — Vue d'ensemble

### En-tête

```
File de vérification

En attente : 12     En cours : 3     Traités aujourd'hui : 7

[Recommandations (12)]     [Tous (12)]
```

---

### Carte dans la file — Recommandation

```
✓ RECOMMANDATION
Construction résidentielle · Dakar
Professionnel : Diallo Bâtiment
Soumis le : 12 janvier 2026 · il y a 1 jour
Documents : 3 fichiers

[Examiner →]
```

---

### Filtres

```
Trier par : [Plus ancien d'abord ▼]     Assigné à : [Tous ▼]
```

---

## Écran de vérification — Recommandation

### En-tête

```
Recommandation — Examen
Soumis le 12 janvier 2026
[Assigné à moi]
```

---

### Informations déclarées

```
Professionnel : Diallo Bâtiment · Dakar
Soumetteur : M. D. · Dakar · m.d@example.com

Type de projet : Construction résidentielle
Localisation : Dakar, Sénégal
Budget déclaré : 45 000 €
Début du projet : mars 2023
Livraison convenue : novembre 2023
Livraison effective : novembre 2023

Note : 4,8 / 5

Témoignage :
"Projet livré dans les délais. Bonne communication."
```

---

### Documents

```
[Voir le contrat]        [Photos avant/après (6)]
```

---

### Notes internes

```
Notes de vérification
[Zone de texte — visible uniquement par l'équipe admin]
```

---

### Actions

```
[✓ Vérifier et publier]        [✗ Rejeter]        [→ Demander des informations]
```

**Si "Rejeter" :**
```
Motif du rejet *
[Zone de texte — obligatoire]
Ce motif sera communiqué au soumetteur.

[Confirmer le rejet]     [Annuler]
```

**Si "Demander des informations" :**
```
Information requise *
[Zone de texte]
Sera envoyée au soumetteur par email.

[Envoyer la demande]     [Annuler]
```

---

## Écran professionnel — Vue admin

### En-tête

```
Kouadio Construction
Amadou Kouadio · Abidjan, Côte d'Ivoire
🟡 Or · 7 recommandations
Inscrit depuis mars 2021

[Voir le profil public →]
```

---

### Onglets

```
Recommandations (7)     Projets     Transactions     Activité
```

---

### Actions admin

```
Actions administratives

[Modifier le statut manuellement]
Note : Réservé aux corrections d'erreurs techniques.
Toute modification manuelle est journalisée avec motif obligatoire.

[Ajouter une note interne]
[Suspendre le profil temporairement]
[Supprimer le profil]
```

**Si "Modifier le statut manuellement" :**
```
⚠ Action sensible

La modification manuelle du statut contourne le système automatique.
Elle est réservée aux corrections d'erreurs techniques avérées.

Nouveau statut : [Menu déroulant — Or / Argent / Non classé]

Motif obligatoire *
[Zone de texte]

[Confirmer]     [Annuler]
```

---

## Journal d'activité admin

### En-tête

```
Journal
Toutes les actions administratives sont enregistrées ici.
Elles ne peuvent pas être modifiées ou supprimées.
```

---

### Entrée de journal

```
12 janv. 2026 · 14:32 · Admin : [Prénom Nom]
Recommandation #R-2026-047 — Vérifiée et publiée
Professionnel : Diallo Bâtiment
Note interne : "Contrat signé, photos cohérentes, délais respectés."

──────────────────────────────────────────

11 janv. 2026 · 09:15 · Admin : [Prénom Nom]
Recommandation #R-2026-031 — Rejetée
Professionnel : Traoré Services
Motif communiqué au soumetteur : "Contrat illisible, photos insuffisantes."
```

---

## Tableau de bord admin — Métriques

### En-tête

```
Tableau de bord — [Date du jour]
```

---

### Métriques en temps réel

```
Plateforme

Utilisateurs totaux : 4 382
Abonnements actifs : 312
Professionnels Or : 187
Professionnels Argent : 94
Professionnels Non classés : 198

File de vérification
En attente : 12
Âge moyen d'un dossier en attente : 1,8 jours
Délai moyen de traitement : 2,3 jours

Activité
Recommandations vérifiées ce mois : 47
Projets créés ce mois : 89
Vues de profil aujourd'hui : 1 842

Revenus
Revenus du mois en cours : 3 240 €
Revenus du mois précédent : 2 890 €
```

---

## Gestion des litiges

### Liste des litiges

```
Litiges actifs

Litige #L-2026-012 · Kouadio Construction
Reçu le : 15 avril 2026
Statut : En cours d'examen

[Voir →]
```

---

### Écran litige

```
Litige — #L-2026-012
Professionnel : Kouadio Construction
Client : Fatou K.

Nature du litige :
"[Description soumise par l'une ou l'autre des parties]"

Documents fournis :
[Voir les pièces jointes →]

Projet concerné :
[Voir le projet →]

Notes internes :
[Zone de texte]

Décision :
[Litige classé — aucune action]
[Suspension temporaire du profil]
[Transmission aux autorités compétentes]
```

**Si "Suspension temporaire" :**
```
⚠ Confirmation requise

La suspension rend le profil invisible dans les résultats.
Le professionnel sera notifié.

Durée de la suspension : [Menu déroulant — 7 jours / 30 jours / Indéfini]

Motif obligatoire *
[Zone de texte]
Ce motif est journalisé. Il n'est pas communiqué publiquement.

[Confirmer]     [Annuler]
```
