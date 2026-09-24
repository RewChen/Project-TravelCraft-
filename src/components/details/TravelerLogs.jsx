import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Camera, X, ChevronLeft, ChevronRight, Plus, Minus, Maximize, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function TravelerLogs() {
  const { t, selectedLocation } = useApp();
  const logs = selectedLocation?.logs || [];
  const selfieLogs = logs.filter((l) => l.type === 'selfie' && l.image);
  // fallback for older records where selfieUrls stored separately
  const fallbackSelfies = !selfieLogs.length && (selectedLocation?.selfieUrls || (selectedLocation?.selfieUrl ? [selectedLocation.selfieUrl] : []));
  const displaySelfies = selfieLogs.length ? selfieLogs : (fallbackSelfies?.length ? fallbackSelfies.map((img, i) => ({ id: `fallback-${i}`, image: img, caption: selectedLocation?.title })) : []);
  const hasSelfies = displaySelfies.length > 0;
  // โชว์แค่ 3 รูปด้านล่าง ที่เหลือต้องกด "ดูทั้งหมด"
  const visibleSelfies = displaySelfies.slice(0, 3);
  const hiddenCount = Math.max(0, displaySelfies.length - visibleSelfies.length);
  const [activeIdx, setActiveIdx] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const activeLog = activeIdx !== null ? displaySelfies[activeIdx] : null;

  console.log("TravelerLogs render! activeIdx:", activeIdx, "showAll:", showAll, "hasSelfies:", hasSelfies);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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

  useEffect(() => {
    if (activeIdx === null) return;
    const onKey = (e) => {
      if (e.key === 'Escape') { setActiveIdx(null); resetZoom(); }
      if (e.key === 'ArrowLeft') { setActiveIdx((p) => (p > 0 ? p - 1 : displaySelfies.length - 1)); resetZoom(); }
      if (e.key === 'ArrowRight') { setActiveIdx((p) => (p < displaySelfies.length - 1 ? p + 1 : 0)); resetZoom(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeIdx, displaySelfies.length, resetZoom]);

  if (!hasSelfies) return null;

  return (
    <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_-10px_rgba(45,58,46,0.10)] ring-1 ring-brand-dark/[0.06]">
      <div className="flex items-center justify-between border-b border-brand-dark/[0.06] pb-3 mb-4">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="text-lg font-bold flex items-center gap-2 text-brand-dark hover:underline cursor-pointer"
          aria-label={collapsed ? t('details.expandLogs') : t('details.collapseLogs')}
        >
          <Camera className="w-5 h-5" /> {t('details.logsTitle')}
          {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
        {!collapsed && (
          <button
            onClick={() => setShowAll(true)}
            className="text-xs font-semibold hover:underline text-brand-green cursor-pointer"
          >
            {t('details.viewAll')}{displaySelfies.length > 3 ? ` (${displaySelfies.length})` : ''}
          </button>
        )}
      </div>
      {!collapsed && (
        <div className="grid grid-cols-3 gap-3">
          {visibleSelfies.map((log, idx) => (
            <button
              key={log.id}
              type="button"
              onClick={() => (idx === 2 && hiddenCount > 0 ? setShowAll(true) : setActiveIdx(idx))}
              className="aspect-square rounded-xl overflow-hidden hover:scale-[1.02] transition-transform bg-brand-light group relative cursor-pointer text-left"
            >
              <img src={log.image} alt={log.caption || 'selfie'} className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[8px] font-semibold p-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                {log.caption} {log.author ? `· ${log.author}` : ''}
              </div>
              {idx === 2 && hiddenCount > 0 ? (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white font-semibold">
                  <span className="text-lg">+{hiddenCount}</span>
                  <span className="text-[9px] uppercase">{t('details.viewAll')}</span>
                </div>
              ) : (
                <span className="absolute top-1 right-1 bg-white/90 rounded-full w-5 h-5 flex items-center justify-center text-[10px]">🔍</span>
              )}
            </button>
          ))}
        </div>
      )}
      {showAll && createPortal(
        <div className="fixed inset-0 z-[100] bg-brand-dark/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAll(false)}>
          <div className="relative w-full max-w-3xl bg-white rounded-3xl overflow-hidden shadow-[0_25px_60px_-25px_rgba(45,58,46,0.4)] max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="bg-brand-dark text-white px-4 py-3 flex items-center justify-between shrink-0">
              <span className="text-sm font-bold uppercase flex items-center gap-2"><Camera className="w-4 h-4" /> {t('details.logsTitle')} — {displaySelfies.length} {(() => { const v = t('details.photosCount'); return v === 'details.photosCount' ? 'รูป' : v; })()}</span>
              <button onClick={() => setShowAll(false)} className="w-7 h-7 bg-white/15 hover:bg-white/30 text-white rounded-full flex items-center justify-center cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {displaySelfies.map((log, idx) => (
                  <button key={log.id} type="button" onClick={() => { setShowAll(false); setActiveIdx(idx); }} className="rounded-xl overflow-hidden hover:scale-[1.02] transition-transform bg-brand-light group text-left cursor-pointer">
                    <img src={log.image} alt={log.caption || 'selfie'} className="w-full h-40 object-cover" />
                    <div className="p-2 bg-white">
                      <p className="text-[10px] font-bold truncate">{log.caption || t('details.logsTitle')}</p>
                      <p className="text-[9px] text-brand-dark/50 font-semibold truncate">{log.author || ''} {log.date ? `· ${log.date}` : ''}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
      {activeLog && createPortal(
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => { setActiveIdx(null); resetZoom(); }}
          onWheel={handleWheel}
        >
          <div
            className="w-full max-w-5xl bg-white rounded-3xl shadow-[0_25px_60px_-25px_rgba(45,58,46,0.4)] overflow-hidden relative flex flex-col"
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={handleDoubleClick}
          >
            <div className="flex items-center justify-between px-4 py-3 bg-white shrink-0">
              <span className="text-xs font-bold uppercase truncate mr-4">{activeLog.caption || t('details.logsTitle')} {activeIdx + 1}/{displaySelfies.length}</span>
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
                <button type="button" onClick={() => { setActiveIdx(null); resetZoom(); }} className="w-7 h-7 flex items-center justify-center rounded-full bg-[#cc0000] text-white hover:bg-[#b30000] ml-1 cursor-pointer">
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
                <img
                  src={activeLog.image}
                  alt={activeLog.caption || 'selfie enlarged'}
                  className="w-full h-full object-contain select-none"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                  draggable={false}
                />
              </div>

              {displaySelfies.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveIdx((p) => (p > 0 ? p - 1 : displaySelfies.length - 1)); resetZoom(); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white shadow-[0_10px_30px_-15px_rgba(45,58,46,0.4)] z-10"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveIdx((p) => (p < displaySelfies.length - 1 ? p + 1 : 0)); resetZoom(); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white shadow-[0_10px_30px_-15px_rgba(45,58,46,0.4)] z-10"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            <div className="px-4 py-3 bg-white flex items-center justify-between shrink-0">
              <span className="text-[10px] text-brand-dark/50">ดับเบิ้ลคลิกเพื่อซูม / ล้อเมาส์เพื่อซูม / ลากเพื่อเลื่อน</span>
              {(activeLog.author || activeLog.date) && (
                <div className="text-[11px] font-semibold flex items-center gap-2">
                  <span>{activeLog.author || ''}</span>
                  <span className="text-brand-dark/50">{activeLog.date || ''}</span>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
