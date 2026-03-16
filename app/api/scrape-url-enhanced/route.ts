import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/ratelimit';
import { processHtml } from '@/lib/scrape/html-processor';

// Function to sanitize smart quotes and other problematic characters
function sanitizeQuotes(text: string): string {
  return text
    // Replace smart single quotes
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    // Replace smart double quotes
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    // Replace other quote-like characters
    .replace(/[\u00AB\u00BB]/g, '"') // Guillemets
    .replace(/[\u2039\u203A]/g, "'") // Single guillemets
    // Replace other problematic characters
    .replace(/[\u2013\u2014]/g, '-') // En dash and em dash
    .replace(/[\u2026]/g, '...') // Ellipsis
    .replace(/[\u00A0]/g, ' '); // Non-breaking space
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP (public route — no auth required)
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimit(ip, 'scrape');
    if (!rateLimit.allowed) {
      const resetIn = Math.ceil((rateLimit.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimit.resetAt),
            'Retry-After': String(resetIn),
          },
        }
      );
    }

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({
        success: false,
        error: 'URL is required'
      }, { status: 400 });
    }

    console.log('[scrape-url-enhanced] Scraping with Firecrawl:', url);

    const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
    if (!FIRECRAWL_API_KEY) {
      throw new Error('FIRECRAWL_API_KEY environment variable is not set');
    }

    // Single Firecrawl call requesting ALL useful formats:
    // - markdown: text content for AI reference
    // - rawHtml: full rendered DOM (preserves nav/footer unlike 'html')
    // - screenshot: viewport capture for vision model
    // - branding: exact design tokens from CSS (colors, fonts, spacing)
    const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'rawHtml', 'screenshot', 'branding'],
        waitFor: 3000,
        timeout: 30000,
        blockAds: true,
        maxAge: 3600000, // Use cached data if less than 1 hour old
        actions: [
          {
            type: 'wait',
            milliseconds: 2000
          },
          {
            type: 'screenshot',
            fullPage: false // Viewport only — Claude downscales >1568px
          }
        ]
      })
    });

    if (!firecrawlResponse.ok) {
      const error = await firecrawlResponse.text();
      throw new Error(`Firecrawl API error: ${error}`);
    }

    const data = await firecrawlResponse.json();

    if (!data.success || !data.data) {
      throw new Error('Failed to scrape content');
    }

    const { markdown, rawHtml, metadata, screenshot, actions, branding } = data.data;

    // Get screenshot from either direct field or actions result
    const screenshotUrl = screenshot || actions?.screenshots?.[0] || null;

    // Sanitize the markdown content
    const sanitizedMarkdown = sanitizeQuotes(markdown || '');

    // Process HTML for structure, images, and fallback styles
    const processed = processHtml(rawHtml || '', url);

    // Extract structured data from the response
    const title = metadata?.title || '';
    const description = metadata?.description || '';

    // Format content for AI (text reference)
    const formattedContent = `
Title: ${sanitizeQuotes(title)}
Description: ${sanitizeQuotes(description)}
URL: ${url}

Main Content:
${sanitizedMarkdown}
    `.trim();

    return NextResponse.json({
      success: true,
      url,
      content: formattedContent,
      screenshot: screenshotUrl,
      // NEW: structured data for pixel-perfect cloning
      html: processed.cleanHtml,
      structureSummary: processed.structureSummary,
      imageUrls: processed.imageUrls,
      branding: branding || null,
      // Fallback styles only when branding is unavailable
      styles: !branding ? processed.styles : undefined,
      structured: {
        title: sanitizeQuotes(title),
        description: sanitizeQuotes(description),
        content: sanitizedMarkdown,
        url,
        screenshot: screenshotUrl
      },
      metadata: {
        scraper: 'firecrawl-enhanced',
        timestamp: new Date().toISOString(),
        contentLength: formattedContent.length,
        cached: data.data.cached || false,
        hasBranding: !!branding,
        hasRawHtml: !!rawHtml,
        imageCount: processed.imageUrls.length,
        ...metadata
      },
    });

  } catch (error) {
    console.error('[scrape-url-enhanced] Error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}
