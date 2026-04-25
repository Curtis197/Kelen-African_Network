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
    expect(cfg!.maxHeight).toBe(1080);
    expect(cfg!.quality).toBe(70);
    expect(cfg!.clientQuality).toBe(0.7);
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
