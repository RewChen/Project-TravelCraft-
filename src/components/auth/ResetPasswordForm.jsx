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
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      <div className="text-center">
        <div className="inline-block text-red-600 font-bold text-lg mb-1">{t('auth.resetTitle')}</div>
        <p className="text-[11px] text-gray-600 font-sans">{t('auth.resetDesc')}</p>
      </div>

      {errorMsg && (
        <div className="bg-red-100 border-2 border-black text-red-700 p-2 rounded text-[10px] font-bold flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-black mb-1">{t('auth.newSecretLabel')}</label>
        <div className="relative">
          <Key className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-600" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full pl-8 pr-2 py-1.5 border-2 border-black rounded bg-gray-50 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:bg-amber-50"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-black mb-1">{t('auth.confirmSecret')}</label>
        <div className="relative">
          <Key className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-600" />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full pl-8 pr-2 py-1.5 border-2 border-black rounded bg-gray-50 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:bg-amber-50"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#cc0000] text-white font-bold py-2 px-4 rounded border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-xs uppercase flex items-center justify-center gap-2 cursor-pointer hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? t('auth.resetSaving') : t('auth.resetSubmit')}
      </button>

      <div className="text-center pt-1">
        <button
          type="button"
          onClick={() => setAuthMode('login')}
          className="block w-full text-xs font-bold underline text-black cursor-pointer"
        >
          {t('auth.backToLogin')}
        </button>
      </div>
    </form>
  );
}