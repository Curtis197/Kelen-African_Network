# Kelen — Admin
*Copywriting complet — Version 1.0*

---

## Principes de l'espace admin

L'espace admin n'est pas public. Son copywriting est différent des pages utilisateur : plus direct, plus technique, orienté vers l'action et la traçabilité.

**Règles spécifiques à l'admin :**
- Pas de langage institutionnel — ici on dit les choses clairement
- Les mots "arnaque", "fraude", "suspicion" sont utilisés normalement
- Chaque action irréversible demande confirmation explicite
- Tout est journalisé — l'admin sait que ses actions sont enregistrées

---

## File d'attente — Vue d'ensemble

### En-tête

```
File de vérification

En attente : 12     En cours : 3     Traités aujourd'hui : 7

[Signaux (4)]     [Recommandations (8)]     [Tous (12)]
```

Les signaux apparaissent en premier — priorité absolue.

---

### Carte dans la file — Signal

```
⚠ SIGNAL
Abandon de chantier · Abidjan
Professionnel : Kouadio Construction
Montant concerné : 38 000 €
Soumis le : 8 janvier 2025 · il y a 2 jours
Documents : 4 fichiers

[Examiner →]
```

---

### Carte dans la file — Recommandation

```
✓ RECOMMANDATION
Construction résidentielle · Dakar
Professionnel : Diallo Bâtiment
Soumis le : 12 janvier 2025 · il y a 1 jour
Documents : 3 fichiers

[Examiner →]
```

---

### Filtres

```
Trier par : [Plus ancien d'abord ▼]     Type : [Tous ▼]     Assigné à : [Tous ▼]
```

---

## Écran de vérification — Recommandation

### En-tête

```
Recommandation — Examen
Soumis le 12 janvier 2025
[Assigné à moi]
```

---

### Informations déclarées

```
Professionnel : Diallo Bâtiment · Dakar
Soumetteur : M. D. · Paris · m.d@example.com

Type de projet : Construction résidentielle
Localisation : Dakar, Sénégal
Budget déclaré : 45 000 €
Début des travaux : mars 2023
Livraison convenue : novembre 2023
Livraison effective : novembre 2023

Témoignage :
"Chantier livré dans les délais. Bonne communication."
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

## Écran de vérification — Signal

### Alerte en haut de page

```
⚠ DÉCISION IRRÉVERSIBLE

La vérification de ce signal entraîne un statut Liste Rouge
permanent pour ce professionnel. Cette décision ne peut pas
être annulée.

Prenez le temps nécessaire.
```

---

### Informations déclarées

```
Professionnel : Kouadio Construction · Abidjan
Soumetteur : Mme K. · Bruxelles · mme.k@example.com

Type de manquement : Abandon de chantier
Montant concerné : 38 000 €

Chronologie déclarée :
- Contrat signé : juin 2022
- Début travaux convenu : juillet 2022
- Livraison convenue : décembre 2022
- Livraison effective : chantier abandonné, mars 2023

Acompte versé : 19 000 €
Tentatives de résolution : 3 tentatives de contact, sans réponse
```

---

### Documents

```
[Contrat signé]     [Preuves de paiement (2)]
[Photos chantier (5)]     [Captures WhatsApp (8)]
```

---

### Réponse du professionnel (si soumise)

```
Réponse soumise le [date] :

"[Texte de la réponse]"

Documents fournis par le professionnel : [X fichiers]
[Voir les documents →]
```

**Si pas de réponse après 7 jours :**
```
Le professionnel n'a pas soumis de réponse dans le délai imparti.
```

---

### Checklist de vérification

```
Points à vérifier avant décision

□ Contrat signé par les deux parties
□ Identité du professionnel correspond au profil Kelen
□ Paiements cohérents avec le montant déclaré
□ Photos cohérentes avec la période et le type de projet
□ Chronologie WhatsApp cohérente avec les dates déclarées
□ Le manquement décrit est documenté dans les preuves

Note : Pas besoin de cocher toutes les cases.
Justifiez les cases non cochées dans vos notes internes.
```

---

### Notes internes

```
Notes de vérification *
[Zone de texte — minimum 50 caractères — obligatoire]
Visible uniquement par l'équipe admin.
```

---

### Actions

```
[✓ Vérifier et publier le signal]        [✗ Signal insuffisant — ne pas publier]
```

**Si "Vérifier et publier" :**
```
⚠ Confirmation requise

Cette action entraîne le statut Liste Rouge permanent
pour Kouadio Construction.

Cette décision est IRRÉVERSIBLE.

Pour confirmer, tapez : CONFIRMER

[                    ]

[Confirmer]     [Annuler]
```

**Si "Signal insuffisant" :**
```
Motif *
[Zone de texte — obligatoire]
Ce motif sera communiqué au soumetteur.

Note interne (optionnel)
[Zone de texte]

[Confirmer]     [Annuler]
```

---

## Écran professionnel — Vue admin

### En-tête

```
Kouadio Construction
Amadou Kouadio · Abidjan, Côte d'Ivoire
🟡 Liste Or · 7 recommandations · 0 signal
Inscrit depuis mars 2021

[Voir le profil public →]
```

---

### Onglets

```
Recommandations (7)     Signaux (0)     Transactions     Activité
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

Nouveau statut : [Menu déroulant — Or / Argent / Non classé / Rouge]

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
12 janv. 2025 · 14:32 · Admin : [Prénom Nom]
Signal #S-2025-001 — Vérifié et publié
Professionnel : Kouadio Construction
Motif : "Contrat signé, paiements confirmés, captures WhatsApp établissent chronologie. Abandon documenté."

──────────────────────────────────────────

11 janv. 2025 · 09:15 · Admin : [Prénom Nom]
Recommandation #R-2025-047 — Rejetée
Professionnel : Diallo Bâtiment
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
Professionnels Liste Or : 187
Professionnels Liste Argent : 94
Professionnels Non classés : 198
Professionnels Liste Rouge : 23

File de vérification
En attente : 12
Âge moyen d'un dossier en attente : 1,8 jours
Délai moyen de traitement : 2,3 jours

Activité
Recommandations vérifiées ce mois : 47
Signaux vérifiés ce mois : 3
Vues de profil aujourd'hui : 1 842

Revenus
Revenus du mois en cours : 3 240 €
Revenus du mois précédent : 2 890 €
```

---

## Gestion des contestations

### Liste des contestations

```
Contestations actives

Signal #S-2024-089 · Kouadio Construction
Reçu le : 15 décembre 2024
Statut : En cours d'examen

[Voir →]
```

---

### Écran contestation

```
Contestation — Signal #S-2024-089
Professionnel : Kouadio Construction

Motif de contestation :
"[Texte soumis par le professionnel]"

Documents fournis :
[Voir les pièces jointes →]

Signal original :
[Voir le signal →]

Notes internes :
[Zone de texte]

Décision :
[Contestation rejetée — signal maintenu]
[Contestation acceptée — signal retiré]
```

**Si "Contestation acceptée" :**
```
⚠ Confirmation requise

Le retrait d'un signal vérifié est exceptionnel.
Il ne peut être effectué que si la soumission originale
est prouvée frauduleuse.

Motif obligatoire *
[Zone de texte]

Ce motif sera journalisé de façon permanente.

[Confirmer le retrait]     [Annuler]
```
