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
