-- ============================================================
-- admin_update_user_role — allow a logged-in admin to change a
-- user's role / status while bypassing row-level security on
-- public.users (RLS blocks writes by non-owners).
--
-- Run this in the Supabase SQL Editor. It is idempotent.
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  p_user_id uuid,
  p_role TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid := auth.uid();
  is_admin boolean;
BEGIN
  -- The caller must be an admin (either via public.admins or users.role = 'admin').
  SELECT EXISTS (
    SELECT 1 FROM public.admins WHERE id = caller_id AND is_active = TRUE
    UNION
    SELECT 1 FROM public.users WHERE id = caller_id AND role IN ('admin', 'Admin')
  ) INTO is_admin;

  IF NOT is_admin OR caller_id IS NULL THEN
    RAISE EXCEPTION 'Insufficient privileges: admin role required';
  END IF;

  UPDATE public.users
  SET
    role   = COALESCE(p_role, role),
    status = COALESCE(p_status, status)
  WHERE id = p_user_id;
END;
$$;

-- Allow the Authenticated role to invoke the function.
GRANT EXECUTE ON FUNCTION public.admin_update_user_role(uuid, text, text) TO authenticated;

-- Allow unauthenticated admin sessions on the anon key to invoke it too,
-- matching how the admin dashboard authenticates with the anon key.
GRANT EXECUTE ON FUNCTION public.admin_update_user_role(uuid, text, text) TO anon;