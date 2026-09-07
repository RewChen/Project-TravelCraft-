import { Camera } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function TravelerLogs() {
  const { t, selectedLocation } = useApp();
  const logs = selectedLocation?.logs || [];
  const selfieLogs = logs.filter((l) => l.type === 'selfie' && l.image);
  // fallback for older records where selfieUrls stored separately
  const fallbackSelfies = !selfieLogs.length && (selectedLocation?.selfieUrls || (selectedLocation?.selfieUrl ? [selectedLocation.selfieUrl] : []));
  const displaySelfies = selfieLogs.length ? selfieLogs : (fallbackSelfies?.length ? fallbackSelfies.map((img, i) => ({ id: `fallback-${i}`, image: img, caption: selectedLocation?.title })) : []);
  const hasSelfies = displaySelfies.length > 0;

  return (
    <div className="bg-white border-4 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-4">
        <h3 className="text-lg font-black flex items-center gap-2 text-indigo-700">
          <Camera className="w-5 h-5" /> {t('details.logsTitle')}
        </h3>
        <button className="text-xs font-bold text-red-600 hover:underline">{t('details.viewAll')}</button>
      </div>
      {hasSelfies ? (
        <div className="grid grid-cols-3 gap-3">
          {displaySelfies.map((log) => (
            <div key={log.id} className="aspect-square border-2 border-black rounded overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:scale-[1.02] transition-transform bg-gray-100 group relative">
              <img src={log.image} alt={log.caption || 'selfie'} className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[8px] font-bold p-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                {log.caption} {log.author ? `· ${log.author}` : ''}
              </div>
            </div>
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
    </div>
  );
}
