import { useLayoutEffect, useRef, useState } from 'react';
import { X, Heart, Trash2, Camera, Clock3, Ticket, Sun, MapPin, AlertTriangle, Clapperboard, Images } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import ReportLocationModal from '../report/ReportLocationModal';
import { toEmbedUrl } from '../../lib/imageUtils';

const POPUP_WIDTH = 320;
const VIEWPORT_MARGIN = 16;
const ANCHOR_OFFSET = 14;

export default function LocationPopupModal({ pin, onClose, anchorRef, zoomLevel = 1 }) {
  const { t, navigateTo, favorites, toggleFavorite, deleteCustomPin, isLoggedIn, setAuthMode } = useApp();
  const [showReport, setShowReport] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [pos, setPos] = useState(() => ({ left: VIEWPORT_MARGIN, top: VIEWPORT_MARGIN, placeBelow: true }));
  const popupRef = useRef(null);

  // Position the popup in the viewport, anchored to the pin's on-screen spot
  // (pin % coords are inside the zoomed canvas) and clamped so it never
  // overflows past any edge of the screen.
  const pinLeft = pin ? pin.left : undefined;
  const pinTop = pin ? pin.top : undefined;
  useLayoutEffect(() => {
    const recompute = () => {
      if (!pin || !anchorRef?.current || !popupRef.current) return;
      const rect = anchorRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const px = ((parseFloat(pin.left) || 50) / 100) * rect.width - rect.width / 2;
      const py = ((parseFloat(pin.top) || 50) / 100) * rect.height - rect.height / 2;
      const anchorX = cx + px * zoomLevel;
      const anchorY = cy + py * zoomLevel;

      const vw = window.innerWidth || document.documentElement.clientWidth;
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const popupHeight = popupRef.current.offsetHeight;

      const left = Math.min(
        Math.max(VIEWPORT_MARGIN, anchorX - POPUP_WIDTH / 2),
        vw - POPUP_WIDTH - VIEWPORT_MARGIN
      );
      // Prefer below the pin; flip above when it would spill off the bottom.
      const belowBottom = anchorY + ANCHOR_OFFSET + popupHeight + VIEWPORT_MARGIN;
      const hasRoomBelow = belowBottom <= vh;
      const hasRoomAbove = anchorY - ANCHOR_OFFSET - popupHeight - VIEWPORT_MARGIN >= 0;
      const placeBelow = hasRoomBelow || !hasRoomAbove;
      const desiredTop = placeBelow
        ? anchorY + ANCHOR_OFFSET
        : anchorY - ANCHOR_OFFSET - popupHeight;
      const top = Math.min(Math.max(VIEWPORT_MARGIN, desiredTop), vh - popupHeight - VIEWPORT_MARGIN);

      setPos({ left, top, placeBelow });
    };

    recompute();
    window.addEventListener('resize', recompute);
    window.addEventListener('scroll', recompute, true);
    return () => {
      window.removeEventListener('resize', recompute);
      window.removeEventListener('scroll', recompute, true);
    };
  }, [anchorRef, zoomLevel, pin, pinLeft, pinTop]);

  // Show the element's REAL data — the media/description the creator actually
  // saved in locationDetails (element pins carry imageUrl/previewUrl/selfies),
  // not the local preset fallbacks.
  const mainPhoto = [pin?.previewUrl, pin?.imageUrl, pin?.selfieUrl]
    .find((src) => typeof src === 'string' && src) || null;

  const rawSelfies = (Array.isArray(pin?.selfieUrls) && pin.selfieUrls.length)
    ? pin.selfieUrls
    : (pin?.selfieUrl ? [pin.selfieUrl] : []);
  const selfies = rawSelfies.filter((src) => typeof src === 'string' && src);

  const rawVideo = pin?.videoUrl || pin?.youtubeUrl || '';
  const videoSrc = toEmbedUrl(rawVideo);
  const hasVideo = Boolean(videoSrc);
  const isFileVideo = typeof rawVideo === 'string' && rawVideo.startsWith('data:video/');

  if (!pin) return null;

  const isFav = favorites.includes(pin.title);

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

  const showMedia = Boolean(mainPhoto || selfies.length);
  const caretColor = 'border-white';

  return (
    <>
      <div
        ref={popupRef}
        style={{ left: pos.left, top: pos.top }}
        className="fixed w-80 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-[150] rounded-xl font-mono animate-in zoom-in-95 fade-in duration-150 max-h-[calc(100vh-2rem)] overflow-y-auto"
      >
        {/* Anchor caret pointing at the pin */}
        {pos.placeBelow ? (
          <div className={`absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 bg-white border-t-4 border-l-4 ${caretColor} rotate-45 border-black shadow-[-2px_-2px_0px_0px_rgba(0,0,0,1)]`} />
        ) : (
          <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-5 h-5 bg-white border-b-4 border-r-4 ${caretColor} rotate-45 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`} />
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

        {showMedia && (
          <div className="p-3 pb-0">
            {showVideo && hasVideo ? (
              <div className="relative rounded-lg border-2 border-black overflow-hidden bg-black">
                {isFileVideo ? (
                  <video src={videoSrc} controls className="w-full aspect-video object-contain bg-black" />
                ) : (
                  <iframe
                    src={videoSrc}
                    title={pin.title}
                    className="w-full aspect-video bg-black"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                )}
              </div>
            ) : mainPhoto ? (
              <div className="relative rounded-lg border-2 border-black overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-slate-900">
                <img
                  src={mainPhoto}
                  alt={pin.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-36 object-cover"
                />
                {hasVideo && (
                  <button
                    type="button"
                    onClick={() => setShowVideo(true)}
                    className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-white text-black text-[10px] font-black px-2.5 py-1 rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:bg-gray-100"
                  >
                    <Clapperboard className="w-3 h-3" /> {t('details.mediaVideo')}
                  </button>
                )}
                {pin.isUserUploaded && (
                  <div className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[9px] px-2 py-0.5 rounded border border-white/40 flex items-center gap-1 font-sans">
                    <Camera className="w-3 h-3" /> {t('map.travelerUpload')}
                  </div>
                )}
              </div>
            ) : null}
            {showVideo && hasVideo && (
              <button
                type="button"
                onClick={() => setShowVideo(false)}
                className="mt-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase text-blue-700 underline underline-offset-2 cursor-pointer"
              >
                <Images className="w-3 h-3" /> {t('details.mediaPhotos')}
              </button>
            )}
            {selfies.length > 0 && !showVideo && (
              <div className="flex gap-1.5 mt-1.5 overflow-x-auto pb-1">
                {selfies.map((src, idx) => (
                  <img
                    key={idx}
                    src={src}
                    alt={`${pin.title} ${idx + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="w-12 h-12 border-2 border-black rounded object-cover shrink-0"
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="p-3">
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
              onClick={() => toggleFavorite(pin.title)}
              className={`flex-1 text-[10px] font-black px-2.5 py-1.5 border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase flex items-center justify-center gap-1 transition-all cursor-pointer ${isFav ? 'bg-red-600 text-white' : 'bg-amber-500 text-white hover:bg-amber-600'}`}
            >
              <Heart className={`w-3 h-3 ${isFav ? 'fill-white' : ''}`} /> {isFav ? t('map.fav') : t('map.unfav')}
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

        <ReportLocationModal
          key={showReport ? 'open' : 'closed'}
          isOpen={showReport}
          onClose={() => setShowReport(false)}
          locationName={pin.title}
          mapId={pin.id || null}
        />
      </div>
    </>
  );
}