import { useState } from 'react';
import { Map, Plus, Star, MapPin, Globe, Check, Trash2, Edit3, ImageOff, Eye, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fetchMapById } from '../lib/supabaseMaps';
import CreateMapForm from '../components/map/CreateMapForm';
import PublishMapModal from '../components/map/PublishMapModal';

function CardCover({ imageUrl, title }) {
  const [failed, setFailed] = useState(false);
  if (!imageUrl || failed) {
    return (
      <div className="mb-3 h-28 border border-dashed border-brand-dark/20 rounded-2xl bg-brand-light flex flex-col items-center justify-center gap-1 text-brand-dark/40">
        <ImageOff className="w-6 h-6" />
        <span className="text-[10px] font-semibold uppercase">No Cover</span>
      </div>
    );
  }
  return (
    <div className="mb-3">
      <img src={imageUrl} alt={title} loading="lazy" decoding="async" onError={() => setFailed(true)} className="w-full h-28 object-cover rounded-2xl bg-brand-light" />
    </div>
  );
}

function PreviewCover({ imageUrl, title }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="mb-3 h-44 rounded-2xl bg-brand-light overflow-hidden flex items-center justify-center">
      {imageUrl && !failed ? (
        <img src={imageUrl} alt={title} loading="lazy" decoding="async" onError={() => setFailed(true)} className="w-full h-full object-cover" />
      ) : (
        <span className="font-semibold uppercase text-xs text-brand-dark/50">No Cover</span>
      )}
    </div>
  );
}

export default function MyMapsPage() {
const { t, navigateTo, favorites, publishMapToCommunity, setEditorSetup, communityMaps, setCommunityMaps, userProfile, deleteCommunityMap, isOwnMap, trackMapOnWorldMap, setAuthMode, showAdminToast } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [publishedSuccess, setPublishedSuccess] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [publishTarget, setPublishTarget] = useState(null);
  const [previewTarget, setPreviewTarget] = useState(null);

  const requireLogin = () => {
    showAdminToast(t('myMaps.loginRequired'), 'info');
    setAuthMode('login');
    navigateTo('auth');
  };

  const startDesigning = (data) => {
    if (!userProfile) { requireLogin(); return; }
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

const openMapInEditor = async (mapItem) => {
    if (!userProfile) { requireLogin(); return; }
    // Summary rows need the full data before the editor can load.
    let source = mapItem;
    if (mapItem._summaryOnly) {
      try {
        const full = await fetchMapById(mapItem.id);
        if (full) {
          source = full;
          // Cache the full copy so autosaves keep pins/details/logs intact.
          setCommunityMaps((previous) =>
            previous.some((m) => m.id === full.id)
              ? previous.map((m) => (m.id === full.id ? full : m))
              : [full, ...previous]
          );
        }
      } catch {
        // keep the summary row; editor will start fresh
      }
    }
    setEditorSetup({
      id: source.id,
      title: source.details?.title || source.title,
      description: source.details?.lore || source.description,
      hours: source.details?.hours || '',
      fee: source.details?.fee || '',
      bestTime: source.details?.bestTime || '',
      travel: source.details?.travel || '',
      logs: source.details?.logs || [],
      tags: source.tags || [],
      privacy: source.privacy || 'public',
      imageUrl: source.imageUrl || '',
      rarity: source.rarity || 'common',
      region: source.details?.region || source.region || '',
      isExistingMap: true,
      editorState: source.editorState || null
    });
    navigateTo('editor');
  };

  const myMapsList = (communityMaps || [])
    .filter(isOwnMap)
    .map(mapItem => ({
      ...mapItem,
      badge: mapItem.privacy === 'private' ? 'Draft' : 'Published',
      color: mapItem.privacy === 'private' ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-800/70 dark:text-emerald-200' : 'bg-sky-100 text-sky-900 dark:bg-sky-800/70 dark:text-sky-200',
      description: mapItem.details?.lore || 'A custom map.',
      region: mapItem.details?.region || mapItem.region || ''
    }));

  const handlePublishMap = async (mapItem, updates) => {
    // Publishing rebuilds the item from its fields, so summary rows must be resolved first.
    let source = mapItem;
    if (mapItem._summaryOnly) {
      try {
        const full = await fetchMapById(mapItem.id);
        if (full) source = full;
      } catch {
        // keep the summary row
      }
    }
    const updatedItem = { ...source, ...updates, updatedAt: Date.now() };
    publishMapToCommunity(updatedItem);
    setPublishedSuccess(t('myMaps.publishedMsg', { title: updatedItem.title }));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pt-8 md:pt-10 pb-12 space-y-8 font-thai text-brand-dark dark:text-slate-100">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-7 shadow-[0_4px_20px_-10px_rgba(45,58,46,0.10)] ring-1 ring-brand-dark/[0.06] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Map className="w-6 h-6 text-brand-green" />
            <h1 className="text-2xl font-bold text-brand-dark">{t('myMaps.title')}</h1>
          </div>
          <p className="text-xs text-brand-dark/60">
            {t('myMaps.subtitle')}
          </p>
        </div>

        <button 
          onClick={() => (userProfile ? setShowCreateModal(true) : requireLogin())}
          className="bg-brand-dark hover:bg-brand-green text-white font-semibold px-5 py-3 rounded-full flex items-center gap-2 text-xs uppercase transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> {t('myMaps.createNewMap')}
        </button>
      </div>

      {showCreateModal && userProfile && <CreateMapForm onSubmit={startDesigning} onClose={() => setShowCreateModal(false)} />}

      {/* Success Alert Banner */}
      {publishedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-emerald-800 font-semibold text-xs flex items-center gap-2 animate-in fade-in">
          <Check className="w-5 h-5 stroke-[3]" />
          <span>{publishedSuccess}</span>
        </div>
      )}

      {/* Map List Grid — only the logged-in user's own maps. Guests see a
          login prompt instead of other people's maps. */}
      {!userProfile ? (
        <div className="bg-white rounded-3xl p-10 text-center shadow-[0_4px_20px_-10px_rgba(45,58,46,0.10)] ring-1 ring-brand-dark/[0.06]">
          <div className="text-4xl mb-2">🗺️</div>
          <p className="text-brand-dark/60 font-medium mb-4">{t('myMaps.loginRequired')}</p>
          <button onClick={requireLogin} className="bg-brand-dark hover:bg-brand-green text-white font-semibold px-6 py-2.5 rounded-full uppercase transition-colors">
            {t('auth.submitLogin')}
          </button>
        </div>
      ) : myMapsList.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center shadow-[0_4px_20px_-10px_rgba(45,58,46,0.10)] ring-1 ring-brand-dark/[0.06]">
          <p className="text-brand-dark/60 font-medium mb-4">You haven't created any maps yet.</p>
          <button onClick={() => (userProfile ? setShowCreateModal(true) : requireLogin())} className="bg-brand-dark text-white font-semibold px-6 py-2.5 rounded-full uppercase transition-colors">
            Create Your First Map
          </button>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {myMapsList.map((map) => (
          <div 
            key={map.id}
            className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_-10px_rgba(45,58,46,0.10)] ring-1 ring-brand-dark/[0.06] flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-3">
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${map.color}`}>
                  {map.badge}
                </span>
              </div>
              <CardCover imageUrl={map.imageUrl} title={map.title} />
              <h3 className="text-lg font-bold mb-1 text-brand-dark line-clamp-1 overflow-hidden">{map.title}</h3>
              <p className="text-[11px] text-brand-dark/50 font-medium mb-3">{map.region}</p>
              <p className="text-xs text-brand-dark/70 leading-relaxed mb-6 line-clamp-2 overflow-hidden">
                {map.description}
              </p>
            </div>
            
            <div className="space-y-2">
              <button 
                onClick={() => setPublishTarget(map)}
                className="w-full bg-amber-400 hover:bg-amber-300 text-brand-dark font-semibold py-2.5 rounded-full text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Globe className="w-4 h-4" /> {t('myMaps.pushToCommunity')}
              </button>

              <button
                onClick={() => setPreviewTarget(map)}
                className="w-full bg-[#cc0000] text-white font-semibold py-2.5 rounded-full text-xs uppercase hover:bg-[#b30000] cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
              >
                <Eye className="w-4 h-4" /> {t('myMaps.openMap')}
              </button>

              <button
                onClick={() => openMapInEditor(map)}
                className="w-full bg-brand-dark text-white font-semibold py-2.5 rounded-full text-xs uppercase hover:bg-brand-green cursor-pointer flex justify-center items-center gap-1.5 transition-colors"
              >
                <Edit3 className="w-4 h-4" /> Edit Map
              </button>

              <button
                onClick={() => setDeleteTarget(map)}
                className="w-full bg-white text-red-600 font-semibold py-2.5 rounded-full text-xs uppercase hover:bg-red-50 cursor-pointer flex justify-center items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> {t('common.delete')}
              </button>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Favorites Quick Access — account-only, hidden from guests */}
      {userProfile && (
      <div className="bg-white rounded-3xl p-7 shadow-[0_4px_20px_-10px_rgba(45,58,46,0.10)] ring-1 ring-brand-dark/[0.06]">
        <h2 className="text-lg font-bold text-brand-dark mb-3 flex items-center gap-2">
          <Star className="w-5 h-5 fill-amber-400 text-amber-500" /> {t('myMaps.favoritesTitle')} ({favorites.length})
        </h2>
        {favorites.length === 0 ? (
          <p className="text-xs text-brand-dark/50">{t('myMaps.noFavorites')}</p>
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
                className="bg-brand-light/70 rounded-2xl p-3 flex justify-between items-center cursor-pointer hover:bg-brand-light transition-colors"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-brand-green" />
                  <span className="text-xs font-semibold">{item}</span>
                </div>
                <span className="text-[10px] text-brand-green font-semibold">{t('myMaps.view')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {publishTarget && (
        <PublishMapModal
          mapId={publishTarget?.id}
          initial={{
            title: publishTarget.title || publishTarget.details?.title || '',
            description: publishTarget.description || publishTarget.details?.lore || '',
            imageUrl: publishTarget.imageUrl || '',
            tags: Array.isArray(publishTarget.tags) ? publishTarget.tags : [],
            privacy: 'public',
            videoUrl: publishTarget.videoUrl || publishTarget.details?.videoUrl || '',
            selfieUrls: publishTarget.selfieUrls || (publishTarget.selfieUrl ? [publishTarget.selfieUrl] : [])
          }}
          onClose={() => setPublishTarget(null)}
          onPublish={(updates) => {
            handlePublishMap(publishTarget, updates);
            setPublishTarget(null);
          }}
        />
      )}

      {previewTarget && (
        <div className="fixed inset-0 z-50 bg-brand-dark/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-[0_25px_60px_-25px_rgba(45,58,46,0.4)]">
            <div className="bg-brand-dark text-white p-5 rounded-t-3xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                <h2 className="font-bold uppercase tracking-wide">Map Preview</h2>
              </div>
              <button
                onClick={() => setPreviewTarget(null)}
                className="w-7 h-7 bg-white/15 hover:bg-white/30 text-white rounded-full flex items-center justify-center cursor-pointer transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              <PreviewCover imageUrl={previewTarget.imageUrl} title={previewTarget.title} />
              <h3 className="text-lg font-bold mb-1 text-brand-dark break-words leading-snug">{previewTarget.title}</h3>
              <p className="text-[11px] text-brand-dark/50 font-medium mb-3">{previewTarget.region}</p>
              <p className="text-xs text-brand-dark/70 leading-relaxed mb-6 max-h-24 overflow-y-auto">
                {previewTarget.description}
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    trackMapOnWorldMap(previewTarget);
                    setPreviewTarget(null);
                  }}
                  className="w-full bg-brand-dark hover:bg-brand-green text-white font-semibold py-2.5 rounded-full text-xs uppercase flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <MapPin className="w-4 h-4" /> Open in World Map
                </button>
                <button
                  onClick={() => {
                    openMapInEditor(previewTarget);
                    setPreviewTarget(null);
                  }}
                  className="w-full bg-white hover:bg-brand-light border border-brand-dark/15 text-brand-dark font-semibold py-2.5 rounded-full text-xs uppercase flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Edit3 className="w-4 h-4" /> Edit Map
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-brand-dark/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-[0_25px_60px_-25px_rgba(45,58,46,0.4)]">
            <div className="bg-brand-dark text-white p-5 rounded-t-3xl flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              <h2 className="font-bold uppercase tracking-wide">Delete Map?</h2>
            </div>
            <div className="p-6">
              <p className="text-sm font-medium text-brand-dark/80">
                Are you sure you want to delete "{deleteTarget.title}"? This cannot be undone.
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="px-5 py-2.5 bg-white border border-brand-dark/15 rounded-full font-semibold text-xs uppercase cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    deleteCommunityMap(deleteTarget.id);
                    setDeleteTarget(null);
                  }}
                  className="px-5 py-2.5 bg-[#b40000] text-white rounded-full font-semibold text-xs uppercase flex items-center gap-2 cursor-pointer transition-colors"
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
