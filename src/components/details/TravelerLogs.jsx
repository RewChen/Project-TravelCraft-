import { useState, useEffect } from 'react';
import { Camera, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function TravelerLogs() {
  const { t, selectedLocation } = useApp();
  const logs = selectedLocation?.logs || [];
  const selfieLogs = logs.filter((l) => l.type === 'selfie' && l.image);
  // fallback for older records where selfieUrls stored separately
  const fallbackSelfies = !selfieLogs.length && (selectedLocation?.selfieUrls || (selectedLocation?.selfieUrl ? [selectedLocation.selfieUrl] : []));
  const displaySelfies = selfieLogs.length ? selfieLogs : (fallbackSelfies?.length ? fallbackSelfies.map((img, i) => ({ id: `fallback-${i}`, image: img, caption: selectedLocation?.title })) : []);
  const hasSelfies = displaySelfies.length > 0;
  const [activeIdx, setActiveIdx] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const activeLog = activeIdx !== null ? displaySelfies[activeIdx] : null;

  useEffect(() => {
    if (activeIdx === null) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setActiveIdx(null);
      if (e.key === 'ArrowLeft') setActiveIdx((p) => (p > 0 ? p - 1 : displaySelfies.length - 1));
      if (e.key === 'ArrowRight') setActiveIdx((p) => (p < displaySelfies.length - 1 ? p + 1 : 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeIdx, displaySelfies.length]);

  return (
    <div className="bg-white border-4 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-4">
        <h3 className="text-lg font-black flex items-center gap-2 text-indigo-700">
          <Camera className="w-5 h-5" /> {t('details.logsTitle')}
        </h3>
        <button
          onClick={() => hasSelfies && setShowAll(true)}
          disabled={!hasSelfies}
          className={`text-xs font-bold hover:underline ${hasSelfies ? 'text-red-600 cursor-pointer' : 'text-gray-400 cursor-not-allowed'}`}
        >
          {t('details.viewAll')}
        </button>
      </div>
      {hasSelfies ? (
        <div className="grid grid-cols-3 gap-3">
          {displaySelfies.map((log, idx) => (
            <button
              key={log.id}
              type="button"
              onClick={() => setActiveIdx(idx)}
              className="aspect-square border-2 border-black rounded overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:scale-[1.02] transition-transform bg-gray-100 group relative cursor-pointer text-left"
            >
              <img src={log.image} alt={log.caption || 'selfie'} className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[8px] font-bold p-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                {log.caption} {log.author ? `· ${log.author}` : ''}
              </div>
              <span className="absolute top-1 right-1 bg-white/90 border border-black rounded-full w-5 h-5 flex items-center justify-center text-[10px]">🔍</span>
            </button>
          ))}
          {/* Fill remaining slots with placeholders if less than 3 */}
          {Array.from({ length: Math.max(0, 3 - displaySelfies.length) }).map((_, i) => (
            <div key={`ph-${i}`} className="aspect-square bg-sky-100 border-2 border-dashed border-black rounded flex items-center justify-center text-xl opacity-60">
              {['🗼','🌅','✨'][i % 3]}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <div className="aspect-square bg-sky-200 border-2 border-black rounded flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-2xl font-bold hover:scale-105 transition-transform cursor-pointer">
            🗼
          </div>
          <div className="aspect-square bg-sky-300 border-2 border-black rounded flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-2xl font-bold hover:scale-105 transition-transform cursor-pointer">
            🌅
          </div>
          <div className="aspect-square bg-sky-100 border-2 border-black rounded flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-2xl font-bold hover:scale-105 transition-transform cursor-pointer">
            ✨
          </div>
        </div>
      )}
      {showAll && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAll(false)}>
          <div className="relative w-full max-w-3xl bg-white border-4 border-black rounded-2xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#cc0000] text-white px-4 py-3 border-b-4 border-black flex items-center justify-between shrink-0">
              <span className="text-sm font-black uppercase flex items-center gap-2"><Camera className="w-4 h-4" /> {t('details.logsTitle')} — {displaySelfies.length} {(() => { const v = t('details.photosCount'); return v === 'details.photosCount' ? 'รูป' : v; })()}</span>
              <button onClick={() => setShowAll(false)} className="w-7 h-7 bg-white text-black border-2 border-black rounded flex items-center justify-center hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {displaySelfies.map((log, idx) => (
                  <button key={log.id} type="button" onClick={() => { setShowAll(false); setActiveIdx(idx); }} className="border-2 border-black rounded overflow-hidden hover:scale-[1.02] transition-transform bg-gray-100 group text-left">
                    <img src={log.image} alt={log.caption || 'selfie'} className="w-full h-40 object-cover" />
                    <div className="p-1.5 bg-white border-t-2 border-black">
                      <p className="text-[10px] font-black truncate">{log.caption || t('details.logsTitle')}</p>
                      <p className="text-[9px] text-gray-500 font-bold truncate">{log.author || ''} {log.date ? `· ${log.date}` : ''}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {activeLog && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setActiveIdx(null)}>
          <div className="relative w-full max-w-2xl bg-white border-4 border-black rounded-2xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#cc0000] text-white px-4 py-2 border-b-4 border-black flex items-center justify-between">
              <span className="text-xs font-black uppercase truncate">{activeLog.caption || t('details.logsTitle')} {activeIdx + 1}/{displaySelfies.length}</span>
              <button onClick={() => setActiveIdx(null)} className="w-7 h-7 bg-white text-black border-2 border-black rounded flex items-center justify-center hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="relative bg-black flex items-center justify-center">
              <img src={activeLog.image} alt={activeLog.caption || 'selfie enlarged'} className="max-h-[70vh] w-full object-contain" />
              {displaySelfies.length > 1 && (
                <>
                  <button onClick={() => setActiveIdx((p) => (p > 0 ? p - 1 : displaySelfies.length - 1))} className="absolute left-2 w-9 h-9 bg-white/90 border-2 border-black rounded-full flex items-center justify-center hover:bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"><ChevronLeft className="w-5 h-5" /></button>
                  <button onClick={() => setActiveIdx((p) => (p < displaySelfies.length - 1 ? p + 1 : 0))} className="absolute right-2 w-9 h-9 bg-white/90 border-2 border-black rounded-full flex items-center justify-center hover:bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"><ChevronRight className="w-5 h-5" /></button>
                </>
              )}
            </div>
            {(activeLog.author || activeLog.date) && (
              <div className="px-4 py-2 bg-amber-50 border-t-2 border-black text-[11px] font-bold flex items-center justify-between">
                <span>{activeLog.author || ''}</span><span className="text-gray-500">{activeLog.date || ''}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
