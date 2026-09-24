import { useMemo } from 'react';
import { ChevronRight, MapPin } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { fetchMapById } from '../../lib/supabaseMaps';
import { resolveCardBackground } from '../../lib/imageUtils';

const placeholderRegions = new Set([
  'Custom Traveler Realm',
  'Custom Realm',
  'Unknown Region',
  'Global Realm',
  'Custom Realms'
]);

export default function OtherMaps() {
  const { communityMaps, navigateTo, selectedLocation, t, userProfile } = useApp();

  const otherMaps = useMemo(() => {
    const currentId = selectedLocation?.id || null;
    const isRealDbMap = (mapItem) =>
      mapItem._summaryOnly === true ||
      mapItem.isEditorMap === true ||
      Boolean(mapItem.ownerId && (
        mapItem.privacy === 'public' ||
        (userProfile?.id && mapItem.ownerId === userProfile.id)
      ));

    const seen = new Set();
    const list = [];
    for (const item of communityMaps || []) {
      if (!item?.id || seen.has(item.id)) continue;
      seen.add(item.id);
      if (currentId && item.id === currentId) continue;
      if (!isRealDbMap(item)) continue;
      if (item.privacy === 'unlisted' || item.privacy === 'private') continue;
      list.push(item);
    }

    const popularityOf = (item) => Number(item?.details?.popularity ?? item?.popularity ?? 0) || 0;
    return list.sort((a, b) => popularityOf(b) - popularityOf(a)).slice(0, 3);
  }, [communityMaps, selectedLocation, userProfile]);

  const openOtherMap = async (mapItem) => {
    if (mapItem._summaryOnly) {
      try {
        const full = await fetchMapById(mapItem.id);
        if (full) {
          navigateTo('details', full);
          return;
        }
      } catch {
        // fall through to the summary details
      }
    }
    navigateTo('details', mapItem);
  };

  return (
    <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_-10px_rgba(45,58,46,0.10)] ring-1 ring-brand-dark/[0.06]">
      <h3 className="text-base font-bold flex items-center gap-2 mb-4 pb-3 border-b border-brand-dark/[0.06] text-brand-dark">
        {t('details.otherMaps')}
      </h3>
      {otherMaps.length === 0 ? (
        <p className="text-xs font-medium text-brand-dark/50">
          {t('details.otherMapsEmpty')}
        </p>
      ) : (
        <div className="space-y-3">
          {otherMaps.map((item) => {
            const rawRegion = item.locationCity || item.details?.region || item.region || '';
            const displayRegion = rawRegion && !rawRegion.toLowerCase().startsWith('editor.') && !placeholderRegions.has(rawRegion)
              ? rawRegion
              : '';
            const bg = resolveCardBackground(item);
            return (
              <div
                key={item.id}
                onClick={() => openOtherMap(item)}
                className="flex items-center gap-3 bg-brand-light/40 dark:bg-slate-700/40 hover:bg-brand-light/80 dark:hover:bg-slate-700/70 p-2 rounded-2xl cursor-pointer transition-colors"
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    className="w-10 h-10 rounded-xl object-cover shrink-0"
                  />
                ) : bg ? (
                  <div role="img" aria-label={item.title} className="w-10 h-10 rounded-xl shrink-0" style={bg} />
                ) : (
                  <div className="w-10 h-10 bg-brand-light rounded-xl flex items-center justify-center text-base shrink-0">🗺️</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-brand-dark truncate">{item.title}</div>
                  {displayRegion ? (
                    <div className="flex items-center gap-1 text-[10px] text-brand-dark/50 uppercase font-medium">
                      <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{displayRegion}</span>
                    </div>
                  ) : (
                    <div className="text-[10px] text-brand-dark/50 truncate">
                      {item.discoveredBy || t('common.traveler')}
                    </div>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-brand-dark/30 shrink-0" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}