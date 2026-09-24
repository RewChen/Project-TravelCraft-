import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function FooterInfoModal({ section, onClose }) {
  const { t } = useApp();
  if (!section) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-3xl p-6 border border-brand-dark/10 dark:border-slate-600 shadow-[0_20px_50px_-20px_rgba(45,58,46,0.25)] relative font-thai"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
          className="absolute top-3 right-3 w-7 h-7 bg-brand-dark/10 text-brand-dark hover:bg-brand-dark hover:text-white rounded-full flex items-center justify-center cursor-pointer transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <h3 className="text-sm font-bold uppercase tracking-wider text-brand-dark mb-2">{t(`footer.${section}Title`)}</h3>
        <p className="text-[11px] text-brand-dark/70 leading-relaxed mb-4">{t(`footer.${section}Body`)}</p>
        <button
          type="button"
          onClick={onClose}
          className="w-full bg-brand-dark hover:bg-brand-green text-white font-semibold py-2.5 px-4 rounded-full text-xs uppercase cursor-pointer transition-colors"
        >
          {t('common.close')}
        </button>
      </div>
    </div>
  );
}