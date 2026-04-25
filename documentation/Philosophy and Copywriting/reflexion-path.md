# Reflexion Path — Philosophy & Copywriting Conception

> Ce document trace les étapes de réflexion et les décisions prises lors de l'évolution de la philosophie et du copywriting de Kelen. Il sert de mémoire du processus de conception.

---

## Contexte de départ

**Date d'ouverture :** 2026-04-25
**Branche :** feat/professional-dashboard
**Objectif :** Mettre à jour la philosophie générale de Kelen et reorganiser la documentation.

---

## Étapes de conception

### Étape 1 — Réorganisation de la documentation (2026-04-25)

**Action :** Organisation de tous les fichiers `.md` du projet en dossiers thématiques.

**Structure mise en place :**
```
documentation/
├── Architecture/            — référence technique
├── Philosophy and Copywriting/  — marque, copy, marketing
├── PRODUCT/                 — positionnement, blueprint, feature matrix
├── FEATURES/                — specs, plans d'implémentation
├── AUDITS/                  — audits, QA, rapports
└── ENGINEERING/             — bug fixes, guides ops, setup
```

**Décision :** Garder à la racine uniquement les 4 fichiers requis par les agents IA (`AGENTS.md`, `GEMINI.md`, `QWEN.md`, `README.md`).

---

### Étape 2 — Rédaction de la genèse (2026-04-25)

**Action :** Création de `00-genesis.md` — retrace les 9 étapes de l'évolution du projet sur 2 ans.

**Décision clé :** Kelen-Pro est la première brique d'un écosystème modulaire (Kelen-Design, Kelen-Market, Kelen-Restaurant). La promesse centrale : *"Si tu peux remplir un profil Facebook ou WhatsApp, tu peux avoir un site web."*

**Implications identifiées :**
- Le public cible prioritaire est le professionnel techno-réticent
- Kelen-Pro sert à collecter des données pour les modules suivants
- Le modèle est B2B2C — le professionnel paie, le client bénéficie

---

### Étape 3 — Repositionnement stratégique majeur (2026-04-25)

**Le pivot :**

| | Avant | Après |
|--|-------|-------|
| **Cible primaire** | Client diaspora | Professionnel africain |
| **Cible secondaire** | Professionnel construction | Client (tous types) |
| **Problème central** | Confiance différentielle pro/client | Absence de digitalisation des pros |
| **Solution phare** | Signalement + vérification de réputation | Digitalisation facile (PDF, GMB, site web) |
| **Mécanique anti-fraude** | Blacklist (abandonné — contrainte légale) | Visibilité documentée (portfolio, projets) |
| **Relation client** | Protection contre les mauvais pros | Sélection, comparaison, collaboration |

**Ce qui change dans le produit :**
- Le pro peut exposer son travail facilement sur PDF, Google My Business et site web
- Le client peut trouver des pros, les comparer, créer un projet, collaborer
- Le blacklist/signalement est abandonné

**Ce qui ne change pas :**
- La confiance reste le cœur — mais elle est construite positivement (visibilité documentée) plutôt que défensivement (signalement)
- Le marché cible reste l'Afrique et la diaspora
- Le motto reste valide : accessibilité radicale pour le pro techno-réticent

**Documents impactés :**
- `01-philosophie-positionnement.md` — réécriture profonde
- `02-user-journey-diaspora.md` — recentrage sur la sélection/collaboration
- `03-pro-journey.md` — le pro devient la cible primaire
- `07-reference-global.md` — mise à jour des règles transversales

---

## Décisions clés

| Date | Décision | Raison |
|------|----------|--------|
| 2026-04-25 | Réorganisation des MD en 6 dossiers thématiques | Lisibilité et maintenabilité du repo |
| 2026-04-25 | Rédaction de la genèse complète (00-genesis.md) | Ancrer toutes les décisions futures dans la trajectoire fondatrice |
| 2026-04-25 | Clarification : Kelen-Pro = brique 1 du système Kelen | Positionner le produit actuel dans la vision long terme |
| 2026-04-25 | Motto validé : "Si tu peux remplir un profil FB/WA, tu peux avoir un site" | Ancrer le positionnement sur l'accessibilité radicale |
| 2026-04-25 | Système de statuts simplifié : Or / Argent / Non classé (suppression Rouge/Noir) | Abandon du signalement pour contrainte légale |
| 2026-04-25 | Deux phrases fondatrices selon l'audience | Client : "Trouvez le professionnel de confiance." / Pro : "Construisez la confiance." — le client trouve, le pro construit |

---

### Étape 4 — Mise à jour des parcours et du copywriting (à venir)

Documents à mettre à jour dans l'ordre :
- [x] `02-user-journey-client.md` — recentrage sur sélection / création de projet / collaboration (renommé depuis 02-user-journey-diaspora.md)
- [x] `03-pro-journey.md` — le pro comme cible primaire, onboarding simplifié (Version 2.0)
- [x] `04-emails-notifications.md` — suppression emails signal, ajout emails projet/collaboration (Version 2.0)
- [x] `05-admin.md` — suppression écran signal, refonte métriques sans Liste Rouge, litiges remplacent contestations (Version 2.0)
- [x] `06-legal-contact.md` — suppression section permanence signaux, réécriture À propos, FAQ et Contact mis à jour (Version 2.0)
- [x] `07-reference-global.md` — règles transversales entièrement mises à jour (Version 2.0)

### Étape 5 — Repositionnement PRODUCT/ (2026-04-25)

Documents mis à jour :
- [x] `PRODUCT/kelen_positioning.md` — réécriture complète (Version 2.0) : pro comme cible primaire, client universel (plus diaspora uniquement), 3 sorties produit (site/PDF/GMB), statuts simplifiés, écosystème Kelen documenté
- [x] `PRODUCT/kelen_value_proposition.md` — réécriture complète (Version 2.0) : suppression Red status, ajout valeur pro/client séparée, tableau de prix mis à jour, différenciation vs concurrents recentrée

**Décisions clés de cette étape :**
| Date | Décision | Raison |
|------|----------|--------|
| 2026-04-25 | Marché d'entrée élargi : plus uniquement Europe-Afrique construction | Le client local africain est la cible centrale |
| 2026-04-25 | Les 3 sorties produit (site/PDF/GMB) deviennent la proposition de valeur centrale | Concrétise la promesse "WhatsApp → site web" |
| 2026-04-25 | Différenciation : Kelen vs Instagram / site perso / annuaires / intermédiaires | Positionner sans citer de concurrents nommés |

---

### Étape 6 — Mise à jour feature-matrix et professional-journey-reference (2026-04-25)

Documents mis à jour :
- [x] `PRODUCT/feature-matrix.md` — Version 2.0 : suppression lignes Signalements/Signalements externes, badge statut mis à jour (Or/Argent/Non classé), calcul statut simplifié (3 niveaux), revenue model summary nettoyé (suppression "Bad professionals won't pay")
- [x] `PRODUCT/professional-journey-reference.md` — Version 2.0 : description plateforme recentrée sur la digitalisation, Section 8.2 Signals supprimée, Section 8.3 réduite à 3 statuts, navigation pro mise à jour (ajout Ma présence), notifications pro mises à jour (suppression signal, ajout invitation projet), Section 13.2 vérification recommandations uniquement, feature map et glossaire nettoyés

**Décisions clés de cette étape :**
| Date | Décision | Raison |
|------|----------|--------|
| 2026-04-25 | Suppression de toute référence aux signaux dans la feature matrix | Abandon du système de signalement pour contrainte légale |
| 2026-04-25 | "Ma présence" ajouté comme item de navigation dédié | Les 3 sorties produit (site/PDF/GMB) méritent leur propre espace |
| 2026-04-25 | Status tiers renommés en français (Or/Argent/Non classé) | Cohérence avec les règles transversales définies en étape 2 |

---

## Questions ouvertes

*(à remplir au fil de la réflexion)*

---

## Principes directeurs conservés

- Ton institutionnel, sobre, factuel — jamais condescendant
- Le professionnel paie, le client bénéficie — modèle B2B2C
- Le statut ne s'achète pas et n'influence pas le classement commercial
- "Les faits d'abord" — montrer, ne pas décrire
- Kelen = "un" en bambara — l'unicité comme valeur

---

## Principes directeurs modifiés

- **Avant :** Confiance = protection contre les mauvais pros → **Après :** Confiance = visibilité documentée du bon travail
- **Avant :** Cible primaire = client diaspora → **Après :** Cible primaire = professionnel techno-réticent
- **Avant :** Statut à 5 niveaux avec signalement → **Après :** Statut à 3 niveaux positifs uniquement
- **Avant :** Phrase fondatrice = "La confiance ne se promet pas. Elle se documente." → **Après :** "Construisez la confiance." / "Build trust."
