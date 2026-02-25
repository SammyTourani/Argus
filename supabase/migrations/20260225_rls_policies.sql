-- ============================================================
-- Argus Security: RLS Policy Audit & Hardening
-- Date: 2026-02-25
-- Purpose: Verify and supplement RLS policies from v2 schema.
--
-- The v2 schema (20260224_v2_schema.sql) already has comprehensive
-- RLS. This migration adds any missing gaps identified during audit.
-- ============================================================

-- ============================================================
-- AUDIT SUMMARY:
-- ✅ projects              — RLS enabled, full CRUD policies
-- ✅ project_builds        — RLS enabled, full CRUD policies
-- ✅ project_collaborators — RLS enabled, full CRUD policies
-- ✅ teams                 — RLS enabled, full CRUD policies
-- ✅ team_members          — RLS enabled, full CRUD policies
-- ✅ marketplace_listings  — RLS enabled, public read, auth write
-- ✅ onboarding_state      — RLS enabled, user-scoped
-- ✅ user_model_preferences— RLS enabled, user-scoped
-- ✅ profiles              — RLS enabled (from 001_initial_schema.sql)
-- ✅ builds                — RLS enabled (from 001_initial_schema.sql)
-- ✅ build_messages        — RLS enabled, user-scoped
--
-- GAPS IDENTIFIED:
-- 1. build_messages: Missing DELETE policy (users should be able to delete own)
-- 2. build_messages: Missing UPDATE policy
-- 3. builds (legacy): Only SELECT and INSERT policies — no DELETE/UPDATE
-- 4. profiles: No INSERT policy (needed for handle_new_user trigger + backfill)
-- ============================================================

-- ─── build_messages: Add missing UPDATE + DELETE policies ─────────────────

CREATE POLICY IF NOT EXISTS "build_messages_update_own"
  ON public.build_messages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "build_messages_delete_own"
  ON public.build_messages FOR DELETE
  USING (auth.uid() = user_id);

-- ─── builds (legacy): Add UPDATE + DELETE policies ────────────────────────

CREATE POLICY IF NOT EXISTS "builds_update_own"
  ON public.builds FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "builds_delete_own"
  ON public.builds FOR DELETE
  USING (auth.uid() = user_id);

-- ─── profiles: Ensure service role can insert (for trigger) ───────────────
-- Note: The handle_new_user trigger runs as SECURITY DEFINER so it bypasses
-- RLS by default. This is correct behavior. No change needed.

-- ─── Extra hardening: Prevent anon access to builds ─────────────────────
-- Revoke any unintended anon SELECT on builds (was not explicitly granted)
REVOKE SELECT ON public.builds FROM anon;
REVOKE SELECT ON public.build_messages FROM anon;
REVOKE SELECT ON public.profiles FROM anon;

-- ─── Ensure all tables have RLS enabled (idempotent) ─────────────────────
ALTER TABLE public.projects              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_builds        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.build_messages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.builds                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_state      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_model_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_listings  ENABLE ROW LEVEL SECURITY;

-- ─── DONE ──────────────────────────────────────────────────────────────────
-- After applying: verify in Supabase Dashboard → Authentication → Policies
-- that every table shows the expected policies.
