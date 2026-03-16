import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/ratelimit';

// 1x1 transparent PNG (67 bytes) — used as fallback for failed/invalid images
const TRANSPARENT_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAAlwSFlzAAAWJQAAFiUBSVIk8AAAAA0lEQVQI12P4z8BQDwAEgAF/QualEQAAAABJRU5ErkJggg==',
  'base64'
);

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * SSRF prevention — block requests to private/internal IPs.
 */
function isPrivateUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase();

    // Block non-http(s) schemes
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return true;

    // Block localhost and loopback
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') return true;
    if (hostname.endsWith('.local') || hostname.endsWith('.internal')) return true;

    // Block private IP ranges
    const parts = hostname.split('.');
    if (parts.length === 4 && parts.every(p => /^\d+$/.test(p))) {
      const [a, b] = parts.map(Number);
      if (a === 10) return true;                          // 10.x.x.x
      if (a === 172 && b >= 16 && b <= 31) return true;  // 172.16-31.x.x
      if (a === 192 && b === 168) return true;            // 192.168.x.x
      if (a === 169 && b === 254) return true;            // 169.254.x.x (link-local)
      if (a === 0) return true;                           // 0.x.x.x
    }

    // Block IPv6 private/reserved ranges
    if (hostname.startsWith('[') || hostname.includes(':')) {
      // Strip brackets from IPv6: [::1] -> ::1
      const ipv6 = hostname.replace(/^\[|\]$/g, '');
      // Block loopback (::1), link-local (fe80::), unique-local (fc00::/fd00::),
      // unspecified (::), multicast (ff00::), and documentation (2001:db8::)
      if (
        ipv6 === '::1' || ipv6 === '::' ||
        ipv6.startsWith('fe80:') ||
        ipv6.startsWith('fc00:') || ipv6.startsWith('fd00:') ||
        ipv6.startsWith('ff') ||
        ipv6.startsWith('2001:db8:')
      ) return true;
      // Allow public IPv6 addresses through
    }

    return false;
  } catch {
    return true; // Block malformed URLs
  }
}

function fallbackImage(): NextResponse {
  return new NextResponse(TRANSPARENT_PNG, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=60',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function GET(request: NextRequest) {
  // 1. Rate limit by IP
  const ip = getClientIp(request);
  const limit = await checkRateLimit(ip, 'generic');
  if (!limit.allowed) {
    return new NextResponse('Rate limited', { status: 429 });
  }

  // 2. Extract and validate URL
  const targetUrl = request.nextUrl.searchParams.get('url');
  if (!targetUrl) {
    return new NextResponse('Missing url param', { status: 400 });
  }

  // 3. SSRF prevention — block private IPs
  if (isPrivateUrl(targetUrl)) {
    return new NextResponse('Blocked', { status: 403 });
  }

  try {
    // 4. Fetch with timeout
    const response = await fetch(targetUrl, {
      signal: AbortSignal.timeout(10000),
      headers: {
        'User-Agent': 'Argus-Image-Proxy/1.0',
        'Accept': 'image/jpeg, image/png, image/gif, image/webp, image/avif, image/svg+xml, image/*',
      },
    });

    if (!response.ok) {
      return fallbackImage();
    }

    // 5. Validate response is an image
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    if (!contentType.startsWith('image/')) {
      return fallbackImage();
    }

    const buffer = await response.arrayBuffer();

    // 6. Size check
    if (buffer.byteLength > MAX_IMAGE_SIZE) {
      return fallbackImage();
    }

    // 7. Return with CORS headers for sandbox iframe access
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      },
    });
  } catch {
    return fallbackImage();
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    },
  });
}
