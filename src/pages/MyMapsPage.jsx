import { useState } from 'react';
import { Map, Plus, Star, MapPin, Globe, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function MyMapsPage() {
  const { navigateTo, favorites, publishMapToCommunity, isLoggedIn } = useApp();
  const [publishedSuccess, setPublishedSuccess] = useState('');

  const myMapsList = [
    {
      id: 1,
      title: 'Kyoto Temple Crawl',
      region: 'Kyoto, Japan',
      spotsCount: 12,
      badge: 'Completed',
      color: 'bg-amber-100',
      description: 'A curated route through historic shrines and tranquil gardens.'
    },
    {
      id: 2,
      title: 'Paris Scenic Highlights',
      region: 'Paris, France',
      spotsCount: 8,
      badge: 'Active Quest',
      color: 'bg-sky-100',
      description: 'Iconic landmarks from Eiffel Tower to Seine riverfront.'
    },
    {
      id: 3,
      title: 'Retro Cafe Safari',
      region: 'Tokyo, Japan',
      spotsCount: 5,
      badge: 'Draft',
      color: 'bg-emerald-100',
      description: 'Pixel cafes and cozy coffee stops for traveling trainers.'
    }
  ];

  const handlePublishMap = (mapItem) => {
    publishMapToCommunity(mapItem);
    setPublishedSuccess(`Published "${mapItem.title}" to Community Discoveries! +150 Coins earned!`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pb-12 space-y-8 font-mono">
      
      {/* Header Banner */}
      <div className="bg-white border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Map className="w-6 h-6 text-red-600" />
            <h1 className="text-2xl font-black uppercase">My Custom Maps</h1>
          </div>
          <p className="text-xs text-gray-600 font-sans">
            Manage your personal travel routes, publish your maps to the Community, and review favorited POIs.
          </p>
        </div>

        <button 
          onClick={() => isLoggedIn ? navigateTo('editor') : navigateTo('auth')}
          className="bg-[#cc0000] hover:bg-red-700 text-white font-black px-4 py-2.5 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 text-xs uppercase cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create New Map
        </button>
      </div>

      {/* Success Alert Banner */}
      {publishedSuccess && (
        <div className="bg-emerald-100 border-4 border-black p-4 rounded-xl text-emerald-950 font-black text-xs flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-in fade-in">
          <Check className="w-5 h-5 text-emerald-700 stroke-[3]" />
          <span>{publishedSuccess}</span>
        </div>
      )}

      {/* Favorites Quick Access */}
      <div className="bg-amber-50 border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-lg font-black uppercase mb-3 flex items-center gap-2 text-amber-900">
          <Star className="w-5 h-5 fill-amber-500 text-amber-600" /> Favorited Locations ({favorites.length})
        </h2>
        {favorites.length === 0 ? (
          <p className="text-xs text-gray-500">No favorite locations saved yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {favorites.map((item, idx) => (
              <div 
                key={idx}
                onClick={() => navigateTo('details', {
                  title: item,
                  region: item === 'Eiffel Tower' ? 'Paris, France' : 'Kyoto, Japan',
                  type: item === 'Eiffel Tower' ? 'Landmark' : 'Shrine',
                  tag: 'Scenic',
                  lore: 'One of your saved favorite destinations.',
                  hours: '09:00 - 20:00',
                  fee: 'Varies',
                  bestTime: 'Anytime',
                  travel: 'Metro / City Bus',
                  popularity: 95,
                  visitors: 'Millions',
                  rarity: 'Legendary'
                })}
                className="bg-white border-2 border-black rounded-lg p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center cursor-pointer hover:bg-amber-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-600" />
                  <span className="text-xs font-bold">{item}</span>
                </div>
                <span className="text-[10px] text-red-600 font-black">View →</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Map List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {myMapsList.map((map) => (
          <div 
            key={map.id}
            className="bg-white border-4 border-black rounded-2xl p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-3">
                <span className={`text-[10px] font-black px-2 py-0.5 border-2 border-black rounded ${map.color}`}>
                  {map.badge}
                </span>
                <span className="text-xs font-bold text-gray-500">📍 {map.spotsCount} Spots</span>
              </div>
              <h3 className="text-lg font-black mb-1">{map.title}</h3>
              <p className="text-[11px] text-gray-500 font-bold mb-3">{map.region}</p>
              <p className="text-xs text-gray-700 font-sans leading-relaxed mb-6">
                {map.description}
              </p>
            </div>
            
            <div className="space-y-2">
              {/* Publish Map to Community Button (for Cartographers / Creators) */}
              <button 
                onClick={() => handlePublishMap(map)}
                className="w-full bg-amber-400 hover:bg-amber-300 text-black font-black py-2 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-all active:translate-y-0.5"
              >
                <Globe className="w-4 h-4" /> Publish to Community (+150 Coins)
              </button>

              <button 
                onClick={() => navigateTo('map')}
                className="w-full bg-[#cc0000] text-white font-bold py-2 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs uppercase hover:bg-red-700 cursor-pointer"
              >
                Open Map →
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
