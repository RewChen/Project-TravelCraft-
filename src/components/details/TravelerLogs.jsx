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
    <div className="bg-white border-4 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-4">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="text-lg font-black flex items-center gap-2 text-indigo-700 hover:underline cursor-pointer"
          aria-label={collapsed ? t('details.expandLogs') : t('details.collapseLogs')}
        >
          <Camera className="w-5 h-5" /> {t('details.logsTitle')}
          {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
        {!collapsed && (
          <button
            onClick={() => setShowAll(true)}
            className="text-xs font-bold hover:underline text-red-600 cursor-pointer"
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
              className="aspect-square border-2 border-black rounded overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:scale-[1.02] transition-transform bg-gray-100 group relative cursor-pointer text-left"
            >
              <img src={log.image} alt={log.caption || 'selfie'} className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[8px] font-bold p-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                {log.caption} {log.author ? `· ${log.author}` : ''}
              </div>
              {idx === 2 && hiddenCount > 0 ? (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white font-black">
                  <span className="text-lg">+{hiddenCount}</span>
                  <span className="text-[9px] uppercase">{t('details.viewAll')}</span>
                </div>
              ) : (
                <span className="absolute top-1 right-1 bg-white/90 border border-black rounded-full w-5 h-5 flex items-center justify-center text-[10px]">🔍</span>
              )}
            </button>
          ))}
        </div>
      )}
      {showAll && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAll(false)}>
          <div className="relative w-full max-w-3xl bg-white border-4 border-black rounded-2xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#cc0000] text-white px-4 py-3 border-b-4 border-black flex items-center justify-between shrink-0">
              <span className="text-sm font-black uppercase flex items-center gap-2"><Camera className="w-4 h-4" /> {t('details.logsTitle')} — {displaySelfies.length} {(() => { const v = t('details.photosCount'); return v === 'details.photosCount' ? 'รูป' : v; })()}</span>
              <button onClick={() => setShowAll(false)} className="w-7 h-7 bg-white text-black border-2 border-black rounded flex items-center justify-center hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {displaySelfies.map((log, idx) => (
                  <button key={log.id} type="button" onClick={() => { setShowAll(false); setActiveIdx(idx); }} className="border-2 border-black rounded overflow-hidden hover:scale-[1.02] transition-transform bg-gray-100 group text-left">
                    <img src={log.image} alt={log.caption || 'selfie'} className="w-full h-40 object-cover" />
                    <div className="p-1.5 bg-white border-t-2 border-black">
                      <p className="text-[10px] font-black truncate">{log.caption || t('details.logsTitle')}</p>
                      <p className="text-[9px] text-gray-500 font-bold truncate">{log.author || ''} {log.date ? `· ${log.date}` : ''}</p>
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
            className="w-full max-w-5xl bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden relative flex flex-col"
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={handleDoubleClick}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b-2 border-black bg-white shrink-0">
              <span className="text-xs font-black uppercase truncate mr-4">{activeLog.caption || t('details.logsTitle')} {activeIdx + 1}/{displaySelfies.length}</span>
              <div className="flex items-center gap-1 shrink-0">
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
                <button type="button" onClick={() => { setActiveIdx(null); resetZoom(); }} className="w-7 h-7 flex items-center justify-center rounded-lg border-2 border-black hover:bg-gray-100 ml-1">
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
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 border-2 border-black rounded-full flex items-center justify-center hover:bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-10"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveIdx((p) => (p < displaySelfies.length - 1 ? p + 1 : 0)); resetZoom(); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 border-2 border-black rounded-full flex items-center justify-center hover:bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-10"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            <div className="px-4 py-3 border-t-2 border-black bg-white flex items-center justify-between shrink-0">
              <span className="text-[10px] text-slate-500 font-sans">ดับเบิ้ลคลิกเพื่อซูม / ล้อเมาส์เพื่อซูม / ลากเพื่อเลื่อน</span>
              {(activeLog.author || activeLog.date) && (
                <div className="text-[11px] font-bold flex items-center gap-2">
                  <span>{activeLog.author || ''}</span>
                  <span className="text-gray-500">{activeLog.date || ''}</span>
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
