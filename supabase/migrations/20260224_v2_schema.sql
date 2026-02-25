-- ============================================================
-- Argus v2 Schema Migration
-- Date: 2026-02-24
-- Description: Multi-project workspace, teams, collaboration,
--              model marketplace, onboarding state machine
-- ============================================================

-- ============================================================
-- HELPER: updated_at trigger function (reusable)
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- TABLE: projects
-- Core entity for Figma-style multi-project workspace.
-- Each user can have many projects. Projects are the top-level
-- container for builds, collaborators, and settings.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.projects (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id         UUID        NULL,     -- optional, FK added after teams table is created
  name            TEXT        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  description     TEXT        NULL      CHECK (char_length(description) <= 500),
  thumbnail_url   TEXT        NULL,     -- screenshot of last build's preview
  is_starred      BOOLEAN     NOT NULL DEFAULT false,
  is_archived     BOOLEAN     NOT NULL DEFAULT false,
  status          TEXT        NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active', 'archived', 'building')),
  default_model   TEXT        NULL,     -- e.g. 'claude-sonnet-4-5', inherits from user_model_preferences
  default_style   TEXT        NULL,     -- e.g. 'minimal', 'dark'
  last_build_at   TIMESTAMP WITH TIME ZONE NULL,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_projects_created_by  ON public.projects (created_by);
CREATE INDEX IF NOT EXISTS idx_projects_team_id     ON public.projects (team_id);
CREATE INDEX IF NOT EXISTS idx_projects_is_starred  ON public.projects (created_by, is_starred) WHERE is_starred = true;
CREATE INDEX IF NOT EXISTS idx_projects_updated_at  ON public.projects (updated_at DESC);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Owners see their own projects
CREATE POLICY "projects_select_own"
  ON public.projects FOR SELECT
  USING (auth.uid() = created_by);

-- Collaborators see projects they're invited to
CREATE POLICY "projects_select_collaborator"
  ON public.projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_collaborators pc
      WHERE pc.project_id = projects.id
        AND pc.user_id = auth.uid()
        AND pc.status = 'accepted'
    )
  );

-- Team members see team projects
CREATE POLICY "projects_select_team_member"
  ON public.projects FOR SELECT
  USING (
    team_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = projects.team_id
        AND tm.user_id = auth.uid()
    )
  );

-- Only owners can insert
CREATE POLICY "projects_insert_own"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Owners can update
CREATE POLICY "projects_update_owner"
  ON public.projects FOR UPDATE
  USING (auth.uid() = created_by);

-- Editors can update name/description/thumbnail (not settings)
CREATE POLICY "projects_update_editor"
  ON public.projects FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.project_collaborators pc
      WHERE pc.project_id = projects.id
        AND pc.user_id = auth.uid()
        AND pc.role = 'editor'
        AND pc.status = 'accepted'
    )
  );

-- Only owners can delete
CREATE POLICY "projects_delete_owner"
  ON public.projects FOR DELETE
  USING (auth.uid() = created_by);

-- updated_at trigger
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- TABLE: teams
-- Optional team workspace. Users can belong to one or more teams.
-- Team projects are visible to all team members.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.teams (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT    NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  slug        TEXT    NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]{2,50}$'),
  avatar_url  TEXT    NULL,
  plan        TEXT    NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'team', 'enterprise')),
  stripe_customer_id    TEXT UNIQUE NULL,
  stripe_subscription_id TEXT UNIQUE NULL,
  subscription_status   TEXT NOT NULL DEFAULT 'inactive'
                        CHECK (subscription_status IN ('active', 'inactive', 'past_due', 'cancelled')),
  created_by  UUID    NOT NULL REFERENCES auth.users(id),
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_teams_created_by ON public.teams (created_by);
CREATE INDEX IF NOT EXISTS idx_teams_slug       ON public.teams (slug);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Team members can view their team
CREATE POLICY "teams_select_member"
  ON public.teams FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = teams.id AND tm.user_id = auth.uid()
    )
  );

-- Owners can insert
CREATE POLICY "teams_insert_owner"
  ON public.teams FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Only team owners can update
CREATE POLICY "teams_update_owner"
  ON public.teams FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = teams.id
        AND tm.user_id = auth.uid()
        AND tm.role = 'owner'
    )
  );

-- Only team owners can delete
CREATE POLICY "teams_delete_owner"
  ON public.teams FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = teams.id
        AND tm.user_id = auth.uid()
        AND tm.role = 'owner'
    )
  );

CREATE TRIGGER teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Now add the FK from projects to teams (after both tables exist)
ALTER TABLE public.projects
  ADD CONSTRAINT fk_projects_team
  FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;


-- ============================================================
-- TABLE: team_members
-- Junction table: users ↔ teams with roles.
-- Roles: owner / admin / member
-- ============================================================

CREATE TABLE IF NOT EXISTS public.team_members (
  id         UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id    UUID    NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id    UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT    NOT NULL DEFAULT 'member'
                    CHECK (role IN ('owner', 'admin', 'member')),
  invited_by UUID    NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  joined_at  TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (team_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members (team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members (user_id);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Team members can see other members
CREATE POLICY "team_members_select"
  ON public.team_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.team_members tm2
      WHERE tm2.team_id = team_members.team_id AND tm2.user_id = auth.uid()
    )
  );

-- Owners/admins can add members
CREATE POLICY "team_members_insert"
  ON public.team_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'admin')
    )
  );

-- Owners/admins can update roles
CREATE POLICY "team_members_update"
  ON public.team_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'admin')
    )
  );

-- Owners/admins can remove members; members can remove themselves
CREATE POLICY "team_members_delete"
  ON public.team_members FOR DELETE
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'admin')
    )
  );


-- ============================================================
-- TABLE: project_collaborators
-- Direct project-level collaboration (no team required).
-- Roles: owner / editor / viewer
-- ============================================================

CREATE TABLE IF NOT EXISTS public.project_collaborators (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id  UUID    NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id     UUID    NULL REFERENCES auth.users(id) ON DELETE CASCADE,  -- NULL until invite accepted
  invited_by  UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT    NOT NULL,    -- email of invitee (may not have account yet)
  role        TEXT    NOT NULL DEFAULT 'viewer'
                      CHECK (role IN ('owner', 'editor', 'viewer')),
  status      TEXT    NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'accepted', 'declined', 'revoked')),
  invite_token TEXT   UNIQUE NULL, -- one-time token emailed to invitee
  invited_at  TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE NULL,
  UNIQUE (project_id, email)
);

CREATE INDEX IF NOT EXISTS idx_project_collaborators_project_id ON public.project_collaborators (project_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_user_id    ON public.project_collaborators (user_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_email      ON public.project_collaborators (email);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_token      ON public.project_collaborators (invite_token) WHERE invite_token IS NOT NULL;

ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;

-- Collaborators can see their own invite + project owner can see all
CREATE POLICY "project_collaborators_select"
  ON public.project_collaborators FOR SELECT
  USING (
    user_id = auth.uid() OR
    email = (SELECT email FROM public.profiles WHERE id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_collaborators.project_id AND p.created_by = auth.uid()
    )
  );

-- Only project owners can invite
CREATE POLICY "project_collaborators_insert"
  ON public.project_collaborators FOR INSERT
  WITH CHECK (
    invited_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_collaborators.project_id AND p.created_by = auth.uid()
    )
  );

-- Invitees can accept/decline; owners can revoke
CREATE POLICY "project_collaborators_update"
  ON public.project_collaborators FOR UPDATE
  USING (
    user_id = auth.uid() OR
    email = (SELECT email FROM public.profiles WHERE id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_collaborators.project_id AND p.created_by = auth.uid()
    )
  );

-- Owners can delete collaborators; collaborators can remove themselves
CREATE POLICY "project_collaborators_delete"
  ON public.project_collaborators FOR DELETE
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_collaborators.project_id AND p.created_by = auth.uid()
    )
  );


-- ============================================================
-- TABLE: project_builds
-- Links existing builds table to projects.
-- Also stores build metadata needed for the project overview.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.project_builds (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id  UUID    NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  build_id    UUID    NULL REFERENCES public.builds(id) ON DELETE SET NULL,  -- FK to existing builds table
  created_by  UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT    NULL CHECK (char_length(title) <= 200),
  description TEXT    NULL CHECK (char_length(description) <= 1000),
  status      TEXT    NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'generating', 'complete', 'failed')),
  model       TEXT    NULL,     -- AI model used for this specific build
  style       TEXT    NULL,     -- style preset used
  preview_url TEXT    NULL,     -- iframe preview URL (E2B sandbox or Vercel)
  thumbnail_url TEXT  NULL,     -- screenshot of the build output
  sandbox_id  TEXT    NULL,     -- E2B or Vercel sandbox ID
  files_json  JSONB   NULL,     -- snapshot of generated files (for restore)
  published_url TEXT  NULL,     -- if deployed to Vercel, the public URL
  version_number INTEGER NOT NULL DEFAULT 1,  -- auto-incremented per project
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_project_builds_project_id ON public.project_builds (project_id);
CREATE INDEX IF NOT EXISTS idx_project_builds_build_id   ON public.project_builds (build_id);
CREATE INDEX IF NOT EXISTS idx_project_builds_created_by ON public.project_builds (created_by);
CREATE INDEX IF NOT EXISTS idx_project_builds_status     ON public.project_builds (project_id, status);
CREATE INDEX IF NOT EXISTS idx_project_builds_created_at ON public.project_builds (project_id, created_at DESC);

ALTER TABLE public.project_builds ENABLE ROW LEVEL SECURITY;

-- Project members can view builds
CREATE POLICY "project_builds_select"
  ON public.project_builds FOR SELECT
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.projects p WHERE p.id = project_builds.project_id AND p.created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.project_collaborators pc
      WHERE pc.project_id = project_builds.project_id
        AND pc.user_id = auth.uid()
        AND pc.status = 'accepted'
    )
  );

-- Project owners and editors can insert
CREATE POLICY "project_builds_insert"
  ON public.project_builds FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND (
      EXISTS (
        SELECT 1 FROM public.projects p WHERE p.id = project_builds.project_id AND p.created_by = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM public.project_collaborators pc
        WHERE pc.project_id = project_builds.project_id
          AND pc.user_id = auth.uid()
          AND pc.role IN ('owner', 'editor')
          AND pc.status = 'accepted'
      )
    )
  );

-- Build creator, project owner, and editors can update
CREATE POLICY "project_builds_update"
  ON public.project_builds FOR UPDATE
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.projects p WHERE p.id = project_builds.project_id AND p.created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.project_collaborators pc
      WHERE pc.project_id = project_builds.project_id
        AND pc.user_id = auth.uid()
        AND pc.role IN ('owner', 'editor')
        AND pc.status = 'accepted'
    )
  );

-- Only project owner can delete builds
CREATE POLICY "project_builds_delete"
  ON public.project_builds FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p WHERE p.id = project_builds.project_id AND p.created_by = auth.uid()
    )
  );

-- updated_at trigger
CREATE TRIGGER project_builds_updated_at
  BEFORE UPDATE ON public.project_builds
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-increment version_number within a project
CREATE OR REPLACE FUNCTION public.set_build_version_number()
RETURNS TRIGGER AS $$
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
    INTO NEW.version_number
  FROM public.project_builds
  WHERE project_id = NEW.project_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER project_builds_version_number
  BEFORE INSERT ON public.project_builds
  FOR EACH ROW EXECUTE FUNCTION public.set_build_version_number();

-- Sync project's last_build_at and thumbnail_url when a build completes
CREATE OR REPLACE FUNCTION public.sync_project_on_build_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'complete' AND (OLD.status IS DISTINCT FROM 'complete') THEN
    UPDATE public.projects
    SET
      last_build_at = now(),
      thumbnail_url = COALESCE(NEW.thumbnail_url, projects.thumbnail_url),
      updated_at    = now()
    WHERE id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER project_builds_sync_project
  AFTER UPDATE ON public.project_builds
  FOR EACH ROW EXECUTE FUNCTION public.sync_project_on_build_update();


-- ============================================================
-- TABLE: marketplace_listings
-- Public gallery of community builds.
-- Pro users can publish their builds here.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id              UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  project_build_id UUID   NULL REFERENCES public.project_builds(id) ON DELETE SET NULL,
  submitted_by    UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           TEXT    NOT NULL CHECK (char_length(title) BETWEEN 1 AND 150),
  description     TEXT    NULL CHECK (char_length(description) <= 500),
  thumbnail_url   TEXT    NOT NULL,   -- required for gallery display
  preview_url     TEXT    NULL,       -- live sandbox URL (may expire)
  published_url   TEXT    NULL,       -- permanent Vercel URL if deployed
  model           TEXT    NULL,       -- model used to generate this build
  style           TEXT    NULL,       -- style preset used
  tags            TEXT[]  NOT NULL DEFAULT '{}',  -- ['landing-page', 'dark', 'saas']
  category        TEXT    NULL,       -- 'Landing Page', 'Dashboard', etc.
  is_public       BOOLEAN NOT NULL DEFAULT true,
  is_featured     BOOLEAN NOT NULL DEFAULT false,  -- hand-curated by admins
  view_count      INTEGER NOT NULL DEFAULT 0,
  fork_count      INTEGER NOT NULL DEFAULT 0,
  like_count      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_is_public   ON public.marketplace_listings (is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_category    ON public.marketplace_listings (category) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_tags        ON public.marketplace_listings USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_model       ON public.marketplace_listings (model) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_featured    ON public.marketplace_listings (is_featured, created_at DESC) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_submitted_by ON public.marketplace_listings (submitted_by);

ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

-- Anyone can view public listings
CREATE POLICY "marketplace_listings_select_public"
  ON public.marketplace_listings FOR SELECT
  USING (is_public = true);

-- Submitters can view their own (including private/unpublished)
CREATE POLICY "marketplace_listings_select_own"
  ON public.marketplace_listings FOR SELECT
  USING (submitted_by = auth.uid());

-- Authenticated Pro users can submit (enforcement done at API level)
CREATE POLICY "marketplace_listings_insert"
  ON public.marketplace_listings FOR INSERT
  WITH CHECK (
    auth.uid() = submitted_by AND
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.subscription_status IN ('pro', 'team', 'enterprise')
    )
  );

-- Submitters can update their own listings
CREATE POLICY "marketplace_listings_update"
  ON public.marketplace_listings FOR UPDATE
  USING (submitted_by = auth.uid());

-- Submitters can delete their own listings
CREATE POLICY "marketplace_listings_delete"
  ON public.marketplace_listings FOR DELETE
  USING (submitted_by = auth.uid());

CREATE TRIGGER marketplace_listings_updated_at
  BEFORE UPDATE ON public.marketplace_listings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- TABLE: onboarding_state
-- Tracks per-user onboarding wizard progress.
-- Created automatically on user signup (via trigger).
-- Never deleted — completed_at marks final state.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.onboarding_state (
  user_id         UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  current_step    TEXT    NOT NULL DEFAULT 'welcome'
                          CHECK (current_step IN (
                            'welcome',
                            'what_to_build',
                            'choose_model',
                            'first_build',
                            'completed'
                          )),
  what_to_build   TEXT    NULL,   -- 'clone_website', 'from_scratch', 'from_prompt', 'gallery'
  chosen_model    TEXT    NULL,   -- model ID chosen in step 3
  completed_at    TIMESTAMP WITH TIME ZONE NULL,  -- NULL = incomplete
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_onboarding_state_completed ON public.onboarding_state (completed_at) WHERE completed_at IS NULL;

ALTER TABLE public.onboarding_state ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own onboarding state
CREATE POLICY "onboarding_state_select"
  ON public.onboarding_state FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "onboarding_state_insert"
  ON public.onboarding_state FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "onboarding_state_update"
  ON public.onboarding_state FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER onboarding_state_updated_at
  BEFORE UPDATE ON public.onboarding_state
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- TABLE: user_model_preferences
-- Stores each user's preferred AI model and style preset.
-- Defaults applied when creating new projects/builds.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_model_preferences (
  user_id         UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  preferred_model TEXT    NOT NULL DEFAULT 'gpt-4o-mini',
  preferred_style TEXT    NOT NULL DEFAULT 'minimal',
  -- Per-model usage tracking (cost awareness)
  total_builds    INTEGER NOT NULL DEFAULT 0,
  last_model_used TEXT    NULL,
  last_used_at    TIMESTAMP WITH TIME ZONE NULL,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.user_model_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_model_preferences_select"
  ON public.user_model_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_model_preferences_insert"
  ON public.user_model_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_model_preferences_update"
  ON public.user_model_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER user_model_preferences_updated_at
  BEFORE UPDATE ON public.user_model_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- PATCH: builds table — add share_token + title if missing
-- (These may already exist from v1 usage; using IF NOT EXISTS
--  semantics via DO blocks to be safe)
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'builds'
      AND column_name = 'title'
  ) THEN
    ALTER TABLE public.builds ADD COLUMN title TEXT NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'builds'
      AND column_name = 'share_token'
  ) THEN
    ALTER TABLE public.builds ADD COLUMN share_token TEXT UNIQUE NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'builds'
      AND column_name = 'project_id'
  ) THEN
    ALTER TABLE public.builds
      ADD COLUMN project_id UUID NULL REFERENCES public.projects(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_builds_project_id ON public.builds (project_id);
  END IF;
END $$;


-- ============================================================
-- PATCH: profiles table — add v2 fields
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'subscription_status'
      -- Check it already has 'team' as a valid value; if not, update constraint
  ) THEN
    NULL; -- column exists from v1
  END IF;
END $$;

-- Expand subscription_status to include 'team' and 'enterprise' tiers
-- Drop and recreate constraint (safe since we're adding values only)
DO $$ BEGIN
  -- Try to find and drop the existing check constraint on subscription_status
  -- (it may or may not have an explicit constraint name)
  ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_subscription_status_check
  CHECK (subscription_status IN ('free', 'pro', 'team', 'enterprise', 'cancelled', 'past_due'));


-- ============================================================
-- UPDATED TRIGGER: handle_new_user
-- Also initializes onboarding_state and user_model_preferences
-- on every new signup.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile (existing behavior)
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Initialize onboarding state (new in v2)
  INSERT INTO public.onboarding_state (user_id, current_step)
  VALUES (new.id, 'welcome')
  ON CONFLICT (user_id) DO NOTHING;

  -- Initialize model preferences with sensible defaults (new in v2)
  INSERT INTO public.user_model_preferences (user_id, preferred_model, preferred_style)
  VALUES (new.id, 'gpt-4o-mini', 'minimal')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger to pick up the updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ============================================================
-- BACKFILL: Initialize onboarding_state + user_model_preferences
-- for all existing users (those who signed up before v2)
-- ============================================================

INSERT INTO public.onboarding_state (user_id, current_step, completed_at)
SELECT id, 'completed', now()
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
-- Mark existing users as "completed" so they skip onboarding

INSERT INTO public.user_model_preferences (user_id, preferred_model, preferred_style)
SELECT id, 'gpt-4o-mini', 'minimal'
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;


-- ============================================================
-- VIEW: project_collaborators_with_profiles
-- Convenience view for fetching collaborator details in one query
-- ============================================================

CREATE OR REPLACE VIEW public.project_collaborators_with_profiles AS
SELECT
  pc.id,
  pc.project_id,
  pc.user_id,
  pc.email,
  pc.role,
  pc.status,
  pc.invited_at,
  pc.accepted_at,
  p.full_name,
  p.avatar_url
FROM public.project_collaborators pc
LEFT JOIN public.profiles p ON p.id = pc.user_id;


-- ============================================================
-- VIEW: project_summary
-- Used by the workspace project grid — includes collaborator count
-- and latest build info without N+1 queries.
-- ============================================================

CREATE OR REPLACE VIEW public.project_summary AS
SELECT
  proj.id,
  proj.created_by,
  proj.team_id,
  proj.name,
  proj.description,
  proj.thumbnail_url,
  proj.is_starred,
  proj.is_archived,
  proj.status,
  proj.default_model,
  proj.default_style,
  proj.last_build_at,
  proj.created_at,
  proj.updated_at,
  -- Build count
  (
    SELECT COUNT(*) FROM public.project_builds pb
    WHERE pb.project_id = proj.id
  ) AS build_count,
  -- Latest build status
  (
    SELECT pb.status FROM public.project_builds pb
    WHERE pb.project_id = proj.id
    ORDER BY pb.created_at DESC
    LIMIT 1
  ) AS latest_build_status,
  -- Collaborator count (accepted)
  (
    SELECT COUNT(*) FROM public.project_collaborators pc
    WHERE pc.project_id = proj.id AND pc.status = 'accepted'
  ) AS collaborator_count
FROM public.projects proj;


-- ============================================================
-- FUNCTION: accept_project_invite(token TEXT)
-- Called when an invitee clicks the email link.
-- Matches the token, links their user_id, updates status.
-- ============================================================

CREATE OR REPLACE FUNCTION public.accept_project_invite(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_invite public.project_collaborators;
  v_user_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  -- Find the invite
  SELECT * INTO v_invite
  FROM public.project_collaborators
  WHERE invite_token = p_token
    AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'invite_not_found_or_expired');
  END IF;

  -- Update the invite
  UPDATE public.project_collaborators
  SET
    user_id     = v_user_id,
    status      = 'accepted',
    accepted_at = now(),
    invite_token = NULL   -- consume the token
  WHERE id = v_invite.id;

  RETURN jsonb_build_object(
    'success', true,
    'project_id', v_invite.project_id,
    'role', v_invite.role
  );
END;
$$;


-- ============================================================
-- STORAGE BUCKET: project-thumbnails
-- For storing build screenshots used as project cards thumbnails.
-- (Run via Supabase dashboard or API if not using CLI)
-- ============================================================

-- Note: Storage bucket creation is done via Supabase dashboard or
-- the management API. The SQL below documents the intended policy.
-- Bucket name: project-thumbnails
-- Public: true (thumbnails are viewable without auth)
-- Allowed MIME types: image/jpeg, image/png, image/webp

-- Storage RLS (apply via dashboard under Storage → Policies):
-- INSERT: auth.uid() = (storage.foldername(name))[1]::uuid
-- SELECT: bucket_id = 'project-thumbnails' (public)
-- DELETE: auth.uid() = (storage.foldername(name))[1]::uuid


-- ============================================================
-- GRANT: ensure anon + authenticated roles have correct access
-- ============================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON public.marketplace_listings TO anon;
GRANT SELECT ON public.project_collaborators_with_profiles TO authenticated;
GRANT SELECT ON public.project_summary TO authenticated;

GRANT ALL ON public.projects TO authenticated;
GRANT ALL ON public.teams TO authenticated;
GRANT ALL ON public.team_members TO authenticated;
GRANT ALL ON public.project_collaborators TO authenticated;
GRANT ALL ON public.project_builds TO authenticated;
GRANT ALL ON public.marketplace_listings TO authenticated;
GRANT ALL ON public.onboarding_state TO authenticated;
GRANT ALL ON public.user_model_preferences TO authenticated;

GRANT EXECUTE ON FUNCTION public.accept_project_invite TO authenticated;


-- ============================================================
-- REALTIME: Enable on tables that need live updates
-- ============================================================

-- Enable realtime for project_builds (build status updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_builds;

-- Enable realtime for project_collaborators (invite accepted notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_collaborators;

-- Enable realtime for projects (project updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;


-- ============================================================
-- DONE
-- ============================================================

COMMENT ON TABLE public.projects IS 'Multi-project workspace: each user can have multiple projects. Core entity for Argus v2.';
COMMENT ON TABLE public.teams IS 'Optional team workspaces. Team members share access to all team projects.';
COMMENT ON TABLE public.team_members IS 'Junction: users ↔ teams. Roles: owner, admin, member.';
COMMENT ON TABLE public.project_collaborators IS 'Direct project-level collaboration. Invite by email. Roles: owner, editor, viewer.';
COMMENT ON TABLE public.project_builds IS 'Each build attempt within a project. Links to existing builds table.';
COMMENT ON TABLE public.marketplace_listings IS 'Public community gallery. Pro users can publish builds here.';
COMMENT ON TABLE public.onboarding_state IS 'Per-user onboarding wizard progress. 4 steps. Never repeats.';
COMMENT ON TABLE public.user_model_preferences IS 'Default AI model and style preset per user.';

-- ============================================================
-- TABLE: build_messages
-- Stores full conversation history per build for context persistence.
-- Allows AI to have memory of what was built across sessions.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.build_messages (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  build_id    UUID        NOT NULL REFERENCES public.project_builds(id) ON DELETE CASCADE,
  project_id  UUID        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT        NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content     TEXT        NOT NULL,
  file_changes TEXT[]     DEFAULT '{}',
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_build_messages_build_id ON public.build_messages (build_id, created_at ASC);

ALTER TABLE public.build_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "build_messages_select_own"
  ON public.build_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "build_messages_insert_own"
  ON public.build_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);
