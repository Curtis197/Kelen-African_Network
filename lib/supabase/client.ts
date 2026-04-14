// ============================================
// Kelen — Supabase Browser Client
// Use in 'use client' components
// ============================================

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set."
    );
  }

  return createBrowserClient(url, anonKey, {
    global: {
      // Handle auth errors gracefully
      fetch: async (url, options = {}) => {
        const result = await fetch(url, options);
        
        // Check for auth errors (401, invalid token, etc.)
        if (!result.ok) {
          const clone = result.clone();
          try {
            const body = await clone.json();
            const isAuthError = 
              result.status === 401 ||
              body?.error?.includes('Invalid Refresh Token') ||
              body?.error?.includes('refresh_token') ||
              body?.error_code === 'refresh_token_not_found';
            
            if (isAuthError) {
              console.warn('[Supabase Client] Auth error detected — clearing invalid session:', {
                status: result.status,
                error: body?.error,
                url: result.url,
              });
              // Clear corrupted auth state by removing all Supabase cookies
              // This prevents infinite refresh loop on invalid tokens
              const cookies = document.cookie.split(';');
              cookies.forEach(cookie => {
                const name = cookie.split('=')[0].trim();
                if (name.startsWith('sb-')) {
                  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
                }
              });
              // Reload to reset app state
              window.location.href = '/';
            }
          } catch (e) {
            // Response is not JSON, proceed normally
          }
        }
        
        return result;
      },
    },
  });
}
