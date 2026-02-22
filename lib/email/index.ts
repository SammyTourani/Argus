import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'Argus <hello@argus.build>'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://argus-six-omega.vercel.app'

function baseLayout(content: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0a0a0a; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .container { max-width: 560px; margin: 0 auto; padding: 40px 20px; }
    .logo { font-size: 20px; font-weight: 800; color: #FA4500; margin-bottom: 32px; }
    .content { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 32px; }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 12px; letter-spacing: -0.02em; }
    p { font-size: 15px; line-height: 1.6; color: rgba(255,255,255,0.7); margin-bottom: 16px; }
    .btn { display: inline-block; background: #FA4500; color: white; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; font-size: 15px; margin: 8px 0; }
    .muted { font-size: 13px; color: rgba(255,255,255,0.35); margin-top: 24px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 20px; }
    .highlight { color: #FA4500; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">Argus</div>
    <div class="content">
      ${content}
    </div>
    <p class="muted" style="text-align:center; margin-top: 24px;">
      Argus · Clone any website with AI<br>
      <a href="${SITE_URL}/unsubscribe" style="color: rgba(255,255,255,0.3)">Unsubscribe</a>
    </p>
  </div>
</body>
</html>`
}

export async function sendWelcomeEmail(to: string, name?: string) {
  const firstName = name?.split(' ')[0] || 'there'
  
  const html = baseLayout(`
    <h1>Welcome to Argus, ${firstName} 👋</h1>
    <p>You just unlocked the fastest way to clone any website with AI. Here's what you can do:</p>
    <p style="margin: 0 0 8px; color: rgba(255,255,255,0.5); font-size: 14px;">
      1. Paste any URL<br>
      2. Pick a design style (Glassmorphism, Neumorphism, Brutalist, etc.)<br>
      3. Watch AI rebuild it in under 60 seconds
    </p>
    <p>You're on the <span class="highlight">Free plan</span> — 3 builds per month included. No credit card needed.</p>
    <a href="${SITE_URL}/app" class="btn">Start your first build →</a>
    <p>If you have any questions, just reply to this email. I read every one.</p>
    <p style="color: rgba(255,255,255,0.5)">— Sammy, founder of Argus</p>
  `)

  return resend.emails.send({
    from: FROM,
    to,
    subject: 'Welcome to Argus — let\'s build something',
    html,
  })
}

export async function sendFirstBuildPrompt(to: string, name?: string) {
  const firstName = name?.split(' ')[0] || 'there'

  const html = baseLayout(`
    <h1>Your 3 free builds are waiting, ${firstName}</h1>
    <p>You signed up for Argus but haven't tried it yet. Here's what you're missing:</p>
    <p style="color: rgba(255,255,255,0.6); font-size: 14px; border-left: 3px solid #FA4500; padding-left: 16px; margin: 20px 0;">
      "Cloned our competitor's landing page in 48 seconds. Used the Glassmorphism output as our new design system base."<br>
      <span style="color: rgba(255,255,255,0.4)">— Jake R., Indie Hacker</span>
    </p>
    <p>Takes 2 minutes. Paste any URL, pick a style, get code.</p>
    <a href="${SITE_URL}/app" class="btn">Try your first build →</a>
    <p style="color: rgba(255,255,255,0.4); font-size: 13px;">You have 3 free builds this month. No credit card required.</p>
  `)

  return resend.emails.send({
    from: FROM,
    to,
    subject: 'Your 3 free builds are waiting',
    html,
  })
}

export async function sendUpgradePrompt(to: string, buildsUsed: number) {
  const html = baseLayout(`
    <h1>You've used ${buildsUsed}/3 free builds 🚀</h1>
    <p>You're clearly getting value from Argus. Here's why people upgrade to Pro:</p>
    <ul style="color: rgba(255,255,255,0.6); font-size: 14px; padding-left: 20px; margin: 16px 0;">
      <li style="margin-bottom: 8px;"><strong style="color: white">Unlimited builds</strong> — no monthly cap</li>
      <li style="margin-bottom: 8px;"><strong style="color: white">Priority sandbox</strong> — faster generation</li>
      <li style="margin-bottom: 8px;"><strong style="color: white">All AI models</strong> — Claude Opus 4.6, Gemini 2.5 Pro, Kimi K2</li>
      <li style="margin-bottom: 8px;"><strong style="color: white">Iterative AI chat</strong> — refine after generation</li>
    </ul>
    <a href="${SITE_URL}/api/stripe/create-checkout-session" class="btn">Upgrade to Pro — $29/month</a>
    <p style="color: rgba(255,255,255,0.4); font-size: 13px;">Or wait until the 1st for your free tier to reset.</p>
  `)

  return resend.emails.send({
    from: FROM,
    to,
    subject: `You've used ${buildsUsed}/3 free builds this month`,
    html,
  })
}

export async function sendSubscriptionConfirmed(to: string, name?: string) {
  const html = baseLayout(`
    <h1>You're on Argus Pro ⚡</h1>
    <p>Unlimited builds unlocked. Welcome to the club.</p>
    <p>Everything that was limited is now unlimited:</p>
    <ul style="color: rgba(255,255,255,0.6); font-size: 14px; padding-left: 20px; margin: 16px 0;">
      <li style="margin-bottom: 6px;">✓ Unlimited builds per month</li>
      <li style="margin-bottom: 6px;">✓ Priority sandbox execution</li>
      <li style="margin-bottom: 6px;">✓ All 8 design styles</li>
      <li style="margin-bottom: 6px;">✓ Iterative AI chat</li>
    </ul>
    <a href="${SITE_URL}/app" class="btn">Start building →</a>
    <p style="color: rgba(255,255,255,0.4); font-size: 13px;">Questions about your subscription? <a href="${SITE_URL}/dashboard" style="color: #FA4500">Manage billing →</a></p>
  `)

  return resend.emails.send({
    from: FROM,
    to,
    subject: 'You\'re on Argus Pro ⚡',
    html,
  })
}

export async function sendSubscriptionCanceled(to: string, endsAt?: string) {
  const html = baseLayout(`
    <h1>Your Pro subscription is ending</h1>
    <p>Your Pro access ends <strong>${endsAt || 'at the end of your billing period'}</strong>. After that, you'll be on the Free plan (3 builds/month).</p>
    <p>All your existing builds and data are safe. Nothing is deleted.</p>
    <p>If you changed your mind or this was a mistake:</p>
    <a href="${SITE_URL}/dashboard" class="btn">Reactivate Pro →</a>
    <p style="color: rgba(255,255,255,0.4); font-size: 13px;">No hard feelings. If you'd like to share feedback, just reply to this email.</p>
  `)

  return resend.emails.send({
    from: FROM,
    to,
    subject: 'Your Argus Pro subscription is ending',
    html,
  })
}

// Track that we've sent an email type to avoid duplicates
export async function hasEmailBeenSent(
  supabaseClient: any, 
  userId: string, 
  emailType: string
): Promise<boolean> {
  const { data } = await supabaseClient
    .from('email_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('email_type', emailType)
    .single()
  return !!data
}

export async function logEmailSent(
  supabaseClient: any,
  userId: string,
  emailType: string
) {
  await supabaseClient
    .from('email_logs')
    .upsert({ user_id: userId, email_type: emailType }, { onConflict: 'user_id,email_type' })
}
