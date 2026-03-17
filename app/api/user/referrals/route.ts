/**
 * GET  /api/user/referrals — get referral code, slug, stats, and credits earned
 * POST /api/user/referrals — claim a referral (called from client after signup)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { REFERRAL_SIGNUP_BONUS } from '@/lib/referral/constants';
import { checkRateLimit } from '@/lib/ratelimit';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get referral code and slug from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('referral_code, referral_slug')
      .eq('id', user.id)
      .single();

    const referralCode = profile?.referral_code || user.id.replace(/-/g, '').substring(0, 12).toUpperCase();
    const referralSlug = profile?.referral_slug || referralCode;

    // Get referral stats
    const { data: referrals } = await supabase
      .from('referrals')
      .select('status, referrer_credits_awarded')
      .eq('referrer_id', user.id);

    let signedUp = 0;
    let converted = 0;
    let totalCreditsEarned = 0;

    if (referrals) {
      for (const r of referrals) {
        if (r.status === 'signed_up' || r.status === 'converted') signedUp++;
        if (r.status === 'converted') converted++;
        totalCreditsEarned += r.referrer_credits_awarded || 0;
      }
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://buildargus.dev';

    return NextResponse.json({
      referral_code: referralCode,
      referral_slug: referralSlug,
      referral_url: siteUrl + '/invite/' + referralSlug,
      stats: { signed_up: signedUp, converted: converted },
      total_credits_earned: totalCreditsEarned,
    });
  } catch (err) {
    console.error('[GET /api/user/referrals] unexpected:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const rateLimit = await checkRateLimit(`referral:${user.id}`, 'generic');
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json();
    const { referral_code } = body;

    if (!referral_code || typeof referral_code !== 'string') {
      return NextResponse.json({ error: 'referral_code is required' }, { status: 400 });
    }

    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Dual lookup: try referral_code first, then referral_slug
    let referrer: { id: string; referral_code: string } | null = null;
    const { data: byCode } = await admin
      .from('profiles')
      .select('id, referral_code')
      .eq('referral_code', referral_code.toUpperCase())
      .maybeSingle();
    referrer = byCode;

    if (!referrer) {
      const { data: bySlug } = await admin
        .from('profiles')
        .select('id, referral_code')
        .eq('referral_slug', referral_code.toLowerCase())
        .maybeSingle();
      referrer = bySlug;
    }

    if (!referrer) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
    }

    // Block self-referral
    if (referrer.id === user.id) {
      return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 });
    }

    // Check if already referred
    const { data: existing } = await admin
      .from('referrals')
      .select('id')
      .eq('referred_user_id', user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Already referred' }, { status: 409 });
    }

    const { error } = await admin.from('referrals').insert({
      referrer_id: referrer.id,
      referred_user_id: user.id,
      referred_email: user.email,
      referral_code: referrer.referral_code,
      status: 'signed_up',
      signed_up_at: new Date().toISOString(),
      credits_awarded: REFERRAL_SIGNUP_BONUS,
    });

    if (error) {
      console.error('[POST /api/user/referrals]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Award bonus credits to referred user
    await admin.rpc('award_referral_credits', {
      p_user_id: user.id,
      p_amount: REFERRAL_SIGNUP_BONUS,
    });

    console.log('[POST /api/user/referrals] Referral claimed:', referral_code, '→', user.id, '(+' + REFERRAL_SIGNUP_BONUS + ' credits)');

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/user/referrals] unexpected:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
