-- ============================================================
-- Argus v2 Schema Fixes (corrective migration)
-- Date: 2026-02-26
-- Description: Fixes three issues found during audit of 20260224_v2_schema.sql
--
-- FIX 1: team_members_insert policy — bootstrap chicken-and-egg bug
--   The original policy only allowed owner/admin to insert members,
--   but the team creator could never insert themselves as the first member.
--   Now also allows team creator (teams.created_by) to insert.
--
-- FIX 2: Missing GRANT on build_messages table
--   The v2 migration granted ALL to authenticated on every table except
--   build_messages. Without this, authenticated users cannot read/write
--   chat messages even though RLS policies permit it.
--
-- FIX 3: Race condition in set_build_version_number trigger
--   Concurrent inserts for the same project could produce duplicate
--   version numbers. Added advisory lock keyed on project_id.
-- ============================================================


-- ─── FIX 1: Recreate team_members_insert policy ─────────────────────────────

DROP POLICY IF EXISTS "team_members_insert" ON public.team_members;
CREATE POLICY "team_members_insert"
  ON public.team_members FOR INSERT
  WITH CHECK (
    -- Allow team creator to insert themselves as the first (owner) member
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_members.team_id
        AND t.created_by = auth.uid()
    )
    OR
    -- Allow existing owner/admin to add new members
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'admin')
    )
  );


-- ─── FIX 2: Grant authenticated access to build_messages ────────────────────

GRANT ALL ON public.build_messages TO authenticated;


-- ─── FIX 3: Fix race condition in version number trigger ────────────────────

CREATE OR REPLACE FUNCTION public.set_build_version_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Advisory lock keyed on project_id to prevent concurrent inserts getting same version
  PERFORM pg_advisory_xact_lock(hashtext(NEW.project_id::text));
  SELECT COALESCE(MAX(version_number), 0) + 1
    INTO NEW.version_number
  FROM public.project_builds
  WHERE project_id = NEW.project_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
