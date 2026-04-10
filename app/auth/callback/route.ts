import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Determine the correct dashboard based on user role
      const { data: user } = await supabase
        .from('users')
        .select('role')
        .single();

      const role = user?.role || 'client';
      let redirectPath = '/dashboard';

      if (role === 'admin') {
        redirectPath = '/admin';
      } else if (role.startsWith('pro_')) {
        redirectPath = '/pro/dashboard';
      }

      // Use explicit ?next= param if provided, otherwise role-based default
      const finalPath = next || redirectPath;
      return NextResponse.redirect(`${origin}${finalPath}`);
    } else {
      console.error('Error exchanging code for session:', error);
    }
  }

  return NextResponse.redirect(
    `${origin}/connexion?error=${encodeURIComponent('Unable to complete authentication')}`
  );
}
