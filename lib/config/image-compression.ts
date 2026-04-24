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
