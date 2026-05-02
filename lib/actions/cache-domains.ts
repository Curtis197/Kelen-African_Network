// lib/actions/cache-domains.ts
import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";

/**
 * Cached lookup for professional portfolios by custom domain.
 * This function is used by the middleware and other parts of the app
 * to quickly resolve a domain to a professional slug.
 * 
 * Revalidates every hour or when the 'domains' tag is cleared.
 */
export const getCachedPortfolioByDomain = unstable_cache(
  async (domain: string) => {
    
    // Use a service client or public client for these lookups.
    // Since this is public data (custom domains), the anon key is sufficient.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: portfolio, error } = await supabase
      .from("professional_portfolio")
      .select("professional_id, professionals!inner(slug, is_visible)")
      .eq("custom_domain", domain)
      .eq("domain_status", "active")
      .single();

    if (error) {
      if (error.code !== 'PGRST116') { // PGRST116 is 'no rows returned'
      }
      return null;
    }

    const result = {
      slug: (portfolio?.professionals as any)?.slug || null,
      isVisible: (portfolio?.professionals as any)?.is_visible || false
    };

    return result;
  },
  ["portfolio-by-domain"],
  { 
    revalidate: 3600, // 1 hour
    tags: ["domains"] 
  }
);
