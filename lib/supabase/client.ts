// ============================================
// Kelen — Supabase Browser Client
// Use in 'use client' components
// ============================================

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Build-time safety: return a dummy client if keys are missing
  if (!url || !anonKey) {
    return createBrowserClient(
      "https://placeholder.supabase.co",
      "placeholder"
    );
  }

  return createBrowserClient(url, anonKey);
}
