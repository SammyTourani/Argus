/**
 * Vitest global setup — mock environment variables for tests.
 *
 * This runs before every test file so no module inadvertently hits a
 * real service during unit tests.
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.STRIPE_SECRET_KEY = 'sk_test_xxx';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_xxx';
process.env.RESEND_API_KEY = 're_test_xxx';
process.env.SENTRY_DSN = 'https://test@sentry.io/123';
process.env.OPENAI_API_KEY = 'sk-test-openai';
process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
process.env.GEMINI_API_KEY = 'test-gemini-key';
process.env.GROQ_API_KEY = 'gsk_test_groq';
process.env.ADMIN_EMAIL = 'admin@argus.dev';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
