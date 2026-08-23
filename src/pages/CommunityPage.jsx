import { useState } from 'react';
import { Search, Mountain, Trees, Building2, Target } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function CommunityPage() {
  const { communityMaps, trackMapOnWorldMap, navigateTo } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');

  const categories = [
    { id: 'ALL', label: 'ALL', icon: null },
    { id: 'landmarks', label: 'LANDMARKS', icon: Mountain },
    { id: 'nature', label: 'NATURE', icon: Trees },
    { id: 'urban', label: 'URBAN', icon: Building2 }
  ];

  const filteredMaps = communityMaps.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.discoveredBy.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'ALL' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 pb-16 font-mono text-black">
      
      {/* Main Title Section */}
      <div className="text-center my-8 space-y-2">
        <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight">
          COMMUNITY DISCOVERIES
        </h1>
        <p className="text-sm font-sans font-bold text-gray-700 underline decoration-2 underline-offset-4">
          Explore what other trainers have found
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-800" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="SEARCH DESTINATIONS..." 
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
              <span>{cat.label}</span>
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
              title="Click to Track on World Map"
            >
              <img 
                src={mapItem.imageUrl} 
                alt={mapItem.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="bg-amber-400 border-2 border-black px-3 py-1 text-xs font-black text-black uppercase rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  🎯 Track on World Map
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
                <div className="flex items-center justify-between text-xs font-bold text-gray-800 mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 border border-black ${mapItem.authorBadgeColor}`}></div>
                    <span>Discovered by <strong className="font-black text-black">{mapItem.discoveredBy}</strong></span>
                  </div>
                  <span className="text-[9px] bg-amber-100 border border-black px-1.5 py-0.5 rounded font-black uppercase text-amber-900">
                    {mapItem.authorRole || 'Cartographer'}
                  </span>
                </div>

                {/* Popularity Level Bar */}
                <div className="bg-gray-50 border-2 border-black p-2 rounded-lg mb-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex justify-between text-[11px] font-black mb-1">
                    <span>Popularity:</span>
                    <span>Lv. {mapItem.popularityLv}</span>
                  </div>
                  <div className="h-3 w-full border-2 border-black bg-white rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        mapItem.popularityLv > 90 ? 'bg-emerald-500' :
                        mapItem.popularityLv > 80 ? 'bg-sky-500' : 'bg-purple-500'
                      } border-r-2 border-black`}
                      style={{ width: `${mapItem.popularityLv}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => navigateTo('details', mapItem.details)}
                  className="w-full bg-black text-white hover:bg-gray-800 font-black py-2.5 px-4 border-2 border-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition-colors cursor-pointer text-center"
                >
                  VIEW DETAILS
                </button>

                <button
                  onClick={() => trackMapOnWorldMap(mapItem)}
                  className="w-full bg-white hover:bg-amber-100 text-black font-black py-2.5 px-4 border-2 border-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Target className="w-4 h-4 text-black" /> TRACK ON MAP
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
