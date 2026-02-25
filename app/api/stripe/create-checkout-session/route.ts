import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Read plan from body (optional — defaults to 'pro')
    let plan: 'pro' | 'team' = 'pro';
    try {
      const body = await req.json();
      if (body?.plan === 'team') plan = 'team';
    } catch {
      // body is optional — ignore parse errors
    }

    // Resolve price ID from env
    const priceId =
      plan === 'team'
        ? (process.env.STRIPE_TEAM_PRICE_ID ?? process.env.STRIPE_PRO_PRICE_ID!)
        : process.env.STRIPE_PRO_PRICE_ID!;

    if (!priceId) {
      return NextResponse.json({ error: 'Stripe price not configured' }, { status: 500 });
    }

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

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

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      'https://buildargus.com';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/account?billing=success`,
      cancel_url: `${appUrl}/account?billing=cancelled`,
      metadata: { supabase_user_id: user.id, plan },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
