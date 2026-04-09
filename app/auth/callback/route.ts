import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Successfully exchanged code for session
      // Redirect to the intended page or default dashboard
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      // Log the error for debugging
      console.error('Error exchanging code for session:', error);
    }
  }

  // If there's no code or an error occurred, redirect to login with an error
  return NextResponse.redirect(
    `${origin}/connexion?error=${encodeURIComponent('Unable to complete authentication')}`
  );
}
