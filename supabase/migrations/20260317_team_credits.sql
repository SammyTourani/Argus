-- Workspace-scoped subscriptions: add credits/builds columns to teams table
-- Each team workspace gets its own credit pool (Lovable model: pooled per workspace).

-- ── Add credit/build columns to teams ──────────────────────────────────────────

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS credits_remaining INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS credits_total INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS credits_reset_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS builds_this_month INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS builds_reset_at TIMESTAMPTZ;

-- Initialize credits_reset_at for existing teams
UPDATE public.teams
SET credits_reset_at = date_trunc('month', NOW() + INTERVAL '1 month')
WHERE credits_reset_at IS NULL;

-- ── Fix plan check constraint: add 'pro' tier ─────────────────────────────────
-- The original constraint only allowed ('free', 'team', 'enterprise').
-- Teams need to be upgradable to 'pro' as well.

ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS teams_plan_check;
ALTER TABLE public.teams ADD CONSTRAINT teams_plan_check
  CHECK (plan IN ('free', 'pro', 'team', 'enterprise'));

-- ── Atomic credit deduction for teams ──────────────────────────────────────────
-- Mirrors deduct_credits() but operates on the teams table.
-- Uses FOR UPDATE row lock to prevent race conditions from concurrent builds.

CREATE OR REPLACE FUNCTION public.deduct_team_credits(p_team_id UUID, p_amount INTEGER)
RETURNS TABLE(success BOOLEAN, remaining INTEGER) AS $$
DECLARE
  v_remaining INTEGER;
  v_total INTEGER;
  v_reset_at TIMESTAMPTZ;
  v_plan TEXT;
  v_sub_status TEXT;
  v_now TIMESTAMPTZ := now();
BEGIN
  -- Lock the row to prevent concurrent deductions
  SELECT credits_remaining, credits_total, credits_reset_at, plan, subscription_status
  INTO v_remaining, v_total, v_reset_at, v_plan, v_sub_status
  FROM public.teams
  WHERE id = p_team_id
  FOR UPDATE;

  -- If team not found, fail gracefully
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0;
    RETURN;
  END IF;

  -- Auto-reset credits if the billing period has expired
  IF v_reset_at IS NOT NULL AND v_reset_at <= v_now THEN
    v_total := CASE
      WHEN v_plan IN ('team', 'enterprise') THEN 500
      WHEN v_plan = 'pro' THEN 300
      ELSE 30
    END;
    v_remaining := v_total;

    UPDATE public.teams
    SET credits_remaining = v_remaining,
        credits_total = v_total,
        credits_reset_at = date_trunc('month', v_now + INTERVAL '1 month'),
        builds_this_month = 0,
        updated_at = v_now
    WHERE id = p_team_id;
  END IF;

  -- Check if team has enough credits
  IF v_remaining < p_amount THEN
    RETURN QUERY SELECT FALSE, v_remaining;
    RETURN;
  END IF;

  -- Deduct credits and increment build count
  UPDATE public.teams
  SET credits_remaining = credits_remaining - p_amount,
      builds_this_month = COALESCE(builds_this_month, 0) + 1,
      updated_at = v_now
  WHERE id = p_team_id;

  RETURN QUERY SELECT TRUE, v_remaining - p_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
