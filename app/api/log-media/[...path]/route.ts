import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const filePath = decodeURIComponent(path.join('/'));

  // Validate file path is within log-media bucket scope
  if (!filePath.startsWith('log-media/') && !filePath.includes('/photo/')) {
    return new NextResponse('Invalid path', { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return new NextResponse('Missing Supabase credentials', { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase.storage
    .from('log-media')
    .createSignedUrl(filePath, 3600); // 1 hour

  if (error || !data?.signedUrl) {
    return new NextResponse('File not found', { status: 404 });
  }

  // Redirect to the signed URL
  return NextResponse.redirect(data.signedUrl);
}
