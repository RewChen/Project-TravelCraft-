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
    <div className="bg-white border-4 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <h3 className="text-base font-black flex items-center gap-2 mb-4 border-b-2 border-black pb-2 text-black">
        {t('details.otherMaps')}
      </h3>
      {otherMaps.length === 0 ? (
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
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
                className="flex items-center gap-3 border border-gray-300 p-2 rounded cursor-pointer hover:bg-gray-50 transition-colors"
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    className="w-10 h-10 border-2 border-black rounded object-cover shrink-0"
                  />
                ) : bg ? (
                  <div role="img" aria-label={item.title} className="w-10 h-10 border-2 border-black rounded shrink-0" style={bg} />
                ) : (
                  <div className="w-10 h-10 bg-sky-200 border-2 border-black rounded flex items-center justify-center text-base shrink-0">🗺️</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">{item.title}</div>
                  {displayRegion ? (
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">
                      <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{displayRegion}</span>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {item.discoveredBy || t('common.traveler')}
                    </div>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}