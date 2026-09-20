import { useState, useCallback } from 'react';
import { ImageIcon, X, Plus, Minus, ZoomIn, Maximize } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { resolveCoverImage, isImageSrc, isDefaultCover } from '../../lib/imageUtils';

export default function LocationImageSlider() {
  const { selectedLocation, t } = useApp();
  const [lightbox, setLightbox] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const coverSrc = resolveCoverImage(selectedLocation);
  const bgSrc = selectedLocation?.bgThemeUrl && isImageSrc(selectedLocation.bgThemeUrl) ? selectedLocation.bgThemeUrl : null;
  const selfieUrls = Array.isArray(selectedLocation?.selfieUrls) ? selectedLocation.selfieUrls : [];

  const allImages = [];
  if (selectedLocation?.imageUrl && !isDefaultCover(selectedLocation.imageUrl) && isImageSrc(selectedLocation.imageUrl)) {
    allImages.push({ src: selectedLocation.imageUrl, label: t('details.mainImage') });
  }
  if (bgSrc && !allImages.find((img) => img.src === bgSrc)) {
    allImages.push({ src: bgSrc, label: t('details.bgImage') });
  }
  selfieUrls.forEach((url, i) => {
    if (isImageSrc(url) && !allImages.find((img) => img.src === url)) {
      allImages.push({ src: url, label: `${t('details.selfie')} ${i + 1}` });
    }
  });

  const resetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const openLightbox = useCallback((idx) => {
    setLightbox(idx);
    resetZoom();
  }, [resetZoom]);

  const closeLightbox = useCallback(() => {
    setLightbox(null);
    resetZoom();
  }, [resetZoom]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    setZoom((prev) => {
      const delta = e.deltaY > 0 ? -0.15 : 0.15;
      return Math.max(0.5, Math.min(5, prev + delta));
    });
  }, []);

  const handleDoubleClick = useCallback(() => {
    setZoom((prev) => (prev > 2 ? 1 : Math.min(3, prev + 1)));
    setPan({ x: 0, y: 0 });
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (zoom <= 1) return;
    setDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    e.preventDefault();
  }, [zoom, pan]);

  const handleMouseMove = useCallback((e) => {
    if (!dragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }, [dragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 1 && zoom > 1) {
      setDragging(true);
      setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
    }
  }, [zoom, pan]);

  const handleTouchMove = useCallback((e) => {
    if (!dragging || e.touches.length !== 1) return;
    setPan({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y });
  }, [dragging, dragStart]);

  const handleTouchEnd = useCallback(() => {
    setDragging(false);
  }, []);

  if (allImages.length <= 1) return null;

  return (
    <>
      <div className="bg-white border-4 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-2 mb-3">
          <ImageIcon className="w-4 h-4 text-red-600" />
          <h3 className="text-sm font-black uppercase">{t('details.gallery')}</h3>
          <span className="text-[10px] text-slate-500 font-sans">({allImages.length})</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory hide-scrollbar">
          {allImages.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => openLightbox(idx)}
              className="flex-shrink-0 w-20 h-20 rounded-lg border-2 border-black overflow-hidden hover:ring-2 hover:ring-red-600 transition-all active:scale-95 cursor-pointer relative group"
            >
              <img src={img.src} alt={img.label} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {lightbox !== null && (
        <div
          className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeLightbox}
          onWheel={handleWheel}
        >
          <div
            className="w-full max-w-5xl bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={handleDoubleClick}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b-2 border-black bg-white">
              <span className="text-xs font-black uppercase">{allImages[lightbox]?.label}</span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={(e) => { e.stopPropagation(); setZoom((p) => Math.max(0.5, p - 0.25)); }} className="w-7 h-7 flex items-center justify-center rounded border-2 border-black hover:bg-gray-100" title="Zoom out">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-black w-10 text-center">{Math.round(zoom * 100)}%</span>
                <button type="button" onClick={(e) => { e.stopPropagation(); setZoom((p) => Math.min(5, p + 0.25)); }} className="w-7 h-7 flex items-center justify-center rounded border-2 border-black hover:bg-gray-100" title="Zoom in">
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={(e) => { e.stopPropagation(); resetZoom(); }} className="w-7 h-7 flex items-center justify-center rounded border-2 border-black hover:bg-gray-100" title="Reset">
                  <Maximize className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={closeLightbox} className="w-7 h-7 flex items-center justify-center rounded-lg border-2 border-black hover:bg-gray-100 ml-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div
              className="relative w-full overflow-hidden bg-gray-100"
              style={{ height: '75vh', cursor: zoom > 1 ? (dragging ? 'grabbing' : 'grab') : 'default' }}
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
                <img
                  src={allImages[lightbox]?.src}
                  alt={allImages[lightbox]?.label}
                  className="max-w-full max-h-full object-contain select-none"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                  draggable={false}
                />
              </div>
            </div>
            <div className="px-4 py-2 border-t-2 border-black bg-white flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-sans">ดับเบิ้ลคลิกเพื่อซูม / ล้อเมาส์เพื่อซูม / ลากเพื่อเลื่อน</span>
              <div className="flex gap-1">
                {allImages.map((_, idx) => (
                  <button key={idx} type="button" onClick={(e) => { e.stopPropagation(); openLightbox(idx); }} className={`w-3 h-3 rounded-full border-2 border-black ${idx === lightbox ? 'bg-red-600' : 'bg-white'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
