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

### Étape 7 — Marketing pro — création de marketing-pro.md (2026-04-25)

**Contexte :** Audit copywriting révèle que le marketing pro n'est pas développé et que l'architecture n'est pas segmentée (marketing/produit mélangés, pas de distinction par stade du funnel).

**Document créé :**
- [x] `marketing-pro.md` — Version 1.0 : page `/pour-les-professionnels` complète (hero, problème, 3 sorties, comment ça marche, réputation, tarif, CTA), page `/comment-ca-marche` pro (7 sections détaillées), page `/tarifs` (tableau comparatif, modalités, FAQ), traitement de 7 objections, taglines alternatives, cadre preuve sociale

**Décisions clés de cette étape :**
| Date | Décision | Raison |
|------|----------|--------|
| 2026-04-25 | Séparation marketing/produit : `marketing-pro.md` vs `03-pro-journey.md` | Le marketing (acquisition) et le produit (utilisation) ne s'adressent pas au même stade ni au même état d'esprit |
| 2026-04-25 | Traitement des objections documenté comme section autonome | Les objections sont transversales — elles peuvent nourrir FAQ, landing, pop-ups, email |
| 2026-04-25 | Preuve sociale cadrée : format concret (prénom, métier, ville, résultat) | Interdit les témoignages génériques qui contredisent le ton Kelen |
| 2026-04-25 | `03-pro-journey.md` conserve onboarding + dashboard, la landing y est remplacée | Éviter la duplication, garder la séparation propre |

**Prochaines étapes identifiées :**
- `homepage.md` — entrée biface pro+client (pas encore documentée)
- `emails-lifecycle-pro.md` — emails d'activation et de conversion vers l'abonnement payant
- Nettoyage de `03-pro-journey.md` — retirer la section "Page d'atterrissage 7 écrans" remplacée

---

### Étape 8 — Homepage biface — création de homepage.md (2026-04-25)

**Contexte :** La homepage existait comme 10 lignes dans `02-user-journey-client.md` (headline client + 2 CTA + 3 étapes + petit bloc pro). Elle devenait la dernière lacune majeure de l'architecture marketing.

**Document créé :**
- [x] `homepage.md` — Version 1.0 : navigation principale, hero biface (2 cartes égales client/pro), section client (portfolios documentés / recommandations vérifiées / zéro commission), section pro (3 sorties produit), comment ça marche en parallèle (client + pro), section réputation + statuts, section "ce que Kelen n'est pas", CTA duplex final, pied de page, états alternatifs (visiteur connecté), notes éditoriales

**Décisions clés de cette étape :**
| Date | Décision | Raison |
|------|----------|--------|
| 2026-04-25 | Hero biface : deux cartes d'égale importance visuelle | Le pro est la cible payante mais le client est l'audience majoritaire — ni l'un ni l'autre ne doit disparaître |
| 2026-04-25 | Carte client à gauche, carte pro à droite | Convention de lecture occidentale (gauche = principal), mais les deux sont traitées avec le même poids |
| 2026-04-25 | La homepage oriente — les pages de destination convainquent | Règle éditoriale explicite : ne pas surcharger la homepage de détails qui appartiennent à /pour-les-pros ou /tarifs |
| 2026-04-25 | Section "Ce que Kelen n'est pas" | Kelen doit prendre distance du modèle "plateforme d'avis" ou "annuaire" pour éviter les fausses attentes |

**État du corpus marketing :**
- ✅ `homepage.md` — Page d'accueil biface (v1, remplacée en étape 9)
- ✅ `marketing-pro.md` — Acquisition professionnelle complète
- ⬜ `marketing-client.md` — Acquisition client (à créer)
- ⬜ `emails-lifecycle-pro.md` — Activation + conversion abonnement

---

### Étape 9 — Séparation totale des espaces pro et client (2026-04-25)

**Décision :** Les espaces pro et client sont architecturalement distincts. Deux paradigmes incompatibles dans un même document — séparation complète.

| Espace | Paradigme | URL | Document |
|--------|-----------|-----|----------|
| Client | Browser home page (outil de recherche) | `/` | `homepage.md` v2 |
| Pro | SaaS landing page (page de conversion) | `/pour-les-professionnels` | `marketing-pro.md` v2 |

**`homepage.md` — Version 2.0 :**
- Refondu en browser home page : barre de recherche en hero (pas de headline marketing), tuiles secteur, grille de profils, "Comment ça marche" sous la ligne de flottaison
- Pas de copy marketing dans la zone de premier regard — l'interface est le message
- Bloc pro discret en bas de page uniquement
- Navigation épurée : logo + search + Se connecter + Vous êtes professionnel ?

**`marketing-pro.md` — Version 2.0 :**
- Restructuré comme une SaaS landing complète (Notion / Stripe / Linear)
- Structure : hero + bande de réassurance + problème + 5 fonctionnalités + comment ça marche + réputation + tarifs + objections + CTA final
- Chaque section répond à une question implicite documentée
- Visuel hero et visuels par fonctionnalité décrits pour les développeurs

**Décisions clés de cette étape :**
| Date | Décision | Raison |
|------|----------|--------|
| 2026-04-25 | Homepage client = outil, pas page marketing | Un client qui cherche un pro n'a pas besoin d'être convaincu que Kelen existe — il a besoin de chercher |
| 2026-04-25 | SaaS landing pro = conversion complète en une page | Le pro techno-réticent doit trouver toutes ses réponses sans naviguer — Hero → Tarifs → Objections → CTA |
| 2026-04-25 | Navigations séparées entre les deux espaces | Évite la confusion de rôle — un client ne voit pas les tarifs pro en naviguant |

**État du corpus marketing :**
- ✅ `homepage.md` — Homepage client browser (v2)
- ✅ `marketing-pro.md` — SaaS landing pro (v2)
- ⬜ `emails-lifecycle-pro.md` — Activation + conversion abonnement

---

### Étape 10 — Pages dédiées espace pro — création de pro-pages.md (2026-04-25)

**Contexte :** La navigation pro (`Comment ça marche · Tarifs · FAQ · Contact`) pointait vers des ancres de la SaaS landing ou n'existait pas. Ces pages sont créées comme documents dédiés avec URL propres.

**Document créé :**
- [x] `pro-pages.md` — Version 1.0 : navigation pro commune mise à jour (URLs réelles), `/comment-ca-marche` (7 sections : profil source, site web, PDF, GMB, IA, recommandations/statut, collaboration), `/tarifs` (tableau complet, ce que ça ne change pas, modalités, FAQ tarifs 6 questions), `/faq` (33 questions en 6 catégories : avant inscription, profil/visibilité, portfolio/contenu, recommandations/statut, abonnement/paiement, technique), `/contact` (6 canaux pro-spécifiques segmentés par situation)

**Décisions clés de cette étape :**
| Date | Décision | Raison |
|------|----------|--------|
| 2026-04-25 | Navigation pro avec URLs réelles, pas des ancres | Les ancres brisent la séparation des espaces et empêchent le référencement indépendant de chaque page |
| 2026-04-25 | Contact pro distinct du contact générique (`06-legal-contact.md`) | Les canaux de contact diffèrent : un pro a des questions de facturation, de profil, de recommandations — pas les mêmes que le client |
| 2026-04-25 | FAQ pro exhaustive (33 questions) dans un document dédié | La FAQ ne doit pas alourdir la SaaS landing — elle a sa propre page pour les pros qui veulent aller en profondeur |
| 2026-04-25 | "Comment ça marche" pro en 7 sections vs 3 étapes dans la landing | La landing doit convaincre — la page dédiée doit rassurer et clarifier les détails techniques pour ceux qui veulent tout comprendre |

**Architecture pro complète :**
```
/pour-les-professionnels              → SaaS landing (marketing-pro.md)
/pour-les-professionnels/comment-ca-marche  → pro-pages.md
/pour-les-professionnels/tarifs             → pro-pages.md
/pour-les-professionnels/faq               → pro-pages.md
/pour-les-professionnels/contact           → pro-pages.md
/pro/dashboard + /pro/*                    → 03-pro-journey.md (espace connecté)
```

---

### Étape 11 — Lifecycle pro Email & WhatsApp — création de emails-lifecycle-pro.md (2026-04-25)

**Contexte :** Beaucoup de professionnels africains n'utilisent pas leur email régulièrement. WhatsApp est leur canal principal. Chaque déclencheur lifecycle a donc deux versions.

**Document créé :**
- [x] `emails-lifecycle-pro.md` — Version 1.0 : 13 étapes couvrant l'intégralité du cycle pro, chacune avec version email + version WhatsApp

**Séquence documentée :**
| # | Déclencheur | Objectif |
|---|-------------|----------|
| 1 | Post-inscription | Orienter vers ajout de photos |
| 2 | J+1 sans photos | Faire revenir pour compléter |
| 3 | J+3 profil incomplet | Concrétiser la valeur avant conversion |
| 4 | J+7 profil complet, pas d'abo | Premier message conversion |
| 5 | J+14 toujours pas d'abo | Relance conversion (angle différent) |
| 6 | J+30 toujours pas d'abo | Dernier message — engagement de ne pas relancer |
| 7 | Abonnement activé | Confirmer + ce qui se passe dans les prochaines heures |
| 8 | Indexation Google confirmée | Moment de satisfaction tangible |
| 9 | Résumé mensuel | Montrer la valeur concrète (données réelles) |
| 10 | 60j sans nouveau projet | Nudge portfolio — sans culpabiliser |
| 11 | J-5 renouvellement | Information de service |
| 12 | Échec de paiement | Résoudre rapidement |
| 13 | J+7 post-résiliation | Ce qui reste disponible — sans pression |

**Décisions clés de cette étape :**
| Date | Décision | Raison |
|------|----------|--------|
| 2026-04-25 | WhatsApp prioritaire si fourni | Canal de communication principal pour la majorité des pros africains |
| 2026-04-25 | Jamais deux canaux pour le même message | Évite la surcharge et le sentiment d'être harcelé |
| 2026-04-25 | Arrêt définitif de la conversion à J+30 | Kelen tient l'engagement — pas de harcèlement commercial |
| 2026-04-25 | Messages WhatsApp : 3 à 6 lignes max | Au-delà, ignoré ou bloqué |
| 2026-04-25 | Résumé mensuel avec données réelles uniquement | Afficher 0 est honnête — ne pas inventer des métriques flatteuses |

---

### Étape 12 — Espace client complet — marketing-client.md + emails-lifecycle-client.md (2026-04-25)

**Contexte :** Parallèle à l'espace pro. Le client ne paie rien — les pages sont informationelles, pas marketing. Le lifecycle n'a pas de séquence de conversion — uniquement activation → engagement → contribution.

**Documents créés :**
- [x] `marketing-client.md` — Pages dédiées : navigation client (avec barre de recherche), `/comment-ca-marche` (7 sections), `/faq` (25 questions en 5 catégories), `/contact` (5 canaux)
- [x] `emails-lifecycle-client.md` — 10 étapes Email + WhatsApp couvrant l'intégralité du cycle client

**Lifecycle client — séquence documentée :**
| # | Déclencheur | Objectif |
|---|-------------|----------|
| 1 | Post-inscription | Orienter vers première recherche |
| 2 | J+1 sans recherche | Revenir sur la plateforme |
| 3 | J+7 sans projet | Franchir le pas de la création |
| 4 | Projet créé | Confirmer + expliquer la suite |
| 5 | Pro sans réponse (J+3) | Inviter un autre pro sans décourager |
| 6 | Pro a accepté | Orienter vers la collaboration |
| 7 | Projet terminé (J+3) | Nudge recommandation |
| 8 | Recommandation soumise | Confirmer réception |
| 9 | Recommandation publiée | Informer le client |
| 10 | 90j inactif | Rappel doux, sans pression |

**Décisions clés de cette étape :**
| Date | Décision | Raison |
|------|----------|--------|
| 2026-04-25 | Pas de séquence de conversion pour le client | Le client est gratuit — la plateforme le convainc par son utilité, pas par ses messages |
| 2026-04-25 | Nudge recommandation à J+3 après clôture | Pas immédiatement — laisser le projet se terminer vraiment |
| 2026-04-25 | "La seule chose qui fait revenir un client : la plateforme était utile." | Règle éditoriale qui gouverne tout le ton lifecycle client |
| 2026-04-25 | Navigation client avec barre de recherche persistante | Le premier geste d'un client est toujours de chercher — pas de s'inscrire |

**État du corpus copywriting — complet :**
```
FONDATIONS
  01-philosophie-positionnement.md   Principes et ton
  00-genesis.md                      Histoire et trajectoire

ESPACE CLIENT
  homepage.md                        Browser home page
  marketing-client.md                Pages informationelles (comment ça marche, faq, contact)
  02-user-journey-client.md          Produit (recherche, profil, projet, dashboard)
  emails-lifecycle-client.md         Lifecycle (10 étapes email + WhatsApp)

ESPACE PRO
  marketing-pro.md                   SaaS landing page
  pro-pages.md                       Pages dédiées (comment ça marche, tarifs, faq, contact)
  03-pro-journey.md                  Produit (inscription, dashboard, présence)
  emails-lifecycle-pro.md            Lifecycle (13 étapes email + WhatsApp)

TRANSVERSAL
  04-emails-notifications.md         Emails transactionnels
  05-admin.md                        Interface admin
  06-legal-contact.md                Légal, À propos, FAQ générale
  07-reference-global.md             Index et règles transversales
  reflexion-path.md                  Journal de conception
```

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
