import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const isDev = process.env.NODE_ENV === 'development';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');
  const error = searchParams.get('error');

  if (isDev) console.log('[Auth Callback] Received callback', { code: !!code, next, error, origin });

  // Check for OAuth errors
  if (error) {
    console.error('[Auth Callback] OAuth error', { error, error_description: searchParams.get('error_description') });
    return NextResponse.redirect(
      `${origin}/connexion?error=${encodeURIComponent(error)}`
    );
  }

  if (code) {
    const supabase = await createClient();

    if (isDev) console.log('[Auth Callback] Exchanging code for session');
    const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

    if (!sessionError) {
      if (isDev) console.log('[Auth Callback] Session established', {
        userId: sessionData?.user?.id,
        email: sessionData?.user?.email,
        provider: sessionData?.user?.app_metadata?.provider,
        hasAvatar: !!sessionData?.user?.user_metadata?.avatar_url
      });

      // Sync Google profile data if this is a Google OAuth login
      const provider = sessionData?.user?.app_metadata?.provider;
      if (provider === 'google') {
        if (isDev) console.log('[Auth Callback] Google OAuth detected, syncing profile');

        const metadata = sessionData.user.user_metadata || {};
        const avatarUrl = metadata.avatar_url || metadata.picture || metadata.photo_link;
        const fullName = metadata.full_name || metadata.name || metadata.display_name;

        if (isDev) console.log('[Auth Callback] Google metadata extracted', {
          hasAvatar: !!avatarUrl,
          avatarUrlPreview: avatarUrl ? `${avatarUrl.substring(0, 60)}...` : null,
          fullName,
          emailVerified: metadata.email_verified,
        });

        // Determine user role
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role, profile_picture_url, display_name')
          .eq('id', sessionData.user.id)
          .single();

        if (isDev) console.log('[Auth Callback] Current user data', {
          role: userData?.role,
          currentAvatar: userData?.profile_picture_url,
          currentName: userData?.display_name,
          error: userError?.message,
          code: userError?.code
        });

        if (userError?.code === '42501') {
          console.error('[Auth Callback] ❌ EXPLICIT RLS BLOCKING on users select!');
          console.error('[Auth Callback] Table: users, User:', sessionData.user.id);
          console.error('[Auth Callback] Fix: Check RLS policy allows select where id = auth.uid()');
        }

        const role = userData?.role || 'client';
        const isProfessional = role.startsWith('pro_');

        // Update users table with Google profile data
        const updateData: any = {};
        if (avatarUrl && avatarUrl !== userData?.profile_picture_url) {
          updateData.profile_picture_url = avatarUrl;
        }
        if (fullName && fullName !== userData?.display_name) {
          updateData.display_name = fullName;
        }

        if (Object.keys(updateData).length > 0) {
          if (isDev) console.log('[Auth Callback] Updating users table', { updateData, userId: sessionData.user.id });

          const { error: updateError } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', sessionData.user.id);

          if (isDev) console.log('[Auth Callback] Users update result', {
            success: !updateError,
            error: updateError?.message,
            code: updateError?.code,
            updatedFields: Object.keys(updateData),
          });

          if (updateError?.code === '42501') {
            console.error('[Auth Callback] ❌ EXPLICIT RLS BLOCKING on users update!');
            console.error('[Auth Callback] Table: users, User:', sessionData.user.id);
            console.error('[Auth Callback] Fix: Check RLS policy allows update where id = auth.uid()');
          }
        } else {
          if (isDev) console.log('[Auth Callback] No user updates needed - profile already in sync');
        }

        // If professional, also update professionals table
        if (isProfessional && avatarUrl && avatarUrl !== userData?.profile_picture_url) {
          if (isDev) console.log('[Auth Callback] Updating professionals table', { userId: sessionData.user.id });

          const { error: proUpdateError } = await supabase
            .from('professionals')
            .update({ profile_picture_url: avatarUrl })
            .eq('user_id', sessionData.user.id);

          if (isDev) console.log('[Auth Callback] Professionals update result', {
            success: !proUpdateError,
            error: proUpdateError?.message,
            code: proUpdateError?.code,
          });

          if (proUpdateError?.code === '42501') {
            console.error('[Auth Callback] ❌ EXPLICIT RLS BLOCKING on professionals update!');
            console.error('[Auth Callback] Table: professionals, User:', sessionData.user.id);
            console.error('[Auth Callback] Fix: Check RLS policy allows update where user_id = auth.uid()');
          }
        }

        if (isDev) console.log('[Auth Callback] Google profile sync completed');
      }

      // Determine the correct dashboard based on user role
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', sessionData.user.id)
        .single();

      if (isDev) console.log('[Auth Callback] User role query', { role: user?.role, error: userError?.message, code: userError?.code });

      const role = user?.role || 'client';
      let redirectPath = '/dashboard';

      if (role === 'admin') {
        redirectPath = '/admin';
      } else if (role.startsWith('pro_')) {
        redirectPath = '/pro/dashboard';
      }

      // Use explicit ?next= param if provided, otherwise role-based default
      const finalPath = next || redirectPath;
      if (isDev) console.log('[Auth Callback] Redirecting to', { finalPath, role, next });
      return NextResponse.redirect(`${origin}${finalPath}`);
    } else {
      console.error('[Auth Callback] Error exchanging code for session', {
        error: sessionError.message,
        code: sessionError.code,
        status: sessionError.status
      });
    }
  }

  if (isDev) console.warn('[Auth Callback] Unable to complete authentication, redirecting to login');
  return NextResponse.redirect(
    `${origin}/connexion?error=${encodeURIComponent('Unable to complete authentication')}`
  );
}
