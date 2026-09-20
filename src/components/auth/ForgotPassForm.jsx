import { useState } from 'react';
import { Play, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());

export default function ForgotPassForm() {
  const { setAuthMode, t } = useApp();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg(t('auth.emailRequired'));
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      setErrorMsg(t('auth.emailInvalid'));
      return;
    }
    if (!isSupabaseConfigured) {
      setErrorMsg(t('auth.resetNotConfigured'));
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: window.location.origin,
      });
      if (error) {
        const msg = String(error.message || '');
        if (error.status === 429 || /rate limit|too many/i.test(msg)) {
          setErrorMsg(t('auth.rateLimit'));
        } else {
          setErrorMsg(msg);
        }
      } else {
        setAuthMode('restored');
      }
    } catch {
      setErrorMsg(t('auth.bootError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      <div className="text-center">
        <div className="inline-block text-red-600 font-bold text-lg mb-1">{t('auth.recoveryTitle')}</div>
        <p className="text-[11px] text-gray-600 font-sans">{t('auth.recoveryDesc')}</p>
      </div>

      {errorMsg && (
        <div className="bg-red-100 border-2 border-black text-red-700 p-2 rounded text-[10px] font-bold flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-black mb-1">{t('auth.trainerEmail2')}</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('auth.emailPh')}
          className="w-full px-3 py-1.5 border-2 border-black rounded bg-gray-50 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:bg-amber-50"
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#cc0000] text-white font-bold py-2 px-4 rounded border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-xs uppercase flex items-center justify-center gap-2 cursor-pointer hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? t('auth.sendingResetLink') : t('auth.sendResetLink')} {!loading && <Play className="w-3 h-3 fill-white" />}
      </button>
      <div className="text-center space-y-1 pt-2">
        <button
          type="button"
          onClick={() => setAuthMode('login')}
          className="block w-full text-xs font-bold underline text-black cursor-pointer"
        >
          {t('auth.backToLogin')}
        </button>
        <button
          type="button"
          onClick={() => setAuthMode('register')}
          className="block w-full text-xs font-bold underline text-black cursor-pointer"
        >
          {t('auth.newTrainer')}
        </button>
      </div>
    </form>
  );
}