import { useState } from 'react';
import { Mail, Key, Play, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabaseClient';
import SocialAuthButtons from './SocialAuthButtons';

export default function LoginForm() {
  const { login, setAuthMode, t } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const cleanInput = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    // Supabase Auth (Supports both regular players and admins in DB)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanInput,
        password: cleanPass,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        login(); // Trigger context update to redirect to home
      }
    } catch {
      setErrorMsg(t('auth.bootError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-3 font-thai text-brand-dark">
      <div className="text-center text-[10px] text-brand-dark/50 font-semibold uppercase">{t('auth.bootStatus')}</div>
      <h2 className="text-center text-lg font-bold text-brand-dark mb-2"> {t('auth.loginTitle')}</h2>

      <SocialAuthButtons mode="login" />

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-2xl text-[10px] font-semibold flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-brand-dark mb-1">{t('auth.emailLabel')}</label>
        <div className="relative">
          <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-dark/40" />
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('auth.emailPh')}
            className="w-full pl-9 pr-3 py-2.5 border border-brand-dark/15 rounded-full bg-brand-light/40 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-brand-dark mb-1">{t('auth.secretLabel')}</label>
        <div className="relative">
          <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-dark/40" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('auth.secretPh')}
            className="w-full pl-9 pr-3 py-2.5 border border-brand-dark/15 rounded-full bg-brand-light/40 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            required
          />
        </div>
      </div>

      <div className="text-left pt-1">
        <button
          type="button"
          onClick={() => setAuthMode('forgot')}
          className="text-[11px] font-semibold underline text-brand-dark/70 hover:text-brand-dark cursor-pointer"
        >
          {t('auth.forgotPass')}
        </button>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#cc0000] text-white font-semibold py-3 px-4 rounded-full text-xs uppercase flex items-center justify-center gap-2 cursor-pointer hover:bg-[#b30000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_30px_-15px_rgba(204,0,0,0.6)]"
      >
        {loading ? t('auth.booting') : t('auth.submitLogin')} <Play className="w-3.5 h-3.5 fill-white" />
      </button>

      <div className="text-center pt-2">
        <button
          type="button"
          onClick={() => setAuthMode('register')}
          className="text-xs font-semibold underline text-brand-dark cursor-pointer"
        >
          {t('auth.registerLink')}
        </button>
      </div>
    </form>
  );
}
