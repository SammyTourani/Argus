import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

function createSupabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}

type RouteParams = { params: { projectId: string } };

// GET /api/projects/[projectId]/builds
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const supabase = createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify project access
    const { data: project } = await supabase
      .from('projects')
      .select('id, created_by')
      .eq('id', params.projectId)
      .single();

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const { data: builds, error } = await supabase
      .from('project_builds')
      .select('*')
      .eq('project_id', params.projectId)
      .order('version_number', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ builds: builds ?? [] });
  } catch (err) {
    console.error('[GET /api/projects/[id]/builds]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/projects/[projectId]/builds — create a new build
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const supabase = createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { source_url, prompt, model_id, style_preset } = body;

    if (!prompt && !source_url) {
      return NextResponse.json({ error: 'prompt or source_url is required' }, { status: 400 });
    }

    // Verify project exists and user has access
    const { data: project } = await supabase
      .from('projects')
      .select('id, created_by, default_model, default_style')
      .eq('id', params.projectId)
      .single();

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const { data: build, error } = await supabase
      .from('project_builds')
      .insert({
        project_id: params.projectId,
        created_by: user.id,
        source_url: source_url ?? null,
        prompt: prompt ?? null,
        model_id: model_id ?? project.default_model ?? 'claude-sonnet-4-6',
        style_preset: style_preset ?? project.default_style ?? 'minimal',
        status: 'pending',
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Update project's last_build_at
    await supabase
      .from('projects')
      .update({ last_build_at: new Date().toISOString(), status: 'building' })
      .eq('id', params.projectId);

    return NextResponse.json({ build }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/projects/[id]/builds]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
