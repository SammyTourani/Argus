// Centralized environment configuration for Argus
// Import this instead of using process.env directly.
// Validates required vars at import time so missing keys fail fast.

// ─── Helpers ────────────────────────────────────────────────────────────────

function required(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

function optional(name: string, fallback?: string): string | undefined {
  return process.env[name] ?? fallback;
}

// ─── Server-only guard ──────────────────────────────────────────────────────
// NEXT_PUBLIC_* vars are safe anywhere. Everything else must only be used on
// the server. This file should never be imported from client components.

const isServer = typeof window === 'undefined';

function serverOnly(name: string): string {
  if (!isServer) throw new Error(`env.${name} accessed on the client — this is a server-only var`);
  return required(name);
}

function serverOptional(name: string, fallback?: string): string | undefined {
  if (!isServer && !name.startsWith('NEXT_PUBLIC_')) {
    throw new Error(`env.${name} accessed on the client — this is a server-only var`);
  }
  return process.env[name] ?? fallback;
}

// ─── Public (available client + server) ─────────────────────────────────────

export const env = {
  /** Current environment */
  nodeEnv: optional('NODE_ENV', 'development')!,
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',

  // ── Supabase ────────────────────────────────────────────────────────────
  supabase: {
    get url() { return required('NEXT_PUBLIC_SUPABASE_URL'); },
    get anonKey() { return required('NEXT_PUBLIC_SUPABASE_ANON_KEY'); },
    get serviceRoleKey() { return serverOnly('SUPABASE_SERVICE_ROLE_KEY'); },
  },

  // ── App URLs ────────────────────────────────────────────────────────────
  app: {
    get url() { return optional('NEXT_PUBLIC_APP_URL') ?? optional('NEXT_PUBLIC_SITE_URL') ?? 'https://buildargus.dev'; },
    get siteUrl() { return optional('NEXT_PUBLIC_SITE_URL') ?? optional('NEXT_PUBLIC_APP_URL') ?? 'https://buildargus.dev'; },
    get vercelUrl() { return optional('VERCEL_URL'); },
  },

  // ── AI Providers ────────────────────────────────────────────────────────
  ai: {
    get gatewayApiKey() { return serverOptional('AI_GATEWAY_API_KEY'); },
    anthropic: {
      get apiKey() { return serverOptional('ANTHROPIC_API_KEY'); },
      get baseUrl() { return serverOptional('ANTHROPIC_BASE_URL'); },
    },
    openai: {
      get apiKey() { return serverOptional('OPENAI_API_KEY'); },
      get baseUrl() { return serverOptional('OPENAI_BASE_URL'); },
    },
    google: {
      get apiKey() { return serverOptional('GEMINI_API_KEY'); },
      get baseUrl() { return serverOptional('GEMINI_BASE_URL'); },
    },
    groq: {
      get apiKey() { return serverOptional('GROQ_API_KEY'); },
      get baseUrl() { return serverOptional('GROQ_BASE_URL'); },
    },
    get morphApiKey() { return serverOptional('MORPH_API_KEY'); },
  },

  // ── Stripe ──────────────────────────────────────────────────────────────
  stripe: {
    get secretKey() { return serverOnly('STRIPE_SECRET_KEY'); },
    get webhookSecret() { return serverOnly('STRIPE_WEBHOOK_SECRET'); },
    get proPriceId() { return serverOptional('STRIPE_PRO_PRICE_ID'); },
    get teamPriceId() { return serverOptional('STRIPE_TEAM_PRICE_ID'); },
  },

  // ── Email ───────────────────────────────────────────────────────────────
  email: {
    get resendApiKey() { return serverOnly('RESEND_API_KEY'); },
    get adminEmail() { return serverOptional('ADMIN_EMAIL'); },
  },

  // ── Sandbox / E2B ───────────────────────────────────────────────────────
  sandbox: {
    get e2bApiKey() { return serverOptional('E2B_API_KEY'); },
    get provider() { return serverOptional('SANDBOX_PROVIDER', 'e2b'); },
  },

  // ── Encryption (BYOK) ──────────────────────────────────────────────────
  encryption: {
    get key() { return serverOnly('ENCRYPTION_KEY'); },
  },

  // ── External Services ──────────────────────────────────────────────────
  firecrawl: {
    get apiKey() { return serverOptional('FIRECRAWL_API_KEY'); },
  },

  // ── Upstash Redis (rate limiting) ──────────────────────────────────────
  upstash: {
    get redisRestUrl() { return serverOptional('UPSTASH_REDIS_REST_URL'); },
    get redisRestToken() { return serverOptional('UPSTASH_REDIS_REST_TOKEN'); },
  },

  // ── Vercel ─────────────────────────────────────────────────────────────
  vercel: {
    get token() { return serverOptional('VERCEL_TOKEN'); },
    get teamId() { return serverOptional('VERCEL_TEAM_ID'); },
    get projectId() { return serverOptional('VERCEL_PROJECT_ID'); },
    get oidcToken() { return serverOptional('VERCEL_OIDC_TOKEN'); },
  },

  // ── Sentry ─────────────────────────────────────────────────────────────
  sentry: {
    get dsn() { return optional('NEXT_PUBLIC_SENTRY_DSN') ?? optional('SENTRY_DSN'); },
  },
} as const;
