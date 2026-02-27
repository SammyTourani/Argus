import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/ratelimit';

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

interface RollbackRequestBody {
  projectId: string;
  buildId: string;
}

// POST /api/deploy/rollback
// Re-deploys a previous build's code snapshot
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServer();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit: shares the deploy limit (3/hr)
    const rateLimit = await checkRateLimit(`user:${user.id}`, 'deploy');
    if (!rateLimit.allowed) {
      const resetIn = Math.ceil((rateLimit.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { error: `Deploy rate limit exceeded. Try again in ${Math.ceil(resetIn / 60)} minutes.` },
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

    const body: RollbackRequestBody = await request.json();
    const { projectId, buildId } = body;

    if (!projectId || !buildId) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, buildId' },
        { status: 400 }
      );
    }

    // Verify project access
    const { data: project } = await supabase
      .from('projects')
      .select('id, name, created_by')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Fetch the build's files
    const { data: build, error: buildError } = await supabase
      .from('project_builds')
      .select('id, files_json, version_number, project_id')
      .eq('id', buildId)
      .eq('project_id', projectId)
      .single();

    if (buildError || !build) {
      return NextResponse.json(
        { error: 'Build not found' },
        { status: 404 }
      );
    }

    if (!build.files_json) {
      return NextResponse.json(
        { error: 'No files available for this build. Cannot rollback.' },
        { status: 422 }
      );
    }

    // Extract files from files_json
    // files_json is a JSONB column with the structure: { files: [{ path, content }] }
    // or it may be an array directly
    const snapshot = build.files_json as Record<string, unknown>;
    const files: Array<{ path: string; content: string }> = Array.isArray(snapshot)
      ? snapshot
      : Array.isArray(snapshot.files)
      ? snapshot.files
      : [];

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'Code snapshot is empty. Cannot rollback.' },
        { status: 422 }
      );
    }

    const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
    if (!VERCEL_TOKEN) {
      return NextResponse.json(
        { error: 'Vercel token not configured' },
        { status: 500 }
      );
    }

    // Build deploy name
    const deployName = `argus-${(project.name ?? 'app')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 32)}-rb-${buildId.slice(0, 8)}`;

    // Build Vercel file list
    const vercelFiles: Array<{ file: string; data: string; encoding?: string }> = [];

    for (const f of files) {
      const filePath = f.path.replace(/^\//, '');
      vercelFiles.push({
        file: filePath,
        data: f.content,
        encoding: 'utf-8',
      });
    }

    // Add vercel.json for static output if not present
    const hasVercelJson = files.some((f) => f.path.replace(/^\//, '') === 'vercel.json');
    if (!hasVercelJson) {
      const hasIndexHtml = files.some(
        (f) => f.path === 'index.html' || f.path === '/index.html'
      );
      const hasNextConfig = files.some((f) => f.path.includes('next.config'));

      if (!hasNextConfig) {
        const vercelConfig = hasIndexHtml
          ? JSON.stringify({ cleanUrls: true, trailingSlash: false }, null, 2)
          : JSON.stringify(
              {
                cleanUrls: true,
                trailingSlash: false,
                rewrites: [{ source: '/(.*)', destination: '/index.html' }],
              },
              null,
              2
            );

        vercelFiles.push({
          file: 'vercel.json',
          data: vercelConfig,
          encoding: 'utf-8',
        });
      }
    }

    // Deploy to Vercel
    const deployResponse = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: deployName,
        files: vercelFiles,
        projectSettings: {
          framework: null,
          buildCommand: null,
          outputDirectory: null,
          installCommand: null,
        },
        target: 'production',
      }),
    });

    if (!deployResponse.ok) {
      const errorText = await deployResponse.text();
      console.error('[deploy/rollback] Vercel API error:', deployResponse.status, errorText);
      return NextResponse.json(
        { error: `Vercel deployment failed: ${deployResponse.status}`, details: errorText },
        { status: 502 }
      );
    }

    const deployData = await deployResponse.json();

    const deploymentUrl = deployData.url
      ? `https://${deployData.url}`
      : deployData.alias?.[0]
      ? `https://${deployData.alias[0]}`
      : null;

    const deploymentId = deployData.id ?? deployData.uid ?? null;
    const status = deployData.readyState ?? deployData.status ?? 'INITIALIZING';

    // Update the build record with new deployment URL
    if (deploymentUrl) {
      await supabase
        .from('project_builds')
        .update({ preview_url: deploymentUrl })
        .eq('id', buildId)
        .eq('project_id', projectId);
    }

    return NextResponse.json({
      deploymentUrl,
      deploymentId,
      status,
      name: deployName,
      rollbackFromBuild: buildId,
      rollbackVersion: build.version_number,
    });
  } catch (err) {
    console.error('[POST /api/deploy/rollback]', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
