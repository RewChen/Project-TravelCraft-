-- ============================================================================
-- Supabase migration: PUBLIC.FAVORITES
-- ----------------------------------------------------------------------------
-- Favorited locations. Currently favorites live ONLY in localStorage (shared
-- between guests and signed-in users on one device). This migration adds a
-- shared Supabase table so favorites follow the account across devices.
--
-- IDEMPOTENT & NON-DESTRUCTIVE:
--   • CREATE TABLE / INDEX / POLICY IF NOT EXISTS
--   • DROP POLICY run before re-create so re-runs are safe
--   • App keeps the localStorage mirror until the table is applied (schemaGuard),
--     so NOT applying this file is a safe rollback (no behavior regression).
--
-- RLS (per product decision):
--   • SELECT  → owner only
--   • INSERT  → owner only (auth.uid() = user_id)
--   • DELETE  → owner only
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.favorites (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_title TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, location_title)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.favorites(user_id);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "favorites_select" ON public.favorites;
DROP POLICY IF EXISTS "favorites_insert" ON public.favorites;
DROP POLICY IF EXISTS "favorites_delete" ON public.favorites;

CREATE POLICY "favorites_select" ON public.favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "favorites_insert" ON public.favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "favorites_delete" ON public.favorites
  FOR DELETE USING (auth.uid() = user_id);