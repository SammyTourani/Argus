import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
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

// GET /api/user/subscription
export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const gate = await getUserSubscriptionGate(user.id);

    return NextResponse.json({
      tier: gate.tier,
      canBuild: gate.canBuild,
      canDeploy: gate.canDeploy,
      canUseAllModels: gate.canUseAllModels,
      canCollaborate: gate.canCollaborate,
      buildsRemaining: gate.buildsRemaining,
      maxBuilds: gate.maxBuildsPerMonth,
    });
  } catch (err) {
    console.error('[GET /api/user/subscription]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
