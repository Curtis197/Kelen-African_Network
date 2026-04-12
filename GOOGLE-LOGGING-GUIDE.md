# Google Business Integration — Logging & Debugging Guide

**Date:** April 12, 2026  
**Status:** ✅ **COMPREHENSIVE LOGGING IMPLEMENTED**

---

## 📊 Logging Overview

The Google Business integration has **comprehensive, production-ready logging** at every decision point. This follows the INSTRUMENT protocol from AGENTS.md:

> **Logs are PERMANENT infrastructure. NEVER remove console.log statements after fixing an issue.**

---

## 🎯 Logger Architecture

### Logger Modules

All loggers are defined in `lib/logger.ts` and export pre-configured namespaced loggers:

```typescript
export const gbpLog      = logger("kelen:gbp");          // General GBP operations
export const authLog     = logger("kelen:gbp:auth");      // Token management
export const oauthLog    = logger("kelen:gbp:oauth");     // OAuth flow
export const reviewsLog  = logger("kelen:gbp:reviews");   // Google reviews
export const syncLog     = logger("kelen:gbp:sync");      // Photo/Profile sync
```

### Log Levels

| Level | When to Use | Color | Example |
|-------|-------------|-------|---------|
| **DEBUG** | Detailed diagnostic info | Cyan | Request bodies, API responses, token details |
| **INFO** | Normal operational events | Green | OAuth started, profile created, sync complete |
| **WARN** | Potential issues, non-critical | Yellow | Missing tokens, stale cache, expiring tokens |
| **ERROR** | Failures requiring attention | Red | RLS violations, API errors, network failures |

---

## 🔍 RLS Violation Logging (CRITICAL)

### Two Types of RLS Violations Logged

#### 1. EXPLICIT RLS (Error Code 42501)
Query blocked with error returned by Supabase.

**Logged with:**
```
❌ RLS VIOLATION (EXPLICIT) — Query blocked by Row Level Security!
  proId: uuid-here
  table: pro_google_tokens
  operation: SELECT/UPDATE/INSERT
  errorCode: 42501
  errorMessage: "new row violates row-level security policy..."
  hint: "Check RLS policy 'policy_name' — must allow..."
```

#### 2. SILENT RLS (0 rows, no error)
Query succeeded but returned 0 rows when data should exist.

**Logged with:**
```
⚠️ SILENT RLS FILTERING — Query succeeded but returned 0 rows
  proId: uuid-here
  table: pro_google_tokens
  operation: SELECT
  hint: "User may not have permission to see this row, or it doesn't exist"
```

---

## 📝 Log Locations by Feature

### 1. OAuth Authorization Flow

**Files:**
- `app/api/auth/google/authorize/route.ts`
- `app/api/auth/google/callback/route.ts`

**Key Logs:**
```typescript
oauthLog.info("→ GET /api/auth/google/authorize", { proId });
oauthLog.info("No proId provided — auto-detecting user's professional profile");
oauthLog.info("Professional profile verified", { proId, userId });
oauthLog.info("Redirecting to Google OAuth consent screen");
```

**What to Look For:**
- ✅ "Professional profile verified" → OAuth URL generated
- ❌ "Professional not found" → User has no profile
- ❌ "Google OAuth is not configured" → Missing env vars

---

### 2. Token Management

**File:** `lib/google-auth.ts`

**Key Logs:**
```typescript
authLog.debug("Fetching Google tokens from Supabase", { proId });
authLog.debug("Google tokens loaded", { hasAccessToken, hasRefreshToken, expiryDate });
authLog.info("Token expiring soon — refreshing", { proId, alreadyExpired });
authLog.info("Token refreshed and persisted", { proId, newExpiry });
```

**RLS Logs:**
```typescript
authLog.error("❌ RLS VIOLATION (EXPLICIT) — Query blocked!", { table, operation, errorCode });
authLog.warn("⚠️ SILENT RLS FILTERING — Query succeeded but returned 0 rows");
```

**What to Look For:**
- ✅ "Google tokens loaded" → Tokens available
- ⚠️ "Token expiring soon — refreshing" → Auto-refresh triggered
- ❌ "RLS VIOLATION" → Check policy `pro_google_tokens_select_own`
- ❌ "Token refresh failed" → Re-authorization needed

---

### 3. Business Profile Creation

**File:** `app/api/google/create-business/route.ts`

**Key Logs:**
```typescript
log.info("→ POST /api/google/create-business");
log.debug("Professional profile loaded", { businessName, category, city });
log.info("Fetching Google Business accounts list", { proId });
log.info("Creating GBP location", { title, category, city, websiteUri });
log.info("GBP location created", { locationName, placeId, ms });
log.info("GBP identifiers persisted to Supabase", { proId, locationName, placeId });
```

**RLS Logs:**
```typescript
log.error("❌ RLS VIOLATION (EXPLICIT) — Update blocked by Row Level Security!", {
  table: "pro_google_tokens",
  errorCode: updateErr.code,
  hint: "Check RLS policy 'pro_google_tokens_update_own'",
});
```

**What to Look For:**
- ✅ "Professional profile loaded" → Data ready for GBP
- ✅ "GBP location created" → Success
- ✅ "GBP identifiers persisted" → Database updated
- ❌ "No OAuth tokens found" → User must connect Google first
- ❌ "RLS VIOLATION" → Check update policy

---

### 4. Photo Sync

**File:** `app/api/google/sync-photos/route.ts`

**Key Logs:**
```typescript
log.info("→ POST /api/google/sync-photos");
log.debug("GBP location ready", { gbpLocationName, photoCount });
log.info("Starting photo sync", { count: photos.length });
log.info("Photo sync successful", { photoId, ms });
log.info("Photo sync complete", { synced: successCount, failed: failCount });
```

**What to Look For:**
- ✅ "GBP location ready" → Can sync photos
- ✅ "Photo sync complete" → All photos processed
- ⚠️ Individual photo failures logged but don't block remaining
- ❌ "No OAuth tokens" → Not connected

---

### 5. Profile Sync

**File:** `app/api/google/sync-profile/route.ts`

**Key Logs:**
```typescript
log.info("→ POST /api/google/sync-profile");
log.info("Syncing Kelen profile to GBP", { proId, gbpLocationName });
log.info("GBP profile sync complete", { proId, ms });
```

**What to Look For:**
- ✅ "GBP profile sync complete" → Update successful
- ℹ️ "No GBP location name — skipping sync" → Create business first

---

### 6. Verification Request

**File:** `app/api/google/request-verification/route.ts`

**Key Logs:**
```typescript
log.info("→ POST /api/google/request-verification");
log.info("Requesting verification", { proId, method, gbpLocationName });
log.info("Verification request sent", { verificationId, method });
```

**What to Look For:**
- ✅ "Verification request sent" → Code sent to user
- ❌ "Invalid verification method" → Must be SMS/PHONE_CALL/EMAIL/ADDRESS

---

### 7. Google Reviews Cache

**File:** `lib/google-reviews.ts`

**Key Logs:**
```typescript
log.debug("getOrRefreshReviews called", { proId, placeId });
log.info("Returning cached reviews (< 24h)", { proId, ageHours, totalReviews });
log.info("Cache stale (> 24h) — refreshing from Places API", { proId, ageHours });
log.info("Places API fetch successful", { placeId, rating, totalReviews, ms });
log.info("Reviews cache updated", { proId, totalReviews, rating });
```

**RLS Logs:**
```typescript
log.error("❌ RLS VIOLATION (EXPLICIT) — Cache read blocked!", {
  table: "pro_google_reviews_cache",
  hint: "Check RLS policy 'pro_google_reviews_cache_public_select'",
});
```

**What to Look For:**
- ✅ "Returning cached reviews" → Cache hit
- ✅ "Places API fetch successful" → Fresh data
- ✅ "Reviews cache updated" → Cache refreshed
- ❌ "RLS VIOLATION" → Public select policy misconfigured

---

## 🔧 How to Enable Logging

### Development (Default: DEBUG)

Logging is automatically enabled at DEBUG level in development:

```bash
# No config needed - defaults to debug
npm run dev
```

### Production (Default: INFO)

To enable DEBUG logging in production:

```env
# .env.production.local
KELEN_LOG_LEVEL=debug
```

### Log Level Control

Set via environment variable:

```bash
KELEN_LOG_LEVEL=info npm run dev    # Only info, warn, error
KELEN_LOG_LEVEL=debug npm run dev   # All logs (default in dev)
KELEN_LOG_LEVEL=warn npm run dev    # Only warn, error
```

---

## 🐛 Debugging Workflow

### Scenario 1: OAuth Not Working

**Check logs for:**
```
[INFO] [kelen:gbp:oauth] → GET /api/auth/google/authorize
[DEBUG] [kelen:gbp:oauth] Google OAuth env vars not configured { hasClientId: false }
```

**Fix:** Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`

---

### Scenario 2: Business Creation Fails

**Check logs for:**
```
[INFO] [kelen:gbp] → POST /api/google/create-business
[WARN] [kelen:gbp] No OAuth tokens found — user must connect Google first
```

**Fix:** User needs to complete OAuth flow first via `/api/auth/google/authorize`

---

### Scenario 3: RLS Violation

**Check logs for:**
```
[ERROR] [kelen:gbp:auth] ❌ RLS VIOLATION (EXPLICIT) — Query blocked by Row Level Security!
  table: pro_google_tokens
  errorCode: 42501
  hint: "Check RLS policy 'pro_google_tokens_select_own'"
```

**Fix:** Verify RLS policy in `supabase/migrations/20260412000001_google_business_integration.sql`

---

### Scenario 4: Reviews Not Showing

**Check logs for:**
```
[INFO] [kelen:gbp:reviews:cache] No cache found — fetching from Places API
[ERROR] [kelen:gbp:reviews] GOOGLE_PLACES_API_KEY is not configured
```

**Fix:** Set `GOOGLE_PLACES_API_KEY` environment variable

---

### Scenario 5: Token Refresh Failing

**Check logs for:**
```
[INFO] [kelen:gbp:auth] Token expiring soon — refreshing { alreadyExpired: true }
[ERROR] [kelen:gbp:auth] ❌ RLS VIOLATION (EXPLICIT) — Token refresh update blocked!
```

**Fix:** Check `pro_google_tokens_update_own` RLS policy allows updates

---

## 📊 Debug Endpoint

**URL:** `/api/google/debug`

**Access:**
- Development: Always enabled
- Production: Requires `KELEN_DEBUG=true`

**Returns:**
```json
{
  "timestamp": "2026-04-12T10:30:00.000Z",
  "environment": {
    "nodeEnv": "development",
    "hasGoogleClientId": true,
    "hasGoogleSecret": true,
    "redirectUri": "https://kelen.co/api/auth/google/callback",
    "hasPlacesApiKey": true
  },
  "professional": {
    "id": "uuid",
    "businessName": "ABC Construction",
    "slug": "abc-construction",
    "category": "maçonnerie",
    "city": "Abidjan"
  },
  "googleTokens": {
    "isConnected": true,
    "hasAccessToken": true,
    "hasRefreshToken": true,
    "tokenExpiresInMin": 45,
    "isExpired": false,
    "verificationStatus": "VERIFIED",
    "gbpAccountName": "accounts/123456",
    "gbpLocationName": "accounts/123456/locations/789012",
    "gbpPlaceId": "ChIJ..."
  },
  "reviewsCache": {
    "placeId": "ChIJ...",
    "rating": 4.8,
    "totalReviews": 23,
    "cachedAt": "2026-04-12T08:00:00.000Z",
    "ageHours": 2.5
  },
  "reviewLink": "https://search.google.com/local/writereview?placeid=ChIJ..."
}
```

**Usage:**
```bash
# Development
curl http://localhost:3000/api/google/debug

# Production (if enabled)
curl https://kelen.co/api/google/debug -H "Cookie: session=..."
```

---

## 🎯 Log Output Examples

### Successful OAuth Flow
```
2026-04-12T10:00:00.000Z [INFO] [kelen:gbp:oauth] → GET /api/auth/google/authorize { proId: "abc-123" }
2026-04-12T10:00:00.100Z [DEBUG] [kelen:gbp:oauth] Verifying session { proId: "abc-123" }
2026-04-12T10:00:00.200Z [INFO] [kelen:gbp:oauth] Ownership confirmed — generating auth URL { proId: "abc-123" }
2026-04-12T10:00:00.300Z [INFO] [kelen:gbp:oauth] Redirecting to Google OAuth consent screen
2026-04-12T10:00:30.000Z [INFO] [kelen:gbp:oauth] ← GET /api/auth/google/callback { code: "4/...", state: "..." }
2026-04-12T10:00:30.500Z [INFO] [kelen:gbp:oauth] OAuth tokens exchanged successfully { proId: "abc-123" }
2026-04-12T10:00:30.600Z [INFO] [kelen:gbp:auth] Tokens persisted to Supabase { proId: "abc-123" }
```

### Successful Business Creation
```
2026-04-12T10:05:00.000Z [INFO] [kelen:gbp] → POST /api/google/create-business
2026-04-12T10:05:00.100Z [DEBUG] [kelen:gbp] Professional profile loaded { businessName: "ABC Construction", category: "maçonnerie", city: "Abidjan" }
2026-04-12T10:05:00.200Z [INFO] [kelen:gbp] Fetching Google Business accounts list { proId: "abc-123" }
2026-04-12T10:05:00.800Z [INFO] [kelen:gbp] Using Google Business account { proId: "abc-123", accountName: "accounts/123456" }
2026-04-12T10:05:00.900Z [INFO] [kelen:gbp] Creating GBP location { title: "ABC Construction", category: "gcid:masonry_contractor" }
2026-04-12T10:05:02.500Z [INFO] [kelen:gbp] GBP location created { locationName: "accounts/123456/locations/789012", placeId: "ChIJ...", ms: 1600 }
2026-04-12T10:05:02.700Z [INFO] [kelen:gbp] GBP identifiers persisted to Supabase { proId: "abc-123", locationName, placeId }
```

### RLS Violation Example
```
2026-04-12T10:10:00.000Z [ERROR] [kelen:gbp:auth] ❌ RLS VIOLATION (EXPLICIT) — Query blocked by Row Level Security!
  proId: "abc-123"
  table: "pro_google_tokens"
  operation: "SELECT"
  errorCode: 42501
  errorMessage: "new row violates row-level security policy for table \"pro_google_tokens\""
  hint: "Check RLS policy 'pro_google_tokens_select_own' — must allow select where pro.user_id = auth.uid()"
```

---

## 🚀 Production Monitoring

### Key Metrics to Monitor

| Metric | Log Pattern | Alert Threshold |
|--------|-------------|-----------------|
| **OAuth Failures** | `Google OAuth env vars not configured` | Any occurrence |
| **RLS Violations** | `❌ RLS VIOLATION (EXPLICIT)` | Any occurrence |
| **Token Refresh Failures** | `Token refresh failed` | >5 in 1 hour |
| **GBP Creation Failures** | `GBP location create failed` | >10% of attempts |
| **Review Fetch Failures** | `Places API returned non-OK` | >20% of attempts |
| **Cache Staleness** | `Cache stale (> 24h)` | Expected, monitor frequency |

### Log Aggregation

For production, pipe logs to your aggregator:

```bash
# Example with Vercel
vercel logs kelen-production --output-raw | grep "kelen:gbp"

# Example with Docker
docker logs kelen-app 2>&1 | grep "kelen:gbp"
```

---

## 📋 Troubleshooting Checklist

### OAuth Issues
- [ ] Check `[INFO] [kelen:gbp:oauth]` for flow initiation
- [ ] Verify env vars in debug endpoint
- [ ] Check for "Professional not found" errors
- [ ] Look for redirect URL generation

### Token Issues
- [ ] Check `[DEBUG] [kelen:gbp:auth] Google tokens loaded`
- [ ] Look for `tokenExpiresInMin` in debug endpoint
- [ ] Check for refresh errors
- [ ] Verify RLS policies if getting 0 rows

### Business Creation Issues
- [ ] Check `[INFO] [kelen:gbp] Creating GBP location`
- [ ] Verify category mapping in logs
- [ ] Look for API error responses
- [ ] Check RLS violations on update

### Review Issues
- [ ] Check `[INFO] [kelen:gbp:reviews] Places API fetch`
- [ ] Verify `GOOGLE_PLACES_API_KEY` set
- [ ] Check cache age in debug endpoint
- [ ] Look for RLS violations on cache table

---

## 📚 Related Documentation

- **Full Implementation Guide:** `google-business-integration.md`
- **Database Schema:** `supabase/database-scheme.sql`
- **Migration:** `supabase/migrations/20260412000001_google_business_integration.sql`
- **Audit Report:** `GOOGLE-INTEGRATION-AUDIT.md`
- **Logger Implementation:** `lib/logger.ts`

---

**Remember:** Logs are permanent infrastructure. They stay in the code forever and provide:
1. ✅ Future bug detection
2. ✅ Production debugging capability
3. ✅ Code documentation
4. ✅ Regression detection
5. ✅ Performance monitoring

**NEVER remove logs after fixing an issue.** They are an investment, not a temporary tool.
