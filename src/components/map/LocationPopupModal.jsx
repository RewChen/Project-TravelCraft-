import { useLayoutEffect, useEffect, useRef, useState } from 'react';
import { X, Trash2, Clock3, Ticket, Sun, MapPin, AlertTriangle, Images, Clapperboard, ChevronLeft, ChevronRight, ThumbsUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { toEmbedUrl } from '../../lib/imageUtils';
import ReportLocationModal from '../report/ReportLocationModal';

const POPUP_WIDTH = 320;
const VIEWPORT_MARGIN = 16;
const PIN_GAP = 14;

export default function LocationPopupModal({ pin, onClose, anchorRef, zoomLevel = 1, pan = { x: 0, y: 0 } }) {
  const { t, navigateTo, deleteCustomPin, isLoggedIn, setAuthMode, locationLikes, loadLocationLikes, toggleLocationLike } = useApp();
  const [showReport, setShowReport] = useState(false);
  const [pos, setPos] = useState(() => ({ left: VIEWPORT_MARGIN, top: VIEWPORT_MARGIN, placeRight: true, placeBelow: false, caretTop: 0 }));
  const [photoIdx, setPhotoIdx] = useState(0);
  const [videoIdx, setVideoIdx] = useState(0);
  const popupRef = useRef(null);

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

  if (!pin) return null;

  // สื่อของจุดหมุด — กรอกใน MapEditor แล้วแสดงที่ popup นี้ (เฉพาะ element)
  const photoList = [...new Set(
    (Array.isArray(pin.imageUrls) && pin.imageUrls.length ? pin.imageUrls : [pin.imageUrl]).filter(Boolean)
  )];
  const videoList = [...new Set(
    (Array.isArray(pin.videoUrls) && pin.videoUrls.length ? pin.videoUrls : [pin.videoUrl]).filter(Boolean)
  )];
  const activePhotoIdx = photoList.length ? Math.min(photoIdx, photoList.length - 1) : 0;
  const activeVideoIdx = videoList.length ? Math.min(videoIdx, videoList.length - 1) : 0;
  const currentVideoUrl = videoList[activeVideoIdx] || '';
  const videoSrc = toEmbedUrl(currentVideoUrl);
  const isFileVideo = Boolean(currentVideoUrl) && (currentVideoUrl.startsWith('data:video/') || !videoSrc.includes('/embed/'));
  const hasPhotos = photoList.length > 0;
  const hasVideos = videoList.length > 0;

  const likeInfo = locationLikes[locationKey] || { count: 0, liked: false };

  const pinHours = pin.hours || (pin.openTime && pin.closeTime ? `${pin.openTime} - ${pin.closeTime}` : null);

  const detailFields = [
    { icon: Clock3, label: t('details.hours'), value: pinHours },
    { icon: Ticket, label: t('details.fee'), value: pin.fee },
    { icon: Sun, label: t('details.bestTime'), value: pin.bestTime },
    { icon: MapPin, label: t('details.travel'), value: pin.travel },
  ].filter((field) => field.value);

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

  return (
    <>
      <div
        ref={popupRef}
        style={{ left: pos.left, top: pos.top }}
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        className="fixed w-80 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-[150] rounded-xl font-mono animate-in zoom-in-95 fade-in duration-150 max-h-[calc(100vh-2rem)] flex flex-col"
      >
        {/* Anchor caret pointing at the pin */}
        {pos.placeBelow ? (
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 bg-white border-t-4 border-l-4 border-black rotate-45" />
        ) : pos.placeRight ? (
          <div style={{ top: pos.caretTop }} className="absolute -left-3 -translate-y-1/2 w-5 h-5 bg-white border-t-4 border-l-4 border-black rotate-45" />
        ) : (
          <div style={{ top: pos.caretTop }} className="absolute -right-3 -translate-y-1/2 w-5 h-5 bg-white border-b-4 border-r-4 border-black rotate-45" />
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-2 bg-[#cc0000] text-white p-3 border-b-4 border-black rounded-t-lg">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 bg-white/90 border-2 border-black rounded-lg flex items-center justify-center text-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
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
            className="w-6 h-6 bg-white/20 hover:bg-white/40 border-2 border-white text-white rounded-md flex items-center justify-center text-xs font-bold cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scrollable body keeps the side caret on the outer box unclipped */}
        <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-3">
          {(hasPhotos || hasVideos) && (
            <div className="mb-3 space-y-2">
              {hasPhotos && (
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Images className="w-3 h-3 text-red-600" />
                    <span className="text-[9px] font-black uppercase text-red-600">{t('details.mediaPhotos')} ({photoList.length})</span>
                  </div>
                  <div className="relative border-2 border-black rounded-lg overflow-hidden bg-gray-100">
                    <img src={photoList[activePhotoIdx]} alt={pin.title} className="w-full aspect-video object-cover" />
                    {photoList.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setPhotoIdx((idx) => (idx - 1 + photoList.length) % photoList.length)}
                          title={t('details.prevMedia')}
                          className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPhotoIdx((idx) => (idx + 1) % photoList.length)}
                          title={t('details.nextMedia')}
                          className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                        <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">{activePhotoIdx + 1}/{photoList.length}</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {hasVideos && (
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Clapperboard className="w-3 h-3 text-red-600" />
                    <span className="text-[9px] font-black uppercase text-red-600">{t('details.mediaVideo')} ({videoList.length})</span>
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
                  {videoList.length > 1 && (
                    <div className="flex items-center justify-between gap-2 mt-1.5">
                      <button
                        type="button"
                        onClick={() => setVideoIdx((idx) => (idx - 1 + videoList.length) % videoList.length)}
                        className="flex items-center gap-1 text-[9px] font-black uppercase border-2 border-black rounded px-2 py-1 bg-white hover:bg-gray-100 cursor-pointer"
                      >
                        <ChevronLeft className="w-3 h-3" /> {t('details.prevMedia')}
                      </button>
                      <span className="text-[9px] font-black">{activeVideoIdx + 1}/{videoList.length}</span>
                      <button
                        type="button"
                        onClick={() => setVideoIdx((idx) => (idx + 1) % videoList.length)}
                        className="flex items-center gap-1 text-[9px] font-black uppercase border-2 border-black rounded px-2 py-1 bg-white hover:bg-gray-100 cursor-pointer"
                      >
                        {t('details.nextMedia')} <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
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

          {detailFields.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              {detailFields.map((field) => (
                <div key={field.label} className="border-2 border-black rounded-lg p-2 bg-white min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <field.icon className="w-3 h-3 text-red-600 shrink-0" />
                    <span className="text-[9px] font-black uppercase text-red-600 truncate">{field.label}</span>
                  </div>
                  <div className="text-[11px] font-black leading-snug break-words">{field.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>

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
              onClick={() => navigateTo('details', pin)}
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