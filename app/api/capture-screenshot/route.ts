import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url, projectId, buildId } = await request.json();
    if (!url || !projectId || !buildId) {
      return NextResponse.json({ error: 'Missing required fields: url, projectId, buildId' }, { status: 400 });
    }

    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Screenshot service not configured' }, { status: 500 });
    }

    // Call Firecrawl with screenshot-only format for speed
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['screenshot'],
        waitFor: 3000,
        timeout: 20000,
        blockAds: true,
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (!response.ok) {
      console.error('[capture-screenshot] Firecrawl error:', response.status);
      return NextResponse.json({ error: 'Screenshot capture failed' }, { status: 502 });
    }

    const data = await response.json();
    const screenshot = data?.data?.screenshot || data?.data?.actions?.screenshots?.[0] || null;

    if (!screenshot) {
      return NextResponse.json({ error: 'No screenshot returned' }, { status: 422 });
    }

    // Update build thumbnail
    await supabase
      .from('project_builds')
      .update({ thumbnail_url: screenshot })
      .eq('id', buildId)
      .eq('project_id', projectId);

    // Also update project thumbnail directly (trigger won't fire since status is already 'complete')
    await supabase
      .from('projects')
      .update({ thumbnail_url: screenshot })
      .eq('id', projectId);

    return NextResponse.json({ success: true, thumbnailUrl: screenshot });
  } catch (err) {
    console.error('[capture-screenshot] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
