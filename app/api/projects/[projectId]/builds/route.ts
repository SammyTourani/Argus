import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

async function createSupabaseServer() {
  const cookieStore = await cookies();
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

type RouteParams = { params: Promise<{ projectId: string }> };

// GET /api/projects/[projectId]/builds
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify project access
    const { data: project } = await supabase
      .from('projects')
      .select('id, created_by')
      .eq('id', projectId)
      .single();

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const { data: builds, error } = await supabase
      .from('project_builds')
      .select('*')
      .eq('project_id', projectId)
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
    const { projectId } = await params;
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { title, description, model, style } = body;

    // Verify project exists and user has access
    const { data: project } = await supabase
      .from('projects')
      .select('id, created_by, default_model, default_style')
      .eq('id', projectId)
      .single();

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const { data: build, error } = await supabase
      .from('project_builds')
      .insert({
        project_id: projectId,
        created_by: user.id,
        title: title ?? null,
        description: description ?? null,
        model: model ?? (project as { default_model?: string }).default_model ?? 'claude-sonnet-4-6',
        style: style ?? (project as { default_style?: string }).default_style ?? 'minimal',
        status: 'pending',
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Update project's last_build_at
    await supabase
      .from('projects')
      .update({ last_build_at: new Date().toISOString(), status: 'building' })
      .eq('id', projectId);

    return NextResponse.json({ build }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/projects/[id]/builds]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
