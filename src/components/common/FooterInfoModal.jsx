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
        className="w-full max-w-sm bg-[#d8d8d8] border-4 border-black rounded-3xl p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)] relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
          className="absolute top-2.5 right-2.5 w-7 h-7 bg-[#cc0000] text-white border-2 border-black rounded-md flex items-center justify-center cursor-pointer hover:bg-red-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <h3 className="text-sm font-black uppercase tracking-wider text-black mb-2">{t(`footer.${section}Title`)}</h3>
        <p className="text-[11px] text-gray-700 font-sans leading-relaxed mb-4">{t(`footer.${section}Body`)}</p>
        <button
          type="button"
          onClick={onClose}
          className="w-full bg-[#cc0000] text-white font-bold py-2 px-4 rounded border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-xs uppercase cursor-pointer hover:bg-red-700 transition-colors"
        >
          {t('common.close')}
        </button>
      </div>
    </div>
  );
}