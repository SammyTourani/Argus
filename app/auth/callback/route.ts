import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { REFERRAL_SIGNUP_BONUS } from '@/lib/referral/constants';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const ref = searchParams.get('ref');
  const redirect = searchParams.get('redirect') || '/workspace';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      const createdAt = user ? new Date(user.created_at) : new Date(0);
      const now = new Date();
      const isNewUser = user && now.getTime() - createdAt.getTime() < 60_000;

      // ── Claim referral BEFORE welcome email (so email can mention bonus) ──
      let wasReferred = false;

      if (ref && user) {
        try {
          const admin = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
          );

          // Dual lookup: try referral_code first, then referral_slug
          let referrer: { id: string; referral_code: string } | null = null;
          const { data: byCode } = await admin
            .from('profiles')
            .select('id, referral_code')
            .eq('referral_code', ref.toUpperCase())
            .maybeSingle();
          referrer = byCode;

          if (!referrer) {
            const { data: bySlug } = await admin
              .from('profiles')
              .select('id, referral_code')
              .eq('referral_slug', ref.toLowerCase())
              .maybeSingle();
            referrer = bySlug;
          }

          if (referrer && referrer.id !== user.id) {
            // Check not already referred
            const { data: existing } = await admin
              .from('referrals')
              .select('id')
              .eq('referred_user_id', user.id)
              .maybeSingle();

            if (!existing) {
              await admin.from('referrals').insert({
                referrer_id: referrer.id,
                referred_user_id: user.id,
                referred_email: user.email,
                referral_code: referrer.referral_code,
                status: 'signed_up',
                signed_up_at: new Date().toISOString(),
                credits_awarded: REFERRAL_SIGNUP_BONUS,
              });

              // Award bonus credits to referred user
              await admin.rpc('award_referral_credits', {
                p_user_id: user.id,
                p_amount: REFERRAL_SIGNUP_BONUS,
              });

              wasReferred = true;
              console.log('[auth/callback] Referral claimed:', ref, '→', user.id, '(+' + REFERRAL_SIGNUP_BONUS + ' credits)');
            }
          }
        } catch (refError) {
          console.error('[auth/callback] Failed to claim referral:', refError);
        }
      }

      // ── Send welcome email for new users ──
      try {
        if (isNewUser && user?.email && resend) {
          const creditText = wasReferred
            ? `You have 40 credits (including ${REFERRAL_SIGNUP_BONUS} bonus from your referral).`
            : 'You have 30 free credits.';

          await resend.emails.send({
            from: 'Argus <hello@buildargus.dev>',
            to: user.email,
            subject: 'Welcome to Argus — start cloning',
            html: `<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, sans-serif; background: #080808; color: #fff; padding: 40px; max-width: 560px; margin: 0 auto;">
  <div style="margin-bottom: 32px;">
    <span style="font-size: 20px; font-weight: 700; color: #FA4500;">Argus</span>
  </div>
  <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 16px;">You're in. Let's build.</h1>
  <p style="color: rgba(255,255,255,0.6); line-height: 1.6; margin-bottom: 24px;">
    ${creditText} Enter any URL and watch Argus clone it in seconds — powered by Claude, GPT-4o, Gemini, and more.
  </p>
  <a href="https://buildargus.dev/workspace" style="display: inline-block; background: #FA4500; color: white; padding: 14px 24px; border-radius: 10px; text-decoration: none; font-weight: 600;">
    Start cloning &rarr;
  </a>
  <p style="color: rgba(255,255,255,0.3); font-size: 13px; margin-top: 40px;">
    You're getting this because you signed up for Argus. You can unsubscribe at any time.
  </p>
</body>
</html>`
          });
        }
      } catch (emailError) {
        // Don't block auth flow if email fails
        console.error('[auth/callback] Failed to send welcome email:', emailError);
      }

      return NextResponse.redirect(`${origin}${redirect}`);
    }
  }

  // Auth error — redirect to sign-in
  return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_failed`);
}
