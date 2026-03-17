import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Read plan and optional team_id from body
    let plan: 'pro' | 'team' = 'pro';
    let teamId: string | null = null;
    try {
      const body = await req.json();
      if (body?.plan === 'team') plan = 'team';
      if (body?.team_id && body.team_id !== 'personal') teamId = body.team_id;
    } catch {
      // body is optional — ignore parse errors
    }

    // Resolve price ID from env
    const priceId = plan === 'team'
      ? process.env.STRIPE_TEAM_PRICE_ID
      : process.env.STRIPE_PRO_PRICE_ID;

    if (!priceId) {
      return NextResponse.json({ error: `Stripe ${plan} price not configured` }, { status: 500 });
    }

    const admin = getSupabaseAdmin();
    let customerId: string | undefined;

    if (teamId) {
      // ── Team workspace checkout ────────────────────────────────────────────
      // Verify user is owner or admin of the team
      const { data: membership } = await admin
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', user.id)
        .single();

      if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
        return NextResponse.json({ error: 'Only team owners or admins can upgrade' }, { status: 403 });
      }

      // Get or create Stripe customer for the team
      const { data: team } = await admin
        .from('teams')
        .select('stripe_customer_id, name')
        .eq('id', teamId)
        .single();

      customerId = team?.stripe_customer_id ?? undefined;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: team?.name ?? undefined,
          metadata: { team_id: teamId, created_by: user.id },
        });
        customerId = customer.id;

        await admin
          .from('teams')
          .update({ stripe_customer_id: customerId })
          .eq('id', teamId);
      }
    } else {
      // ── Personal workspace checkout ────────────────────────────────────────
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single();

      customerId = profile?.stripe_customer_id ?? undefined;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { supabase_user_id: user.id },
        });
        customerId = customer.id;

        await supabase
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', user.id);
      }
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      'https://buildargus.com';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/settings?billing=success`,
      cancel_url: `${appUrl}/settings?billing=cancelled`,
      metadata: {
        supabase_user_id: user.id,
        plan,
        ...(teamId ? { team_id: teamId } : {}),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
