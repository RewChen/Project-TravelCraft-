
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import ForgotPassForm from '../components/auth/ForgotPassForm';
import RestoredForm from '../components/auth/RestoredForm';
import ResetPasswordForm from '../components/auth/ResetPasswordForm';
import FooterInfoModal from '../components/common/FooterInfoModal';
import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function AuthPage() {
  const { authMode, navigateTo, t, themeMode } = useApp();
  const isDark = themeMode === 'dark';
  const [infoSection, setInfoSection] = useState(null);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-brand-cream'} flex flex-col items-center justify-center p-4 font-thai transition-colors duration-200`}>
      <button
        onClick={() => navigateTo('home')}
        className={`mb-4 text-xs font-semibold px-4 py-2 rounded-full border flex items-center gap-2 cursor-pointer transition-colors ${
          isDark ? 'text-white bg-gray-800 hover:bg-gray-700 border-white/20' : 'text-brand-dark bg-white hover:bg-brand-light border-brand-dark/15'
        }`}
      >
        {t('auth.back')}
      </button>

      <div className="w-full max-w-sm bg-white border border-brand-dark/10 rounded-[32px] p-6 shadow-[0_25px_60px_-25px_rgba(45,58,46,0.4)] relative">
        <div className="bg-brand-dark/5 p-3 rounded-3xl rounded-b-2xl mb-5">
          <div className="bg-white dark:bg-slate-800 dark:text-slate-100 border border-brand-dark/10 rounded-2xl overflow-hidden relative shadow-[0_10px_30px_-25px_rgba(45,58,46,0.3)]">

            {/* Red Header Banner */}
            <div className="bg-[#cc0000] text-white py-2.5 px-3 text-center font-semibold tracking-wider text-xs uppercase flex items-center justify-center gap-2">
              <span>{authMode === 'login' && t('auth.loginHeader')}</span>
              <span>{authMode === 'register' && t('auth.registerHeader')}</span>
              <span>{authMode === 'forgot' && t('auth.recoveryHeader')}</span>
              <span>{authMode === 'restored' && t('auth.resetSentHeader')}</span>
              <span>{authMode === 'reset' && t('auth.resetHeader')}</span>
            </div>

            <div className="p-4 sm:p-5">
              {authMode === 'login' && <LoginForm />}
              {authMode === 'register' && <RegisterForm />}
              {authMode === 'forgot' && <ForgotPassForm />}
              {authMode === 'restored' && <RestoredForm />}
              {authMode === 'reset' && <ResetPasswordForm />}
            </div>

          </div>
        </div>
      </div>

      <footer className={`text-center text-xs mt-6 space-y-1 ${isDark ? 'text-white/60' : 'text-brand-dark/50'}`}>
        <div className="flex justify-center gap-4 font-semibold underline">
          <button type="button" onClick={() => setInfoSection('legal')} className={`cursor-pointer ${isDark ? 'hover:text-white' : 'hover:text-brand-dark'}`}>{t('footer.legal')}</button>
          <button type="button" onClick={() => setInfoSection('support')} className={`cursor-pointer ${isDark ? 'hover:text-white' : 'hover:text-brand-dark'}`}>{t('footer.support')}</button>
          <button type="button" onClick={() => setInfoSection('trainerClub')} className={`cursor-pointer ${isDark ? 'hover:text-white' : 'hover:text-brand-dark'}`}>{t('footer.trainerClub')}</button>
        </div>
        <p className="text-[10px]">{t('footer.copyright')}</p>
      </footer>
      <FooterInfoModal section={infoSection} onClose={() => setInfoSection(null)} />
    </div>
  );
}
