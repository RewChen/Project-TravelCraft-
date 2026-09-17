import { useEffect, useRef, useState } from 'react';
import { X, Check, ZoomIn, ZoomOut, RotateCw, Undo2, Move } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { circularCropToCanvas } from '../../lib/imageUtils';

const OUTPUT_SIZE = 512;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 8;

export default function AvatarCropModal({ file, onCancel, onConfirm }) {
  const { t } = useApp();
  const [img, setImg] = useState(null);
  const [displaySize, setDisplaySize] = useState(320);
  const [zoom, setZoom] = useState(1);
  const [dx, setDx] = useState(0);
  const [dy, setDy] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const cropRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const dragRef = useRef({ pointers: new Map(), startZoom: 1, startDistance: 0, moved: false });

  const clampZoom = (z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

  // Base scale so the smaller image dimension fills the circle (fully covers it).
  const baseScale = img ? displaySize / Math.min(img.naturalWidth, img.naturalHeight) : 1;
  // Zoom that shows the whole image inside the circle, leaving room to pan freely.
  const fitViewZoom = img
    ? clampZoom(Math.min(img.naturalWidth, img.naturalHeight) / Math.max(img.naturalWidth, img.naturalHeight))
    : 1;
  const totalScale = baseScale * zoom;

  // Load the picked file once. The object URL is created per run so that
  // StrictMode's mount -> cleanup -> mount cycle always gets a live URL.
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (cancelled) return;
      const startZoom = clampZoom(
        Math.min(image.naturalWidth, image.naturalHeight) / Math.max(image.naturalWidth, image.naturalHeight)
      );
      setImg(image);
      setZoom(startZoom);
      setDx(0);
      setDy(0);
      setRotation(0);
      setError('');
    };
    image.onerror = () => {
      if (!cancelled) setError('img');
    };
    image.src = url;
    return () => {
      cancelled = true;
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // Keep the measured crop-container size in sync (responsive width).
  useEffect(() => {
    const measure = () => {
      if (cropRef.current) setDisplaySize(cropRef.current.offsetWidth || 320);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Redraw the live preview with the exact transform used at export time.
  useEffect(() => {
    const canvasEl = previewCanvasRef.current;
    if (!canvasEl || !img) return;
    const ctx = canvasEl.getContext('2d');
    ctx.clearRect(0, 0, displaySize, displaySize);
    ctx.save();
    ctx.beginPath();
    ctx.arc(displaySize / 2, displaySize / 2, displaySize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.translate(displaySize / 2 + dx, displaySize / 2 + dy);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(totalScale, totalScale);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2, img.naturalWidth, img.naturalHeight);
    ctx.restore();
  }, [img, totalScale, dx, dy, rotation, displaySize]);

  const distanceBetween = (p1, p2) =>
    Math.hypot(p2.clientX - p1.clientX, p2.clientY - p1.clientY);

  const handlePointerDown = (e) => {
    if (!img) return;
    const pointers = dragRef.current.pointers;
    pointers.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
    dragRef.current.crop = { dx, dy };
    dragRef.current.moved = false;
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      dragRef.current.startDistance = distanceBetween(a, b);
      dragRef.current.startZoom = zoom;
    }
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e) => {
    const pointers = dragRef.current.pointers;
    if (!pointers.has(e.pointerId)) return;
    const prev = pointers.get(e.pointerId);
    const deltaX = e.clientX - prev.clientX;
    const deltaY = e.clientY - prev.clientY;
    dragRef.current.moved = true;

    if (pointers.size === 2) {
      // Pinch zoom (mobile)
      pointers.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
      const [a, b] = [...pointers.values()];
      const currentDistance = distanceBetween(a, b);
      const { startDistance, startZoom } = dragRef.current;
      if (startDistance > 0) {
        setZoom(clampZoom(startZoom * (currentDistance / startDistance)));
      }
      return;
    }

    setDx(dragRef.current.crop.dx + deltaX);
    setDy(dragRef.current.crop.dy + deltaY);
    pointers.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
  };

  const handlePointerEnd = (e) => {
    dragRef.current.pointers.delete(e.pointerId);
  };

  // Wheel zoom on desktop.
  useEffect(() => {
    const el = cropRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      setZoom((z) => clampZoom(z * factor));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [img]);

  const handleZoomIn = () => setZoom((z) => clampZoom(z * 1.25));
  const handleZoomOut = () => setZoom((z) => clampZoom(z / 1.25));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);
  const handleReset = () => {
    setZoom(fitViewZoom);
    setDx(0);
    setDy(0);
    setRotation(0);
  };

  const handleNext = () => {
    if (!img || busy) return;
    setBusy(true);
    setError('');
    try {
      const canvas = circularCropToCanvas({
        img,
        dx,
        dy,
        scale: totalScale,
        rotation,
        displaySize,
        outputSize: OUTPUT_SIZE,
      });
      canvas.toBlob((blob) => {
        if (!blob) {
          setBusy(false);
          setError('export');
          return;
        }
        const cropped = new File([blob], 'avatar.png', { type: 'image/png' });
        onConfirm(cropped);
        setBusy(false);
      }, 'image/png');
    } catch (err) {
      console.warn('Avatar crop failed:', err);
      setBusy(false);
      setError('export');
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 font-mono">
      <div className="w-full max-w-md bg-white border-4 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b-2 border-black bg-amber-300">
          <h3 className="text-sm font-black uppercase tracking-wide">{t('profile.cropTitle')}</h3>
          <button
            type="button"
            onClick={onCancel}
            title={t('profile.cancel')}
            aria-label={t('profile.cancel')}
            className="w-8 h-8 bg-white text-black border-2 border-black rounded flex items-center justify-center hover:bg-gray-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Crop area */}
        <div className="p-5">
          <p className="text-[11px] text-slate-600 text-center mb-3 font-bold flex items-center justify-center gap-1">
            <Move className="w-3.5 h-3.5" /> {t('profile.cropDragHint')}
          </p>

          <div className="relative mx-auto w-[min(78vw,340px)] aspect-square bg-[repeating-conic-gradient(#e5e7eb_0%_25%,#fff_0%_50%)] bg-[length:16px_16px] border-2 border-black rounded-full overflow-hidden select-none touch-none"
               ref={cropRef}
               onPointerDown={handlePointerDown}
               onPointerMove={handlePointerMove}
               onPointerUp={handlePointerEnd}
               onPointerCancel={handlePointerEnd}>
            <canvas
              ref={previewCanvasRef}
              width={displaySize}
              height={displaySize}
              className="absolute inset-0 w-full h-full pointer-events-none"
            />
            {!img && !error && (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs font-bold">
                Loading…
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-50 text-red-600 text-xs font-black text-center px-4">
                {error === 'img' ? t('profile.cropLoadFailed') : t('profile.cropExportFailed')}
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="px-5 pb-5">
          <div className="grid grid-cols-3 gap-2 mb-4">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={busy || !img}
              className="flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-slate-700 border-2 border-black rounded-lg py-2 text-xs font-black uppercase cursor-pointer disabled:opacity-40"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRotate}
              disabled={busy || !img}
              className="flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-slate-700 border-2 border-black rounded-lg py-2 text-xs font-black uppercase cursor-pointer disabled:opacity-40"
            >
              <RotateCw className="w-4 h-4" /> {t('profile.cropRotate')}
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={busy || !img}
              className="flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-slate-700 border-2 border-black rounded-lg py-2 text-xs font-black uppercase cursor-pointer disabled:opacity-40"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handleReset}
              disabled={busy || !img}
              className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer disabled:opacity-40"
            >
              <Undo2 className="w-4 h-4" /> {t('profile.cropReset')}
            </button>
            <span className="text-[11px] font-black text-slate-500 uppercase">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="flex-1 py-2.5 bg-white hover:bg-gray-100 text-slate-700 border-2 border-black rounded-lg text-xs font-black uppercase cursor-pointer disabled:opacity-40"
            >
              {t('profile.cancel')}
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={busy || !img}
              className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-300 text-black border-2 border-black rounded-lg text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              {busy ? '…' : (<><Check className="w-4 h-4" /> {t('profile.cropNext')}</>)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}