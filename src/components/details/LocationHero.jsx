import { MapPin, ImageIcon, Images, Clapperboard, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { rarityColorForTier, rarityLabelKey } from '../../lib/mapViews';
import { resolveCoverImage, coverFallbackFor, toEmbedUrl } from '../../lib/imageUtils';

export default function LocationHero() {
  const { selectedLocation, t, effectiveRarityFor } = useApp();
  const tier = effectiveRarityFor(selectedLocation);
  // Only show the country/region badge when there is a real user-set region.
  // Older maps may carry placeholder values (never store/display those).
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
  const fallbackImage = coverFallbackFor(selectedLocation.title);
  const coverImage = resolveCoverImage(selectedLocation);
  const [coverFailed, setCoverFailed] = useState(false);
  const [coverPreviewOpen, setCoverPreviewOpen] = useState(false);
  const [mediaTab, setMediaTab] = useState('photo'); // photo | video
  const displayCover = coverFailed ? fallbackImage : coverImage;
  const videoSrc = useMemo(() => toEmbedUrl(selectedLocation?.videoUrl), [selectedLocation]);
  const hasVideo = Boolean(videoSrc);
  const isFileVideo = typeof selectedLocation?.videoUrl === 'string' && selectedLocation.videoUrl.startsWith('data:video/');
  const showVideo = hasVideo && mediaTab === 'video';

  return (
    <div className="bg-white border-4 border-black rounded-2xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      <div className="h-64 bg-slate-900 relative overflow-hidden">
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
        ) : (
          <button type="button" onClick={() => setCoverPreviewOpen(true)} title="ดูรูปปกขนาดใหญ่" className="absolute inset-0 w-full h-full cursor-zoom-in">
            <img src={displayCover} alt={selectedLocation.title} onError={() => setCoverFailed(true)} className="absolute inset-0 w-full h-full object-cover" />
          </button>
        )}
        {!showVideo && <div className="absolute inset-0 bg-black/25 pointer-events-none" />}
        {displayRegion && (
          <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-indigo-500/80 backdrop-blur text-white px-3 py-1 rounded-full text-[10px] font-bold border border-white/20 w-fit">
            <MapPin className="w-3 h-3" /> {displayRegion}
          </div>
        )}
        {/* ปุ่มสลับ ภาพถ่าย / วิดีโอทัวร์ */}
        {hasVideo && (
          <div className="absolute top-4 right-4 flex gap-1.5">
            <button
              type="button"
              onClick={() => setMediaTab('photo')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border-2 text-[10px] font-black uppercase cursor-pointer ${!showVideo ? 'bg-white text-black border-black' : 'bg-black/60 text-white border-white/40 hover:bg-black/80'}`}
            >
              <Images className="w-3.5 h-3.5" /> {t('details.mediaPhotos')}
            </button>
            <button
              type="button"
              onClick={() => setMediaTab('video')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border-2 text-[10px] font-black uppercase cursor-pointer ${showVideo ? 'bg-white text-black border-black' : 'bg-black/60 text-white border-white/40 hover:bg-black/80'}`}
            >
              <Clapperboard className="w-3.5 h-3.5" /> {t('details.mediaVideo')}
            </button>
          </div>
        )}
        {!showVideo && <ImageIcon className="absolute bottom-4 right-4 w-8 h-8 text-white/70 pointer-events-none" />}
      </div>
      
      <div className="bg-[#cc0000] text-white p-5 border-t-4 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight drop-shadow-md">
          {selectedLocation.title}
        </h1>
        <div className="flex flex-wrap gap-2">
          <span className={`border-2 border-black px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${rarityColorForTier(tier)}`}>
            ◆ {t(rarityLabelKey(tier))}
          </span>
          <span className="bg-amber-400 text-black border-2 border-black px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            ★ {selectedLocation.type || 'Landmark'}
          </span>
          <span className="bg-white text-black border-2 border-black px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            📷 {selectedLocation.tag || 'Scenic'}
          </span>
        </div>
      </div>
      {/* วิดีโออยู่ในปกนี้แล้ว (แท็บวิดีโอทัวร์) ไม่ต้องแยก section */}
      {coverPreviewOpen && (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setCoverPreviewOpen(false)}>
          <div className="w-full max-w-3xl bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b-2 border-black">
              <h3 className="font-black text-sm uppercase truncate">{selectedLocation.title}</h3>
              <button type="button" onClick={() => setCoverPreviewOpen(false)} title={t('editor.close')} className="w-7 h-7 flex items-center justify-center rounded-lg border-2 border-black hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <img src={displayCover} alt={selectedLocation.title} onError={() => setCoverFailed(true)} className="w-full max-h-[70vh] object-contain bg-gray-100" />
          </div>
        </div>
      )}
    </div>
  );
}
