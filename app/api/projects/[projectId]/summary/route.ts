import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type RouteParams = { params: Promise<{ projectId: string }> };

/**
 * GET /api/projects/[projectId]/summary
 * Returns a condensed AI context summary of what's been built in the project.
 * Used by the builder to inject project history into new generation prompts
 * so the AI understands what already exists.
 */
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get project metadata
    const { data: project } = await supabase
      .from('projects')
      .select('name, description, default_model, default_style, created_at, last_build_at')
      .eq('id', projectId)
      .single();

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    // Get latest 5 builds
    const { data: builds } = await supabase
      .from('project_builds')
      .select('id, version_number, status, model, style, title, created_at')
      .eq('project_id', projectId)
      .order('version_number', { ascending: false })
      .limit(5);

    // Get last 20 messages across all builds for this project (most recent activity)
    const { data: messages } = await supabase
      .from('build_messages')
      .select('role, content, created_at')
      .eq('project_id', projectId)
      .eq('role', 'user') // only user prompts for the summary
      .order('created_at', { ascending: false })
      .limit(20);

    // Build a structured context summary
    const summary = {
      project: {
        name: project.name,
        description: project.description,
        defaultModel: project.default_model ?? 'claude-sonnet-4-6',
        defaultStyle: project.default_style ?? 'minimal',
        createdAt: project.created_at,
        lastBuildAt: project.last_build_at,
      },
      builds: (builds ?? []).map(b => ({
        id: b.id,
        version: b.version_number,
        status: b.status,
        model: b.model,
        style: b.style,
        title: b.title?.slice(0, 200),
        createdAt: b.created_at,
      })),
      recentPrompts: (messages ?? [])
        .slice(0, 10)
        .map(m => m.content.slice(0, 300))
        .reverse(), // chronological order
      // Context string for AI injection
      contextString: buildContextString(project.name, project.description, builds ?? [], messages ?? []),
    };

    return NextResponse.json({ summary });
  } catch (err) {
    console.error('[GET /api/projects/[id]/summary]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function buildContextString(
  projectName: string,
  description: string | null,
  builds: Array<{ version_number: number; title?: string | null; status: string }>,
  messages: Array<{ role: string; content: string }>
): string {
  const lines: string[] = [
    `Project: "${projectName}"`,
    description ? `Description: ${description}` : '',
    builds.length > 0 ? `Build history: ${builds.length} build(s)` : 'No builds yet.',
  ].filter(Boolean);

  if (builds.length > 0) {
    const latest = builds[0];
    lines.push(`Latest build (v${latest.version_number}): ${latest.status}`);
    if (latest.title) {
      lines.push(`Latest build title: "${latest.title.slice(0, 150)}"`);
    }
  }

  const recentUserMessages = messages
    .filter(m => m.role === 'user')
    .slice(0, 5)
    .map(m => m.content.slice(0, 100));

  if (recentUserMessages.length > 0) {
    lines.push(`Recent requests: ${recentUserMessages.map(m => `"${m}"`).join('; ')}`);
  }

  return lines.join('\n');
}
