import { createClient } from "./client";

export async function uploadFile(
  file: File,
  bucket: string,
  path: string
): Promise<string> {
  const supabase = createClient();
  
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `${path}/${fileName}`;

  const { error: uploadError, data } = await supabase.storage
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

export async function uploadMultipleFiles(
  files: FileList | File[],
  bucket: string,
  path: string
): Promise<string[]> {
  const uploadPromises = Array.from(files).map(file => uploadFile(file, bucket, path));
  return Promise.all(uploadPromises);
}
