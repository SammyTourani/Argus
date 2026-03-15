-- Webhook idempotency table
-- Prevents duplicate processing of Stripe webhook events (retries up to 3 days).

CREATE TABLE IF NOT EXISTS webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for periodic cleanup of old events
CREATE INDEX idx_webhook_events_processed_at ON webhook_events (processed_at);

-- Auto-cleanup: remove events older than 7 days (well beyond Stripe's 3-day retry window)
-- Run via pg_cron or manual cleanup; the index above makes this efficient.
