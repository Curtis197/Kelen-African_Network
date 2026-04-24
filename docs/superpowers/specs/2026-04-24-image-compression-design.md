# Image Compression — Design Spec

**Date:** 2026-04-24  
**Context:** Kelen African Network — performance optimisation for African users on 3G/4G mobile connections  
**Scope:** Images only (video deferred). No new external services — uses existing `sharp` package and Vercel Functions.

---

## Problem

All image uploads currently go directly from the browser to Supabase Storage with zero compression. Users on African mobile networks upload raw JPEG/PNG files (up to 10MB each), and those same large files are served back on every page load. This creates two bottlenecks:

1. **Upload**: slow, drops on weak connections, discourages use
2. **Display**: large images slow page render for all visitors

---

## Solution: Two-Layer Compression (Approach C)

### Layer 1 — Client-side (Canvas API, browser)

Run before the file leaves the device. Reduces upload payload by ~60–80%.

- Draws image onto an offscreen `<canvas>` scaled to fit max dimensions
- Exports as `image/webp` blob at context-specific quality
- Falls back to `image/jpeg` if WebP not supported (older Android browsers)
- Returns a new `File` object with corrected extension and MIME type
- Non-image files (PDFs) pass through unchanged

### Layer 2 — Server-side (sharp, Next.js API route)

Receives the already-small client blob. Applies final context-aware quality control before writing to Supabase.

- `POST /api/upload-image` accepts `multipart/form-data`
- Fields: `file`, `bucket`, `path`, `context`
- Auth check via Supabase server client (rejects unauthenticated requests)
- Validates MIME is `image/*`
- Looks up context config → `sharp(buffer).resize(maxWidth, maxHeight, { fit: 'inside', withoutEnlargement: true }).webp({ quality })`
- Uploads resulting buffer to Supabase with `contentType: 'image/webp'`
- Returns `{ url: string }`

---

## Context-Specific Settings

Context keys map directly to Supabase bucket names (exact match required by `doUpload()`).

| Context (= bucket name) | Max dimensions | Server quality | Client quality | Notes |
|---|---|---|---|---|
| `portfolios` | 1920×1920 | 80% | 0.80 | Professional showcase — balance quality and speed |
| `log-media` | 1080×1080 | 70% | 0.70 | Field photos — documentation only, aggressive compression |
| `evidence-photos` | 1280×1280 | 75% | 0.75 | Moderation use, moderate compression |
| `collaboration-attachments` | 1280×1280 | 75% | 0.75 | Same as evidence |
| `verification-docs` | — | skip | skip | PDF only |
| `contracts` | — | skip | skip | PDF only |

All output format: **WebP**. `withoutEnlargement: true` prevents upscaling small images.

> **Note on profile photos**: Profile/cover photos are stored in the `portfolios` bucket and inherit those settings (1920px / 80%). If a dedicated `profile` bucket is added later, a separate entry can be added to the config.

---

## Files

### New

| File | Purpose |
|---|---|
| `lib/utils/image-compress.ts` | Client-side Canvas compression utility |
| `app/api/upload-image/route.ts` | Server route — sharp compression + Supabase upload |
| `lib/config/image-compression.ts` | Context config map (dimensions, quality) |

### Modified

| File | Change |
|---|---|
| `lib/supabase/storage.ts` | `doUpload()` — route image files through `/api/upload-image` instead of direct Supabase upload |
| `lib/actions/log-media.ts` | Add `sharp` processing before `supabase.storage.upload()` in `uploadLogMedia` |
| `components/pro/ProjectPhotoUpload.tsx` | Add `compressImageClient()` call before upload; add "Compression en cours…" UI state |

---

## Data Flow

```
User selects file(s)
        ↓
[Browser] lib/utils/image-compress.ts
  compressImageClient(file, clientQuality)
  → canvas resize + WebP export
  → returns compressed File (~60-80% smaller)
        ↓
[Network] POST /api/upload-image
  multipart/form-data: { file, bucket, path, context }
        ↓
[Server] app/api/upload-image/route.ts
  → auth check
  → validate image MIME
  → lookup IMAGE_COMPRESSION_CONFIG[context]
  → sharp: resize + webp({ quality })
  → supabase.storage.from(bucket).upload(path, buffer)
  → return { url }
        ↓
Component receives URL — continues as before
```

**Log-media server action** (separate path — already runs server-side):
```
uploadLogMedia() receives raw Buffer
  → sharp(buffer).resize(1080).webp({ quality: 70 }).toBuffer()
  → supabase.storage.from('log-media').upload(path, compressedBuffer)
```

---

## Error Handling

- Client compression failure → fall back to original file (upload continues, just uncompressed)
- Server route auth failure → 401
- Invalid MIME on server → 400
- `sharp` processing error → 500 with message; component shows toast error
- Supabase upload error → propagated to component as before

---

## What Does NOT Change

- PDF upload paths (`contracts`, `verification-docs`) — bypass compression entirely
- Video upload paths — out of scope, deferred
- URL structures returned to components — same shape as before (`string`)
- RLS policies in Supabase — unchanged
- File size validation limits — still enforced before compression runs (10MB raw input max)

---

## Open Questions

None — all design decisions resolved.
