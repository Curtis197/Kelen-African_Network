import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kelen.africa';

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/recherche`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/comment-ca-marche`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/a-propos`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/pros`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  // Only paid professionals appear in the sitemap (SSR + indexed)
  // TODO: Add subscription check when payment flow is implemented
  // For now, include all professionals with a business_name
  const supabase = await createClient();
  const { data: professionals } = await supabase
    .from('professionals')
    .select('slug, updated_at')
    .not('slug', 'is', null)
    .not('business_name', 'is', null)
    .order('updated_at', { ascending: false });

  const professionalRoutes: MetadataRoute.Sitemap = professionals
    ? professionals.map((pro) => ({
        url: `${baseUrl}/professionnels/${pro.slug}`,
        lastModified: pro.updated_at ? new Date(pro.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
    : [];

  return [...staticRoutes, ...professionalRoutes];
}
