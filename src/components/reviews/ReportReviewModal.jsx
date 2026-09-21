import { useState } from 'react';
import { Flag, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const REASON_KEYS = ['reasonSpam', 'reasonMisleading', 'reasonInappropriate', 'reasonWrongLocation', 'reasonOther'];

export default function ReportReviewModal({ review, onClose }) {
  const { t } = useApp();
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');

  const submit = () => {
    if (!reason) return;
    const label = t(`details.${reason}`);
    const full = detail.trim() ? `${label} — ${detail.trim()}` : label;
    try {
      const raw = localStorage.getItem('project_travelcraft_review_reports');
      const list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) throw new Error('bad records');
      list.push({ id: review.id, reason: full, date: Date.now() });
      localStorage.setItem('project_travelcraft_review_reports', JSON.stringify(list));
    } catch {
      // ข้ามเก็บไม่ได้ ก็ไม่บล็อกการรายงาน
    }
    onClose(full);
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => onClose(null)}>
      <div className="bg-white border-4 border-black rounded-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <h4 className="text-sm font-black flex items-center gap-2">
            <Flag className="w-4 h-4 text-red-600" /> {t('details.reportTitle')}
          </h4>
          <button
            type="button"
            onClick={() => onClose(null)}
            className="bg-slate-800 hover:bg-slate-700 dark:bg-black dark:hover:bg-gray-800 text-white w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs font-bold mt-4 mb-2">{t('details.reportWhy')}</p>
        <div className="space-y-2">
          {REASON_KEYS.map((key) => (
            <label
              key={key}
              className={`flex items-center gap-2.5 border-2 border-black rounded-xl px-3 py-2.5 cursor-pointer text-xs font-black transition-all ${reason === key ? 'bg-[#cc0000] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white hover:bg-gray-50'}`}
            >
              <input type="radio" name="report-reason" className="hidden" checked={reason === key} onChange={() => setReason(key)} />
              <span className={`w-3.5 h-3.5 rounded-full border-2 ${reason === key ? 'border-white bg-white' : 'border-black bg-transparent'} shrink-0`} />
              {t(`details.${key}`)}
            </label>
          ))}
        </div>

        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder={t('details.reportDescribe')}
          rows={3}
          className="w-full mt-4 border-2 border-black rounded-xl p-3 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-black resize-none bg-gray-50"
        />

        <div className="flex items-center justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={() => onClose(null)}
            className="text-[11px] font-black uppercase border-2 border-black rounded-xl px-4 py-2 hover:bg-gray-100 cursor-pointer"
          >
            {t('details.reportCancel')}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!reason}
            className="text-[11px] font-black uppercase bg-[#cc0000] hover:bg-red-700 text-white border-2 border-black rounded-xl px-4 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('details.reportSubmit')}
          </button>
        </div>
      </div>
    </div>
  );
}