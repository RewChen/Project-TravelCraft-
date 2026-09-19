-- ============================================================
-- TravelCraft — supabase_setup.sql  (THE ONE file to run)
-- ------------------------------------------------------------
-- Root-cause fixes bundled (everything is idempotent):
--   • uuue=text policy poison (error 42883)  -> ALL policies use ::text
--   • broken auth triggers / missing functions  -> rebuilt hardened
--   • missing tables global_settings/reports/user_assets -> created
--   • missing storage bucket + policies       -> media bucket + rules
--   • admin account bootstrap                 -> reconciled to role='admin'
--
-- Run: paste the WHOLE file into Supabase SQL Editor -> Run.
--   On a brand-new project:  run once -> add the admin user in
--   Dashboard (Authentication -> Users) -> run again -> done.
-- ============================================================

-- ============================================================
-- PART 1 — TABLES (created only if missing; safe everywhere)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    avatar TEXT,
    role TEXT NOT NULL DEFAULT 'player',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'admin',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.maps (
    id TEXT PRIMARY KEY,
    owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL DEFAULT 'UNTITLED MAP',
    privacy TEXT NOT NULL DEFAULT 'private',
    is_editor_map BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    data JSONB DEFAULT '{}'::jsonb,
    summary JSONB,
    is_base_map BOOLEAN NOT NULL DEFAULT FALSE
);

-- Base maps live in their OWN table, fully separate from community maps.
-- The are created/edited/deleted only through MANAGE BASE MAPS and are never
-- part of the Community Discoveries feed.
CREATE TABLE IF NOT EXISTS public.base_maps (
    id TEXT PRIMARY KEY,
    owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL DEFAULT 'UNTITLED BASE MAP',
    privacy TEXT NOT NULL DEFAULT 'public',
    is_editor_map BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    data JSONB DEFAULT '{}'::jsonb,
    summary JSONB
);

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

CREATE TABLE IF NOT EXISTS public.user_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('element', 'background')),
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes (idempotent)
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_admins_email ON public.admins(email);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_map ON public.reports(map_id);
CREATE INDEX IF NOT EXISTS idx_user_assets_user ON public.user_assets(user_id, asset_type);
CREATE INDEX IF NOT EXISTS idx_base_maps_created ON public.base_maps(created_at DESC);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.base_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_assets ENABLE ROW LEVEL SECURITY;

-- Guarantee the columns on pre-existing (partially-built) tables.
ALTER TABLE public.users        ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.users        ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.users        ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE public.users        ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE public.users        ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE public.users        ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.admins       ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.admins       ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.admins       ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE public.admins       ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.maps         ADD COLUMN IF NOT EXISTS is_editor_map BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.maps         ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.maps         ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.maps         ADD COLUMN IF NOT EXISTS summary JSONB;
ALTER TABLE public.maps         ADD COLUMN IF NOT EXISTS is_base_map BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================================
-- PART 2 — FUNCTIONS (hardened, SECURITY DEFINER, idempotent)
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

-- Never lets a profile write break auth signups / logins.
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
-- PART 3 — TRIGGERS
-- ============================================================

-- Remove every user-created trigger on auth.users (a broken one is what
-- makes signup/login return "500 Database error querying schema"), then
-- install exactly ONE, hardened.
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

DROP TRIGGER IF EXISTS prevent_self_role_change ON public.users;
CREATE TRIGGER prevent_self_role_change
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE PROCEDURE public.guard_role_change();

-- ============================================================
-- PART 4 — STORAGE (media bucket + policies)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Reset ONLY the policies that target the media bucket, so other buckets
-- the project may have are left untouched.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT p.polname AS name, pg_get_expr(p.polqual, p.polrelid) AS qual,
           pg_get_expr(p.polwithcheck, p.polrelid) AS wc
    FROM pg_policy p
    WHERE p.polrelid = 'storage.objects'::regclass
      AND (pg_get_expr(p.polqual, p.polrelid) ILIKE '%media%'
           OR pg_get_expr(p.polwithcheck, p.polrelid) ILIKE '%media%')
  LOOP
    EXECUTE format('DROP POLICY %I ON storage.objects', r.name);
  END LOOP;
END $$;

CREATE POLICY "Media files are publicly accessible"
    ON storage.objects FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "Authenticated users can upload media"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own media folders"
    ON storage.objects FOR UPDATE USING (
        bucket_id = 'media'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = 'users'
        AND (storage.foldername(name))[2] = auth.uid()::text
    );

CREATE POLICY "Users can delete their own media folders"
    ON storage.objects FOR DELETE USING (
        bucket_id = 'media'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = 'users'
        AND (storage.foldername(name))[2] = auth.uid()::text
    );

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
-- PART 5 — RLS POLICIES (reset + recreate, all text-safe)
-- ============================================================
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT p.polname AS name, c.relname AS tbl
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname IN ('users', 'admins', 'maps', 'base_maps', 'global_settings', 'reports', 'user_assets')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', r.name, r.tbl);
  END LOOP;
END $$;

CREATE POLICY "Users can view their own profiles"
    ON public.users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Admins can view all users"
    ON public.users FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update any user"
    ON public.users FOR UPDATE USING (public.is_admin());
CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid()::text = id::text)
    WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Admins can view all" ON public.admins FOR SELECT USING (public.is_admin());

CREATE POLICY "map_select" ON public.maps FOR SELECT
    USING (privacy = 'public' OR auth.uid()::text = owner_id::text OR public.is_admin());
CREATE POLICY "map_insert" ON public.maps FOR INSERT
    WITH CHECK (auth.uid()::text = owner_id::text OR public.is_admin());
CREATE POLICY "map_update" ON public.maps FOR UPDATE
    USING (auth.uid()::text = owner_id::text OR public.is_admin());
CREATE POLICY "map_delete" ON public.maps FOR DELETE
    USING (auth.uid()::text = owner_id::text OR public.is_admin());

-- Base maps: everyone may view them, only admins may modify them.
CREATE POLICY "base_maps_select" ON public.base_maps FOR SELECT USING (true);
CREATE POLICY "base_maps_insert" ON public.base_maps FOR INSERT
    WITH CHECK (public.is_admin());
CREATE POLICY "base_maps_update" ON public.base_maps FOR UPDATE
    USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "base_maps_delete" ON public.base_maps FOR DELETE
    USING (public.is_admin());

CREATE POLICY "Global settings are viewable by everyone"
    ON public.global_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update global settings"
    ON public.global_settings FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can insert global settings"
    ON public.global_settings FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Users can create their own reports"
    ON public.reports FOR INSERT WITH CHECK (auth.uid()::text = reporter_id::text);
CREATE POLICY "View own reports or admins view all"
    ON public.reports FOR SELECT USING (auth.uid()::text = reporter_id::text OR public.is_admin());
CREATE POLICY "Admins can update reports"
    ON public.reports FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete reports"
    ON public.reports FOR DELETE USING (public.is_admin());

CREATE POLICY "Users can view their own assets"
    ON public.user_assets FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert their own assets"
    ON public.user_assets FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can delete their own assets"
    ON public.user_assets FOR DELETE USING (auth.uid()::text = user_id::text);

-- ============================================================
-- PART 6 — SEED & ADMIN RECONCILIATION
-- ============================================================

INSERT INTO public.global_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Migrate legacy base maps out of the shared maps table into base_maps.
-- Keeps rows the admin *promoted* from a real community map (is_editor_map=true,
-- those stay public community content) and removes the base-map-only rows that
-- were previously written straight into maps (is_editor_map=false).
INSERT INTO public.base_maps (id, owner_id, title, privacy, is_editor_map, created_at, updated_at, data, summary)
SELECT id, owner_id, title, privacy, is_editor_map, created_at, updated_at, data, summary
FROM public.maps
WHERE is_base_map = true
ON CONFLICT (id) DO NOTHING;

DELETE FROM public.maps
WHERE is_base_map = true AND is_editor_map = false;

-- Populate maps.summary for rows that predate the column.
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
    'rarityColor', data->>'rarityColor',
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

-- Make admin@travelcraft.com resolve to a users row with role='admin'.
-- Runs after you add the account in Dashboard Authentication -> Users.
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
-- PART 6b — MAP VIEWS (Location Stats: view count -> rarity)
-- ============================================================
-- Views live in their OWN table: RLS on `maps` only lets the owner write their
-- own row, so a visitor could never increment a counter on someone else's map.
-- map_id is a loose TEXT with no FK on purpose — we count community maps,
-- base maps and editor drafts whose ids live in different tables.

CREATE TABLE IF NOT EXISTS public.map_views (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    map_id TEXT NOT NULL,
    viewer_id UUID DEFAULT auth.uid(),
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_map_views_map ON public.map_views (map_id, viewed_at DESC);

ALTER TABLE public.map_views ENABLE ROW LEVEL SECURITY;

-- Drop first so re-running this whole file stays idempotent.
DROP POLICY IF EXISTS "map_views_insert_own" ON public.map_views;
DROP POLICY IF EXISTS "map_views_select" ON public.map_views;
-- Signed-in users only: viewer_id defaults to auth.uid(), so the check passes.
CREATE POLICY "map_views_insert_own" ON public.map_views FOR INSERT
    WITH CHECK (auth.uid()::text = viewer_id::text);
-- Everyone (incl. guests) may read view totals.
CREATE POLICY "map_views_select" ON public.map_views FOR SELECT USING (true);

-- Aggregate counts server-side so the client hydrates every location's total
-- in one call instead of pulling one row per visit.
CREATE OR REPLACE FUNCTION public.map_view_counts()
RETURNS TABLE(map_id TEXT, views BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT v.map_id, COUNT(*)::bigint AS views
    FROM public.map_views v
    GROUP BY v.map_id;
$$;

GRANT SELECT, INSERT ON public.map_views TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.map_view_counts() TO anon, authenticated;
DO $$
BEGIN
    EXECUTE 'GRANT USAGE, SELECT ON SEQUENCE public.map_views_id_seq TO anon, authenticated';
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- ============================================================
-- PART 6c — REALTIME PUBLICATION (Postgres Changes)
-- ============================================================
-- Supabase streams `postgres_changes` ONLY for tables listed in the
-- `supabase_realtime` publication. Without this, `src/context/AppContext.jsx`
-- live-sync channels (maps / users / reviews / reports) subscribe fine but
-- NEVER receive an event — the DB write succeeds, everyone reloads and sees
-- the row, yet nothing pushes in realtime and no error is raised anywhere.
-- Idempotent: skips tables that are already members so re-running is safe.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['maps','users','reviews','reports']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- PART 7 — Reload PostgREST schema cache
-- ============================================================
NOTIFY pgrst, 'reload schema';