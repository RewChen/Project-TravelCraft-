import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import KeyItemsSidebar from '../components/map/KeyItemsSidebar';
import MapPins from '../components/map/MapPins';
import MapElementsLayer from '../components/editor/MapElementsLayer';
import LocationPopupModal from '../components/map/LocationPopupModal';
import AddSpotModal from '../components/map/AddSpotModal';
import MapBackgroundModal from '../components/map/MapBackgroundModal';
import { Image as ImageIcon, ZoomIn, ZoomOut, RotateCcw, Play, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function WorldMapPage() {
  const { t, navigateTo, selectedPin, setSelectedPin, mapBackgroundImage, mapCanvasStyle, mapCanvasWidth, mapCanvasHeight, mapElements, mapRoutes, navStartId, navEndId, mapPins, activeCommunityMap, mapViewLoading, hasEverOpenedMap } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBgModal, setShowBgModal] = useState(false);

  // Zoom Controls State
  const [zoomLevel, setZoomLevel] = useState(1);

  // Pan State
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const mapContainerRef = useRef(null);

  // Tour State
  const [tourActive, setTourActive] = useState(false);
  const [tourIndex, setTourIndex] = useState(0);

  // Reset pan when zoom resets to 1 or map changes
  useEffect(() => {
    if (zoomLevel <= 1) {
      setPan({ x: 0, y: 0 });
    }
  }, [zoomLevel]);

  useEffect(() => {
    setPan({ x: 0, y: 0 });
    setZoomLevel(1);
    setTourActive(false);
    setTourIndex(0);
  }, [mapBackgroundImage, mapCanvasStyle, activeCommunityMap]);

  // Build tour stops from elements and pins
  const tourStops = useMemo(() => {
    const stops = [];
    const canvasW = mapCanvasWidth || 4000;
    const canvasH = mapCanvasHeight || 4000;

    // Add editor elements with positions
    if (mapElements) {
      mapElements.forEach((element) => {
        if (element.x !== undefined && element.y !== undefined) {
          stops.push({
            id: `element-${element.id}`,
            type: 'element',
            element,
            x: element.x,
            y: element.y,
            title: element.text || element.locName || t('worldMap.tourStop'),
          });
        }
      });
    }

    // Add map pins
    if (mapPins) {
      mapPins.forEach((pin) => {
        if (pin.top !== undefined && pin.left !== undefined) {
          const top = parseFloat(pin.top);
          const left = parseFloat(pin.left);
          if (!isNaN(top) && !isNaN(left)) {
            stops.push({
              id: `pin-${pin.id}`,
              type: 'pin',
              pin,
              x: (left / 100) * canvasW,
              y: (top / 100) * canvasH,
              title: pin.title || pin.name || t('worldMap.tourStop'),
            });
          }
        }
      });
    }

    return stops;
  }, [mapElements, mapPins, mapCanvasWidth, mapCanvasHeight, t]);

  // Animate to tour stop
  const goToTourStop = useCallback((index) => {
    if (index < 0 || index >= tourStops.length) return;
    const stop = tourStops[index];
    const container = mapContainerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const viewportW = containerRect.width;
    const viewportH = containerRect.height;
    const targetZoom = 1.5;

    // Calculate pan to center the stop
    const targetPanX = -(stop.x * targetZoom - viewportW / 2);
    const targetPanY = -(stop.y * targetZoom - viewportH / 2);

    setZoomLevel(targetZoom);
    setPan({ x: targetPanX, y: targetPanY });
    setTourIndex(index);

    // Select the pin if it's a pin
    if (stop.type === 'pin') {
      setSelectedPin(stop.pin);
    }
  }, [tourStops, setSelectedPin]);

  const handleResetZoom = useCallback(() => {
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const startTour = useCallback(() => {
    if (tourStops.length > 0) {
      setTourActive(true);
      setTourIndex(0);
      goToTourStop(0);
    }
  }, [tourStops, goToTourStop]);

  const stopTour = useCallback(() => {
    setTourActive(false);
    setTourIndex(0);
    handleResetZoom();
  }, [handleResetZoom]);

  const nextTourStop = useCallback(() => {
    if (tourIndex < tourStops.length - 1) {
      goToTourStop(tourIndex + 1);
    }
  }, [tourIndex, tourStops, goToTourStop]);

  const prevTourStop = useCallback(() => {
    if (tourIndex > 0) {
      goToTourStop(tourIndex - 1);
    }
  }, [tourIndex, goToTourStop]);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  };

  const handleMapClick = () => {
    setSelectedPin(null);
  };

  const handleMouseDown = useCallback((e) => {
    if (zoomLevel <= 1) return;
    if (e.target.closest('button') || e.target.closest('[role="button"]')) return;
    
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX - pan.x,
      y: e.clientY - pan.y
    };
    e.preventDefault();
  }, [zoomLevel, pan]);

  const handleMouseMove = useCallback((e) => {
    if (!isPanning) return;
    
    setPan({
      x: e.clientX - panStartRef.current.x,
      y: e.clientY - panStartRef.current.y
    });
  }, [isPanning]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPanning(false);
  }, []);

  // The World Map stays hidden until the user has previewed a map at least
  // once this session. Only a map loading in (or an already-seen map) reveals it.
  if (!mapViewLoading && !hasEverOpenedMap) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 pb-12 font-mono">
      {/* Top Control Header Bar */}
      <div className="bg-white border-4 border-black rounded-2xl p-4 mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 bg-[#cc0000] border-2 border-black rounded-lg flex items-center justify-center text-white font-black shrink-0">
            🗺️
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-black uppercase break-words line-clamp-2">
              {mapViewLoading ? t('worldMap.loadingMap') : (activeCommunityMap ? activeCommunityMap.title : t('worldMap.defaultTitle'))}
            </h2>
            {mapBackgroundImage && (
              <span className="inline-block text-[10px] bg-amber-400 text-black border border-black px-2 py-0.5 rounded-full mt-1">
                {t('worldMap.customMapActive')}
              </span>
            )}
            {!mapBackgroundImage && mapCanvasStyle && (
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
        {tourStops.length > 0 && !tourActive && (
          <button
            onClick={startTour}
            className="bg-emerald-400 hover:bg-emerald-300 text-black font-black px-3.5 py-2 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-xs uppercase flex items-center gap-1.5 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
            title={t('worldMap.tourStart')}
          >
            <Play className="w-3.5 h-3.5 fill-black" /> {t('worldMap.tour')}
          </button>
        )}
      </div>

      {/* Map Container Viewport (matches the editor's aspect ratio) */}
      <div 
        ref={mapContainerRef}
        onClick={handleMapClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className="w-full mx-auto border-4 border-black rounded-2xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative bg-[#e2f0d9] select-none [container-type:inline-size]"
        style={{ 
          aspectRatio: `${mapCanvasWidth || 4000} / ${mapCanvasHeight || 4000}`,
          cursor: zoomLevel > 1 ? (isPanning ? 'grabbing' : 'grab') : 'crosshair'
        }}
      >
        {/* Zoomable Canvas Wrapper */}
        <div 
          className="w-full h-full relative transition-transform duration-200 origin-center"
          style={{ transform: `scale(${zoomLevel}) translate(${pan.x}px, ${pan.y}px)` }}
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
              className="absolute inset-0 w-full h-full object-fill z-0" 
            />
          ) : mapCanvasStyle ? (
            <div
              className="absolute inset-0 z-0"
              style={mapCanvasStyle}
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
            routes={mapRoutes}
            navStartId={navStartId}
            navEndId={navEndId}
            canvasWidth={mapCanvasWidth || 4000}
            canvasHeight={mapCanvasHeight || 4000}
            onLocationClick={(elementId) => {
              const pin = mapPins.find((item) => item.id === `editor-${elementId}`);
              if (pin) setSelectedPin(pin);
            }}
          />

          {/* Render Map Markers */}
          <MapPins hideElementPins />

        </div>

        {/* Tour Controls Overlay */}
        {tourActive && tourStops.length > 0 && (
          <div 
            className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white border-4 border-black rounded-xl px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3">
              <span className="text-xs font-black text-gray-400 uppercase tracking-wider">
                {t('worldMap.tourLabel')} {tourIndex + 1}<span className="mx-1">/</span>{tourStops.length}
              </span>
              <span className="font-black text-sm text-[#cc0000] truncate max-w-[200px]">{tourStops[tourIndex]?.title}</span>
              <button
                type="button"
                onClick={prevTourStop}
                disabled={tourIndex === 0}
                title={t('worldMap.tourPrev')}
                className="w-8 h-8 flex items-center justify-center border-2 border-black rounded-lg bg-white hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextTourStop}
                disabled={tourIndex === tourStops.length - 1}
                title={t('worldMap.tourNext')}
                className="w-8 h-8 flex items-center justify-center border-2 border-black rounded-lg bg-white hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={stopTour}
                title={t('worldMap.tourStop')}
                className="w-8 h-8 flex items-center justify-center border-2 border-black rounded-lg bg-white hover:bg-red-50 text-red-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Selected Location Popup — rendered outside the overflow-hidden map
            box so the detail card is never clipped, and pinned to the viewport */}
        {selectedPin && (
          <LocationPopupModal
            pin={selectedPin}
            onClose={() => setSelectedPin(null)}
            anchorRef={mapContainerRef}
            zoomLevel={zoomLevel}
          />
        )}

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
          <span>{mapBackgroundImage || mapCanvasStyle ? t('worldMap.customMapActive') : t('worldMap.kyotoCanvas')}</span>
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
          onClose={() => setShowAddModal(false)}
        />
      )}

    </div>
  );
}
