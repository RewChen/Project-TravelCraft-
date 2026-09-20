-- =========================================
-- HELPER: is_admin()
-- Returns true when the current Supabase Auth user
-- is an active admin (admins table) OR has role 'admin' in users.
-- =========================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins
    WHERE id = auth.uid() AND is_active = true
  ) OR EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- =========================================
-- PUBLIC.GLOBAL_SETTINGS (single-row config)
-- =========================================
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

-- Seed the singleton row (idempotent)
INSERT INTO public.global_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Global settings are viewable by everyone"
  ON public.global_settings FOR SELECT USING (true);

CREATE POLICY "Admins can update global settings"
  ON public.global_settings FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can insert global settings"
  ON public.global_settings FOR INSERT
  WITH CHECK (public.is_admin());

-- =========================================
-- PUBLIC.REPORTS (user-submitted location reports)
-- =========================================
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

CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_reports_map ON public.reports(map_id);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own reports"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "View own reports or admins view all"
  ON public.reports FOR SELECT
  USING (auth.uid() = reporter_id OR public.is_admin());

CREATE POLICY "Admins can update reports"
  ON public.reports FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete reports"
  ON public.reports FOR DELETE
  USING (public.is_admin());

-- =========================================
-- MAPS: add is_base_map flag
-- =========================================
ALTER TABLE public.maps
  ADD COLUMN IF NOT EXISTS is_base_map BOOLEAN NOT NULL DEFAULT FALSE;

-- Admin-only policies for base map management (appends to existing owner policies)
CREATE POLICY "Admins can view all maps"
  ON public.maps FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update any map"
  ON public.maps FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =========================================
-- USERS RLS HARDENING (profiles/emails no longer public)
-- =========================================
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;

CREATE POLICY "Users can view their own profiles"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update any user"
  ON public.users FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Block direct self role changes (privilege escalation) unless admin.
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

-- Safe own-role change restricted to non-admin roles.
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
    UPDATE public.users SET role = p_role WHERE id = auth.uid();
  ELSE
    RAISE EXCEPTION 'Role not allowed for self-assignment';
  END IF;
END;
$$;

-- =========================================
-- STORAGE: map owners / admins may manage maps/<mapId>/ assets
-- =========================================
CREATE POLICY "Map owners and admins can update map assets"
    ON storage.objects FOR UPDATE USING (
        bucket_id = 'media'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = 'maps'
        AND (auth.uid() = owner_id OR public.is_admin())
    );

CREATE POLICY "Map owners and admins can delete map assets"
    ON storage.objects FOR DELETE USING (
        bucket_id = 'media'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = 'maps'
        AND (auth.uid() = owner_id OR public.is_admin())
    );

NOTIFY pgrst, 'reload schema';
