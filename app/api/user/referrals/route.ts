/**
 * GET  /api/user/referrals — get referral code, stats, and builds earned
 * POST /api/user/referrals — claim a referral (called from client after signup)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get referral code from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('referral_code')
      .eq('id', user.id)
      .single();

    const referralCode = profile?.referral_code || user.id.replace(/-/g, '').substring(0, 12).toUpperCase();

    // Get referral stats
    const { data: referrals } = await supabase
      .from('referrals')
      .select('status, builds_awarded')
      .eq('referrer_id', user.id);

    let signedUp = 0;
    let converted = 0;
    let totalBuildsEarned = 0;

    if (referrals) {
      for (const r of referrals) {
        if (r.status === 'signed_up' || r.status === 'converted') signedUp++;
        if (r.status === 'converted') converted++;
        totalBuildsEarned += r.builds_awarded || 0;
      }
    }

    return NextResponse.json({
      referral_code: referralCode,
      referral_url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://buildargus.dev') + '/invite/' + referralCode,
      stats: { signed_up: signedUp, converted: converted },
      total_builds_earned: totalBuildsEarned,
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

    const body = await request.json();
    const { referral_code } = body;

    if (!referral_code || typeof referral_code !== 'string') {
      return NextResponse.json({ error: 'referral_code is required' }, { status: 400 });
    }

    const code = referral_code.toUpperCase();
    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Look up referrer
    const { data: referrer } = await admin
      .from('profiles')
      .select('id')
      .eq('referral_code', code)
      .maybeSingle();

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
      referral_code: code,
      status: 'signed_up',
      signed_up_at: new Date().toISOString(),
    });

    if (error) {
      console.error('[POST /api/user/referrals]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/user/referrals] unexpected:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
