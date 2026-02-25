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

interface FileEntry {
  path: string;
  content: string;
}

interface SyncRequestBody {
  projectId: string;
  buildId: string;
  repoUrl?: string;
  repoName?: string;
  files: FileEntry[];
  commitMessage?: string;
}

interface GitHubBlob {
  sha: string;
}

interface GitHubRef {
  object: { sha: string };
}

interface GitHubTree {
  sha: string;
}

interface GitHubCommit {
  sha: string;
  html_url: string;
}

interface GitHubRepo {
  full_name: string;
  html_url: string;
  default_branch: string;
}

async function githubFetch(url: string, token: string, options: RequestInit = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
  return res;
}

// POST /api/github/sync — push current build files to GitHub
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServer();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get provider_token from session (GitHub OAuth token)
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const providerToken = session?.provider_token ?? null;

    if (!providerToken) {
      return NextResponse.json(
        { error: 'GitHub not connected', code: 'GITHUB_NOT_CONNECTED' },
        { status: 401 }
      );
    }

    const body: SyncRequestBody = await request.json();
    const { projectId, buildId, repoUrl, repoName, files, commitMessage } = body;

    if (!projectId || !buildId || !files || files.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, buildId, files' },
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

    // Get GitHub user info
    const userRes = await githubFetch('https://api.github.com/user', providerToken);
    if (!userRes.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch GitHub user info' },
        { status: 502 }
      );
    }
    const ghUser = (await userRes.json()) as { login: string };
    const owner = ghUser.login;

    let repoFullName: string;
    let defaultBranch = 'main';

    if (repoUrl) {
      // Parse owner/repo from URL
      const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/|$)/);
      if (!match) {
        return NextResponse.json({ error: 'Invalid GitHub repo URL' }, { status: 400 });
      }
      repoFullName = `${match[1]}/${match[2]}`;

      // Get repo info for default branch
      const repoRes = await githubFetch(
        `https://api.github.com/repos/${repoFullName}`,
        providerToken
      );
      if (repoRes.ok) {
        const repoData = (await repoRes.json()) as GitHubRepo;
        defaultBranch = repoData.default_branch ?? 'main';
      }
    } else {
      // Create new repo
      const sanitizedName = (
        repoName ??
        `argus-${(project.name as string)
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .replace(/-+/g, '-')
          .slice(0, 40)}`
      );

      const createRes = await githubFetch(
        'https://api.github.com/user/repos',
        providerToken,
        {
          method: 'POST',
          body: JSON.stringify({
            name: sanitizedName,
            description: `Built with Argus AI`,
            private: false,
            auto_init: true,
          }),
        }
      );

      if (!createRes.ok) {
        const errText = await createRes.text();
        // If repo already exists (422), try to use it
        if (createRes.status === 422) {
          repoFullName = `${owner}/${sanitizedName}`;
          const existingRes = await githubFetch(
            `https://api.github.com/repos/${repoFullName}`,
            providerToken
          );
          if (existingRes.ok) {
            const existingRepo = (await existingRes.json()) as GitHubRepo;
            defaultBranch = existingRepo.default_branch ?? 'main';
          }
        } else {
          return NextResponse.json(
            { error: `Failed to create GitHub repo: ${errText}` },
            { status: 502 }
          );
        }
      } else {
        const newRepo = (await createRes.json()) as GitHubRepo;
        repoFullName = newRepo.full_name;
        defaultBranch = newRepo.default_branch ?? 'main';
      }
    }

    // Step 2: Get current branch SHA
    let baseTreeSha: string | null = null;
    let latestCommitSha: string | null = null;

    const refRes = await githubFetch(
      `https://api.github.com/repos/${repoFullName}/git/ref/heads/${defaultBranch}`,
      providerToken
    );

    if (refRes.ok) {
      const refData = (await refRes.json()) as GitHubRef;
      latestCommitSha = refData.object.sha;

      // Get the tree SHA from the latest commit
      const commitRes = await githubFetch(
        `https://api.github.com/repos/${repoFullName}/git/commits/${latestCommitSha}`,
        providerToken
      );
      if (commitRes.ok) {
        const commitData = (await commitRes.json()) as { tree: { sha: string } };
        baseTreeSha = commitData.tree.sha;
      }
    }

    // Step 3: Create blobs for each file
    const treeItems: Array<{
      path: string;
      mode: string;
      type: string;
      sha: string;
    }> = [];

    for (const file of files) {
      const blobRes = await githubFetch(
        `https://api.github.com/repos/${repoFullName}/git/blobs`,
        providerToken,
        {
          method: 'POST',
          body: JSON.stringify({
            content: Buffer.from(file.content).toString('base64'),
            encoding: 'base64',
          }),
        }
      );

      if (!blobRes.ok) {
        const errText = await blobRes.text();
        console.error('[github/sync] blob creation failed:', errText);
        continue;
      }

      const blob = (await blobRes.json()) as GitHubBlob;
      treeItems.push({
        path: file.path.replace(/^\//, ''),
        mode: '100644',
        type: 'blob',
        sha: blob.sha,
      });
    }

    // Step 4: Create tree
    const treeBody: Record<string, unknown> = { tree: treeItems };
    if (baseTreeSha) treeBody.base_tree = baseTreeSha;

    const treeRes = await githubFetch(
      `https://api.github.com/repos/${repoFullName}/git/trees`,
      providerToken,
      {
        method: 'POST',
        body: JSON.stringify(treeBody),
      }
    );

    if (!treeRes.ok) {
      const errText = await treeRes.text();
      return NextResponse.json(
        { error: `Failed to create git tree: ${errText}` },
        { status: 502 }
      );
    }

    const treeData = (await treeRes.json()) as GitHubTree;

    // Step 5: Create commit
    const commitBody: Record<string, unknown> = {
      message: commitMessage ?? 'Build from Argus',
      tree: treeData.sha,
    };
    if (latestCommitSha) commitBody.parents = [latestCommitSha];

    const commitRes = await githubFetch(
      `https://api.github.com/repos/${repoFullName}/git/commits`,
      providerToken,
      {
        method: 'POST',
        body: JSON.stringify(commitBody),
      }
    );

    if (!commitRes.ok) {
      const errText = await commitRes.text();
      return NextResponse.json(
        { error: `Failed to create commit: ${errText}` },
        { status: 502 }
      );
    }

    const commitData = (await commitRes.json()) as GitHubCommit;

    // Step 6: Update branch ref
    const updateRefRes = await githubFetch(
      `https://api.github.com/repos/${repoFullName}/git/refs/heads/${defaultBranch}`,
      providerToken,
      {
        method: 'PATCH',
        body: JSON.stringify({
          sha: commitData.sha,
          force: true,
        }),
      }
    );

    if (!updateRefRes.ok) {
      const errText = await updateRefRes.text();
      return NextResponse.json(
        { error: `Failed to update branch ref: ${errText}` },
        { status: 502 }
      );
    }

    const finalRepoUrl = `https://github.com/${repoFullName}`;

    // Step 7: Save repoUrl to projects table metadata
    try {
      await supabase
        .from('projects')
        .update({ github_repo_url: finalRepoUrl } as Record<string, unknown>)
        .eq('id', projectId);
    } catch {
      // Column may not exist yet — safe to ignore
    }

    // Step 8: Return result
    return NextResponse.json({
      repoUrl: finalRepoUrl,
      commitUrl: commitData.html_url,
      commitSha: commitData.sha,
    });
  } catch (err) {
    console.error('[POST /api/github/sync]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/github/sync?projectId=xxx — returns connected repo info for a project
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    const supabase = await createSupabaseServer();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: project } = await supabase
      .from('projects')
      .select('id, name, github_repo_url')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const repoUrl = (project as Record<string, unknown>).github_repo_url as string | null;

    return NextResponse.json({
      repoUrl: repoUrl ?? null,
      connected: !!repoUrl,
    });
  } catch (err) {
    console.error('[GET /api/github/sync]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
