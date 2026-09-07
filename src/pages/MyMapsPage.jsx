import { useState } from 'react';
import { Map, Plus, Star, MapPin, Globe, Check, Trash2, Edit3, ImageOff, Eye, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import CreateMapForm from '../components/map/CreateMapForm';

const badgeIcon = (name) => ({ Cartographer: '🗺️', 'Master Builder': '🧱', Storyteller: '📖' }[name] || '🏅');

function CardCover({ imageUrl, title }) {
  const [failed, setFailed] = useState(false);
  if (!imageUrl || failed) {
    return (
      <div className="mb-3 -mx-1 h-28 border-2 border-dashed border-black rounded bg-gray-50 flex flex-col items-center justify-center gap-1 text-gray-400">
        <ImageOff className="w-6 h-6" />
        <span className="text-[10px] font-black uppercase">No Cover</span>
      </div>
    );
  }
  return (
    <div className="mb-3 -mx-1">
      <img src={imageUrl} alt={title} onError={() => setFailed(true)} className="w-full h-28 object-cover border-2 border-black rounded bg-gray-100" />
    </div>
  );
}

function PreviewCover({ imageUrl, title }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="mb-3 h-44 border-2 border-black rounded bg-[#a2d2ff] overflow-hidden flex items-center justify-center">
      {imageUrl && !failed ? (
        <img src={imageUrl} alt={title} onError={() => setFailed(true)} className="w-full h-full object-cover" />
      ) : (
        <span className="font-black uppercase text-xs text-gray-700">No Cover</span>
      )}
    </div>
  );
}

export default function MyMapsPage() {
const { t, navigateTo, favorites, publishMapToCommunity, isLoggedIn, setEditorSetup, communityMaps, userProfile, deleteCommunityMap, trackMapOnWorldMap } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [publishedSuccess, setPublishedSuccess] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [publishTarget, setPublishTarget] = useState(null);
  const [previewTarget, setPreviewTarget] = useState(null);

  const startDesigning = (data) => {
    setEditorSetup({
      id: data.id,
      title: data.title,
      description: data.description,
      locationCity: data.locationCity,
      region: data.region || data.locationCity,
      imageUrl: data.imageUrl || '',
      rarity: data.rarityTier || 'common',
      hours: data.hours,
      fee: data.fee,
      bestTime: data.bestTime,
      travel: data.travel,
      tags: data.tags || [],
      privacy: data.privacy || 'public',
      logs: []
    });
    setShowCreateModal(false);
    navigateTo('editor');
  };

const openMapInEditor = (mapItem) => {
    setEditorSetup({
      id: mapItem.id,
      title: mapItem.details?.title || mapItem.title,
      description: mapItem.details?.lore || mapItem.description,
      hours: mapItem.details?.hours || '',
      fee: mapItem.details?.fee || '',
      bestTime: mapItem.details?.bestTime || '',
      travel: mapItem.details?.travel || '',
      logs: mapItem.details?.logs || [],
      tags: mapItem.tags || [],
      privacy: mapItem.privacy || 'public',
      imageUrl: mapItem.imageUrl || '',
      rarity: mapItem.rarity || 'common',
      isExistingMap: true,
      editorState: mapItem.editorState || null
    });
    navigateTo('editor');
  };

  const myMapsList = (communityMaps || [])
    .filter(mapItem => 
      mapItem.ownerId 
        ? mapItem.ownerId === userProfile?.id 
        : mapItem.discoveredBy === userProfile?.name
    )
    .map(mapItem => ({
      ...mapItem,
      badge: mapItem.privacy === 'private' ? 'Draft' : 'Published',
      color: mapItem.privacy === 'private' ? 'bg-emerald-100' : 'bg-sky-100',
      description: mapItem.details?.lore || 'A custom map.',
      region: mapItem.details?.region || 'Custom Realm'
    }));

  const handlePublishMap = (mapItem) => {
    publishMapToCommunity(mapItem);
    setPublishedSuccess(t('myMaps.publishedMsg', { title: mapItem.title }));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pb-12 space-y-8 font-mono">
      
      {/* Header Banner */}
      <div className="bg-white border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Map className="w-6 h-6 text-red-600" />
            <h1 className="text-2xl font-black uppercase">{t('myMaps.title')}</h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 font-sans">
            {t('myMaps.subtitle')}
          </p>
          {Array.isArray(userProfile?.badges) && userProfile.badges.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {userProfile.badges.map((b) => (
                <span key={b} className="inline-flex items-center gap-1 bg-amber-50 border-2 border-black rounded-full px-2 py-0.5 text-[9px] font-black uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                  <span>{badgeIcon(b)}</span> {b}
                </span>
              ))}
            </div>
          )}
        </div>

        <button 
          onClick={() => isLoggedIn ? setShowCreateModal(true) : navigateTo('auth')}
          className="bg-[#cc0000] hover:bg-red-700 text-white font-black px-4 py-2.5 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 text-xs uppercase cursor-pointer"
        >
          <Plus className="w-4 h-4" /> {t('myMaps.createNewMap')}
        </button>
      </div>

      {showCreateModal && <CreateMapForm onSubmit={startDesigning} onClose={() => setShowCreateModal(false)} />}

      {/* Success Alert Banner */}
      {publishedSuccess && (
        <div className="bg-emerald-100 border-4 border-black p-4 rounded-xl text-emerald-950 font-black text-xs flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-in fade-in">
          <Check className="w-5 h-5 text-emerald-700 stroke-[3]" />
          <span>{publishedSuccess}</span>
        </div>
      )}

      {/* Map List Grid */}
      {myMapsList.length === 0 ? (
        <div className="bg-white border-4 border-black rounded-2xl p-8 text-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-slate-600 dark:text-slate-300 font-bold mb-4">You haven't created any maps yet.</p>
          <button onClick={() => isLoggedIn ? setShowCreateModal(true) : navigateTo('auth')} className="bg-[#cc0000] text-white font-black px-6 py-2 rounded-xl border-2 border-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            Create Your First Map
          </button>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {myMapsList.map((map) => (
          <div 
            key={map.id}
            className="bg-white border-4 border-black rounded-2xl p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-3">
                <span className={`text-[10px] font-black px-2 py-0.5 border-2 border-black rounded ${map.color}`}>
                  {map.badge}
                </span>
              </div>
              <CardCover imageUrl={map.imageUrl} title={map.title} />
              <h3 className="text-lg font-black mb-1 text-slate-900">{map.title}</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold mb-3">{map.region}</p>
              <p className="text-xs text-slate-700 dark:text-slate-200 font-sans leading-relaxed mb-6">
                {map.description}
              </p>
            </div>
            
            <div className="space-y-2">
              {map.privacy === 'private' && (
                <button 
                  onClick={() => setPublishTarget(map)}
                  className="w-full bg-amber-400 hover:bg-amber-300 text-black font-black py-2 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-all active:translate-y-0.5"
                >
                  <Globe className="w-4 h-4" /> Publish to Community
                </button>
              )}

              <button 
                onClick={() => setPreviewTarget(map)}
                className="w-full bg-[#cc0000] text-white font-bold py-2 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs uppercase hover:bg-red-700 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Eye className="w-4 h-4" /> Preview Map
              </button>

              <button
                onClick={() => openMapInEditor(map)}
                className="w-full bg-[#4895ef] text-white font-bold py-2 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs uppercase hover:bg-blue-600 cursor-pointer flex justify-center items-center gap-1.5"
              >
                <Edit3 className="w-4 h-4" /> Edit Map
              </button>

              <button
                onClick={() => setDeleteTarget(map)}
                className="w-full bg-white text-red-600 font-bold py-2 rounded-lg border-2 border-red-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs uppercase hover:bg-red-50 cursor-pointer flex justify-center items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Delete Map
              </button>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Favorites Quick Access */}
      <div className="bg-amber-50 border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-lg font-black uppercase mb-3 flex items-center gap-2 text-amber-900">
          <Star className="w-5 h-5 fill-amber-500 text-amber-600" /> {t('myMaps.favoritesTitle')} ({favorites.length})
        </h2>
        {favorites.length === 0 ? (
          <p className="text-xs text-slate-600 dark:text-slate-300">{t('myMaps.noFavorites')}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {favorites.map((item, idx) => (
              <div 
                key={idx}
                onClick={() => navigateTo('details', {
                  title: item,
                  region: item === 'Eiffel Tower' ? 'Paris, France' : 'Kyoto, Japan',
                  type: item === 'Eiffel Tower' ? 'Landmark' : 'Shrine',
                  tag: 'Scenic',
                  lore: t('myMaps.sampleLore'),
                  hours: '09:00 - 20:00',
                  fee: 'Varies',
                  bestTime: 'Anytime',
                  travel: 'Metro / City Bus',
                  popularity: 95,
                  visitors: 'Millions',
                  rarity: 'Legendary'
                })}
                className="bg-white border-2 border-black rounded-lg p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center cursor-pointer hover:bg-amber-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-600" />
                  <span className="text-xs font-bold">{item}</span>
                </div>
                <span className="text-[10px] text-red-600 font-black">{t('myMaps.view')}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {publishTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black rounded-2xl w-full max-w-sm shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-amber-400 text-black p-4 border-b-4 border-black flex items-center gap-2">
              <Globe className="w-5 h-5" />
              <h2 className="font-black uppercase tracking-wide">Publish to Community?</h2>
            </div>
            <div className="p-5">
              <p className="text-sm font-bold text-gray-800">
                Publish "{publishTarget.title}" to Community Discoveries? Everyone will be able to see and track this map.
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setPublishTarget(null)}
                  className="px-5 py-2.5 bg-white border-2 border-black font-black text-xs uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handlePublishMap(publishTarget);
                    setPublishTarget(null);
                  }}
                  className="px-5 py-2.5 bg-amber-400 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-black text-xs uppercase flex items-center gap-2 cursor-pointer"
                >
                  <Globe className="w-4 h-4" /> Publish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black rounded-2xl w-full max-w-md shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-[#4895ef] text-white p-4 border-b-4 border-black flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                <h2 className="font-black uppercase tracking-wide">Map Preview</h2>
              </div>
              <button
                onClick={() => setPreviewTarget(null)}
                className="w-7 h-7 bg-white text-black border-2 border-black rounded flex items-center justify-center hover:bg-gray-200 cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <PreviewCover imageUrl={previewTarget.imageUrl} title={previewTarget.title} />
              <h3 className="text-lg font-black mb-1 text-slate-900">{previewTarget.title}</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold mb-3">{previewTarget.region}</p>
              <p className="text-xs text-slate-700 dark:text-slate-200 font-sans leading-relaxed mb-6 max-h-24 overflow-y-auto">
                {previewTarget.description}
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    trackMapOnWorldMap(previewTarget);
                    setPreviewTarget(null);
                  }}
                  className="w-full bg-[#cc0000] hover:bg-red-700 text-white font-black py-2.5 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs uppercase flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MapPin className="w-4 h-4" /> Open in World Map
                </button>
                <button
                  onClick={() => {
                    openMapInEditor(previewTarget);
                    setPreviewTarget(null);
                  }}
                  className="w-full bg-[#4895ef] hover:bg-blue-600 text-white font-black py-2.5 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs uppercase flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" /> Edit Map
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black rounded-2xl w-full max-w-sm shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-[#b40000] text-white p-4 border-b-4 border-black flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              <h2 className="font-black uppercase tracking-wide">Delete Map?</h2>
            </div>
            <div className="p-5">
              <p className="text-sm font-bold text-gray-800">
                Are you sure you want to delete "{deleteTarget.title}"? This cannot be undone.
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="px-5 py-2.5 bg-white border-2 border-black font-black text-xs uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    deleteCommunityMap(deleteTarget.id);
                    setDeleteTarget(null);
                  }}
                  className="px-5 py-2.5 bg-[#b40000] text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-black text-xs uppercase flex items-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
