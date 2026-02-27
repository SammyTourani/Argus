/**
 * Utilities for adding HTTP cache headers to API responses.
 *
 * These use standard Cache-Control headers that work with Vercel's Edge Network,
 * CDNs, and browser caches.
 */

/**
 * Add a simple Cache-Control max-age header to a Response.
 *
 * @param response - The NextResponse or Response object
 * @param maxAge   - Cache duration in seconds (default 60)
 * @returns The same response with cache headers set
 */
export function withCacheHeaders(response: Response, maxAge: number = 60): Response {
  response.headers.set(
    'Cache-Control',
    `public, max-age=${maxAge}`
  );
  return response;
}

/**
 * Add stale-while-revalidate cache headers to a Response.
 *
 * The response is considered fresh for `maxAge` seconds, then stale content
 * is served for up to `staleAge` additional seconds while the cache
 * revalidates in the background.
 *
 * @param response - The NextResponse or Response object
 * @param maxAge   - Fresh cache duration in seconds (default 60)
 * @param staleAge - Stale-while-revalidate window in seconds (default 300)
 * @returns The same response with cache headers set
 */
export function withStaleWhileRevalidate(
  response: Response,
  maxAge: number = 60,
  staleAge: number = 300
): Response {
  response.headers.set(
    'Cache-Control',
    `public, max-age=${maxAge}, stale-while-revalidate=${staleAge}`
  );
  return response;
}
