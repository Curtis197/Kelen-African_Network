# Kelen — Pages dédiées espace professionnel
*Copywriting — Version 1.0 — Créé le 2026-04-25*

> Ce document couvre les quatre pages dédiées de l'espace professionnel.
> Ces pages sont distinctes de la SaaS landing (`marketing-pro.md`) et du tableau de bord (`03-pro-journey.md`).
>
> Pages couvertes :
> - `/pour-les-professionnels/comment-ca-marche`
> - `/pour-les-professionnels/tarifs`
> - `/pour-les-professionnels/faq`
> - `/pour-les-professionnels/contact`
>
> Navigation commune à toutes ces pages : voir section "Navigation (espace pro)" ci-dessous.

---

## Navigation (espace pro) — version mise à jour

```
Kelen     Comment ça marche · Tarifs · FAQ · Contact      [Se connecter]  [Créer mon profil →]
```

**Notes :**
- Chaque item de la nav pointe vers une URL dédiée (pas une ancre dans la landing)
- Le CTA "Créer mon profil →" est sticky sur desktop
- Sur mobile : hamburger, CTA reste visible en haut à droite
- "Kelen" logo ramène à `/pour-les-professionnels` (landing pro), pas à la homepage client `/`

---

---

## Page `/pour-les-professionnels/comment-ca-marche`

**Titre de page :** Comment ça marche

**Introduction :**
> Voici ce que Kelen fait exactement — de votre inscription à votre première prise de contact client.

---

### 1. Le profil — votre source unique

> Tout part d'un seul profil.
> Vous le remplissez une fois : nom, activité, localisation, photos, services, contact.
>
> Ce profil alimente automatiquement votre site web, votre portfolio PDF et votre fiche Google.
> Quand vous modifiez votre profil, tout se met à jour — sans action supplémentaire de votre part.

---

### 2. Le site web

> Votre site est accessible dès la fin de votre inscription.
> URL permanente : `kelen.com/votre-nom`

**Ce que vos clients voient :**

```
Hero          — Photo de votre meilleure réalisation · Votre nom · Accroche
Portfolio     — Galerie de vos projets avec photos, dates, localisation
À propos      — Présentation de votre activité · Vos valeurs
Contact       — Votre photo · Spécialité · Zone · Téléphone · WhatsApp · Email · Badge statut
```

> Votre visage n'apparaît pas en hero. Votre travail s'affiche en premier.
> Votre portrait apparaît dans la section contact — une fois la crédibilité établie.

**Profil gratuit :** Accessible par lien direct et visible dans les résultats de recherche Kelen. Rendu statique. Non indexé sur Google.

**Profil abonnement :** Rendu dynamique (SSR) — toujours à jour au chargement. Indexé sur Google. Inclus dans le sitemap XML. Balises Open Graph complètes pour le partage sur les réseaux sociaux.

---

### 3. Le portfolio PDF

> Depuis votre tableau de bord → onglet "Ma présence" → bouton "Télécharger mon PDF".
>
> Le document contient :

```
Page de garde   — Photo principale · Nom · Accroche · Coordonnées
Projets         — Chaque projet avec photos, description, dates, localisation
Services        — Catalogue de vos services et tarifs si renseignés
Contact         — Coordonnées complètes · Lien vers votre profil Kelen
```

> Vous le téléchargez. Vous l'envoyez sur WhatsApp. Vous l'imprimez.
> La prochaine fois que vous ajoutez un projet, vous régénérez le PDF en un clic.
> Le document est toujours à jour avec l'état de votre profil au moment de la génération.

---

### 4. La fiche Google My Business

> Votre fiche se synchronise automatiquement depuis votre profil Kelen.
>
> Elle apparaît dans Google Maps et dans les résultats de recherche locaux
> quand quelqu'un cherche votre métier dans votre ville.

**Ce qui se synchronise :**

```
Nom de l'activité   Catégorie professionnelle
Localisation        Photos de vos réalisations
Coordonnées         Horaires (si renseignés dans votre profil)
```

> Vous n'avez pas besoin d'un compte Google My Business existant.
> Kelen crée ou synchronise la fiche depuis votre profil.
> La synchronisation se déclenche automatiquement à chaque modification.

---

### 5. Le copywriting par l'IA

> Optionnel. Vous le déclenchez quand vous êtes prêt — ce n'est pas automatique.
>
> Depuis votre tableau de bord → "Générer mon texte de présentation".
> Vous répondez à cinq questions.

```
1. Vos valeurs personnelles           Sélectionnez 3 au maximum
   Honnêteté · Rigueur · Ponctualité · Transparence
   Excellence · Discrétion · Engagement · Simplicité

2. Vos qualités professionnelles      Sélectionnez 3 au maximum
   Ponctualité · Qualité de finition · Écoute · Accompagnement
   Réactivité · Respect du budget · Conseil · Fiabilité

3. Votre style de relation client     Un seul choix
4. Votre fréquence de communication  Un seul choix
5. Le projet dont vous êtes le plus fier  Texte libre, optionnel
```

> L'IA génère deux textes depuis vos réponses :
>
> — Une accroche courte (1 phrase) pour le haut de votre site
> — Un texte "À propos" (3 à 5 phrases) pour la section présentation
>
> Vous les approuvez ou les modifiez avant publication.
> Le résultat ressemble à ce que vous auriez écrit vous-même — en mieux mis en forme.

---

### 6. Les recommandations et le statut

**Qui soumet une recommandation ?**
> N'importe quel client avec qui vous avez travaillé.
> Il n'a pas besoin d'être inscrit sur Kelen.

**Ce qu'il soumet :**

```
Type de projet     Localisation      Période du projet
Note (1 à 5)       Texte de témoignage (50 à 500 caractères)
Photos (optionnel) Contrat ou devis en pièce jointe (optionnel)
```

**Ce que Kelen fait :**
> Notre équipe examine la cohérence des éléments entre eux.
> Nous vérifions que le projet décrit est plausible au vu des preuves fournies.
> Nous ne vérifions pas l'authenticité absolue — nous vérifions la cohérence.
>
> Si tout est cohérent : nous publions.
> Si les éléments sont insuffisants ou incohérents : nous rejetons et notifions le client.

**Ce que vous faites :**
> Vous recevez une notification.
> Depuis votre tableau de bord → "Mes projets" → "Recommandations" :
> vous liez la recommandation à votre profil, ou vous indiquez qu'il ne s'agit pas de votre projet.

**Ce que ça change sur votre profil :**

```
0 recommandation vérifiée           —  Non classé
1 à 2 · note ≥ 4,0 · 80%+ positifs ⚪  Argent
3+   · note ≥ 4,5 · 90%+ positifs  🟡  Or
```

> Le statut est recalculé automatiquement à chaque recommandation publiée.
> Il apparaît sur votre profil public.

---

### 7. La collaboration client

> Les clients inscrits sur Kelen peuvent vous inviter sur un projet.
> Vous recevez une notification et une description du projet.
>
> Vous acceptez ou déclinez depuis votre tableau de bord.
>
> Si vous acceptez, l'espace de collaboration s'ouvre :

```
Échanges    — Messagerie directe avec le client
Documents   — Partage de devis, contrats, plans, photos
Étapes      — Suivi des phases du projet avec statuts
```

> Tous les échanges restent accessibles à vie, pour vous et pour le client.
> Aucun message perdu sur WhatsApp. Aucun email éparpillé.

> *Cette fonctionnalité est incluse dans l'abonnement uniquement.*

---

**CTA bas de page :**
> [Créer mon profil gratuitement →]     [Voir les tarifs →]

---

---

## Page `/pour-les-professionnels/tarifs`

**Titre de page :** Tarifs

**Headline :**
> Un seul abonnement.
> Pas de commission. Pas d'engagement.

---

### Le principe

> Votre profil de base est gratuit à vie.
>
> Votre profil est visible sur Kelen dès l'inscription.
> L'abonnement vous indexe sur Google et débloque les fonctionnalités avancées.
>
> **Ce que l'abonnement achète : Google + les outils avancés.**
> **Ce que l'abonnement n'achète pas : la réputation.**

---

### Comparaison complète

```
                                    Gratuit    Abonnement
                                               3 000 FCFA / 15 €/mois

PRÉSENCE
Profil public                          ✓           ✓
Site web                               ✓           ✓
URL permanente (kelen.com/votre-nom)   ✓           ✓
Recherche par nom                      ✓           ✓

VISIBILITÉ
Apparition dans les résultats Kelen    ✓           ✓
Indexation Google (SEO)                —           ✓
Rendu dynamique (SSR)                  —           ✓    profil toujours à jour
Balises Open Graph (partage social)    —           ✓
Inclusion sitemap XML                  —           ✓

CONTENU
Projets affichés                       3        Illimité
Photos                                15        Illimité
Vidéos dans les projets                —           ✓

SORTIES
Export PDF portfolio                   ✓           ✓
Synchronisation Google My Business     —           ✓

PERSONNALISATION
Style et couleurs du site              —           ✓
Upload logo + branding automatique     —           ✓

ANALYTICS
Statistiques de base (vues profil)     ✓           ✓
Statistiques avancées (6 mois,
  sources trafic, clics contact)       —           ✓
Google Analytics (GA4)                 —           ✓

COLLABORATION
Module de collaboration client         —           ✓
Gestion de projets clients             —           ✓

COMMUN AUX DEUX NIVEAUX
IA copywriting (accroche + À propos)   ✓           ✓
Journal de chantier                    ✓           ✓
Réception de recommandations           ✓           ✓
Badge de statut (Or/Argent/Non classé) ✓           ✓
Notifications email et in-app          ✓           ✓
```

---

### Ce que l'abonnement ne change jamais

```
✗  Votre statut (Or, Argent, Non classé)
   Il dépend uniquement des recommandations vérifiées soumises par vos clients.

✗  Votre position relative dans les résultats par rapport à d'autres professionnels
   Le classement est basé sur la pertinence, la proximité et l'expérience documentée.

✗  La gratuité pour vos clients
   Vos clients ne paient jamais pour vous trouver, vous contacter ou collaborer avec vous.
```

---

### Modalités de paiement

```
Afrique de l'Ouest     3 000 FCFA / mois
                       Wave · Orange Money · MTN Mobile Money

Europe                 15 € / mois
                       Carte bancaire (Visa, Mastercard) via Stripe
```

> Sans engagement. Vous annulez quand vous voulez depuis votre tableau de bord.
> Les mois entamés ne sont pas remboursés.
> Votre profil gratuit reste actif après résiliation — vous restez visible sur Kelen mais disparaissez de l'indexation Google.

---

### FAQ Tarifs

**L'abonnement améliore-t-il mon statut ?**
> Non. Le statut Or, Argent ou Non classé dépend uniquement des recommandations vérifiées soumises par vos clients. Vous pouvez être Or sans abonnement, et Non classé avec un abonnement.

**Que se passe-t-il si j'annule ?**
> Votre profil reste en ligne, visible sur Kelen et accessible par lien direct. Vos recommandations restent publiées. Vous disparaissez de l'indexation Google jusqu'à votre prochain abonnement.

**Puis-je commencer gratuitement et m'abonner plus tard ?**
> Oui. Créez votre profil, ajoutez vos réalisations, partagez votre lien à vos clients actuels. Activez l'abonnement quand vous voulez être découvert par de nouveaux clients.

**Le tarif est-il le même partout ?**
> Non. Le tarif dépend de votre pays de résidence au moment de l'inscription. Professionnels en Afrique de l'Ouest : 3 000 FCFA/mois. Professionnels en Europe : 15 €/mois.

**Puis-je être remboursé si je ne suis pas satisfait ?**
> Les mois entamés ne sont pas remboursés. L'abonnement donne accès à la visibilité sur la plateforme — il ne garantit pas un nombre de contacts ou de projets conclus.

**Y a-t-il des frais cachés ou des commissions ?**
> Non. Kelen ne prend aucune commission sur les projets que vous concluez via la plateforme. Le seul coût est l'abonnement mensuel.

---

**CTA bas de page :**
> [Créer mon profil gratuitement →]

---

---

## Page `/pour-les-professionnels/faq`

**Titre de page :** Questions fréquentes

---

### Avant de s'inscrire

**Kelen est-il fait pour mon métier ?**
> Kelen accueille tout professionnel qui propose des services dans les domaines de la construction, rénovation, artisanat, architecture, design, ingénierie et secteurs connexes. Si vous livrez un travail à un client et que vous pouvez le documenter en photos, Kelen est fait pour vous.

**Faut-il être une entreprise formelle pour s'inscrire ?**
> Non. Vous pouvez vous inscrire en tant qu'indépendant, artisan, ou chef d'entreprise. Kelen ne demande pas de numéro SIRET ou d'immatriculation au registre du commerce pour créer un profil.

**Kelen est-il disponible dans mon pays ?**
> Kelen est accessible depuis tous les pays. Le lancement commercial est centré sur l'Afrique francophone (Sénégal, Côte d'Ivoire, Mali, Cameroun, Gabon, Congo) et l'Europe francophone (France, Belgique, Suisse, Luxembourg). Les professionnels d'autres pays peuvent s'inscrire — leur profil sera visible par les clients qui les cherchent directement.

**Combien de temps prend l'inscription ?**
> Entre 10 et 20 minutes pour une inscription complète avec photos. Si vous n'avez pas de photos prêtes, vous pouvez compléter l'inscription en 5 minutes et ajouter vos réalisations plus tard.

---

### Profil et visibilité

**Mon profil est-il visible immédiatement après l'inscription ?**
> Oui. Votre profil est accessible par son URL et visible dans les résultats de recherche Kelen dès la fin de l'inscription. Avec l'abonnement, il est également indexé sur Google dans les 24 à 48 heures suivant l'activation.

**Puis-je avoir plusieurs profils ?**
> Non. Chaque professionnel dispose d'un profil unique. Si vous exercez plusieurs métiers, vous pouvez les indiquer comme spécialités secondaires sur votre profil principal.

**Puis-je désactiver temporairement mon profil ?**
> Oui. Depuis votre tableau de bord → Paramètres → "Désactiver temporairement mon profil". Votre profil disparaît des résultats et n'est plus accessible publiquement. Votre historique et vos recommandations sont conservés. Vous réactivez quand vous voulez.

**Mon site web est-il vraiment indexé sur Google ?**
> Oui, avec l'abonnement. Votre page est incluse dans le sitemap XML soumis à Google, rendue en server-side rendering avec des balises méta dynamiques, et optimisée pour les requêtes géo + métier ("plombier Dakar", "électricien Abidjan"). L'indexation prend généralement 24 à 72 heures après activation.

**Puis-je avoir mon propre nom de domaine ?**
> Oui, avec l'abonnement. Depuis votre tableau de bord, vous pouvez associer votre propre nom de domaine à votre profil Kelen.

---

### Portfolio et contenu

**Combien de photos puis-je ajouter ?**
> Profil gratuit : 15 photos au total. Abonnement : illimité.

**Quels formats d'images sont acceptés ?**
> JPEG, PNG et WebP. Taille maximale par photo : 5 Mo. Les images sont automatiquement compressées pour le web sans perte visible de qualité.

**Puis-je ajouter des vidéos ?**
> Oui, avec l'abonnement. Les vidéos sont uploadées dans votre espace de stockage et s'intègrent dans vos projets portfolio.

**Puis-je supprimer un projet de mon portfolio ?**
> Oui. Depuis votre tableau de bord → "Mon profil" → "Portfolio". La suppression d'un projet ne supprime pas les recommandations qui lui sont liées — elles restent publiées sur votre profil.

---

### Recommandations et statut

**Comment un client soumet-il une recommandation ?**
> Depuis votre profil public → "Vous avez travaillé avec ce professionnel ? Laissez une recommandation". Le client remplit un formulaire, ajoute des preuves optionnelles (photos, contrat), et soumet. Votre équipe examine. Vous êtes notifié à la publication.

**Le client doit-il être inscrit sur Kelen pour soumettre une recommandation ?**
> Non. Votre client peut soumettre une recommandation sans compte Kelen. Il donne simplement son prénom et sa ville pour que la recommandation soit publiée.

**Combien de temps prend la vérification ?**
> Entre 2 et 5 jours ouvrés. Vous êtes notifié par email dès que la décision est prise.

**Puis-je contester une recommandation publiée me concernant ?**
> Oui. Si une recommandation publiée est inexacte ou ne vous concerne pas, contactez support@kelen.com avec les éléments justificatifs. Notre équipe examine et prend une décision.

**L'abonnement améliore-t-il mon statut ?**
> Non. Le statut est calculé uniquement à partir des recommandations vérifiées : leur nombre, leur note moyenne, et le pourcentage d'avis positifs. L'abonnement n'intervient pas dans ce calcul.

**Puis-je perdre un statut Or ou Argent ?**
> Oui, si vos recommandations existantes sont contestées et retirées, ou si de nouvelles recommandations négatives modifient votre note moyenne en dessous du seuil requis.

---

### Abonnement et paiement

**Comment résilier mon abonnement ?**
> Depuis votre tableau de bord → "Abonnement" → "Annuler mon abonnement". La résiliation est immédiate. L'abonnement reste actif jusqu'à la fin de la période déjà payée.

**Puis-je suspendre mon abonnement sans le résilier ?**
> Non. L'abonnement est mensuel sans suspension partielle. Vous pouvez résilier à tout moment et vous réabonner quand vous êtes prêt.

**Mes données sont-elles conservées après résiliation ?**
> Oui. Votre profil, vos projets, vos recommandations et votre historique sont conservés. Vous pouvez vous réabonner à tout moment et retrouver votre profil dans l'état où vous l'avez laissé.

**L'abonnement couvre-t-il plusieurs pays simultanément ?**
> Oui. Un abonnement couvre votre profil quelle que soit votre zone d'intervention déclarée.

---

### Technique

**Le site web fonctionne-t-il sur mobile ?**
> Oui. Les profils Kelen sont responsive — ils s'adaptent à tous les écrans. Votre profil est conçu pour être consulté sur mobile en priorité, la majorité des clients visitant depuis leur téléphone.

**Que se passe-t-il si je perds ma connexion en remplissant le journal de chantier ?**
> Le journal de chantier fonctionne hors ligne. Vos saisies sont enregistrées localement et synchronisées automatiquement dès que la connexion revient.

**Comment modifier l'URL de mon profil ?**
> L'URL est générée depuis votre nom d'activité à l'inscription. Pour la modifier, contactez support@kelen.com. Une modification d'URL peut affecter temporairement le référencement Google de votre profil.

---

---

## Page `/pour-les-professionnels/contact`

**Titre de page :** Nous contacter

**Introduction :**
> Selon votre situation, le bon canal n'est pas le même.
> Choisissez ci-dessous.

---

### Avant de vous inscrire

> **Vous avez une question avant de créer votre profil.**
>
> Consultez d'abord la [FAQ](/pour-les-professionnels/faq) — la plupart des questions sont couvertes.
>
> Si vous ne trouvez pas la réponse :
> bonjour@kelen.com
> *Délai de réponse : 3 jours ouvrés*

---

### Votre compte et votre profil

> **Problème avec votre profil, votre site web, votre tableau de bord.**
>
> support@kelen.com
>
> Dans votre message, précisez :
> - L'URL de votre profil (`kelen.com/votre-nom`)
> - La description du problème
> - Une capture d'écran si possible
>
> *Délai de réponse : 3 jours ouvrés*

---

### Abonnement et facturation

> **Question sur votre abonnement, votre paiement, une facture.**
>
> support@kelen.com — en précisant "facturation" dans l'objet
>
> *Délai de réponse : 2 jours ouvrés*

---

### Recommandations

> **Une recommandation publiée sur votre profil est inexacte ou ne vous concerne pas.**
>
> support@kelen.com — en précisant "recommandation" dans l'objet
> Joignez les éléments justificatifs.
>
> *Délai de réponse : 5 jours ouvrés*

---

### Vérification en cours

> **Vous avez soumis une recommandation concernant un professionnel et souhaitez un suivi.**
>
> verification@kelen.com
>
> *Délai de réponse : 2 jours ouvrés*

---

### Données personnelles (RGPD)

> **Exercice de vos droits sur vos données : accès, rectification, suppression, portabilité.**
>
> rgpd@kelen.com
>
> *Délai de réponse : 30 jours ouvrés (délai légal)*

---

### Note de bas de page

> Kelen ne fournit pas de conseil juridique.
> Kelen ne peut pas intervenir dans les litiges commerciaux entre vous et vos clients.
> Pour ces situations, consultez les autorités compétentes de votre pays ou un professionnel du droit.
