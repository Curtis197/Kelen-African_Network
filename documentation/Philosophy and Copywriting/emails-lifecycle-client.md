# Kelen — Lifecycle Client — Email & WhatsApp
*Copywriting — Version 1.0 — Créé le 2026-04-25*

> Ce document couvre les messages de lifecycle envoyés aux clients.
>
> **Différence avec le lifecycle pro :**
> Le client ne paie rien — il n'y a pas de séquence de conversion.
> Le lifecycle client suit un seul axe : activation → engagement → contribution.
>
> Activation   = premier passage de visiteur à utilisateur actif (chercher, trouver)
> Engagement   = créer un projet, travailler avec un professionnel
> Contribution = soumettre une recommandation après un projet terminé
>
> **Règle de canal :**
> Même logique que le lifecycle pro.
> WhatsApp prioritaire si fourni. Email en fallback.
> Jamais les deux canaux pour le même déclencheur.

---

## Contraintes WhatsApp (rappel)

> - Messages sortants via WhatsApp Business API — templates pré-approuvés par Meta
> - Pas de HTML. *Gras* avec astérisques, _italique_ avec underscores
> - 3 à 6 lignes maximum — au-delà, ignoré
> - Un seul lien par message
> - Ton conversationnel — comme un message d'un vrai interlocuteur
> - Jamais deux messages consécutifs sans réponse du client

---

## Étape 1 — Bienvenue (post-inscription immédiate)

**Déclencheur :** Inscription complétée.
**Objectif :** Confirmer l'inscription. Orienter vers la première action utile : chercher.

---

### Email — Bienvenue

**Objet :** Votre compte Kelen est créé

**Corps :**

> Votre compte est actif.
>
> Kelen vous permet de trouver des professionnels africains,
> de consulter leurs réalisations réelles, et de gérer vos projets directement en ligne.
>
> Pour commencer : cherchez le professionnel dont vous avez besoin.
>
> [Rechercher un professionnel →]
>
> ---
> Des questions sur le fonctionnement de la plateforme : [lien comment ça marche]

---

### WhatsApp — Bienvenue

```
Bonjour [Prénom],

Votre compte Kelen est actif.

Cherchez le professionnel dont vous avez besoin :
→ [lien recherche]
```

---

---

## Étape 2 — Activation — pas de recherche (J+1)

**Déclencheur :** 24h après inscription, aucune recherche effectuée.
**Objectif :** Premier retour sur la plateforme.
**Condition :** N'envoyer qu'une seule fois.

---

### Email — J+1 sans recherche

**Objet :** Cherchez votre premier professionnel sur Kelen

**Corps :**

> Votre compte est actif, mais vous n'avez pas encore cherché de professionnel.
>
> Kelen référence des artisans, entrepreneurs et prestataires de service à travers l'Afrique.
> Chaque profil affiche le travail réel — photos de chantier, projets terminés, recommandations vérifiées.
>
> [Chercher un professionnel →]

---

### WhatsApp — J+1 sans recherche

```
Bonjour [Prénom],

Vous n'avez pas encore cherché de professionnel sur Kelen.

Tapez le métier dont vous avez besoin — les profils disponibles dans votre ville apparaissent.

→ [lien recherche]
```

---

---

## Étape 3 — Engagement — compte actif sans projet (J+7)

**Déclencheur :** J+7, au moins une recherche effectuée, aucun projet créé.
**Objectif :** Franchir le pas de la création de projet.
**Condition :** N'envoyer qu'une seule fois.

---

### Email — J+7 sans projet

**Objet :** Vous avez un projet en tête ?

**Corps :**

> Vous avez consulté des profils sur Kelen.
>
> Si vous avez un projet — rénovation, construction, plomberie, électricité, design — vous pouvez
> l'ouvrir directement sur la plateforme et inviter les professionnels qui vous intéressent.
>
> Ils reçoivent votre brief. Vous comparez leurs réponses. Vous choisissez.
> Tous les échanges, documents et étapes se gèrent au même endroit.
>
> [Créer un projet →]

---

### WhatsApp — J+7 sans projet

```
Bonjour [Prénom],

Vous avez un projet en tête ?

Créez-le sur Kelen et invitez les professionnels qui vous intéressent.
Devis, documents, suivi — tout au même endroit.

→ [lien création projet]
```

---

---

## Étape 4 — Confirmation projet créé

**Déclencheur :** Projet créé et professionnel invité.
**Objectif :** Confirmer et expliquer ce qui se passe ensuite.

---

### Email — Projet créé

**Objet :** Votre projet a été envoyé à [Nom professionnel]

**Corps :**

> Votre projet a bien été soumis à [Nom professionnel].
>
> Il recevra votre brief sous peu et pourra accepter ou décliner l'invitation.
> Vous serez notifié de sa réponse.
>
> Si vous souhaitez inviter d'autres professionnels pour comparer :
> [Ajouter un professionnel au projet →]
>
> Retrouvez votre projet à tout moment :
> [Voir mon projet →]

---

### WhatsApp — Projet créé

```
Bonjour [Prénom],

Votre projet a été envoyé à *[Nom professionnel]*.
Vous serez notifié dès qu'il répond.

→ [lien projet]
```

---

---

## Étape 5 — Relance si professionnel n'a pas répondu (J+3 après invitation)

**Déclencheur :** 3 jours après l'invitation, le professionnel n'a pas répondu.
**Objectif :** Proposer d'inviter un autre professionnel sans décourager.
**Condition :** Envoyer une seule fois par projet.

---

### Email — Professionnel sans réponse

**Objet :** [Nom professionnel] n'a pas encore répondu à votre projet

**Corps :**

> [Nom professionnel] n'a pas encore répondu à votre invitation.
>
> Cela peut arriver — les professionnels ne consultent pas toujours leurs notifications immédiatement.
>
> En attendant, vous pouvez inviter d'autres professionnels pour votre projet
> et comparer les réponses quand elles arrivent.
>
> [Inviter un autre professionnel →]

---

### WhatsApp — Professionnel sans réponse

```
Bonjour [Prénom],

*[Nom professionnel]* n'a pas encore répondu à votre projet.

Vous pouvez inviter d'autres professionnels en attendant.

→ [lien projet]
```

---

---

## Étape 6 — Professionnel a accepté

**Déclencheur :** Le professionnel accepte l'invitation au projet.
**Objectif :** Informer et orienter vers l'espace de collaboration.

---

### Email — Professionnel a accepté

**Objet :** [Nom professionnel] a accepté votre invitation

**Corps :**

> [Nom professionnel] a accepté de rejoindre votre projet.
>
> L'espace de collaboration est maintenant ouvert.
> Vous pouvez y échanger des messages, partager des documents, et définir les étapes du projet.
>
> [Accéder à l'espace de collaboration →]

---

### WhatsApp — Professionnel a accepté

```
Bonjour [Prénom],

*[Nom professionnel]* a accepté votre projet.

L'espace de collaboration est ouvert — échanges, documents, étapes.

→ [lien collaboration]
```

---

---

## Étape 7 — Projet terminé — nudge recommandation

**Déclencheur :** Projet marqué comme terminé (par le client ou le professionnel).
**Objectif :** Encourager la soumission d'une recommandation.
**Timing :** Envoyer 3 jours après la clôture du projet.

---

### Email — Recommandation post-projet

**Objet :** Votre projet avec [Nom professionnel] — un mot à dire ?

**Corps :**

> Votre projet avec [Nom professionnel] est terminé.
>
> Si vous êtes satisfait du travail — ou si quelque chose ne s'est pas passé comme prévu — vous pouvez
> le documenter sur Kelen.
>
> Votre témoignage aide les prochains clients à choisir.
> Il renforce ou nuance le profil du professionnel, selon votre expérience réelle.
>
> Cela prend environ 10 minutes.
> Des photos du projet et un contrat renforcent votre témoignage — mais ne sont pas obligatoires.
>
> [Soumettre une recommandation →]
>
> ---
> Pas de temps maintenant ? Retrouvez ce lien dans votre tableau de bord à tout moment.

---

### WhatsApp — Recommandation post-projet

```
Bonjour [Prénom],

Votre projet avec *[Nom professionnel]* est terminé.

Votre témoignage aide les prochains clients à choisir.
Ça prend environ 10 minutes.

→ [lien recommandation]
```

---

---

## Étape 8 — Recommandation soumise — confirmation

**Déclencheur :** Recommandation soumise avec succès.
**Objectif :** Confirmer la réception et informer du délai de vérification.

---

### Email — Recommandation reçue

**Objet :** Votre recommandation a été reçue

**Corps :**

> Votre recommandation concernant [Nom professionnel] a bien été reçue.
>
> Notre équipe l'examine dans un délai de 2 à 5 jours ouvrés.
> Vous recevrez une notification dès sa publication sur le profil du professionnel.

---

### WhatsApp — Recommandation reçue

```
Bonjour [Prénom],

Votre recommandation a bien été reçue.
Publication sous 2 à 5 jours ouvrés après vérification.
```

*(Pas de lien — message de confirmation pure, aucune action requise.)*

---

---

## Étape 9 — Recommandation publiée

**Déclencheur :** Recommandation vérifiée et publiée.
**Objectif :** Informer le client que son témoignage est en ligne.

---

### Email — Recommandation publiée

**Objet :** Votre recommandation est publiée

**Corps :**

> Votre recommandation concernant [Nom professionnel] a été vérifiée et publiée.
>
> Elle est maintenant visible sur son profil public.
>
> [Voir la recommandation publiée →]
>
> Merci — votre témoignage aide les prochains clients à choisir.

---

### WhatsApp — Recommandation publiée

```
Bonjour [Prénom],

Votre recommandation sur *[Nom professionnel]* est publiée.

→ [lien profil]
```

---

---

## Étape 10 — Réengagement (client inactif depuis 90 jours)

**Déclencheur :** 90 jours sans connexion ni activité.
**Objectif :** Rappel doux — pas de pression.
**Fréquence :** Une seule fois par période d'inactivité.

---

### Email — Réengagement

**Objet :** Des professionnels disponibles près de chez vous

**Corps :**

> Vous n'avez pas visité Kelen depuis un moment.
>
> Des professionnels actifs dans votre zone ont mis à jour leurs profils récemment.
>
> Si vous avez un projet en tête, c'est le bon moment pour chercher.
>
> [Voir les profils disponibles →]

---

### WhatsApp — Réengagement

```
Bonjour [Prénom],

Des professionnels actifs dans votre zone ont mis à jour leurs profils sur Kelen.

Si vous avez un projet : → [lien recherche]
```

---

---

## Règles transversales lifecycle client

### Fréquence et cadence

| Phase | Nb max de messages | Espacement minimum |
|-------|-------------------|--------------------|
| Activation (J0 → J7) | 3 messages | 1 jour minimum |
| Engagement (J7+) | 1 message | Déclencheur unique |
| Collaboration | Messages sur événements | Pas de cadence fixe |
| Contribution (recommandation) | 2 messages (nudge + confirmation) | 3 jours après projet |
| Réengagement | 1 message / 90 jours | Une fois par période |

### Arrêts automatiques

> **Arrêter la séquence d'activation** si :
> - Le client effectue une recherche
> - Le client crée un projet
>
> **Ne pas envoyer le nudge recommandation** si :
> - Le professionnel a décliné l'invitation (pas de projet réel)
> - Le projet a été annulé avant démarrage
>
> **Ne jamais envoyer deux messages le même jour** — quelle que soit la combinaison de déclencheurs.

### Ton spécifique au lifecycle client

Le client n'a rien acheté. Il n'a rien à perdre à partir.
Les messages ne peuvent pas être insistants.

> Email : informatif, une action claire, court
> WhatsApp : 3 lignes, une seule idée, un lien

Pas de "Vous nous manquez."
Pas de "Ne passez pas à côté."
Pas de compteur de professionnels ("1 247 professionnels vous attendent").

**La seule chose qui fait revenir un client : la plateforme était utile la dernière fois.**
Les messages le rappellent. Ils ne remplacent pas l'utilité.
