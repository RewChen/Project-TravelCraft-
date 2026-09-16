import { Compass, Star, Eye, Plus } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

export default function BaseMapsTab({ onOpenAddModal }) {
  const {
    baseMaps,
    setBaseMaps,
    setMapBackgroundImage,
    setMapBaseFlagFor,
    navigateTo,
    showAdminToast,
    isAdminLoggedIn,
    t,
  } = useApp();

  const demote = async (map) => {
    if (!isAdminLoggedIn) {
      setBaseMaps((prev) => prev.filter((b) => b.id !== map.id));
      showAdminToast(`"${map.name}" removed locally only (not saved to DB).`, 'warning');
      return;
    }
    const ok = await setMapBaseFlagFor(map.id, false);
    if (!ok) return;
    setBaseMaps((prev) => prev.filter((b) => b.id !== map.id));
    showAdminToast(`"${map.name}" demoted from base maps.`, 'info');
  };

  const handleLaunchInEditor = (baseMap) => {
    const bg = baseMap.image || baseMap.imageUrl;
    if (bg) setMapBackgroundImage(bg);
    showAdminToast(`Loaded "${baseMap.name}" base terrain into Map Editor!`, 'success');
    navigateTo('editor');
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Top Banner */}
      <div className="bg-white border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black flex items-center gap-2">
            <span>{t('admin.manageBaseMaps')}</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 font-bold mt-1">
            {t('admin.curateFoundations')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="text-[10px] font-black uppercase text-gray-500 bg-gray-100 border-2 border-black rounded-lg px-3 py-1.5">
            {baseMaps.length} {t('admin.base')} · {isAdminLoggedIn ? 'Synced to DB' : 'Local Only'}
          </div>
          <button
            onClick={() => onOpenAddModal?.()}
            className="px-4 py-2 bg-[#cc0000] hover:bg-red-700 text-white border-2 border-black rounded-xl text-xs font-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 cursor-pointer transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('admin.addNewBaseMap')}</span>
          </button>
        </div>
      </div>

      {/* Active Base Maps */}
      <div className="bg-white border-4 border-black rounded-2xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="bg-[#eab308] border-b-4 border-black p-3.5 px-5 flex items-center justify-between">
          <h3 className="font-black text-sm uppercase tracking-wider text-black flex items-center gap-2">
            <Star className="w-4 h-4" />
            <span>Active Base Maps</span>
          </h3>
          <span className="bg-white text-black text-[10px] font-black px-3 py-0.5 rounded-full border border-black">
            {baseMaps.length}
          </span>
        </div>

        {baseMaps.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-500 font-bold">
            No base maps yet. Add one with the button above.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
            {baseMaps.map((map) => (
              <div
                key={map.id}
                className="bg-white border-4 border-black rounded-2xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between group hover:-translate-y-1 transition-transform"
              >
                <div className="relative h-40 bg-gray-200 border-b-4 border-black overflow-hidden">
                  {map.image ? (
                    <img
                      src={map.image}
                      alt={map.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl bg-gray-100">
                      🗺️
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 bg-white/90 border-2 border-black rounded-full px-2.5 py-0.5 flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <span className="w-2 h-2 rounded-full bg-amber-400 border border-black"></span>
                    <span className="text-[10px] font-black uppercase text-black tracking-wider">
                      {map.badge || t('admin.base')}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex flex-col justify-between flex-1 space-y-3">
                  <div>
                    <h3 className="font-black text-base uppercase text-black truncate mb-1">
                      {map.name}
                    </h3>
                    <p className="text-[11px] text-gray-500 font-sans font-medium line-clamp-2">
                      {map.description}
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
                        onClick={() => demote(map)}
                        className="py-1.5 px-2 bg-[#cc0000] hover:bg-red-700 text-white border-2 border-black rounded-lg text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 cursor-pointer"
                      >
                      <Eye className="w-3 h-3" />
                      <span>Demote</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}