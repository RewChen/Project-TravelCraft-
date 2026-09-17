import { useState, useRef } from 'react';
import KeyItemsSidebar from '../components/map/KeyItemsSidebar';
import MapPins from '../components/map/MapPins';
import MapElementsLayer from '../components/editor/MapElementsLayer';
import LocationPopupModal from '../components/map/LocationPopupModal';
import AddSpotModal from '../components/map/AddSpotModal';
import MapBackgroundModal from '../components/map/MapBackgroundModal';
import { Image as ImageIcon, ZoomIn, ZoomOut, RotateCcw, Eye, Play, LogIn, UserPlus, X, MousePointerClick } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function WorldMapPage() {
  const { t, navigateTo, selectedPin, setSelectedPin, mapBackgroundImage, mapCanvasStyle, mapElements, mapPins, activeCommunityMap, mapViewLoading, isLoggedIn, setAuthMode } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBgModal, setShowBgModal] = useState(false);
  const [showDemoBanner, setShowDemoBanner] = useState(true);

  const isGuest = !isLoggedIn;

  // Zoom Controls State
  const [zoomLevel, setZoomLevel] = useState(1);

  const mapContainerRef = useRef(null);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  const handleMapClick = () => {
    setSelectedPin(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pb-12 font-mono">
      {/* Guest demo / preview banner: visitors can view and try the map without login */}
      {isGuest && showDemoBanner && (
        <div className="bg-gradient-to-r from-amber-300 via-amber-200 to-emerald-100 border-4 border-black rounded-2xl p-4 mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 bg-[#cc0000] border-2 border-black rounded-xl flex items-center justify-center text-white shrink-0">
                <Eye className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase bg-black text-amber-300 px-2 py-0.5 rounded-full">
                    {t('worldMap.demoBadge')}
                  </span>
                  <h2 className="text-sm font-black uppercase">{t('worldMap.demoTitle')}</h2>
                </div>
                <p className="text-[11px] font-sans font-bold text-slate-700 mt-1 leading-relaxed">
                  {t('worldMap.demoDesc')}
                </p>
                <p className="text-[11px] font-sans text-slate-600 mt-1 flex items-center gap-1">
                  <MousePointerClick className="w-3.5 h-3.5 shrink-0" />
                  {t('worldMap.demoTryHint')}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    onClick={() => setShowDemoBanner(false)}
                    className="bg-[#cc0000] hover:bg-red-700 text-white font-black px-3.5 py-2 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-xs uppercase flex items-center gap-1.5 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
                  >
                    <Play className="w-3.5 h-3.5" /> {t('worldMap.demoTryNow')}
                  </button>
                  <button
                    onClick={() => { setAuthMode('login'); navigateTo('auth'); }}
                    className="bg-white hover:bg-gray-100 text-black font-black px-3.5 py-2 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-xs uppercase flex items-center gap-1.5 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
                  >
                    <LogIn className="w-3.5 h-3.5" /> {t('worldMap.demoLogin')}
                  </button>
                  <button
                    onClick={() => { setAuthMode('register'); navigateTo('auth'); }}
                    className="bg-emerald-400 hover:bg-emerald-300 text-black font-black px-3.5 py-2 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-xs uppercase flex items-center gap-1.5 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> {t('worldMap.demoRegister')}
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowDemoBanner(false)}
              title={t('worldMap.demoDismiss')}
              className="w-7 h-7 bg-white border-2 border-black rounded-lg flex items-center justify-center hover:bg-gray-100 shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Control Header Bar */}
      <div className="bg-white border-4 border-black rounded-2xl p-4 mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 bg-[#cc0000] border-2 border-black rounded-lg flex items-center justify-center text-white font-black shrink-0">
            🗺️
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-black uppercase break-words line-clamp-2">
              {activeCommunityMap ? activeCommunityMap.title : t('worldMap.defaultTitle')}
            </h2>
            {mapBackgroundImage && (
              <span className="inline-block text-[10px] bg-amber-400 text-black border border-black px-2 py-0.5 rounded-full mt-1">
                {t('worldMap.customMapActive')}
              </span>
            )}
            <p className="text-[11px] text-slate-600 dark:text-slate-300 font-sans">
              {t('worldMap.clickDetailsHint')}
            </p>
          </div>
        </div>
        {activeCommunityMap && (
          <button
            onClick={() => navigateTo('details', activeCommunityMap)}
            className="bg-amber-400 hover:bg-amber-300 text-black font-black px-3.5 py-2 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-xs uppercase flex items-center gap-1.5 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
          >
            {t('worldMap.viewDetails')}
          </button>
        )}
      </div>

      {/* Map Container Viewport (square to match the editor's square canvas) */}
      <div 
        ref={mapContainerRef}
        onClick={handleMapClick}
        className="w-full aspect-square mx-auto border-4 border-black rounded-2xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative bg-[#e2f0d9] cursor-crosshair select-none [container-type:inline-size]"
      >
        {/* Zoomable Canvas Wrapper */}
        <div 
          className="w-full h-full relative transition-transform duration-200 origin-center"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* Custom Uploaded Map Image Background */}
          {mapViewLoading ? (
            <div className="absolute inset-0 z-30 bg-[#e2f0d9]/70 flex items-center justify-center">
              <div className="bg-white border-4 border-black rounded-xl px-4 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 text-xs font-black uppercase">
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                {t('worldMap.loadingMap')}
              </div>
            </div>
          ) : mapBackgroundImage ? (
            <img 
              src={mapBackgroundImage} 
              alt={t('worldMap.bgAlt')} 
              className="absolute inset-0 w-full h-full object-cover z-0" 
            />
          ) : mapCanvasStyle ? (
            <div
              className="absolute inset-0 z-0"
              style={{ backgroundColor: mapCanvasStyle.backgroundColor, backgroundImage: mapCanvasStyle.backgroundImage }}
            />
          ) : (
            <>
              {/* Default Pixel Kyoto Canvas Background */}
              <div className="absolute inset-0 opacity-15 pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}></div>
              <div className="absolute top-1/3 left-0 w-full h-4 bg-blue-200/60 border-y border-black/20 pointer-events-none z-0"></div>
              <div className="absolute left-1/3 top-0 h-full w-4 bg-blue-200/60 border-x border-black/20 pointer-events-none z-0"></div>
              
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center opacity-25 pointer-events-none select-none z-0">
                <div className="text-8xl font-black tracking-tighter">{t('worldMap.kyoto')}</div>
                <div className="text-4xl font-bold">{t('worldMap.kyotoKanji')}</div>
              </div>
            </>
          )}

          {/* User's Editor Elements (rendered at the same relative size/position as in the editor) */}
<MapElementsLayer
            items={mapElements}
            onLocationClick={(elementId) => {
              const pin = mapPins.find((item) => item.id === `editor-${elementId}`);
              if (pin) setSelectedPin(pin);
            }}
          />

          {/* Render Map Markers */}
          <MapPins hideElementPins />

          {/* Selected Location Popup */}
          {selectedPin && (
            <div 
              onClick={(e) => e.stopPropagation()} 
              style={{ top: selectedPin.top || '50%', left: selectedPin.left || '50%' }}
              className="absolute z-40 -translate-x-1/2 translate-y-3"
            >
              <LocationPopupModal pin={selectedPin} onClose={() => setSelectedPin(null)} />
            </div>
          )}
        </div>

        {/* Sidebar Filters & Action Buttons (Fixed on top of zoom) */}
        <div onClick={(e) => e.stopPropagation()} className="relative z-20">
          <KeyItemsSidebar 
            onOpenUpload={() => setShowAddModal(true)} 
            onOpenMapBgModal={() => setShowBgModal(true)}
          />
        </div>

        {/* Floating Zoom Control Panel */}
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-4 left-4 z-20 bg-white border-4 border-black rounded-xl p-1.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5"
        >
          <button 
            onClick={handleZoomIn}
            className="w-8 h-8 bg-amber-400 hover:bg-amber-300 border-2 border-black rounded-lg flex items-center justify-center font-black shadow-sm cursor-pointer"
            title={t('worldMap.zoomIn')}
          >
            <ZoomIn className="w-4 h-4 text-black" />
          </button>
          <span className="text-xs font-black px-2">{Math.round(zoomLevel * 100)}%</span>
          <button 
            onClick={handleZoomOut}
            className="w-8 h-8 bg-amber-400 hover:bg-amber-300 border-2 border-black rounded-lg flex items-center justify-center font-black shadow-sm cursor-pointer"
            title={t('worldMap.zoomOut')}
          >
            <ZoomOut className="w-4 h-4 text-black" />
          </button>
          <button 
            onClick={handleResetZoom}
            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 border-2 border-black rounded-lg flex items-center justify-center font-black shadow-sm cursor-pointer"
            title={t('worldMap.resetZoom')}
          >
            <RotateCcw className="w-3.5 h-3.5 text-black" />
          </button>
        </div>

        {/* Badge in Bottom Right */}
        <div className="absolute bottom-4 right-4 z-20 bg-white/90 backdrop-blur border-2 border-black rounded-lg px-3 py-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 text-xs font-bold">
          <ImageIcon className="w-4 h-4 text-red-600" />
          <span>{mapBackgroundImage ? t('worldMap.customMapActive') : t('worldMap.kyotoCanvas')}</span>
        </div>

        {/* Demo ribbon for visitors */}
        {isGuest && (
          <div className="absolute top-4 right-4 z-20 bg-black text-amber-300 border-2 border-amber-300 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Eye className="w-3.5 h-3.5" /> {t('worldMap.demoBadge')}
          </div>
        )}

      </div>

      {/* Guest how-to-play strip: 3 try-it steps + CTAs */}
      {isGuest && (
        <div className="mt-4 bg-white border-4 border-black rounded-2xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2">
            <Play className="w-4 h-4 text-[#cc0000]" /> {t('worldMap.demoHowToTitle')}
          </h3>
          <div className="grid sm:grid-cols-3 gap-2.5">
            <button
              onClick={() => handleZoomIn()}
              className="text-left bg-amber-50 hover:bg-amber-100 border-2 border-black rounded-xl p-3 cursor-pointer transition-colors"
            >
              <div className="text-lg mb-1">🔍</div>
              <div className="text-xs font-black uppercase">{t('worldMap.demoStep1Title')}</div>
              <div className="text-[11px] font-sans text-slate-600 leading-relaxed mt-0.5">{t('worldMap.demoStep1Desc')}</div>
            </button>
            <button
              onClick={() => {
                const first = mapPins?.[0];
                if (first) setSelectedPin(first);
              }}
              className="text-left bg-emerald-50 hover:bg-emerald-100 border-2 border-black rounded-xl p-3 cursor-pointer transition-colors"
            >
              <div className="text-lg mb-1">📍</div>
              <div className="text-xs font-black uppercase">{t('worldMap.demoStep2Title')}</div>
              <div className="text-[11px] font-sans text-slate-600 leading-relaxed mt-0.5">{t('worldMap.demoStep2Desc')}</div>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-left bg-red-50 hover:bg-red-100 border-2 border-black rounded-xl p-3 cursor-pointer transition-colors"
            >
              <div className="text-lg mb-1">📷</div>
              <div className="text-xs font-black uppercase">{t('worldMap.demoStep3Title')}</div>
              <div className="text-[11px] font-sans text-slate-600 leading-relaxed mt-0.5">{t('worldMap.demoStep3Desc')}</div>
            </button>
          </div>
          <p className="text-[10px] font-sans text-slate-500 font-bold mt-3">
            {t('worldMap.demoTemporaryNote')}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <button
              onClick={() => navigateTo('community')}
              className="bg-amber-400 hover:bg-amber-300 text-black font-black px-3.5 py-2 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-xs uppercase cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
            >
              {t('worldMap.demoGoCommunity')}
            </button>
            <button
              onClick={() => { setAuthMode('register'); navigateTo('auth'); }}
              className="bg-[#cc0000] hover:bg-red-700 text-white font-black px-3.5 py-2 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-xs uppercase flex items-center gap-1.5 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
            >
              <UserPlus className="w-3.5 h-3.5" /> {t('worldMap.demoRegister')}
            </button>
          </div>
        </div>
      )}

      {/* Whole Map Image Background Upload Modal */}
      {showBgModal && (
        <MapBackgroundModal 
          onClose={() => setShowBgModal(false)}
        />
      )}

      {/* Upload Photo Pin Spot Modal */}
      {showAddModal && (
        <AddSpotModal 
          onClose={() => setShowAddModal(false)}
        />
      )}

    </div>
  );
}
