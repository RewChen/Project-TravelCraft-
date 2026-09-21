-- ============================================================================
-- Supabase migration: PUBLIC.REVIEWS — ADMIN CHECKED FLAG
-- ----------------------------------------------------------------------------
-- NEW MODERATION MODEL (per product decision):
--   • Reviews go LIVE immediately on submit (status = 'approved').
--   • Admin does NOT gate publishing anymore. Admin's only job is to CHECK
--     each review after the fact (good → mark as checked; bad → hide/delete).
--   • `admin_checked` tracks whether an admin has confirmed they reviewed a
--     review. Defaults FALSE so every new/legacy review shows up in the admin
--     "needs checking" queue until an admin confirms it.
--
-- IDEMPOTENT & NON-DESTRUCTIVE:
--   • ALTER TABLE ... ADD COLUMN IF NOT EXISTS / CREATE INDEX IF NOT EXISTS
--   • SECURITY DEFINER function + trigger patterns mirror 002_supabase_reviews.
--   • The app degrades gracefully if this migration is not applied yet
--     (schemaGuard skips admin_checked writes; UI treats missing flag as false).
--
-- RLS note: a plain UPDATE on admin_checked would be allowed for the author by
-- the existing author/admin UPDATE policy, so marking is done through a
-- SECURITY DEFINER function that verifies public.is_admin() first (same guard
-- pattern as admin_update_user_role / bump_review_counter).
-- ============================================================================

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS admin_checked BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_reviews_admin_checked ON public.reviews(admin_checked);

-- ----------------------------------------------------------------------------
-- review_mark_checked(rev_id)
-- Marks a review as administrator-checked. SECURITY DEFINER so regular UPDATE
-- RLS (which would also let the author self-stamp) is bypassed, and the admin
-- guard inside the function is enforced instead.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.review_mark_checked(rev_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Insufficient privileges: admin role required';
  END IF;

  UPDATE public.reviews
  SET admin_checked = TRUE
  WHERE id = rev_id;
END;
$$;

REVOKE ALL ON FUNCTION public.review_mark_checked(TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.review_mark_checked(TEXT) TO anon, authenticated;