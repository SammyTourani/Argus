-- ============================================================
-- Fix: ALL RLS infinite recursion chains
-- Date: 2026-02-27
--
-- PROBLEM: Multiple tables have circular RLS references:
--   projects ↔ project_collaborators (mutual reference)
--   project_builds → projects → project_collaborators → projects
--   team_members → team_members (self-reference, fixed in prior migration)
--
-- FIX: SECURITY DEFINER helper functions that bypass RLS for
-- cross-table ownership/membership checks, breaking all cycles.
-- ============================================================


-- ─── STEP 1: Create SECURITY DEFINER helpers for projects ────────────────────

-- Check if user owns a project (bypasses projects RLS)
CREATE OR REPLACE FUNCTION public.is_project_owner(_project_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = _project_id AND created_by = _user_id
  );
$$;

-- Check if user is an accepted collaborator on a project (bypasses project_collaborators RLS)
CREATE OR REPLACE FUNCTION public.is_project_collaborator(_project_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_collaborators
    WHERE project_id = _project_id
      AND user_id = _user_id
      AND status = 'accepted'
  );
$$;

-- Check if user is an editor/owner collaborator (bypasses project_collaborators RLS)
CREATE OR REPLACE FUNCTION public.is_project_editor(_project_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_collaborators
    WHERE project_id = _project_id
      AND user_id = _user_id
      AND role IN ('owner', 'editor')
      AND status = 'accepted'
  );
$$;


-- ─── STEP 2: Fix projects policies ──────────────────────────────────────────
-- projects_select_collaborator queries project_collaborators → which queries projects back

DROP POLICY IF EXISTS "projects_select_collaborator" ON public.projects;
CREATE POLICY "projects_select_collaborator"
  ON public.projects FOR SELECT
  USING (
    public.is_project_collaborator(id, auth.uid())
  );

DROP POLICY IF EXISTS "projects_update_editor" ON public.projects;
CREATE POLICY "projects_update_editor"
  ON public.projects FOR UPDATE
  USING (
    public.is_project_editor(id, auth.uid())
  );


-- ─── STEP 3: Fix project_collaborators policies ─────────────────────────────
-- All 4 CRUD policies query projects table → which queries project_collaborators back

DROP POLICY IF EXISTS "project_collaborators_select" ON public.project_collaborators;
CREATE POLICY "project_collaborators_select"
  ON public.project_collaborators FOR SELECT
  USING (
    user_id = auth.uid()
    OR email = (SELECT email FROM public.profiles WHERE id = auth.uid())
    OR public.is_project_owner(project_id, auth.uid())
  );

DROP POLICY IF EXISTS "project_collaborators_insert" ON public.project_collaborators;
CREATE POLICY "project_collaborators_insert"
  ON public.project_collaborators FOR INSERT
  WITH CHECK (
    invited_by = auth.uid()
    AND public.is_project_owner(project_id, auth.uid())
  );

DROP POLICY IF EXISTS "project_collaborators_update" ON public.project_collaborators;
CREATE POLICY "project_collaborators_update"
  ON public.project_collaborators FOR UPDATE
  USING (
    user_id = auth.uid()
    OR email = (SELECT email FROM public.profiles WHERE id = auth.uid())
    OR public.is_project_owner(project_id, auth.uid())
  );

DROP POLICY IF EXISTS "project_collaborators_delete" ON public.project_collaborators;
CREATE POLICY "project_collaborators_delete"
  ON public.project_collaborators FOR DELETE
  USING (
    user_id = auth.uid()
    OR public.is_project_owner(project_id, auth.uid())
  );


-- ─── STEP 4: Fix project_builds policies ────────────────────────────────────
-- These query both projects and project_collaborators, creating indirect recursion

DROP POLICY IF EXISTS "project_builds_select" ON public.project_builds;
CREATE POLICY "project_builds_select"
  ON public.project_builds FOR SELECT
  USING (
    created_by = auth.uid()
    OR public.is_project_owner(project_id, auth.uid())
    OR public.is_project_collaborator(project_id, auth.uid())
  );

DROP POLICY IF EXISTS "project_builds_insert" ON public.project_builds;
CREATE POLICY "project_builds_insert"
  ON public.project_builds FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND (
      public.is_project_owner(project_id, auth.uid())
      OR public.is_project_editor(project_id, auth.uid())
    )
  );

DROP POLICY IF EXISTS "project_builds_update" ON public.project_builds;
CREATE POLICY "project_builds_update"
  ON public.project_builds FOR UPDATE
  USING (
    created_by = auth.uid()
    OR public.is_project_owner(project_id, auth.uid())
    OR public.is_project_editor(project_id, auth.uid())
  );

DROP POLICY IF EXISTS "project_builds_delete" ON public.project_builds;
CREATE POLICY "project_builds_delete"
  ON public.project_builds FOR DELETE
  USING (
    public.is_project_owner(project_id, auth.uid())
  );


-- ─── DONE ────────────────────────────────────────────────────────────────────
-- All circular RLS references now go through SECURITY DEFINER functions.
-- No table's policy directly queries another RLS-protected table anymore.
