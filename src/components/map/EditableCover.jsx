import { useCallback, useEffect, useRef, useState } from 'react';
import { ImagePlus, Pencil, X, ZoomIn, ZoomOut, RotateCcw, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { coverCropRect, rectCropToCanvas } from '../../lib/imageUtils';

// Interactive cover editor used by forms that store a single image src
// (data URL or remote URL). Users can drag/zoom the photo freely and bake the
// visible 16:9 window back into a compact data URL via onApply.
export default function EditableCover({ value, onApply, onRemove }) {
  const { t } = useApp();
  const fileInputRef = useRef(null);
  const viewportRef = useRef(null);
  const imgElRef = useRef(null);
  const viewImgRef = useRef(null);
  const dragRef = useRef(null);
  const zoomRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });
  const sizeRef = useRef({ w: 0, h: 0 });
  const objectUrlRef = useRef('');

  const [cropping, setCropping] = useState(false);
  const [feedSrc, setFeedSrc] = useState('');
  const [imgEl, setImgEl] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [busy, setBusy] = useState(false);

  const clampOffsetFor = (z, x, y) => {
    const img = imgElRef.current;
    const { w, h } = sizeRef.current;
    if (!img || !w || !h) return { x: 0, y: 0 };
    const iw = img.naturalWidth || 0;
    const ih = img.naturalHeight || 0;
    if (!iw || !ih) return { x: 0, y: 0 };
    const scale = Math.max(w / iw, h / ih) * z;
    const maxX = Math.max(0, iw * scale - w) / 2;
    const maxY = Math.max(0, ih * scale - h) / 2;
    return { x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) };
  };

  const commitCrop = (z, o) => {
    zoomRef.current = z;
    offsetRef.current = o;
    setZoom(z);
    setOffset({ ...o });
  };

  const setZoomed = useCallback((nextZoom) => {
    const z = Math.max(1, Math.min(4, nextZoom));
    commitCrop(z, clampOffsetFor(z, offsetRef.current.x, offsetRef.current.y));
  }, []);

  const resetCrop = () => commitCrop(1, { x: 0, y: 0 });

  const resetEdition = () => {
    zoomRef.current = 1;
    offsetRef.current = { x: 0, y: 0 };
    dragRef.current = null;
    sizeRef.current = { w: 0, h: 0 };
    imgElRef.current = null;
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setBox({ w: 0, h: 0 });
    setImgEl(null);
  };

  const revokeFeed = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = '';
    }
  };

  const loadSource = (src) => {
    const img = new Image();
    if (/^https?:\/\//.test(src)) img.crossOrigin = 'anonymous';
    img.onload = () => { imgElRef.current = img; setImgEl(img); };
    img.onerror = () => { imgElRef.current = null; setImgEl(null); };
    img.src = src;
  };

  const beginCrop = (src) => {
    resetEdition();
    setFeedSrc(src);
    setCropping(true);
    loadSource(src);
  };

  const handlePick = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';
    if (!file.type.startsWith('image/')) return;
    revokeFeed();
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    beginCrop(url);
  };

  const handleApply = async () => {
    if (busy) return;
    const img = imgElRef.current;
    const { w, h } = sizeRef.current;
    if (!img || !img.naturalWidth || !w || !h) return;
    setBusy(true);
    let next = '';
    try {
      const ratio = Math.max(w, 1) / Math.max(h, 1);
      const targetH = Math.max(1, Math.round(1280 / ratio));
      const result = await rectCropToCanvas({
        img,
        viewportW: w,
        viewportH: h,
        offsetX: offsetRef.current.x,
        offsetY: offsetRef.current.y,
        zoom: zoomRef.current,
        outputW: 1280,
        outputH: targetH
      });
      const dataUrl = result.canvas.toDataURL('image/webp', 0.85);
      if (dataUrl.startsWith('data:image')) next = dataUrl;
    } catch (err) {
      console.warn('Cover crop failed; keeping original:', err);
    }
    setBusy(false);
    if (next) {
      revokeFeed();
      setFeedSrc('');
      setCropping(false);
      resetEdition();
      onApply(next);
    }
  };

  const handleCancel = () => {
    revokeFeed();
    setFeedSrc('');
    setCropping(false);
    resetEdition();
  };

  const startCoverDrag = (event) => {
    event.preventDefault();
    event.stopPropagation();
    dragRef.current = { startX: event.clientX, startY: event.clientY, baseX: offsetRef.current.x, baseY: offsetRef.current.y };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const moveCoverDrag = (event) => {
    if (!dragRef.current) return;
    const next = clampOffsetFor(zoomRef.current, dragRef.current.baseX + (event.clientX - dragRef.current.startX), dragRef.current.baseY + (event.clientY - dragRef.current.startY));
    offsetRef.current = next;
    setOffset({ ...next });
  };

  const endCoverDrag = () => { dragRef.current = null; };

  const handleViewportLoaded = () => {
    const vp = viewportRef.current;
    if (vp) {
      const rect = vp.getBoundingClientRect();
      sizeRef.current = { w: Math.round(rect.width) || 0, h: Math.round(rect.height) || 0 };
      setBox(sizeRef.current);
    }
    offsetRef.current = clampOffsetFor(zoomRef.current, offsetRef.current.x, offsetRef.current.y);
    setOffset({ ...offsetRef.current });
  };

  useEffect(() => {
    if (!cropping || !viewportRef.current) return;
    const el = viewportRef.current;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      sizeRef.current = { w: Math.round(rect.width) || 0, h: Math.round(rect.height) || 0 };
      setBox(sizeRef.current);
    };
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (ro) ro.observe(el);
    const onWheel = (event) => {
      event.preventDefault();
      setZoomed(zoomRef.current + (event.deltaY < 0 ? 0.15 : -0.15));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      if (ro) ro.disconnect();
      el.removeEventListener('wheel', onWheel);
    };
  }, [cropping, setZoomed]);

  useEffect(() => revokeFeed, []);

  const display = (() => {
    const { w, h } = box;
    if (imgEl && imgEl.naturalWidth && w && h) {
      return coverCropRect({ img: imgEl, viewportW: w, viewportH: h, offsetX: offset.x, offsetY: offset.y, zoom });
    }
    return { displayW: '100%', displayH: '100%', displayLeft: 0, displayTop: 0 };
  })();

  if (!cropping) {
    if (!value) {
      return (
        <div>
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handlePick} className="hidden" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-black rounded bg-gray-50 hover:bg-amber-50 py-5 flex flex-col items-center justify-center gap-2"
          >
            <ImagePlus className="w-6 h-6 text-red-600" />
            <span className="text-[10px] font-black uppercase">{t('editor.uploadCover')}</span>
          </button>
          {t('editor.coverHelper') && <p className="mt-1 text-[10px] text-gray-500 font-bold">{t('editor.coverHelper')}</p>}
        </div>
      );
    }
    return (
      <div>
        <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handlePick} className="hidden" />
        <div className="relative border-2 border-black rounded overflow-hidden bg-gray-50">
          <img src={value} alt={t('editor.coverPreviewAlt')} className="w-full aspect-video object-cover pointer-events-none" />
          <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
            <button type="button" onClick={() => beginCrop(value)} title={t('editor.adjustCover')} className="w-7 h-7 bg-white dark:bg-slate-800 border-2 border-black rounded-full flex items-center justify-center hover:bg-amber-50 opacity-90 cursor-pointer"><Pencil className="w-3.5 h-3.5 text-blue-600" /></button>
            <button type="button" onClick={onRemove} title={t('editor.removeCover')} className="w-7 h-7 bg-white dark:bg-slate-800 border-2 border-black rounded-full flex items-center justify-center hover:bg-red-50 text-red-600 opacity-90 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
          </div>
        </div>
        <div className="mt-2">
          <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 border-2 border-black rounded bg-amber-400 hover:bg-amber-300 px-3 py-2 font-black text-[10px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <ImagePlus className="w-3.5 h-3.5" /> {t('myMaps.changeCover')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handlePick} className="hidden" />
      <div className="relative">
        <div
          ref={viewportRef}
          className="relative w-full overflow-hidden border-2 border-black bg-gray-100 touch-none select-none cursor-grab active:cursor-grabbing"
          onPointerDown={startCoverDrag}
          onPointerMove={moveCoverDrag}
          onPointerUp={endCoverDrag}
          onPointerCancel={endCoverDrag}
        >
          <div className="aspect-video w-full" />
          <div
            className="absolute top-0 left-0"
            style={{ width: display.displayW, height: display.displayH, transform: `translate(${display.displayLeft}px, ${display.displayTop}px)` }}
          >
            <img
              ref={(el) => { viewImgRef.current = el; }}
              src={feedSrc}
              onLoad={handleViewportLoaded}
              alt=""
              draggable={false}
              className="w-full h-full object-cover pointer-events-none"
            />
          </div>
        </div>
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 pointer-events-none bg-black/60 text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded-full whitespace-nowrap">
          {t('myMaps.dragToReposition')}
        </div>
        <div className="absolute bottom-1.5 left-1.5">
          <button type="button" title={t('myMaps.changeCover')} onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 px-2 py-1 bg-[#cc0000] text-white border-2 border-black rounded text-[9px] font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <ImagePlus className="w-3 h-3" /> {t('myMaps.changeCover')}
          </button>
        </div>
        <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1">
          <button type="button" title={t('myMaps.zoomOut')} onClick={() => setZoomed(zoomRef.current - 0.25)} className="flex items-center justify-center w-7 h-7 bg-white dark:bg-slate-800 border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"><ZoomOut className="w-3.5 h-3.5" /></button>
          <span className="text-[9px] font-black bg-white/80 dark:bg-slate-800/80 border border-black px-1.5 py-0.5 rounded">{Math.round(zoom * 100)}%</span>
          <button type="button" title={t('myMaps.zoomIn')} onClick={() => setZoomed(zoomRef.current + 0.25)} className="flex items-center justify-center w-7 h-7 bg-white dark:bg-slate-800 border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"><ZoomIn className="w-3.5 h-3.5" /></button>
          <button type="button" title={t('myMaps.resetCover')} onClick={resetCrop} className="flex items-center justify-center w-7 h-7 bg-white dark:bg-slate-800 border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"><RotateCcw className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <button type="button" onClick={handleCancel} disabled={busy} className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border-2 border-black rounded font-black text-[10px] uppercase disabled:opacity-40">{t('editor.cancel')}</button>
        <button type="button" onClick={handleApply} disabled={busy || !imgEl} className="flex-1 px-3 py-2 bg-emerald-500 text-white border-2 border-black rounded font-black text-[10px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-1.5 disabled:opacity-40">
          {busy ? '…' : (<><Check className="w-3.5 h-3.5" /> {t('editor.applyCrop')}</>)}
        </button>
      </div>
    </div>
  );
}
