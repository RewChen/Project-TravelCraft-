import { Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function RestoredForm() {
  const { setAuthMode, t } = useApp();

  return (
    <div className="space-y-4 text-center py-2 font-thai text-brand-dark">
      <div className="w-12 h-12 bg-[#cc0000] rounded-full mx-auto flex items-center justify-center shadow-[0_10px_30px_-15px_rgba(204,0,0,0.6)]">
        <Check className="w-6 h-6 text-white stroke-[3]" />
      </div>
      <h3 className="font-bold text-sm uppercase tracking-wider">{t('auth.resetSentTitle')}</h3>
      <p className="text-[10px] text-brand-dark/60 leading-tight">
        {t('auth.resetSentDesc')}
      </p>
      <button 
        onClick={() => setAuthMode('login')} 
        className="w-full bg-[#cc0000] text-white font-semibold py-3 px-4 rounded-full text-xs uppercase cursor-pointer hover:bg-[#b30000] transition-colors shadow-[0_10px_30px_-15px_rgba(204,0,0,0.6)]"
      >
        {t('auth.backToLoginBtn')}
      </button>
    </div>
  );
}
