import { User, Camera } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function MapPins() {
  const { mapPins, selectedPin, setSelectedPin, mapFilters } = useApp();

  return (
    <>
      {/* Player Pin */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center pointer-events-none">
        <div className="w-8 h-10 bg-[#cc0000] border-2 border-black rounded-t-full flex items-center justify-center shadow-lg relative z-10">
          <User className="w-5 h-5 text-white" />
        </div>
        <div className="w-8 bg-white border border-black text-[8px] font-black text-center py-0.5 mt-[-2px] shadow-sm z-20">YOU</div>
      </div>

      {/* Render Map Pins */}
      {mapPins.map((pin) => {
        // Filter check
        const categoryKey = pin.category || 'photos';
        if (mapFilters[categoryKey] === false) return null;

        const isSelected = selectedPin?.id === pin.id;

        return (
          <div
            key={pin.id}
            style={{ top: pin.top || '50%', left: pin.left || '50%' }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer transition-transform duration-200 ${
              isSelected ? 'scale-125 z-30' : 'hover:scale-110'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPin(pin);
            }}
          >
            {/* Custom Photo Pin */}
            {pin.isUserUploaded || pin.imageUrl ? (
              <div className="relative group">
                <div className="w-11 h-11 bg-white border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex items-center justify-center bg-cover bg-center">
                  {pin.imageUrl ? (
                    <img src={pin.imageUrl} alt={pin.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg">📷</span>
                  )}
                </div>
                <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 border-2 border-black rounded-full flex items-center justify-center text-white text-[9px] font-black shadow-sm">
                  <Camera className="w-2.5 h-2.5" />
                </div>
                <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] font-extrabold px-2 py-0.5 rounded border border-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-40">
                  {pin.title}
                </div>
              </div>
            ) : (
              /* Standard Preset Pin */
              <div className="relative group">
                <div className={`w-10 h-10 ${
                  pin.category === 'temples' ? 'bg-blue-600' :
                  pin.category === 'cafes' ? 'bg-amber-400' :
                  pin.category === 'viewpoints' ? 'bg-emerald-500' : 'bg-indigo-600'
                } border-4 border-black rounded-full flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] animate-bounce`}>
                  <span className="text-white text-sm">{pin.icon || '📍'}</span>
                </div>
                <div className="absolute top-11 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] font-extrabold px-2 py-0.5 rounded border border-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-40">
                  {pin.title}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
