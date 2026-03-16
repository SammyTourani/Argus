import { type NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { checkRateLimit } from '@/lib/ratelimit';
import { validateProjectName, validateProjectDescription } from '@/lib/validation';
import { createClient } from '@/lib/supabase/server';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/projects — fetch projects for current user, optionally filtered by team
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamId = request.nextUrl.searchParams.get('team_id');

    let query = supabase
      .from('projects')
      .select(`
        *,
        project_collaborators (
          id, role, status, user_id
        )
      `)
      .order('updated_at', { ascending: false });

    // Filter by workspace context
    if (teamId === 'personal') {
      // Personal workspace: only projects not associated with any team
      query = query.is('team_id', null);
    } else if (teamId && UUID_RE.test(teamId)) {
      // Team workspace: only projects belonging to this team (RLS enforces membership)
      query = query.eq('team_id', teamId);
    }
    // No team_id param: return all projects (backward compatible)

    const { data: projects, error } = await query;

    if (error) {
      console.error('[GET /api/projects]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Batch-fetch latest build for every project in ONE query (fixes N+1)
    const projectIds = (projects ?? []).map((p) => p.id);
    let latestBuildsByProject: Record<string, any> = {};

    if (projectIds.length > 0) {
      const { data: allBuilds } = await supabase
        .from('project_builds')
        .select('id, project_id, status, preview_url, created_at, model, version_number')
        .in('project_id', projectIds)
        .order('version_number', { ascending: false });

      // Group by project_id, keeping only the first (latest) build per project
      for (const build of allBuilds ?? []) {
        if (!latestBuildsByProject[build.project_id]) {
          latestBuildsByProject[build.project_id] = build;
        }
      }
    }

    const projectsWithBuilds = (projects ?? []).map((project) => ({
      ...project,
      latest_build: latestBuildsByProject[project.id] ?? null,
    }));

    return NextResponse.json({ projects: projectsWithBuilds });
  } catch (err) {
    console.error('[GET /api/projects] unexpected:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/projects — create new project
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit: 20 project creates per hour per user
    const rateLimit = await checkRateLimit(`user:${user.id}`, 'projectCreate');
    if (!rateLimit.allowed) {
      const resetIn = Math.ceil((rateLimit.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { error: `Too many projects created. Try again in ${Math.ceil(resetIn / 60)} minutes.` },
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

    const body = await request.json();
    const { source_url, default_model, default_style, team_id } = body;

    // Validate and sanitize inputs
    let name: string;
    let description: string | null;
    try {
      name = validateProjectName(body.name);
      description = validateProjectDescription(body.description);
    } catch (validationError) {
      return NextResponse.json(
        { error: (validationError as Error).message },
        { status: 400 }
      );
    }

    // If team_id provided, verify user is a member of the team
    let validatedTeamId: string | null = null;
    if (team_id && team_id !== 'personal' && !UUID_RE.test(team_id)) {
      return NextResponse.json(
        { error: 'Invalid workspace ID format' },
        { status: 400 }
      );
    }
    if (team_id && team_id !== 'personal' && UUID_RE.test(team_id)) {
      const { data: membership } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', team_id)
        .eq('user_id', user.id)
        .single();

      if (!membership) {
        return NextResponse.json(
          { error: 'You are not a member of this workspace' },
          { status: 403 }
        );
      }
      validatedTeamId = team_id;
    }

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        created_by: user.id,
        name,
        description,
        default_model: default_model ?? null,
        default_style: default_style ?? null,
        status: 'active',
        ...(validatedTeamId ? { team_id: validatedTeamId } : {}),
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
        title: source_url,
        status: 'pending',
        model: default_model ?? 'claude-sonnet-4-6',
        style: default_style ?? 'minimal',
      });
    }

    return NextResponse.json({ project }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/projects] unexpected:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
