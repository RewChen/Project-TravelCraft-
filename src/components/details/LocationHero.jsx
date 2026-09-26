import { MapPin, ImageIcon, Images, Clapperboard, X, Plus, Minus, Maximize, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { rarityColorForTier, rarityLabelKey } from '../../lib/mapViews';
import { resolveRealCoverImage, toEmbedUrl, isDefaultCover } from '../../lib/imageUtils';

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
  const coverImage = resolveRealCoverImage(selectedLocation);

  // สื่อจากฟอร์มแก้ไขหมุดขึ้นแค่ popup ของ element — หน้า Details ไม่ยุ่ง (hero ถูกซ่อน)
  const popupOnlyMedia = Boolean(selectedLocation?.popupMediaOnly);

  // รูปทั้งหมดของจุดนี้: รูปหลัก + รูปที่อัปโหลดเพิ่ม (imageUrls) + รูปจาก publish (selfie*)
  const photoList = useMemo(() => {
    if (popupOnlyMedia) return [];
    const candidates = [
      ...(coverImage ? [coverImage] : []),
      ...(Array.isArray(selectedLocation?.imageUrls) ? selectedLocation.imageUrls : []),
      ...(Array.isArray(selectedLocation?.selfieUrls) ? selectedLocation.selfieUrls : []),
      ...(typeof selectedLocation?.selfieUrl === 'string' && selectedLocation.selfieUrl ? [selectedLocation.selfieUrl] : [])
    ];
    return [...new Set(candidates.filter((url) => typeof url === 'string' && url && !isDefaultCover(url)))];
  }, [selectedLocation, coverImage, popupOnlyMedia]);

  // คลิปวิดีโอทั้งหมดของจุดนี้ (อัปโหลด + ลิงก์ YouTube)
  const videoList = useMemo(() => {
    if (popupOnlyMedia) return [];
    const candidates = Array.isArray(selectedLocation?.videoUrls) && selectedLocation.videoUrls.length
      ? selectedLocation.videoUrls
      : (selectedLocation?.videoUrl ? [selectedLocation.videoUrl] : []);
    return [...new Set(candidates.filter((url) => typeof url === 'string' && url))];
  }, [selectedLocation, popupOnlyMedia]);

  const [failedPhotoIdx, setFailedPhotoIdx] = useState(-1);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [videoIdx, setVideoIdx] = useState(0);
  const [coverPreviewOpen, setCoverPreviewOpen] = useState(false);
  const [mediaTab, setMediaTab] = useState('photo'); // photo | video
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const activePhotoIdx = photoList.length ? Math.min(photoIdx, photoList.length - 1) : 0;
  const activeVideoIdx = videoList.length ? Math.min(videoIdx, videoList.length - 1) : 0;
  const currentPhoto = photoList[activePhotoIdx] || null;
  const currentVideoUrl = videoList[activeVideoIdx] || '';
  const hasCover = photoList.length > 0;
  const displayCover = failedPhotoIdx === activePhotoIdx ? null : currentPhoto;
  const videoSrc = useMemo(() => toEmbedUrl(currentVideoUrl), [currentVideoUrl]);
  const hasVideo = Boolean(videoSrc);
  const isFileVideo = Boolean(currentVideoUrl) &&
    (currentVideoUrl.startsWith('data:video/') || !videoSrc.includes('/embed/'));
  const showVideo = hasVideo && mediaTab === 'video';
  // ซ่อน hero image ทั้งหมดถ้า creator ไม่ได้ใส่รูป cover จริง
  const showHeroMedia = hasCover || hasVideo;

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
        {showVideo ? (
          isFileVideo ? (
            <video src={videoSrc} controls className="absolute inset-0 w-full h-full object-cover bg-black" />
          ) : (
            <iframe
              src={videoSrc}
              title={t('details.videoTitle', { title: selectedLocation.title })}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          )
        ) : !showVideo && hasCover && displayCover ? (
          <button type="button" onClick={openPreview} title="ดูรูปปกขนาดใหญ่" className="absolute inset-0 w-full h-full cursor-zoom-in">
            <img src={displayCover} alt={selectedLocation.title} onError={() => setFailedPhotoIdx(activePhotoIdx)} className="absolute inset-0 w-full h-full object-cover" />
          </button>
        ) : null}
        {!showVideo && hasCover && <div className="absolute inset-0 bg-black/25 pointer-events-none" />}
        {displayRegion && (
          <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-brand-dark/80 backdrop-blur text-white px-3 py-1 rounded-full text-[10px] font-semibold w-fit">
            <MapPin className="w-3 h-3" /> {displayRegion}
          </div>
        )}
        {/* ปุ่มสลับ ภาพถ่าย / วิดีโอทัวร์ */}
        {hasVideo && (
          <div className="absolute top-4 right-4 flex gap-1.5">
            <button
              type="button"
              onClick={() => setMediaTab('photo')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-semibold uppercase cursor-pointer backdrop-blur ${!showVideo ? 'bg-white text-brand-dark' : 'bg-black/60 text-white hover:bg-black/80'}`}
            >
              <Images className="w-3.5 h-3.5" /> {t('details.mediaPhotos')}
            </button>
            <button
              type="button"
              onClick={() => setMediaTab('video')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-semibold uppercase cursor-pointer backdrop-blur ${showVideo ? 'bg-white text-brand-dark' : 'bg-black/60 text-white hover:bg-black/80'}`}
            >
              <Clapperboard className="w-3.5 h-3.5" /> {t('details.mediaVideo')}
            </button>
          </div>
        )}
        {/* เลื่อนดูรูป/คลิปเมื่อจุดนั้นมีหลายไฟล์ */}
        {!showVideo && photoList.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setPhotoIdx((idx) => (idx - 1 + photoList.length) % photoList.length)}
              title={t('details.prevMedia')}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/55 hover:bg-black/75 text-white flex items-center justify-center cursor-pointer backdrop-blur"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setPhotoIdx((idx) => (idx + 1) % photoList.length)}
              title={t('details.nextMedia')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/55 hover:bg-black/75 text-white flex items-center justify-center cursor-pointer backdrop-blur"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="absolute bottom-4 left-4 bg-black/60 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur">{activePhotoIdx + 1}/{photoList.length}</span>
          </>
        )}
        {showVideo && videoList.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setVideoIdx((idx) => (idx - 1 + videoList.length) % videoList.length)}
              title={t('details.prevMedia')}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/55 hover:bg-black/75 text-white flex items-center justify-center cursor-pointer backdrop-blur z-10"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setVideoIdx((idx) => (idx + 1) % videoList.length)}
              title={t('details.nextMedia')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/55 hover:bg-black/75 text-white flex items-center justify-center cursor-pointer backdrop-blur z-10"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="absolute bottom-4 left-4 bg-black/60 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur z-10">{activeVideoIdx + 1}/{videoList.length}</span>
          </>
        )}
        {!showVideo && hasCover && <ImageIcon className="absolute bottom-4 right-4 w-8 h-8 text-white/70 pointer-events-none" />}
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
      {/* วิดีโออยู่ในปกนี้แล้ว (แท็บวิดีโอทัวร์) ไม่ต้องแยก section */}
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
