import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { useApp } from '../../context/AppContext';

const isProviderNotEnabledError = (msg = '') => {
  const m = String(msg).toLowerCase();
  return m.includes('unsupported provider') || m.includes('provider is not enabled') || m.includes('validation_failed') || m.includes('not enabled') || m.includes('provider_disabled');
};

const isMissingConfigError = (msg = '') => {
  const m = String(msg).toLowerCase();
  return m.includes('supabase') && (m.includes('url') || m.includes('key') || m.includes('not configured'));
};

export default function SocialAuthButtons({ mode = 'login' }) {
  void mode; // keep prop for future login vs register copy
  const { login, setUserProfile, t } = useApp();
  const [oAuthLoading, setOAuthLoading] = useState(null);
  const [oAuthError, setOAuthError] = useState('');
  const [oAuthDemoProvider, setOAuthDemoProvider] = useState(null);

  const getFriendlyError = (provider, raw) => {
    if (isProviderNotEnabledError(raw)) {
      const cap = provider.charAt(0).toUpperCase() + provider.slice(1);
      return t('auth.oauthProviderNotEnabled', { provider: cap });
    }
    return raw || t('auth.oauthFailed');
  };

  const demoLogin = (provider) => {
    const cap = provider.charAt(0).toUpperCase() + provider.slice(1);
    login();
    setUserProfile({
      id: `demo-${provider}`,
      name: `${cap} Traveler`,
      email: '',
      avatar: '🧢',
      role: 'Novice Traveler',
      level: 1,
      badges: ['Pioneer'],
      visitedCount: 0
    });
    setOAuthLoading(null);
    setOAuthError('');
    setOAuthDemoProvider(null);
  };

  const handleOAuth = async (provider) => {
    setOAuthError('');
    setOAuthDemoProvider(null);

    // If Supabase is not configured at all, there is no real OAuth to use.
    if (!isSupabaseConfigured) {
      setOAuthError(t('auth.oauthNotConfigured'));
      setOAuthDemoProvider(provider);
      return;
    }

    setOAuthLoading(provider);
    try {
      const redirectTo = window.location.origin;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          scopes: 'email profile',
          queryParams: provider === 'google' ? { access_type: 'offline', prompt: 'consent' } : undefined,
        },
      });
      if (error) {
        const raw = error.message || '';
        if (isProviderNotEnabledError(raw) || isMissingConfigError(raw)) {
          setOAuthError(getFriendlyError(provider, raw));
          setOAuthDemoProvider(provider);
          setOAuthLoading(null);
          return;
        }
        setOAuthError(getFriendlyError(provider, raw));
        setOAuthLoading(null);
        return;
      }
      // data.url is set when OAuth is properly configured – browser will redirect
      if (!data?.url) {
        setOAuthLoading(null);
        setOAuthError(t('auth.oauthFailed'));
        return;
      }
      // Success path: browser redirects — still clear the spinner so the button
      // never gets stuck if the redirect is slow/blocked.
      setOAuthLoading(null);
    } catch (err) {
      const raw = err?.message || t('auth.oauthFailed');
      if (isProviderNotEnabledError(raw) || isMissingConfigError(raw)) {
        setOAuthError(getFriendlyError(provider, raw));
        setOAuthDemoProvider(provider);
        setOAuthLoading(null);
        return;
      }
      setOAuthError(getFriendlyError(provider, raw));
      setOAuthLoading(null);
    }
  };

  const demoButton = (provider, label) => (
    <button
      type="button"
      onClick={() => demoLogin(provider)}
      disabled={!!oAuthLoading}
      className="flex items-center justify-center gap-1.5 text-[#cc0000] font-black py-1.5 px-2 rounded-lg border-2 border-dashed border-[#cc0000] text-[10px] uppercase hover:bg-[#cc0000] hover:text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
    >
      🎮 {label}
    </button>
  );

  const demoProviders = [{ id: 'google', label: 'Google' }];

  return (
    <div className="space-y-3">
      {oAuthError && (
        <div className="bg-amber-50 border-2 border-black text-amber-900 p-2.5 rounded-xl text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-2 leading-tight">
          <div className="flex items-start gap-1.5">
            <span className="text-[11px]">⚠️</span>
            <span className="flex-1">{oAuthError}</span>
          </div>
          {oAuthDemoProvider && (
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-amber-700 font-sans flex-1">{t('auth.oauthDemoNote')}</span>
              {demoButton(oAuthDemoProvider, t('auth.oauthDemoLogin', { provider: oAuthDemoProvider.charAt(0).toUpperCase() + oAuthDemoProvider.slice(1) }))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-2">
        <button
          type="button"
          onClick={() => handleOAuth('google')}
          disabled={!!oAuthLoading}
          className="flex items-center justify-center gap-1.5 bg-white text-black font-black py-2 px-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 text-[11px] uppercase hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          aria-label={t('auth.continueWithGoogle')}
        >
          {oAuthLoading === 'google' ? (
            <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          <span>{oAuthLoading === 'google' ? t('auth.redirecting') : 'Google'}</span>
        </button>
      </div>

      {!isSupabaseConfigured && (
        <div className="bg-amber-50 border-2 border-black rounded-xl p-2.5 space-y-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-[9px] text-amber-800 font-bold flex items-center gap-1"><span>🔄</span> {t('auth.oauthDemoNote')}</p>
          <div className="grid grid-cols-2 gap-2">
            {demoProviders.map((p) => demoButton(p.id, t('auth.oauthDemoLogin', { provider: p.label })))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 py-1">
        <div className="flex-1 h-0.5 bg-black/15 rounded" />
        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">{t('auth.orDivider')}</span>
        <div className="flex-1 h-0.5 bg-black/15 rounded" />
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09A6.97 6.97 0 015.47 12c0-.74.13-1.45.36-2.09V7.07H2.18A10.99 10.99 0 001 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.65 2.84C6.7 7.31 9.13 5.38 12 5.38z" />
    </svg>
  );
}