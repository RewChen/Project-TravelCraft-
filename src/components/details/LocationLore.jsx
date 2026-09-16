import { BookOpen, Calendar, MapPin, Utensils, Plane, Trees, Gamepad2, Landmark } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const presetTagMeta = {
  restaurant: { labelKey: 'myMaps.tagRestaurant', icon: Utensils, emoji: '🍽️' },
  travel: { labelKey: 'myMaps.tagTravel', icon: Plane, emoji: '✈️' },
  park: { labelKey: 'myMaps.tagPark', icon: Trees, emoji: '🌲' },
  game: { labelKey: 'myMaps.tagGame', icon: Gamepad2, emoji: '🎮' },
  attraction: { labelKey: 'myMaps.tagAttraction', icon: Landmark, emoji: '⛩️' }
};

export default function LocationLore() {
  const { selectedLocation, t } = useApp();

  return (
    <div className="bg-white border-4 border-black rounded-xl p-5 sm:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <h3 className="text-lg font-black flex items-center gap-2 mb-4 border-b-2 border-black pb-2">
        <BookOpen className="w-5 h-5 text-red-600" /> {t('details.loreTitle')}
      </h3>
      <p className="text-sm text-slate-700 dark:text-slate-200 font-sans leading-relaxed mb-6 break-all">
        {selectedLocation.lore}
      </p>
      {Array.isArray(selectedLocation.tags) && selectedLocation.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          {selectedLocation.tags.map((tag) => {
            const meta = presetTagMeta[tag];
            const Icon = meta?.icon;
            return (
              <span key={tag} className={`px-2 py-1 border-2 border-black text-[9px] font-black uppercase flex items-center gap-1 rounded ${meta ? 'bg-gray-100' : 'bg-amber-100'}`}>
                {Icon && <Icon className="w-3 h-3" />} {meta?.emoji} {meta ? t(meta.labelKey) : tag}
              </span>
            );
          })}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="border-2 border-black rounded-lg p-3 text-xs">
          <div className="font-bold text-red-600 flex items-center gap-1 mb-1">
            <Calendar className="w-3 h-3"/> {t('details.hours')}
          </div>
          <div className="font-black">{selectedLocation.hours}</div>
        </div>
        <div className="border-2 border-black rounded-lg p-3 text-xs">
          <div className="font-bold text-red-600 flex items-center gap-1 mb-1">
            <BookOpen className="w-3 h-3"/> {t('details.fee')}
          </div>
          <div className="font-black">{selectedLocation.fee}</div>
        </div>
        <div className="border-2 border-black rounded-lg p-3 text-xs">
          <div className="font-bold text-red-600 flex items-center gap-1 mb-1">
            <Calendar className="w-3 h-3"/> {t('details.bestTime')}
          </div>
          <div className="font-black">{selectedLocation.bestTime}</div>
        </div>
        <div className="border-2 border-black rounded-lg p-3 text-xs">
          <div className="font-bold text-red-600 flex items-center gap-1 mb-1">
            <MapPin className="w-3 h-3"/> {t('details.travel')}
          </div>
          <div className="font-black">{selectedLocation.travel}</div>
        </div>
      </div>
    </div>
  );
}
