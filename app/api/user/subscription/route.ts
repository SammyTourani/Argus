import { NextResponse } from 'next/server';
import { getUserSubscriptionGate } from '@/lib/subscription/gate';
import { createClient } from '@/lib/supabase/server';

// GET /api/user/subscription
export async function GET() {
  try {
    const supabase = await createClient();
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
