import { MapPin, ImageIcon, Clapperboard, X, Plus, Minus, Maximize } from 'lucide-react';
import { useMemo, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { rarityColorForTier, rarityLabelKey } from '../../lib/mapViews';
import { resolveRealCoverImage, collectVideoUrls, toEmbedUrl } from '../../lib/imageUtils';

export default function LocationHero() {
  const { selectedLocation, t, effectiveRarityFor } = useApp();
  const tier = effectiveRarityFor(selectedLocation);
  const placeholderRegions = new Set([
    'Custom Traveler Realm',
    'Custom Realm',
    'Unknown Region',
    'Global Realm',
    'Custom Realms'
  ]);
  const rawRegion = selectedLocation.region ? String(selectedLocation.region) : '';
  const displayRegion = rawRegion && !rawRegion.toLowerCase().startsWith('editor.')
    && !placeholderRegions.has(rawRegion)
    ? rawRegion
    : '';

  // สื่อจากฟอร์มแก้ไขหมุดขึ้นแค่ popup ของ element — หน้า Details ไม่ยุ่ง (hero ถูกซ่อน)
  const popupOnlyMedia = Boolean(selectedLocation?.popupMediaOnly);

  // Hero owns only the location cover. The separate Photo section lower on the
  // Details page owns the gallery itself.
  const photoList = useMemo(
    () => {
      const cover = popupOnlyMedia ? null : resolveRealCoverImage(selectedLocation);
      return cover ? [cover] : [];
    },
    [selectedLocation, popupOnlyMedia]
  );

  // คลิปวิดีโอทั้งหมดของจุดนี้ (อัปโหลด + ลิงก์ YouTube) — แสดงเป็นส่วนข้างล่าง ไม่สลับในปก
  const videoList = useMemo(
    () => (popupOnlyMedia ? [] : collectVideoUrls(selectedLocation)),
    [selectedLocation, popupOnlyMedia]
  );

  const [failedPhotoIdx, setFailedPhotoIdx] = useState(-1);
  const [coverPreviewOpen, setCoverPreviewOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const activePhotoIdx = 0;
  const currentPhoto = photoList[activePhotoIdx] || null;
  const hasCover = photoList.length > 0;
  const displayCover = failedPhotoIdx === activePhotoIdx ? null : currentPhoto;
  // ซ่อน hero image ทั้งหมดถ้า creator ไม่ได้ใส่รูป cover จริง
  const showHeroMedia = hasCover;


  const resetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [setZoom, setPan]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    setZoom((prev) => {
      const delta = e.deltaY > 0 ? -0.15 : 0.15;
      return Math.max(0.5, Math.min(5, prev + delta));
    });
  }, [setZoom]);

  const handleDoubleClick = useCallback(() => {
    setZoom((prev) => (prev > 2 ? 1 : Math.min(3, prev + 1)));
    setPan({ x: 0, y: 0 });
  }, [setZoom, setPan]);

  const handleMouseDown = useCallback((e) => {
    if (zoom <= 1) return;
    setDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    e.preventDefault();
  }, [zoom, pan, setDragging, setDragStart]);

  const handleMouseMove = useCallback((e) => {
    if (!dragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }, [dragging, dragStart, setPan]);

  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, [setDragging]);

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 1 && zoom > 1) {
      setDragging(true);
      setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
    }
  }, [zoom, pan, setDragging, setDragStart]);

  const handleTouchMove = useCallback((e) => {
    if (!dragging || e.touches.length !== 1) return;
    setPan({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y });
  }, [dragging, dragStart, setPan]);

  const handleTouchEnd = useCallback(() => {
    setDragging(false);
  }, [setDragging]);

  const openPreview = useCallback(() => {
    setCoverPreviewOpen(true);
    resetZoom();
  }, [resetZoom, setCoverPreviewOpen]);

  const closePreview = useCallback(() => {
    setCoverPreviewOpen(false);
    resetZoom();
  }, [resetZoom, setCoverPreviewOpen]);

  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-[0_4px_20px_-10px_rgba(45,58,46,0.10)] ring-1 ring-brand-dark/[0.06]">
      {showHeroMedia && (
      <div className="h-64 bg-brand-light dark:bg-slate-900 relative overflow-hidden">
        {hasCover && displayCover ? (
          <button type="button" onClick={openPreview} title="ดูรูปปกขนาดใหญ่" className="absolute inset-0 w-full h-full cursor-zoom-in">
            <img src={displayCover} alt={selectedLocation.title} onError={() => setFailedPhotoIdx(activePhotoIdx)} className="absolute inset-0 w-full h-full object-cover" />
          </button>
        ) : null}
        {hasCover && <div className="absolute inset-0 bg-black/25 pointer-events-none" />}
        {displayRegion && (
          <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-brand-dark/80 backdrop-blur text-white px-3 py-1 rounded-full text-[10px] font-semibold w-fit">
            <MapPin className="w-3 h-3" /> {displayRegion}
          </div>
        )}
        {hasCover && <ImageIcon className="absolute bottom-4 right-4 w-8 h-8 text-white/70 pointer-events-none" />}
      </div>
      )}
      
      <div className="bg-[#cc0000] text-white p-5 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight drop-shadow-md">
          {selectedLocation.title}
        </h1>
        <div className="flex flex-wrap gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-sm ${rarityColorForTier(tier)}`}>
            ◆ {t(rarityLabelKey(tier))}
          </span>
          <span className="bg-amber-400 text-brand-dark px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-sm">
            ★ {selectedLocation.type || 'Landmark'}
          </span>
          <span className="bg-white text-brand-dark px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-sm">
            📷 {selectedLocation.tag || 'Scenic'}
          </span>
        </div>
      </div>
      {/* วิดีโออยู่ด้านล่างของการ์ด (ไม่มีปุ่มสลับในปกแล้ว) */}
      {videoList.length > 0 && (
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2 text-brand-dark dark:text-slate-100">
            <Clapperboard className="w-4 h-4 text-brand-green" />
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em]">{t('details.mediaVideoSection')}</h2>
            {videoList.length > 1 && (
              <span className="ml-auto text-[10px] font-semibold uppercase text-brand-dark/40 dark:text-slate-300/50 tabular-nums">
                {videoList.length}
              </span>
            )}
          </div>
          <div className="max-h-[540px] overflow-y-auto overscroll-contain space-y-3 pr-1">
            {videoList.map((videoUrl, videoIdx) => {
              const videoSrc = toEmbedUrl(videoUrl);
              const isFileVideo = videoUrl.startsWith('data:video/') || !videoSrc.includes('/embed/');
              return isFileVideo ? (
                <video
                  key={`${videoUrl}-${videoIdx}`}
                  src={videoSrc}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full aspect-video bg-black rounded-2xl"
                />
              ) : (
                <iframe
                  key={`${videoUrl}-${videoIdx}`}
                  src={videoSrc}
                  title={t('details.mediaVideoTitle', { title: selectedLocation.title })}
                  className="w-full aspect-video bg-black rounded-2xl"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              );
            })}
          </div>
        </div>
      )}
      {coverPreviewOpen && displayCover && createPortal(
        <div
          className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closePreview}
          onWheel={handleWheel}
        >
          <div
            className="w-full max-w-5xl bg-white rounded-3xl shadow-[0_25px_60px_-25px_rgba(45,58,46,0.4)] overflow-hidden flex flex-col"
            onClick={(event) => event.stopPropagation()}
            onDoubleClick={handleDoubleClick}
          >
            <div className="flex items-center justify-between px-4 py-3 bg-white shrink-0">
              <h3 className="font-bold text-sm uppercase truncate mr-4">{selectedLocation.title}</h3>
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" onClick={(e) => { e.stopPropagation(); setZoom((p) => Math.max(0.5, p - 0.25)); }} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-brand-light" title="Zoom out">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-semibold w-10 text-center">{Math.round(zoom * 100)}%</span>
                <button type="button" onClick={(e) => { e.stopPropagation(); setZoom((p) => Math.min(5, p + 0.25)); }} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-brand-light" title="Zoom in">
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={(e) => { e.stopPropagation(); resetZoom(); }} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-brand-light" title="Reset">
                  <Maximize className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={closePreview} className="w-7 h-7 flex items-center justify-center rounded-full bg-[#cc0000] text-white hover:bg-[#b30000] ml-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div
              className="relative w-full overflow-hidden bg-gray-100"
              style={{ height: '75vh', minHeight: '75vh', cursor: zoom > 1 ? (dragging ? 'grabbing' : 'grab') : 'default' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transition: dragging ? 'none' : 'transform 0.15s ease' }}
              >
                <img src={displayCover} alt={selectedLocation.title} onError={() => setFailedPhotoIdx(activePhotoIdx)} className="w-full h-full object-contain select-none" style={{ pointerEvents: 'none', userSelect: 'none' }} draggable={false} />
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
