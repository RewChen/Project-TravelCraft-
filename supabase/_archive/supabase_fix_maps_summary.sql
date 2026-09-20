-- ============================================================
-- TravelCraft — ONE-FILE FIX (maps sync + admin login + RLS)
-- Idempotent — safe to re-run as many times as you like.
-- Paste the WHOLE file into Supabase -> SQL Editor -> Run.
--
--  PART A  ADMIN & AUTH ..... is_admin, users RLS, role guards,
--                             signup trigger, backfill, my_access RPC
--  PART B  MAPS SCHEMA ...... maps.summary / maps.is_base_map + backfill
--  PART C  SECURITY POLICIES  repair poisoned (uuid=text) RLS
--                             policies on maps / user_assets / reports
--  PART D  STORAGE .......... map asset update/delete policies
--  PART E  RELOAD ........... PostgREST schema cache
-- ============================================================

-- ============================================================
-- PART A — ADMIN & AUTH
-- ============================================================

-- A1) is_admin(): server-side admin check (bypasses RLS).
--     - users.role is the canonical flag
--     - id::text on both sides works whether id is uuid or text
--     - email fallback covers rows seeded with a non-matching id
--     - admins table shape differences never raise (an exception
--       inside an RLS policy breaks EVERY users query with
--       "Database error querying schema").
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.users u
    WHERE (u.id::text = auth.uid()::text
           OR lower(u.email) = (SELECT lower(email) FROM auth.users WHERE id = auth.uid()))
      AND lower(coalesce(u.role, '')) = 'admin'
  ) THEN
    RETURN true;
  END IF;
  BEGIN
    RETURN EXISTS (
      SELECT 1 FROM public.admins
      WHERE id::text = auth.uid()::text AND is_active = true
    );
  EXCEPTION WHEN OTHERS THEN
    RETURN false;
  END;
END;
$$;

-- A2) USERS RLS: stop leaking every user (incl. emails).
--     Everyone sees their own row; admins see/update all.
-- ============================================================
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update any user" ON public.users;

CREATE POLICY "Users can view their own profiles"
    ON public.users FOR SELECT
    USING (auth.uid()::text = id::text);

CREATE POLICY "Admins can view all users"
    ON public.users FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can update any user"
    ON public.users FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- A3) Block direct role escalation by non-admins.
--     Role changes only via an admin or the update_own_role RPC.
-- ============================================================
CREATE OR REPLACE FUNCTION public.guard_role_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT public.is_admin() AND NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Role changes require admin approval or the update_own_role API';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_self_role_change ON public.users;
CREATE TRIGGER prevent_self_role_change
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE PROCEDURE public.guard_role_change();

-- A4) RPC: safe own-role change (whitelist of non-admin roles).
--     SECURITY DEFINER -> bypasses RLS but only sets whitelisted roles.
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_own_role(p_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  allowed text[] := ARRAY[
    'novice traveler', 'cartographer', 'gym leader',
    'game master', 'member', 'novice', 'player'
  ];
BEGIN
  IF lower(coalesce(p_role, '')) = ANY(allowed) THEN
    UPDATE public.users SET role = p_role WHERE id::text = auth.uid()::text;
  ELSE
    RAISE EXCEPTION 'Role not allowed for self-assignment';
  END IF;
END;
$$;

-- A5) Signup trigger: auto-create a public.users row on every auth signup.
--     Never lets a profile-write failure break auth signups.
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, username, email, avatar, role)
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'username',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      'Trainer_' || substr(new.id::text, 1, 6)
    ),
    new.email,
    COALESCE(new.raw_user_meta_data->>'avatar', '🏃'),
    COALESCE(new.raw_user_meta_data->>'role', 'player')
  );
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- A6) Backfill the admin account:
--     (1) make sure a users row exists for admin@travelcraft.com
--         (works whether users.id is uuid or text)
--     (2) force role='admin' — runs with triggers disabled so the
--         guard_role_change trigger above can't stop it.
-- ============================================================
DO $$
BEGIN
  INSERT INTO public.users (id, username, email, avatar, role)
  SELECT id::text, COALESCE(raw_user_meta_data->>'username', 'Admin_01'), email, '🛡️', 'admin'
  FROM auth.users
  WHERE lower(email) = 'admin@travelcraft.com'
  ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  SET LOCAL session_replication_role = replica; -- skip guard_role_change
  UPDATE public.users
  SET role = 'admin', avatar = COALESCE(avatar, '🛡️')
  WHERE lower(email) = 'admin@travelcraft.com';
  RESET session_replication_role;
EXCEPTION WHEN OTHERS THEN
  RESET session_replication_role;
  NULL;
END $$;

-- A7) my_access(): authoritative profile + admin lookup for the app.
--     Works no matter where the admin flag lives (admins OR users.role),
--     and regardless of id column type (id::text + email fallback).
-- ============================================================
CREATE OR REPLACE FUNCTION public.my_access()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  BEGIN
    IF EXISTS (
      SELECT 1 FROM public.admins
      WHERE id::text = auth.uid()::text AND is_active = true
    ) THEN
      SELECT jsonb_build_object(
        'is_admin', true,
        'username', COALESCE(username, 'Admin_01'),
        'email', COALESCE(email, ''),
        'avatar', COALESCE(avatar, '🛡️'),
        'role', 'Admin'
      )
      INTO result
      FROM public.admins
      WHERE id::text = auth.uid()::text AND is_active = true;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    result := NULL;
  END;

  IF result IS NULL THEN
    SELECT jsonb_build_object(
      'is_admin', (lower(coalesce(role, '')) = 'admin'),
      'username', username,
      'email', COALESCE(email, ''),
      'avatar', COALESCE(avatar, '🏃'),
      'role', role
    )
    INTO result
    FROM public.users u
    WHERE u.id::text = auth.uid()::text
       OR lower(u.email) = (SELECT lower(email) FROM auth.users WHERE id = auth.uid())
    LIMIT 1;
  END IF;

  IF result IS NULL THEN
    result := jsonb_build_object(
      'is_admin', false,
      'username', 'Traveler',
      'email', '',
      'avatar', '🏃',
      'role', 'Cartographer'
    );
  END IF;

  RETURN result;
END;
$$;

-- ============================================================
-- PART B — MAPS SCHEMA
-- (summary is REQUIRED — the "MAP SYNC ERROR: Could not find the
--  'summary' column" comes from a maps table created without it.)
-- ============================================================
ALTER TABLE public.maps ADD COLUMN IF NOT EXISTS summary JSONB;
ALTER TABLE public.maps ADD COLUMN IF NOT EXISTS is_base_map BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill summary for maps that already exist.
UPDATE public.maps
SET summary = jsonb_build_object(
    'title', COALESCE(data->>'title', title),
    'imageUrl', data->>'imageUrl',
    'pinCount', CASE
        WHEN jsonb_typeof(data->'pins') = 'array' THEN jsonb_array_length(data->'pins')
        WHEN jsonb_typeof(data->'editorState'->'elements') = 'array' THEN jsonb_array_length(data->'editorState'->'elements')
        ELSE 0
    END,
    'lore', data->'details'->>'lore',
    'region', data->'details'->>'region',
    'category', data->>'category',
    'rarity', data->>'rarity',
    'tags', COALESCE(data->'tags', '[]'::jsonb),
    'discoveredBy', data->>'discoveredBy',
    'authorBadgeColor', data->>'authorBadgeColor',
    'authorRole', data->>'authorRole',
    'previewBackground', data->'previewBackground',
    'details', jsonb_build_object(
        'title', data->'details'->>'title',
        'region', data->'details'->>'region',
        'type', data->'details'->>'type',
        'tag', data->'details'->>'tag',
        'lore', data->'details'->>'lore',
        'hours', data->'details'->>'hours',
        'fee', data->'details'->>'fee',
        'bestTime', data->'details'->>'bestTime',
        'travel', data->'details'->>'travel',
        'popularity', data->'details'->>'popularity',
        'visitors', data->'details'->>'visitors',
        'rarity', data->'details'->>'rarity'
    )
)
WHERE summary IS NULL;

-- ============================================================
-- PART C — SECURITY: REPAIR POISONED RLS POLICIES
-- Older setup files created policies on maps / user_assets / reports
-- with `auth.uid() = owner_id` (etc). If owner_id / user_id /
-- reporter_id is TEXT in this DB, EVERY query on those tables fails
-- with:  "operator does not exist: uuid = text" (error 42883).
-- Drop ALL policies on those tables, then recreate with ::text casts.
-- ============================================================
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT p.polname AS name, c.relname AS tbl
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname IN ('maps', 'user_assets', 'reports')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', r.name, r.tbl);
  END LOOP;
END $$;

CREATE POLICY "map_select" ON public.maps FOR SELECT
    USING (privacy = 'public' OR auth.uid()::text = owner_id::text OR public.is_admin());
CREATE POLICY "map_insert" ON public.maps FOR INSERT
    WITH CHECK (auth.uid()::text = owner_id::text OR public.is_admin());
CREATE POLICY "map_update" ON public.maps FOR UPDATE
    USING (auth.uid()::text = owner_id::text OR public.is_admin());
CREATE POLICY "map_delete" ON public.maps FOR DELETE
    USING (auth.uid()::text = owner_id::text OR public.is_admin());

DO $$
BEGIN
  IF to_regclass('public.user_assets') IS NOT NULL THEN
    EXECUTE 'CREATE POLICY "user_assets_select" ON public.user_assets FOR SELECT USING (auth.uid()::text = user_id::text)';
    EXECUTE 'CREATE POLICY "user_assets_insert" ON public.user_assets FOR INSERT WITH CHECK (auth.uid()::text = user_id::text)';
    EXECUTE 'CREATE POLICY "user_assets_delete" ON public.user_assets FOR DELETE USING (auth.uid()::text = user_id::text)';
  END IF;
  IF to_regclass('public.reports') IS NOT NULL THEN
    EXECUTE 'CREATE POLICY "reports_select" ON public.reports FOR SELECT USING (auth.uid()::text = reporter_id::text OR public.is_admin())';
    EXECUTE 'CREATE POLICY "reports_insert" ON public.reports FOR INSERT WITH CHECK (auth.uid()::text = reporter_id::text)';
    EXECUTE 'CREATE POLICY "reports_update" ON public.reports FOR UPDATE USING (auth.uid()::text = reporter_id::text OR public.is_admin())';
  END IF;
END $$;

-- ============================================================
-- PART D — STORAGE: map owners / admins may update & delete their
-- map assets under maps/<mapId>/ (fixes deleteMapAssets silently
-- failing because only users/<uid>/ was deletable).
-- ============================================================
DROP POLICY IF EXISTS "Map owners and admins can update map assets" ON storage.objects;
CREATE POLICY "Map owners and admins can update map assets"
    ON storage.objects FOR UPDATE USING (
        bucket_id = 'media'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = 'maps'
        AND (auth.uid()::text = owner_id::text OR public.is_admin())
    );

DROP POLICY IF EXISTS "Map owners and admins can delete map assets" ON storage.objects;
CREATE POLICY "Map owners and admins can delete map assets"
    ON storage.objects FOR DELETE USING (
        bucket_id = 'media'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = 'maps'
        AND (auth.uid()::text = owner_id::text OR public.is_admin())
    );

-- ============================================================
-- PART E — Reload PostgREST schema cache so new columns/functions
-- are visible to the API immediately.
-- ============================================================
NOTIFY pgrst, 'reload schema';