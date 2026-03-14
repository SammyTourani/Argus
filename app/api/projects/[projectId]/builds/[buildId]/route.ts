import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type RouteParams = { params: Promise<{ projectId: string; buildId: string }> };

// GET /api/projects/[projectId]/builds/[buildId] — fetch a single build
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const { projectId, buildId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify project access
    const { data: project } = await supabase
      .from('projects')
      .select('id, created_by')
      .eq('id', projectId)
      .single();

    if (!project)
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const { data: build, error } = await supabase
      .from('project_builds')
      .select('*')
      .eq('id', buildId)
      .eq('project_id', projectId)
      .single();

    if (error || !build)
      return NextResponse.json({ error: 'Build not found' }, { status: 404 });

    return NextResponse.json({ build });
  } catch (err) {
    console.error('[GET /api/projects/[projectId]/builds/[buildId]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/projects/[projectId]/builds/[buildId] — update build fields
// Allowed: title, status, preview_url
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { projectId, buildId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify project access
    const { data: project } = await supabase
      .from('projects')
      .select('id, created_by')
      .eq('id', projectId)
      .single();

    if (!project)
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const body = await request.json();

    // Only allow safe fields to be updated
    const allowedFields = ['title', 'status', 'preview_url'] as const;
    type AllowedField = (typeof allowedFields)[number];
    const patch: Partial<Record<AllowedField, unknown>> = {};

    for (const field of allowedFields) {
      if (field in body) {
        patch[field] = body[field];
      }
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const { data: build, error } = await supabase
      .from('project_builds')
      .update(patch)
      .eq('id', buildId)
      .eq('project_id', projectId)
      .select()
      .single();

    if (error || !build) {
      return NextResponse.json(
        { error: error?.message ?? 'Build not found' },
        { status: error ? 500 : 404 }
      );
    }

    return NextResponse.json({ build });
  } catch (err) {
    console.error('[PATCH /api/projects/[projectId]/builds/[buildId]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
