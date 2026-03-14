import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const SKIP_DIRS = ['node_modules', '.git', 'dist', '.next', '.nuxt', 'build', 'out', '.vercel'];
const MAX_FILE_SIZE = 100 * 1024; // 100KB
const MAX_FILES = 50;

interface GitTreeItem {
  path: string;
  type: 'blob' | 'tree';
  size?: number;
  sha: string;
  url: string;
}

interface GitBlobResponse {
  content: string;
  encoding: string;
  size: number;
}

interface GitHubRepoInfo {
  default_branch: string;
  full_name: string;
}

interface GitHubRefResponse {
  object: {
    sha: string;
  };
}

function shouldSkip(path: string): boolean {
  const parts = path.split('/');
  return parts.some((part) => SKIP_DIRS.includes(part));
}

async function githubFetch(url: string, token: string, options: RequestInit = {}) {
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers as Record<string, string> ?? {}),
    },
  });
}

interface PullRequestBody {
  projectId: string;
  repoUrl: string;
  branch?: string;
}

// POST /api/github/pull — pull latest files from connected GitHub repo
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const body = (await request.json()) as PullRequestBody;
    const { projectId, repoUrl, branch } = body;

    if (!projectId || !repoUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, repoUrl' },
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

    // Parse owner/repo from URL
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/|$)/);
    if (!match) {
      return NextResponse.json({ error: 'Invalid GitHub repo URL' }, { status: 400 });
    }
    const [, owner, repo] = match;
    const fullName = `${owner}/${repo}`;

    // Get repo info for default branch
    const repoRes = await githubFetch(
      `https://api.github.com/repos/${fullName}`,
      providerToken
    );

    if (!repoRes.ok) {
      if (repoRes.status === 404) {
        return NextResponse.json(
          { error: 'Repository not found or no access.' },
          { status: 404 }
        );
      }
      const errText = await repoRes.text();
      return NextResponse.json(
        { error: `GitHub API error: ${errText}` },
        { status: 502 }
      );
    }

    const repoInfo = (await repoRes.json()) as GitHubRepoInfo;
    const targetBranch = branch ?? repoInfo.default_branch ?? 'main';

    // Get the latest commit SHA for the branch
    const refRes = await githubFetch(
      `https://api.github.com/repos/${fullName}/git/ref/heads/${targetBranch}`,
      providerToken
    );

    let commitSha = '';
    if (refRes.ok) {
      const refData = (await refRes.json()) as GitHubRefResponse;
      commitSha = refData.object.sha;
    }

    // Get full file tree for the branch
    const treeRes = await githubFetch(
      `https://api.github.com/repos/${fullName}/git/trees/${targetBranch}?recursive=1`,
      providerToken
    );

    if (!treeRes.ok) {
      const errText = await treeRes.text();
      return NextResponse.json(
        { error: `Failed to fetch repo tree: ${errText}` },
        { status: 502 }
      );
    }

    const treeData = (await treeRes.json()) as { tree: GitTreeItem[] };
    const blobs = treeData.tree.filter(
      (item) =>
        item.type === 'blob' &&
        !shouldSkip(item.path ?? '') &&
        (item.size === undefined || item.size <= MAX_FILE_SIZE)
    );

    const filesToFetch = blobs.slice(0, MAX_FILES);

    // Fetch content for each blob
    const files: Array<{ path: string; content: string }> = [];

    await Promise.all(
      filesToFetch.map(async (item) => {
        try {
          const blobRes = await githubFetch(item.url, providerToken);
          if (!blobRes.ok) return;

          const blobData = (await blobRes.json()) as GitBlobResponse;

          let content = '';
          if (blobData.encoding === 'base64') {
            content = Buffer.from(blobData.content.replace(/\n/g, ''), 'base64').toString('utf-8');
          } else {
            content = blobData.content;
          }

          // Skip binary files
          if (content.includes('\x00')) return;

          files.push({ path: item.path, content });
        } catch {
          // Skip files that fail to fetch
        }
      })
    );

    files.sort((a, b) => a.path.localeCompare(b.path));

    return NextResponse.json({
      files,
      commitSha,
      branch: targetBranch,
      totalFiles: blobs.length,
      importedFiles: files.length,
    });
  } catch (err) {
    console.error('[POST /api/github/pull]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
