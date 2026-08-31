import { useState } from 'react';
import { Plus, Map, Trash2, Eye, Compass, Edit3 } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

export default function BaseMapsTab({ onOpenAddModal }) {
  const { baseMaps, deleteBaseMap, setMapBackgroundImage, navigateTo, showAdminToast } = useApp();

  const handleLaunchInEditor = (baseMap) => {
    if (baseMap.image) {
      setMapBackgroundImage(baseMap.image);
    }
    showAdminToast(`Loaded "${baseMap.name}" base terrain into Map Editor!`, 'success');
    navigateTo('editor');
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Top Banner (Matching Image 2) */}
      <div className="bg-white border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black flex items-center gap-2">
            <span>Manage Base Maps</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 font-bold mt-1">
            Curate the foundations of new quests.
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="self-start sm:self-center bg-[#cc0000] hover:bg-red-700 text-white font-black px-6 py-3 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add New Base Map</span>
        </button>
      </div>

      {/* Grid of Base Maps (Matching Image 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {baseMaps.map((map) => (
          <div
            key={map.id}
            className="bg-white border-4 border-black rounded-2xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between group hover:-translate-y-1 transition-transform"
          >
            {/* Map Preview Image Card Container */}
            <div className="relative h-44 bg-gray-200 border-b-4 border-black overflow-hidden">
              <img
                src={map.image}
                alt={map.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />

              {/* Yellow Pill Badge '● BASE' */}
              <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs border-2 border-black rounded-full px-2.5 py-0.5 flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <span className="w-2 h-2 rounded-full bg-amber-400 border border-black"></span>
                <span className="text-[10px] font-black uppercase text-black tracking-wider">
                  {map.badge || 'BASE'}
                </span>
              </div>
            </div>

            {/* Content & Actions */}
            <div className="p-4 flex flex-col justify-between flex-1 space-y-3">
              <div>
                <h3 className="font-black text-base uppercase text-black truncate mb-1">
                  {map.name}
                </h3>
                <p className="text-[11px] text-gray-500 font-sans font-medium line-clamp-2">
                  {map.description || 'Base landscape for player quests and world exploration.'}
                </p>
              </div>

              <div className="pt-2 border-t-2 border-gray-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleLaunchInEditor(map)}
                  className="flex-1 py-1.5 px-2 bg-amber-400 hover:bg-amber-300 text-black border-2 border-black rounded-lg text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Compass className="w-3 h-3" />
                  <span>Open in Editor</span>
                </button>

                <button
                  onClick={() => deleteBaseMap(map.id)}
                  title="Delete Base Map"
                  className="w-8 h-8 bg-gray-100 hover:bg-red-100 text-gray-700 hover:text-red-600 border-2 border-black rounded-lg flex items-center justify-center text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

