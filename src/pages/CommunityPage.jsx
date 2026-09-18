import { useState } from 'react';
import { Search, Trees, Eye, Trash2, Utensils, Plane, Gamepad2, Landmark, MapPin } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fetchMapById } from '../lib/supabaseMaps';
import Reveal from '../components/motion/Reveal';

// Older maps may carry placeholder region values (never display those).
const placeholderRegions = new Set([
  'Custom Traveler Realm',
  'Custom Realm',
  'Unknown Region',
  'Global Realm',
  'Custom Realms'
]);

const presetTagMeta = {
  restaurant: { labelKey: 'myMaps.tagRestaurant', icon: Utensils, emoji: '🍽️' },
  travel: { labelKey: 'myMaps.tagTravel', icon: Plane, emoji: '✈️' },
  park: { labelKey: 'myMaps.tagPark', icon: Trees, emoji: '🌲' },
  game: { labelKey: 'myMaps.tagGame', icon: Gamepad2, emoji: '🎮' },
  attraction: { labelKey: 'myMaps.tagAttraction', icon: Landmark, emoji: '⛩️' }
};

export default function CommunityPage() {
  const { communityMaps, trackMapOnWorldMap, navigateTo, deleteCommunityMap, adminDeleteCommunityMap, isOwnMap, userProfile, isAdminLoggedIn, showAdminToast, t } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTags, setActiveTags] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  // ปุ่มลบขึ้นเฉพาะของตัวเองเท่านั้น — admin เห็น/ลบได้ทุกอัน
  const canDeleteMap = (mapItem) => {
    if (isAdminLoggedIn === true) return true;
    if (mapItem.ownerId) return Boolean(userProfile) && mapItem.ownerId === userProfile.id;
    if (mapItem.discoveredBy && userProfile) return mapItem.discoveredBy === userProfile.name;
    // แผนที่ local ไร้เจ้าของ = สร้างในเบราว์เซอร์นี้ (guest ลบของตัวเองได้)
    return mapItem.isEditorMap === true && !mapItem._summaryOnly;
  };

  // Only show maps that really came from the database or from this browser's
  // editor. Feed rows from supabaseMaps carry `_summaryOnly`; maps
  // created/published locally (guest sessions) keep `isEditorMap`. The demo
  // seed data has neither, so it is excluded from Community Discoveries.
  const isRealDbMap = (mapItem) =>
    mapItem._summaryOnly === true ||
    mapItem.isEditorMap === true ||
    Boolean(mapItem.ownerId && (
      mapItem.privacy === 'public' ||
      (userProfile?.id && mapItem.ownerId === userProfile.id)
    ));

  const seenIds = new Set();
  const openDetails = async (mapItem) => {
    // Fetch the full map so the details page has logs/selfies, not just the summary.
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
  const tagMatchText = (item) => {
    // Build a text blob from a card's tags: raw keys, translated labels and emojis.
    return (Array.isArray(item.tags) ? item.tags : []).map((tag) => {
      const meta = presetTagMeta[tag];
      return meta ? [tag, t(meta.labelKey), meta.emoji].join(' ') : tag;
    }).join(' ').toLowerCase();
  };

  const matchesAnyTag = (item, tags) => {
    if (!tags || tags.length === 0) return true;
    const cardTags = Array.isArray(item.tags) ? item.tags : [];
    return tags.some((tag) => cardTags.includes(tag));
  };

  const toggleTag = (tag) => {
    setActiveTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const searchBySelectedTag = () => {
    // Search purely by the selected tag chips — clear any text query and filter right away.
    setSearchQuery('');
  };

  const filteredMaps = (communityMaps || []).filter(isRealDbMap).filter((item) => item.privacy !== 'unlisted' && item.privacy !== 'private').filter((item) => {
    if (!item?.id || seenIds.has(item.id)) return false;
    seenIds.add(item.id);
    const title = item.title || t('common.untitledMap');
    const author = item.discoveredBy || t('common.traveler');
    const query = searchQuery.toLowerCase();
    const matchesTags = tagMatchText(item).includes(query);
    const matchesSearch = title.toLowerCase().includes(query) ||
                          author.toLowerCase().includes(query) ||
                          matchesTags;
    return matchesSearch && matchesAnyTag(item, activeTags);
  });

  return (
    <div className="max-w-6xl mx-auto px-4 pb-16 font-mono text-black dark:text-slate-100">
      
      {/* Main Title Section */}
      <Reveal>
      <div className="text-center my-8 space-y-2">
        <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight">
          {t('community.title')}
        </h1>
        <p className="text-sm font-sans font-bold text-slate-700 dark:text-slate-300 underline decoration-2 underline-offset-4">
          {t('community.subtitle')}
        </p>
      </div>
      </Reveal>

      {/* Search Input Bar */}
      <Reveal delay={80}>
      <div className="max-w-2xl mx-auto mb-6">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 dark:text-slate-300" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('community.searchPh')} 
            className="w-full pl-12 pr-4 py-3 border-4 border-black rounded-lg text-sm font-black tracking-wider bg-white focus:outline-none focus:bg-amber-50 uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          />
        </div>
      </div>
      </Reveal>

      {/* Tag Filter Chips + Search By Tag Button */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 mb-10">
        <button
          onClick={searchBySelectedTag}
          title={t('community.searchByTag')}
          className={`px-4 py-2 border-2 border-black rounded-md text-[10px] font-black uppercase transition-all flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer ${
            activeTags.length > 0
              ? 'bg-black text-white hover:bg-gray-800 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
              : 'bg-amber-400 hover:bg-amber-300 text-black'
          }`}
        >
          <Search className="w-3 h-3" /> {t('community.searchByTag')}
        </button>
        {Object.entries(presetTagMeta).map(([tagKey, meta]) => {
          const isActive = activeTags.includes(tagKey);
          return (
            <button
              key={tagKey}
              onClick={() => toggleTag(tagKey)}
              className={`px-3 py-2 border-2 border-black rounded-md text-[10px] font-black uppercase transition-all flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer ${
                isActive
                  ? 'bg-[#2ec4b6] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-white hover:bg-gray-100 text-black'
              }`}
            >
              <span className="text-sm leading-none">{meta.emoji}</span>
              <span>{t(meta.labelKey)}</span>
              {isActive && <span className="text-[10px] leading-none">✕</span>}
            </button>
          );
        })}
      </div>

      {/* Community Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {filteredMaps.map((mapItem, idx) => (
          <Reveal key={mapItem.id} delay={Math.min(idx, 8) * 70} className="h-full">
          <div
            className="bg-white border-4 border-black rounded-xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between hover:translate-y-[-2px] transition-transform h-full"
          >
            {/* Top Image Preview Banner (Clickable) */}
            <div 
              onClick={() => trackMapOnWorldMap(mapItem)}
              className="h-56 bg-sky-200 border-b-4 border-black relative overflow-hidden flex items-center justify-center cursor-pointer group"
              title={t('community.trackTooltip')}
            >
              {mapItem.imageUrl ? (
                <img
                  src={mapItem.imageUrl}
                  alt={mapItem.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : mapItem.previewBackground ? (
                <div
                  role="img"
                  aria-label={t('community.mapPreviewAlt', { title: mapItem.title })}
                  className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                  style={mapItem.previewBackground}
                />
              ) : (
                <div className="w-full h-full bg-sky-200 flex items-center justify-center text-4xl">🗺️</div>
              )}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="bg-amber-400 border-2 border-black px-3 py-1 text-xs font-black text-black uppercase rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {t('community.trackOverlay')}
                </span>
              </div>
              
              {/* Rarity Tag Badge */}
              <div className={`absolute top-3 right-3 px-3 py-1 border-2 border-black font-black text-[10px] uppercase rounded-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${mapItem.rarityColor}`}>
                {mapItem.rarity}
              </div>
            </div>

            {/* Content Info */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h3
                  className="text-lg font-black uppercase tracking-tight leading-snug line-clamp-2 mb-2"
                  title={mapItem.title}
                >
                  {mapItem.title}
                </h3>

                {/* Tags (compact: max 3 shown, rest collapsed into +N) */}
                {Array.isArray(mapItem.tags) && mapItem.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {mapItem.tags.slice(0, 3).map((tag) => {
                      const meta = presetTagMeta[tag];
                      const Icon = meta?.icon;
                      return (
                        <span key={tag} className={`px-2 py-0.5 border-2 border-black text-[9px] font-black uppercase flex items-center gap-1 rounded ${meta ? 'bg-gray-100' : 'bg-amber-100'}`}>
                          {Icon && <Icon className="w-3 h-3" />} {meta ? t(meta.labelKey) : tag}
                        </span>
                      );
                    })}
                    {mapItem.tags.length > 3 && (
                      <span className="px-2 py-0.5 border-2 border-black text-[9px] font-black uppercase rounded bg-white text-slate-600 dark:text-slate-300">
                        +{mapItem.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
                
                {/* Author Info & Role */}
                <div className="flex items-center justify-between gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-3 h-3 border border-black shrink-0 ${mapItem.authorBadgeColor}`}></div>
                    <div className="truncate">
                      {t('community.discoveredBy')} <strong className="font-black text-black dark:text-white">{mapItem.discoveredBy}</strong>
                    </div>
                  </div>
                  <span className="text-[9px] bg-amber-100 border border-black px-1.5 py-0.5 rounded font-black uppercase text-amber-900 shrink-0">
                    {mapItem.authorRole || t('common.cartographer')}
                  </span>
                </div>

                {(() => {
                  const rawRegion = mapItem.locationCity || mapItem.details?.region || mapItem.region || '';
                  const displayCountry = rawRegion && !rawRegion.toLowerCase().startsWith('editor.') && !placeholderRegions.has(rawRegion)
                    ? rawRegion
                    : '';
                  return displayCountry ? (
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase">
                      <MapPin className="w-3 h-3 shrink-0" /> {displayCountry}
                    </div>
                  ) : null;
                })()}

              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => openDetails(mapItem)}
                  className="w-full bg-black text-white hover:bg-gray-800 font-black py-2.5 px-4 border-2 border-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition-colors cursor-pointer text-center"
                >
                  {t('community.viewDetails')}
                </button>

                <button
                  onClick={() => trackMapOnWorldMap(mapItem)}
                  className="w-full bg-white hover:bg-amber-100 text-black font-black py-2.5 px-4 border-2 border-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-black" /> {t('community.trackOnMap')}
                </button>

                {canDeleteMap(mapItem) && (
                  <button
                    onClick={() => {
                      setDeleteReason('');
                      setDeleteTarget(mapItem);
                    }}
                    className="w-full bg-white hover:bg-red-50 text-red-700 font-black py-2.5 px-4 border-2 border-red-700 text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" /> {isAdminLoggedIn ? t('community.deleteThisUserMap') : t('community.deleteMyMap')}
                  </button>
                )}
              </div>
            </div>

          </div>
          </Reveal>
        ))}
      </div>

      {filteredMaps.length === 0 && (
        <div className="text-center py-16 space-y-3 font-mono">
          <div className="text-5xl">🗺️</div>
          <div className="text-lg font-black uppercase tracking-tight">{t('community.noMaps')}</div>
          <p className="text-sm font-bold text-slate-600 dark:text-slate-400">{t('community.noMapsHint')}</p>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black rounded-2xl w-full max-w-sm shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-[#b40000] text-white p-4 border-b-4 border-black flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              <h2 className="font-black uppercase tracking-wide">Delete from Community?</h2>
            </div>
            <div className="p-5">
              <p className="text-sm font-bold text-gray-800">
                {t('community.deleteConfirm', { title: deleteTarget.title })} This cannot be undone.
              </p>

              <div className="mt-4">
                <label className="block text-[11px] font-black uppercase text-gray-500 mb-1.5">
                  {t('community.deleteReasonLabel')}
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder={t('community.deleteReasonPh')}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-50 border-2 border-black rounded-lg text-xs font-bold focus:outline-none focus:bg-amber-50"
                />
                {!deleteReason.trim() && (
                  <p className="mt-1 text-[10px] font-black uppercase text-red-600">
                    {t('community.deleteReasonRequired')}
                  </p>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="px-5 py-2.5 bg-white border-2 border-black font-black text-xs uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={!deleteReason.trim()}
                  onClick={() => {
                    // admin ลบของใครก็ได้ (ลบออกจาก state ท้องถิ่นด้วย) ส่วน user ทั่วไปลบได้เฉพาะของตัวเอง
                    if (isAdminLoggedIn === true && !isOwnMap(deleteTarget)) {
                      adminDeleteCommunityMap(deleteTarget.id, deleteReason.trim());
                    } else {
                      deleteCommunityMap(deleteTarget.id, deleteReason.trim());
                    }
                    showAdminToast(`Map deleted. Reason: ${deleteReason.trim()}`, 'info');
                    setDeleteTarget(null);
                    setDeleteReason('');
                  }}
                  className="px-5 py-2.5 bg-[#b40000] text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-black text-xs uppercase flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
