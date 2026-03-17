/**
 * POST /api/user/delete-account — permanently delete the authenticated user's account
 *
 * Deletion order (validated against CASCADE behavior):
 * 1. Verify confirmEmail matches user email
 * 2. Cancel personal Stripe subscription
 * 3. Cancel team Stripe subscriptions (for teams where user is sole owner)
 * 4. Delete teams where user is sole owner (cascades team_members)
 * 5. Delete auth user via admin.auth.admin.deleteUser()
 *    → CASCADE deletes: profiles, projects, project_builds, build_messages,
 *      project_collaborators, team_members, marketplace_listings, onboarding_state,
 *      user_model_preferences, user_api_keys, user_connectors, referrals, recent_views, builds
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
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const confirmEmail = (body.confirmEmail || '').trim().toLowerCase();

    if (!confirmEmail || confirmEmail !== (user.email || '').toLowerCase()) {
      return NextResponse.json({ error: 'Email does not match. Please type your email to confirm.' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const stripe = getStripe();

    // 1. Cancel personal Stripe subscription
    const { data: profile } = await admin
      .from('profiles')
      .select('subscription_id, stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profile?.subscription_id) {
      try {
        await stripe.subscriptions.cancel(profile.subscription_id);
      } catch (err) {
        console.error('[delete-account] Failed to cancel personal subscription:', err);
      }
    }

    // 2. Find teams where user is owner
    const { data: ownedMemberships } = await admin
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .eq('role', 'owner');

    if (ownedMemberships && ownedMemberships.length > 0) {
      for (const membership of ownedMemberships) {
        const teamId = membership.team_id;

        // Check if sole owner
        const { count: ownerCount } = await admin
          .from('team_members')
          .select('id', { count: 'exact', head: true })
          .eq('team_id', teamId)
          .eq('role', 'owner');

        if ((ownerCount || 0) <= 1) {
          // Sole owner — cancel team subscription and delete team
          const { data: team } = await admin
            .from('teams')
            .select('stripe_subscription_id')
            .eq('id', teamId)
            .single();

          if (team?.stripe_subscription_id) {
            try {
              await stripe.subscriptions.cancel(team.stripe_subscription_id);
            } catch (err) {
              console.error(`[delete-account] Failed to cancel team ${teamId} subscription:`, err);
            }
          }

          await admin.from('teams').delete().eq('id', teamId);
        }
        // Multi-owner teams: user's membership removed by CASCADE from auth.users delete
      }
    }

    // 3. Delete auth user — this CASCADE deletes everything
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error('[delete-account] Failed to delete auth user:', deleteError);
      return NextResponse.json({ error: 'Failed to delete account. Please try again or contact support.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[POST /api/user/delete-account] unexpected:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
