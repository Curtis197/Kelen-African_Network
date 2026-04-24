# Image Compression Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two-layer image compression (browser Canvas + server sharp) to reduce upload bandwidth and stored file sizes for African mobile users on 3G/4G.

**Architecture:** Client pre-compresses images using the Canvas API before upload (reducing network payload 60–80%); a new `/api/upload-image` route receives the smaller file and applies context-specific `sharp` processing before writing the final WebP to Supabase. The `log-media` server action (which has no client pre-compression step) is updated separately to compress via `sharp` server-side. A central config object keyed by bucket name drives all quality/dimension settings.

**Tech Stack:** `sharp` (already installed), Canvas API, Next.js 16 App Router API routes, Supabase Storage, Vitest

---

## File Map

| File | Status | Responsibility |
|---|---|---|
| `lib/config/image-compression.ts` | **Create** | Per-bucket compression settings (dimensions, quality) |
| `lib/utils/image-compress.ts` | **Create** | Client-side Canvas compression (browser only) |
| `app/api/upload-image/route.ts` | **Create** | Server route: sharp compression + Supabase upload |
| `lib/supabase/storage.ts` | **Modify** | Route image uploads through `/api/upload-image` in `doUpload()` |
| `lib/actions/log-media.ts` | **Modify** | Add sharp compression before `supabase.storage.upload()` |
| `components/pro/ProjectPhotoUpload.tsx` | **Modify** | Use `uploadFile()` from `storage.ts` (compression handled transparently) |

---

## Task 1: Context Configuration

**Files:**
- Create: `lib/config/image-compression.ts`
- Create: `lib/config/__tests__/image-compression.test.ts`

- [ ] **Step 1.1: Write the failing tests**

Create `lib/config/__tests__/image-compression.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  IMAGE_COMPRESSION_CONFIG,
  type ImageBucket,
} from '@/lib/config/image-compression';

describe('IMAGE_COMPRESSION_CONFIG', () => {
  const allBuckets: ImageBucket[] = [
    'portfolios',
    'log-media',
    'evidence-photos',
    'collaboration-attachments',
    'verification-docs',
    'contracts',
  ];

  it('has an entry for every known bucket', () => {
    allBuckets.forEach((bucket) => {
      expect(bucket in IMAGE_COMPRESSION_CONFIG).toBe(true);
    });
  });

  it('returns null for PDF-only buckets', () => {
    expect(IMAGE_COMPRESSION_CONFIG['verification-docs']).toBeNull();
    expect(IMAGE_COMPRESSION_CONFIG['contracts']).toBeNull();
  });

  it('portfolios: 1920px max, quality 80, clientQuality 0.80', () => {
    const cfg = IMAGE_COMPRESSION_CONFIG['portfolios'];
    expect(cfg).not.toBeNull();
    expect(cfg!.maxWidth).toBe(1920);
    expect(cfg!.maxHeight).toBe(1920);
    expect(cfg!.quality).toBe(80);
    expect(cfg!.clientQuality).toBe(0.8);
  });

  it('log-media: most aggressive — 1080px, quality 70', () => {
    const cfg = IMAGE_COMPRESSION_CONFIG['log-media'];
    expect(cfg!.maxWidth).toBe(1080);
    expect(cfg!.quality).toBe(70);
  });

  it('evidence-photos and collaboration-attachments: same settings', () => {
    const a = IMAGE_COMPRESSION_CONFIG['evidence-photos'];
    const b = IMAGE_COMPRESSION_CONFIG['collaboration-attachments'];
    expect(a).toEqual(b);
  });

  it('all non-null configs have quality between 1 and 100', () => {
    allBuckets
      .map((b) => IMAGE_COMPRESSION_CONFIG[b])
      .filter(Boolean)
      .forEach((cfg) => {
        expect(cfg!.quality).toBeGreaterThanOrEqual(1);
        expect(cfg!.quality).toBeLessThanOrEqual(100);
      });
  });

  it('all non-null configs have clientQuality between 0 and 1', () => {
    allBuckets
      .map((b) => IMAGE_COMPRESSION_CONFIG[b])
      .filter(Boolean)
      .forEach((cfg) => {
        expect(cfg!.clientQuality).toBeGreaterThan(0);
        expect(cfg!.clientQuality).toBeLessThanOrEqual(1);
      });
  });
});
```

- [ ] **Step 1.2: Run tests — confirm they fail**

```bash
npx vitest run lib/config/__tests__/image-compression.test.ts
```

Expected: `FAIL` — module not found.

- [ ] **Step 1.3: Create the config**

Create `lib/config/image-compression.ts`:

```typescript
export type ImageBucket =
  | 'portfolios'
  | 'log-media'
  | 'evidence-photos'
  | 'collaboration-attachments'
  | 'verification-docs'
  | 'contracts';

export interface CompressionConfig {
  maxWidth: number;
  maxHeight: number;
  quality: number;       // sharp WebP quality (1–100)
  clientQuality: number; // Canvas quality (0–1)
}

export const IMAGE_COMPRESSION_CONFIG: Record<ImageBucket, CompressionConfig | null> = {
  portfolios:                  { maxWidth: 1920, maxHeight: 1920, quality: 80, clientQuality: 0.8 },
  'log-media':                 { maxWidth: 1080, maxHeight: 1080, quality: 70, clientQuality: 0.7 },
  'evidence-photos':           { maxWidth: 1280, maxHeight: 1280, quality: 75, clientQuality: 0.75 },
  'collaboration-attachments': { maxWidth: 1280, maxHeight: 1280, quality: 75, clientQuality: 0.75 },
  'verification-docs':         null,
  contracts:                   null,
};
```

- [ ] **Step 1.4: Run tests — confirm they pass**

```bash
npx vitest run lib/config/__tests__/image-compression.test.ts
```

Expected: all 7 tests `PASS`.

- [ ] **Step 1.5: Commit**

```bash
git add lib/config/image-compression.ts lib/config/__tests__/image-compression.test.ts
git commit -m "feat: add image compression config per bucket"
```

---

## Task 2: Client-side Compression Utility

**Files:**
- Create: `lib/utils/image-compress.ts`
- Create: `lib/utils/__tests__/image-compress.test.ts`

- [ ] **Step 2.1: Write the failing tests**

The utility uses browser-only globals (`Image`, `document`, `URL`). We stub them with `vi.stubGlobal` since vitest runs in the Node environment.

Create `lib/utils/__tests__/image-compress.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// --- Browser global stubs ---

const mockWebPCanvas = {
  width: 0,
  height: 0,
  getContext: vi.fn().mockReturnValue({ drawImage: vi.fn() }),
  toBlob: vi.fn(),
  toDataURL: vi.fn().mockReturnValue('data:image/webp;base64,abc'),
};

const mockJpegCanvas = {
  ...mockWebPCanvas,
  toDataURL: vi.fn().mockReturnValue('data:image/jpeg;base64,abc'),
};

vi.stubGlobal('URL', {
  createObjectURL: vi.fn().mockReturnValue('blob:fake'),
  revokeObjectURL: vi.fn(),
});

// Image constructor: fires onload immediately with 800×600
function FakeImage(this: {
  onload: (() => void) | null;
  onerror: (() => void) | null;
  width: number;
  height: number;
  _src: string;
}) {
  this.onload = null;
  this.onerror = null;
  this.width = 800;
  this.height = 600;
  this._src = '';
}
Object.defineProperty(FakeImage.prototype, 'src', {
  set(val: string) {
    this._src = val;
    setTimeout(() => this.onload?.(), 0);
  },
});
vi.stubGlobal('Image', FakeImage);

// --- Tests ---

describe('compressImageClient', () => {
  beforeEach(() => {
    vi.stubGlobal('document', {
      createElement: vi.fn().mockReturnValue({ ...mockWebPCanvas, width: 0, height: 0 }),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns original file unchanged for non-image MIME types', async () => {
    const { compressImageClient } = await import('@/lib/utils/image-compress');
    const file = new File(['%PDF'], 'doc.pdf', { type: 'application/pdf' });
    const result = await compressImageClient(file, 'contracts');
    expect(result).toBe(file);
  });

  it('returns original file unchanged when bucket config is null', async () => {
    const { compressImageClient } = await import('@/lib/utils/image-compress');
    const file = new File(['data'], 'scan.jpg', { type: 'image/jpeg' });
    const result = await compressImageClient(file, 'verification-docs');
    expect(result).toBe(file);
  });

  it('returns a compressed WebP File when canvas supports WebP', async () => {
    const { compressImageClient } = await import('@/lib/utils/image-compress');

    // Make toBlob call the callback with a WebP blob
    vi.mocked(document.createElement).mockReturnValue({
      ...mockWebPCanvas,
      width: 0,
      height: 0,
      toBlob: vi.fn((cb: BlobCallback) => {
        cb(new Blob(['compressed'], { type: 'image/webp' }));
      }),
      toDataURL: vi.fn().mockReturnValue('data:image/webp;base64,abc'),
    } as unknown as HTMLCanvasElement);

    const file = new File(['imagedata'], 'photo.jpg', { type: 'image/jpeg' });
    const result = await compressImageClient(file, 'portfolios');

    expect(result).not.toBe(file);
    expect(result.type).toBe('image/webp');
    expect(result.name).toMatch(/\.webp$/);
  });

  it('falls back to JPEG when canvas does not support WebP', async () => {
    const { compressImageClient } = await import('@/lib/utils/image-compress');

    vi.mocked(document.createElement).mockReturnValue({
      ...mockJpegCanvas,
      width: 0,
      height: 0,
      toBlob: vi.fn((cb: BlobCallback) => {
        cb(new Blob(['compressed'], { type: 'image/jpeg' }));
      }),
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,abc'), // not webp → fallback
    } as unknown as HTMLCanvasElement);

    const file = new File(['imagedata'], 'photo.png', { type: 'image/png' });
    const result = await compressImageClient(file, 'log-media');

    expect(result.type).toBe('image/jpeg');
    expect(result.name).toMatch(/\.jpg$/);
  });

  it('falls back to original file when toBlob returns null', async () => {
    const { compressImageClient } = await import('@/lib/utils/image-compress');

    vi.mocked(document.createElement).mockReturnValue({
      ...mockWebPCanvas,
      width: 0,
      height: 0,
      toBlob: vi.fn((cb: BlobCallback) => cb(null)),
    } as unknown as HTMLCanvasElement);

    const file = new File(['imagedata'], 'photo.jpg', { type: 'image/jpeg' });
    const result = await compressImageClient(file, 'portfolios');
    expect(result).toBe(file);
  });
});
```

- [ ] **Step 2.2: Run tests — confirm they fail**

```bash
npx vitest run lib/utils/__tests__/image-compress.test.ts
```

Expected: `FAIL` — module not found.

- [ ] **Step 2.3: Create the utility**

Create `lib/utils/image-compress.ts`:

```typescript
import { IMAGE_COMPRESSION_CONFIG, type ImageBucket } from '@/lib/config/image-compression';

function canvasSupportsWebP(): boolean {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').startsWith('data:image/webp');
}

export function compressImageClient(file: File, bucket: ImageBucket): Promise<File> {
  if (!file.type.startsWith('image/')) return Promise.resolve(file);

  const config = IMAGE_COMPRESSION_CONFIG[bucket];
  if (!config) return Promise.resolve(file);

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > config.maxWidth || height > config.maxHeight) {
        const ratio = Math.min(config.maxWidth / width, config.maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(file); return; }
      ctx.drawImage(img, 0, 0, width, height);

      const useWebP = canvasSupportsWebP();
      const mimeType = useWebP ? 'image/webp' : 'image/jpeg';
      const ext = useWebP ? 'webp' : 'jpg';

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          const baseName = file.name.replace(/\.[^.]+$/, '');
          resolve(new File([blob], `${baseName}.${ext}`, { type: mimeType }));
        },
        mimeType,
        config.clientQuality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}
```

- [ ] **Step 2.4: Run tests — confirm they pass**

```bash
npx vitest run lib/utils/__tests__/image-compress.test.ts
```

Expected: all 5 tests `PASS`.

- [ ] **Step 2.5: Commit**

```bash
git add lib/utils/image-compress.ts lib/utils/__tests__/image-compress.test.ts
git commit -m "feat: add client-side Canvas image compression utility"
```

---

## Task 3: Upload Image API Route

**Files:**
- Create: `app/api/upload-image/route.ts`
- Create: `app/api/upload-image/__tests__/route.test.ts`

- [ ] **Step 3.1: Write the failing tests**

Create `app/api/upload-image/__tests__/route.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock sharp
vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    resize: vi.fn().mockReturnThis(),
    webp: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('compressed')),
  })),
}));

// Mock Supabase server client
const mockUpload = vi.fn().mockResolvedValue({ error: null });
const mockGetPublicUrl = vi.fn().mockReturnValue({
  data: { publicUrl: 'https://example.supabase.co/storage/v1/object/public/portfolios/u/f.webp' },
});

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-abc' } },
        error: null,
      }),
    },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      }),
    },
  }),
}));

function makeRequest(fields: Record<string, string | File>): Request {
  const form = new FormData();
  for (const [key, val] of Object.entries(fields)) form.append(key, val);
  return new Request('http://localhost/api/upload-image', {
    method: 'POST',
    body: form,
  });
}

describe('POST /api/upload-image', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when user is not authenticated', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('no session') }),
      },
    } as never);

    const { POST } = await import('@/app/api/upload-image/route');
    const res = await POST(makeRequest({
      file: new File(['x'], 'a.jpg', { type: 'image/jpeg' }),
      bucket: 'portfolios',
      path: 'user-abc/a.webp',
    }) as never);
    expect(res.status).toBe(401);
  });

  it('returns 400 for missing required fields', async () => {
    const { POST } = await import('@/app/api/upload-image/route');
    const res = await POST(makeRequest({
      file: new File(['x'], 'a.jpg', { type: 'image/jpeg' }),
      // missing bucket and path
    }) as never);
    expect(res.status).toBe(400);
  });

  it('returns 400 for non-image MIME type', async () => {
    const { POST } = await import('@/app/api/upload-image/route');
    const res = await POST(makeRequest({
      file: new File(['%PDF'], 'doc.pdf', { type: 'application/pdf' }),
      bucket: 'portfolios',
      path: 'user-abc/doc.pdf',
    }) as never);
    expect(res.status).toBe(400);
  });

  it('compresses with sharp and returns URL for valid image upload', async () => {
    const { POST } = await import('@/app/api/upload-image/route');
    const res = await POST(makeRequest({
      file: new File(['imagedata'], 'photo.jpg', { type: 'image/jpeg' }),
      bucket: 'portfolios',
      path: 'user-abc/uuid.webp',
    }) as never);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toContain('portfolios');
    expect(mockUpload).toHaveBeenCalledWith(
      'user-abc/uuid.webp',
      expect.any(Buffer),
      expect.objectContaining({ contentType: 'image/webp' }),
    );
  });

  it('skips sharp and uploads raw buffer when bucket config is null', async () => {
    const sharp = (await import('sharp')).default;
    const { POST } = await import('@/app/api/upload-image/route');

    const res = await POST(makeRequest({
      file: new File(['imagedata'], 'photo.jpg', { type: 'image/jpeg' }),
      bucket: 'verification-docs',
      path: 'user-abc/uuid.webp',
    }) as never);

    expect(res.status).toBe(200);
    // sharp should not have been called for null-config bucket
    expect(sharp).not.toHaveBeenCalled();
  });

  it('returns 500 when Supabase upload fails', async () => {
    mockUpload.mockResolvedValueOnce({ error: { message: 'RLS violation' } });
    const { POST } = await import('@/app/api/upload-image/route');
    const res = await POST(makeRequest({
      file: new File(['imagedata'], 'photo.jpg', { type: 'image/jpeg' }),
      bucket: 'portfolios',
      path: 'user-abc/uuid.webp',
    }) as never);
    expect(res.status).toBe(500);
  });
});
```

- [ ] **Step 3.2: Run tests — confirm they fail**

```bash
npx vitest run "app/api/upload-image/__tests__/route.test.ts"
```

Expected: `FAIL` — module not found.

- [ ] **Step 3.3: Create the API route**

Create `app/api/upload-image/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { createClient } from '@/lib/supabase/server';
import { IMAGE_COMPRESSION_CONFIG, type ImageBucket } from '@/lib/config/image-compression';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const bucket = formData.get('bucket') as string | null;
  const path = formData.get('path') as string | null;

  if (!file || !bucket || !path) {
    return NextResponse.json({ error: 'Missing required fields: file, bucket, path' }, { status: 400 });
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  let buffer = Buffer.from(arrayBuffer);

  const config = IMAGE_COMPRESSION_CONFIG[bucket as ImageBucket] ?? null;
  if (config) {
    buffer = await sharp(buffer)
      .resize(config.maxWidth, config.maxHeight, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: config.quality })
      .toBuffer();
  }

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType: 'image/webp', upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}
```

- [ ] **Step 3.4: Run tests — confirm they pass**

```bash
npx vitest run "app/api/upload-image/__tests__/route.test.ts"
```

Expected: all 6 tests `PASS`.

- [ ] **Step 3.5: Commit**

```bash
git add app/api/upload-image/route.ts "app/api/upload-image/__tests__/route.test.ts"
git commit -m "feat: add /api/upload-image route with sharp compression"
```

---

## Task 4: Modify storage.ts — Route Images Through API

**Files:**
- Modify: `lib/supabase/storage.ts`
- Create: `lib/supabase/__tests__/storage.test.ts`

- [ ] **Step 4.1: Write the failing tests**

Create `lib/supabase/__tests__/storage.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase browser client
const mockStorageUpload = vi.fn().mockResolvedValue({ error: null });
const mockGetPublicUrl = vi.fn().mockReturnValue({
  data: { publicUrl: 'https://example.supabase.co/storage/v1/object/public/contracts/u/f.pdf' },
});
const mockGetUser = vi.fn().mockResolvedValue({
  data: { user: { id: 'user-123' } },
  error: null,
});

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn().mockReturnValue({
    auth: { getUser: mockGetUser },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: mockStorageUpload,
        getPublicUrl: mockGetPublicUrl,
      }),
    },
  }),
}));

// Mock image-compress (browser utility — not available in Node)
vi.mock('@/lib/utils/image-compress', () => ({
  compressImageClient: vi.fn().mockImplementation((file: File) =>
    Promise.resolve(new File([file], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' })),
  ),
}));

// Mock fetch for the /api/upload-image call
const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  json: vi.fn().mockResolvedValue({ url: 'https://example.supabase.co/storage/v1/object/public/portfolios/u/uuid.webp' }),
});
vi.stubGlobal('fetch', mockFetch);

describe('uploadFile', () => {
  beforeEach(() => vi.clearAllMocks());

  it('routes image files through /api/upload-image', async () => {
    const { uploadFile } = await import('@/lib/supabase/storage');
    const file = new File(['imagedata'], 'photo.jpg', { type: 'image/jpeg' });
    const url = await uploadFile(file, 'portfolios', 'user-123');

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/upload-image',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(url).toBe('https://example.supabase.co/storage/v1/object/public/portfolios/u/uuid.webp');
    expect(mockStorageUpload).not.toHaveBeenCalled();
  });

  it('uses direct Supabase upload for non-image files (PDFs)', async () => {
    const { uploadFile } = await import('@/lib/supabase/storage');
    const file = new File(['%PDF-1.4'], 'contract.pdf', { type: 'application/pdf' });
    await uploadFile(file, 'contracts', 'user-123');

    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockStorageUpload).toHaveBeenCalled();
  });

  it('throws when unauthenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: new Error('no session') });
    const { uploadFile } = await import('@/lib/supabase/storage');
    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
    await expect(uploadFile(file, 'portfolios', 'user-123')).rejects.toThrow();
  });

  it('throws when /api/upload-image returns non-ok', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: 'RLS violation' }),
    });
    const { uploadFile } = await import('@/lib/supabase/storage');
    const file = new File(['imagedata'], 'photo.jpg', { type: 'image/jpeg' });
    await expect(uploadFile(file, 'portfolios', 'user-123')).rejects.toThrow('RLS violation');
  });
});
```

- [ ] **Step 4.2: Run tests — confirm they fail**

```bash
npx vitest run lib/supabase/__tests__/storage.test.ts
```

Expected: `FAIL` — tests pass for PDF but fail for image routing (direct upload is still used).

- [ ] **Step 4.3: Update `doUpload` in storage.ts**

Replace the entire `doUpload` function in `lib/supabase/storage.ts`. The full updated file:

```typescript
import { createClient } from "./client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ImageBucket } from "@/lib/config/image-compression";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB (images)
const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB (videos)

const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  contracts: ["application/pdf"],
  "evidence-photos": ["image/jpeg", "image/png", "image/webp"],
  portfolios: ["image/jpeg", "image/png", "image/webp", "application/pdf", "video/mp4", "video/webm"],
  "verification-docs": ["application/pdf", "image/jpeg", "image/png"],
  "collaboration-attachments": ["image/jpeg", "image/png", "image/webp", "application/pdf"],
};

function validateFile(file: File, bucket: string): string | null {
  const isVideo = file.type.startsWith("video/");
  const maxSize = isVideo ? MAX_VIDEO_SIZE_BYTES : MAX_FILE_SIZE_BYTES;

  if (file.size > maxSize) {
    const sizeMB = isVideo ? "50 Mo" : "10 Mo";
    return `${file.name} dépasse la taille maximale de ${sizeMB}.`;
  }

  const allowed = ALLOWED_MIME_TYPES[bucket];
  if (!allowed) {
    return `Bucket "${bucket}" n'a pas de règles de type de fichier configurées.`;
  }
  if (!allowed.includes(file.type)) {
    return `${file.name} : type de fichier non autorisé (${file.type}).`;
  }
  return null;
}

async function doUpload(
  supabase: SupabaseClient,
  file: File,
  bucket: string,
  path: string
): Promise<string> {
  const isImage = file.type.startsWith("image/");

  const ext = isImage
    ? "webp"
    : file.name.lastIndexOf(".") !== -1
    ? file.name.slice(file.name.lastIndexOf(".") + 1)
    : "";
  const fileName = ext ? `${crypto.randomUUID()}.${ext}` : crypto.randomUUID();
  const filePath = `${path}/${fileName}`;

  if (isImage) {
    const { compressImageClient } = await import("@/lib/utils/image-compress");
    const compressed = await compressImageClient(file, bucket as ImageBucket);

    const formData = new FormData();
    formData.append("file", compressed);
    formData.append("bucket", bucket);
    formData.append("path", filePath);

    const response = await fetch("/api/upload-image", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: "Upload failed" }));
      throw new Error(body.error ?? "Upload failed");
    }

    const { url } = await response.json();
    return url as string;
  }

  // Non-image: direct Supabase upload
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  if (!publicUrl) {
    throw new Error(
      `Impossible de générer l'URL publique pour "${filePath}". Le bucket "${bucket}" est-il public ?`
    );
  }

  return publicUrl;
}

export async function uploadFile(
  file: File,
  bucket: string,
  path: string
): Promise<string> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Vous devez être connecté pour envoyer des fichiers.");
  }

  const validationError = validateFile(file, bucket);
  if (validationError) {
    throw new Error(validationError);
  }

  return doUpload(supabase, file, bucket, path);
}

export type UploadResult = { file: string; url: string | null; error: string | null };

export async function uploadMultipleFiles(
  files: FileList | File[],
  bucket: string,
  path: string
): Promise<UploadResult[]> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return Array.from(files).map((file) => ({
      file: file.name,
      url: null,
      error: "Vous devez être connecté pour envoyer des fichiers.",
    }));
  }

  const results = await Promise.allSettled(
    Array.from(files).map((file) => {
      const validationError = validateFile(file, bucket);
      if (validationError) return Promise.reject(new Error(validationError));
      return doUpload(supabase, file, bucket, path);
    })
  );

  return Array.from(files).map((file, i) => {
    const result = results[i];
    if (result.status === "fulfilled") {
      return { file: file.name, url: result.value, error: null };
    }
    return { file: file.name, url: null, error: (result.reason as Error).message };
  });
}
```

- [ ] **Step 4.4: Run tests — confirm they pass**

```bash
npx vitest run lib/supabase/__tests__/storage.test.ts
```

Expected: all 4 tests `PASS`.

- [ ] **Step 4.5: Commit**

```bash
git add lib/supabase/storage.ts lib/supabase/__tests__/storage.test.ts
git commit -m "feat: route image uploads through /api/upload-image in storage.ts"
```

---

## Task 5: Add sharp Compression to log-media Server Action

**Files:**
- Modify: `lib/actions/log-media.ts`
- Create: `lib/actions/__tests__/log-media.test.ts`

- [ ] **Step 5.1: Write the failing tests**

Create `lib/actions/__tests__/log-media.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock sharp
const mockToBuffer = vi.fn().mockResolvedValue(Buffer.from('compressed'));
vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    resize: vi.fn().mockReturnThis(),
    webp: vi.fn().mockReturnThis(),
    toBuffer: mockToBuffer,
  })),
}));

// Mock revalidatePath
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

// Mock Supabase server client
const mockStorageUpload = vi.fn().mockResolvedValue({ error: null });
const mockDbInsert = vi.fn().mockReturnValue({
  select: vi.fn().mockReturnValue({
    single: vi.fn().mockResolvedValue({
      data: { id: 'media-1', storage_path: 'proj/log/photo/uuid.webp' },
      error: null,
    }),
  }),
});
const mockFrom = vi.fn().mockImplementation((table: string) => {
  if (table === 'project_logs') {
    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'log-1', author_id: 'user-1' },
            error: null,
          }),
        }),
      }),
    };
  }
  if (table === 'project_log_media') {
    return { insert: mockDbInsert };
  }
  return {};
});

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
    },
    from: mockFrom,
    storage: {
      from: vi.fn().mockReturnValue({ upload: mockStorageUpload }),
    },
  }),
}));

describe('uploadLogMedia', () => {
  beforeEach(() => vi.clearAllMocks());

  it('compresses images with sharp before uploading to storage', async () => {
    const sharp = (await import('sharp')).default;
    const { uploadLogMedia } = await import('@/lib/actions/log-media');

    const form = new FormData();
    form.append('photo0', new File(['imagedata'], 'site.jpg', { type: 'image/jpeg' }));

    await uploadLogMedia('log-1', 'proj-1', form);

    expect(sharp).toHaveBeenCalled();
    expect(mockToBuffer).toHaveBeenCalled();
  });

  it('stores image/webp MIME type in the database after compression', async () => {
    const { uploadLogMedia } = await import('@/lib/actions/log-media');

    const form = new FormData();
    form.append('photo0', new File(['imagedata'], 'site.jpg', { type: 'image/jpeg' }));

    await uploadLogMedia('log-1', 'proj-1', form);

    expect(mockDbInsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ mime_type: 'image/webp' }),
      ]),
    );
  });

  it('saves the storage path with .webp extension', async () => {
    const { uploadLogMedia } = await import('@/lib/actions/log-media');

    const form = new FormData();
    form.append('photo0', new File(['imagedata'], 'site.jpg', { type: 'image/jpeg' }));

    await uploadLogMedia('log-1', 'proj-1', form);

    const uploadPath = mockStorageUpload.mock.calls[0][0] as string;
    expect(uploadPath).toMatch(/\.webp$/);
  });

  it('skips non-image files silently', async () => {
    const sharp = (await import('sharp')).default;
    const { uploadLogMedia } = await import('@/lib/actions/log-media');

    const form = new FormData();
    form.append('doc', new File(['%PDF'], 'scan.pdf', { type: 'application/pdf' }));

    await uploadLogMedia('log-1', 'proj-1', form);

    expect(sharp).not.toHaveBeenCalled();
    expect(mockStorageUpload).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 5.2: Run tests — confirm they fail**

```bash
npx vitest run lib/actions/__tests__/log-media.test.ts
```

Expected: `FAIL` on the `webp` MIME type and `.webp` path assertions (current code uses original MIME/extension).

- [ ] **Step 5.3: Update `uploadLogMedia` in log-media.ts**

Replace the upload loop inside `uploadLogMedia` (from line 28 to end of loop, before `revalidatePath`). Full updated `uploadLogMedia` function:

```typescript
export async function uploadLogMedia(
  logId: string,
  projectId: string,
  files: FormData
): Promise<{ data?: Array<{ id: string; storage_path: string }>; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Non autorisé" };

  const { data: logEntry } = await supabase
    .from("project_logs")
    .select("id, author_id")
    .eq("id", logId)
    .single();

  if (!logEntry || logEntry.author_id !== user.id) {
    return { error: "Non autorisé" };
  }

  const entries = Array.from(files.entries());
  const uploaded: Array<{ id: string; storage_path: string }> = [];

  for (const [, value] of entries) {
    if (!(value instanceof File)) continue;

    const file = value;
    const mimeType = file.type;
    const originalSize = file.size;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) continue;
    if (originalSize > 10 * 1024 * 1024) continue;

    const arrayBuffer = await file.arrayBuffer();
    const rawBuffer = Buffer.from(arrayBuffer);

    const { default: sharp } = await import('sharp');
    const compressedBuffer = await sharp(rawBuffer)
      .resize(1080, 1080, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 70 })
      .toBuffer();

    const uuid = crypto.randomUUID();
    const storagePath = `${projectId}/${logId}/photo/${uuid}.webp`;

    const { error: uploadError } = await supabase.storage
      .from("log-media")
      .upload(storagePath, compressedBuffer, {
        contentType: 'image/webp',
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      continue;
    }

    const { data: mediaRecord, error: dbError } = await supabase
      .from("project_log_media")
      .insert([{
        log_id: logId,
        media_type: 'photo',
        storage_path: storagePath,
        file_name: file.name,
        file_size: compressedBuffer.length,
        mime_type: 'image/webp',
        is_primary: uploaded.length === 0,
      }])
      .select()
      .single();

    if (dbError) {
      console.error("DB error:", dbError);
      continue;
    }

    uploaded.push({ id: mediaRecord.id, storage_path: storagePath });
  }

  revalidatePath(`/projets/${projectId}/journal`);
  return { data: uploaded };
}
```

- [ ] **Step 5.4: Run tests — confirm they pass**

```bash
npx vitest run lib/actions/__tests__/log-media.test.ts
```

Expected: all 4 tests `PASS`.

- [ ] **Step 5.5: Commit**

```bash
git add lib/actions/log-media.ts lib/actions/__tests__/log-media.test.ts
git commit -m "feat: compress log-media photos with sharp before upload"
```

---

## Task 6: Update ProjectPhotoUpload Component

**Files:**
- Modify: `components/pro/ProjectPhotoUpload.tsx`

This component currently has its own custom upload logic (direct Supabase storage call). We replace the upload section with `uploadFile` from `storage.ts`, which already handles client-side compression + API route routing from Task 4.

- [ ] **Step 6.1: Replace the `uploadPhoto` callback**

Open `components/pro/ProjectPhotoUpload.tsx`. Replace the entire `uploadPhoto` useCallback (lines 25–105) with:

```typescript
const uploadPhoto = useCallback(async (file: File): Promise<string | null> => {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    setError(`${file.name} n'est pas un format supporté (JPEG, PNG, WebP)`);
    return null;
  }
  if (file.size > 10 * 1024 * 1024) {
    setError(`${file.name} dépasse 10MB`);
    return null;
  }
  try {
    setUploading(true);
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Vous devez être connecté pour uploader des photos");
      return null;
    }
    const { uploadFile } = await import("@/lib/supabase/storage");
    return await uploadFile(file, "portfolios", user.id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur lors de l'upload de la photo";
    setError(msg);
    return null;
  } finally {
    setUploading(false);
  }
}, []);
```

- [ ] **Step 6.2: Update the loading message in the JSX**

Find the uploading state in the JSX (around line 214) and update the text:

```tsx
// BEFORE:
<p className="text-sm text-on-surface-variant">Upload en cours...</p>

// AFTER:
<p className="text-sm text-on-surface-variant">Compression et envoi en cours...</p>
```

- [ ] **Step 6.3: Run all tests to confirm nothing is broken**

```bash
npx vitest run
```

Expected: all tests `PASS`.

- [ ] **Step 6.4: Commit**

```bash
git add components/pro/ProjectPhotoUpload.tsx
git commit -m "feat: use uploadFile in ProjectPhotoUpload for automatic compression"
```

---

## Final Verification

- [ ] **Step 7.1: Run the full test suite one last time**

```bash
npx vitest run
```

Expected: all tests `PASS`, zero failures.

- [ ] **Step 7.2: Manual smoke test**

Start the dev server:
```bash
npm run dev
```

1. Log in as a professional user
2. Go to a portfolio/realization form and upload a 4–8 MB JPEG photo
3. Open browser DevTools → Network tab — confirm the request to `/api/upload-image` is made and the payload is significantly smaller than the original file
4. Confirm the uploaded image displays correctly in the UI
5. Go to a project journal and upload a log photo — confirm it also uploads and displays correctly
6. Check the Supabase Storage dashboard and confirm files have `.webp` extension

- [ ] **Step 7.3: Final commit if any fixes were needed**

```bash
git add -p
git commit -m "fix: address issues found during smoke test"
```
