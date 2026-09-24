import { useState } from 'react';
import { Key, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabaseClient';

export default function ResetPasswordForm() {
  const { login, setAuthMode, t } = useApp();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if ((password || '').length < 6) {
      setErrorMsg(t('auth.passTooShort'));
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg(t('auth.passMismatch'));
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        const msg = String(error.message || '').toLowerCase();
        if (/expired|invalid|jwt|session/i.test(msg)) {
          setErrorMsg(t('auth.resetExpired'));
        } else {
          setErrorMsg(error.message);
        }
        return;
      }
      // Kill the recovery session, then treat the user as logged in.
      await supabase.auth.signOut();
      login();
    } catch {
      setErrorMsg(t('auth.bootError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2 font-thai text-brand-dark">
      <div className="text-center">
        <div className="inline-block text-[#cc0000] font-bold text-lg mb-1">{t('auth.resetTitle')}</div>
        <p className="text-[11px] text-brand-dark/60">{t('auth.resetDesc')}</p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-2xl text-[10px] font-semibold flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-brand-dark mb-1">{t('auth.newSecretLabel')}</label>
        <div className="relative">
          <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-dark/40" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full pl-9 pr-3 py-2.5 border border-brand-dark/15 rounded-full bg-brand-light/40 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-brand-dark mb-1">{t('auth.confirmSecret')}</label>
        <div className="relative">
          <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-dark/40" />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full pl-9 pr-3 py-2.5 border border-brand-dark/15 rounded-full bg-brand-light/40 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#cc0000] text-white font-semibold py-3 px-4 rounded-full text-xs uppercase flex items-center justify-center gap-2 cursor-pointer hover:bg-[#b30000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_30px_-15px_rgba(204,0,0,0.6)]"
      >
        {loading ? t('auth.resetSaving') : t('auth.resetSubmit')}
      </button>

      <div className="text-center pt-1">
        <button
          type="button"
          onClick={() => setAuthMode('login')}
          className="block w-full text-xs font-semibold underline text-brand-dark cursor-pointer"
        >
          {t('auth.backToLogin')}
        </button>
      </div>
    </form>
  );
}