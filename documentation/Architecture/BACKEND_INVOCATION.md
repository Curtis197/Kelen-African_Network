# Kelen — Backend Invocation Reference (Frontend)

> **À qui s'adresse ce document :** au développeur frontend (Claude Code / Gemini).
> Il liste toutes les fonctions backend disponibles, comment les appeler depuis Next.js, et ce qu'elles retournent.
> Ne pas appeler les fonctions SQL directement depuis le client — utiliser les Edge Functions ou les Server Actions indiqués.

---

## Règle fondamentale

| Depuis | Peut appeler |
|---|---|
| Composant client (`'use client'`) | Edge Functions via `fetch`, Supabase client (SELECT/INSERT/UPDATE selon RLS) |
| Server Action / Route Handler | Edge Functions, Supabase avec service role, SQL functions via `supabase.rpc()` |
| Jamais depuis le client | `track_profile_view`, `compute_professional_status`, `credit_transactions` INSERT |

---

## Edge Functions

Base URL : `https://<project-ref>.supabase.co/functions/v1/`

---

### `process-payment`

**Quand l'appeler :** Quand le professionnel soumet le formulaire d'achat de crédit (`/pro/credit`)
**Qui peut l'appeler :** `professional` (JWT requis)
**Depuis :** Server Action ou Route Handler Next.js

**Appel :**
```typescript
const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/process-payment`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  },
  body: JSON.stringify({
    professional_id: 'uuid',
    amount_eur: 50.00,
    payment_method: 'stripe', // 'stripe' | 'wave' | 'orange_money'
    currency: 'EUR',          // 'EUR' | 'XOF'
  }),
})
const data = await response.json()
// data.redirect_url → rediriger vers cette URL pour le paiement
```

**Retour :**
```typescript
{
  provider: 'stripe' | 'wave',
  redirect_url: string,   // URL de la page de paiement externe
  session_id: string,     // référence interne
}
```

**Après paiement :** L'utilisateur est redirigé vers `/pro/credit?success=true` ou `/pro/credit?error=true`. Le crédit est crédité automatiquement par webhook — ne pas créditer manuellement côté frontend.

---

## SQL Functions (via `supabase.rpc()`)

Ces fonctions s'appellent depuis un Server Action ou un Route Handler avec le client Supabase côté serveur.

---

### `compute_professional_status`

**⚠️ Ne jamais appeler depuis le frontend.** Gérée automatiquement par les triggers. Listée ici pour information uniquement.

---

### `track_profile_view`

**Quand l'appeler :** À chaque chargement de la page `/pro/[slug]` — côté serveur uniquement
**Qui peut l'appeler :** Système (service role) — jamais depuis un composant client
**Depuis :** Server Component ou Route Handler Next.js

**Appel (dans un Server Component ou generateMetadata) :**
```typescript
const supabase = createServerComponentClient()

const { data, error } = await supabase.rpc('track_profile_view', {
  prof_id: professional.id,
  viewer_ip: headers().get('x-forwarded-for') ?? '',
  viewer_country: headers().get('cf-ipcountry') ?? '',
  source: searchParams.source ?? 'direct',   // 'search' | 'browse' | 'category' | 'direct'
  search_query: searchParams.q ?? null,
})
// data = true (vue enregistrée) | false (crédit épuisé ou plafond)
// Ne pas afficher d'erreur à l'utilisateur si false — comportement silencieux
```

**Retour :**
```typescript
boolean // true = vue comptabilisée, false = crédit épuisé ou plafond mensuel atteint
```

---

## Triggers automatiques (aucune action frontend requise)

Ces événements se produisent automatiquement après tes écritures en base. Tu n'as rien à appeler.

| Action frontend | Ce qui se passe automatiquement |
|---|---|
| INSERT dans `recommendations` | → File d'attente admin créée |
| INSERT dans `signals` | → File d'attente admin créée |
| Admin met `recommendations.verified = TRUE` | → Statut recalculé, notifications envoyées |
| Admin met `signals.verified = TRUE` | → Statut recalculé (Rouge/Noir), notifications urgentes |
| INSERT ou UPDATE dans `reviews` | → Statut recalculé (avg_rating, pct) |
| `professionals.credit_balance` tombe à 0 | → `is_active = FALSE`, email envoyé au pro |

---

## Queries Supabase directes (par page)

### Page publique — `/recherche`

**Mode A — Recherche par nom (validation)**
```typescript
// Tous statuts sauf 'black' — recherche par nom exact
const { data } = await supabase
  .from('professionals')
  .select('id, slug, business_name, owner_name, city, country, status, recommendation_count, signal_count, avg_rating, review_count')
  .ilike('owner_name', `%${query}%`)
  .neq('status', 'black')

// Note : les profils 'black' sont exclus même de la recherche par nom
```

**Mode B — Browse (découverte CPM)**
```typescript
// Uniquement les profils visibles (crédit actif) et non-black
const { data } = await supabase
  .from('professionals')
  .select('id, slug, business_name, owner_name, city, country, category, status, recommendation_count, avg_rating, review_count')
  .eq('is_visible', true)
  .neq('status', 'black')
  .eq('category', category)        // filtre optionnel
  .in('status', ['gold', 'silver']) // filtre optionnel "Or et Argent uniquement"
  .order('status', { ascending: false }) // gold avant silver avant white
```

---

### Page publique — `/pro/[slug]`

```typescript
// Profil complet — tous statuts (y compris black) accessibles via URL directe
const { data: professional } = await supabase
  .from('professionals')
  .select(`
    id, slug, business_name, owner_name, category, subcategories,
    country, city, status, recommendation_count, signal_count,
    avg_rating, positive_review_pct, review_count, is_visible,
    verified, created_at,
    -- Champs contact/portfolio : visibles uniquement si is_visible = TRUE (géré par RLS)
    phone, whatsapp, email, description, services_offered,
    portfolio_photos, portfolio_videos
  `)
  .eq('slug', slug)
  .single()

// Recommandations vérifiées publiques
const { data: recommendations } = await supabase
  .from('recommendations')
  .select('id, project_type, project_description, completion_date, budget_range, location, photo_urls, before_photos, after_photos, submitter_name, submitter_country, created_at')
  .eq('professional_id', professional.id)
  .eq('verified', true)
  .order('completion_date', { ascending: false })

// Signaux vérifiés publics
const { data: signals } = await supabase
  .from('signals')
  .select('id, breach_type, breach_description, severity, agreed_start_date, agreed_end_date, timeline_deviation, budget_deviation, pro_response, pro_responded_at, created_at')
  .eq('professional_id', professional.id)
  .eq('verified', true)
  .order('created_at', { ascending: false })

// Avis publics
const { data: reviews } = await supabase
  .from('reviews')
  .select('id, rating, comment, reviewer_name, reviewer_country, created_at, updated_at')
  .eq('professional_id', professional.id)
  .eq('is_hidden', false)
  .order('created_at', { ascending: false })
```

---

### Dashboard diaspora — `/dashboard`

```typescript
const userId = session.user.id

// Recommandations soumises par cet utilisateur
const { data: myRecommendations } = await supabase
  .from('recommendations')
  .select('id, professional_slug, project_type, status, verified, rejection_reason, created_at')
  .eq('submitter_id', userId)
  .order('created_at', { ascending: false })

// Signaux soumis par cet utilisateur
const { data: mySignals } = await supabase
  .from('signals')
  .select('id, professional_slug, breach_type, status, verified, rejection_reason, created_at')
  .eq('submitter_id', userId)
  .order('created_at', { ascending: false })
```

---

### Soumettre une recommandation — `/recommandation/[slug]`

```typescript
// 1. Uploader les fichiers dans Storage AVANT l'INSERT
const { data: contractUpload } = await supabase.storage
  .from('contracts')
  .upload(`${userId}/${Date.now()}-contract.pdf`, contractFile)

const { data: photosUpload } = await supabase.storage
  .from('evidence-photos')
  .upload(`${userId}/${Date.now()}-photo.jpg`, photoFile)

// 2. INSERT la recommandation avec les URLs Storage
const { data, error } = await supabase
  .from('recommendations')
  .insert({
    professional_id: professional.id,
    professional_slug: professional.slug,
    submitter_id: session.user.id,
    submitter_name: session.user.user_metadata.display_name,
    submitter_country: session.user.user_metadata.country,
    submitter_email: session.user.email,
    project_type: formData.project_type,
    project_description: formData.project_description,
    completion_date: formData.completion_date,
    budget_range: formData.budget_range,
    location: formData.location,
    contract_url: contractUpload.data.path,
    photo_urls: [photosUpload.data.path],
  })
// Le trigger add_to_queue_on_recommendation s'exécute automatiquement
```

---

### Soumettre un signal — `/signal/[slug]`

```typescript
const { data, error } = await supabase
  .from('signals')
  .insert({
    professional_id: professional.id,
    professional_slug: professional.slug,
    submitter_id: session.user.id,
    submitter_name: session.user.user_metadata.display_name,
    submitter_country: session.user.user_metadata.country,
    submitter_email: session.user.email,
    breach_type: formData.breach_type,
    breach_description: formData.breach_description,
    severity: formData.severity,
    agreed_start_date: formData.agreed_start_date,
    agreed_end_date: formData.agreed_end_date,
    timeline_deviation: formData.timeline_deviation,
    agreed_budget: formData.agreed_budget,
    actual_budget: formData.actual_budget,
    budget_deviation: formData.budget_deviation,
    contract_url: contractUrl,     // URL après upload Storage
    evidence_urls: evidenceUrls,   // URLs après upload Storage
  })
```

---

### Laisser un avis — `/avis/[slug]`

```typescript
// INSERT si premier avis, UPDATE si modification
const { data: existing } = await supabase
  .from('reviews')
  .select('id')
  .eq('professional_id', professional.id)
  .eq('reviewer_id', session.user.id)
  .single()

if (existing) {
  // Modifier l'avis existant
  await supabase
    .from('reviews')
    .update({ rating: formData.rating, comment: formData.comment })
    .eq('id', existing.id)
} else {
  // Premier avis
  await supabase
    .from('reviews')
    .insert({
      professional_id: professional.id,
      reviewer_id: session.user.id,
      reviewer_name: session.user.user_metadata.display_name,
      reviewer_country: session.user.user_metadata.country,
      rating: formData.rating,
      comment: formData.comment,
    })
}
// Le trigger on_review_submitted recalcule le statut automatiquement
```

---

### Dashboard professionnel — `/pro/dashboard`

```typescript
const professionalId = profile.professional.id

// Données du profil avec métriques (realtime)
const { data: pro } = await supabase
  .from('professionals')
  .select('status, recommendation_count, signal_count, avg_rating, positive_review_pct, review_count, credit_balance, total_views, current_month_views, is_visible, auto_reload_enabled, auto_reload_threshold, auto_reload_amount')
  .eq('user_id', session.user.id)
  .single()

// Recommandations en attente de liaison (verified mais pas encore linked)
const { data: pendingLink } = await supabase
  .from('recommendations')
  .select('id, project_type, completion_date, budget_range, submitter_name, created_at')
  .eq('professional_id', professionalId)
  .eq('verified', true)
  .eq('linked', false)

// Transactions récentes
const { data: transactions } = await supabase
  .from('credit_transactions')
  .select('id, type, amount, balance_after, description, created_at')
  .eq('professional_id', professionalId)
  .order('created_at', { ascending: false })
  .limit(10)
```

**Realtime (solde crédit) :**
```typescript
const channel = supabase
  .channel('pro-credit')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'professionals',
    filter: `id=eq.${professionalId}`,
  }, (payload) => {
    setCreditBalance(payload.new.credit_balance)
    setIsVisible(payload.new.is_visible)
  })
  .subscribe()
```

---

### Lier une recommandation — `/pro/recommandations`

```typescript
await supabase
  .from('recommendations')
  .update({ linked: true, linked_at: new Date().toISOString() })
  .eq('id', recommendationId)
  .eq('professional_id', professionalId) // sécurité : le pro ne peut lier que ses propres recs
// Le trigger on_recommendation_verified détecte le changement de 'linked' et recalcule le statut
```

---

### Répondre à un signal — `/pro/signal`

```typescript
await supabase
  .from('signals')
  .update({
    pro_response: formData.response,
    pro_evidence_urls: evidenceUrls, // URLs après upload Storage
    pro_responded_at: new Date().toISOString(),
  })
  .eq('id', signalId)
  .eq('professional_id', professionalId)
```

---

### Admin — File de vérification — `/admin/queue`

```typescript
// File d'attente FIFO
const { data: queue } = await supabase
  .from('verification_queue')
  .select('id, item_type, item_id, professional_id, status, created_at')
  .eq('status', 'pending')
  .order('created_at', { ascending: true }) // FIFO

// Réclamer un item
await supabase
  .from('verification_queue')
  .update({ status: 'in_review', assigned_to: session.user.id })
  .eq('id', queueItemId)
```

---

### Admin — Vérifier une recommandation — `/admin/queue/[id]`

```typescript
// Approuver
await supabase
  .from('recommendations')
  .update({
    verified: true,
    verified_at: new Date().toISOString(),
    verified_by: session.user.id,
    status: 'verified',
  })
  .eq('id', recommendationId)
// Les triggers s'exécutent : statut recalculé, notifications envoyées, queue complétée

// Rejeter
await supabase
  .from('recommendations')
  .update({
    status: 'rejected',
    rejection_reason: formData.reason,
    verified_by: session.user.id,
  })
  .eq('id', recommendationId)
```

---

### Admin — Vérifier un signal — `/admin/queue/[id]`

```typescript
// Approuver (déclenche Rouge ou Noir selon le total de signaux)
await supabase
  .from('signals')
  .update({
    verified: true,
    verified_at: new Date().toISOString(),
    verified_by: session.user.id,
    status: 'verified',
  })
  .eq('id', signalId)

// Rejeter
await supabase
  .from('signals')
  .update({
    status: 'rejected',
    rejection_reason: formData.reason,
    verified_by: session.user.id,
  })
  .eq('id', signalId)
```

---

## Supabase Auth

```typescript
// Inscription
await supabase.auth.signUp({
  email, password,
  options: {
    data: { display_name, country, role: 'user' } // ou 'professional'
  }
})

// Connexion
await supabase.auth.signInWithPassword({ email, password })

// Déconnexion
await supabase.auth.signOut()

// Récupérer la session côté serveur (Server Component)
const { data: { session } } = await supabase.auth.getSession()

// Récupérer l'utilisateur complet depuis la table users
const { data: user } = await supabase
  .from('users')
  .select('*')
  .eq('id', session.user.id)
  .single()
```

---

## Vues matérialisées (lecture seule)

```typescript
// Analytics pro — rafraîchies toutes les heures
const { data: analytics } = await supabase
  .from('professional_analytics_view')
  .select('*')
  .eq('professional_id', professionalId)
  .single()
// Retourne : views_this_month, clicks_this_month, views_last_30_days,
//            clicks_last_30_days, conversion_rate_30d, top_source, top_viewer_country

// Métriques plateforme admin — rafraîchies toutes les 15 minutes
const { data: metrics } = await supabase
  .from('platform_metrics_view')
  .select('*')
  .single()
// Retourne : total_users, total_professionals, gold_count, silver_count,
//            white_count, red_count, black_count, queue_size,
//            revenue_this_month, views_last_30_days, new_users_this_week
```
