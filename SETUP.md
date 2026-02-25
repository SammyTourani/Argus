# Argus SaaS Setup Guide

## 1. Supabase Setup

### Create Project
```bash
SUPABASE_ACCESS_TOKEN=<your-token> supabase projects create argus-production \
  --org-id myjffggrfhbniwotxepe \
  --region us-east-1
```

### Run Migrations
After creating the project, run the SQL in `supabase/migrations/001_initial_schema.sql` in the Supabase SQL Editor.

### Get Keys
From the Supabase dashboard (Settings > API):
- `NEXT_PUBLIC_SUPABASE_URL` — Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — service_role key (keep secret)

### Enable Google OAuth (Optional)
1. Go to Authentication > Providers > Google
2. Add your Google OAuth Client ID and Secret
3. Set the redirect URL to: `https://your-domain.vercel.app/auth/callback`

## 2. Stripe Setup

### Create Products
```bash
STRIPE_SECRET_KEY=<your-key> bun run scripts/setup-stripe.ts
```
This outputs `STRIPE_PRO_PRICE_ID` — add it to your `.env`.

### Set Up Webhook
1. After deploying to Vercel, go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/stripe/webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### Get Publishable Key
From Stripe Dashboard > Developers > API Keys:
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Publishable key

## 3. Environment Variables

Set these on Vercel (or in `.env.local` for development):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_PRICE_ID=

# AI Providers
GEMINI_API_KEY=
GROQ_API_KEY=
FIRECRAWL_API_KEY=

# Rate Limiting
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Email
RESEND_API_KEY=

# Sandbox
SANDBOX_PROVIDER=vercel
VERCEL_TOKEN=

# App
NEXT_PUBLIC_SITE_URL=https://argus.vercel.app
```

## 4. Deploy to Vercel

```bash
vercel --prod --yes
```

## 5. Post-Deploy Steps

1. Set the Stripe webhook URL to your deployed domain
2. Enable Google OAuth in Supabase with your deployed callback URL
3. Run the Stripe setup script if not already done
4. Test the full flow: sign up → build → upgrade
