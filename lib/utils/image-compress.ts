import { IMAGE_COMPRESSION_CONFIG, type ImageBucket } from '@/lib/config/image-compression';

let _webPSupported: boolean | null = null;
function canvasSupportsWebP(): boolean {
  if (_webPSupported === null) {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    _webPSupported = canvas.toDataURL('image/webp').startsWith('data:image/webp');
  }
  return _webPSupported;
}

export function compressImageClient(file: File, bucket: ImageBucket): Promise<File> {
  if (typeof document === 'undefined') return Promise.resolve(file);
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
