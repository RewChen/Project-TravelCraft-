import { useLayoutEffect, useEffect, useRef, useState } from 'react';
import { X, Trash2, AlertTriangle, Images, Clapperboard, ChevronDown, ChevronUp, ThumbsUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { toEmbedUrl } from '../../lib/imageUtils';
import ReportLocationModal from '../report/ReportLocationModal';

const POPUP_WIDTH = 360;
const POPUP_MAX_HEIGHT = 560;
const VIEWPORT_MARGIN = 16;
const PIN_GAP = 14;

export default function LocationPopupModal({ pin, onClose, anchorRef, zoomLevel = 1, pan = { x: 0, y: 0 } }) {
  const { t, navigateTo, deleteCustomPin, isLoggedIn, setAuthMode, locationLikes, loadLocationLikes, toggleLocationLike, activeCommunityMap } = useApp();
  const [showReport, setShowReport] = useState(false);
  const [pos, setPos] = useState(() => ({ left: VIEWPORT_MARGIN, top: VIEWPORT_MARGIN, placeRight: true, placeBelow: false, caretTop: 0 }));
  const [canScroll, setCanScroll] = useState(false);
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const popupRef = useRef(null);
  const scrollBodyRef = useRef(null);

  // Position the popup beside the pin, fully clear of the element it describes:
  // the on-screen anchor accounts for the canvas scale(zoom) translate(pan)
  // transform, the gap starts at the element's half-size (not the marker), and
  // when neither side fits the popup stacks below/above instead of covering it.
  const pinLeft = pin ? pin.left : undefined;
  const pinTop = pin ? pin.top : undefined;
  const pinWidthPct = pin ? pin.widthPct : undefined;
  const pinHeightPct = pin ? pin.heightPct : undefined;
  const panX = pan ? pan.x : 0;
  const panY = pan ? pan.y : 0;
  useLayoutEffect(() => {
    const recompute = () => {
      if (!pin || !anchorRef?.current || !popupRef.current) return;
      const rect = anchorRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const px = ((parseFloat(pin.left) || 50) / 100) * rect.width - rect.width / 2;
      const py = ((parseFloat(pin.top) || 50) / 100) * rect.height - rect.height / 2;
      // Wrapper transform is scale(zoom) translate(pan) with origin at centre.
      const anchorX = cx + (px + panX) * zoomLevel;
      const anchorY = cy + (py + panY) * zoomLevel;

      const vw = window.innerWidth || document.documentElement.clientWidth;
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const popupHeight = popupRef.current.offsetHeight;

      // Half of the element's rendered size so the popup never sits on it.
      const halfW = Math.max(14, (((parseFloat(pin.widthPct) || 4) / 100) * rect.width * zoomLevel) / 2);
      const halfH = Math.max(14, (((parseFloat(pin.heightPct) || 4) / 100) * rect.height * zoomLevel) / 2);

      // Prefer the side with room, offset past the element's edge.
      const hasRoomRight = anchorX + halfW + PIN_GAP + POPUP_WIDTH + VIEWPORT_MARGIN <= vw;
      const hasRoomLeft = anchorX - halfW - PIN_GAP - POPUP_WIDTH - VIEWPORT_MARGIN >= 0;
      const placeRight = hasRoomRight || !hasRoomLeft;
      let left = placeRight
        ? anchorX + halfW + PIN_GAP
        : anchorX - halfW - PIN_GAP - POPUP_WIDTH;
      let placeBelow = false;

      // No horizontal room (element too wide / near the edge): stack the popup
      // below the element rather than letting the clamp pull it on top.
      if (left < VIEWPORT_MARGIN || left + POPUP_WIDTH > vw - VIEWPORT_MARGIN) {
        placeBelow = true;
        left = Math.min(Math.max(VIEWPORT_MARGIN, anchorX - POPUP_WIDTH / 2), vw - POPUP_WIDTH - VIEWPORT_MARGIN);
      }

      let top;
      if (placeBelow) {
        top = anchorY + halfH + PIN_GAP;
        const above = anchorY - halfH - PIN_GAP - popupHeight;
        if (top + popupHeight > vh - VIEWPORT_MARGIN && above >= VIEWPORT_MARGIN) {
          top = above;
        }
      } else {
        top = anchorY - popupHeight / 2;
      }
      top = Math.min(Math.max(VIEWPORT_MARGIN, top), Math.max(VIEWPORT_MARGIN, vh - popupHeight - VIEWPORT_MARGIN));

      // Caret tracks the pin even when the popup is clamped vertically.
      const caretTop = Math.min(Math.max(24, anchorY - top), popupHeight - 24);
      setPos({ left, top, placeRight, placeBelow, caretTop });
    };

    recompute();
    window.addEventListener('resize', recompute);
    window.addEventListener('scroll', recompute, true);
    return () => {
      window.removeEventListener('resize', recompute);
      window.removeEventListener('scroll', recompute, true);
    };
  }, [anchorRef, zoomLevel, pin, pinLeft, pinTop, pinWidthPct, pinHeightPct, panX, panY]);

  // Load the public like count + whether this user already liked the pin.
  const locationKey = pin ? (pin.id || pin.title) : null;
  useEffect(() => {
    if (locationKey) loadLocationLikes(locationKey);
  }, [locationKey, loadLocationLikes]);

  // การ์ดโชว์แค่รูป+วิดีโอ ส่วน description/รายละเอียดอยู่ถัดไปใต้สุด
  // ผู้ใช้ต้องเลื่อนลงไปอ่านเอง ปุ่มลูกศรจึงโผล่เมื่อเนื้อหายาวเกินกรอบ
  const syncScrollState = () => {
    const el = scrollBodyRef.current;
    if (!el) return;
    const overflow = el.scrollHeight - el.clientHeight;
    setCanScroll(overflow > 8);
    setScrolledToEnd(overflow <= 8 || el.scrollTop >= overflow - 8);
  };

  useEffect(() => {
    const el = scrollBodyRef.current;
    if (!el) return undefined;
    const onScroll = () => syncScrollState();
    el.addEventListener('scroll', onScroll, { passive: true });
    // รูป/วิดีโอโหลดเสร็จแล้วความสูงเปลี่ยน ต้องคำนวณปุ่มเลื่อนใหม่
    let observer = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => syncScrollState());
      observer.observe(el);
      for (const child of el.children) observer.observe(child);
    }
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (observer) observer.disconnect();
    };
  }, [locationKey]);

  // เปลี่ยนหมุดแล้วเริ่มอ่านจากบนสุดเสมอ
  useEffect(() => {
    if (scrollBodyRef.current) scrollBodyRef.current.scrollTop = 0;
  }, [locationKey]);

  const handleScrollToggle = () => {
    const el = scrollBodyRef.current;
    if (!el) return;
    el.scrollTo({ top: scrolledToEnd ? 0 : el.scrollHeight, behavior: 'smooth' });
  };

  if (!pin) return null;

  const isEditorLocation = pin.popupMediaOnly === true
    || pin.type === 'Custom Location'
    || (activeCommunityMap?.isEditorMap === true && String(pin.id || '').startsWith('editor-'))
    || String(activeCommunityMap?.id || '').startsWith('comm-user-draft-');

  // สื่อของจุดหมุด — กรอกใน MapEditor แล้วแสดงที่ popup นี้ (เฉพาะ element)
  // การ์ดนี้โชว์แค่ Main photo กับวิดีโอ รูปที่อัปโหลดเพิ่มไปดูที่หน้า VIEW DETAILS
  const videoList = [...new Set(
    (Array.isArray(pin.videoUrls) && pin.videoUrls.length ? pin.videoUrls : [pin.videoUrl]).filter(Boolean)
  )];
  // Main photo = ฟิลด์ "Main photo (used as cover)" ในฟอร์มแก้ไขหมุด
  // (locationDetails.image) ไม่ใช่รายการรูปที่อัปโหลดเพิ่ม
  const mainPhoto = pin.imageUrl || pin.previewUrl || null;
  const currentVideoUrl = videoList[0] || '';
  const videoSrc = toEmbedUrl(currentVideoUrl);
  const isFileVideo = Boolean(currentVideoUrl) && (currentVideoUrl.startsWith('data:video/') || !videoSrc.includes('/embed/'));
  const hasPhotos = Boolean(mainPhoto);
  const hasVideos = videoList.length > 0;

  const likeInfo = locationLikes[locationKey] || { count: 0, liked: false };

  // popup ไม่แสดงกริดรายละเอียด (ค่าเข้าชม / การเดินทาง / เวลา) อีกแล้ว
  // เหลือแค่สื่อ + คำอธิบาย ส่วนรายละเอียดทั้งหมดอยู่ในหน้า VIEW DETAILS

  const handleDelete = () => {
    deleteCustomPin(pin.id);
    onClose();
  };

  const handleLike = () => {
    if (!isLoggedIn) {
      setAuthMode('login');
      navigateTo('auth');
      return;
    }
    toggleLocationLike(locationKey);
  };

  // ส่งข้อมูลชุดเต็มเข้าหน้า Details: pin ของจุดนี้ + ข้อมูลระดับแผนที่
  // (region/tags/rarity/popularity/visitors/logs รายละเอียดต่าง ๆ ที่ pin ไม่มี)
  const buildDetailsPayload = () => {
    const mapItem = activeCommunityMap;
    const nested = mapItem?.details && typeof mapItem.details === 'object' ? mapItem.details : null;
    const base = mapItem ? (nested ? { ...mapItem, ...nested } : { ...mapItem }) : {};
    const pick = (...values) => values.find((value) => value !== undefined && value !== null && value !== '') ?? null;
    // Editor element pins represent individual locations. Their Details page
    // must not inherit the parent map's logbook photos as location photos.
    const logs = isEditorLocation
      ? (Array.isArray(pin.logs) ? pin.logs : [])
      : ((Array.isArray(pin.logs) && pin.logs.length)
        ? pin.logs
        : (Array.isArray(mapItem?.logs) && mapItem.logs.length
          ? mapItem.logs
          : (Array.isArray(nested?.logs) ? nested.logs : [])));
    return {
      ...base,
      ...pin,
      // pin ที่ไม่มีค่า (null) ไม่ควรกลบข้อมูลระดับแผนที่ — เติมจาก map แทน
      // element ของ editor: ใช้ "Main photo" ของ element เอง (pin.imageUrl) เท่านั้น
      // ห้าม fallback ไปปกของแผนที่ ไม่งั้นหน้า Details จะไม่มีรูปให้ดู
      imageUrl: isEditorLocation
        ? (pin.imageUrl || null)
        : pick(pin.imageUrl, nested?.imageUrl, mapItem?.imageUrl),
      // A map's terrain/background is not a cover photo for each location pin.
      bgThemeUrl: isEditorLocation ? null : base.bgThemeUrl,
      editorState: isEditorLocation ? undefined : base.editorState,
      region: pick(pin.region, nested?.region, mapItem?.region, mapItem?.locationCity),
      tags: (Array.isArray(pin.tags) && pin.tags.length) ? pin.tags : (Array.isArray(base.tags) ? base.tags : []),
      rarity: pick(pin.rarity, nested?.rarity, mapItem?.rarity),
      popularity: pick(pin.popularity, nested?.popularity),
      visitors: pick(pin.visitors, nested?.visitors),
      hours: pick(pin.hours, nested?.hours),
      fee: pick(pin.fee, nested?.fee),
      bestTime: pick(pin.bestTime, nested?.bestTime),
      travel: pick(pin.travel, nested?.travel),
      lore: pick(pin.lore, nested?.lore, mapItem?.lore, mapItem?.description),
      type: pick(pin.type, nested?.type),
      tag: pick(pin.tag, nested?.tag),
      logs,
      // merge ที่นี่ครบแล้ว — กัน navigateTo นำ details มากองทับค่าของ pin
      details: undefined,
      // pin ของ element มาจาก editor มีธง popupMediaOnly (กันสื่อซ้ำในหน้า
      // Details เดิม) — ปลดธงนี้ เพราะผู้ใช้กด VIEW DETAILS แล้วต้องเห็น
      // รูป + วิดีโอของ element นั้นในหน้า Details ด้วย
      popupMediaOnly: false
    };
  };

  return (
    <>
      <div
        ref={popupRef}
        style={{
          left: pos.left,
          top: pos.top,
          width: POPUP_WIDTH,
          maxWidth: `calc(100vw - ${VIEWPORT_MARGIN * 2}px)`,
          maxHeight: `min(${POPUP_MAX_HEIGHT}px, calc(100vh - ${VIEWPORT_MARGIN * 2}px))`
        }}
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        className="fixed bg-white dark:bg-slate-800 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-[150] rounded-xl font-mono animate-in zoom-in-95 fade-in duration-150 flex flex-col"
      >
        {/* Anchor caret pointing at the pin */}
        {pos.placeBelow ? (
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 bg-white dark:bg-slate-800 border-t-4 border-l-4 border-black rotate-45" />
        ) : pos.placeRight ? (
          <div style={{ top: pos.caretTop }} className="absolute -left-3 -translate-y-1/2 w-5 h-5 bg-white dark:bg-slate-800 border-t-4 border-l-4 border-black rotate-45" />
        ) : (
          <div style={{ top: pos.caretTop }} className="absolute -right-3 -translate-y-1/2 w-5 h-5 bg-white dark:bg-slate-800 border-b-4 border-r-4 border-black rotate-45" />
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-2 bg-[#cc0000] text-white p-3 border-b-4 border-black rounded-t-lg">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 bg-white/90 dark:bg-slate-800/90 border-2 border-black rounded-lg flex items-center justify-center text-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
              {pin.icon || '📍'}
            </div>
            <div className="min-w-0">
              <h4 className="font-black text-xs uppercase tracking-wider leading-tight break-words">{pin.title}</h4>
              <span className="inline-block text-[9px] bg-amber-400 text-black border border-black px-1.5 py-0.5 rounded font-extrabold uppercase mt-0.5">
                {pin.tag || pin.type}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 bg-white/20 dark:bg-slate-800/20 hover:bg-white/40 dark:bg-slate-800/40 border-2 border-white text-white rounded-md flex items-center justify-center text-xs font-bold cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scrollable body keeps the side caret on the outer box unclipped.
            The height is capped at exactly the media block (main photo + video)
            so the description and detail fields sit below the fold — the user
            scrolls (or taps the arrow) to read them. */}
        <div ref={scrollBodyRef} className="flex-1 min-h-0 max-h-[400px] overflow-y-auto">
        <div className="p-3">
          {(hasPhotos || hasVideos) && (
            <div className="mb-3 space-y-2">
              {hasPhotos && (
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Images className="w-3 h-3 text-red-600" />
                    <span className="text-[9px] font-black uppercase text-red-600">{t('details.mainImage')}</span>
                  </div>
                  <div className="border-2 border-black rounded-lg overflow-hidden bg-gray-100">
                    <img src={mainPhoto} alt={pin.title} className="w-full h-32 object-cover" />
                  </div>
                </div>
              )}

              {hasVideos && (
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Clapperboard className="w-3 h-3 text-red-600" />
                    <span className="text-[9px] font-black uppercase text-red-600">{t('details.mediaVideo')}</span>
                  </div>
                  {isFileVideo ? (
                    <video src={videoSrc} controls playsInline className="w-full aspect-video bg-black rounded-lg border-2 border-black" />
                  ) : (
                    <iframe
                      src={videoSrc}
                      title={pin.title}
                      className="w-full aspect-video rounded-lg border-2 border-black"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {pin.lore ? (
            <p className="text-[11px] text-gray-700 font-sans leading-relaxed mb-3 border border-black p-2 bg-gray-50 rounded break-words">
              {pin.lore}
            </p>
          ) : null}
        </div>
        </div>

        {/* ปุ่มเลื่อนดู description/รายละเอียดด้านล่าง */}
        {canScroll && (
          <button
            type="button"
            onClick={handleScrollToggle}
            title={scrolledToEnd ? t('details.prevMedia') : t('details.nextMedia')}
            aria-label={scrolledToEnd ? t('details.prevMedia') : t('details.nextMedia')}
            className="absolute bottom-[76px] left-1/2 -translate-x-1/2 z-10 w-8 h-8 rounded-full bg-black/80 hover:bg-black text-white border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
          >
            {scrolledToEnd ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 px-3 pb-3 pt-2 border-t-2 border-black">
          <div className="flex gap-1.5">
            <button
              onClick={handleLike}
              className={`flex-1 text-[10px] font-black px-2.5 py-1.5 border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase flex items-center justify-center gap-1 transition-all cursor-pointer ${likeInfo.liked ? 'bg-red-600 text-white' : 'bg-amber-500 text-white hover:bg-amber-600'}`}
            >
              <ThumbsUp className={`w-3 h-3 ${likeInfo.liked ? 'fill-white' : ''}`} /> {likeInfo.liked ? t('map.unlike') : t('map.like')}
              {likeInfo.count > 0 && (
                <span className={`ml-0.5 px-1 rounded border border-black text-[9px] ${likeInfo.liked ? 'bg-white text-red-600' : 'bg-white text-black'}`}>
                  {likeInfo.count}
                </span>
              )}
            </button>
            <button
              onClick={() => navigateTo('details', buildDetailsPayload())}
              className="flex-1 bg-[#cc0000] hover:bg-red-700 text-white text-[10px] font-black px-2.5 py-1.5 border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              {t('common.details')} →
            </button>
          </div>
          <div className="flex items-center gap-2">
            {pin.isUserUploaded ? (
              <button
                onClick={handleDelete}
                className="text-[10px] font-black uppercase text-red-600 hover:text-red-800 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" /> {t('common.delete')}
              </button>
            ) : null}
            <button
              onClick={() => {
                if (!isLoggedIn) {
                  setAuthMode('login');
                  navigateTo('auth');
                  return;
                }
                setShowReport(true);
              }}
              className="text-[10px] font-black uppercase text-amber-700 hover:text-amber-900 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
            >
              <AlertTriangle className="w-3 h-3" /> {t('map.reportLocationTitle')}
            </button>
          </div>
        </div>

      </div>

      <ReportLocationModal
        key={showReport ? 'open' : 'closed'}
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        locationName={pin.title}
        mapId={pin.id || null}
      />
    </>
  );
}
