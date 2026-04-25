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
