import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type RouteParams = { params: Promise<{ projectId: string; buildId: string }> };

// GET /api/projects/[projectId]/builds/[buildId]/messages
// Returns full conversation history for a build
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const { projectId, buildId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: messages, error } = await supabase
      .from('build_messages')
      .select('*')
      .eq('build_id', buildId)
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) {
      // Table might not exist yet — return empty gracefully
      if (error.code === '42P01') return NextResponse.json({ messages: [] });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ messages: messages ?? [] });
  } catch (err) {
    console.error('[GET /builds/[id]/messages]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/projects/[projectId]/builds/[buildId]/messages
// Append a message to conversation history
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { projectId, buildId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { role, content, file_changes } = body;

    if (!role || !content) {
      return NextResponse.json({ error: 'role and content required' }, { status: 400 });
    }

    const { data: message, error } = await supabase
      .from('build_messages')
      .insert({
        build_id: buildId,
        project_id: projectId,
        user_id: user.id,
        role,
        content,
        file_changes: file_changes ?? [],
      })
      .select()
      .single();

    if (error) {
      // Table might not exist yet — fail silently (localStorage fallback works)
      if (error.code === '42P01') return NextResponse.json({ message: null, warning: 'build_messages table not yet created' });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (err) {
    console.error('[POST /builds/[id]/messages]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
