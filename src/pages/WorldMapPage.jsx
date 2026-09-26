import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import KeyItemsSidebar from '../components/map/KeyItemsSidebar';
import MapPins from '../components/map/MapPins';
import MapElementsLayer from '../components/editor/MapElementsLayer';
import LocationPopupModal from '../components/map/LocationPopupModal';
import AddSpotModal from '../components/map/AddSpotModal';
import MapBackgroundModal from '../components/map/MapBackgroundModal';
import { Image as ImageIcon, ZoomIn, ZoomOut, RotateCcw, Play, ChevronLeft, ChevronRight, X, Maximize2, Minimize2 } from 'lucide-react';
import { cleanAssetName } from '../lib/imageUtils';
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

  // Fullscreen map viewing — real Fullscreen API on the wrapper, with a CSS
  // fixed overlay as fallback when the API is unavailable (e.g. iOS Safari).
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const mapFullscreenRef = useRef(null);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsMapFullscreen(
        Boolean(document.fullscreenElement) && document.fullscreenElement === mapFullscreenRef.current
      );
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // Lock page scroll behind the fullscreen view and let fixed overlays
  // (detail popup) recompute their position against the new layout.
  useEffect(() => {
    document.body.style.overflow = isMapFullscreen ? 'hidden' : '';
    window.dispatchEvent(new Event('resize'));
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMapFullscreen]);

  const exitMapFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    setIsMapFullscreen(false);
  }, []);

  const toggleMapFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
      return;
    }
    if (isMapFullscreen) {
      setIsMapFullscreen(false);
      return;
    }
    const node = mapFullscreenRef.current;
    if (node?.requestFullscreen) {
      node.requestFullscreen().catch(() => {
        // API blocked → the CSS overlay still provides the fullscreen view.
      });
    }
    setIsMapFullscreen(true);
  }, [isMapFullscreen]);

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

  // Build tour stops ONLY from editor elements marked as locations.
    // Photo-upload pins and template pins are excluded so the tour count always
    // matches the number of spots the user placed in the editor.
    const tourStops = useMemo(() => {
      const stops = [];
      const canvasW = mapCanvasWidth || 4000;
      const canvasH = mapCanvasHeight || 4000;

      if (Array.isArray(mapElements)) {
        mapElements.forEach(({ element, position }) => {
          if (element.isLocation === true && !element.isHiddenWaypoint && position) {
            const labelSource = element.type === 'image' ? element.label : (element.label || element.content);
            stops.push({
              id: `spot-${element.id}`,
              type: 'spot',
              pin: null,
              left: ((position.left + (position.width || 0) / 2) / canvasW) * 100,
              top: ((position.top + (position.height || 0) / 2) / canvasH) * 100,
              title: element.locationDetails?.name || cleanAssetName(labelSource) || t('worldMap.tourStop'),
            });
          }
        });
      }

      return stops;
    }, [mapElements, mapCanvasWidth, mapCanvasHeight, t]);

  // Pan + zoom so a stop's absolute (left%, top%) position lands in the center.
  const goToTourStop = useCallback((index) => {
    if (index < 0 || index >= tourStops.length) return;
    const stop = tourStops[index];
    const container = mapContainerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const viewportW = containerRect.width;
    const viewportH = containerRect.height;
    const targetZoom = 1.5;

    // The zoomable wrapper fills the container, so at zoom=1 a marker at
    // (left%, top%) appears at (left/100 * viewportW, top/100 * viewportH).
    const displayX = (stop.left / 100) * viewportW;
    const displayY = (stop.top / 100) * viewportH;

    // The wrapper uses `transform: scale(s) translate(t)` with transform-origin
    // at center. Mapping a point p to the screen center requires t = center - p.
    setZoomLevel(targetZoom);
    setPan({
      x: viewportW / 2 - displayX,
      y: viewportH / 2 - displayY,
    });
    setTourIndex(index);
    if (stop.pin) {
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
    <div className="max-w-6xl mx-auto px-4 pt-8 md:pt-10 pb-12 font-thai text-brand-dark">
      {/* Top Control Header Bar */}
      <div className="bg-white rounded-3xl p-4 mb-4 shadow-[0_4px_20px_-10px_rgba(45,58,46,0.10)] ring-1 ring-brand-dark/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-brand-dark rounded-2xl flex items-center justify-center text-white font-bold shrink-0">
            🗺️
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-brand-dark break-words line-clamp-2">
              {mapViewLoading ? t('worldMap.loadingMap') : (activeCommunityMap ? activeCommunityMap.title : t('worldMap.defaultTitle'))}
            </h2>
            {(mapBackgroundImage || mapCanvasStyle) && (
              <span className="inline-block text-[10px] bg-brand-green text-white px-2.5 py-0.5 rounded-full mt-1 font-semibold">
                {t('worldMap.customMapActive')}
              </span>
            )}
            <p className="text-[11px] text-brand-dark/50">
              {t('worldMap.clickDetailsHint')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {tourStops.length > 0 && !tourActive && (
            <button
              onClick={startTour}
              className="bg-emerald-400 hover:bg-emerald-300 text-brand-dark font-semibold px-4 py-2.5 rounded-full text-xs uppercase flex items-center gap-1.5 cursor-pointer transition-colors"
              title={t('worldMap.tourStart')}
            >
              <Play className="w-3.5 h-3.5 fill-brand-dark" /> {t('worldMap.tour')}
            </button>
          )}
          {activeCommunityMap && (
            <button
              onClick={() => navigateTo('details', activeCommunityMap)}
              className="bg-amber-400 hover:bg-amber-300 text-brand-dark font-semibold px-4 py-2.5 rounded-full text-xs uppercase flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {t('worldMap.viewDetails')}
            </button>
          )}
        </div>
      </div>

      {/* Fullscreen wrapper — target of the Fullscreen API; letterboxes the
          map on a black backdrop so the editor aspect ratio is preserved */}
      <div
        ref={mapFullscreenRef}
        className={isMapFullscreen ? 'fixed inset-0 z-[190] bg-black flex items-center justify-center overflow-hidden' : ''}
      >
      {/* Map Container Viewport (matches the editor's aspect ratio) */}
      <div 
        ref={mapContainerRef}
        onClick={handleMapClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className="w-full mx-auto rounded-3xl overflow-hidden shadow-[0_4px_20px_-10px_rgba(45,58,46,0.10)] ring-1 ring-brand-dark/[0.06] relative bg-[#e2f0d9] select-none [container-type:inline-size]"
        style={{ 
          aspectRatio: `${mapCanvasWidth || 4000} / ${mapCanvasHeight || 4000}`,
          ...(isMapFullscreen
            ? { width: `min(100%, calc(100vh * ${((mapCanvasWidth || 4000) / (mapCanvasHeight || 4000)).toFixed(4)}))` }
            : null),
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
              <div className="bg-white rounded-2xl px-4 py-3 shadow-[0_4px_20px_-10px_rgba(45,58,46,0.10)] ring-1 ring-brand-dark/[0.06] flex items-center gap-2 text-xs font-semibold uppercase text-brand-dark">
                <span className="w-4 h-4 border-2 border-brand-dark border-t-transparent rounded-full animate-spin"></span>
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
            <div className="bg-white rounded-2xl px-4 py-2 shadow-[0_4px_20px_-10px_rgba(45,58,46,0.10)] ring-1 ring-brand-dark/[0.06] flex items-center gap-3">
              <span className="text-xs font-semibold text-brand-dark/40 uppercase tracking-wider">
                {t('worldMap.tourLabel')} {tourIndex + 1}<span className="mx-1">/</span>{tourStops.length}
              </span>
              <span className="font-bold text-sm text-[#cc0000] truncate max-w-[200px]">{tourStops[tourIndex]?.title}</span>
              <button
                type="button"
                onClick={prevTourStop}
                disabled={tourIndex === 0}
                title={t('worldMap.tourPrev')}
                className="w-8 h-8 flex items-center justify-center border border-brand-dark/15 rounded-full bg-white hover:bg-brand-light disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextTourStop}
                disabled={tourIndex === tourStops.length - 1}
                title={t('worldMap.tourNext')}
                className="w-8 h-8 flex items-center justify-center border border-brand-dark/15 rounded-full bg-white hover:bg-brand-light disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={stopTour}
                title={t('worldMap.tourStop')}
                className="w-8 h-8 flex items-center justify-center border border-brand-dark/15 rounded-full bg-white hover:bg-red-50 text-red-600 cursor-pointer"
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
            key={selectedPin.id || selectedPin.title || 'pin'}
            pin={selectedPin}
            onClose={() => setSelectedPin(null)}
            anchorRef={mapContainerRef}
            zoomLevel={zoomLevel}
            pan={pan}
          />
        )}

        {/* Sidebar Filters & Action Buttons (Fixed on top of zoom) */}
        <div onClick={(e) => e.stopPropagation()} className="relative z-20">
          <KeyItemsSidebar 
            onOpenUpload={() => { exitMapFullscreen(); setShowAddModal(true); }} 
            onOpenMapBgModal={() => { exitMapFullscreen(); setShowBgModal(true); }}
          />
        </div>

        {/* Floating Zoom Control Panel */}
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-4 left-4 z-20 bg-white rounded-2xl p-1.5 shadow-[0_4px_20px_-10px_rgba(45,58,46,0.10)] ring-1 ring-brand-dark/[0.06] flex items-center gap-1.5"
        >
          <button 
            onClick={handleZoomIn}
            className="w-8 h-8 bg-amber-400 hover:bg-amber-300 rounded-full flex items-center justify-center font-bold shadow-sm cursor-pointer"
            title={t('worldMap.zoomIn')}
          >
            <ZoomIn className="w-4 h-4 text-brand-dark" />
          </button>
          <span className="text-xs font-semibold px-2">{Math.round(zoomLevel * 100)}%</span>
          <button 
            onClick={handleZoomOut}
            className="w-8 h-8 bg-amber-400 hover:bg-amber-300 rounded-full flex items-center justify-center font-bold shadow-sm cursor-pointer"
            title={t('worldMap.zoomOut')}
          >
            <ZoomOut className="w-4 h-4 text-brand-dark" />
          </button>
          <button 
            onClick={handleResetZoom}
            className="w-8 h-8 bg-brand-light hover:bg-brand-light/60 rounded-full flex items-center justify-center font-bold shadow-sm cursor-pointer"
            title={t('worldMap.resetZoom')}
          >
            <RotateCcw className="w-3.5 h-3.5 text-brand-dark" />
          </button>
          <button
            onClick={toggleMapFullscreen}
            className="w-8 h-8 bg-brand-light hover:bg-brand-light/60 rounded-full flex items-center justify-center font-bold shadow-sm cursor-pointer"
            title={isMapFullscreen ? t('worldMap.exitFullscreen') : t('worldMap.fullscreen')}
          >
            {isMapFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5 text-brand-dark" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5 text-brand-dark" />
            )}
          </button>
        </div>

        {/* Badge in Bottom Right */}
        <div className="absolute bottom-4 right-4 z-20 bg-white/90 backdrop-blur rounded-full px-3 py-1.5 shadow-[0_4px_20px_-10px_rgba(45,58,46,0.10)] ring-1 ring-brand-dark/[0.06] flex items-center gap-2 text-xs font-semibold">
          <ImageIcon className="w-4 h-4 text-brand-green" />
          <span>{mapBackgroundImage || mapCanvasStyle ? t('worldMap.customMapActive') : t('worldMap.kyotoCanvas')}</span>
        </div>
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
