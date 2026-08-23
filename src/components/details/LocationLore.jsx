import { BookOpen, Calendar, MapPin } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function LocationLore() {
  const { selectedLocation } = useApp();

  return (
    <div className="bg-white border-4 border-black rounded-xl p-5 sm:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <h3 className="text-lg font-black flex items-center gap-2 mb-4 border-b-2 border-black pb-2">
        <BookOpen className="w-5 h-5 text-red-600" /> Lore & Data
      </h3>
      <p className="text-sm text-gray-700 font-sans leading-relaxed mb-6">
        {selectedLocation.lore}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="border-2 border-black rounded-lg p-3 text-xs">
          <div className="font-bold text-red-600 flex items-center gap-1 mb-1">
            <Calendar className="w-3 h-3"/> Hours
          </div>
          <div className="font-black">{selectedLocation.hours}</div>
        </div>
        <div className="border-2 border-black rounded-lg p-3 text-xs">
          <div className="font-bold text-red-600 flex items-center gap-1 mb-1">
            <BookOpen className="w-3 h-3"/> Entry Fee
          </div>
          <div className="font-black">{selectedLocation.fee}</div>
        </div>
        <div className="border-2 border-black rounded-lg p-3 text-xs">
          <div className="font-bold text-red-600 flex items-center gap-1 mb-1">
            <Calendar className="w-3 h-3"/> Best Time
          </div>
          <div className="font-black">{selectedLocation.bestTime}</div>
        </div>
        <div className="border-2 border-black rounded-lg p-3 text-xs">
          <div className="font-bold text-red-600 flex items-center gap-1 mb-1">
            <MapPin className="w-3 h-3"/> Travel
          </div>
          <div className="font-black">{selectedLocation.travel}</div>
        </div>
      </div>
    </div>
  );
}
