import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/ratelimit';
import { getUserSubscriptionGate } from '@/lib/subscription/gate';

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

interface FileEntry {
  path: string;
  content: string;
}

interface DeployRequestBody {
  buildId: string;
  projectId: string;
  projectName?: string;
  files: FileEntry[];
}

// POST /api/deploy — Deploy a build to Vercel as a static site
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

    // Subscription gate: only paid users can deploy
    const gate = await getUserSubscriptionGate(user.id);
    if (!gate.canDeploy) {
      return NextResponse.json(
        { error: 'Deploy is available on Pro and above. Upgrade to deploy your builds.', code: 'DEPLOY_GATED' },
        { status: 403 }
      );
    }

    // Rate limit: 3 deploys per hour per user
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

    const body: DeployRequestBody = await request.json();
    const { buildId, projectId, projectName, files } = body;

    if (!buildId || !projectId || !files || files.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: buildId, projectId, files' },
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

    const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
    if (!VERCEL_TOKEN) {
      return NextResponse.json({ error: 'Vercel token not configured' }, { status: 500 });
    }

    const deployName = `argus-${(projectName ?? project.name ?? 'app')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 32)}-${buildId.slice(0, 8)}`;

    // Build the file list for Vercel deployment.
    // Vercel's API expects { file: "path", data: "content" } objects.
    // For static deployments, we include the files as-is plus a minimal
    // vercel.json that marks this as a static output.
    const vercelFiles: Array<{ file: string; data: string; encoding?: string }> = [];

    // Add user files
    for (const f of files) {
      // Normalise: strip leading slash
      const filePath = f.path.replace(/^\//, '');
      vercelFiles.push({
        file: filePath,
        data: f.content,
        encoding: 'utf-8',
      });
    }

    // Add vercel.json for static output if not already present
    const hasVercelJson = files.some((f) => f.path.replace(/^\//, '') === 'vercel.json');
    if (!hasVercelJson) {
      // Determine if there's an index.html at root or src/index.html
      const hasIndexHtml = files.some((f) =>
        f.path === 'index.html' || f.path === '/index.html'
      );
      const hasNextConfig = files.some((f) =>
        f.path.includes('next.config')
      );

      if (!hasNextConfig) {
        // Static deployment config
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

    // Create Vercel deployment
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
          framework: null, // null = static
          buildCommand: null,
          outputDirectory: null,
          installCommand: null,
        },
        target: 'production',
      }),
    });

    if (!deployResponse.ok) {
      const errorText = await deployResponse.text();
      console.error('[deploy] Vercel API error:', deployResponse.status, errorText);
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

    // Save deployment URL back to the build record
    if (deploymentUrl) {
      await supabase
        .from('project_builds')
        .update({
          preview_url: deploymentUrl,
          // deployment_url is a bonus column — update only if it exists (ignore errors)
        })
        .eq('id', buildId)
        .eq('project_id', projectId);

      // Best-effort: try to update deployment_url as well
      try {
        await supabase
          .from('project_builds')
          .update({ deployment_url: deploymentUrl } as Record<string, unknown>)
          .eq('id', buildId)
          .eq('project_id', projectId);
      } catch {
        // Column may not exist yet — safe to ignore
      }
    }

    return NextResponse.json({
      deploymentUrl,
      deploymentId,
      status,
      name: deployName,
    });
  } catch (err) {
    console.error('[POST /api/deploy]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
