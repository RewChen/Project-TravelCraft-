-- =========================================
-- PUBLIC.USERS (Profiles for Users)
-- =========================================
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    avatar TEXT,
    role TEXT NOT NULL DEFAULT 'player',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- PUBLIC.ADMINS (Profiles for Admins)
-- =========================================
CREATE TABLE public.admins (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'admin',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: Passwords, failed_login_attempts, locked_until, and last_login_at 
-- are managed natively by Supabase internally inside the auth.users table.

-- =========================================
-- INDEXES
-- =========================================
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_admins_email ON public.admins(email);

-- =========================================
-- SECURITY (Row Level Security)
-- =========================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read user profiles
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.users FOR SELECT USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE USING (auth.uid() = id);

-- =========================================
-- TRIGGER: Auto-create public.users profile on auth signup
-- Supports email/password + OAuth (Google, Facebook)
-- OAuth providers supply: full_name/name, avatar_url/picture
-- =========================================
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =========================================
-- PUBLIC.MAPS (Map Editor autosave + community maps)
-- =========================================
CREATE TABLE public.maps (
    id TEXT PRIMARY KEY,
    owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL DEFAULT 'UNTITLED MAP',
    privacy TEXT NOT NULL DEFAULT 'private',
    is_editor_map BOOLEAN NOT NULL DEFAULT FALSE,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_maps_owner ON public.maps(owner_id);
CREATE INDEX idx_maps_updated ON public.maps(updated_at DESC);

ALTER TABLE public.maps ENABLE ROW LEVEL SECURITY;

-- Public maps are viewable by everyone; private drafts only by their owner.
CREATE POLICY "Maps are viewable by everyone"
    ON public.maps FOR SELECT USING (privacy = 'public' OR auth.uid() = owner_id);

-- Only the authenticated owner may insert their own maps.
CREATE POLICY "Owners can insert their maps"
    ON public.maps FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Only the authenticated owner may update their own maps.
CREATE POLICY "Owners can update their own maps"
    ON public.maps FOR UPDATE USING (auth.uid() = owner_id);

-- Only the authenticated owner may delete their own maps.
CREATE POLICY "Owners can delete their own maps"
    ON public.maps FOR DELETE USING (auth.uid() = owner_id);

-- =========================================
-- STORAGE BUCKET: MEDIA (unified, folder per map)
-- Bucket name: media
-- Folder structure: maps/<mapId>/cover | pins | video
-- Create the bucket (idempotent), then the storage policies below.
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;
-- =========================================
CREATE POLICY "Media files are publicly viewable"
    ON storage.objects FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "Authenticated users can upload media"
    ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

CREATE POLICY "Owners can update their media"
    ON storage.objects FOR UPDATE USING (bucket_id = 'media' AND auth.uid() = owner_id);

CREATE POLICY "Owners can delete their media"
    ON storage.objects FOR DELETE USING (bucket_id = 'media' AND auth.uid() = owner_id);
