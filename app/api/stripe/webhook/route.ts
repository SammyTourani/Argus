import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/config';
import Stripe from 'stripe';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { sendSubscriptionConfirmed, sendSubscriptionCanceled } from '@/lib/email';
import { TIER_CREDITS } from '@/lib/subscription/gate';
import { REFERRAL_CONVERSION_BONUS } from '@/lib/referral/constants';

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
      const teamId = session.metadata?.team_id;
      const plan = session.metadata?.plan ?? 'pro';
      const tier = plan === 'team' ? 'team' : 'pro';
      const creditAllocation = TIER_CREDITS[tier as keyof typeof TIER_CREDITS] ?? 300;
      const nextReset = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString();

      if (teamId) {
        // ── Team workspace subscription ──────────────────────────────────
        await supabaseAdmin.from('teams').update({
          plan: tier,
          subscription_status: 'active',
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          credits_remaining: creditAllocation,
          credits_total: creditAllocation,
          credits_reset_at: nextReset,
          updated_at: new Date().toISOString(),
        }).eq('id', teamId);
      } else if (userId) {
        // ── Personal workspace subscription ──────────────────────────────
        await supabaseAdmin.from('profiles').update({
          subscription_status: tier,
          stripe_customer_id: session.customer as string,
          subscription_id: session.subscription as string,
          credits_remaining: creditAllocation,
          credits_total: creditAllocation,
          credits_reset_at: nextReset,
          updated_at: new Date().toISOString(),
        }).eq('id', userId);
      }

      // ── Referral conversion tracking ─────────────────────────
      // Only for personal subscriptions (team checkout has teamId)
      if (userId && !teamId) {
        try {
          const { data: referral } = await supabaseAdmin
            .from('referrals')
            .select('id, referrer_id, referrer_credits_awarded')
            .eq('referred_user_id', userId)
            .eq('status', 'signed_up')
            .maybeSingle();

          if (referral && referral.referrer_credits_awarded === 0) {
            await supabaseAdmin.from('referrals').update({
              status: 'converted',
              converted_at: new Date().toISOString(),
              referrer_credits_awarded: REFERRAL_CONVERSION_BONUS,
            }).eq('id', referral.id);

            await supabaseAdmin.rpc('award_referral_credits', {
              p_user_id: referral.referrer_id,
              p_amount: REFERRAL_CONVERSION_BONUS,
            });

            console.log('[webhook] Referral converted:', referral.id, '→ awarded', REFERRAL_CONVERSION_BONUS, 'credits to', referral.referrer_id);
          }
        } catch (e) {
          console.error('[webhook] Failed to process referral conversion:', e);
        }
      }

      // Send subscription confirmed email
      try {
        if (userId) {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('email, full_name')
            .eq('id', userId)
            .single();
          if (profile?.email) {
            await sendSubscriptionConfirmed(profile.email, profile.full_name ?? undefined);
          }
        }
      } catch (e) { console.error('[webhook] Failed to send subscription email:', e); }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      // Dual-lookup scoped by subscription ID to avoid cross-contamination
      const subId = subscription.id;

      const { data: team } = await supabaseAdmin
        .from('teams')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .eq('stripe_subscription_id', subId)
        .single();

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name')
        .eq('stripe_customer_id', customerId)
        .eq('subscription_id', subId)
        .single();

      if (team) {
        // Team subscription cancelled
        await supabaseAdmin.from('teams').update({
          plan: 'free',
          subscription_status: 'cancelled',
          stripe_subscription_id: null,
          credits_total: TIER_CREDITS.free,
          credits_remaining: TIER_CREDITS.free,
          updated_at: new Date().toISOString(),
        }).eq('id', team.id);
      }

      if (profile) {
        // Personal subscription cancelled
        await supabaseAdmin.from('profiles').update({
          subscription_status: 'free',
          subscription_id: null,
          credits_total: TIER_CREDITS.free,
          credits_remaining: TIER_CREDITS.free,
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
      const subId = subscription.id;
      const eventTime = new Date(event.created * 1000).toISOString();

      // Dual-lookup scoped by subscription ID
      const { data: updTeam } = await supabaseAdmin
        .from('teams')
        .select('id, updated_at, plan')
        .eq('stripe_customer_id', customerId)
        .eq('stripe_subscription_id', subId)
        .single();

      const { data: updProfile } = await supabaseAdmin
        .from('profiles')
        .select('id, updated_at, subscription_status')
        .eq('stripe_customer_id', customerId)
        .eq('subscription_id', subId)
        .single();

      if (updTeam) {
        if (!updTeam.updated_at || eventTime > updTeam.updated_at) {
          const teamTier = subscription.status === 'active' ? updTeam.plan : 'free';
          const teamCredits = TIER_CREDITS[teamTier as keyof typeof TIER_CREDITS] ?? TIER_CREDITS.free;
          await supabaseAdmin.from('teams').update({
            plan: teamTier,
            subscription_status: subscription.status === 'active' ? 'active' : 'cancelled',
            // Sync credits to match the current tier
            credits_total: teamCredits,
            updated_at: eventTime,
          }).eq('id', updTeam.id);
        }
      }

      if (updProfile) {
        if (!updProfile.updated_at || eventTime > updProfile.updated_at) {
          const newStatus = subscription.status === 'active'
            ? (updProfile.subscription_status || 'pro')
            : 'free';
          const profileCredits = TIER_CREDITS[newStatus as keyof typeof TIER_CREDITS] ?? TIER_CREDITS.free;
          await supabaseAdmin.from('profiles').update({
            subscription_status: newStatus,
            credits_total: profileCredits,
            updated_at: eventTime,
          }).eq('id', updProfile.id);
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
