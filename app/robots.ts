import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kelen.africa';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/login',
          '/register',
          '/dashboard',
          '/pro/',
          '/admin/',
          '/auth/',
          '/api/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/professionnels/',
        disallow: [
          '/login',
          '/register',
          '/dashboard',
          '/pro/',
          '/admin/',
          '/auth/',
          '/api/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
