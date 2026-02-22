import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/config';
import Stripe from 'stripe';
import { createClient as createServiceClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      if (userId) {
        await supabaseAdmin.from('profiles').update({
          subscription_status: 'pro',
          stripe_customer_id: session.customer as string,
          subscription_id: session.subscription as string,
          updated_at: new Date().toISOString(),
        }).eq('id', userId);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single();
      if (profile) {
        await supabaseAdmin.from('profiles').update({
          subscription_status: 'free',
          subscription_id: null,
          updated_at: new Date().toISOString(),
        }).eq('id', profile.id);
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const status = subscription.status === 'active' ? 'pro' : 'free';
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single();
      if (profile) {
        await supabaseAdmin.from('profiles').update({
          subscription_status: status,
          updated_at: new Date().toISOString(),
        }).eq('id', profile.id);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
