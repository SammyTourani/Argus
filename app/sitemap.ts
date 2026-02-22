import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://argus.build', lastModified: new Date() },
    { url: 'https://argus.build/sign-in', lastModified: new Date() },
    { url: 'https://argus.build/sign-up', lastModified: new Date() },
    { url: 'https://argus.build/privacy', lastModified: new Date() },
    { url: 'https://argus.build/terms', lastModified: new Date() },
  ];
}
