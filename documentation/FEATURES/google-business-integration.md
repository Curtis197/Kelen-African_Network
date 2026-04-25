# Google Business Integration — Kelen Implementation Guide

## Overview

This document covers the full implementation of Google Business Profile (GBP) integration for Kelen. The goal is to allow professionals to create or connect their Google Business profile directly from their Kelen onboarding flow, making them discoverable on Google Maps and Google Search without any technical knowledge.

**User outcome:** A pro signs up on Kelen, completes their profile, and appears on Google Maps for their trade and city within days.

---

## Architecture Overview

```
Kelen Pro Profile
      │
      ▼
Google OAuth 2.0 (user authorization)
      │
      ▼
Google Business Profile API
      │
      ├── Create/claim business location
      ├── Sync profile data (name, trade, location, phone)
      ├── Push portfolio photos
      └── Link Kelen profile URL as website

Google Places API (no OAuth — public data)
      │
      └── Fetch reviews → cache in Supabase → display on portfolio
```

---

## Prerequisites

### Google Cloud Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project — `kelen-production`
3. Enable the following APIs:
   - **My Business Business Information API**
   - **My Business Account Management API**
   - **My Business Verifications API**
   - **My Business Place Actions API**
   - **Places API** (for reading public reviews — no OAuth required)
4. Create OAuth 2.0 credentials:
   - Application type: **Web application**
   - Authorized redirect URIs:
     - `https://kelen.co/api/auth/google/callback`
     - `https://localhost:3000/api/auth/google/callback` (development)
5. Note your `CLIENT_ID` and `CLIENT_SECRET`

### Required OAuth Scopes

```
https://www.googleapis.com/auth/business.manage
```

### Environment Variables

```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=https://kelen.co/api/auth/google/callback
```

---

## Implementation Steps

### Step 1 — OAuth Authorization Flow

Create the authorization endpoint. When a pro clicks "Connect to Google Maps" in their dashboard:

```javascript
// /api/auth/google/authorize.js

import { generateAuthUrl } from '@/lib/google-auth';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const proId = searchParams.get('proId');

  const state = Buffer.from(JSON.stringify({ proId })).toString('base64');

  const authUrl = generateAuthUrl({
    scope: ['https://www.googleapis.com/auth/business.manage'],
    state,
    access_type: 'offline', // Required for refresh token
    prompt: 'consent',
  });

  return Response.redirect(authUrl);
}
```

```javascript
// /lib/google-auth.js

import { google } from 'googleapis';

export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export function generateAuthUrl(options) {
  return oauth2Client.generateAuthUrl(options);
}
```

### Step 2 — OAuth Callback Handler

```javascript
// /api/auth/google/callback.js

import { oauth2Client } from '@/lib/google-auth';
import { supabase } from '@/lib/supabase';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  // Decode state to get proId
  const { proId } = JSON.parse(Buffer.from(state, 'base64').toString());

  try {
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    // Store tokens securely in Supabase
    // IMPORTANT: encrypt tokens before storing
    await supabase
      .from('pro_google_tokens')
      .upsert({
        pro_id: proId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
        connected_at: new Date().toISOString(),
      });

    // Redirect back to dashboard with success
    return Response.redirect('https://kelen.co/dashboard?google=connected');

  } catch (error) {
    console.error('Google OAuth error:', error);
    return Response.redirect('https://kelen.co/dashboard?google=error');
  }
}
```

### Step 3 — Supabase Table

```sql
-- Run in Supabase SQL editor

CREATE TABLE pro_google_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pro_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expiry_date BIGINT,
  gbp_account_name TEXT,     -- Google Business account identifier
  gbp_location_name TEXT,    -- Google Business location identifier
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ,
  UNIQUE(pro_id)
);

-- Enable RLS
ALTER TABLE pro_google_tokens ENABLE ROW LEVEL SECURITY;

-- Only the pro can read their own tokens
CREATE POLICY "Pro can read own tokens"
  ON pro_google_tokens FOR SELECT
  USING (auth.uid() = pro_id);
```

### Step 4 — Create Google Business Location

After OAuth connection, create or link the business profile:

```javascript
// /api/google/create-business.js

import { google } from 'googleapis';
import { getProTokens, refreshTokenIfNeeded } from '@/lib/google-auth';

export async function POST(request) {
  const { proId } = await request.json();

  // Get stored tokens
  const tokens = await getProTokens(proId);
  const oauth2Client = await refreshTokenIfNeeded(tokens, proId);

  // Get pro profile data from Supabase
  const { data: pro } = await supabase
    .from('professionals')
    .select('*')
    .eq('id', proId)
    .single();

  try {
    // Step 4a: Get Google Business Account
    const mybusinessaccountmanagement = google.mybusinessaccountmanagement({
      version: 'v1',
      auth: oauth2Client,
    });

    const accountsResponse = await mybusinessaccountmanagement.accounts.list();
    const account = accountsResponse.data.accounts[0];
    const accountName = account.name; // e.g., "accounts/123456789"

    // Step 4b: Create Business Location
    const mybusinessbusinessinformation = google.mybusinessbusinessinformation({
      version: 'v1',
      auth: oauth2Client,
    });

    const locationData = {
      title: pro.business_name || `${pro.first_name} ${pro.last_name}`,
      phoneNumbers: {
        primaryPhone: pro.phone,
      },
      categories: {
        primaryCategory: {
          name: mapKelenCategoryToGBP(pro.trade_category),
        },
      },
      storefrontAddress: {
        addressLines: [pro.address],
        locality: pro.city,
        administrativeArea: pro.region,
        postalCode: pro.postal_code,
        regionCode: pro.country_code, // 'CI' for Côte d'Ivoire, 'FR' for France
      },
      websiteUri: `https://kelen.co/${pro.username}`,
      profile: {
        description: pro.bio || `Professional ${pro.trade_category} on Kelen`,
      },
    };

    const location = await mybusinessbusinessinformation.locations.create({
      parent: accountName,
      requestId: `kelen-${proId}-${Date.now()}`,
      requestBody: locationData,
    });

    const locationName = location.data.name;

    // Store location reference in Supabase
    await supabase
      .from('pro_google_tokens')
      .update({
        gbp_account_name: accountName,
        gbp_location_name: locationName,
        last_synced_at: new Date().toISOString(),
      })
      .eq('pro_id', proId);

    return Response.json({
      success: true,
      locationName,
      message: 'Business profile created. Verification required.',
    });

  } catch (error) {
    console.error('GBP creation error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
```

### Step 5 — Category Mapping

Map Kelen trade categories to Google Business categories:

```javascript
// /lib/gbp-categories.js

export function mapKelenCategoryToGBP(kelenCategory) {
  const categoryMap = {
    // Construction
    'maçonnerie': 'gcid:masonry_contractor',
    'plomberie': 'gcid:plumber',
    'électricité': 'gcid:electrician',
    'menuiserie': 'gcid:carpenter',
    'peinture': 'gcid:painter',
    'carrelage': 'gcid:tile_contractor',
    'toiture': 'gcid:roofing_contractor',
    'climatisation': 'gcid:hvac_contractor',
    'renovation': 'gcid:general_contractor',
    // Digital
    'développeur': 'gcid:software_company',
    'designer': 'gcid:graphic_designer',
    'webmaster': 'gcid:internet_marketing_service',
    // Default
    'default': 'gcid:contractor',
  };

  return categoryMap[kelenCategory?.toLowerCase()] || categoryMap['default'];
}
```

### Step 6 — Photo Sync

Push project photos from Kelen to Google Business:

```javascript
// /api/google/sync-photos.js

export async function POST(request) {
  const { proId } = await request.json();

  const tokens = await getProTokens(proId);
  const oauth2Client = await refreshTokenIfNeeded(tokens, proId);

  // Get pro's recent project photos from Supabase
  const { data: photos } = await supabase
    .from('project_photos')
    .select('*')
    .eq('pro_id', proId)
    .order('created_at', { ascending: false })
    .limit(10); // Google recommends 10+ photos

  const { gbp_location_name } = await getProGBPData(proId);

  // Note: Photo upload requires the photo URL to be publicly accessible
  // Kelen photos stored in Supabase Storage are already public

  for (const photo of photos) {
    try {
      await fetch(
        `https://mybusiness.googleapis.com/v4/${gbp_location_name}/media`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mediaFormat: 'PHOTO',
            locationAssociation: {
              category: 'AT_WORK',
            },
            sourceUrl: photo.url,
          }),
        }
      );
    } catch (error) {
      console.error(`Failed to sync photo ${photo.id}:`, error);
      // Continue with remaining photos — don't block on single failure
    }
  }

  return Response.json({ success: true, synced: photos.length });
}
```

### Step 7 — Verification Flow Handler

Google requires business verification before the profile goes live on Maps. Handle this gracefully in the UI:

```javascript
// /api/google/request-verification.js

export async function POST(request) {
  const { proId, method } = await request.json();
  // method: 'PHONE_CALL' | 'SMS' | 'EMAIL' | 'ADDRESS'

  const tokens = await getProTokens(proId);
  const oauth2Client = await refreshTokenIfNeeded(tokens, proId);
  const { gbp_location_name } = await getProGBPData(proId);

  const mybusinessverifications = google.mybusinessverifications({
    version: 'v1',
    auth: oauth2Client,
  });

  const verification = await mybusinessverifications.locations.verify({
    name: gbp_location_name,
    requestBody: {
      method,
      // For SMS/PHONE_CALL — phone number is pulled from profile
      // For EMAIL — email address is pulled from profile
    },
  });

  return Response.json({
    success: true,
    verificationId: verification.data.name,
    message: `Verification code sent via ${method}`,
  });
}
```

### Step 8 — Profile Sync on Update

When a pro updates their Kelen profile, sync changes to GBP automatically:

```javascript
// /api/google/sync-profile.js

export async function syncToGBP(proId) {
  const tokens = await getProTokens(proId);
  if (!tokens) return; // Pro hasn't connected GBP yet

  const oauth2Client = await refreshTokenIfNeeded(tokens, proId);
  const { gbp_location_name } = await getProGBPData(proId);

  const { data: pro } = await supabase
    .from('professionals')
    .select('*')
    .eq('id', proId)
    .single();

  const mybusinessbusinessinformation = google.mybusinessbusinessinformation({
    version: 'v1',
    auth: oauth2Client,
  });

  await mybusinessbusinessinformation.locations.patch({
    name: gbp_location_name,
    updateMask: 'title,phoneNumbers,websiteUri,profile',
    requestBody: {
      title: pro.business_name,
      phoneNumbers: { primaryPhone: pro.phone },
      websiteUri: `https://kelen.co/${pro.username}`,
      profile: { description: pro.bio },
    },
  });

  await supabase
    .from('pro_google_tokens')
    .update({ last_synced_at: new Date().toISOString() })
    .eq('pro_id', proId);
}
```

---

## UI Implementation

### Dashboard Connection Button

```jsx
// /components/GoogleBusinessConnect.jsx

export function GoogleBusinessConnect({ proId, isConnected, verificationStatus }) {

  if (isConnected && verificationStatus === 'VERIFIED') {
    return (
      <div className="gbp-status verified">
        ✅ Visible sur Google Maps
      </div>
    );
  }

  if (isConnected && verificationStatus === 'PENDING') {
    return (
      <div className="gbp-status pending">
        ⏳ Vérification en cours — consultez votre téléphone ou email
      </div>
    );
  }

  return (
    <button
      onClick={() => window.location.href = `/api/auth/google/authorize?proId=${proId}`}
      className="btn-google-connect"
    >
      <GoogleIcon />
      Apparaître sur Google Maps
    </button>
  );
}
```

### Onboarding Step

Add as optional step 3 in the pro onboarding flow:

```
Step 1 — Create profile (name, trade, location, photo)
Step 2 — Add first project
Step 3 — Connect Google Maps (optional but recommended)
```

Messaging for step 3:

> **Soyez trouvé sur Google Maps**
> Les clients qui cherchent un [métier] à [ville] vous trouveront directement.
> Connexion en 30 secondes.
> [Connecter mon compte Google]
> [Passer cette étape]

---

## Token Management

### Refresh Token Utility

```javascript
// /lib/google-auth.js (additions)

export async function refreshTokenIfNeeded(tokens, proId) {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  client.setCredentials(tokens);

  // Refresh if expiring within 5 minutes
  if (tokens.expiry_date < Date.now() + 5 * 60 * 1000) {
    const { credentials } = await client.refreshAccessToken();

    await supabase
      .from('pro_google_tokens')
      .update({
        access_token: credentials.access_token,
        expiry_date: credentials.expiry_date,
      })
      .eq('pro_id', proId);

    client.setCredentials(credentials);
  }

  return client;
}

export async function getProTokens(proId) {
  const { data } = await supabase
    .from('pro_google_tokens')
    .select('*')
    .eq('pro_id', proId)
    .single();

  return data;
}

export async function getProGBPData(proId) {
  const { data } = await supabase
    .from('pro_google_tokens')
    .select('gbp_account_name, gbp_location_name')
    .eq('pro_id', proId)
    .single();

  return data;
}
```

---

## Error Handling

| Error | Cause | Handling |
|---|---|---|
| `PERMISSION_DENIED` | OAuth scope missing | Re-authorize with correct scope |
| `ALREADY_EXISTS` | Business already claimed | Guide pro to claim existing listing |
| `INVALID_ARGUMENT` | Bad category or address | Validate inputs before API call |
| `TOKEN_EXPIRED` | Access token stale | Auto-refresh via refreshTokenIfNeeded |
| `VERIFICATION_REQUIRED` | New location unverified | Trigger verification flow |

---

## npm Dependencies

```bash
npm install googleapis
```

That's the only external dependency needed. The googleapis package covers all GBP API calls.

---

## Implementation Sequence

| Phase | Task | Effort |
|---|---|---|
| 1 | Google Cloud project + OAuth credentials + Places API key | 1 hour |
| 2 | Supabase table + OAuth flow (steps 1-2) | 2 hours |
| 3 | Business creation endpoint (steps 3-4) | 3 hours |
| 4 | Category mapping (step 5) | 1 hour |
| 5 | Verification flow UI (step 7) | 2 hours |
| 6 | Dashboard UI component | 1 hour |
| 7 | Photo sync (step 6) | 2 hours |
| 8 | Profile sync on update (step 8) | 1 hour |
| 9 | Google review link generation | 0.5 hours |
| 10 | Google reviews fetch + cache + portfolio display | 2 hours |
| **Total** | | **~15.5 hours** |

---

## Google Review Links

Generating a direct review link requires no additional API calls. Once a pro's Google Business profile is verified and a Place ID is stored, the link is a simple URL construction.

### Store Place ID at Business Creation

Update step 4 to capture the Place ID when the location is created:

```javascript
const location = await mybusinessbusinessinformation.locations.create({
  parent: accountName,
  requestId: `kelen-${proId}-${Date.now()}`,
  requestBody: locationData,
});

const locationName = location.data.name;
const placeId = location.data.metadata?.placeId;

// Store both location name and place ID
await supabase
  .from('pro_google_tokens')
  .update({
    gbp_account_name: accountName,
    gbp_location_name: locationName,
    gbp_place_id: placeId, // Add this column to the table
    last_synced_at: new Date().toISOString(),
  })
  .eq('pro_id', proId);
```

Add the column to the Supabase table:

```sql
ALTER TABLE pro_google_tokens 
ADD COLUMN gbp_place_id TEXT;
```

### Generate the Review Link

```javascript
// /lib/google-review.js

export function getGoogleReviewLink(placeId) {
  if (!placeId) return null;
  return `https://search.google.com/local/writereview?placeid=${placeId}`;
}
```

That is the complete implementation. No API call. No authentication. Just a URL.

### Where to Surface the Link in Kelen

**At project completion:**

When a pro marks a project as complete, Kelen presents two shareable links simultaneously:

```jsx
// /components/ProjectCompletion.jsx

export function ProjectCompletionLinks({ proId, projectId, placeId }) {
  const kelenReviewLink = `https://kelen.co/review/${projectId}`;
  const googleReviewLink = getGoogleReviewLink(placeId);

  const whatsappMessage = encodeURIComponent(
    `Merci pour votre confiance. Si vous êtes satisfait de mon travail, ` +
    `je vous invite à laisser un avis :\n\n` +
    `⭐ Avis Kelen : ${kelenReviewLink}\n` +
    `📍 Avis Google : ${googleReviewLink}`
  );

  return (
    <div className="completion-links">
      <h3>Demander un avis à votre client</h3>
      
      <div className="link-row">
        <span>Kelen</span>
        <button onClick={() => copyToClipboard(kelenReviewLink)}>
          Copier le lien
        </button>
      </div>

      {googleReviewLink && (
        <div className="link-row">
          <span>Google Maps</span>
          <button onClick={() => copyToClipboard(googleReviewLink)}>
            Copier le lien
          </button>
        </div>
      )}

      <a
        href={`https://wa.me/?text=${whatsappMessage}`}
        target="_blank"
        className="btn-whatsapp"
      >
        Envoyer les deux par WhatsApp
      </a>
    </div>
  );
}
```

**In the pro dashboard:**

Display the review link permanently so the pro can share it anytime:

```jsx
{placeId && (
  <div className="review-link-card">
    <p>Partagez ce lien pour recevoir des avis Google</p>
    <input 
      readOnly 
      value={getGoogleReviewLink(placeId)} 
    />
    <button onClick={() => copyToClipboard(getGoogleReviewLink(placeId))}>
      Copier
    </button>
  </div>
)}
```

### The WhatsApp Flow

For the African market specifically, the WhatsApp send button is the most important element. A pro who completes a project in Abidjan will share via WhatsApp — not email, not SMS. The one-tap WhatsApp message that contains both the Kelen recommendation link and the Google review link is the complete client follow-up flow.

The message pre-fills with both links so the pro sends both with a single tap at the moment of maximum client satisfaction.

### Important Notes on Google Reviews

- Sending a personal review link to a genuine client after a real completed project is fully acceptable under Google's policies
- Do not automate bulk review requests — Google flags this and risks profile suspension
- Do not offer incentives for reviews — against Google's terms of service
- One personal request per completed project is the correct cadence

---

## Google Reviews Display on Portfolio

Google reviews are public data. Reading them requires only a Places API key — no OAuth, no user authorization. Every verified pro's Google reviews can be fetched and displayed automatically on their Kelen portfolio page.

**What this creates:** A pro's Kelen portfolio becomes a living reputation document combining project photos, Kelen recommendations, and Google reviews in one place. Three independent trust signals visible to every potential client.

### Enable Places API

In your Google Cloud project enable one additional API:
- **Places API**

Add to environment variables:
```env
GOOGLE_PLACES_API_KEY=your_places_api_key
```

This key is separate from OAuth credentials. It is a server-side key — never expose it in client-side code.

### Fetch Reviews

```javascript
// /lib/google-reviews.js

export async function fetchGoogleReviews(placeId) {
  if (!placeId) return null;

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?` +
    `place_id=${placeId}&` +
    `fields=reviews,rating,user_ratings_total&` +
    `key=${process.env.GOOGLE_PLACES_API_KEY}&` +
    `language=fr` // Returns reviews in French where available
  );

  const data = await response.json();

  if (data.status !== 'OK') {
    console.error('Places API error:', data.status);
    return null;
  }

  return {
    reviews: data.result?.reviews || [],
    rating: data.result?.rating || null,
    totalReviews: data.result?.user_ratings_total || 0,
  };
}
```

### Cache Reviews in Supabase

Do not call the Places API on every portfolio page load. Cache reviews every 24 hours via a background job or on-demand refresh.

```sql
-- Add to Supabase

CREATE TABLE pro_google_reviews_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pro_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
  place_id TEXT NOT NULL,
  rating DECIMAL(2,1),
  total_reviews INTEGER DEFAULT 0,
  reviews JSONB DEFAULT '[]',
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pro_id)
);
```

```javascript
// /lib/google-reviews.js (additions)

export async function getOrRefreshReviews(proId, placeId) {
  // Check cache first
  const { data: cache } = await supabase
    .from('pro_google_reviews_cache')
    .select('*')
    .eq('pro_id', proId)
    .single();

  const cacheAge = cache
    ? (Date.now() - new Date(cache.cached_at).getTime()) / 1000 / 60 / 60
    : null;

  // Return cache if less than 24 hours old
  if (cache && cacheAge < 24) {
    return cache;
  }

  // Fetch fresh data from Google
  const fresh = await fetchGoogleReviews(placeId);
  if (!fresh) return cache || null;

  // Update cache
  await supabase
    .from('pro_google_reviews_cache')
    .upsert({
      pro_id: proId,
      place_id: placeId,
      rating: fresh.rating,
      total_reviews: fresh.totalReviews,
      reviews: fresh.reviews,
      cached_at: new Date().toISOString(),
    });

  return fresh;
}
```

### Portfolio Page Display

```jsx
// /components/GoogleReviewsSection.jsx

export function GoogleReviewsSection({ reviews, rating, totalReviews, placeId }) {
  if (!rating || totalReviews === 0) return null;

  return (
    <div className="google-reviews-section">
      
      {/* Overall Rating */}
      <div className="reviews-header">
        <GoogleIcon size={20} />
        <span className="rating-number">{rating.toFixed(1)}</span>
        <StarRating rating={rating} />
        <span className="total-reviews">
          {totalReviews} avis Google
        </span>
      </div>

      {/* Individual Reviews — show 5 most recent */}
      <div className="reviews-list">
        {reviews.slice(0, 5).map((review, index) => (
          <div key={index} className="review-card">
            <div className="review-header">
              <img
                src={review.profile_photo_url}
                alt={review.author_name}
                className="reviewer-avatar"
              />
              <div>
                <div className="reviewer-name">{review.author_name}</div>
                <div className="review-date">
                  {review.relative_time_description}
                </div>
              </div>
              <StarRating rating={review.rating} size="small" />
            </div>
            {review.text && (
              <p className="review-text">{review.text}</p>
            )}
          </div>
        ))}
      </div>

      {/* Link to all reviews on Google */}
      <a
        href={`https://search.google.com/local/reviews?placeid=${placeId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="see-all-reviews"
      >
        Voir tous les avis sur Google Maps →
      </a>
    </div>
  );
}
```

### Portfolio Page Integration

```jsx
// /pages/[username].jsx — pro public portfolio page

export async function getServerSideProps({ params }) {
  const { username } = params;

  // Get pro profile
  const { data: pro } = await supabase
    .from('professionals')
    .select('*, pro_google_tokens(gbp_place_id)')
    .eq('username', username)
    .single();

  const placeId = pro?.pro_google_tokens?.gbp_place_id;

  // Get Google reviews if place ID exists
  const googleData = placeId
    ? await getOrRefreshReviews(pro.id, placeId)
    : null;

  return {
    props: {
      pro,
      googleData,
    }
  };
}

export default function ProPortfolio({ pro, googleData }) {
  return (
    <div className="portfolio-page">
      {/* Profile header */}
      <ProHeader pro={pro} />

      {/* Project gallery */}
      <ProjectGallery projects={pro.projects} />

      {/* Kelen recommendations */}
      <KelenRecommendations recommendations={pro.recommendations} />

      {/* Google reviews — appears automatically when connected */}
      {googleData && (
        <GoogleReviewsSection
          reviews={googleData.reviews}
          rating={googleData.rating}
          totalReviews={googleData.total_reviews}
          placeId={googleData.place_id}
        />
      )}
    </div>
  );
}
```

### The Trust Signal Stack on One Page

A potential client visiting a pro's Kelen portfolio now sees:

| Signal | Source | What it proves |
|---|---|---|
| Project photos | Kelen journal | Real work with GPS and timestamps |
| Kelen recommendations | Past clients via link | Verified satisfaction after completion |
| Google rating + reviews | Google Maps | Independent third-party validation |
| Google Maps presence | GBP integration | Established, findable professional |

No competing platform combines all four. This is the complete trust profile.

### Important Notes

- Google Places API returns a maximum of 5 reviews per request on the standard tier. This is sufficient for portfolio display.
- Reviews are returned in the language of the reviewer — no translation is applied. For multilingual markets this is an advantage as reviews appear authentic.
- The `language=fr` parameter in the fetch call biases the returned reviews toward French language ones where available but does not exclude others.
- Profile photos in reviews are hosted by Google — display them directly via the provided URL, do not re-host them.

---

## Post-Launch Notes

- Google Business API access requires an approval request for production use. Submit the request at [developers.google.com/my-business/content/prereqs](https://developers.google.com/my-business/content/prereqs) before implementing. Approval typically takes 1-3 business days.
- Verification by postcard is available as fallback for pros who cannot verify by phone or email. Build the UI to support all four methods.
- Google Maps ranking for local searches improves significantly with photos, regular updates, and client reviews. Consider prompting pros to push new project photos to GBP automatically when they add them to Kelen.
- For the African market specifically — verify that Google Maps coverage is sufficient in your target cities. Abidjan, Dakar, Lagos and Accra all have strong Maps coverage. Smaller cities may have limited indexing.
