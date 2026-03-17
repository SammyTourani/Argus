import { NextRequest, NextResponse } from 'next/server';
import { getWorkspaceSubscriptionGate } from '@/lib/subscription/gate';
import { createClient } from '@/lib/supabase/server';
import { MODELS } from '@/lib/models';

// GET /api/user/subscription?team_id=<uuid>
// If team_id is provided, returns the team workspace's subscription.
// If omitted or 'personal', returns the user's personal subscription.
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamIdParam = request.nextUrl.searchParams.get('team_id');
    const teamId = teamIdParam && teamIdParam !== 'personal' ? teamIdParam : null;

    const gate = await getWorkspaceSubscriptionGate(user.id, teamId);

    return NextResponse.json({
      tier: gate.tier,
      canBuild: gate.canBuild,
      canDeploy: gate.canDeploy,
      canUseAllModels: gate.canUseAllModels,
      canCollaborate: gate.canCollaborate,
      buildsRemaining: gate.buildsRemaining,
      maxBuilds: gate.maxBuildsPerMonth,
      creditsRemaining: gate.creditsRemaining,
      creditsTotal: gate.creditsTotal,
      modelCreditCosts: Object.fromEntries(MODELS.map(m => [m.id, m.creditCost])),
      teamId: teamId,
    });
  } catch (err) {
    console.error('[GET /api/user/subscription]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
