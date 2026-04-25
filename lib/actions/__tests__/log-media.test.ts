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
