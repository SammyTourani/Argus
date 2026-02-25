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

type RouteParams = { params: Promise<{ projectId: string; collaboratorId: string }> };

// DELETE /api/projects/[projectId]/collaborators/[collaboratorId]
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const { projectId, collaboratorId } = await params;
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Only project owner can remove collaborators
    const { data: project } = await supabase
      .from('projects')
      .select('id, created_by')
      .eq('id', projectId)
      .eq('created_by', user.id)
      .single();

    if (!project) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { error } = await supabase
      .from('project_collaborators')
      .delete()
      .eq('id', collaboratorId)
      .eq('project_id', projectId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/projects/[id]/collaborators/[colId]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
