# Kelen — Évolution Stratégique
*Mise à jour de la vision — Session du 10 mars 2026 · Révision du 23 mars 2026*

> Ce document complète et met à jour `01-philosophie-positionnement.md`.
> En cas de contradiction, ce document prévaut.

---

## Ce qui a changé

### 1. La plateforme s'étend aux professionnels de la diaspora en Europe

Kelen n'est plus uniquement un pont entre diaspora (client) et professionnels africains (prestataire). Un troisième profil émerge : **le professionnel africain installé en Europe**, qui a besoin des mêmes outils de crédibilité documentée pour accéder à des clients sérieux.

---

## Les trois profils utilisateurs

| Profil | Qui | Paie | Accès |
|--------|-----|------|-------|
| **Client** | Diaspora, investisseur, particulier | Gratuit | Vérification par nom, découverte, profils complets |
| **Pro Afrique** | Prestataire basé en Afrique | Abonnement — 3 000 FCFA/mois | Visibilité dans les recherches, outils de documentation |
| **Pro Europe** | Prestataire africain basé en Europe | Abonnement — €15/mois | Outils de documentation, visibilité, crédibilité diaspora |

**Règle absolue :** Le client ne paie jamais. Ni pour vérifier, ni pour découvrir, ni pour contacter.

---

## Le modèle économique consolidé

**Deux abonnements, deux marchés :**
- Pro Afrique → 3 000 FCFA/mois (~€4,50) — adapté au pouvoir d'achat local
- Pro Europe → €15/mois — aligné sur les tarifs européens

**Seuil de viabilité indicatif :** 1 000 pros Europe abonnés = €15 000/mois récurrent.
Suffisant pour faire tourner la plateforme sans dépendance aux gros contrats.

**Deux flux indépendants et complémentaires :**
- Abonnement pros Afrique → revenus récurrents, liés à la croissance du catalogue
- Abonnement pros Europe → revenus stables, prévisibles, faible churn

Ces deux flux se renforcent mutuellement. Plus de pros documentés = plus de valeur pour les clients = plus d'abonnés dans les deux segments.

---

## Les trois niveaux de signal positif

L'architecture de confiance passe de deux à trois niveaux.

### Niveau 1 — Portfolio (visible par tous, gratuit)
Photos de réalisations, description de projets. Aucune vérification externe requise.
Ce que ça dit : *"Voici ce que je sais faire."*

### Niveau 2 — Projet documenté (visible par tous, vérifié par Kelen)
Le pro uploade les documents légaux existants du projet : contrat signé, procès-verbal de livraison, photos horodatées.

**Flux :**
1. Pro uploade les documents
2. Kelen vérifie l'authenticité
3. Projet publié avec badge *"Documents de livraison vérifiés"*
4. Kelen notifie le client via l'email figurant sur le contrat
5. Le client confirme en un clic → le projet devient automatiquement une **Recommandation vérifiée**
6. Si le client ne répond pas → reste "Projet documenté"
7. Si le client infirme → ouverture d'une procédure signal

**Philosophie :** Kelen ne crée pas de nouveaux faits. Elle documente des faits qui existent déjà dans des documents légaux co-signés.

Ce que ça dit : *"Voici la preuve que je travaille avec rigueur."*

### Niveau 3 — Recommandation vérifiée (compte pour le statut Gold)
Acte volontaire du client, ou conversion automatique d'un projet documenté confirmé.
Compte dans le calcul du statut. Mis en avant dans les résultats de recherche.

Ce que ça dit : *"Un client a activement voulu témoigner de ce travail."*

### Signal rouge (permanent, irréversible)
Inchangé. Un signal vérifié = Liste Rouge permanente.

---

## Ce que voit chaque profil

| Contenu | Public non inscrit | Client (gratuit) | Pro abonné |
|---------|-------------------|------------------|------------|
| Statut Gold/Red/Grey | ✅ | ✅ | ✅ |
| Portfolio photos | ✅ | ✅ | ✅ |
| Projets documentés | ✅ | ✅ | ✅ |
| Recommandations vérifiées | ✅ | ✅ | ✅ |
| Outils de documentation chantier | ❌ | ❌ | ✅ |
| Analytics de profil | ❌ | ❌ | ✅ |

**Note :** La documentation chantier est un outil pro, pas un contenu réservé. Les clients voient le résultat (projet documenté). Seuls les pros ont accès aux outils pour créer ces dossiers.

---

## Le positionnement élargi

### Ce que Kelen était
Un outil anti-arnaque pour la diaspora investissant en Afrique.

### Ce que Kelen est
**L'infrastructure commerciale qui manque à la communauté africaine.**

Les communautés juive, chinoise, indienne, libanaise ont toutes des réseaux informels de confiance commerciale — des infrastructures qui connectent, valident, garantissent. La communauté africaine a les relations sociales. Elle n'a pas encore l'infrastructure commerciale.

Kelen est cette infrastructure.

---

## La vision en trois actes

### Acte 1 — Maintenant : Le registre de confiance
Pros africains construisent leur réputation documentée. Clients vérifient avant d'investir. La confiance devient un actif mesurable.

### Acte 2 — Dans 1-2 ans : Le réseau commercial
Les pros vérifiés deviennent des nœuds actifs. Un besoin entre dans le réseau — une usine cherche une machine au Burkina — le réseau qualifié répond. La réputation documentée d'aujourd'hui devient la qualification pour accéder aux opportunités de demain.

### Acte 3 — Plus tard : Les agents terrain
Interfaces physiques dans les marchés extérieurs — Chine, Asie, Europe. Ils sourcent, négocient, valident pour le compte du réseau africain. Kelen devient une chambre de commerce africaine décentralisée avec des représentants dans les places commerciales mondiales.

---

## L'effet de seuil

Kelen franchira un cap critique quand un client demandera à un pro *"Tu es sur Kelen ?"* avant même de discuter du projet. À ce moment, l'absence sera devenue un signal négatif en elle-même — non pas parce que Kelen l'aura imposé, mais parce que l'opacité dans un contexte de transactions à €20k-100k sera devenue rédhibitoire.

Ce cap s'impose non par technologie mais par philosophie. Les gens vérifieront d'abord, puis choisiront.

**Ce n'est pas une projection optimiste. C'est la mécanique naturelle de tout standard de confiance qui atteint une masse critique.**

---

## La phrase fondatrice — inchangée

> **"La confiance ne se promet pas. Elle se documente."**

---

## La nouvelle phrase de positionnement

> **"Kelen ne combat pas les arnaques. Kelen rend l'honnêteté avantageuse."**

---

## Ce que ça implique techniquement (pour le backend)

### Nouvelle table : `project_documents`
Stocke les documents de chantier uploadés par les pros. Liée à une table `projects` qui regroupe contrat, PV de livraison, photos horodatées.

### Nouveau champ dans `users` : `role`
Trois valeurs : `client`, `pro_africa`, `pro_europe`

### Nouveau flux : `project_confirmation`
Quand un projet documenté est publié, un email est envoyé au client (email extrait du contrat). Le client peut confirmer, ignorer, ou contester. La confirmation déclenche la création automatique d'une recommandation vérifiée.

### Abonnement Stripe pour pros Europe
Table `subscriptions` liée à `users`. Vérification Row Level Security sur l'accès aux outils de documentation.

### Abonnement pour pros Afrique (nouveau — remplace le CPM)
Même architecture Stripe que les pros Europe, avec un produit/prix distinct (3 000 FCFA/mois). La logique CPM est supprimée.
