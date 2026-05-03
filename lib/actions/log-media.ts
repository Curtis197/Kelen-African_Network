"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

export async function uploadLogMedia(
  logId: string,
  projectId: string,
  files: FormData
): Promise<{ data?: Array<{ id: string; storage_path: string }>; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Non autorisé" };

  const { data: logEntry } = await supabase
    .from("project_logs")
    .select("id, author_id")
    .eq("id", logId)
    .single();

  if (!logEntry || logEntry.author_id !== user.id) {
    return { error: "Non autorisé" };
  }

  const entries = Array.from(files.entries());
  const uploaded: Array<{ id: string; storage_path: string }> = [];

  for (const [, value] of entries) {
    if (!(value instanceof File)) continue;

    const file = value;
    const mimeType = file.type;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) continue;
    if (file.size > 10 * 1024 * 1024) continue;

    const arrayBuffer = await file.arrayBuffer();
    const rawBuffer = Buffer.from(arrayBuffer);

    const { default: sharp } = await import('sharp');
    const compressedBuffer = await sharp(rawBuffer)
      .resize(1080, 1080, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 70 })
      .toBuffer();

    const uuid = crypto.randomUUID();
    const storagePath = `${projectId}/${logId}/photo/${uuid}.webp`;

    const { error: uploadError } = await supabase.storage
      .from("log-media")
      .upload(storagePath, compressedBuffer, {
        contentType: 'image/webp',
        upsert: false,
      });

    if (uploadError) {
      continue;
    }

    const { data: mediaRecord, error: dbError } = await supabase
      .from("project_log_media")
      .insert([{
        log_id: logId,
        media_type: 'photo',
        storage_path: storagePath,
        file_name: file.name,
        file_size: compressedBuffer.length,
        mime_type: 'image/webp',
        is_primary: uploaded.length === 0,
      }])
      .select()
      .single();

    if (dbError) {
      continue;
    }

    uploaded.push({ id: mediaRecord.id, storage_path: storagePath });
  }

  revalidatePath(`/projets/${projectId}/journal`);
  return { data: uploaded };
}

export async function deleteLogMedia(
  mediaId: string,
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Non autorisé" };

  const { data: media } = await supabase
    .from("project_log_media")
    .select("log_id, storage_path")
    .eq("id", mediaId)
    .single();

  if (!media) return { success: false, error: "Média introuvable" };

  // Verify ownership via log
  const { data: logEntry } = await supabase
    .from("project_logs")
    .select("author_id")
    .eq("id", media.log_id)
    .single();

  if (!logEntry || logEntry.author_id !== user.id) {
    return { success: false, error: "Non autorisé" };
  }

  // Delete from storage
  await supabase.storage.from("log-media").remove([media.storage_path]);

  // Delete from DB
  const { error } = await supabase
    .from("project_log_media")
    .delete()
    .eq("id", mediaId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/projets/${projectId}/journal`);
  return { success: true };
}

export async function getMediaUrl(storagePath: string): Promise<string | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .storage
    .from("log-media")
    .createSignedUrl(storagePath, 3600); // 1 hour expiry

  return data?.signedUrl || null;
}

export async function getLogMedia(logId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("project_log_media")
    .select("*")
    .eq("log_id", logId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    return [];
  }

  return data || [];
}
