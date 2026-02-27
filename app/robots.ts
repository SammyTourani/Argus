import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/workspace', '/onboarding', '/api/', '/auth/', '/app', '/dashboard', '/account'],
      },
    ],
    sitemap: 'https://buildargus.dev/sitemap.xml',
  };
}
