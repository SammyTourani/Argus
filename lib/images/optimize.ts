import { createHash } from 'crypto';

/**
 * Generate an optimized project thumbnail URL.
 *
 * Uses Next.js Image optimization via /_next/image when a stored
 * thumbnail exists, otherwise returns the OG image generator as fallback.
 */
export function getProjectThumbnailUrl(
  projectId: string,
  width: number = 600
): string {
  // Next.js image optimization endpoint — only works if the image
  // is served from an allowed remotePatterns host or is a local asset.
  // For project thumbnails stored in Supabase Storage:
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    const storageUrl = `${supabaseUrl}/storage/v1/object/public/thumbnails/${projectId}.png`;
    return `/_next/image?url=${encodeURIComponent(storageUrl)}&w=${width}&q=75`;
  }

  // Fallback: generate an OG-style image on-the-fly
  return `/api/og?title=${encodeURIComponent(`Project ${projectId.slice(0, 8)}`)}`;
}

/**
 * Generate a Gravatar URL for a given email address.
 *
 * Falls back to a deterministic "identicon" style if the user has
 * no Gravatar account.
 *
 * @param email - User email address
 * @param size  - Square pixel size (default 80)
 */
export function getAvatarUrl(email: string, size: number = 80): string {
  const trimmed = email.trim().toLowerCase();
  const hash = createHash('md5').update(trimmed).digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
}

/**
 * Generate a blurred placeholder data URL for a given hex color.
 * Useful as the `blurDataURL` prop for next/image.
 */
export function getPlaceholderDataUrl(hex: string = '#0A0A0A'): string {
  // Tiny 1x1 SVG encoded as base64
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1" fill="${hex}"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}
