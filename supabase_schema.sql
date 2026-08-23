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
-- =========================================
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, username, email, avatar, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', 'Trainer_' || substr(new.id::text, 1, 6)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'avatar', '🏃'),
    COALESCE(new.raw_user_meta_data->>'role', 'player')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
