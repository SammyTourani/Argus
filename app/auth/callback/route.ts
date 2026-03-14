import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

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
      // Send welcome email for new users
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          const createdAt = new Date(user.created_at);
          const now = new Date();
          const isNewUser = now.getTime() - createdAt.getTime() < 60_000; // within 60s

          if (isNewUser && resend) {
            await resend.emails.send({
              from: 'Argus <hello@argus.build>',
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
    You have 3 free builds. Enter any URL and watch Argus clone it in seconds — powered by Claude Opus 4.6, Gemini 2.5 Pro, and Kimi K2.
  </p>
  <a href="https://argus.build/app" style="display: inline-block; background: #FA4500; color: white; padding: 14px 24px; border-radius: 10px; text-decoration: none; font-weight: 600;">
    Start cloning &rarr;
  </a>
  <p style="color: rgba(255,255,255,0.3); font-size: 13px; margin-top: 40px;">
    You're getting this because you signed up for Argus. You can unsubscribe at any time.
  </p>
</body>
</html>`
            });
          }
        }
      } catch (emailError) {
        // Don't block auth flow if email fails
        console.error('[auth/callback] Failed to send welcome email:', emailError);
      }

      // Claim referral if ref code is present
      if (ref) {
        try {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (currentUser) {
            const admin = createServiceClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.SUPABASE_SERVICE_ROLE_KEY!,
            );

            // Look up referrer by code
            const { data: referrer } = await admin
              .from('profiles')
              .select('id')
              .eq('referral_code', ref.toUpperCase())
              .maybeSingle();

            if (referrer && referrer.id !== currentUser.id) {
              // Check not already referred
              const { data: existing } = await admin
                .from('referrals')
                .select('id')
                .eq('referred_user_id', currentUser.id)
                .maybeSingle();

              if (!existing) {
                await admin.from('referrals').insert({
                  referrer_id: referrer.id,
                  referred_user_id: currentUser.id,
                  referred_email: currentUser.email,
                  referral_code: ref.toUpperCase(),
                  status: 'signed_up',
                  signed_up_at: new Date().toISOString(),
                });
                console.log('[auth/callback] Referral claimed:', ref, '→', currentUser.id);
              }
            }
          }
        } catch (refError) {
          console.error('[auth/callback] Failed to claim referral:', refError);
        }
      }

      return NextResponse.redirect(`${origin}${redirect}`);
    }
  }

  // Auth error — redirect to sign-in
  return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_failed`);
}
