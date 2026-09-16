import { useState, useEffect } from 'react';
import { Plus, Trash2, Compass, Star, Sparkles, Eye, Loader as Loader2 } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { fetchMapFeed } from '../../../lib/supabaseMaps';

export default function BaseMapsTab() {
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

  const [allMaps, setAllMaps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const maps = await fetchMapFeed();
        if (!cancelled) setAllMaps(maps);
      } catch (e) {
        console.warn('Failed to load user maps:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const isPromoted = (mapId) => baseMaps.some((b) => b.id === mapId);

  const togglePromote = async (map) => {
    const promote = !isPromoted(map.id);
    if (isAdminLoggedIn) await setMapBaseFlagFor(map.id, promote);
    if (promote) {
      setBaseMaps((prev) => [
        {
          id: map.id,
          ownerId: map.ownerId,
          name: map.title || 'Untitled Map',
          image: map.imageUrl || null,
          description: map.lore || map.region || 'Curated base map',
          badge: 'BASE',
        },
        ...prev.filter((b) => b.id !== map.id),
      ]);
      showAdminToast(`"${map.title || map.id}" promoted to base map.`, 'success');
    } else {
      setBaseMaps((prev) => prev.filter((b) => b.id !== map.id));
      showAdminToast(`"${map.title || map.id}" removed from base maps.`, 'info');
    }
  };

  const handleLaunchInEditor = (baseMap) => {
    const bg = baseMap.image || baseMap.imageUrl;
    if (bg) setMapBackgroundImage(bg);
    showAdminToast(`Loaded "${baseMap.name}" base terrain into Map Editor!`, 'success');
    navigateTo('editor');
  };

  const nonBaseMaps = allMaps.filter((m) => !isPromoted(m.id));

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
        <div className="text-[10px] font-black uppercase text-gray-500 bg-gray-100 border-2 border-black rounded-lg px-3 py-1.5">
          {baseMaps.length} {t('admin.base')} · {isAdminLoggedIn ? 'Synced to DB' : 'Local Only'}
        </div>
      </div>

      {/* Section 1: Current Base Maps (promoted from real user maps) */}
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
            No base maps yet. Promote a user-created map below.
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
                      onClick={() => togglePromote(map)}
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

      {/* Section 2: All user-created maps — pick base maps */}
      <div className="bg-white border-4 border-black rounded-2xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="bg-[#4862db] text-white border-b-4 border-black p-3.5 px-5 flex items-center justify-between">
          <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>{t('admin.liveRegistry')}</span>
          </h3>
          <span className="bg-white text-black text-[10px] font-black px-3 py-0.5 rounded-full border border-black">
            {nonBaseMaps.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-100 border-b-2 border-black text-gray-700 uppercase text-[10px] font-black tracking-wider">
              <tr>
                <th className="p-3.5 px-4">Map</th>
                <th className="p-3.5">Region</th>
                <th className="p-3.5">Pins</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-gray-100 font-bold">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500 text-xs">
                    <Loader2 className="w-4 h-4 inline animate-spin mr-2" />
                    {t('admin.loadingDb')}
                  </td>
                </tr>
              ) : nonBaseMaps.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500 text-xs">
                    No user-created maps found. Ask trainers to create and publish maps first.
                  </td>
                </tr>
              ) : (
                nonBaseMaps.map((m) => (
                  <tr key={m.id} className="hover:bg-amber-50/50 transition-colors">
                    <td className="p-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 text-center">🗺️</span>
                        <span className="font-black text-black">{m.title || 'Untitled Map'}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-gray-600">{m.region || 'Global Realm'}</td>
                    <td className="p-3.5 font-black text-indigo-700">{m.pinCount ?? 0}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase ${m.privacy === 'private' ? 'bg-gray-100 text-gray-600 border-gray-400' : 'bg-emerald-100 text-emerald-800 border-emerald-400'}`}>
                        {m.privacy === 'private' ? 'Draft' : 'Published'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => togglePromote(m)}
                        className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 border-2 border-black rounded-lg text-[10px] font-black uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                      >
                        Promote to Base
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}