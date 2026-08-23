import { MapPin, ImageIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function LocationHero() {
  const { selectedLocation } = useApp();
  const fallbackImage = selectedLocation.title?.toLowerCase().includes('kyoto')
    ? 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1400&q=85'
    : selectedLocation.title?.toLowerCase().includes('grand canyon')
      ? 'https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=1400&q=85'
      : 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=1400&q=85';

  return (
    <div className="bg-white border-4 border-black rounded-2xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      <div className="h-64 bg-slate-900 relative p-4 flex flex-col justify-between overflow-hidden">
        <img src={selectedLocation.imageUrl || fallbackImage} alt={selectedLocation.title} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/25" />
        <div className="inline-flex items-center gap-1.5 bg-indigo-500/80 backdrop-blur text-white px-3 py-1 rounded-full text-[10px] font-bold border border-white/20 w-fit">
          <MapPin className="w-3 h-3" /> {selectedLocation.region || 'Paris, France'}
        </div>
        <ImageIcon className="absolute bottom-4 right-4 w-8 h-8 text-white/70" />
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
