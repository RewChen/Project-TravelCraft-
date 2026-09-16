import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const REASONS = [
  { value: 'spam', labelKey: 'map.reportSpam', color: 'bg-red-100 text-red-700 border-red-400' },
  { value: 'fake location', labelKey: 'map.reportFakeLocation', color: 'bg-amber-100 text-amber-800 border-amber-400' },
  { value: 'inappropriate', labelKey: 'map.reportInappropriate', color: 'bg-blue-100 text-blue-800 border-blue-400' },
  { value: 'other', labelKey: 'map.reportOther', color: 'bg-gray-100 text-gray-700 border-gray-400' },
];

export default function ReportLocationModal({ isOpen, onClose, locationName, mapId }) {
  const { t, userProfile, submitReport, showAdminToast } = useApp();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) {
      setError(t('map.reportRequiredReason'));
      return;
    }
    if (!userProfile) {
      setError(t('map.reportLoginRequired'));
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const saved = await submitReport({
        reporterId: userProfile?.id || null,
        reporterName: userProfile?.name || 'Anonymous',
        mapId: mapId || null,
        locationName,
        reason,
        details: details.trim() || null,
      });
      if (saved) {
        showAdminToast(t('map.reportSuccess'), 'success');
        setReason('');
        setDetails('');
        onClose();
      } else {
        setError(t('map.reportAlreadySubmitted'));
      }
    } catch (err) {
      console.error(err);
      setError('Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] font-mono">
      <div className="bg-white border-4 border-black rounded-2xl w-full max-w-md shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-[#cc0000] text-white p-4 border-b-4 border-black flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-black text-sm uppercase tracking-wider">
              {t('map.reportLocationTitle')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 bg-white text-black border-2 border-black rounded-md flex items-center justify-center hover:bg-gray-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Location name */}
          <div>
            <label className="block text-[10px] font-black uppercase text-gray-600 mb-1">Location</label>
            <div className="bg-gray-50 border-2 border-black rounded-lg px-3 py-2 text-xs font-black text-black">
              {locationName}
            </div>
          </div>

          {/* Reason selector */}
          <div>
            <label className="block text-xs font-black uppercase mb-2">{t('map.reportReason')}</label>
            <div className="grid grid-cols-2 gap-2">
              {REASONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setReason(r.value)}
                  className={`p-2 border-2 border-black rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
                    reason === r.value
                      ? `${r.color} shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] scale-[1.03]`
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {t(r.labelKey)}
                </button>
              ))}
            </div>
            {error && (
              <div className="mt-2 text-[10px] font-black text-red-600 uppercase">{error}</div>
            )}
          </div>

          {/* Details textarea */}
          <div>
            <label className="block text-xs font-black uppercase mb-1">{t('map.reportDetails')}</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={t('map.reportDetailsPh')}
              rows={3}
              className="w-full px-3 py-2 border-2 border-black rounded-lg text-xs font-sans font-medium bg-gray-50 focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t-2 border-black pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border-2 border-black rounded-xl text-xs font-bold hover:bg-gray-100 cursor-pointer"
            >
              {t('map.reportCancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#cc0000] text-white font-black rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-red-700 text-xs uppercase flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '...' : t('map.reportSubmit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}