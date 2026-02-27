import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getUserUsage } from '@/lib/usage/tracker';
import type { RateLimitTier } from '@/lib/ratelimit-tiered';
import { withStaleWhileRevalidate } from '@/lib/cache-headers';

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

export interface WorkspaceStats {
  totalProjects: number;
  totalBuilds: number;
  deploysThisMonth: number;
  apiCallsToday: number;
  recentActivity: RecentActivityItem[];
  // Usage tracking fields (from usage tracker)
  buildsThisMonth: number;
  buildsLimit: number | null;
  tier: RateLimitTier;
}

export interface RecentActivityItem {
  id: string;
  type: 'created' | 'built' | 'deployed';
  projectName: string;
  projectId: string;
  timestamp: string;
  meta?: {
    versionNumber?: number;
    modelId?: string;
    previewUrl?: string;
  };
}

// GET /api/workspace/stats — workspace statistics for current user
export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Count projects
    const { count: totalProjects } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', user.id);

    // 2. Count total builds across all user's projects
    const { data: userProjects } = await supabase
      .from('projects')
      .select('id')
      .eq('created_by', user.id);

    const projectIds = (userProjects ?? []).map((p) => p.id);
    let totalBuilds = 0;
    let deploysThisMonth = 0;
    let apiCallsToday = 0;
    const recentActivity: RecentActivityItem[] = [];

    if (projectIds.length > 0) {
      // Total builds
      const { count: buildCount } = await supabase
        .from('project_builds')
        .select('*', { count: 'exact', head: true })
        .in('project_id', projectIds);

      totalBuilds = buildCount ?? 0;

      // Deploys this month (builds with preview_url set, created this month)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: deployCount } = await supabase
        .from('project_builds')
        .select('*', { count: 'exact', head: true })
        .in('project_id', projectIds)
        .not('preview_url', 'is', null)
        .gte('created_at', startOfMonth.toISOString());

      deploysThisMonth = deployCount ?? 0;

      // API calls today (estimate: each build = ~3 API calls for generation)
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const { count: todayBuildCount } = await supabase
        .from('project_builds')
        .select('*', { count: 'exact', head: true })
        .in('project_id', projectIds)
        .gte('created_at', startOfDay.toISOString());

      apiCallsToday = (todayBuildCount ?? 0) * 3;

      // Recent 10 builds with project names for activity feed
      const { data: recentBuilds } = await supabase
        .from('project_builds')
        .select('id, project_id, version_number, model_id, preview_url, created_at, status')
        .in('project_id', projectIds)
        .order('created_at', { ascending: false })
        .limit(10);

      // Map project IDs to names
      const { data: projectsWithNames } = await supabase
        .from('projects')
        .select('id, name, created_at')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      const projectNameMap: Record<string, string> = {};
      for (const p of projectsWithNames ?? []) {
        projectNameMap[p.id] = p.name;
      }

      // Build activity items from builds
      for (const build of recentBuilds ?? []) {
        const projectName = projectNameMap[build.project_id] || 'Unknown Project';

        // If it has a preview_url, it's a deploy
        if (build.preview_url) {
          recentActivity.push({
            id: `deploy-${build.id}`,
            type: 'deployed',
            projectName,
            projectId: build.project_id,
            timestamp: build.created_at,
            meta: { previewUrl: build.preview_url },
          });
        } else {
          recentActivity.push({
            id: `build-${build.id}`,
            type: 'built',
            projectName,
            projectId: build.project_id,
            timestamp: build.created_at,
            meta: {
              versionNumber: build.version_number,
              modelId: build.model_id,
            },
          });
        }
      }

      // Add recent project creations to activity
      const recentCreated = (projectsWithNames ?? []).slice(0, 5);
      for (const project of recentCreated) {
        recentActivity.push({
          id: `created-${project.id}`,
          type: 'created',
          projectName: project.name,
          projectId: project.id,
          timestamp: project.created_at,
        });
      }

      // Sort all activity by timestamp descending, take top 10
      recentActivity.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      recentActivity.splice(10);
    }

    // Fetch usage tracking data
    let buildsThisMonth = 0;
    let buildsLimit: number | null = null;
    let tier: RateLimitTier = 'free';
    try {
      const usageData = await getUserUsage(user.id);
      buildsThisMonth = usageData.buildsThisMonth;
      buildsLimit = usageData.buildsLimit;
      tier = usageData.tier;
    } catch (usageErr) {
      console.warn('[GET /api/workspace/stats] usage fetch failed:', usageErr);
    }

    const stats: WorkspaceStats = {
      totalProjects: totalProjects ?? 0,
      totalBuilds,
      deploysThisMonth,
      apiCallsToday,
      recentActivity,
      buildsThisMonth,
      buildsLimit,
      tier,
    };

    return withStaleWhileRevalidate(NextResponse.json(stats), 10, 60);
  } catch (err) {
    console.error('[GET /api/workspace/stats] unexpected:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
