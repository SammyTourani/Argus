-- ============================================================
-- Fix: Infinite recursion in team_members RLS policies
-- Date: 2026-02-27
--
-- ROOT CAUSE: team_members policies contain subqueries that
-- SELECT from team_members itself. Postgres evaluates ALL
-- policies (combined with OR) and cannot short-circuit, so
-- even if one policy passes, the self-referencing subquery
-- in another policy triggers infinite recursion.
--
-- FIX: Create SECURITY DEFINER helper functions that bypass
-- RLS when checking team membership. Replace all self-
-- referencing subqueries with calls to these functions.
-- ============================================================


-- ─── STEP 1: Create SECURITY DEFINER helper functions ────────────────────────
-- These run as the function owner (postgres), bypassing RLS on team_members.

CREATE OR REPLACE FUNCTION public.is_team_member(_team_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = _team_id AND user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_team_admin_or_owner(_team_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = _team_id
      AND user_id = _user_id
      AND role IN ('owner', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_team_owner(_team_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = _team_id
      AND user_id = _user_id
      AND role = 'owner'
  );
$$;


-- ─── STEP 2: Fix team_members policies (the recursive ones) ─────────────────

-- SELECT: See your own rows + rows of teams you belong to
DROP POLICY IF EXISTS "team_members_select" ON public.team_members;
CREATE POLICY "team_members_select"
  ON public.team_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_team_member(team_id, auth.uid())
  );

-- INSERT: Team creator can bootstrap, or existing admin/owner can add
DROP POLICY IF EXISTS "team_members_insert" ON public.team_members;
CREATE POLICY "team_members_insert"
  ON public.team_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_members.team_id
        AND t.created_by = auth.uid()
    )
    OR public.is_team_admin_or_owner(team_id, auth.uid())
  );

-- UPDATE: Only admin/owner can update members
DROP POLICY IF EXISTS "team_members_update" ON public.team_members;
CREATE POLICY "team_members_update"
  ON public.team_members FOR UPDATE
  USING (
    public.is_team_admin_or_owner(team_id, auth.uid())
  );

-- DELETE: Remove yourself, or admin/owner can remove others
DROP POLICY IF EXISTS "team_members_delete" ON public.team_members;
CREATE POLICY "team_members_delete"
  ON public.team_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR public.is_team_admin_or_owner(team_id, auth.uid())
  );


-- ─── STEP 3: Fix teams policies that also query team_members ─────────────────

DROP POLICY IF EXISTS "teams_select_member" ON public.teams;
CREATE POLICY "teams_select_member"
  ON public.teams FOR SELECT
  USING (
    public.is_team_member(id, auth.uid())
  );

DROP POLICY IF EXISTS "teams_update_owner" ON public.teams;
CREATE POLICY "teams_update_owner"
  ON public.teams FOR UPDATE
  USING (
    public.is_team_owner(id, auth.uid())
  );

DROP POLICY IF EXISTS "teams_delete_owner" ON public.teams;
CREATE POLICY "teams_delete_owner"
  ON public.teams FOR DELETE
  USING (
    public.is_team_owner(id, auth.uid())
  );


-- ─── STEP 4: Fix projects policy that queries team_members ───────────────────

DROP POLICY IF EXISTS "projects_select_team_member" ON public.projects;
CREATE POLICY "projects_select_team_member"
  ON public.projects FOR SELECT
  USING (
    team_id IS NOT NULL
    AND public.is_team_member(team_id, auth.uid())
  );


-- ─── DONE ────────────────────────────────────────────────────────────────────
-- All self-referencing team_members subqueries now go through SECURITY DEFINER
-- functions that bypass RLS, breaking the infinite recursion chain.
