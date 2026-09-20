-- ============================================================
-- TravelCraft — FINAL CONSOLIDATED SETUP (run on THIS project)
-- DESTINATION: the Supabase project in .env.local
--              (https://kwphqmvlbltxmlccmexb.supabase.co)
--
-- This project was diagnosed as missing tables that the app needs:
--   global_settings, reports, user_assets  ->  CREATED here
-- Auth service also 500s ("Database error querying schema") on
-- every account operation -> triggers on auth.users are rebuilt
-- with a hardened, exception-safe handler.
--
-- Idempotent: safe to run as many times as you like.
-- STEP ORDER:
--   1) run this whole file
--   2) Dashboard -> Authentication -> Users -> Add user
--      admin@travelcraft.com / 123456  (if not already there)
--   3) run this whole file AGAIN (forces role='admin' on that account)
-- ============================================================

-- ============================================================
-- 1) AUTH REPAIR — rebuild the signup handler + auth trigger
-- ============================================================

-- 1a) Always-swallow handler so no profile write can break auth.
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
      new.raw_user_meta_data->>'user_name',
      'Trainer_' || substr(new.id::text, 1, 6)
    ),
    new.email,
    COALESCE(
      new.raw_user_meta_data->>'avatar',
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture',
      '🏃'
    ),
    COALESCE(new.raw_user_meta_data->>'role', 'player')
  );
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1b) Remove every user-created trigger on auth.users, then install
--     exactly ONE, hardened. (A broken trigger on auth.users is what
--     makes signup/login return "500 Database error querying schema".)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT tgname FROM pg_trigger
    WHERE tgrelid = 'auth.users'::regclass AND NOT tgisinternal
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users', r.tgname);
  END LOOP;
END $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- 2) USERS TABLE — guarantee the columns the app + handler use
-- ============================================================
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================
-- 3) HELPERS (hardened, idempotent)
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
-- 4) MISSING TABLES (idempotent)
-- ============================================================

-- global_settings
CREATE TABLE IF NOT EXISTS public.global_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  max_pins_per_map INT NOT NULL DEFAULT 50,
  auto_approve_community BOOLEAN NOT NULL DEFAULT FALSE,
  maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
  allow_fast_travel BOOLEAN NOT NULL DEFAULT TRUE,
  coin_multiplier NUMERIC NOT NULL DEFAULT 1.5,
  auto_ban_strike_threshold INT NOT NULL DEFAULT 5,
  server_region TEXT NOT NULL DEFAULT 'AP-East (Tokyo)',
  radar_radius_km NUMERIC NOT NULL DEFAULT 25,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.global_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Global settings are viewable by everyone" ON public.global_settings;
DROP POLICY IF EXISTS "Admins can update global settings" ON public.global_settings;
DROP POLICY IF EXISTS "Admins can insert global settings" ON public.global_settings;
CREATE POLICY "Global settings are viewable by everyone"
  ON public.global_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update global settings"
  ON public.global_settings FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can insert global settings"
  ON public.global_settings FOR INSERT WITH CHECK (public.is_admin());

-- reports
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_name TEXT,
  map_id TEXT REFERENCES public.maps(id) ON DELETE SET NULL,
  location_name TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'resolved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_map ON public.reports(map_id);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create their own reports" ON public.reports;
DROP POLICY IF EXISTS "View own reports or admins view all" ON public.reports;
DROP POLICY IF EXISTS "Admins can update reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can delete reports" ON public.reports;
CREATE POLICY "Users can create their own reports"
  ON public.reports FOR INSERT WITH CHECK (auth.uid()::text = reporter_id::text);
CREATE POLICY "View own reports or admins view all"
  ON public.reports FOR SELECT USING (auth.uid()::text = reporter_id::text OR public.is_admin());
CREATE POLICY "Admins can update reports"
  ON public.reports FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete reports"
  ON public.reports FOR DELETE USING (public.is_admin());

-- user_assets
CREATE TABLE IF NOT EXISTS public.user_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('element', 'background')),
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_assets_user ON public.user_assets(user_id, asset_type);

ALTER TABLE public.user_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own assets" ON public.user_assets;
DROP POLICY IF EXISTS "Users can insert their own assets" ON public.user_assets;
DROP POLICY IF EXISTS "Users can delete their own assets" ON public.user_assets;
CREATE POLICY "Users can view their own assets"
    ON public.user_assets FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert their own assets"
    ON public.user_assets FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can delete their own assets"
    ON public.user_assets FOR DELETE USING (auth.uid()::text = user_id::text);

-- ============================================================
-- 5) MAPS — columns + summary backfill
-- ============================================================
ALTER TABLE public.maps ADD COLUMN IF NOT EXISTS summary JSONB;
ALTER TABLE public.maps ADD COLUMN IF NOT EXISTS is_base_map BOOLEAN NOT NULL DEFAULT FALSE;

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
-- 6) RLS POLICY REPAIR — drop ALL policies on maps / reports /
--    user_assets, then recreate with text-safe casts
-- ============================================================
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT p.polname AS name, c.relname AS tbl
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname IN ('maps', 'reports', 'user_assets')
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

CREATE POLICY "reports_insert" ON public.reports FOR INSERT
    WITH CHECK (auth.uid()::text = reporter_id::text);
CREATE POLICY "reports_select" ON public.reports FOR SELECT
    USING (auth.uid()::text = reporter_id::text OR public.is_admin());
CREATE POLICY "reports_update" ON public.reports FOR UPDATE
    USING (auth.uid()::text = reporter_id::text OR public.is_admin());
CREATE POLICY "reports_delete" ON public.reports FOR DELETE
    USING (public.is_admin());

CREATE POLICY "user_assets_select" ON public.user_assets FOR SELECT
    USING (auth.uid()::text = user_id::text);
CREATE POLICY "user_assets_insert" ON public.user_assets FOR INSERT
    WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "user_assets_delete" ON public.user_assets FOR DELETE
    USING (auth.uid()::text = user_id::text);

-- users + admins RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update any user" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can update any user" ON public.users;
CREATE POLICY "Users can view their own profiles"
    ON public.users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Admins can view all users"
    ON public.users FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update any user"
    ON public.users FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- 7) STORAGE — map owners/admins may update & delete map assets
-- ============================================================
DROP POLICY IF EXISTS "Map owners and admins can update map assets" ON storage.objects;
DROP POLICY IF EXISTS "Map owners and admins can delete map assets" ON storage.objects;
DROP POLICY IF EXISTS "Map owners and admins can update map assets" ON storage.objects;
DROP POLICY IF EXISTS "Map owners and admins can delete map assets" ON storage.objects;
CREATE POLICY "Map owners and admins can update map assets"
    ON storage.objects FOR UPDATE USING (
        bucket_id = 'media'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = 'maps'
        AND (auth.uid()::text = owner_id::text OR public.is_admin())
    );
CREATE POLICY "Map owners and admins can delete map assets"
    ON storage.objects FOR DELETE USING (
        bucket_id = 'media'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = 'maps'
        AND (auth.uid()::text = owner_id::text OR public.is_admin())
    );

-- ============================================================
-- 8) ADMIN RECONCILIATION — make admin@travelcraft.com resolve
--    to a public.users row with role='admin' (runs after you
--    create the auth account in the Dashboard, if needed)
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

-- ============================================================
-- 9) Reload PostgREST schema cache
-- ============================================================
NOTIFY pgrst, 'reload schema';