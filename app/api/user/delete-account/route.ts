/**
 * POST /api/user/delete-account — permanently delete the authenticated user's account
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { getStripe } from '@/lib/stripe/config';

function getSupabaseAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const confirmEmail = (body.confirmEmail || '').trim().toLowerCase();
    if (!confirmEmail || confirmEmail !== (user.email || '').toLowerCase())
      return NextResponse.json({ error: 'Email does not match.' }, { status: 400 });

    const admin = getSupabaseAdmin();
    const stripe = getStripe();

    // Cancel personal Stripe subscription
    const { data: profile } = await admin.from('profiles').select('subscription_id').eq('id', user.id).single();
    if (profile?.subscription_id) {
      try { await stripe.subscriptions.cancel(profile.subscription_id); } catch (e) { console.error('[delete-account] personal sub cancel:', e); }
    }

    // Cancel team subscriptions where user is sole owner
    const { data: ownedMemberships } = await admin.from('team_members').select('team_id').eq('user_id', user.id).eq('role', 'owner');
    for (const m of ownedMemberships || []) {
      const { count } = await admin.from('team_members').select('id', { count: 'exact', head: true }).eq('team_id', m.team_id).eq('role', 'owner');
      if ((count || 0) <= 1) {
        const { data: team } = await admin.from('teams').select('stripe_subscription_id').eq('id', m.team_id).single();
        if (team?.stripe_subscription_id) {
          try { await stripe.subscriptions.cancel(team.stripe_subscription_id); } catch (e) { console.error('[delete-account] team sub cancel:', e); }
        }
        await admin.from('teams').delete().eq('id', m.team_id);
      }
    }

    // Delete auth user — cascades to all data
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error('[delete-account] auth delete:', deleteError);
      return NextResponse.json({ error: 'Failed to delete account.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[POST /api/user/delete-account]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
