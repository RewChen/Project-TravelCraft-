import { useState } from 'react';
import { Search, Mountain, Trees, Building2, Target, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function CommunityPage() {
  const { communityMaps, trackMapOnWorldMap, navigateTo, deleteCommunityMap, userProfile, t } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const canDeleteMap = (mapItem) => Boolean(userProfile && (
    mapItem.ownerId
      ? mapItem.ownerId === userProfile.id
      : mapItem.discoveredBy === userProfile.name
  ));

  const categories = [
    { id: 'ALL', label: 'community.all', icon: null },
    { id: 'landmarks', label: 'community.landmarks', icon: Mountain },
    { id: 'nature', label: 'community.nature', icon: Trees },
    { id: 'urban', label: 'community.urban', icon: Building2 }
  ];

  const seenIds = new Set();
  const filteredMaps = (communityMaps || []).filter((item) => item.privacy !== 'unlisted' && item.privacy !== 'private').filter((item) => {
    if (!item?.id || seenIds.has(item.id)) return false;
    seenIds.add(item.id);
    const title = item.title || t('common.untitledMap');
    const author = item.discoveredBy || t('common.traveler');
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'ALL' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 pb-16 font-mono text-black dark:text-slate-100">
      
      {/* Main Title Section */}
      <div className="text-center my-8 space-y-2">
        <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight">
          {t('community.title')}
        </h1>
        <p className="text-sm font-sans font-bold text-slate-700 dark:text-slate-300 underline decoration-2 underline-offset-4">
          {t('community.subtitle')}
        </p>
      </div>

      {/* Search Input Bar */}
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

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 border-2 border-black rounded-md text-xs font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 ${
                isActive 
                  ? 'bg-[#2ec4b6] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]' 
                  : 'bg-white hover:bg-gray-100 text-black'
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              <span>{t(cat.label)}</span>
            </button>
          );
        })}
      </div>

      {/* Community Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {filteredMaps.map((mapItem) => (
          <div 
            key={mapItem.id}
            className="bg-white border-4 border-black rounded-xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between hover:translate-y-[-2px] transition-transform"
          >
            {/* Top Image Preview Banner (Clickable) */}
            <div 
              onClick={() => trackMapOnWorldMap(mapItem)}
              className="h-56 bg-sky-200 border-b-4 border-black relative overflow-hidden flex items-center justify-center cursor-pointer group"
              title={t('community.trackTooltip')}
            >
              {mapItem.previewBackground ? (
                <div
                  role="img"
                  aria-label={t('community.mapPreviewAlt', { title: mapItem.title })}
                  className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                  style={mapItem.previewBackground}
                />
              ) : (
                <img
                  src={mapItem.imageUrl}
                  alt={mapItem.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
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
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight mb-2">
                  {mapItem.title}
                </h3>
                
                {/* Author Info & Role */}
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 border border-black ${mapItem.authorBadgeColor}`}></div>
                    <span>{t('community.discoveredBy')} <strong className="font-black text-black">{mapItem.discoveredBy}</strong></span>
                  </div>
                  <span className="text-[9px] bg-amber-100 border border-black px-1.5 py-0.5 rounded font-black uppercase text-amber-900">
                    {mapItem.authorRole || t('common.cartographer')}
                  </span>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => navigateTo('details', mapItem.details)}
                  className="w-full bg-black text-white hover:bg-gray-800 font-black py-2.5 px-4 border-2 border-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition-colors cursor-pointer text-center"
                >
                  {t('community.viewDetails')}
                </button>

                <button
                  onClick={() => trackMapOnWorldMap(mapItem)}
                  className="w-full bg-white hover:bg-amber-100 text-black font-black py-2.5 px-4 border-2 border-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Target className="w-4 h-4 text-black" /> {t('community.trackOnMap')}
                </button>

                {canDeleteMap(mapItem) && (
                  <button
                    onClick={() => {
                      if (window.confirm(t('community.deleteConfirm', { title: mapItem.title }))) deleteCommunityMap(mapItem.id);
                    }}
                    className="w-full bg-white hover:bg-red-50 text-red-700 font-black py-2.5 px-4 border-2 border-red-700 text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" /> {t('community.deleteMyMap')}
                  </button>
                )}
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
