import { Map, X, ExternalLink, Compass } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

export default function TrainerMapsModal({ isOpen, trainer, onClose }) {
  const { navigateTo, trackMapOnWorldMap, communityMaps } = useApp();

  if (!isOpen || !trainer) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-mono animate-in fade-in duration-150">
      <div className="bg-white border-4 border-black rounded-2xl w-full max-w-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-amber-400 text-black p-4 border-b-4 border-black flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{trainer.avatar || '🧢'}</span>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider">{trainer.name}'s Cartography Roster</h3>
              <p className="text-[10px] text-gray-700 font-bold">{trainer.email} • {trainer.mapsCreated} Total Maps</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-black hover:bg-neutral-800 text-white rounded-lg border-2 border-white flex items-center justify-center cursor-pointer transition-transform active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <div className="text-xs font-black uppercase text-gray-600">Created Regional Maps</div>

          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {trainer.maps && trainer.maps.length > 0 ? (
              trainer.maps.map((mapName, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50 border-2 border-black rounded-xl p-3 flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-amber-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-amber-200 border-2 border-black rounded-lg flex items-center justify-center text-sm">
                      🗺️
                    </div>
                    <div>
                      <div className="text-xs font-black text-black">{mapName}</div>
                      <div className="text-[10px] text-gray-500 font-bold">Status: Published • Verified</div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onClose();
                      if (communityMaps && communityMaps[0]) {
                        trackMapOnWorldMap(communityMaps[0]);
                      } else {
                        navigateTo('community');
                      }
                    }}
                    className="px-2.5 py-1.5 bg-[#cc0000] hover:bg-red-700 text-white border-2 border-black rounded-lg text-[10px] font-black uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 cursor-pointer"
                  >
                    <span>Inspect</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-gray-500">
                No active custom maps registered for this trainer.
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 border-2 border-black rounded-xl font-bold text-xs uppercase cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

