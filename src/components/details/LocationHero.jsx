import { MapPin, ImageIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function LocationHero() {
  const { selectedLocation } = useApp();

  return (
    <div className="bg-white border-4 border-black rounded-2xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      <div className="h-64 bg-slate-900 relative p-4 flex flex-col justify-between">
        <div className="inline-flex items-center gap-1.5 bg-indigo-500/80 backdrop-blur text-white px-3 py-1 rounded-full text-[10px] font-bold border border-white/20 w-fit">
          <MapPin className="w-3 h-3" /> {selectedLocation.region || 'Paris, France'}
        </div>
        <div className="text-white/20 font-black text-xl text-center self-center w-full select-none flex items-center justify-center">
          <ImageIcon className="w-12 h-12 mr-3" /> [Location Photo Preview]
        </div>
      </div>
      
      <div className="bg-[#cc0000] text-white p-5 border-t-4 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight drop-shadow-md">
          {selectedLocation.title}
        </h1>
        <div className="flex gap-2">
          <span className="bg-amber-400 text-black border-2 border-black px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            ★ {selectedLocation.type || 'Landmark'}
          </span>
          <span className="bg-white text-black border-2 border-black px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            📷 {selectedLocation.tag || 'Scenic'}
          </span>
        </div>
      </div>
    </div>
  );
}
