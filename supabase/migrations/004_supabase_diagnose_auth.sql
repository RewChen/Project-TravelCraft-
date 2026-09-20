-- TravelCraft — DIAGNOSE (read-only). Run all statements.
-- Statement 1 = the one that matters most, paste everything.

-- 1) Does the Supabase-managed migration table exist? (NULL = this DB
--    was NOT set up by Supabase migrations -> baseline is compromised)
SELECT to_regclass('supabase_migrations.schema_migrations') AS supabase_migrations_table;

-- 2) Which auth.* tables are missing? (NULL = missing)
SELECT
  to_regclass('auth.users')             AS auth_users,
  to_regclass('auth.identities')        AS auth_identities,
  to_regclass('auth.refresh_tokens')    AS auth_refresh_tokens,
  to_regclass('auth.users_sessions')    AS auth_users_sessions,
  to_regclass('auth.instances')         AS auth_instances,
  to_regclass('auth.mfa_factors')       AS auth_mfa_factors,
  to_regclass('auth.sso_providers')     AS auth_sso_providers,
  to_regclass('auth.audit_log_entries') AS auth_audit_log_entries;

-- 3) auth.users columns (if this list is short or missing standard
--    columns, auth.users is an incomplete copy and GoTrue will 500)
SELECT string_agg(column_name, ', ' ORDER BY ordinal_position) AS auth_users_columns
FROM information_schema.columns
WHERE table_schema = 'auth' AND table_name = 'users';

-- 4) auth.users row count
SELECT count(*) AS auth_users_row_count FROM auth.users;

-- 5) Triggers on auth.users (tgenabled = O means disabled)
SELECT tgname, tgenabled FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass AND NOT tgisinternal;

-- 6) Policies placed on auth.users (normally NONE)
SELECT string_agg(polname, ', ' ORDER BY polname) AS auth_users_policies
FROM pg_policy WHERE polrelid = 'auth.users'::regclass;

-- 7) The lookups GoTrue performs at signup/login:
SELECT id, email, role, is_sso_user, is_anonymous
FROM auth.users WHERE lower(email) = 'admin@travelcraft.com' LIMIT 1;

-- 8) Are the auth helper functions GoTrue + RLS rely on intact?
-- (1 = present, 0 = missing; fixed: use pronamespace, not oid)
SELECT
  (SELECT count(*) FROM pg_proc WHERE proname = 'uid'  AND pronamespace = 'auth'::regnamespace AND pronargs = 0) AS auth_uid_fn,
  (SELECT count(*) FROM pg_proc WHERE proname = 'role' AND pronamespace = 'auth'::regnamespace AND pronargs = 0) AS auth_role_fn,
  (SELECT count(*) FROM pg_proc WHERE proname = 'jwt'  AND pronamespace = 'auth'::regnamespace AND pronargs = 0) AS auth_jwt_fn;