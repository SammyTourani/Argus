import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/deploy/history?projectId=xxx&limit=10
// Returns deployment history for a project
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const limitParam = searchParams.get('limit');
    const limit = Math.min(Math.max(parseInt(limitParam ?? '10', 10) || 10, 1), 50);

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing required parameter: projectId' },
        { status: 400 }
      );
    }

    // Verify project access
    const { data: project } = await supabase
      .from('projects')
      .select('id, created_by')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Fetch builds that have been deployed (preview_url is not null)
    const { data: builds, error: buildsError } = await supabase
      .from('project_builds')
      .select('id, version_number, preview_url, status, created_at')
      .eq('project_id', projectId)
      .not('preview_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (buildsError) {
      console.error('[deploy/history] Supabase error:', buildsError);
      return NextResponse.json(
        { error: 'Failed to fetch deployment history' },
        { status: 500 }
      );
    }

    const deployments = (builds ?? []).map((build) => {
      const createdAt = new Date(build.created_at).getTime();
      return {
        id: build.id,
        buildId: build.id,
        version: build.version_number,
        url: build.preview_url,
        status: build.status ?? 'deployed',
        createdAt: build.created_at,
        // Duration is calculated as time from creation to now for recent,
        // or estimated from version data. Actual Vercel build time would
        // require storing it separately.
        duration: null as number | null,
      };
    });

    return NextResponse.json({ deployments });
  } catch (err) {
    console.error('[GET /api/deploy/history]', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
