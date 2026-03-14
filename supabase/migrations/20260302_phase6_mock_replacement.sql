-- ============================================================
-- Phase 6: Database Migration for Mock Data Replacement
-- Date: 2026-03-02
-- Description: Creates missing tables and columns required to
--   replace hardcoded mock data in workspace-v2 components.
--
-- Changes:
--   1. ALTER marketplace_listings: add prompt, use_count
--   2. ALTER profiles: add referral_code
--   3. CREATE user_api_keys (encrypted BYOK storage)
--   4. CREATE user_connectors (third-party connection status)
--   5. CREATE referrals (referral tracking)
--   6. CREATE recent_views (recently viewed projects)
--   7. UPDATE handle_new_user() trigger (auto-gen referral_code)
--   8. Backfill existing users' referral_code
-- ============================================================


-- ============================================================
-- 1. ALTER marketplace_listings
-- ============================================================

ALTER TABLE public.marketplace_listings
  ADD COLUMN IF NOT EXISTS prompt TEXT NULL;

ALTER TABLE public.marketplace_listings
  ADD COLUMN IF NOT EXISTS use_count INTEGER NOT NULL DEFAULT 0;

-- Add gradient column for template card display
ALTER TABLE public.marketplace_listings
  ADD COLUMN IF NOT EXISTS gradient TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_use_count
  ON public.marketplace_listings (use_count DESC) WHERE is_public = true;


-- ============================================================
-- 2. ALTER profiles: add referral_code
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_referral_code
  ON public.profiles (referral_code) WHERE referral_code IS NOT NULL;


-- ============================================================
-- 3. CREATE user_api_keys
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_api_keys (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider        TEXT        NOT NULL
                              CHECK (provider IN (
                                'openai', 'anthropic', 'google', 'xai',
                                'groq', 'deepseek', 'mistral', 'alibaba', 'custom'
                              )),
  label           TEXT        NULL CHECK (char_length(label) <= 100),
  encrypted_key   TEXT        NOT NULL,
  key_mask        TEXT        NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active', 'expired', 'revoked')),
  last_used_at    TIMESTAMP WITH TIME ZONE NULL,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_provider
  ON public.user_api_keys (user_id, provider);

ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

-- Policies: user can CRUD only their own keys
DROP POLICY IF EXISTS "user_api_keys_select_own" ON public.user_api_keys;
CREATE POLICY "user_api_keys_select_own"
  ON public.user_api_keys FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_api_keys_insert_own" ON public.user_api_keys;
CREATE POLICY "user_api_keys_insert_own"
  ON public.user_api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_api_keys_update_own" ON public.user_api_keys;
CREATE POLICY "user_api_keys_update_own"
  ON public.user_api_keys FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_api_keys_delete_own" ON public.user_api_keys;
CREATE POLICY "user_api_keys_delete_own"
  ON public.user_api_keys FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger: auto-update updated_at
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'user_api_keys_updated_at') THEN
    CREATE TRIGGER user_api_keys_updated_at
      BEFORE UPDATE ON public.user_api_keys
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

GRANT ALL ON public.user_api_keys TO authenticated;


-- ============================================================
-- 4. CREATE user_connectors
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_connectors (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider        TEXT        NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'disconnected'
                              CHECK (status IN ('connected', 'disconnected', 'error')),
  external_id     TEXT        NULL,
  metadata        JSONB       NULL,
  connected_at    TIMESTAMP WITH TIME ZONE NULL,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_user_connectors_user_id
  ON public.user_connectors (user_id);

ALTER TABLE public.user_connectors ENABLE ROW LEVEL SECURITY;

-- Policies: user can CRUD only their own connectors
DROP POLICY IF EXISTS "user_connectors_select_own" ON public.user_connectors;
CREATE POLICY "user_connectors_select_own"
  ON public.user_connectors FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_connectors_insert_own" ON public.user_connectors;
CREATE POLICY "user_connectors_insert_own"
  ON public.user_connectors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_connectors_update_own" ON public.user_connectors;
CREATE POLICY "user_connectors_update_own"
  ON public.user_connectors FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_connectors_delete_own" ON public.user_connectors;
CREATE POLICY "user_connectors_delete_own"
  ON public.user_connectors FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger: auto-update updated_at
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'user_connectors_updated_at') THEN
    CREATE TRIGGER user_connectors_updated_at
      BEFORE UPDATE ON public.user_connectors
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

GRANT ALL ON public.user_connectors TO authenticated;


-- ============================================================
-- 5. CREATE referrals
-- ============================================================

CREATE TABLE IF NOT EXISTS public.referrals (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id  UUID        NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  referred_email    TEXT        NULL,
  status            TEXT        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'signed_up', 'converted')),
  referral_code     TEXT        NOT NULL,
  signed_up_at      TIMESTAMP WITH TIME ZONE NULL,
  converted_at      TIMESTAMP WITH TIME ZONE NULL,
  builds_awarded    INTEGER     NOT NULL DEFAULT 0,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id
  ON public.referrals (referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code
  ON public.referrals (referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id
  ON public.referrals (referred_user_id) WHERE referred_user_id IS NOT NULL;

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Policies: referrer can SELECT own referrals; system handles inserts via SECURITY DEFINER
DROP POLICY IF EXISTS "referrals_select_own" ON public.referrals;
CREATE POLICY "referrals_select_own"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id);

DROP POLICY IF EXISTS "referrals_insert_own" ON public.referrals;
CREATE POLICY "referrals_insert_own"
  ON public.referrals FOR INSERT
  WITH CHECK (auth.uid() = referrer_id);

GRANT ALL ON public.referrals TO authenticated;


-- ============================================================
-- 6. CREATE recent_views
-- ============================================================

CREATE TABLE IF NOT EXISTS public.recent_views (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id      UUID        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  viewed_at       TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_recent_views_user_viewed
  ON public.recent_views (user_id, viewed_at DESC);

ALTER TABLE public.recent_views ENABLE ROW LEVEL SECURITY;

-- Policies: user can CRUD only their own views
DROP POLICY IF EXISTS "recent_views_select_own" ON public.recent_views;
CREATE POLICY "recent_views_select_own"
  ON public.recent_views FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "recent_views_insert_own" ON public.recent_views;
CREATE POLICY "recent_views_insert_own"
  ON public.recent_views FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "recent_views_update_own" ON public.recent_views;
CREATE POLICY "recent_views_update_own"
  ON public.recent_views FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "recent_views_delete_own" ON public.recent_views;
CREATE POLICY "recent_views_delete_own"
  ON public.recent_views FOR DELETE
  USING (auth.uid() = user_id);

GRANT ALL ON public.recent_views TO authenticated;


-- ============================================================
-- 7. UPDATE handle_new_user() trigger
--    Now also generates a referral_code for new users
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, referral_code)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    UPPER(REPLACE(SUBSTRING(new.id::text, 1, 13), '-', ''))
  )
  ON CONFLICT (id) DO UPDATE SET
    referral_code = COALESCE(profiles.referral_code, EXCLUDED.referral_code);

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
-- 8. Backfill existing users' referral_code
-- ============================================================

UPDATE public.profiles
SET referral_code = UPPER(REPLACE(SUBSTRING(id::text, 1, 13), '-', ''))
WHERE referral_code IS NULL;


-- ============================================================
-- 9. Table comments
-- ============================================================

COMMENT ON TABLE public.user_api_keys IS 'Encrypted BYOK API keys for AI providers. Keys are AES-256-GCM encrypted at rest.';
COMMENT ON TABLE public.user_connectors IS 'Third-party service connection status per user (GitHub, Slack, etc).';
COMMENT ON TABLE public.referrals IS 'Referral tracking: who referred whom, conversion status, builds awarded.';
COMMENT ON TABLE public.recent_views IS 'Tracks recently viewed projects per user for sidebar/homepage display.';
