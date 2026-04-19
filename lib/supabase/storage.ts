import { createClient } from "./client";
import type { SupabaseClient } from "@supabase/supabase-js";

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
  // Check file size based on type
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

// Internal: assumes auth already verified and file already validated
async function doUpload(
  supabase: SupabaseClient,
  file: File,
  bucket: string,
  path: string
): Promise<string> {
  const dotIndex = file.name.lastIndexOf(".");
  const fileExt = dotIndex !== -1 ? file.name.slice(dotIndex + 1) : "";
  const fileName = dotIndex !== -1
    ? `${crypto.randomUUID()}.${fileExt}`
    : crypto.randomUUID();
  const filePath = `${path}/${fileName}`;

  console.log("[Storage] upload:", { bucket, path, fileName, filePath });

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file);

  if (uploadError) {
    console.error("[Storage] upload error:", uploadError);
    throw uploadError;
  }

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
  console.log('[Storage] uploadFile called:', { 
    fileName: file.name, 
    fileType: file.type, 
    fileSize: file.size,
    bucket, 
    path 
  });
  
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log('[Storage] Auth check:', { 
    authenticated: !!user, 
    userId: user?.id, 
    authError: authError?.message 
  });
  
  if (authError || !user) {
    console.error('[Storage] ❌ Auth failed:', authError);
    throw new Error("Vous devez être connecté pour envoyer des fichiers.");
  }

  const validationError = validateFile(file, bucket);
  console.log('[Storage] Validation result:', { 
    error: validationError,
    valid: !validationError 
  });
  
  if (validationError) {
    console.error('[Storage] ❌ Validation failed:', validationError);
    throw new Error(validationError);
  }

  console.log('[Storage] Calling doUpload...');
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
      if (validationError) {
        return Promise.reject(new Error(validationError));
      }
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
