import { BookOpen, Calendar, MapPin } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PRESET_TAG_META as presetTagMeta } from '../../lib/tags';

export default function LocationLore() {
  const { selectedLocation, t } = useApp();

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_4px_20px_-10px_rgba(45,58,46,0.10)] ring-1 ring-brand-dark/[0.06]">
      <h3 className="text-lg font-bold flex items-center gap-2 mb-4 pb-3 border-b border-brand-dark/[0.06] text-brand-dark">
        <BookOpen className="w-5 h-5 text-brand-green" /> {t('details.loreTitle')}
      </h3>
      <p className="text-sm text-brand-dark/75 leading-relaxed mb-6 break-all">
        {selectedLocation.lore}
      </p>
      {Array.isArray(selectedLocation.tags) && selectedLocation.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          {selectedLocation.tags.map((tag) => {
            const meta = presetTagMeta[tag];
            const Icon = meta?.icon;
            return (
              <span key={tag} className={`px-2.5 py-1 text-[9px] font-semibold uppercase flex items-center gap-1 rounded-full ${meta ? 'bg-brand-light text-brand-dark/70' : 'bg-amber-100 text-amber-800'}`}>
                {Icon && <Icon className="w-3 h-3" />} {meta?.emoji} {meta ? t(meta.labelKey) : tag}
              </span>
            );
          })}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl px-3.5 py-3 text-xs bg-brand-light/60 dark:bg-slate-700/60">
          <div className="font-semibold text-brand-green dark:text-emerald-300 flex items-center gap-1 mb-1">
            <Calendar className="w-3 h-3"/> {t('details.hours')}
          </div>
          <div className="font-semibold text-brand-dark dark:text-slate-100">{selectedLocation.hours}</div>
        </div>
        <div className="rounded-xl px-3.5 py-3 text-xs bg-brand-light/60 dark:bg-slate-700/60">
          <div className="font-semibold text-brand-green dark:text-emerald-300 flex items-center gap-1 mb-1">
            <BookOpen className="w-3 h-3"/> {t('details.fee')}
          </div>
          <div className="font-semibold text-brand-dark dark:text-slate-100">{selectedLocation.fee}</div>
        </div>
        <div className="rounded-xl px-3.5 py-3 text-xs bg-brand-light/60 dark:bg-slate-700/60">
          <div className="font-semibold text-brand-green dark:text-emerald-300 flex items-center gap-1 mb-1">
            <Calendar className="w-3 h-3"/> {t('details.bestTime')}
          </div>
          <div className="font-semibold text-brand-dark dark:text-slate-100">{selectedLocation.bestTime}</div>
        </div>
        <div className="rounded-xl px-3.5 py-3 text-xs bg-brand-light/60 dark:bg-slate-700/60">
          <div className="font-semibold text-brand-green dark:text-emerald-300 flex items-center gap-1 mb-1">
            <MapPin className="w-3 h-3"/> {t('details.travel')}
          </div>
          <div className="font-semibold text-brand-dark dark:text-slate-100">{selectedLocation.travel}</div>
        </div>
      </div>
    </div>
  );
}
