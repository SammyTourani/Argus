-- Credit-based model gating system
-- Replaces flat "3 builds/month" with per-model credit costs.
-- Free: 30 credits/month, Pro: 300, Team/Enterprise: 500.

-- ── Add credit columns to profiles ───────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS credits_remaining INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS credits_total INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS credits_reset_at TIMESTAMPTZ;

-- Set existing pro users to 300 credits
UPDATE public.profiles
SET credits_remaining = 300, credits_total = 300
WHERE subscription_status = 'pro';

-- Set existing team/enterprise users to 500 credits
UPDATE public.profiles
SET credits_remaining = 500, credits_total = 500
WHERE subscription_status IN ('team', 'enterprise');

-- Initialize credits_reset_at for all users who don't have it yet
UPDATE public.profiles
SET credits_reset_at = date_trunc('month', NOW() + INTERVAL '1 month')
WHERE credits_reset_at IS NULL;

-- ── Atomic credit deduction function ─────────────────────────────────────────
-- Uses FOR UPDATE row lock to prevent race conditions from concurrent builds.
-- Also increments builds_this_month for backward compatibility with usage tracking.

CREATE OR REPLACE FUNCTION public.deduct_credits(p_user_id UUID, p_amount INTEGER)
RETURNS TABLE(success BOOLEAN, remaining INTEGER) AS $$
DECLARE
  v_remaining INTEGER;
  v_total INTEGER;
  v_reset_at TIMESTAMPTZ;
  v_sub_status TEXT;
  v_now TIMESTAMPTZ := now();
BEGIN
  -- Lock the row to prevent concurrent deductions
  SELECT credits_remaining, credits_total, credits_reset_at, subscription_status
  INTO v_remaining, v_total, v_reset_at, v_sub_status
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  -- If user not found, fail gracefully
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0;
    RETURN;
  END IF;

  -- Auto-reset credits if the billing period has expired
  IF v_reset_at IS NOT NULL AND v_reset_at <= v_now THEN
    v_total := CASE
      WHEN v_sub_status IN ('team', 'enterprise') THEN 500
      WHEN v_sub_status = 'pro' THEN 300
      ELSE 30
    END;
    v_remaining := v_total;

    UPDATE public.profiles
    SET credits_remaining = v_remaining,
        credits_total = v_total,
        credits_reset_at = date_trunc('month', v_now + INTERVAL '1 month'),
        builds_this_month = 0,
        updated_at = v_now
    WHERE id = p_user_id;
  END IF;

  -- Check if user has enough credits
  IF v_remaining < p_amount THEN
    RETURN QUERY SELECT FALSE, v_remaining;
    RETURN;
  END IF;

  -- Deduct credits and increment build count
  UPDATE public.profiles
  SET credits_remaining = credits_remaining - p_amount,
      builds_this_month = COALESCE(builds_this_month, 0) + 1,
      updated_at = v_now
  WHERE id = p_user_id;

  RETURN QUERY SELECT TRUE, v_remaining - p_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
