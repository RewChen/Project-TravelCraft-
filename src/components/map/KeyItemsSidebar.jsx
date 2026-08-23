import { Calendar, Camera, Map } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function KeyItemsSidebar({ onOpenUpload, onOpenMapBgModal }) {
  const { mapFilters, toggleFilter, mapPins, mapBackgroundImage } = useApp();

  const userPhotoCount = mapPins.filter((p) => p.isUserUploaded || p.category === 'photos').length;

  return (
    <div className="absolute top-4 left-4 w-64 bg-white border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-20 overflow-hidden font-mono">
      <div className="bg-[#cc0000] text-white p-2.5 border-b-4 border-black font-black text-xs flex justify-between items-center uppercase tracking-wider">
        <span>KEY ITEMS & FILTERS</span>
        <Calendar className="w-4 h-4" />
      </div>
      <div className="p-3 space-y-2 text-xs font-bold text-gray-800">
        <label className="flex items-center justify-between cursor-pointer hover:bg-gray-100 p-1 rounded">
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={mapFilters.temples} 
              onChange={() => toggleFilter('temples')}
              className="w-4 h-4 border-2 border-black rounded-none cursor-pointer" 
            />
            <span className="text-blue-600">⛩️ Temples</span>
          </div>
          <span className="text-[10px] text-gray-500">x12</span>
        </label>

        <label className="flex items-center justify-between cursor-pointer hover:bg-gray-100 p-1 rounded">
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={mapFilters.cafes} 
              onChange={() => toggleFilter('cafes')}
              className="w-4 h-4 border-2 border-black rounded-none cursor-pointer" 
            />
            <span className="text-amber-700">☕ Cafes</span>
          </div>
          <span className="text-[10px] text-gray-500">x05</span>
        </label>

        <label className="flex items-center justify-between cursor-pointer hover:bg-gray-100 p-1 rounded">
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={mapFilters.viewpoints} 
              onChange={() => toggleFilter('viewpoints')}
              className="w-4 h-4 border-2 border-black rounded-none cursor-pointer" 
            />
            <span className="text-emerald-700">⛰️ Viewpoints</span>
          </div>
          <span className="text-[10px] text-gray-500">x08</span>
        </label>

        <label className="flex items-center justify-between cursor-pointer hover:bg-gray-100 p-1 rounded">
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={mapFilters.photos} 
              onChange={() => toggleFilter('photos')}
              className="w-4 h-4 border-2 border-black rounded-none cursor-pointer" 
            />
            <span className="text-red-600">📷 Photo Pins</span>
          </div>
          <span className="text-[10px] text-gray-500">x0{userPhotoCount}</span>
        </label>
      </div>

      <div className="p-2 border-t-2 border-black bg-amber-50 space-y-1.5">
        <button
          onClick={onOpenMapBgModal}
          className="w-full bg-amber-400 hover:bg-amber-300 text-black font-black py-2 px-3 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-[11px] uppercase flex items-center justify-center gap-2 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
        >
          <Map className="w-4 h-4" /> {mapBackgroundImage ? 'Change Map Image' : 'Upload Whole Map'}
        </button>

        <button
          onClick={onOpenUpload}
          className="w-full bg-[#cc0000] hover:bg-red-700 text-white font-black py-2 px-3 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-[11px] uppercase flex items-center justify-center gap-2 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
        >
          <Camera className="w-4 h-4" /> Add Photo Pin
        </button>
      </div>
    </div>
  );
}
