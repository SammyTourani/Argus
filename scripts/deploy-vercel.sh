#!/usr/bin/env bash
# Argus Vercel Deployment Script
# Reads secrets from ~/.openclaw/.env (never commits secrets to source)
set -e

# Load from secure env file
source ~/.openclaw/.env 2>/dev/null || true

VERCEL_TOKEN="${VERCEL_TOKEN:-}"

if [ -z "$VERCEL_TOKEN" ]; then
  echo "ERROR: VERCEL_TOKEN not set. Add it to ~/.openclaw/.env"
  exit 1
fi

cd "$(dirname "$0")/.."

echo "=== Setting Vercel environment variables ==="

set_env() {
  local key=$1
  local value=$2
  local envs=${3:-"production,preview,development"}
  if [ -z "$value" ]; then
    echo "Skipping $key (not set)"
    return
  fi
  echo "Setting $key..."
  echo "$value" | vercel env add "$key" "$envs" \
    --token "$VERCEL_TOKEN" \
    --yes 2>/dev/null || echo "(already exists, skipping)"
}

# Supabase
set_env "NEXT_PUBLIC_SUPABASE_URL" "${NEXT_PUBLIC_SUPABASE_URL}"
set_env "NEXT_PUBLIC_SUPABASE_ANON_KEY" "${NEXT_PUBLIC_SUPABASE_ANON_KEY}"
set_env "SUPABASE_SERVICE_ROLE_KEY" "${SUPABASE_SERVICE_ROLE_KEY}"

# Stripe
set_env "STRIPE_SECRET_KEY" "${STRIPE_SECRET_KEY}"
set_env "STRIPE_PRO_PRICE_ID" "${STRIPE_PRO_PRICE_ID}"
set_env "STRIPE_WEBHOOK_SECRET" "${STRIPE_WEBHOOK_SECRET}"

# Upstash Redis
set_env "UPSTASH_REDIS_REST_URL" "${UPSTASH_REDIS_REST_URL}"
set_env "UPSTASH_REDIS_REST_TOKEN" "${UPSTASH_REDIS_REST_TOKEN}"

# AI Providers
set_env "GROQ_API_KEY" "${GROQ_API_KEY}"
set_env "GEMINI_API_KEY" "${GEMINI_API_KEY}"
set_env "OPENAI_API_KEY" "${OPENAI_API_KEY:-$OPENROUTER_API_KEY}"
set_env "OPENAI_BASE_URL" "${OPENAI_BASE_URL:-https://openrouter.ai/api/v1}"

# Other
set_env "FIRECRAWL_API_KEY" "${FIRECRAWL_API_KEY}"
set_env "RESEND_API_KEY" "${RESEND_API_KEY}"
set_env "SANDBOX_PROVIDER" "${SANDBOX_PROVIDER:-vercel}"
set_env "SENTRY_AUTH_TOKEN" "${SENTRY_AUTH_TOKEN}"

echo ""
echo "=== Deploying to Vercel Production ==="
vercel deploy --prod --token "$VERCEL_TOKEN" --yes 2>&1

echo ""
echo "=== Deployment complete! ==="
