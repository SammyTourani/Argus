-- Phase 8a: Atomic build counter increment
-- Replaces read-modify-write pattern to prevent race conditions from concurrent builds.

CREATE OR REPLACE FUNCTION public.increment_build_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_new_count INTEGER;
  v_reset_at  TIMESTAMP WITH TIME ZONE;
  v_now       TIMESTAMP WITH TIME ZONE := now();
BEGIN
  SELECT builds_reset_at INTO v_reset_at
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_reset_at IS NOT NULL AND v_reset_at <= v_now THEN
    -- Reset period expired — reset to 1 (this build) and advance reset date
    UPDATE public.profiles
    SET builds_this_month = 1,
        builds_reset_at = date_trunc('month', v_now + interval '1 month'),
        updated_at = v_now
    WHERE id = p_user_id
    RETURNING builds_this_month INTO v_new_count;
  ELSE
    -- Normal increment
    UPDATE public.profiles
    SET builds_this_month = COALESCE(builds_this_month, 0) + 1,
        updated_at = v_now
    WHERE id = p_user_id
    RETURNING builds_this_month INTO v_new_count;
  END IF;

  RETURN v_new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
