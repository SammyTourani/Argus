/**
 * GET  /api/user/recents — get 10 most recently viewed projects
 * POST /api/user/recents — record a project view (upsert)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('recent_views')
      .select('project_id, viewed_at, projects!inner(id, name, description, thumbnail_url)')
      .eq('user_id', user.id)
      .order('viewed_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('[GET /api/user/recents]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const recents = (data ?? []).map((r: any) => ({
      project_id: r.project_id,
      project_name: r.projects?.name || 'Untitled',
      viewed_at: r.viewed_at,
      thumbnail_url: r.projects?.thumbnail_url || null,
    }));

    return NextResponse.json({ recents });
  } catch (err) {
    console.error('[GET /api/user/recents] unexpected:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { project_id } = body;

    if (!project_id) {
      return NextResponse.json({ error: 'project_id is required' }, { status: 400 });
    }

    // Upsert — update viewed_at if exists, otherwise insert
    const { error } = await supabase
      .from('recent_views')
      .upsert(
        { user_id: user.id, project_id, viewed_at: new Date().toISOString() },
        { onConflict: 'user_id,project_id' }
      );

    if (error) {
      console.error('[POST /api/user/recents]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[POST /api/user/recents] unexpected:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
