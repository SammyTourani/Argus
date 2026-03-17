-- ============================================================
-- Referral System: Personalized slugs, credit rewards, conversion tracking
-- Date: 2026-03-18
--
-- Changes:
--   1. ALTER profiles: add referral_slug
--   2. ALTER referrals: add credits_awarded, referrer_credits_awarded
--   3. CREATE generate_referral_slug() function
--   4. CREATE award_referral_credits() RPC
--   5. UPDATE handle_new_user() trigger to generate slug on signup
--   6. Backfill existing users' referral_slug
-- ============================================================


-- ============================================================
-- 1. Add referral_slug to profiles
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_slug TEXT UNIQUE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_referral_slug
  ON public.profiles (referral_slug) WHERE referral_slug IS NOT NULL;


-- ============================================================
-- 2. Add credit tracking columns to referrals
-- ============================================================

-- Credits awarded to the referred user on signup (e.g. 10)
ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS credits_awarded INTEGER NOT NULL DEFAULT 0;

-- Credits awarded to the referrer on conversion (e.g. 50)
-- Also serves as a double-claim guard: if > 0, referrer already got rewarded
ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS referrer_credits_awarded INTEGER NOT NULL DEFAULT 0;


-- ============================================================
-- 3. Slug generation function
--    Slugifies full_name → "sammy-tourani"
--    Handles collisions with -2, -3 suffix
--    Falls back to "user-{uuid8}" if no name
-- ============================================================

CREATE OR REPLACE FUNCTION public.generate_referral_slug(p_full_name TEXT, p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_slug TEXT;
  v_base TEXT;
  v_counter INTEGER := 0;
BEGIN
  -- Fallback for null/empty names
  IF p_full_name IS NULL OR TRIM(p_full_name) = '' THEN
    RETURN 'user-' || SUBSTRING(p_user_id::text, 1, 8);
  END IF;

  -- Slugify: lowercase, replace non-alphanumeric with hyphens, trim hyphens
  v_base := LOWER(TRIM(p_full_name));
  v_base := REGEXP_REPLACE(v_base, '[^a-z0-9]+', '-', 'g');
  v_base := TRIM(BOTH '-' FROM v_base);

  -- If slugify produced empty string (name was all special chars)
  IF v_base = '' THEN
    RETURN 'user-' || SUBSTRING(p_user_id::text, 1, 8);
  END IF;

  v_slug := v_base;

  -- Handle collisions: sammy-tourani, sammy-tourani-2, sammy-tourani-3...
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE referral_slug = v_slug AND id != p_user_id) LOOP
    v_counter := v_counter + 1;
    v_slug := v_base || '-' || v_counter;
  END LOOP;

  RETURN v_slug;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 4. Award referral credits RPC
--    Atomically adds credits to a user's balance.
--    Uses credits_remaining = credits_remaining + p_amount
--    which is atomic in Postgres (single UPDATE, no race).
-- ============================================================

CREATE OR REPLACE FUNCTION public.award_referral_credits(p_user_id UUID, p_amount INTEGER)
RETURNS TABLE(success BOOLEAN, remaining INTEGER) AS $$
DECLARE
  v_remaining INTEGER;
BEGIN
  UPDATE public.profiles
  SET credits_remaining = credits_remaining + p_amount,
      credits_total = credits_total + p_amount,
      updated_at = now()
  WHERE id = p_user_id
  RETURNING credits_remaining INTO v_remaining;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0;
    RETURN;
  END IF;

  RETURN QUERY SELECT TRUE, v_remaining;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 5. Update handle_new_user() trigger
--    Now also generates referral_slug on signup
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, referral_code, referral_slug)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    UPPER(REPLACE(SUBSTRING(new.id::text, 1, 13), '-', '')),
    public.generate_referral_slug(new.raw_user_meta_data->>'full_name', new.id)
  )
  ON CONFLICT (id) DO UPDATE SET
    referral_code = COALESCE(profiles.referral_code, EXCLUDED.referral_code),
    referral_slug = COALESCE(profiles.referral_slug, EXCLUDED.referral_slug);

  INSERT INTO public.onboarding_state (user_id, current_step)
  VALUES (new.id, 'welcome')
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_model_preferences (user_id, preferred_model, preferred_style)
  VALUES (new.id, 'gpt-4o-mini', 'minimal')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 6. Backfill existing users' referral_slug
-- ============================================================

UPDATE public.profiles
SET referral_slug = public.generate_referral_slug(full_name, id)
WHERE referral_slug IS NULL;
