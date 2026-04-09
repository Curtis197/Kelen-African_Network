import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
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

  // Extract log ID from path (format: log-media/<log-id>/photo/<filename>)
  const pathParts = filePath.split('/');
  const logId = pathParts.length >= 2 ? pathParts[1] : null;

  if (!logId) {
    return new NextResponse('Invalid file path', { status: 400 });
  }

  // Authenticate user
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Verify user has access to the log
  const { data: logEntry } = await supabase
    .from('project_logs')
    .select('project_id, pro_project_id, author_id')
    .eq('id', logId)
    .single();

  if (!logEntry) {
    return new NextResponse('Log not found', { status: 404 });
  }

  // Check if user is the author
  if (logEntry.author_id === user.id) {
    // User is the author, grant access
  } else if (logEntry.project_id) {
    // Check if user owns the client project
    const { data: project } = await supabase
      .from('user_projects')
      .select('id')
      .eq('id', logEntry.project_id)
      .eq('user_id', user.id)
      .single();

    if (!project) {
      return new NextResponse('Unauthorized', { status: 403 });
    }
  } else if (logEntry.pro_project_id) {
    // Check if user owns the pro project
    const { data: professional } = await supabase
      .from('professionals')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!professional) {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    const { data: proProject } = await supabase
      .from('pro_projects')
      .select('id')
      .eq('id', logEntry.pro_project_id)
      .eq('professional_id', professional.id)
      .single();

    if (!proProject) {
      return new NextResponse('Unauthorized', { status: 403 });
    }
  } else {
    return new NextResponse('Unauthorized', { status: 403 });
  }

  // Generate signed URL with service role
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return new NextResponse('Missing Supabase credentials', { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabaseAdmin.storage
    .from('log-media')
    .createSignedUrl(filePath, 3600); // 1 hour

  if (error || !data?.signedUrl) {
    console.error('Error generating signed URL:', error);
    return new NextResponse('File not found', { status: 404 });
  }

  // Redirect to the signed URL
  return NextResponse.redirect(data.signedUrl);
}
