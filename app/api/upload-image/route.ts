import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { createClient } from '@/lib/supabase/server';
import { IMAGE_COMPRESSION_CONFIG, type ImageBucket } from '@/lib/config/image-compression';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const bucket = formData.get('bucket') as string | null;
  const path = formData.get('path') as string | null;

  if (!file || !bucket || !path) {
    return NextResponse.json({ error: 'Missing required fields: file, bucket, path' }, { status: 400 });
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  let buffer = Buffer.from(arrayBuffer);

  const config = IMAGE_COMPRESSION_CONFIG[bucket as ImageBucket] ?? null;
  if (config) {
    buffer = await sharp(buffer)
      .resize(config.maxWidth, config.maxHeight, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: config.quality })
      .toBuffer();
  }

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType: 'image/webp', upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}
