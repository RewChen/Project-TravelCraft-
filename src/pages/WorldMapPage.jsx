import { useState, useRef } from 'react';
import KeyItemsSidebar from '../components/map/KeyItemsSidebar';
import MapPins from '../components/map/MapPins';
import MapElementsLayer from '../components/editor/MapElementsLayer';
import LocationPopupModal from '../components/map/LocationPopupModal';
import AddSpotModal from '../components/map/AddSpotModal';
import MapBackgroundModal from '../components/map/MapBackgroundModal';
import { Camera, MapPin as MapPinIcon, Image as ImageIcon, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function WorldMapPage() {
  const { t, navigateTo, selectedPin, setSelectedPin, mapBackgroundImage, mapCanvasStyle, mapElements, activeCommunityMap } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBgModal, setShowBgModal] = useState(false);
  const [clickCoords, setClickCoords] = useState(null);

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

  const handleMapClick = (e) => {
    if (!mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const leftPercent = `${Math.round((x / rect.width) * 100)}%`;
    const topPercent = `${Math.round((y / rect.height) * 100)}%`;

    setClickCoords({ top: topPercent, left: leftPercent });
    setSelectedPin(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pb-12 font-mono">
      
      {/* Top Control Header Bar */}
      <div className="bg-white border-4 border-black rounded-2xl p-4 mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#cc0000] border-2 border-black rounded-lg flex items-center justify-center text-white font-black">
            🗺️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black uppercase">
                {activeCommunityMap ? activeCommunityMap.title : t('worldMap.defaultTitle')} 
              </h2>
              {mapBackgroundImage && (
                <span className="text-[10px] bg-amber-400 text-black border border-black px-2 py-0.5 rounded-full">
                  {t('worldMap.customMapActive')}
                </span>
              )}
            </div>
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
          {mapBackgroundImage ? (
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
          <MapElementsLayer items={mapElements} />

          {/* Render Map Markers */}
          <MapPins />

          {/* Selected Location Popup */}
          {selectedPin && (
            <div 
              onClick={(e) => e.stopPropagation()} 
              style={{ top: selectedPin.top || '50%', left: selectedPin.left || '50%' }}
              className="absolute z-40 -translate-x-1/2 translate-y-3"
            >
              <LocationPopupModal pin={selectedPin} onClose={() => { setSelectedPin(null); window.close(); }} />
            </div>
          )}

          {/* Temporary Click Target Marker */}
          {clickCoords && !selectedPin && (
            <div 
              style={{ top: clickCoords.top, left: clickCoords.left }}
              className="absolute z-30 -translate-x-1/2 -translate-y-1/2 animate-bounce flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-amber-400 border-2 border-black p-1.5 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <MapPinIcon className="w-5 h-5 text-black" />
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-1 bg-black text-white text-[9px] font-black px-2 py-0.5 rounded border border-white uppercase shadow-md hover:bg-red-600 cursor-pointer whitespace-nowrap"
              >
                + {t('worldMap.addSpotHere')}
              </button>
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

      </div>

      {/* Whole Map Image Background Upload Modal */}
      {showBgModal && (
        <MapBackgroundModal 
          onClose={() => setShowBgModal(false)}
        />
      )}

      {/* Upload Photo Pin Spot Modal */}
      {showAddModal && (
        <AddSpotModal 
          onClose={() => {
            setShowAddModal(false);
            setClickCoords(null);
          }} 
          defaultCoords={clickCoords}
        />
      )}

    </div>
  );
}
