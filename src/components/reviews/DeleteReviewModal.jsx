import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function DeleteReviewModal({ review, isAdmin, onConfirm, onClose }) {
  const { t } = useApp();
  const [reason, setReason] = useState('');

  const submit = () => {
    if (isAdmin && !reason.trim()) return;
    onConfirm(reason.trim());
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white border-4 border-black rounded-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="bg-[#cc0000] text-white border-b-4 border-black rounded-t-lg p-4 flex items-center gap-2">
          <Trash2 className="w-5 h-5" />
          <h4 className="font-black uppercase tracking-wide text-sm">{t('details.deleteReview')}</h4>
        </div>

        <div className="p-5">
          <p className="text-sm font-bold text-gray-800">{t('details.deleteReviewConfirm')}</p>
          <p className="text-[11px] font-bold text-gray-400 mt-1 truncate">
            {review.authorName} · ★ {Number(review.rating).toFixed(1)}
          </p>

          {isAdmin && (
            <div className="mt-4">
              <label className="block text-[11px] font-black uppercase text-gray-500 mb-1.5">
                {t('details.adminDeleteReasonLabel')}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('details.adminDeleteReasonPh')}
                rows={3}
                autoFocus
                className="w-full px-3 py-2 bg-gray-50 border-2 border-black rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-black resize-none"
              />
              {!reason.trim() && (
                <p className="mt-1 text-[10px] font-black uppercase text-red-600">{t('details.deleteReasonRequired')}</p>
              )}
            </div>
          )}

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-white border-2 border-black font-black text-xs uppercase cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={isAdmin && !reason.trim()}
              className="px-5 py-2.5 bg-[#cc0000] hover:bg-red-700 text-white border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="inline-flex items-center gap-1.5"><Trash2 className="w-3.5 h-3.5" /> {t('common.confirm')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}