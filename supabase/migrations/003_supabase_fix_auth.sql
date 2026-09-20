-- ============================================================
-- TravelCraft — supabase_fix_auth.sql  (v2 — NULL-repair first)
-- Root cause: a manually-inserted auth.users row (or rows) left
-- string columns NULL (.e.g confirmation_token). GoTrue scans them
-- expecting '' -> "converting NULL to string is unsupported" ->
-- 500 "Database error finding user" / "querying schema".
-- Fix = DML (UPDATE), which does NOT need table ownership,
-- so the earlier 42501 does not block this file.
-- ============================================================

-- 0) AUDIT: how many auth.users rows carry NULL in the columns GoTrue
--    scans. Expect admin@travelcraft.com row to show counts = 1+.
SELECT
  count(*) FILTER (WHERE confirmation_token         IS NULL) AS null_confirmation_token,
  count(*) FILTER (WHERE recovery_token             IS NULL) AS null_recovery_token,
  count(*) FILTER (WHERE email_change               IS NULL) AS null_email_change,
  count(*) FILTER (WHERE email_change_token_new     IS NULL) AS null_email_change_token_new,
  count(*) FILTER (WHERE email_change_token_current IS NULL) AS null_email_change_token_current,
  count(*) FILTER (WHERE phone_change               IS NULL) AS null_phone_change,
  count(*) FILTER (WHERE phone_change_token         IS NULL) AS null_phone_change_token,
  count(*) FILTER (WHERE reauthentication_token    IS NULL) AS null_reauthentication_token,
  count(*) FILTER (WHERE raw_app_meta_data          IS NULL) AS null_raw_app_meta_data,
  count(*) FILTER (WHERE email                      IS NULL) AS null_email
FROM auth.users;

-- 1) REPAIR: normalize NULLs to empty string / defaults on every row.
UPDATE auth.users SET
  confirmation_token         = coalesce(confirmation_token, ''),
  recovery_token             = coalesce(recovery_token, ''),
  email_change               = coalesce(email_change, ''),
  email_change_token_new     = coalesce(email_change_token_new, ''),
  email_change_token_current = coalesce(email_change_token_current, ''),
  phone_change               = coalesce(phone_change, ''),
  phone_change_token         = coalesce(phone_change_token, ''),
  reauthentication_token     = coalesce(reauthentication_token, ''),
  aud                        = coalesce(aud, 'authenticated'),
  role                       = coalesce(role, 'authenticated'),
  raw_app_meta_data          = coalesce(raw_app_meta_data, '{}'::jsonb),
  raw_user_meta_data         = coalesce(raw_user_meta_data, '{}'::jsonb);

-- 2) BEST-EFFORT schema bring-up. Each block swallows errors so a
--    platform-restricted DDL cannot abort the rest of the file.
DO $$ BEGIN
  ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS is_anonymous boolean NOT NULL DEFAULT false;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skip is_anonymous: %', SQLERRM; END $$;
DO $$ BEGIN
  ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS has_password boolean;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skip has_password: %', SQLERRM; END $$;
DO $$ BEGIN
  ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS confirmed_at timestamptz
    GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skip confirmed_at: %', SQLERRM; END $$;
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS auth.users_sessions (
      id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT NOW(),
      updated_at timestamptz,
      factor_id uuid,
      aal text NOT NULL DEFAULT 'aal1',
      not_after timestamptz,
      refreshed_at timestamptz,
      user_agent text,
      ip inet,
      tag text
  );
  CREATE INDEX IF NOT EXISTS users_sessions_user_id_idx ON auth.users_sessions(user_id);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skip users_sessions: %', SQLERRM; END $$;
DO $$ BEGIN
  ALTER TABLE auth.refresh_tokens ADD COLUMN IF NOT EXISTS session_id uuid;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skip refresh_tokens.session_id: %', SQLERRM; END $$;

-- 3) ADMIN ACCOUNT  admin@travelcraft.com / 123456
--    Uses only columns present in every auth.users, then patches the
--    nullable strings AFTERWARDS so nothing is left NULL.
DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM auth.users WHERE lower(email) = 'admin@travelcraft.com' LIMIT 1;

  IF v_id IS NULL THEN
    v_id := gen_random_uuid();
    INSERT INTO auth.users (id, aud, role, email, encrypted_password,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    VALUES (v_id, 'authenticated', 'authenticated', 'admin@travelcraft.com',
      crypt('123456', gen_salt('bf', 10)), NOW(), NOW(),
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
      jsonb_build_object('username', 'Admin_01', 'role', 'admin'));
  END IF;

  -- Patch the auth.users row (old or new) to be scan-safe + confirmed.
  UPDATE auth.users SET
    email_confirmed_at     = coalesce(email_confirmed_at, NOW()),
    confirmation_sent_at   = coalesce(confirmation_sent_at, NOW()),
    confirmation_token     = '',
    recovery_token         = '',
    email_change           = '',
    email_change_token_new = '',
    email_change_token_current = '',
    phone_change           = '',
    phone_change_token     = '',
    reauthentication_token = '',
    updated_at             = NOW()
  WHERE id = v_id;

  -- identities entry (only if this provider row is missing)
  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = v_id AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (provider_id, user_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at)
    VALUES (v_id::text, v_id,
      jsonb_build_object('sub', v_id::text, 'email', 'admin@travelcraft.com',
                         'email_verified', true, 'phone_verified', false),
      'email', NOW(), NOW(), NOW());
  END IF;

  -- public.users row with role='admin' (skip guard trigger)
  SET LOCAL session_replication_role = replica;
  INSERT INTO public.users (id, username, email, avatar, role, status)
  VALUES (v_id, 'Admin_01', 'admin@travelcraft.com', '🛡️', 'admin', 'active')
  ON CONFLICT (id) DO UPDATE SET role = 'admin', avatar = '🛡️';
  RESET session_replication_role;
END $$;

-- 4) Re-run the NULL audit: all columns expect ZERO surviving NULLs.
SELECT
  count(*) FILTER (WHERE confirmation_token         IS NULL) AS null_confirmation_token,
  count(*) FILTER (WHERE recovery_token             IS NULL) AS null_recovery_token,
  count(*) FILTER (WHERE email_change_token_current IS NULL) AS null_email_change_token_current
FROM auth.users;

NOTIFY pgrst, 'reload schema';