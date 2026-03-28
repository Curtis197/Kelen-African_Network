// lib/supabase/storage.ts
import { createClient } from "./client";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  contracts: ["application/pdf"],
  "evidence-photos": ["image/jpeg", "image/png", "image/webp"],
  portfolios: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  "verification-docs": ["application/pdf", "image/jpeg", "image/png"],
};

function validateFile(file: File, bucket: string): string | null {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `${file.name} dépasse la taille maximale de 10 Mo.`;
  }
  const allowed = ALLOWED_MIME_TYPES[bucket];
  if (allowed && !allowed.includes(file.type)) {
    return `${file.name} : type de fichier non autorisé (${file.type}).`;
  }
  return null;
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

  const fileExt = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `${path}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file);

  if (uploadError) {
    throw uploadError;
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return publicUrl;
}

export type UploadResult = { file: string; url: string | null; error: string | null };

export async function uploadMultipleFiles(
  files: FileList | File[],
  bucket: string,
  path: string
): Promise<UploadResult[]> {
  const results = await Promise.allSettled(
    Array.from(files).map((file) => uploadFile(file, bucket, path))
  );

  return Array.from(files).map((file, i) => {
    const result = results[i];
    if (result.status === "fulfilled") {
      return { file: file.name, url: result.value, error: null };
    }
    return { file: file.name, url: null, error: (result.reason as Error).message };
  });
}
