import { BarChart2, User, Heart, Share2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function LocationStats() {
  const { selectedLocation, favorites, toggleFavorite } = useApp();

  const isFav = favorites.includes(selectedLocation.title);

  return (
    <div className="bg-[#e8ecef] border-4 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <h3 className="text-lg font-black flex items-center gap-2 mb-4 border-b-2 border-black pb-2 text-amber-700">
        <BarChart2 className="w-5 h-5" /> Location Stats
      </h3>
      
      <div className="mb-4">
        <div className="flex justify-between text-xs font-bold mb-1">
          <span>Popularity Level</span>
          <span className="text-red-600">Lv. {selectedLocation.popularity || 99}</span>
        </div>
        <div className="h-3 w-full border-2 border-black rounded-full bg-white overflow-hidden">
          <div 
            className="h-full bg-red-600 border-r-2 border-black transition-all duration-500" 
            style={{ width: `${selectedLocation.popularity || 95}%` }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white border-2 border-black rounded-lg p-2 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <User className="w-4 h-4 mx-auto text-red-600 mb-1" />
          <div className="text-[9px] font-bold text-gray-500 uppercase">Visitors</div>
          <div className="text-xs font-black">{selectedLocation.visitors}</div>
        </div>
        <div className="bg-white border-2 border-black rounded-lg p-2 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <span className="text-amber-500 text-sm block mb-1">🎖️</span>
          <div className="text-[9px] font-bold text-gray-500 uppercase">Rarity</div>
          <div className="text-xs font-black">{selectedLocation.rarity}</div>
        </div>
      </div>

      <button 
        onClick={() => toggleFavorite(selectedLocation.title)}
        className={`w-full ${
          isFav ? 'bg-amber-400 text-black' : 'bg-[#cc0000] text-white hover:bg-red-700'
        } font-bold py-2.5 px-4 rounded border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 mb-3 flex items-center justify-center gap-2 text-sm transition-all`}
      >
        <Heart className={`w-4 h-4 ${isFav ? 'fill-black' : 'fill-white'}`} />
        {isFav ? 'In Favorites' : 'Add to Favorites'}
      </button>

      <button className="w-full bg-white hover:bg-gray-50 text-black font-bold py-2 px-4 rounded border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-2 text-xs transition-all">
        <Share2 className="w-4 h-4" /> Share Location
      </button>
    </div>
  );
}
