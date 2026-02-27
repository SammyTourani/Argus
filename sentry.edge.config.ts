import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Performance: sample 50% of transactions in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.5 : 1.0,
});
