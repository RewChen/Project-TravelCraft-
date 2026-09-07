# OAuth Setup — Google & Facebook Login

This project now supports **Google** and **Facebook** OAuth via Supabase Auth (`supabase.auth.signInWithOAuth`).

## 1. Code Overview

- **Component:** `src/components/auth/SocialAuthButtons.jsx` (lines 1-90) — shows Google + Facebook buttons, calls `supabase.auth.signInWithOAuth({ provider: 'google'|'facebook', options: { redirectTo: window.location.origin } })`.
- **Login:** `src/components/auth/LoginForm.jsx:7` — imports `SocialAuthButtons` and renders above email/password form.
- **Register:** `src/components/auth/RegisterForm.jsx:7` — same.
- **Context helpers:** `src/context/AppContext.jsx` — `signInWithOAuth`, `signInWithGoogle`, `signInWithFacebook` and `createFallbackProfile` updated to read `full_name`/`avatar_url`/`picture` from OAuth metadata.
- **DB Trigger:** `supabase_schema.sql:50-78` — `handle_new_user()` now coalesces `username` from `username | full_name | name | user_name` and `avatar` from `avatar | avatar_url | picture`.

Flow: OAuth redirect → Supabase creates `auth.users` → trigger inserts `public.users` → `AppContext` `onAuthStateChange` hydrates `userProfile` and redirects to `home`.

---

## 2. Supabase Dashboard Configuration

### Google

1. Go to **Google Cloud Console** → APIs & Services → Credentials → Create OAuth 2.0 Client ID.
   - Application type: **Web application**
   - Authorized redirect URI: `https://<PROJECT_REF>.supabase.co/auth/v1/callback` (find in Supabase → Authentication → Providers → Google).
   - Authorized JavaScript origin: your app origin (`http://localhost:5173` for dev, your prod domain).
2. Copy **Client ID** + **Client Secret**.
3. In **Supabase Dashboard** → Authentication → Providers → **Google** → Enable, paste Client ID/Secret, save.
4. Add Site URL & Redirect URLs: Supabase → Authentication → URL Configuration → Site URL = `http://localhost:5173` (dev) / prod URL; Additional Redirect URLs = `http://localhost:5173`, `https://yourdomain.com`.

### Facebook

1. Go to **developers.facebook.com** → My Apps → Create App (type: Consumer) → Add **Facebook Login** product.
2. Settings → Facebook Login → Valid OAuth Redirect URIs: `https://<PROJECT_REF>.supabase.co/auth/v1/callback`.
3. Settings → Basic → copy **App ID** + **App Secret**.
4. In **Supabase Dashboard** → Authentication → Providers → **Facebook** → Enable, paste App ID as Client ID, App Secret as Client Secret, save.
5. Facebook requires **App Review** for `email` in production; in Dev mode only test users can log in. Add Test Users in Facebook App → Roles → Test Users or submit for review.
6. Ensure Site URL / Redirect URLs as above.

### Common

- In Supabase → Authentication → Providers → ensure **Email** provider remains enabled alongside Google/Facebook.
- No extra env vars required; `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` already configured in `.env.local`.

---

## 3. Local Testing

```bash
npm run dev
# open http://localhost:5173 → click Login → Use Google/Facebook buttons
```

- If you see `Provider not enabled`, double-check Supabase provider is toggled ON and Client IDs are correct.
- Facebook in Dev mode: use a Facebook Test User or an admin/tester account added to the Facebook App.
- After OAuth redirect, Supabase stores session in localStorage; `AppContext` `onAuthStateChange` automatically navigates to home.

---

## 4. Trigger Re-apply (if DB already exists)

If your Supabase project already ran the old trigger, re-run the trigger section from `supabase_schema.sql` in the SQL Editor:

```sql
-- paste the handle_new_user function + DROP TRIGGER + CREATE TRIGGER block
```

---

## 5. Production Checklist

- [ ] Set production Site URL & Redirect URLs in Supabase.
- [ ] Add prod domain to Google Authorized origins / redirect URIs.
- [ ] Add prod domain to Facebook Valid OAuth Redirect URIs & set App to Live.
- [ ] (Optional) Set `avatar_url` handling to download/cache avatars if you need local storage.
