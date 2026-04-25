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

// Preserve original URL constructor so Vitest's dynamic import still works,
// then add browser-API stubs on top.
const OriginalURL = globalThis.URL;
class StubURL extends OriginalURL {}
(StubURL as unknown as Record<string, unknown>).createObjectURL = vi.fn().mockReturnValue('blob:fake');
(StubURL as unknown as Record<string, unknown>).revokeObjectURL = vi.fn();
vi.stubGlobal('URL', StubURL);

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
