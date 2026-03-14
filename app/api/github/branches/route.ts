import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface GitHubBranchItem {
  name: string;
  protected: boolean;
  commit: {
    sha: string;
  };
}

interface GitHubRepoInfo {
  default_branch: string;
}

// GET /api/github/branches?repo=owner/repo
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const repo = searchParams.get('repo');

    if (!repo || !repo.includes('/')) {
      return NextResponse.json(
        { error: 'Missing or invalid repo parameter. Expected format: owner/repo' },
        { status: 400 }
      );
    }

    // Fetch branches
    const branchesRes = await fetch(
      `https://api.github.com/repos/${repo}/branches?per_page=100`,
      {
        headers: {
          Authorization: `Bearer ${providerToken}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );

    if (!branchesRes.ok) {
      if (branchesRes.status === 404) {
        return NextResponse.json(
          { error: 'Repository not found or no access' },
          { status: 404 }
        );
      }
      if (branchesRes.status === 401 || branchesRes.status === 403) {
        return NextResponse.json(
          { error: 'GitHub token expired. Please reconnect.', code: 'GITHUB_TOKEN_EXPIRED' },
          { status: 401 }
        );
      }
      const errText = await branchesRes.text();
      return NextResponse.json(
        { error: `GitHub API error: ${errText}` },
        { status: 502 }
      );
    }

    const rawBranches = (await branchesRes.json()) as GitHubBranchItem[];

    // Get default branch from repo info
    let defaultBranch = 'main';
    try {
      const repoRes = await fetch(`https://api.github.com/repos/${repo}`, {
        headers: {
          Authorization: `Bearer ${providerToken}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });
      if (repoRes.ok) {
        const repoData = (await repoRes.json()) as GitHubRepoInfo;
        defaultBranch = repoData.default_branch ?? 'main';
      }
    } catch {
      // Fallback to 'main'
    }

    const branches = rawBranches.map((b) => ({
      name: b.name,
      protected: b.protected,
    }));

    // Sort: default branch first, then alphabetical
    branches.sort((a, b) => {
      if (a.name === defaultBranch) return -1;
      if (b.name === defaultBranch) return 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({
      branches,
      default_branch: defaultBranch,
    });
  } catch (err) {
    console.error('[GET /api/github/branches]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
