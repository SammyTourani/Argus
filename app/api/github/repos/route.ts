import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface GitHubRepoItem {
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  fork: boolean;
  default_branch: string;
  updated_at: string;
  html_url: string;
  stargazers_count: number;
  language: string | null;
}

interface GitHubUserResponse {
  public_repos: number;
  total_private_repos?: number;
  login: string;
}

// GET /api/github/repos?page=1&per_page=20&sort=updated&include_forks=false
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
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const perPage = Math.min(parseInt(searchParams.get('per_page') ?? '30', 10), 100);
    const sort = searchParams.get('sort') ?? 'updated';
    const includeForks = searchParams.get('include_forks') === 'true';

    // Fetch repos from GitHub API
    const reposRes = await fetch(
      `https://api.github.com/user/repos?page=${page}&per_page=${perPage}&sort=${sort}&direction=desc&affiliation=owner`,
      {
        headers: {
          Authorization: `Bearer ${providerToken}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );

    if (!reposRes.ok) {
      if (reposRes.status === 401 || reposRes.status === 403) {
        return NextResponse.json(
          { error: 'GitHub token expired. Please reconnect.', code: 'GITHUB_TOKEN_EXPIRED' },
          { status: 401 }
        );
      }
      const errText = await reposRes.text();
      return NextResponse.json(
        { error: `GitHub API error: ${errText}` },
        { status: 502 }
      );
    }

    const rawRepos = (await reposRes.json()) as GitHubRepoItem[];

    // Filter forks unless explicitly included
    const filteredRepos = includeForks
      ? rawRepos
      : rawRepos.filter((repo) => !repo.fork);

    const repos = filteredRepos.map((repo) => ({
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      private: repo.private,
      default_branch: repo.default_branch,
      updated_at: repo.updated_at,
      html_url: repo.html_url,
      stargazers_count: repo.stargazers_count,
      language: repo.language,
    }));

    // Get total count from user endpoint (approximate)
    let totalCount = repos.length;
    try {
      const userRes = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${providerToken}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });
      if (userRes.ok) {
        const userData = (await userRes.json()) as GitHubUserResponse;
        totalCount = (userData.public_repos ?? 0) + (userData.total_private_repos ?? 0);
      }
    } catch {
      // Fallback to current page count
    }

    return NextResponse.json({
      repos,
      total_count: totalCount,
      page,
      per_page: perPage,
    });
  } catch (err) {
    console.error('[GET /api/github/repos]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
