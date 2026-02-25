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
  name: string;
  description: string | null;
  default_branch: string;
  full_name: string;
}

function shouldSkip(path: string): boolean {
  const parts = path.split('/');
  return parts.some((part) => SKIP_DIRS.includes(part));
}

async function githubFetch(url: string, token: string | null, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(url, { ...options, headers: { ...headers, ...(options.headers as Record<string, string> ?? {}) } });
}

// POST /api/github/import — import files from existing GitHub repo
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

    // Get optional provider_token — public repos work without it
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const providerToken = session?.provider_token ?? null;

    const body = await request.json();
    const { repoUrl } = body as { repoUrl: string };

    if (!repoUrl) {
      return NextResponse.json({ error: 'Missing repoUrl' }, { status: 400 });
    }

    // Step 1: Parse owner/repo from URL
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/|$)/);
    if (!match) {
      return NextResponse.json({ error: 'Invalid GitHub repo URL' }, { status: 400 });
    }
    const [, owner, repo] = match;

    // Step 2: Get repo metadata
    const repoRes = await githubFetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      providerToken
    );

    if (!repoRes.ok) {
      const errText = await repoRes.text();
      if (repoRes.status === 404) {
        return NextResponse.json(
          { error: 'Repository not found or is private. Connect your GitHub account to access private repos.' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: `GitHub API error: ${errText}` },
        { status: 502 }
      );
    }

    const repoInfo = (await repoRes.json()) as GitHubRepoInfo;
    const defaultBranch = repoInfo.default_branch ?? 'main';

    // Step 3: Get full file tree
    const treeRes = await githubFetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
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

    // Limit to MAX_FILES
    const filesToFetch = blobs.slice(0, MAX_FILES);

    // Step 4: Fetch content for each blob
    const files: Array<{ path: string; content: string }> = [];

    await Promise.all(
      filesToFetch.map(async (item) => {
        try {
          const blobRes = await githubFetch(item.url, providerToken);
          if (!blobRes.ok) return;

          const blobData = (await blobRes.json()) as GitBlobResponse;

          // Decode content (GitHub returns base64)
          let content = '';
          if (blobData.encoding === 'base64') {
            content = Buffer.from(blobData.content.replace(/\n/g, ''), 'base64').toString('utf-8');
          } else {
            content = blobData.content;
          }

          // Skip binary files (non-UTF8)
          if (content.includes('\x00')) return;

          files.push({ path: item.path, content });
        } catch {
          // Skip files that fail to fetch
        }
      })
    );

    // Sort files by path for consistent ordering
    files.sort((a, b) => a.path.localeCompare(b.path));

    return NextResponse.json({
      files,
      repoName: repoInfo.name,
      description: repoInfo.description,
      defaultBranch,
      totalFiles: blobs.length,
      importedFiles: files.length,
    });
  } catch (err) {
    console.error('[POST /api/github/import]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
