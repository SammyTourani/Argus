import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

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

// GET /api/projects — fetch all projects for current user
export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_collaborators (
          id, role, status, user_id,
          profiles ( full_name, avatar_url )
        )
      `)
      .or(`created_by.eq.${user.id}`)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[GET /api/projects]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // For each project, fetch the latest build thumbnail
    const projectsWithBuilds = await Promise.all(
      (projects ?? []).map(async (project) => {
        const { data: latestBuild } = await supabase
          .from('project_builds')
          .select('id, status, preview_url, created_at, model_id, version_number')
          .eq('project_id', project.id)
          .order('version_number', { ascending: false })
          .limit(1)
          .single();

        return { ...project, latest_build: latestBuild ?? null };
      })
    );

    return NextResponse.json({ projects: projectsWithBuilds });
  } catch (err) {
    console.error('[GET /api/projects] unexpected:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/projects — create new project
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, source_url, default_model, default_style } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        created_by: user.id,
        name: name.trim(),
        description: description?.trim() ?? null,
        default_model: default_model ?? null,
        default_style: default_style ?? null,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('[POST /api/projects]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If source_url provided, create the first build immediately
    if (source_url) {
      await supabase.from('project_builds').insert({
        project_id: project.id,
        created_by: user.id,
        source_url,
        status: 'pending',
        model_id: default_model ?? 'claude-sonnet-4-6',
        style_preset: default_style ?? 'minimal',
      });
    }

    return NextResponse.json({ project }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/projects] unexpected:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
