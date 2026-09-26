import { Compass, Star, Eye, Plus } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

export default function BaseMapsTab({ onOpenAddModal }) {
  const {
    baseMaps,
    setBaseMaps,
    setMapBackgroundImage,
    setMapBackgroundSize,
    setMapBaseFlagFor,
    navigateTo,
    showAdminToast,
    isAdminLoggedIn,
    t,
  } = useApp();

  const demote = async (map) => {
    if (!isAdminLoggedIn) {
      setBaseMaps((prev) => prev.filter((b) => b.id !== map.id));
      showAdminToast(`"${map.name}" removed locally only (DB requires an admin).`, 'warning');
      return;
    }
    const ok = await setMapBaseFlagFor(map.id, false);
    if (!ok) return;
    setBaseMaps((prev) => prev.filter((b) => b.id !== map.id));
    showAdminToast(`"${map.name}" removed from base maps.`, 'info');
  };

  const handleLaunchInEditor = (baseMap) => {
    const bg = baseMap.image || baseMap.imageUrl;
    if (bg) {
      setMapBackgroundImage(bg);
      setMapBackgroundSize(null);
    }
    showAdminToast(`Loaded "${baseMap.name}" base terrain into Map Editor!`, 'success');
    navigateTo('editor');
  };

  return (
    <div className="space-y-6 font-thai">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl ring-1 ring-brand-dark/[0.06] shadow-[0_4px_20px_-10px_rgba(45,58,46,0.10)] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-tight text-brand-dark flex items-center gap-2">
            <span>{t('admin.manageBaseMaps')}</span>
          </h2>
          <p className="text-xs sm:text-sm text-brand-dark/50 font-medium mt-1">
            {t('admin.curateFoundations')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="text-[10px] font-semibold uppercase text-brand-dark/50 bg-brand-light/60 rounded-full px-3 py-1.5 ring-1 ring-brand-dark/[0.06]">
            {baseMaps.length} {t('admin.base')} · {isAdminLoggedIn ? 'Synced to DB' : 'Local Only'}
          </div>
          <button
            onClick={() => onOpenAddModal?.()}
            className="px-4 py-2 bg-[#cc0000] hover:bg-red-700 text-white rounded-full text-xs font-semibold uppercase flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('admin.addNewBaseMap')}</span>
          </button>
        </div>
      </div>

      {/* Active Base Maps */}
      <div className="bg-white rounded-3xl overflow-hidden ring-1 ring-brand-dark/[0.06] shadow-[0_4px_20px_-10px_rgba(45,58,46,0.10)]">
        <div className="bg-brand-light/60 border-b border-brand-dark/[0.06] p-3.5 px-5 flex items-center justify-between text-brand-dark">
          <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
            <Star className="w-4 h-4" />
            <span>Active Base Maps</span>
          </h3>
          <span className="bg-white text-brand-dark text-[10px] font-bold px-3 py-0.5 rounded-full ring-1 ring-brand-dark/10">
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
                className="bg-white rounded-3xl overflow-hidden ring-1 ring-brand-dark/[0.06] shadow-[0_4px_20px_-10px_rgba(45,58,46,0.10)] flex flex-col justify-between group hover:-translate-y-1 transition-transform"
              >
                <div className="relative h-40 bg-brand-light/60 border-b border-brand-dark/[0.06] overflow-hidden">
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
                  <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur rounded-full px-2.5 py-0.5 flex items-center gap-1.5 ring-1 ring-brand-dark/10">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    <span className="text-[10px] font-semibold uppercase text-brand-dark tracking-wider">
                      {map.badge || t('admin.base')}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex flex-col justify-between flex-1 space-y-3">
                  <div>
                    <h3 className="font-bold text-base uppercase text-brand-dark truncate mb-1">
                      {map.name}
                    </h3>
                    <p className="text-[11px] text-brand-dark/50 font-sans font-medium line-clamp-2">
                      {map.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-brand-dark/[0.06] flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleLaunchInEditor(map)}
                      className="flex-1 py-1.5 px-2 bg-amber-400 hover:bg-amber-300 text-brand-dark rounded-full text-[10px] font-semibold uppercase flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Compass className="w-3 h-3" />
                      <span>Open in Editor</span>
                    </button>
<button
                        onClick={() => demote(map)}
                        className="py-1.5 px-2 bg-[#cc0000] hover:bg-red-700 text-white rounded-full text-[10px] font-semibold uppercase flex items-center gap-1 cursor-pointer"
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