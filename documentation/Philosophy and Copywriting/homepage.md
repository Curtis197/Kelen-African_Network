# Kelen — Homepage Client (Browser)
*Copywriting interface — Version 2.0 — Mis à jour le 2026-04-25*

> Ce document couvre le copywriting de la page d'accueil côté client (`/`).
> La homepage client est un **espace de recherche**, pas une page marketing.
> L'objectif est d'amener le client à chercher un professionnel en moins de 10 secondes.
> Le texte est minimal. L'interface est le message.

---

## Navigation

```
Kelen                    [Barre de recherche rapide]          [Se connecter]  [Vous êtes professionnel ? →]
```

**Notes :**
- La barre de recherche est dans la navigation — disponible depuis toutes les pages côté client
- "Vous êtes professionnel ?" pointe vers `/pour-les-professionnels` (SaaS landing)
- Pas de liens vers les pages marketing dans la nav client — deux espaces séparés

---

## Hero — Recherche principale

**Objectif :** Le visiteur tape ou clique dans les 10 premières secondes.

```
                    Quel professionnel cherchez-vous ?

            [______________________________________________]

               Localisation : [Ville, quartier ou pays   ]

                          [Rechercher  →]
```

**Notes :**
- La barre de recherche principale est centrée, grande, au-dessus de la ligne de flottaison
- Pas de headline marketing au-dessus — la barre parle d'elle-même
- Le placeholder change selon l'heure ou la navigation précédente (optionnel) :
  - "Plombier à Dakar"
  - "Électricien à Abidjan"
  - "Architecte à Douala"
- La localisation est auto-détectée si l'utilisateur autorise la géolocalisation

---

## Accès rapide par secteur

**Sous la barre de recherche — rangée de tuiles cliquables :**

```
🏗 Construction    🔧 Plomberie    ⚡ Électricité    🪚 Menuiserie

🏠 Rénovation      🎨 Peinture     📐 Architecture   ··· Tous →
```

**Notes :**
- Chaque tuile lance une recherche pré-filtrée par secteur
- "Tous →" ouvre la page de recherche complète avec tous les filtres
- Sur mobile : rangée scrollable horizontalement, 3 tuiles visibles

---

## Section — Professionnels récemment actifs

**Titre :**
> Professionnels disponibles près de vous

*(Titre affiché uniquement si la géolocalisation est active ou si la ville a été détectée. Sinon : "Professionnels récemment actifs sur Kelen".)*

**Grille de cartes (4 profils) :**

```
╔═══════════════════╗  ╔═══════════════════╗  ╔═══════════════════╗  ╔═══════════════════╗
║ [Photo réalisation]║  ║ [Photo réalisation]║  ║ [Photo réalisation]║  ║ [Photo réalisation]║
║                   ║  ║                   ║  ║                   ║  ║                   ║
║ Kouadio           ║  ║ Diallo Bâtiment   ║  ║ Atelier Fatou     ║  ║ Électricité Sall  ║
║ Construction      ║  ║                   ║  ║ Design            ║  ║                   ║
║ Abidjan           ║  ║ Dakar             ║  ║ Dakar             ║  ║ Conakry           ║
║ 🟡 Or             ║  ║ ⚪ Argent         ║  ║ 🟡 Or             ║  ║ — Non classé      ║
╚═══════════════════╝  ╚═══════════════════╝  ╚═══════════════════╝  ╚═══════════════════╝
```

**Sous la grille :**
> [Voir tous les professionnels →]

**Notes :**
- Ces cartes sont la photo principale du profil (réalisation, pas portrait)
- Le portrait du professionnel n'apparaît pas ici — son travail s'affiche en premier
- Ordre affiché : proximité géographique si géolocalisation active, sinon activité récente
- Uniquement les profils avec abonnement actif apparaissent dans cette section

---

## Section — Comment ça marche (optionnel, sous la ligne de flottaison)

**Titre :**
> Trois étapes pour trouver le bon professionnel

```
1. Cherchez
   Par secteur, ville, ou spécialité.

2. Comparez
   Consultez les portfolios et les recommandations vérifiées.

3. Collaborez
   Créez un projet. Échangez directement sur la plateforme.
```

**Notes :**
- Cette section est en bas de page — elle ne doit pas distraire du moteur de recherche
- Elle disparaît entièrement une fois que l'utilisateur est connecté (il connaît déjà le fonctionnement)

---

## Section — Bloc professionnel (pied de page, discret)

> **Vous êtes professionnel ?**
> Obtenez votre site web, votre portfolio PDF et votre fiche Google My Business.
> [Créer un profil professionnel →]

**Notes :**
- Ce bloc est en bas de page, après le contenu client
- Il est sobre — une ligne de texte + un lien
- Il ne concurrence pas le reste de la page

---

## Pied de page

```
Kelen                    Pour les clients          Pour les professionnels
"un" en bambara          Rechercher                Créer un profil
et dioula.               Comment ça marche         Pour les professionnels
                         Soumettre une             Comment ça marche (pro)
                         recommandation            Tarifs

Légal                    Compte
Mentions légales         Se connecter
Politique de             Créer un compte
confidentialité
CGU                      contact@kelen.com
Contact
À propos
```

---

## États de la page selon le contexte

### Visiteur non connecté (première visite)

- Barre de recherche + accès rapide par secteur + grille de pros
- Section "Comment ça marche" visible en bas de page
- Bloc pro visible en pied de page

### Visiteur connecté — client

La barre de recherche reste en hero. La grille de pros est remplacée par :

```
Bonjour, Fatou.

Vos projets en cours             Professionnels sauvegardés

  Rénovation appartement           Kouadio Construction
  Kouadio Construction             Abidjan · 🟡 Or
  ● En cours                       [Voir le profil →]
  [Voir le projet →]
```

- La section "Comment ça marche" disparaît
- Le bloc pro en pied de page disparaît

### Visiteur mobile

- Barre de recherche pleine largeur
- Tuiles secteur : 3 visibles + scroll horizontal
- Grille de pros : 1 carte par ligne (pas de grille)
- Navigation : logo à gauche, icône profil à droite

---

## Ce que cette page ne fait pas

- Pas de headline marketing ("Trouvez le professionnel de confiance") en position hero — la barre de recherche joue ce rôle
- Pas de section tarifs, pas d'explication du système de vérification, pas de présentation de l'équipe
- Pas de bannière promotionnelle
- Pas de pop-up d'inscription

**La homepage client est un outil. Elle démarre au premier geste.**
