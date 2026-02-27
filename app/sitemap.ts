import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://buildargus.dev';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/sign-in`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/sign-up`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/gallery`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/marketplace`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  // Dynamic: public shared builds
  let publicBuilds: MetadataRoute.Sitemap = [];
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: builds } = await supabase
      .from('builds')
      .select('share_token, updated_at')
      .not('share_token', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(500);

    if (builds) {
      publicBuilds = builds.map((build) => ({
        url: `${baseUrl}/builds/${build.share_token}`,
        lastModified: new Date(build.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));
    }
  } catch {
    // If Supabase is unavailable, return only static pages
  }

  return [...staticPages, ...publicBuilds];
}
