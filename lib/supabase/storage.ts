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
  "log-media": ["image/jpeg", "image/png", "image/webp"],
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
