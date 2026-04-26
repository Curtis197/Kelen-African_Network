# Kelen — Lifecycle Professionnel — Email & WhatsApp
*Copywriting — Version 1.0 — Créé le 2026-04-25*

> Ce document couvre les messages de lifecycle envoyés aux professionnels.
> Chaque déclencheur a deux versions : email et WhatsApp.
>
> **Pourquoi deux canaux :**
> Une majorité de professionnels africains n'utilisent pas leur email régulièrement.
> WhatsApp est leur canal de communication principal.
> Les deux canaux envoient le même message — jamais les deux en même temps pour le même déclencheur.
> La logique de canal dépend de ce que le pro a fourni à l'inscription (email seul, WhatsApp seul, ou les deux).
>
> **Règle de priorité :**
> Si WhatsApp est fourni → WhatsApp en premier.
> Si email seulement → email.
> Si les deux → WhatsApp pour les messages courts, email pour les récapitulatifs longs.

---

## Contraintes WhatsApp

> - Messages sortants via WhatsApp Business API — chaque template doit être approuvé par Meta
> - Pas de HTML. Mise en forme : *gras* avec astérisques, _italique_ avec underscores
> - Les liens doivent être des URLs courtes et mémorables
> - Ton : conversationnel, direct, comme un message d'une vraie personne
> - Longueur cible : 3 à 6 lignes — au-delà, le message est ignoré
> - Un seul lien par message
> - Jamais deux messages consécutifs sans réponse du pro (risque de blocage)

---

## Étape 1 — Bienvenue (post-inscription immédiate)

**Déclencheur :** Inscription complétée.
**Objectif :** Confirmer, orienter vers la prochaine action (ajouter des photos).

---

### Email — Bienvenue

**Objet :** Votre profil Kelen est créé

**Corps :**

> Votre profil est en ligne.
>
> Vous pouvez le consulter ici : kelen.com/[slug]
>
> Pour qu'il soit complet, une étape reste :
> **Ajoutez vos premières photos de réalisations.**
>
> Ce sont ces photos que vos clients verront en premier.
> Deux photos suffisent pour commencer — vous pourrez en ajouter d'autres à tout moment.
>
> [Ajouter mes photos →] [lien tableau de bord]
>
> ---
> Si vous avez des questions : support@kelen.com

**Notes :**
- Pas de "Bienvenue sur Kelen !" en ouverture — commencer par le fait utile
- Le lien vers le profil est personnalisé avec le slug réel du pro
- Un seul CTA : ajouter des photos

---

### WhatsApp — Bienvenue

```
Bonjour [Prénom] 👋

Votre profil Kelen est en ligne :
kelen.com/[slug]

Ajoutez vos premières photos de réalisations pour l'activer complètement.
2 photos suffisent pour commencer.

→ [lien tableau de bord]
```

**Notes :**
- L'emoji 👋 est autorisé — il humanise le message d'entrée sans être excessif
- "photos de réalisations" fonctionne pour tous les métiers — un designer, un architecte, un plombier, un menuisier
- Le lien est la seule action demandée

---

---

## Étape 2 — Activation — profil sans photos (J+1)

**Déclencheur :** 24h après inscription, aucune photo ajoutée.
**Objectif :** Faire revenir le pro pour compléter son profil.
**Condition :** N'envoyer qu'une seule fois. Si toujours pas de photo à J+3, passer à l'étape 3.

---

### Email — J+1 sans photos

**Objet :** Votre profil est vide pour vos clients

**Corps :**

> Votre profil est en ligne, mais vos clients voient encore un espace vide.
>
> Sans photos, votre profil ne montre rien de votre travail.
> Les clients qui le visitent n'ont pas de raison de vous contacter.
>
> Ajoutez deux photos de vos réalisations — n'importe lesquelles.
> Un projet livré, une mission terminée, une réalisation récente.
> Vos photos de WhatsApp fonctionnent très bien.
>
> [Ajouter mes photos →]

---

### WhatsApp — J+1 sans photos

```
Bonjour [Prénom],

Votre profil Kelen est vide pour l'instant — vos clients ne voient pas encore votre travail.

Ajoutez 2 photos de vos réalisations pour changer ça.
Vos photos WhatsApp font très bien l'affaire.

→ [lien]
```

---

---

## Étape 3 — Activation — profil incomplet (J+3)

**Déclencheur :** J+3, profil créé mais incomplet (photos manquantes ou description manquante).
**Objectif :** Concrétiser la valeur avant de parler d'abonnement.

---

### Email — J+3 incomplet

**Objet :** Ce qui manque sur votre profil Kelen

**Corps :**

> Votre profil est créé. Il lui manque encore quelques éléments pour être visible correctement.
>
> Ce qui n'est pas encore renseigné :
> [liste dynamique des champs manquants — photos / description / WhatsApp / ville]
>
> Un profil complet :
> — reçoit 4 fois plus de visites qu'un profil incomplet
> — génère un PDF portfolio qui peut être envoyé à vos clients
> — apparaît dans les résultats de recherche une fois l'abonnement activé
>
> [Compléter mon profil →]

**Note :**
- La liste des champs manquants est dynamique — elle n'affiche que ce qui manque réellement
- Pas de chiffre inventé sur "4 fois plus" — à remplacer par une donnée réelle dès disponible ou supprimer

---

### WhatsApp — J+3 incomplet

```
Bonjour [Prénom],

Il manque encore [description / photos / votre ville] sur votre profil.

Un profil complet génère votre PDF portfolio automatiquement
et peut apparaître sur Google quand vous activez la visibilité.

Ça prend 5 minutes :
→ [lien]
```

---

---

## Étape 4 — Conversion — profil complet, pas d'abonnement (J+7)

**Déclencheur :** J+7, profil complet (photos + description), pas d'abonnement actif.
**Objectif :** Premier message de conversion vers l'abonnement payant.

---

### Email — J+7, premier message de conversion

**Objet :** Votre profil est prêt. Vos prochains clients ne le voient pas encore.

**Corps :**

> Votre profil est complet et visible sur Kelen.
>
> Une chose manque encore : si quelqu'un cherche "[votre métier] à [votre ville]" sur Google, vous n'apparaissez pas.
>
> L'abonnement Kelen change ça :
>
> — Votre site est indexé sur Google
> — Votre fiche Google My Business est synchronisée
> — Votre profil passe en rendu dynamique — toujours à jour
> — Vos projets sont illimités
>
> **3 000 FCFA / 15 € par mois. Sans engagement.**
>
> Un seul client trouvé via Kelen couvre plusieurs mois d'abonnement.
>
> [Activer ma visibilité →]
>
> ---
> Vous voulez rester en gratuit pour l'instant ? C'est possible.
> Votre profil reste en ligne. Vous activez quand vous êtes prêt.

---

### WhatsApp — J+7, premier message de conversion

```
Bonjour [Prénom],

Votre profil Kelen est complet et visible sur Kelen — mais il n'apparaît pas encore sur Google.

L'abonnement (3 000 FCFA / 15 €/mois) vous indexe sur Google et débloque les outils avancés.
Sans engagement — annulable à tout moment.

→ [lien activation]
```

---

---

## Étape 5 — Conversion — relance (J+14)

**Déclencheur :** J+14, profil complet, toujours pas d'abonnement.
**Objectif :** Deuxième tentative de conversion avec un angle différent (preuve concrète).
**Condition :** Ne pas envoyer si le pro a déjà répondu à un message ou visité la page tarifs.

---

### Email — J+14, relance conversion

**Objet :** Ce que voient vos concurrents abonnés sur Kelen

**Corps :**

> Les professionnels abonnés à Kelen ont un avantage simple :
> quand un client cherche leur métier dans leur ville, ils apparaissent.
> Vous, pas encore.
>
> Ce n'est pas une question de qualité de travail.
> C'est une question de visibilité.
>
> Votre profil est prêt. Il attend juste d'être activé.
>
> [Activer ma visibilité — 3 000 FCFA / 15 €/mois →]
>
> ---
> Des questions sur l'abonnement ? [lien FAQ tarifs]

---

### WhatsApp — J+14, relance conversion

```
Bonjour [Prénom],

Les professionnels abonnés à Kelen apparaissent sur Google quand un client cherche leur métier.
Vous êtes prêt à faire la même chose.

3 000 FCFA / 15 €/mois — sans engagement.

→ [lien activation]
```

---

---

## Étape 6 — Conversion — dernier message (J+30)

**Déclencheur :** J+30, profil complet, toujours pas d'abonnement.
**Objectif :** Dernier message de conversion. Après cela, cesser les messages de conversion.
**Condition :** Ne pas envoyer si le pro a cliqué sur un lien de conversion récemment.

---

### Email — J+30, dernier message

**Objet :** Votre profil Kelen — un point

**Corps :**

> Votre profil est en ligne depuis un mois.
>
> Vous avez reçu [X] visites depuis votre inscription — des clients Kelen et des personnes qui ont votre lien direct.
>
> Si vous activez l'abonnement, ces chiffres incluront aussi les clients qui vous cherchent sur Google sans vous connaître encore.
>
> C'est le seul message que nous vous enverrons sur ce sujet.
> La décision vous appartient entièrement.
>
> [Voir les statistiques de mon profil →]
> [Activer l'abonnement →]

**Note :**
- "[X] visites" est une donnée réelle tirée de l'analytics du profil
- "Le seul message" — Kelen tient cet engagement : pas de relance après J+30

---

### WhatsApp — J+30, dernier message

```
Bonjour [Prénom],

Votre profil a reçu [X] visites ce mois — uniquement via lien direct.

L'abonnement vous ouvre les recherches Google et Kelen.
C'est le dernier message que nous vous envoyons sur ce sujet.

→ [lien activation] si vous êtes prêt.
```

---

---

## Étape 7 — Post-souscription (abonnement activé)

**Déclencheur :** Abonnement activé avec succès.
**Objectif :** Confirmer, expliquer ce qui va se passer dans les prochaines heures.

---

### Email — Abonnement activé

**Objet :** Votre abonnement est actif

**Corps :**

> Votre abonnement Kelen est actif.
>
> Ce qui change maintenant :
>
> **Dans les prochaines minutes :**
> Votre profil est rendu en mode dynamique.
> La synchronisation Google My Business est démarrée.
>
> **Dans les 24 à 72 heures :**
> Votre profil est soumis à Google pour indexation.
> Il apparaîtra dans les résultats de recherche pour votre métier et votre ville.
>
> **Pour optimiser votre visibilité :**
> Ajoutez vos meilleurs projets si ce n'est pas encore fait.
> Plus votre portfolio est complet, mieux vous apparaissez.
>
> [Voir mon tableau de bord →]
>
> ---
> Votre prochaine facturation : le [date] — [montant].
> Annulable à tout moment depuis votre tableau de bord.

---

### WhatsApp — Abonnement activé

```
Bonjour [Prénom],

*Votre abonnement Kelen est actif.*

Votre profil est maintenant visible dans les résultats de recherche.
Indexation Google : 24 à 72h.
Projets illimités : actifs dès maintenant.

→ [lien tableau de bord]
```

---

---

## Étape 8 — Indexation confirmée (J+3 après souscription)

**Déclencheur :** Google a indexé la page du professionnel (ou J+3 si vérification manuelle).
**Objectif :** Confirmer que le profil est trouvable — moment de satisfaction tangible.

---

### Email — Indexation confirmée

**Objet :** Votre profil apparaît maintenant sur Google

**Corps :**

> Votre profil Kelen est indexé sur Google.
>
> Tapez votre nom ou "[votre métier] [votre ville]" dans Google.
> Vous devriez apparaître dans les premiers résultats.
>
> Si ce n'est pas encore le cas, attendez 24h supplémentaires — Google met parfois quelques jours à mettre à jour ses index.
>
> [Voir mon profil public →]
>
> ---
> Pour aller plus loin : ajoutez un projet cette semaine.
> Chaque nouveau projet renforce votre position dans les résultats.

---

### WhatsApp — Indexation confirmée

```
Bonjour [Prénom],

Votre profil Kelen est maintenant indexé sur Google.

Tapez "[votre métier] [votre ville]" dans Google — vous devriez apparaître.

→ kelen.com/[slug]
```

---

---

## Étape 9 — Résumé mensuel (abonné actif)

**Déclencheur :** Premier jour du mois, pour tous les professionnels abonnés actifs.
**Objectif :** Montrer la valeur concrète de l'abonnement — données réelles.

---

### Email — Résumé mensuel

**Objet :** Votre activité Kelen en [mois]

**Corps :**

> Voici un résumé de votre activité sur Kelen en [mois] :
>
> **Visibilité**
> [X] vues de votre profil
> [X] clics sur votre numéro WhatsApp
> [X] clics sur votre email
>
> **Réputation**
> [X] recommandations vérifiées sur votre profil
> Statut actuel : [Or / Argent / Non classé]
>
> **Projets**
> [X] invitations de projet reçues
> [X] projets en cours
>
> [Voir mes statistiques complètes →]
>
> ---
> Votre prochain renouvellement : le [date] — [montant].

**Note :**
- Toutes les données sont réelles — pas de valeur si la donnée est 0 (afficher 0 est honnête)
- Le résumé n'est envoyé que si l'abonnement est actif au moment de l'envoi

---

### WhatsApp — Résumé mensuel

```
Bonjour [Prénom],

*Kelen — [Mois]*
[X] vues de profil · [X] clics WhatsApp · [X] clics email

Statut : [Or / Argent / Non classé]
Renouvellement : [date]

→ [lien statistiques]
```

---

---

## Étape 10 — Relance inactivité (abonné sans nouveau projet depuis 60 jours)

**Déclencheur :** 60 jours sans nouveau projet ajouté, abonnement actif.
**Objectif :** Rappeler la valeur d'un portfolio actif — sans culpabiliser.
**Fréquence :** Une seule fois par période d'inactivité.

---

### Email — Inactivité portfolio

**Objet :** Votre profil n'a pas été mis à jour depuis 2 mois

**Corps :**

> Votre profil Kelen est en ligne — mais il n'a pas changé depuis 2 mois.
>
> Les clients qui consultent les profils actifs voient du travail récent.
> Un projet ajouté ce mois-ci montre que vous êtes disponible et actif.
>
> Vous avez livré un projet récemment ?
> Ajoutez-le en 5 minutes — quelques photos et une courte description suffisent.
>
> [Ajouter un projet →]

---

### WhatsApp — Inactivité portfolio

```
Bonjour [Prénom],

Votre profil Kelen n'a pas de nouveau projet depuis 2 mois.

Si vous avez livré un projet, ajoutez-le — ça prend 5 minutes et ça montre que vous êtes actif.

→ [lien ajout projet]
```

---

---

## Étape 11 — Rappel avant renouvellement (J-5)

**Déclencheur :** 5 jours avant la prochaine date de facturation.
**Objectif :** Informer — pas vendre. Le pro a déjà souscrit, cette notification est de service.

---

### Email — Rappel renouvellement

**Objet :** Votre abonnement Kelen se renouvelle le [date]

**Corps :**

> Votre abonnement Kelen se renouvelle automatiquement le [date].
>
> Montant : [montant] — [moyen de paiement].
>
> Si vous souhaitez annuler avant cette date :
> [Gérer mon abonnement →]
>
> ---
> Questions sur votre facturation : support@kelen.com

---

### WhatsApp — Rappel renouvellement

```
Bonjour [Prénom],

Votre abonnement Kelen se renouvelle le *[date]* — [montant].

Pour annuler avant cette date :
→ [lien gestion abonnement]
```

---

---

## Étape 12 — Échec de paiement

**Déclencheur :** Tentative de renouvellement échouée.
**Objectif :** Résoudre rapidement — ton factuel, pas alarmiste.

---

### Email — Échec de paiement

**Objet :** Votre paiement Kelen n'a pas abouti

**Corps :**

> Le renouvellement de votre abonnement Kelen du [date] n'a pas abouti.
>
> Votre profil reste visible pendant 48 heures.
> Après ce délai, il disparaîtra des résultats de recherche jusqu'au rétablissement du paiement.
>
> Pour régulariser votre abonnement :
> [Mettre à jour mon moyen de paiement →]
>
> ---
> Questions : support@kelen.com

---

### WhatsApp — Échec de paiement

```
Bonjour [Prénom],

Le renouvellement de votre abonnement Kelen n'a pas abouti.

Votre profil reste visible 48h. Mettez à jour votre paiement pour continuer.

→ [lien mise à jour paiement]
```

---

---

## Étape 13 — Post-résiliation (J+7)

**Déclencheur :** 7 jours après annulation de l'abonnement.
**Objectif :** Rappeler ce qui reste disponible — sans pression de retour.
**Condition :** N'envoyer qu'une seule fois après résiliation.

---

### Email — Post-résiliation

**Objet :** Ce qui reste sur votre profil Kelen

**Corps :**

> Votre abonnement Kelen est résilié.
>
> Voici ce qui reste actif sur votre profil gratuit :
>
> — Votre profil est en ligne et accessible par lien direct
> — Vos projets et photos sont conservés (les 3 premiers affichés)
> — Vos recommandations vérifiées restent publiées
> — Votre statut est conservé
>
> Ce qui n'est plus actif :
> — Vous n'apparaissez plus dans les résultats de recherche Kelen
> — Votre profil n'est plus indexé sur Google
>
> Si votre activité reprend et que vous souhaitez vous réabonner :
> [Réactiver mon abonnement →]

---

### WhatsApp — Post-résiliation

```
Bonjour [Prénom],

Votre abonnement est annulé.

Votre profil reste en ligne — accessible par lien direct, recommandations conservées.
Vous n'apparaissez plus dans les recherches Google et Kelen.

Si vous voulez vous réabonner : → [lien]
```

---

---

## Règles transversales lifecycle

### Fréquence et cadence

| Phase | Nb max de messages | Espacement minimum |
|-------|-------------------|--------------------|
| Activation (J0 → J30) | 5 messages | 3 jours entre chaque |
| Conversion (J7 → J30) | 3 messages | 7 jours entre chaque |
| Post-souscription | 3 messages | Espacés selon déclencheur |
| Rétention mensuelle | 1 résumé/mois | Mensuel fixe |
| Inactivité | 1 fois / 60 jours | Pas de répétition |
| Rappel renouvellement | 1 fois / cycle | J-5 uniquement |

### Arrêts automatiques

> **Arrêter la séquence d'activation** si :
> - Le pro ajoute des photos
> - Le pro s'abonne
>
> **Arrêter la séquence de conversion** si :
> - Le pro s'abonne
> - Le pro clique sur un lien de conversion (il a vu le message — ne pas insister)
> - Le pro a atteint J+30
>
> **Ne jamais envoyer deux messages le même jour** — quelle que soit la combinaison de déclencheurs.

### Ton WhatsApp vs Email

| Email | WhatsApp |
|-------|----------|
| Institutionnel sobre | Conversationnel direct |
| Peut aller sur 10 lignes | 3 à 6 lignes maximum |
| Titre + corps structuré | Pas de titre — message continu |
| Lien en fin de message | Lien sur une ligne dédiée avec → |
| HTML minimal | Texte brut uniquement |
| Nom complet possible | Prénom uniquement |

### Ce qu'on ne fait jamais

- Pas de "Vous avez été sélectionné" ou fausse exclusivité
- Pas de compte à rebours ("offre valable 24h")
- Pas de "Vos concurrents vous dépassent" — sauf le message J+14 qui reste factuel
- Pas de double envoi email + WhatsApp pour le même message
- Pas de message après J+30 si le pro n'a pas souscrit — respecter la décision
