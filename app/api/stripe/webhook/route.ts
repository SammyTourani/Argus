import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/config';
import Stripe from 'stripe';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { sendSubscriptionConfirmed, sendSubscriptionCanceled } from '@/lib/email';

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

  // ── Idempotency guard: skip already-processed events ──────────────────
  const { data: existing } = await supabaseAdmin
    .from('webhook_events')
    .select('event_id')
    .eq('event_id', event.id)
    .single();

  if (existing) {
    return NextResponse.json({ received: true });
  }

  // Record the event before processing (at-least-once delivery)
  await supabaseAdmin.from('webhook_events').insert({
    event_id: event.id,
    event_type: event.type,
  });

  // ── Event handlers ────────────────────────────────────────────────────

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      if (userId) {
        const isTeam = session.metadata?.plan === 'team';
        const creditAllocation = isTeam ? 500 : 300;
        const nextReset = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString();

        await supabaseAdmin.from('profiles').update({
          subscription_status: isTeam ? 'team' : 'pro',
          stripe_customer_id: session.customer as string,
          subscription_id: session.subscription as string,
          credits_remaining: creditAllocation,
          credits_total: creditAllocation,
          credits_reset_at: nextReset,
          updated_at: new Date().toISOString(),
        }).eq('id', userId);

        // Send subscription confirmed email
        try {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('email, full_name')
            .eq('id', userId)
            .single();
          if (profile?.email) {
            await sendSubscriptionConfirmed(profile.email, profile.full_name);
          }
        } catch (e) { console.error('[webhook] Failed to send subscription email:', e); }
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name')
        .eq('stripe_customer_id', customerId)
        .single();
      if (profile) {
        await supabaseAdmin.from('profiles').update({
          subscription_status: 'free',
          subscription_id: null,
          credits_total: 30,
          credits_remaining: 30, // Reset to free tier allocation
          updated_at: new Date().toISOString(),
        }).eq('id', profile.id);

        // Send cancellation email
        try {
          if (profile.email) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const periodEnd = (subscription as any).current_period_end as number | undefined;
            const endsAt = periodEnd
              ? new Date(periodEnd * 1000).toLocaleDateString()
              : undefined;
            await sendSubscriptionCanceled(profile.email, endsAt);
          }
        } catch (e) { console.error('[webhook] Failed to send cancellation email:', e); }
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const eventTime = new Date(event.created * 1000).toISOString();

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, updated_at, subscription_status')
        .eq('stripe_customer_id', customerId)
        .single();

      if (profile) {
        // Guard against out-of-order events: only apply if this event is newer
        if (!profile.updated_at || eventTime > profile.updated_at) {
          // Preserve existing tier when active; downgrade to free when inactive
          const newStatus = subscription.status === 'active'
            ? (profile.subscription_status || 'pro')
            : 'free';
          await supabaseAdmin.from('profiles').update({
            subscription_status: newStatus,
            updated_at: eventTime,
          }).eq('id', profile.id);
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
