import { useState } from 'react';
import { Map, Plus, Star, MapPin, Globe, Check, X, Clock3, CircleDollarSign, Sun, Train, Rocket, Sparkles, ShieldCheck, Trash2, Edit3 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function MyMapsPage() {
const { t, navigateTo, favorites, publishMapToCommunity, isLoggedIn, setEditorSetup, communityMaps, userProfile, deleteCommunityMap } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [mapForm, setMapForm] = useState({
    title: t('common.untitledMap'),
    description: userProfile?.name ? `A custom map created by ${userProfile.name}.` : 'A custom map created by a TravelCraft traveler.',
    hours: '09:30 - 23:45 (Daily)',
    fee: 'Free',
    bestTime: 'Anytime',
    travel: '',
    privacy: 'public',
    tags: ['landmark'],
    logs: ['rocket']
  });
  const [publishedSuccess, setPublishedSuccess] = useState('');

  const tagOptions = [['landmark', 'myMaps.tagLandmark'], ['scenic', 'myMaps.tagScenic'], ['food', 'myMaps.tagFood'], ['hidden', 'myMaps.tagHiddenGem']];
  const logOptions = [['rocket', Rocket, 'myMaps.logExploration'], ['sun', Sun, 'myMaps.logBestTime'], ['sparkles', Sparkles, 'myMaps.logScenic']];
  const updateForm = (field, value) => setMapForm((previous) => ({ ...previous, [field]: value }));
  const toggleFormValue = (field, value) => setMapForm((previous) => ({
    ...previous,
    [field]: previous[field].includes(value) ? previous[field].filter((item) => item !== value) : [...previous[field], value]
  }));
  const startDesigning = (event) => {
    event.preventDefault();
    setEditorSetup({
      ...mapForm,
      id: `comm-user-draft-${Date.now()}`
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
      spotsCount: mapItem.pins?.length || 0,
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
          <p className="text-xs text-gray-600 font-sans">
            {t('myMaps.subtitle')}
          </p>
        </div>

        <button 
          onClick={() => isLoggedIn ? setShowCreateModal(true) : navigateTo('auth')}
          className="bg-[#cc0000] hover:bg-red-700 text-white font-black px-4 py-2.5 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 text-xs uppercase cursor-pointer"
        >
          <Plus className="w-4 h-4" /> {t('myMaps.createNewMap')}
        </button>
      </div>

      {showCreateModal && <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
        <form onSubmit={startDesigning} className="bg-white border-4 border-black rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
          <div className="bg-[#b40000] text-white p-4 border-b-4 border-black flex items-center justify-between sticky top-0 z-10">
            <h2 className="font-black uppercase tracking-wide">{t('myMaps.createNewMap')}</h2>
            <button type="button" onClick={() => setShowCreateModal(false)} title={t('common.close')} className="w-8 h-8 bg-white text-black border-2 border-black rounded flex items-center justify-center"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label htmlFor="map-title" className="block text-[10px] font-black uppercase mb-1.5">{t('myMaps.mapTitle')}</label>
              <input id="map-title" required value={mapForm.title} onChange={(event) => updateForm('title', event.target.value)} className="w-full border-2 border-black p-2.5 text-sm font-bold bg-gray-50 focus:outline-none focus:bg-amber-50" />
            </div>
            <div>
              <label htmlFor="map-description" className="block text-[10px] font-black uppercase mb-1.5">{t('myMaps.description')}</label>
              <textarea id="map-description" rows="3" value={mapForm.description} onChange={(event) => updateForm('description', event.target.value)} placeholder={t('myMaps.descPh')} className="w-full border-2 border-black p-2.5 text-xs font-bold bg-gray-50 focus:outline-none focus:bg-amber-50 resize-y" />
            </div>

            <div className="flex items-center gap-2 text-[10px] font-black uppercase"><span>▣</span> {t('myMaps.loreData')}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[[Clock3, 'hours', 'myMaps.hours'], [CircleDollarSign, 'fee', 'myMaps.fee'], [Sun, 'bestTime', 'myMaps.bestTime'], [Train, 'travel', 'myMaps.travel']].map(([Icon, field, label]) => (
                <label key={field} className="border-2 border-black p-2.5 block">
                  <span className="flex items-center gap-1 text-[10px] text-red-600 font-black uppercase"><Icon className="w-3.5 h-3.5" /> {t(label)}</span>
                  <input value={mapForm[field]} onChange={(event) => updateForm(field, event.target.value)} placeholder={t(label)} className="w-full mt-1 text-xs font-bold bg-transparent outline-none" />
                </label>
              ))}
            </div>

            <div className="flex items-center justify-between text-[10px] font-black uppercase"><span>▣ {t('myMaps.travelerLogs')}</span><span className="text-red-600">{t('myMaps.chooseUpTo3')}</span></div>
            <div className="grid grid-cols-3 gap-2">
              {logOptions.map(([value, Icon, label]) => <button type="button" key={value} onClick={() => toggleFormValue('logs', value)} className={`h-24 border-2 border-black flex flex-col items-center justify-center gap-2 ${mapForm.logs.includes(value) ? value === 'rocket' ? 'bg-[#b9c7f7]' : value === 'sun' ? 'bg-[#1268ed] text-white' : 'bg-[#f5f4fb]' : 'bg-gray-100 opacity-60'}`}><Icon className="w-8 h-8" /><span className="text-[9px] font-black uppercase">{t(label)}</span></button>)}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <fieldset>
                <legend className="text-[10px] font-black uppercase mb-2 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> {t('myMaps.privacy')}</legend>
                <div className="space-y-1 text-xs font-bold">{[['public', 'myMaps.public'], ['unlisted', 'myMaps.unlisted'], ['private', 'myMaps.private']].map(([value, label]) => <label key={value} className="flex items-center gap-2"><input type="radio" name="create-privacy" checked={mapForm.privacy === value} onChange={() => updateForm('privacy', value)} /> {t(label)}</label>)}</div>
              </fieldset>
              <fieldset>
                <legend className="text-[10px] font-black uppercase mb-2">{t('myMaps.tags')}</legend>
                <div className="flex flex-wrap gap-1.5">{tagOptions.map(([value, label]) => <button type="button" key={value} onClick={() => toggleFormValue('tags', value)} className={`px-2 py-1 border-2 border-black text-[9px] font-black uppercase ${mapForm.tags.includes(value) ? 'bg-amber-300' : 'bg-gray-100'}`}>{mapForm.tags.includes(value) ? '★ ' : ''}{t(label)}</button>)}</div>
                <p className="text-[9px] text-gray-500 font-bold mt-2">{t('myMaps.selectTagsHelp')}</p>
              </fieldset>
            </div>
          </div>
          <div className="p-4 bg-gray-100 border-t-4 border-black flex justify-end gap-2 sticky bottom-0">
            <button type="button" onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 bg-white border-2 border-black font-black text-xs uppercase">{t('common.cancel')}</button>
            <button type="submit" className="px-5 py-2.5 bg-[#b40000] text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-black text-xs uppercase flex items-center gap-2"><Rocket className="w-4 h-4" /> {t('myMaps.startDesigning')} <span>→</span></button>
          </div>
        </form>
      </div>}

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
          <p className="text-gray-500 font-bold mb-4">You haven't created any maps yet.</p>
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
                <span className="text-xs font-bold text-gray-500">📍 {map.spotsCount} Spots</span>
              </div>
              <h3 className="text-lg font-black mb-1">{map.title}</h3>
              <p className="text-[11px] text-gray-500 font-bold mb-3">{map.region}</p>
              <p className="text-xs text-gray-700 font-sans leading-relaxed mb-6">
                {map.description}
              </p>
            </div>
            
            <div className="space-y-2">
              {map.privacy === 'private' && (
                <button 
                  onClick={() => handlePublishMap(map)}
                  className="w-full bg-amber-400 hover:bg-amber-300 text-black font-black py-2 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-all active:translate-y-0.5"
                >
                  <Globe className="w-4 h-4" /> Publish to Community (+150 Coins)
                </button>
              )}

              <button 
                onClick={() => navigateTo('map')}
                className="w-full bg-[#cc0000] text-white font-bold py-2 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs uppercase hover:bg-red-700 cursor-pointer"
              >
                Open Map →
              </button>

              <button
                onClick={() => openMapInEditor(map)}
                className="w-full bg-[#4895ef] text-white font-bold py-2 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs uppercase hover:bg-blue-600 cursor-pointer flex justify-center items-center gap-1.5"
              >
                <Edit3 className="w-4 h-4" /> Edit Map
              </button>

              <button
                onClick={() => {
                  if (window.confirm(`Delete "${map.title}"?`)) {
                    deleteCommunityMap(map.id);
                  }
                }}
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
          <p className="text-xs text-gray-500">{t('myMaps.noFavorites')}</p>
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

    </div>
  );
}
