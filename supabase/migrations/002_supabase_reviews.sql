-- ============================================================================
-- Supabase migration: PUBLIC.REVIEWS
-- ----------------------------------------------------------------------------
-- Traveler reviews & ratings (Details page "Field Notes & Reviews") currently
-- live ONLY in localStorage. This migration EXPANDS the stack to a shared
-- Supabase table so reviews are visible across all users.
--
-- IDEMPOTENT & NON-DESTRUCTIVE:
--   • CREATE TABLE / INDEX / POLICY  IF NOT EXISTS
--   • DROP POLICY run before re-create so re-runs are safe
--   • App keeps a localStorage fallback until the table is applied, so NOT
--     applying this file is a safe rollback (no behavior regression).
--
-- RLS (per product decision):
--   • SELECT  → everyone reads 'approved'; authors see their own; admins see all
--   • INSERT  → requires login (auth.uid() = author_id)
--   • UPDATE  → author edits own, admins moderate (status/pinned/delete)
--   • DELETE  → author or admin
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.reviews (
  id            TEXT PRIMARY KEY,                      -- reuses client id (REV-xxxxx); stable across moderation
  location_id   TEXT NOT NULL DEFAULT 'unknown',
  location_name TEXT NOT NULL DEFAULT 'Unknown location',
  region        TEXT,
  author_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name   TEXT NOT NULL,
  avatar        TEXT,
  author_level  INT NOT NULL DEFAULT 1,
  author_title  TEXT,
  rating        SMALLINT NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  text          TEXT,
  images        JSONB NOT NULL DEFAULT '[]'::jsonb,    -- base64 data URLs (same approach as maps.data)
  status        TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'hidden')),
  pinned        BOOLEAN NOT NULL DEFAULT FALSE,
  reports       INT NOT NULL DEFAULT 0,                -- counter (deduped client-side like today)
  helpful       INT NOT NULL DEFAULT 0,                -- counter (deduped client-side like today)
  gps_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_location ON public.reviews(location_name);
CREATE INDEX IF NOT EXISTS idx_reviews_status   ON public.reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_created  ON public.reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_author   ON public.reviews(author_id);

-- Role of the author (e.g. 'Novice Traveler' / 'Cartographer' / 'Admin') shown
-- on review cards instead of level/title. Default from prior badge stamps.
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS author_role TEXT;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_select" ON public.reviews;
DROP POLICY IF EXISTS "reviews_insert" ON public.reviews;
DROP POLICY IF EXISTS "reviews_update" ON public.reviews;
DROP POLICY IF EXISTS "reviews_delete" ON public.reviews;

CREATE POLICY "reviews_select" ON public.reviews
  FOR SELECT USING (
    status = 'approved'
    OR public.is_admin()
    OR (auth.uid() IS NOT NULL AND auth.uid() = author_id)
  );

CREATE POLICY "reviews_insert" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = author_id);

CREATE POLICY "reviews_update" ON public.reviews
  FOR UPDATE USING (public.is_admin() OR auth.uid() = author_id)
  WITH CHECK (public.is_admin() OR auth.uid() = author_id);

CREATE POLICY "reviews_delete" ON public.reviews
  FOR DELETE USING (public.is_admin() OR auth.uid() = author_id);

-- Keep updated_at fresh on moderation edits.
CREATE OR REPLACE FUNCTION public.touch_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reviews_updated_at ON public.reviews;
CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.touch_reviews_updated_at();

-- Auto-approve switch the app already reads (default ON) — column was missing from DB.
ALTER TABLE public.global_settings
  ADD COLUMN IF NOT EXISTS auto_approve_reviews BOOLEAN NOT NULL DEFAULT TRUE;

-- ----------------------------------------------------------------------------
-- bump_review_counter(rev_id, field)
-- Increments the 'helpful' or 'reports' counter. SECURITY DEFINER so any user
-- can bump a counter without the full UPDATE policy (author/admin-only) and
-- without being able to touch other columns (status/text/rating...).
-- Only 'helpful' | 'reports' are accepted; everything else is ignored.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.bump_review_counter(rev_id TEXT, field TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF field = 'helpful' THEN
    UPDATE public.reviews SET helpful = helpful + 1 WHERE id = rev_id;
  ELSIF field = 'reports' THEN
    UPDATE public.reviews SET reports = reports + 1 WHERE id = rev_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.bump_review_counter(TEXT, TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.bump_review_counter(TEXT, TEXT) TO anon, authenticated;