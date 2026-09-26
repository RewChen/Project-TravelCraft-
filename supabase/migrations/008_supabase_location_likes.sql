-- ============================================================================
-- Supabase migration: PUBLIC.LOCATION_LIKES
-- ----------------------------------------------------------------------------
-- Per-user "ถูกใจ / Like" for a location with a PUBLIC like count, shown on the
-- World Map detail popup. Separate from public.favorites (สถานที่โปรด list).
--
-- IDEMPOTENT & NON-DESTRUCTIVE:
--   • CREATE TABLE / INDEX / POLICY IF NOT EXISTS
--   • DROP POLICY run before re-create so re-runs are safe
--   • App degrades gracefully until this file is applied (schemaGuard), so NOT
--     applying this file is a safe rollback (no behavior regression).
--
-- RLS:
--   • SELECT  → everyone (the like count is public)
--   • INSERT  → owner only (auth.uid() = user_id)
--   • DELETE  → owner only
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.location_likes (
  location_key TEXT NOT NULL,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (location_key, user_id)
);

CREATE INDEX IF NOT EXISTS idx_location_likes_key ON public.location_likes(location_key);

ALTER TABLE public.location_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "location_likes_select" ON public.location_likes;
DROP POLICY IF EXISTS "location_likes_insert" ON public.location_likes;
DROP POLICY IF EXISTS "location_likes_delete" ON public.location_likes;

CREATE POLICY "location_likes_select" ON public.location_likes
  FOR SELECT USING (true);

CREATE POLICY "location_likes_insert" ON public.location_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "location_likes_delete" ON public.location_likes
  FOR DELETE USING (auth.uid() = user_id);
